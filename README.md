# Jobia — Agente inteligente de empleo

**Proyecto académico, sin ánimo de lucro.** Jobia es un trabajo universitario
cuyo objetivo es **aprender cómo funcionan por dentro** las tecnologías de un
agente de empleo moderno: bases de datos vectoriales, embeddings, RAG y modelos
de lenguaje. No se vende, no se cobra, no se monetiza y no se recopilan datos con
fines comerciales. Su única finalidad es educativa.

> Producción de demostración: `https://jobia.duckdns.org` · usuario de prueba
> `demo@jobia.ec` / `demo1234`.

---

## Qué hace

Ayuda a egresados y estudiantes de tecnología en Ecuador a encontrar ofertas
afines a sus habilidades, preparar entrevistas y mejorar su CV. Las ofertas son
**reales**, obtenidas por las **APIs oficiales** de las fuentes (nunca por
scraping).

---

## Cómo funcionan los modelos por detrás

Esta es la parte que el proyecto busca enseñar. La idea central es que **no se
entrena ningún modelo: se orquestan**. Y se hace en tres capas, de la más barata
a la más cara:

### 1. Embeddings (locales, coste $0)

Un *embedding* convierte un texto (un CV, una oferta) en un vector de números que
captura su **significado**. Textos parecidos producen vectores cercanos. Jobia
los calcula **en su propio servidor** con el modelo
`paraphrase-multilingual-MiniLM-L12-v2` vía ONNX — sin llamar a ninguna API, sin
coste y sin límites.

### 2. Matching por similitud de coseno (sin IA generativa)

Las ofertas afines se encuentran **midiendo el ángulo** entre el vector del perfil
y los de las ofertas (similitud de coseno), usando la extensión **pgvector** de
PostgreSQL. Esto es **matemática pura**: no interviene ningún modelo de lenguaje y
**no gasta tokens**. Un chatbot que solo respondiera con información pre-cargada se
quedaría aquí.

### 3. LLM — solo para GENERAR texto (racionado)

El modelo de lenguaje (vía OpenRouter) se usa **únicamente para redactar**: el
chat, el resumen de CV y el *pitch*. El chatbot funciona con **RAG**
(*Retrieval-Augmented Generation*): primero **recupera** las ofertas afines con
pgvector, y luego el LLM **genera** la respuesta usándolas como contexto. El
modelo **no inventa** ofertas: se le entregan ya buscadas, delimitadas como datos
no confiables para resistir la inyección de prompts.

> Explicación detallada de cada concepto (context window, fallo silencioso,
> ε-greedy, cadena de modelos, cuota gratuita) en **[GUIA-COMPLETA.md](GUIA-COMPLETA.md)**.
> Arquitectura y diagramas en **[DIAGRAMA-DESPLIEGUE.md](DIAGRAMA-DESPLIEGUE.md)**.

---

## Tecnologías

| Capa | Tecnología |
|---|---|
| API y lógica | Node.js + Express |
| Microservicio de IA | Python + FastAPI (embeddings ONNX locales) |
| Base de datos | PostgreSQL + pgvector |
| Cola / worker | BullMQ + Redis |
| Frontend | React + Vite |
| LLM (solo texto) | OpenRouter |
| Notificaciones | Bot de Telegram |
| Orquestación | Docker Compose |
| Proxy / HTTPS | Nginx Proxy Manager + Let's Encrypt |

El despliegue completo está documentado en **[DEPLOY.md](DEPLOY.md)**.

---

## Licencias y aviso legal

> **Aviso:** este apartado no es asesoría jurídica. Es la documentación estándar
> de un proyecto académico para atribuir correctamente lo que usa y dejar claro su
> carácter educativo y sin ánimo de lucro. Ante cualquier duda legal real,
> consultar a un profesional.

### Licencia del código propio

El código original de Jobia se publica bajo licencia **MIT**, con una
puntualización: **es un proyecto educativo sin fines comerciales**. La licencia
MIT incluye una **exención de garantías** ("EL SOFTWARE SE PROPORCIONA 'TAL
CUAL'"), que es justamente lo que protege a los autores de reclamaciones por el
uso que terceros hagan del software.

Si aún no existe, añadir un archivo `LICENSE` con el texto MIT y el año/los
autores. (Ver más abajo cómo generarlo.)

### Componentes de terceros y sus licencias

Jobia se apoya en software libre. Cada componente conserva su propia licencia:

| Componente | Licencia |
|---|---|
| Node.js, Express, React, Vite, FastAPI, BullMQ, ONNX Runtime, Nginx Proxy Manager | MIT |
| Prisma, fastembed, Docker Engine | Apache 2.0 |
| PostgreSQL, pgvector | PostgreSQL License |
| Nginx (interno) | BSD-2-Clause |
| Redis | BSD-3 / RSALv2+SSPL según la versión — verificar la imagen usada |

### Modelo de embeddings

`sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2` se distribuye bajo
**Apache 2.0**. Se usa tal cual, sin reentrenar. Se recomienda conservar el
aviso de atribución del modelo.

### Modelos de lenguaje (OpenRouter)

El texto se genera con modelos servidos por **OpenRouter**, sujeto a **sus
términos de servicio**. Los modelos concretos (p. ej. Google *Gemma*, OpenAI
*gpt-oss*) tienen **sus propias condiciones de uso** — Gemma, por ejemplo, se rige
por los *Gemma Terms of Use*. El contenido generado se muestra al usuario con la
advertencia implícita de que proviene de un modelo automático.

### Fuentes de ofertas de empleo

Las ofertas **son propiedad de sus fuentes** y se obtienen **exclusivamente por
sus APIs oficiales**, respetando sus términos:

| Fuente | Uso |
|---|---|
| Adzuna | API oficial · atribución y enlace a la oferta original |
| Jooble | API oficial (clave por país) |
| ArbeitNow | API pública |
| RemoteOK | API pública · se conserva el enlace a la fuente |

**No se hace scraping de LinkedIn ni de ningún sitio** que lo prohíba en sus
términos. Jobia guarda siempre la `url` original para enlazar de vuelta a la
fuente.

### Datos personales (Ecuador · LOPDP)

- El CV y las habilidades son **datos personales**: se tratan solo para el
  matching, no se comparten con terceros y el usuario puede eliminarlos.
- Los tests de "estilo de trabajo / preferencias laborales" se presentan con
  **disclaimer** y **no** son un diagnóstico clínico ni psicológico.
- Las claves y tokens viven solo en `.env` (nunca en el repositorio).

---

## Estructura y despliegue

- **Backend** (`backend/`): API Express + worker BullMQ (misma imagen, distinto
  comando). Patrón por módulo: `*.controller.js` → `*.service.js` → repositorio.
- **Matching** (`matching-service/`): FastAPI. Los embeddings se calculan **en
  local** con ONNX (la imagen incluye el modelo); **no** se piden a ninguna API.
- **Frontend** (`frontend/`): React + Vite, compilado y servido por un Nginx
  **interno** del contenedor. No confundir con Nginx Proxy Manager, que es el que
  da la cara a internet y gestiona el HTTPS.

Pasos completos de despliegue en **[DEPLOY.md](DEPLOY.md)** · checklist y
conceptos en **[GUIA-COMPLETA.md](GUIA-COMPLETA.md)**.

---

*Proyecto universitario · sin ánimo de lucro · con fines exclusivamente educativos.*
