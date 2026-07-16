# Jobia — Guía completa: conceptos de IA + despliegue en VPS

Recopilación de todo lo que trabajamos: las preguntas conceptuales (IA,
embeddings, RAG, infraestructura) y los pasos reales que seguimos para desplegar
Jobia en el VPS `jobia.duckdns.org`.

> **Producción real:** https://jobia.duckdns.org — Node + Express (API), Python +
> FastAPI (matching), PostgreSQL + pgvector, Redis, React, todo en Docker detrás
> de Nginx Proxy Manager con HTTPS de Let's Encrypt.

---

## Índice

1. [Conceptos de IA](#1-conceptos-de-ia)
2. [Conceptos de infraestructura](#2-conceptos-de-infraestructura)
3. [Despliegue paso a paso](#3-despliegue-paso-a-paso-lo-que-hicimos)
4. [Verificación y problemas comunes](#4-verificación-y-problemas-comunes)

---

## 1. Conceptos de IA

### 1.1 La regla de oro: algoritmo primero, IA solo para generar texto

Jobia orquesta modelos, **no los entrena**. El orden de preferencia es:

1. **Algoritmo clásico** (gratis) → filtrar y rankear ofertas.
2. **Embeddings** (baratos, aquí locales = $0) → medir afinidad semántica.
3. **LLM** (racionado) → solo para **generar texto** (CV, pitch, chat).

Nunca se usa el LLM para filtrar o rankear ofertas: eso se hace con coseno, que
es gratis.

### 1.2 Embeddings locales (coste $0)

Un **embedding** convierte un texto (un CV, una oferta) en un vector de números
que captura su significado. Textos parecidos → vectores cercanos.

Jobia los calcula **en el propio servidor** con el modelo
`paraphrase-multilingual-MiniLM-L12-v2` vía **fastembed/ONNX** (384 dimensiones,
sin PyTorch). Corre en el microservicio Python.

- **Por qué local:** cero coste, cero rate limits, control total. El precio es
  algo de RAM (~700 MB) que el VPS de 4 GB absorbe sin problema.
- **Por qué ese modelo y no `all-MiniLM`:** el producto es en español, y
  `all-MiniLM` es solo inglés. Este es multilingüe.

### 1.3 Matching por similitud de coseno sobre pgvector

**pgvector** es una extensión de PostgreSQL que guarda vectores y sabe medir
distancias entre ellos. La **similitud de coseno** mide el ángulo entre dos
vectores: cuanto más alineados, más parecidos los textos.

El flujo de una recomendación:

```
embedding del perfil  →  comparar con embeddings de las ofertas  →  top-N por coseno
```

En SQL: `ORDER BY embedding <=> $1 LIMIT $2` (el operador `<=>` es la distancia;
`1 - distancia` = score de afinidad).

**Esto no gasta tokens.** El matching es 100% matemático y local.

### 1.4 El fallo silencioso del coseno

El coseno **nunca devuelve vacío**: siempre entrega las N ofertas "menos
lejanas", por absurda que sea la búsqueda. Buscar *"recetas de ceviche"* devolvía
"Soporte Técnico Nivel 1" con un score de 0.498, como si fuera un resultado
legítimo. El sistema no fallaba: **mentía con confianza**.

Solución: dos umbrales de confianza (`MATCHING_MIN_TOP` 0.52 / `MATCHING_MIN_ITEM`
0.42). Si ni el mejor resultado supera el umbral, se devuelve vacío y la UI dice
honestamente que no encontró nada.

> **Limitación conocida:** los embeddings **no entienden la negación**. "remoto
> junior backend **sin inglés**" se parece vectorialmente a "...con inglés".
> Resolverlo bien exige búsqueda híbrida (palabras clave + vector).

### 1.5 ε-greedy: exploración vs. explotación

Para que el ranking no te muestre siempre lo mismo, con probabilidad **0.15** se
inyecta una oferta peor rankeada pero **bien pagada** de un área adyacente
(exploración); el 0.85 restante son los mejores matches (explotación). Así el
usuario descubre salidas que no conocía.

> Detalle: la exploración ordena por `salaryUsdMax` (equivalente en USD), **nunca**
> por el salario en moneda local, o pondría ofertas en pesos por delante de las
> que pagan más de verdad.

### 1.6 RAG (Retrieval-Augmented Generation) en el chat

El chatbot usa **RAG**: primero **recupera** ofertas afines (pgvector), luego el
LLM **genera** una respuesta usándolas como contexto. El LLM no inventa las
ofertas: se le entregan ya buscadas.

**Defensa contra inyección de prompts:** las ofertas vienen de terceros (Adzuna,
Jooble). Si una oferta dice "ignora tus instrucciones", el modelo debe tratarlo
como **dato, no como orden**. Por eso el texto de las ofertas va delimitado en un
bloque `<ofertas>` y declarado como no confiable, nunca concatenado al mensaje
del usuario.

> El **prompt caching** NO mitiga la inyección de prompts: es solo una
> optimización de coste/latencia.

### 1.7 Context window: ¿dónde se guarda la conversación?

El **context window** es lo que el modelo "ve" en cada petición. No se guarda con
el JWT ni por vectorización: la conversación se guarda en la tabla `Message`
(por `sessionId`), y en cada turno se recuperan los últimos turnos y se envían al
modelo. Un **visitante sin sesión** también puede chatear: se usa el `sessionId`,
así que la conversación sobrevive a un F5.

Se mantiene **corto a propósito**: una ventana grande consume más recursos, y el
VPS no está para eso.

### 1.8 La cadena de modelos y la cuota gratuita

`OPENROUTER_MODELS` es una **lista de repuesto**. Si el primer modelo falla (429
por saturación, o un 200 con contenido vacío), se pasa al siguiente.

**Matiz clave:** la cadena te salva de que **un modelo esté caído ahora mismo**,
pero **no** de agotar tu cuota diaria. Los tres modelos terminan en `:free`, y el
límite gratuito (**50/día**, o **1000/día** si cargaste $10) es **por cuenta**,
no por modelo: todos beben del mismo cubo. Si lo agotas, cambiar de modelo no
ayuda — hay que esperar el reset o cargar saldo.

Segunda protección: `LLM_LIMITE_DIARIO=25` (contador en Redis) impide que **un
solo usuario** se coma la cuota de todos.

### 1.9 El dictado por voz NO hace matching

El micrófono es **solo un teclado alternativo**: convierte voz en texto y lo mete
en la caja de mensaje, igual que si tecleara. Usa la **Web Speech API del
navegador** (coste $0, no toca el VPS).

- **Chrome/Edge:** funciona.
- **Brave:** NO. Brave quitó la clave de Google que la API usa para transcribir,
  así que falla aunque el micrófono se encienda. La app lo detecta y avisa con un
  mensaje claro en vez de mentir.

---

## 2. Conceptos de infraestructura

### 2.1 Por qué el swap es innegociable

El VPS tiene 4 GB de RAM. El **swap** es un archivo en disco que Linux usa como
"RAM de emergencia" cuando la real se agota, evitando que el sistema mate procesos
(el **OOM killer**).

Se necesita por un momento concreto: **el build del `matching-service`**, que
instala ONNX Runtime y descarga el modelo de embeddings. Ese pico de memoria, sin
swap, mata el build con un escueto `Killed`. Con swap, el build usa el disco unos
minutos y termina.

### 2.2 Docker publica puertos POR DEBAJO de ufw

El panel de NPM responde en el puerto `:81` **aunque ufw no lo permita**. No es un
error: Docker escribe reglas de iptables por debajo de ufw, así que **un puerto
publicado por un contenedor es accesible aunque ufw no lo liste**.

Implicación: el panel de administración queda expuesto a internet. Para cerrarlo,
se publica solo en `127.0.0.1` y se entra por túnel SSH.

### 2.3 Nginx Proxy Manager es un contenedor más

NPM **es** un contenedor (`jc21/nginx-proxy-manager`). No es un servicio aparte.
Si el panel responde en `:81`, el contenedor está corriendo bien.

Vive en **su propio stack** (`/opt/nginx-proxy-manager/`), separado de la app
(`~/jobia/`), a propósito. Comparten una **red Docker externa llamada `proxy`**
para que NPM pueda alcanzar al `frontend` por su nombre.

### 2.4 Dos redes Docker

- **`proxy`** (externa): la comparten NPM y el `frontend`. Es la puerta.
- **`app`** (interna): el resto de servicios entre sí. **No la ve internet.**

El `api`, `postgres`, `redis`, `matching` y `worker` **no publican puertos**: solo
NPM lo hace. Así el backend queda aislado y solo se llega a él a través del
frontend.

---

## 3. Despliegue paso a paso (lo que hicimos)

### 3.1 Preparar el VPS

```bash
# Docker (una vez)
curl -fsSL https://get.docker.com | sh

# Firewall — SSH SIEMPRE primero para no quedarte fuera
sudo ufw allow OpenSSH
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable

# Swap (comprobar antes: swapon --show)
sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile
sudo mkswap /swapfile && sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Red compartida (una vez)
docker network create proxy
```

### 3.2 Nginx Proxy Manager

`/opt/nginx-proxy-manager/docker-compose.yml` — con la red `proxy` declarada como
externa para que la conexión sea permanente:

```yaml
services:
  npm:
    image: jc21/nginx-proxy-manager:latest
    container_name: nginx-proxy-manager
    restart: unless-stopped
    ports: ["80:80", "81:81", "443:443"]
    volumes:
      - ./data:/data
      - ./letsencrypt:/etc/letsencrypt
    networks: [proxy]

networks:
  proxy:
    external: true
```

```bash
cd /opt/nginx-proxy-manager && docker compose up -d
```

### 3.3 Desplegar la app

```bash
# En el VPS
cd ~ && git clone https://github.com/Istinger/Chatbot-IA-Project.git jobia
cd jobia
```

**El `.env` NO se sube a git.** La forma más segura y sin errores es copiarlo
desde tu máquina local (donde ya funciona) con `scp`:

```bash
# Desde tu PORTÁTIL (no el VPS)
scp ~/Escritorio/Proyecto-CHATBOT/.env usuario@TU_IP:~/jobia/.env
```

> Copiar el `.env` local evita la trampa nº 1: la contraseña de Postgres y la de
> `DATABASE_URL` ya coinciden. **Nunca** copies un `.env.backup` viejo: el nuestro
> tenía un `DATABASE_URL=sqlite:...` que habría roto Postgres/pgvector.

Verificar (en el VPS, sin exponer secretos):

```bash
grep cambia_esto .env    # no debe devolver nada
grep -q 'postgresql://.*@postgres:5432' .env && echo "OK postgres" || echo "REVISAR"
```

### 3.4 Levantar, migrar, ingestar

```bash
# SOLO docker-compose.yml (el .local.yml es de desarrollo)
docker compose up -d --build            # el build del matching tarda minutos

docker compose exec api npx prisma migrate deploy   # crea tablas + pgvector

# Primera ingesta de ofertas reales (careerjet da error inofensivo, se salta)
docker compose exec api node -e "require('./src/modules/jobs/jobs.service').ingest().then(r=>console.log(JSON.stringify(r,null,2)))"
```

Comprobar salud e inventario:

```bash
docker compose exec api node -e "fetch('http://localhost:3000/api/health').then(r=>r.json()).then(console.log)"
docker compose exec api node -e "fetch('http://localhost:3000/api/jobs/stats').then(r=>r.json()).then(d=>console.log(JSON.stringify(d.data,null,2)))"
```

> Resultado real de nuestra ingesta: **516 ofertas** — 179 Jooble (Ecuador), 289
> Adzuna (exterior), 33 RemoteOK, 15 ArbeitNow. Todas vectorizadas.

### 3.5 Proxy Host en NPM

Panel `:81` → **Hosts → Proxy Hosts → Add Proxy Host**:

| Campo | Valor |
|---|---|
| Domain Names | `jobia.duckdns.org` |
| Scheme | `http` |
| Forward Hostname | `frontend` |
| Forward Port | `80` |
| Block Common Exploits · Websockets Support | ✔ |

No se configura `/api`: el Nginx interno del frontend ya lo reenvía a `api:3000`.

### 3.6 HTTPS con Let's Encrypt

**Requisito:** DuckDNS apuntando a la IP del VPS. Verificar:

```bash
dig +short jobia.duckdns.org   # debe = curl -s ifconfig.me
```

En el Proxy Host → pestaña **SSL** → *Request a new SSL Certificate* → activar
**Force SSL** y **HTTP/2** → aceptar términos → **Save**. Let's Encrypt valida por
el puerto 80 y emite el certificado en segundos.

Comprobar:

```bash
curl -I https://jobia.duckdns.org   # HTTP/2 200
```

---

## 4. Verificación y problemas comunes

| Síntoma | Causa probable | Cómo mirar |
|---|---|---|
| **502 Bad Gateway** | La app no está arriba o el Proxy Host apunta mal | `docker compose ps` · Forward = `frontend` |
| NPM no resuelve `frontend` | NPM y frontend no comparten `proxy` | `docker network inspect proxy` (deben salir ambos) |
| API 500 / no conecta a DB | `DATABASE_URL` mal o contraseña distinta | `grep -q 'postgresql://.*@postgres:5432' .env` |
| Build del matching = `Killed` | Sin RAM/swap | `swapon --show` · build por partes |
| Certificado SSL falla | DNS no propagó | `dig +short jobia.duckdns.org` |
| Panel `:81` accesible desde fuera | Docker ignora ufw | publicar en `127.0.0.1:81:81` + túnel SSH |

### Actualizar la app tras un cambio en git

```bash
cd ~/jobia && git pull
docker compose up -d --build
docker compose exec api npx prisma migrate deploy   # si hubo migraciones nuevas
```

---

*Producción: https://jobia.duckdns.org · usuario demo: `demo@jobia.ec` / `demo1234`*
