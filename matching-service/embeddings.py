"""Embeddings locales con fastembed (ONNX Runtime).

Modelo: paraphrase-multilingual-MiniLM-L12-v2
  - 384 dimensiones (debe coincidir con vector(384) del esquema pgvector)
  - multilingue: entiende espanol, que es el idioma del producto
  - ~0.22 GB en RAM, sin PyTorch

Coste $0. No se llama a ninguna API externa para vectorizar.
"""

import os
from functools import lru_cache

from fastembed import TextEmbedding

MODEL_NAME = os.getenv(
    "EMBEDDING_MODEL",
    "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2",
)
DIM = 384


@lru_cache(maxsize=1)
def _model() -> TextEmbedding:
    """El modelo se carga una sola vez por proceso (es caro: ~1-2 s)."""
    return TextEmbedding(MODEL_NAME)


def embed(texts: list[str]) -> list[list[float]]:
    """Convierte una lista de textos en una lista de vectores de 384 floats."""
    return [vec.tolist() for vec in _model().embed(texts)]


def embed_one(text: str) -> list[float]:
    return embed([text])[0]


def to_pgvector(vector: list[float]) -> str:
    """pgvector recibe el vector como literal: '[0.12,-0.98,...]'."""
    return "[" + ",".join(f"{x:.6f}" for x in vector) + "]"


def job_text(title: str, company: str, description: str | None, skills: list[str]) -> str:
    """Texto canonico de una oferta. Debe ser consistente con profile_text:
    ambos viven en el mismo espacio vectorial."""
    parts = [title, company, description or "", " ".join(skills or [])]
    return "\n".join(p for p in parts if p).strip()


def profile_text(cv_text: str | None, skills: list[str]) -> str:
    """Texto canonico de un perfil."""
    parts = [" ".join(skills or []), cv_text or ""]
    return "\n".join(p for p in parts if p).strip()
