# matching-service/Dockerfile
# Microservicio Python + FastAPI. Genera embeddings vía OpenRouter y corre las
# consultas de similitud contra pgvector. NO carga modelos locales (ahorra RAM).

FROM python:3.11-slim

WORKDIR /app

# Dependencias del sistema mínimas
RUN apt-get update -y && apt-get install -y --no-install-recommends \
    build-essential libpq-dev && rm -rf /var/lib/apt/lists/*

# Instalar dependencias de Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar el código
COPY . .

EXPOSE 8000

# Servir con uvicorn. 2 workers es suficiente para 2 vCPU.
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]
