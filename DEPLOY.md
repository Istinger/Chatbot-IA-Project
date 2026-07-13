# DEPLOY.md — Despliegue del Agente de Empleo (VPS Vultr + Docker)

Guía única y definitiva para levantar el proyecto con Docker Compose, usando **Nginx Proxy Manager (NPM)** como reverse proxy y **jobia.duckdns.org** como dominio con HTTPS gratis.

VPS: Vultr · 2 vCPU · 4 GB RAM · 80 GB SSD
Dominio: `https://jobia.duckdns.org`

> Fuente de verdad del despliegue. Actualizado tras las Partes 1–3 (infraestructura, matching, ingesta).

---

## 1. Idea general

Todo corre en contenedores. En el VPS solo necesitas Docker; no instalas Node, Postgres ni Nginx directamente en el sistema.

- **NPM es el portero:** recibe el tráfico de los puertos 80/443 y lo reparte, con panel web y certificados HTTPS automáticos (Let's Encrypt).
- **Dos compose separados:** uno para NPM (portero independiente) y otro para tu app, unidos por una red Docker compartida.
- **Regla de oro:** NPM y tu app deben compartir una red externa (`proxy`) para que NPM encuentre los contenedores por su nombre. Sin esa red, NPM da error 502.
- **Los embeddings son LOCALES.** El microservicio Python vectoriza con un modelo ONNX que viaja dentro de su imagen. No se llama a ninguna API externa para el matching: **coste $0 y sin rate limits.**

---

## 2. Arquitectura

```
                       Internet
                          │  :80  :443
                          ▼
              ┌───────────────────────────┐
              │   Nginx Proxy Manager     │  (panel web en :81)
              │   HTTPS + Let's Encrypt   │
              └───────────┬───────────────┘
                          │   red Docker "proxy" (externa, compartida)
                          ▼
                   ┌────────────┐
                   │  frontend  │  React + Nginx interno.
                   │  (React)   │  Sirve la SPA y hace de proxy de /api
                   └─────┬──────┘
                         │   red interna "app"
          ┌──────────────┼───────────┬──────────────┐
          ▼              ▼           ▼              ▼
    ┌──────────┐  ┌────────────┐ ┌────────┐  ┌──────────┐
    │   api    │  │  matching  │ │ redis  │  │ postgres │
    │ Node:3000│  │ FastAPI    │ │        │  │ pgvector │
    └────┬─────┘  │ + modelo   │ └────────┘  └──────────┘
         │        │  ONNX      │
         │        └────────────┘
         ▼
    ┌──────────┐        Internet (solo el worker sale a la calle):
    │  worker  │───────▶ Adzuna · Jooble · ArbeitNow   (ingesta de ofertas)
    │  BullMQ  │───────▶ OpenRouter                    (CV / pitch, texto)
    └──────────┘
```

**Flujo resumido:**
1. El usuario entra por `https://jobia.duckdns.org` → NPM → `frontend`.
2. El Nginx **interno** del frontend sirve la SPA y reenvía `/api` al backend Node.
3. El backend usa Postgres (datos + vectores), Redis (cola) y el microservicio Python (matching).
4. El microservicio Python vectoriza **en local** (modelo ONNX en su imagen) y corre la búsqueda por similitud coseno en pgvector.
5. El worker, en segundo plano, trae ofertas de Adzuna/Jooble/ArbeitNow cada 6 h y las vectoriza.

**Dos redes Docker:**
- `proxy` (externa): la comparten NPM y el `frontend`.
- `app` (interna): el resto de servicios entre sí. No la ve internet.

> **Nota:** a diferencia de versiones anteriores de este documento, el `api` **ya no está en la red `proxy`**. El frontend hace de proxy de `/api`, así que NPM solo necesita conocer al `frontend`. Esto elimina el CORS y deja el backend mejor aislado.

---

## 3. Contenedores de la pila

| Servicio | Imagen base | Puerto interno | Red | Expuesto |
| --- | --- | --- | --- | --- |
| `npm` | jc21/nginx-proxy-manager | 80/443/81 | proxy | Sí |
| `frontend` | node build → nginx:alpine | 80 | proxy + app | No (vía NPM) |
| `api` | node:20 | 3000 | app | No (vía frontend) |
| `matching` | python:3.11 + ONNX | 8000 | app | No |
| `postgres` | pgvector/pgvector:pg16 | 5432 | app | No |
| `redis` | redis:alpine | 6379 | app | No |
| `worker` | node:20 | — | app | No |

Solo NPM publica puertos a internet.

---

## 4. Estructura de archivos

```
~/npm/
└── docker-compose.yml         # Nginx Proxy Manager (portero)

~/jobia/                       # el repo clonado de GitHub
├── docker-compose.yml         # produccion: NO publica puertos
├── docker-compose.local.yml   # solo desarrollo local (NO se usa en el VPS)
├── .env                       # claves y config (NO esta en git: se crea a mano)
├── backend/
├── matching-service/
└── frontend/
```

---

## 5. Paso 1 — Preparar el VPS

```bash
ssh root@TU_IP

# Docker (una sola vez)
curl -fsSL https://get.docker.com | sh

# Puertos
ufw allow 80
ufw allow 443
ufw allow 81      # panel NPM (puedes cerrarlo luego)

# Swap de 2 GB. INNEGOCIABLE: el build del matching-service (ONNX Runtime)
# es el mayor pico de memoria de todo el despliegue.
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Red compartida (una sola vez)
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
cd ~/npm && docker compose up -d
```

Panel: `http://jobia.duckdns.org:81` · `admin@example.com` / `changeme` (cámbialas al entrar).

---

## 7. Paso 3 — Desplegar la aplicación

```bash
git clone git@github.com:Istinger/Chatbot-IA-Project.git ~/jobia
cd ~/jobia
```

El `docker-compose.yml` ya está en el repo. Lo que **no** está (ni debe estar) es el `.env`: créalo a partir de `.env.example`.

```bash
cp .env.example .env
nano .env       # rellena los valores
```

### Variables mínimas para arrancar

```env
POSTGRES_USER=empleo
POSTGRES_PASSWORD=<algo_largo_y_aleatorio>
POSTGRES_DB=empleo
DATABASE_URL=postgresql://empleo:<la_misma_password>@postgres:5432/empleo

REDIS_URL=redis://redis:6379
MATCHING_URL=http://matching:8000
JWT_SECRET=<algo_largo_y_aleatorio>

# Fuentes de ofertas
ADZUNA_APP_ID=xxxx
ADZUNA_APP_KEY=xxxx
JOOBLE_API_KEY=xxxx
JOOBLE_HOST=jooble.org
JOOBLE_COUNTRY=Estados Unidos
ARBEIT_NOW_URL=https://www.arbeitnow.com/api/job-board-api

INGESTA_HORAS=6
MATCHING_EPSILON=0.15

# Solo para generar texto (CV, pitch). El matching NO lo usa.
OPENROUTER_API_KEY=
TELEGRAM_BOT_TOKEN=
```

Los servicios se llaman entre sí **por el nombre del servicio**, no por `localhost`: por eso `DATABASE_URL` usa `@postgres:5432`.

### Levantar

```bash
# OJO: en el VPS se usa SOLO docker-compose.yml.
# El docker-compose.local.yml publica puertos y es exclusivo de desarrollo.
docker compose up -d --build

# Crear las tablas + la extension pgvector
docker compose exec api npx prisma migrate deploy

# Traer las primeras ofertas (si no, esperas hasta 6 h al worker)
docker compose exec api node -e "require('./src/modules/jobs/jobs.service').ingest().then(r=>console.log(r))"
```

---

## 8. Paso 4 — Configurar el Proxy Host en NPM

En el panel (`:81`), **Hosts → Proxy Hosts → Add Proxy Host**. Basta **uno**:

- **Domain Names:** `jobia.duckdns.org`
- **Scheme:** `http`
- **Forward Hostname / IP:** `frontend` ← nombre del contenedor, no una IP
- **Forward Port:** `80`
- Activa **Block Common Exploits** y **Websockets Support**.

No hace falta configurar `/api` en NPM: el Nginx interno del frontend ya lo reenvía a `api:3000`.

---

## 9. Paso 5 — Activar HTTPS (gratis)

En el Proxy Host, pestaña **SSL**:
- **SSL Certificate:** "Request a new SSL Certificate".
- Activa **Force SSL** y **HTTP/2 Support**.
- Acepta los términos de Let's Encrypt y guarda.

Requisito: puertos 80/443 abiertos y DuckDNS apuntando a la IP pública del VPS.

---

## 10. Optimización para 2 vCPU · 4 GB RAM

Consumo medido en local con la pila completa: **~790 MiB en reposo**, de los cuales ~700 MiB son el `matching` (el modelo de embeddings vive en RAM). Cabe holgado en 4 GB.

### El build es el punto crítico

La imagen del `matching-service` pesa ~1.2 GB: instala ONNX Runtime y **descarga el modelo durante el build**. Con 2 vCPU esto tarda varios minutos. Si se queda sin memoria, construye por partes:

```bash
docker compose build matching
docker compose build api
docker compose build frontend
docker compose up -d
```

El swap del paso 1 es lo que evita que un pico tumbe el build.

### Índice vectorial en pgvector

Sin índice, cada búsqueda escanea toda la tabla. Créalo **después** de cargar un lote inicial de ofertas:

```bash
docker compose exec postgres psql -U empleo -d empleo \
  -c 'CREATE INDEX ON "Job" USING hnsw (embedding vector_cosine_ops);'
```

Con ~100 ofertas no se nota; a partir de unos miles, es la diferencia entre milisegundos y segundos.

### Memoria de Postgres

Ya limitada en el compose (`shared_buffers=256MB`, `work_mem=16MB`).

---

## 11. Embeddings locales (coste $0)

El matching **no cuesta dinero**. Así funciona:

```
Texto (CV u oferta) → modelo ONNX local → vector de 384 → pgvector
```

- **Modelo:** `sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2`
- **Dimensión:** 384 (debe coincidir con `vector(384)` del esquema)
- **Por qué ese:** es **multilingüe**. El producto es en español; `all-MiniLM-L6-v2` (el clásico) está entrenado en inglés y degradaría el matching.
- **Cómo:** `fastembed` sobre ONNX Runtime, sin PyTorch. El modelo se hornea en la imagen durante el build, así que el arranque no depende de la red.

### El matching, paso a paso

1. **Al ingerir** una oferta, el worker llama a `POST /embed/jobs` → vectoriza solo las que tienen `embedding IS NULL` (idempotente).
2. **Al cambiar** su CV o skills, el perfil del usuario se revectoriza (`POST /embed/profile/:id`). No en cada búsqueda.
3. **Al buscar**, la similitud es SQL puro. El operador `<=>` es distancia coseno: menor distancia = más parecido.

```sql
SELECT id, title, company,
       1 - (embedding <=> $1) AS score
FROM "Job"
WHERE embedding IS NOT NULL
ORDER BY embedding <=> $1
LIMIT 10;
```

Esa consulta **no llama a ningún LLM**. Es gratis y corre en milisegundos.

### Dónde SÍ se usa OpenRouter

Solo para **generar texto**: extracto de CV, pitch adaptado a una oferta, reportes de tests. Prompts cortos en español, modelo barato, y cacheado. Nunca para filtrar o rankear ofertas.

---

## 12. Ingesta de ofertas

El worker (BullMQ + Redis) reingiere cada `INGESTA_HORAS` (6 por defecto), fuera del request del usuario.

### Estado real de las fuentes

| Fuente | Clave | Salario | Cubre Ecuador |
| --- | --- | --- | --- |
| **Adzuna** | sí | **Numérico** (el mejor) | ❌ **No** — devuelve 404 |
| **Jooble** | sí, **una por país** | String libre, casi siempre vacío | ❌ No con la clave actual (índice US) |
| **ArbeitNow** | no necesita | Nunca trae | ❌ No (Europa) |

**Ecuador no está cubierto por ninguna fuente.** Adzuna solo soporta: `at au be br ca ch de es fr gb in it mx nl nz pl sg us za`. El enfoque actual es **trabajo remoto** al que se puede postular desde Ecuador.

Para desbloquear ofertas locales hay que pedir a Jooble una API key del índice de Ecuador y cambiar en el `.env`:

```env
JOOBLE_API_KEY=<la clave de EC>
JOOBLE_HOST=ec.jooble.org
JOOBLE_COUNTRY=Ecuador
```

No hay que tocar código: las ofertas entrarán con `isForeign = false` automáticamente.

### Trampas de los datos reales (ya resueltas)

- **Monedas.** Adzuna devuelve el salario en la moneda local y **no lo dice**. Un sueldo mexicano de 1.080.000 (MXN, ≈$59k) parecía superar a uno de $276.013 (USD). Por eso el modelo `Job` guarda `currency` y, sobre todo, `salaryUsdMax`: **para ordenar o comparar sueldos, usa siempre los campos `salaryUsd*`, nunca `salaryMin/Max`.**
- **Salarios estimados.** El 57% de los sueldos de Adzuna son estimaciones suyas (`salary_is_predicted`), no cifras publicadas. Se guardan con `salaryPredicted = true`: **la UI debe mostrarlos como "~$110k (estimado)"**, nunca como un hecho.
- **Spam de ofertas.** Las empresas publican el mismo puesto remoto en decenas de ciudades (GovCIO lo hizo en 32). La identidad de una oferta es `(source, title, company)`; la ubicación **no** entra en la clave de deduplicación.

---

## 13. Orden de arranque (resumen)

```bash
# Una vez en el VPS: Docker, puertos, swap, red proxy (seccion 5)

# 1. Nginx Proxy Manager
cd ~/npm && docker compose up -d

# 2. La aplicacion
cd ~/jobia
cp .env.example .env && nano .env
docker compose up -d --build
docker compose exec api npx prisma migrate deploy

# 3. Panel NPM (:81): Proxy Host -> frontend:80 + SSL (secciones 8 y 9)

# 4. Primera ingesta y, tras ella, el indice HNSW (seccion 10)
```

Para actualizar después de un `git pull`:

```bash
cd ~/jobia && git pull && docker compose up -d --build
docker compose exec api npx prisma migrate deploy   # si hubo migraciones nuevas
```

Comandos útiles:
```bash
docker compose logs -f api        # logs del backend
docker compose logs -f worker     # ver la ingesta
docker compose ps                 # estado
docker compose exec api npm run seed   # datos de demo
```

---

## 14. Errores comunes

| Síntoma | Causa | Solución |
| --- | --- | --- |
| NPM da **502 Bad Gateway** | NPM no ve el contenedor | `frontend` debe estar en la red `proxy`; usa el nombre del contenedor, no `localhost` ni IP |
| SSL no se emite | Puerto 80/443 cerrado o DNS mal | Abre puertos; confirma que DuckDNS apunta a la IP del VPS |
| `api` no conecta a la base | Host equivocado | `DATABASE_URL` debe usar `@postgres:5432`, no `localhost` |
| El build del `matching` muere | Pico de RAM (ONNX) | Confirma el swap; `docker compose build matching` a solas |
| `/api` da 404 desde el navegador | Nginx del frontend mal configurado | Revisa `frontend/nginx-spa.conf`: debe hacer `proxy_pass` de `/api/` a `api:3000` |
| Matching devuelve 409 | El perfil no tiene embedding | `POST /embed/profile/:id` en el matching-service |
| Matching lento | Falta índice | `CREATE INDEX ... hnsw` tras cargar ofertas |
| Jooble responde **403** | La clave no sirve para ese índice de país | Cada país de Jooble necesita su propia API key |
| Adzuna responde **404** | País no soportado (p. ej. `ec`) | Usa uno de los 19 países soportados |
| Cambios no aparecen | Imagen vieja | `docker compose up -d --build` |

---

## 15. Checklist de despliegue

- [ ] Docker instalado en el VPS
- [ ] Puertos 80/443/81 abiertos
- [ ] Swap de 2 GB activado
- [ ] `docker network create proxy` ejecutado
- [ ] NPM levantado y contraseña cambiada
- [ ] Repo clonado y `.env` creado **a mano** (no viene de git)
- [ ] App levantada con `docker compose up -d --build` (**sin** el `-f docker-compose.local.yml`)
- [ ] Migraciones Prisma aplicadas
- [ ] Proxy Host `jobia.duckdns.org` → `frontend:80` creado
- [ ] SSL emitido y Force SSL activado
- [ ] DuckDNS apunta a la IP correcta
- [ ] Primera ingesta ejecutada (hay ofertas en la base)
- [ ] Índice HNSW creado tras cargar ofertas
- [ ] `https://jobia.duckdns.org` responde con candado
- [ ] `GET /api/health` devuelve `postgres/redis/matching: up`
