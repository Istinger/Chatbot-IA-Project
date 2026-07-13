"""Microservicio de matching (FastAPI).

Responsable de TODO lo vectorial:
  - generar embeddings locales (fastembed / ONNX, coste $0)
  - guardarlos en pgvector
  - buscar ofertas afines por similitud de coseno

Node nunca toca vectores: solo llama a este servicio por HTTP.
"""

import io
import os

import psycopg
from fastapi import FastAPI, HTTPException, Request
from pydantic import BaseModel, Field
from pypdf import PdfReader

import embeddings as emb

app = FastAPI(title="matching-service")

DATABASE_URL = os.environ["DATABASE_URL"]


def db():
    return psycopg.connect(DATABASE_URL, connect_timeout=5)


# --------------------------------------------------------------------------- #
# Modelos de entrada
# --------------------------------------------------------------------------- #
class EmbedIn(BaseModel):
    texts: list[str]


class MatchIn(BaseModel):
    profile_id: str | None = None
    text: str | None = None
    limit: int = Field(default=10, ge=1, le=100)


# --------------------------------------------------------------------------- #
# Health
# --------------------------------------------------------------------------- #
@app.get("/health")
def health() -> dict:
    try:
        with db() as conn:
            row = conn.execute(
                "SELECT 1 FROM pg_extension WHERE extname = 'vector'"
            ).fetchone()
        postgres = "up"
        pgvector = "up" if row else "down: extension no instalada"
    except Exception as exc:  # noqa: BLE001 - el health reporta, no se cae
        postgres = f"down: {exc}"
        pgvector = "desconocido"

    return {
        "service": "matching",
        "postgres": postgres,
        "pgvector": pgvector,
        "model": emb.MODEL_NAME,
        "dim": emb.DIM,
    }


# --------------------------------------------------------------------------- #
# Embeddings
# --------------------------------------------------------------------------- #
@app.post("/embed")
def embed(body: EmbedIn) -> dict:
    """Vectoriza texto suelto. Util para depurar y para la busqueda libre."""
    if not body.texts:
        raise HTTPException(400, "texts vacio")
    return {"dim": emb.DIM, "vectors": emb.embed(body.texts)}


@app.post("/embed/jobs")
def embed_jobs() -> dict:
    """Vectoriza las ofertas que aun no tienen embedding.

    Idempotente: solo toca las filas con embedding IS NULL, asi que se puede
    llamar tras cada ingesta sin recalcular lo ya hecho.
    """
    with db() as conn:
        rows = conn.execute(
            'SELECT id, title, company, description, skills FROM "Job" '
            "WHERE embedding IS NULL"
        ).fetchall()

        if not rows:
            return {"updated": 0, "pending": 0}

        texts = [emb.job_text(r[1], r[2], r[3], r[4]) for r in rows]
        vectors = emb.embed(texts)

        with conn.cursor() as cur:
            for (job_id, *_), vector in zip(rows, vectors):
                cur.execute(
                    'UPDATE "Job" SET embedding = %s::vector WHERE id = %s',
                    (emb.to_pgvector(vector), job_id),
                )
        conn.commit()

    return {"updated": len(rows), "pending": 0}


@app.post("/embed/profile/{profile_id}")
def embed_profile(profile_id: str) -> dict:
    """(Re)vectoriza un perfil. Se llama solo cuando el usuario cambia su CV o
    sus skills: no en cada busqueda."""
    with db() as conn:
        row = conn.execute(
            'SELECT "cvText", skills FROM "Profile" WHERE id = %s', (profile_id,)
        ).fetchone()

        if not row:
            raise HTTPException(404, "Perfil no encontrado")

        text = emb.profile_text(row[0], row[1])
        if not text:
            raise HTTPException(400, "El perfil no tiene CV ni skills")

        vector = emb.embed_one(text)
        conn.execute(
            'UPDATE "Profile" SET embedding = %s::vector WHERE id = %s',
            (emb.to_pgvector(vector), profile_id),
        )
        conn.commit()

    return {"profile_id": profile_id, "dim": emb.DIM}


# --------------------------------------------------------------------------- #
# Extraccion de texto de PDFs (CV)
# --------------------------------------------------------------------------- #
@app.post("/extract-text")
async def extract_text(request: Request) -> dict:
    """Recibe los bytes crudos de un PDF y devuelve su texto.

    Vive aqui y no en Node porque pdf-parse (la libreria obvia de Node) esta
    abandonada y falla de forma intermitente sobre PDFs validos.
    """
    data = await request.body()
    if not data:
        raise HTTPException(400, "Cuerpo vacio: se esperaban los bytes del PDF")

    try:
        lector = PdfReader(io.BytesIO(data))
        texto = "\n".join(pagina.extract_text() or "" for pagina in lector.pages)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(400, f"No se pudo leer el PDF: {exc}") from exc

    texto = " ".join(texto.split())

    return {"text": texto, "chars": len(texto), "pages": len(lector.pages)}


# --------------------------------------------------------------------------- #
# Matching (el corazon: cosine en SQL, gratis, sin LLM)
# --------------------------------------------------------------------------- #
SELECT_JOBS = """
    SELECT id, "externalId", title, company, location, country,
           "salaryMin", "salaryMax", currency, "salaryUsdMin", "salaryUsdMax",
           "salaryPredicted", url, skills, "isForeign",
           1 - (embedding <=> %(v)s::vector) AS score
    FROM "Job"
    WHERE embedding IS NOT NULL
    ORDER BY embedding <=> %(v)s::vector
    LIMIT %(limit)s
"""


@app.post("/match")
def match(body: MatchIn) -> dict:
    """Devuelve las ofertas mas afines, ordenadas por similitud de coseno.

    El vector de consulta sale del perfil (profile_id) o de texto libre (text),
    p. ej. "remoto junior backend sin ingles".

    El operador `<=>` es distancia coseno: menor distancia = mas parecido.
    Esta consulta NO llama a ningun LLM. Es SQL puro: coste $0.
    """
    if body.profile_id:
        with db() as conn:
            row = conn.execute(
                'SELECT embedding FROM "Profile" WHERE id = %s', (body.profile_id,)
            ).fetchone()
        if not row:
            raise HTTPException(404, "Perfil no encontrado")
        if row[0] is None:
            raise HTTPException(409, "El perfil aun no tiene embedding")
        vector_literal = row[0]  # pgvector ya lo devuelve como literal
    elif body.text:
        vector_literal = emb.to_pgvector(emb.embed_one(body.text))
    else:
        raise HTTPException(400, "Indica profile_id o text")

    with db() as conn:
        rows = conn.execute(
            SELECT_JOBS, {"v": vector_literal, "limit": body.limit}
        ).fetchall()

    results = [
        {
            "id": r[0],
            "externalId": r[1],
            "title": r[2],
            "company": r[3],
            "location": r[4],
            "country": r[5],
            # Salario publicado, en su moneda original...
            "salaryMin": r[6],
            "salaryMax": r[7],
            "currency": r[8],
            # ...y el equivalente anual en USD, que es el comparable entre paises.
            "salaryUsdMin": r[9],
            "salaryUsdMax": r[10],
            # true = estimacion de la fuente, no cifra publicada por la empresa.
            "salaryPredicted": r[11],
            "url": r[12],
            "skills": r[13],
            "isForeign": r[14],
            "score": round(float(r[15]), 4),
        }
        for r in rows
    ]

    return {"count": len(results), "results": results}
