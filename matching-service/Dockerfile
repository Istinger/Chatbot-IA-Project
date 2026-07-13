# matching-service/Dockerfile
# Microservicio Python + FastAPI. Genera embeddings LOCALES (fastembed/ONNX) y
# corre las consultas de similitud contra pgvector. Sin PyTorch, sin OpenRouter:
# coste $0 y sin rate limits.

FROM python:3.11-slim

WORKDIR /app

# El modelo se hornea en la imagen (no se descarga en cada arranque del contenedor).
ENV FASTEMBED_CACHE_PATH=/opt/models \
    EMBEDDING_MODEL=sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2

# psycopg[binary] y onnxruntime traen wheels precompilados: no hace falta compilador.
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Pre-descargar el modelo durante el build. Asi el arranque en el VPS es
# inmediato y no depende de la red.
RUN python -c "from fastembed import TextEmbedding; import os; TextEmbedding(os.environ['EMBEDDING_MODEL'])"

# Copiar el codigo
COPY . .

EXPOSE 8000

# 1 worker: cada worker carga su propia copia del modelo en RAM. Con 4 GB en el
# VPS, uno basta para la demo (subir a 2 solo si hace falta concurrencia).
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]
