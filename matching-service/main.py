"""Microservicio de matching (FastAPI).

Parte 1: solo expone /health. Confirma que alcanza a Postgres y que la extension
pgvector esta instalada. La busqueda vectorial y los embeddings llegan despues,
cuando haya saldo en OpenRouter.
"""

import os

import psycopg
from fastapi import FastAPI

app = FastAPI(title="matching-service")

DATABASE_URL = os.environ["DATABASE_URL"]


@app.get("/health")
def health() -> dict:
    try:
        with psycopg.connect(DATABASE_URL, connect_timeout=3) as conn:
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
        "openrouter": "no configurado" if not os.getenv("OPENROUTER_API_KEY") else "configurado",
    }
