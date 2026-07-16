# Jobia — Diagrama de despliegue

Arquitectura real en producción: `https://jobia.duckdns.org` (`TU_IP`),
VPS Vultr de 2 vCPU · 4 GB, todo en Docker.

---

## Vista general (Mermaid)

> Se renderiza automáticamente en GitHub/GitLab. Si lo ves como texto, mira el
> diagrama ASCII más abajo.

```mermaid
flowchart TB
    user([Usuario / navegador])

    subgraph vps["VPS Vultr · TU_IP · Docker"]
        direction TB
        npm["Nginx Proxy Manager<br/>:80 :443 :81<br/>HTTPS Let's Encrypt"]

        subgraph proxynet["red proxy (externa)"]
            front["frontend<br/>React + Nginx interno<br/>sirve la SPA y hace de proxy de /api"]
        end

        subgraph appnet["red app (interna · sin acceso a internet)"]
            api["api<br/>Node + Express :3000"]
            match["matching<br/>Python + FastAPI :8000<br/>embeddings ONNX locales"]
            pg[("postgres<br/>pgvector :5432")]
            redis[("redis :6379")]
            worker["worker<br/>BullMQ · ingesta + avisos"]
        end
    end

    ext1["Adzuna · Jooble · ArbeitNow · RemoteOK"]
    ext2["OpenRouter<br/>(CV / pitch / chat)"]
    tg["Telegram Bot API"]

    user -->|"HTTPS"| npm
    npm -->|"red proxy"| front
    front -->|"/api → app"| api
    api --> pg
    api --> redis
    api -->|"/match, /embed"| match
    match --> pg
    worker --> pg
    worker --> redis
    worker -->|"ingesta cada 6 h"| ext1
    api -->|"solo genera texto"| ext2
    worker -->|"avisos de ofertas"| tg

    classDef db fill:#1c3d5a,stroke:#4fa3ff,color:#fff;
    classDef edge fill:#0e2136,stroke:#6ec8ff,color:#fff;
    class pg,redis db;
```

---

## Flujo de una búsqueda de ofertas (sin IA generativa)

```mermaid
sequenceDiagram
    participant U as Usuario
    participant F as frontend
    participant A as api (Node)
    participant M as matching (Python)
    participant P as postgres+pgvector

    U->>F: "remoto junior backend"
    F->>A: GET /api/matching/jobs?text=...
    A->>M: POST /match (texto)
    M->>M: genera embedding LOCAL (ONNX, $0)
    M->>P: ORDER BY embedding <=> $1 LIMIT N
    P-->>M: ofertas por similitud de coseno
    M-->>A: candidatos + score
    A->>A: umbral de confianza + ε-greedy
    A-->>F: top-N (sin gastar tokens)
    F-->>U: carruseles de ofertas
```

**Clave:** todo el matching es matemático y local. **No se llama a ningún LLM.**

---

## Flujo del chat (RAG, sí usa LLM)

```mermaid
sequenceDiagram
    participant U as Usuario
    participant A as api (Node)
    participant M as matching
    participant P as postgres
    participant O as OpenRouter

    U->>A: mensaje del chat
    A->>A: ¿es consulta de empleo? (léxico)
    A->>M: recuperar ofertas afines
    M->>P: coseno sobre pgvector
    P-->>M: ofertas
    M-->>A: ofertas (RETRIEVAL)
    A->>O: system prompt + ofertas en bloque <ofertas> + mensaje
    Note over A,O: las ofertas son DATOS, no órdenes<br/>(defensa anti-inyección)
    O-->>A: respuesta redactada (GENERATION)
    A-->>U: texto + tarjetas de oferta reales
```

---

## Diagrama ASCII (respaldo)

```
                          Internet
                             │  :80  :443
                             ▼
                 ┌───────────────────────────┐
                 │   Nginx Proxy Manager     │  panel :81
                 │   HTTPS + Let's Encrypt   │  (jobia.duckdns.org)
                 └───────────┬───────────────┘
                             │   red "proxy" (externa)
                             ▼
                      ┌────────────┐
                      │  frontend  │  React + Nginx interno.
                      │            │  Sirve la SPA y hace de proxy de /api
                      └─────┬──────┘
                            │   red "app" (interna, invisible a internet)
             ┌──────────────┼───────────┬──────────────┐
             ▼              ▼           ▼              ▼
       ┌──────────┐  ┌────────────┐ ┌────────┐  ┌──────────┐
       │   api    │  │  matching  │ │ redis  │  │ postgres │
       │ Node:3000│  │ FastAPI    │ │        │  │ pgvector │
       └────┬─────┘  │ ONNX local │ └────────┘  └──────────┘
            │        └────────────┘
            ▼
       ┌──────────┐   El worker es el único que sale a internet:
       │  worker  │──▶ Adzuna · Jooble · ArbeitNow · RemoteOK  (ingesta 6 h)
       │  BullMQ  │──▶ OpenRouter                              (CV/pitch/chat)
       └────┬─────┘──▶ Telegram Bot API                        (avisos)
            └─▶ postgres · redis
```

---

## Tabla de contenedores

| Servicio | Imagen | Puerto interno | Red | Expuesto a internet |
|---|---|---|---|---|
| `nginx-proxy-manager` | jc21/nginx-proxy-manager | 80/443/81 | proxy | **Sí** (único) |
| `frontend` | node build → nginx:alpine | 80 | proxy + app | No (vía NPM) |
| `api` | node:20 | 3000 | app | No |
| `matching` | python:3.11 + ONNX | 8000 | app | No |
| `postgres` | pgvector/pgvector:pg16 | 5432 | app | No |
| `redis` | redis:alpine | 6379 | app | No |
| `worker` | node:20 | — | app | No |

**Solo NPM publica puertos.** Todo lo demás vive en la red interna `app`.

---

## Dónde vive cada coste

| Pieza | Dónde corre | Coste |
|---|---|---|
| Voz → texto (dictado) | Navegador (Web Speech API) | $0 |
| Texto → embedding | `matching` (ONNX local) | $0 |
| Ofertas afines (coseno) | `postgres` + pgvector | $0 |
| CV / pitch / chat | OpenRouter (LLM `:free`) | céntimos / racionado |

El **matching nunca gasta tokens**. Solo la generación de texto toca OpenRouter.
