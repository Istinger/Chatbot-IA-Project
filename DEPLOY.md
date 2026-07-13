# DEPLOY.md — Despliegue del Agente de Empleo (VPS Vultr + Docker)

Guía única y definitiva para levantar todo el proyecto con Docker Compose, usando **Nginx Proxy Manager (NPM)** como reverse proxy, **jobia.duckdns.org** como dominio con HTTPS gratis, e integración de **embeddings por OpenRouter**.

VPS: Vultr · 2 vCPU · 4 GB RAM · 80 GB SSD
Dominio: `https://jobia.duckdns.org`

> Este archivo reemplaza a las versiones anteriores (DEPLOY con Nginx manual y DEPLOY_NPM). Es la fuente de verdad.

---

## 1. Idea general

Todo corre en contenedores. En el VPS solo necesitas Docker; no instalas Node, Postgres ni Nginx directamente en el sistema.

- **NPM es el portero:** recibe el tráfico de los puertos 80/443 y lo reparte a tus contenedores, con panel web y certificados HTTPS automáticos (Let's Encrypt).
- **Dos compose separados:** uno para NPM (portero independiente) y otro para tu app, unidos por una red Docker compartida.
- **Regla de oro:** NPM y tu app deben compartir una red externa (`proxy`) para que NPM encuentre los contenedores por su nombre. Sin esa red, NPM da error 502.

---

## 2. Arquitectura

```
                       Internet
                          │  :80  :443
                          ▼
              ┌───────────────────────────┐
              │   Nginx Proxy Manager     │  (panel web en :81)
              │   HTTPS + Let's Encrypt    │
              └───────────┬───────────────┘
                          │   red Docker "proxy" (externa, compartida)
          ┌───────────────┼──────────────────┐
          ▼               ▼                   ▼
   ┌────────────┐   ┌────────────┐     (otros proyectos
   │  frontend  │   │    api     │      futuros si quieres)
   │  (React)   │   │ Node:3000  │
   └────────────┘   └─────┬──────┘
                          │  red interna "app"
              ┌───────────┼───────────┬───────────┐
              ▼           ▼           ▼           ▼
        ┌──────────┐ ┌────────┐ ┌──────────┐ ┌─────────┐
        │ matching │ │ redis  │ │ postgres │ │ worker  │
        │ FastAPI  │ │        │ │ pgvector │ │ BullMQ  │
        └────┬─────┘ └────────┘ └──────────┘ └─────────┘
             │
             ▼
        OpenRouter (internet: embeddings + LLM)
```

**Flujo resumido:**
1. El usuario entra por `https://jobia.duckdns.org` → NPM.
2. NPM sirve el frontend y enruta `/api` al backend Node.
3. El backend usa Postgres (datos + vectores), Redis (cola) y el microservicio Python (matching).
4. El microservicio Python llama a **OpenRouter** por internet para generar embeddings y texto.
5. El worker corre en segundo plano: trae ofertas y envía notificaciones por Telegram.

**Dos redes Docker:**
- `proxy` (externa): la comparten NPM y los servicios de cara a internet (frontend, api).
- `app` (interna): solo tus servicios entre sí (api ↔ postgres, redis, matching). No la ve NPM ni internet.

---

## 3. Contenedores de la pila

| Servicio | Imagen base | Puerto interno | Red | Expuesto |
| --- | --- | --- | --- | --- |
| `npm` | jc21/nginx-proxy-manager | 80/443/81 | proxy | Sí |
| `frontend` | node build → nginx:alpine | 80 | proxy | No (vía NPM) |
| `api` | node:20 | 3000 | proxy + app | No (vía NPM `/api`) |
| `matching` | python:3.11 | 8000 | app | No |
| `postgres` | pgvector/pgvector:pg16 | 5432 | app | No |
| `redis` | redis:alpine | 6379 | app | No |
| `worker` | node:20 | — | app | No |

Solo NPM publica puertos a internet. Todo lo demás vive en redes internas.

---

## 4. Estructura de archivos

```
~/npm/
└── docker-compose.yml         # Nginx Proxy Manager (portero)

~/jobia/
├── docker-compose.yml         # tu aplicación
├── .env                       # claves y config (NO subir a git)
├── backend/
│   └── Dockerfile
├── matching-service/
│   ├── Dockerfile
│   └── requirements.txt
└── frontend/
    ├── Dockerfile
    └── nginx-spa.conf
```

---

## 5. Paso 1 — Preparar el VPS

```bash
# Conéctate
ssh root@TU_IP

# Instala Docker (una sola vez)
curl -fsSL https://get.docker.com | sh

# Abre los puertos necesarios
ufw allow 80
ufw allow 443
ufw allow 81      # panel NPM (puedes cerrarlo luego)

# Activa swap de 2 GB (red de seguridad de memoria — ver sección 10)
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Crea la red compartida (una sola vez)
docker network create proxy
```

---

## 6. Paso 2 — Levantar Nginx Proxy Manager

```yaml
# ~/npm/docker-compose.yml
services:
  npm:
    image: jc21/nginx-proxy-manager:latest
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
      - "81:81"
    volumes:
      - ./data:/data
      - ./letsencrypt:/etc/letsencrypt
    networks:
      - proxy

networks:
  proxy:
    external: true
```

```bash
cd ~/npm
docker compose up -d
```

Panel: `http://jobia.duckdns.org:81`
Credenciales por defecto (cámbialas al entrar):
- Email: `admin@example.com`
- Password: `changeme`

---

## 7. Paso 3 — Compose de tu aplicación

```yaml
# ~/jobia/docker-compose.yml
services:
  frontend:
    build: ./frontend
    restart: unless-stopped
    networks:
      - proxy

  api:
    build: ./backend
    restart: unless-stopped
    env_file: .env
    depends_on:
      - postgres
      - redis
    networks:
      - proxy
      - app

  matching:
    build: ./matching-service
    restart: unless-stopped
    env_file: .env
    depends_on:
      - postgres
    networks:
      - app

  worker:
    build: ./backend
    command: node src/worker.js
    restart: unless-stopped
    env_file: .env
    depends_on:
      - redis
      - postgres
    networks:
      - app

  postgres:
    image: pgvector/pgvector:pg16
    restart: unless-stopped
    command: postgres -c shared_buffers=256MB -c work_mem=16MB
    env_file: .env
    volumes:
      - pgdata:/var/lib/postgresql/data
    networks:
      - app

  redis:
    image: redis:alpine
    restart: unless-stopped
    networks:
      - app

volumes:
  pgdata:

networks:
  proxy:
    external: true
  app:
```

Solo `frontend` y `api` están en `proxy` (para que NPM los vea). Postgres, Redis, matching y worker están solo en `app`. **Ningún servicio publica puertos con `ports:`** salvo NPM.

### .env (ejemplo — rellena tus valores)

```env
# Base de datos
POSTGRES_USER=empleo
POSTGRES_PASSWORD=cambia_esto
POSTGRES_DB=empleo
DATABASE_URL=postgresql://empleo:cambia_esto@postgres:5432/empleo

# Redis
REDIS_URL=redis://redis:6379

# OpenRouter
OPENROUTER_API_KEY=sk-or-xxxxxxxxxxxxxxxx

# Telegram
TELEGRAM_BOT_TOKEN=xxxxxxxx

# Auth
JWT_SECRET=cambia_esto_por_algo_largo

# Fuentes de empleo
ADZUNA_APP_ID=xxxx
ADZUNA_APP_KEY=xxxx
```

Nota clave sobre Docker: los servicios se llaman entre sí **por el nombre del servicio**, no por `localhost`. Por eso `DATABASE_URL` usa `@postgres:5432`. Nunca subas el `.env` a git (agrégalo a `.gitignore`).

```bash
cd ~/jobia
docker compose up -d --build
docker compose exec api npx prisma migrate deploy
```

---

## 8. Paso 4 — Configurar los Proxy Hosts en NPM

En el panel (`:81`), **Hosts → Proxy Hosts → Add Proxy Host**.

### Frontend (web principal)

- **Domain Names:** `jobia.duckdns.org`
- **Scheme:** `http`
- **Forward Hostname / IP:** `frontend`  ← nombre del contenedor, no una IP
- **Forward Port:** `80`
- Activa **Block Common Exploits** y **Websockets Support**.

### API (subruta /api)

En el mismo host, pestaña **Custom locations**:
- Location: `/api`
- Forward Hostname: `api`
- Forward Port: `3000`

(Alternativa: subdominio `api.jobia.duckdns.org` → `api:3000`, registrándolo también en DuckDNS.)

---

## 9. Paso 5 — Activar HTTPS (gratis)

En el Proxy Host, pestaña **SSL**:
- **SSL Certificate:** "Request a new SSL Certificate".
- Activa **Force SSL** y **HTTP/2 Support**.
- Acepta los términos de Let's Encrypt y guarda.

En segundos, `https://jobia.duckdns.org` funciona con candado.

Requisito: puertos 80 y 443 abiertos (ya lo hiciste en el paso 1) y DuckDNS apuntando a la IP pública correcta del VPS.

---

## 10. Optimización para 2 vCPU · 4 GB RAM

Con embeddings por API, la pila corre en ~1.2–1.8 GB en reposo. Los dos picos a cuidar son el `build` y las consultas vectoriales.

### Swap (ya activado en el paso 1)

Es la red de seguridad de memoria. Evita que un pico durante el build tumbe un contenedor. Innegociable para una demo estable.

### Índice vectorial en pgvector

Sin índice, cada búsqueda escanea toda la tabla. Créalo **después** de cargar un lote inicial de ofertas:

```sql
CREATE INDEX ON "Job" USING hnsw (embedding vector_cosine_ops);
```

### Límite de memoria de Postgres

Ya incluido en el compose (`shared_buffers=256MB`, `work_mem=16MB`). Ajusta si notas presión.

### Si el build se queda sin memoria

Construye las imágenes una por una:

```bash
docker compose build frontend
docker compose build api
docker compose up -d
```

---

## 11. Embeddings por OpenRouter — paso a paso

Convertir el CV del usuario y cada oferta en un **vector** usando OpenRouter, y guardarlo en pgvector para comparar por similitud.

### Paso 1 — Crear cuenta y clave

1. Entra a openrouter.ai y crea una cuenta.
2. En **Keys**, genera una API key (empieza con `sk-or-...`).
3. Carga saldo (con $2–$5 te sobra para miles de pruebas).
4. Pon la clave en `.env` como `OPENROUTER_API_KEY`.

### Paso 2 — Entender el flujo

```
Texto (CV u oferta)  →  OpenRouter  →  vector [0.12, -0.98, ...]  →  guardar en pgvector
```

Con `text-embedding-3-small` cada texto genera un vector de **1536** números. Esa dimensión debe coincidir con la declarada en el esquema pgvector (`vector(1536)`).

### Paso 3 — Llamar a la API (Python/FastAPI)

```python
# embeddings.py
import os
import requests

OPENROUTER_KEY = os.environ["OPENROUTER_API_KEY"]
URL = "https://openrouter.ai/api/v1/embeddings"

def get_embedding(text: str) -> list[float]:
    resp = requests.post(
        URL,
        headers={"Authorization": f"Bearer {OPENROUTER_KEY}"},
        json={
            "model": "openai/text-embedding-3-small",
            "input": text,
        },
        timeout=30,
    )
    resp.raise_for_status()
    return resp.json()["data"][0]["embedding"]   # lista de 1536 floats
```

### Paso 4 — Guardar el vector en pgvector

```sql
UPDATE "Job"
SET embedding = $1          -- el vector como '[0.12, -0.98, ...]'
WHERE id = $2;
```

### Paso 5 — Buscar por similitud (el matching)

El operador `<=>` calcula la distancia coseno. Menor distancia = más parecido:

```sql
SELECT id, title, company,
       1 - (embedding <=> $1) AS score   -- afinidad (0 a 1)
FROM "Job"
ORDER BY embedding <=> $1                -- del más parecido al menos
LIMIT 10;
```

`$1` es el embedding del perfil del usuario → devuelve las 10 ofertas más afines.

### Paso 6 — Control de costo

- Genera el embedding de cada oferta **una sola vez** (al ingerirla).
- Genera el embedding del perfil solo cuando el usuario **actualiza** su CV/skills.
- El filtrado por similitud (paso 5) es SQL puro: **gratis**, no llama a la API.

Solo pagas OpenRouter cuando entra una oferta nueva o cambia un perfil.

---

## 12. Orden de arranque (resumen)

```bash
# En el VPS, una vez: Docker, puertos, swap, red proxy (sección 5)

# 1. Nginx Proxy Manager
cd ~/npm && docker compose up -d

# 2. Tu aplicación
cd ~/jobia && docker compose up -d --build
docker compose exec api npx prisma migrate deploy

# 3. En el panel NPM (:81): Proxy Host + SSL (secciones 8 y 9)

# 4. Tras cargar ofertas: crear el índice HNSW (sección 10)
```

Para actualizar código después:

```bash
cd ~/jobia && docker compose up -d --build
```

Comandos útiles:
```bash
docker compose logs -f api      # logs del backend
docker compose ps               # estado de los servicios
docker compose down             # apagar la app
```

---

## 13. Errores comunes

| Síntoma | Causa | Solución |
| --- | --- | --- |
| NPM da **502 Bad Gateway** | NPM no ve el contenedor | `frontend`/`api` deben estar en la red `proxy`; usa el nombre del contenedor, no `localhost` ni IP |
| SSL no se emite | Puerto 80/443 cerrado o DNS mal | Abre puertos; confirma que DuckDNS apunta a la IP del VPS |
| `api` no conecta a la base | Host equivocado | `DATABASE_URL` debe usar `@postgres:5432`, no `localhost` |
| Contenedor muere en el build | Pico de RAM | Confirma swap activo; build por partes |
| Cambios no aparecen | Imagen vieja | `docker compose up -d --build` |
| Matching lento | Falta índice | `CREATE INDEX ... hnsw` tras cargar ofertas |

---

## 14. Checklist de despliegue

- [ ] Docker instalado en el VPS
- [ ] Puertos 80/443/81 abiertos
- [ ] Swap de 2 GB activado
- [ ] `docker network create proxy` ejecutado
- [ ] NPM levantado y panel accesible en `:81`
- [ ] Contraseña de NPM cambiada
- [ ] `.env` creado con todas las claves
- [ ] App levantada con `docker compose up -d --build`
- [ ] Migraciones Prisma aplicadas
- [ ] Proxy Host `jobia.duckdns.org` → `frontend:80` creado
- [ ] Ruta `/api` → `api:3000` configurada
- [ ] SSL emitido y Force SSL activado
- [ ] DuckDNS apunta a la IP correcta del VPS
- [ ] Saldo cargado en OpenRouter
- [ ] Bot de Telegram creado y token en `.env`
- [ ] Índice HNSW creado tras cargar ofertas
- [ ] `https://jobia.duckdns.org` responde con candado
