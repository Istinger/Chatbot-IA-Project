# CLAUDE.md — Backend · Agente Inteligente de Empleo

Guía para trabajar el backend en Claude Code. Léela antes de generar o modificar código.

---

## 1. Contexto del proyecto

Backend de un agente web que ayuda a egresados/estudiantes a buscar ofertas afines a sus skills, prepararse para entrevistas y hacer seguimiento de postulaciones.

- **Presupuesto de IA:** ~$20 en OpenRouter. **No se entrenan modelos, se orquestan.**
- **Regla de oro:** algoritmo clásico primero (gratis), embeddings después (baratos), LLM solo para generar texto (racionado).
- **Idioma del producto:** español (Ecuador). Contenido y prompts en español.

---

## 2. Stack

| Componente | Tecnología |
| --- | --- |
| Runtime | Node.js + Express (o Fastify) |
| Microservicio de IA | Python + FastAPI (embeddings y matching) |
| Base de datos | PostgreSQL + extensión `pgvector` |
| ORM | Prisma (Node) |
| LLM / Embeddings | OpenRouter |
| Cola / Worker | BullMQ + Redis |
| Notificaciones | Bot de Telegram |
| Orquestación | Docker Compose |

**Por qué dos servicios:** Node maneja la API, la auth y la lógica de negocio; Python/FastAPI maneja embeddings y similitud vectorial (ecosistema ML más maduro). Se comunican por HTTP interno.

---

## 3. Estructura de carpetas

```
backend/
├── src/
│   ├── config/          # env, conexión db, cliente OpenRouter
│   ├── modules/
│   │   ├── auth/        # registro, login, JWT
│   │   ├── profile/     # perfil, subida de CV, skills
│   │   ├── jobs/        # ingesta, normalización, listado
│   │   ├── matching/    # llamadas al microservicio de matching
│   │   ├── cv/          # generación de CV / pitch (LLM)
│   │   ├── certs/       # skill gap + sugerencia de certificados
│   │   ├── tests/       # banco de preguntas (lógica / personalidad)
│   │   ├── applications/# seguimiento de postulaciones (Kanban)
│   │   └── notifications/# worker + bot de Telegram
│   ├── shared/          # middlewares, errores, utils
│   └── app.js
├── prisma/
│   └── schema.prisma
matching-service/        # microservicio Python
├── main.py
├── embeddings.py
└── requirements.txt
docker-compose.yml
```

Cada módulo sigue el patrón: `*.controller.js` (rutas), `*.service.js` (lógica), `*.repository.js` (acceso a datos vía Prisma).

---

## 4. Convenciones

- **Nombres de modelos Prisma = nombres de dominio** (User, Profile, Job, Application), en singular y PascalCase.
- Controllers delgados; la lógica vive en services.
- Toda respuesta de API usa un envelope consistente: `{ ok, data, error }`.
- Errores HTTP correctos: 400 validación, 401 auth, 404 no encontrado, 502 fallo de servicio externo.
- Variables sensibles solo en `.env` (nunca hardcodeadas): `DATABASE_URL`, `OPENROUTER_API_KEY`, `TELEGRAM_BOT_TOKEN`, `JWT_SECRET`.
- Prisma: para transacciones con nivel de aislamiento, usar el string literal `'Serializable'`.

---

## 5. Esquema de base de datos (Prisma)

```prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String
  profile   Profile?
  applications Application[]
  createdAt DateTime @default(now())
}

model Profile {
  id        String   @id @default(uuid())
  userId    String   @unique
  user      User     @relation(fields: [userId], references: [id])
  cvText    String?
  skills    String[]              // skills extraídas / confirmadas
  embedding Unsupported("vector(1536)")?  // pgvector, dimensión del modelo de embedding
  updatedAt DateTime @updatedAt
}

model Job {
  id          String  @id @default(uuid())
  externalId  String  @unique      // id de la fuente (Adzuna/Jooble)
  source      String                // "adzuna" | "jooble" | ...
  title       String
  company     String
  location    String?
  country     String?               // para local vs exterior
  salaryMin   Float?
  salaryMax   Float?
  description String?
  url         String
  skills      String[]              // skills detectadas en la oferta
  embedding   Unsupported("vector(1536)")?
  isForeign   Boolean @default(false)
  createdAt   DateTime @default(now())
}

model Application {
  id        String   @id @default(uuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  jobId     String
  status    String   @default("guardada") // guardada|postulada|entrevista|oferta|rechazada
  appliedAt DateTime?
  updatedAt DateTime @updatedAt
}

model QuestionBank {
  id       String @id @default(uuid())
  type     String  // "logica" | "personalidad" | "hr" | "tecnica"
  skill    String?
  question String
  options  Json?
  answer   String?
}
```

Habilitar pgvector en una migración: `CREATE EXTENSION IF NOT EXISTS vector;`

---

## 6. Features → implementación

### 🟢 Nivel muy factible (costo ~$0)

**Sugerir trabajos / trabajo independiente con match**
- Motor: búsqueda vectorial semántica en `pgvector`.
- Flujo: generar embedding del perfil → comparar con embeddings de ofertas por **similitud de coseno** → devolver top-N.
- El filtrado inicial NO usa LLM. Solo embeddings + cosine.
- Endpoint: `GET /matching/jobs` → llama al microservicio Python, que corre la query vectorial.
- Query pgvector (coseno): `ORDER BY embedding <=> $1 LIMIT $2`.

**CV automático / "venderse a uno mismo" (pitch)**
- Extraer texto del CV subido → pedir a un LLM rápido un extracto profesional o viñetas adaptadas a una oferta.
- Modelo barato en OpenRouter (Gemini Flash / Llama 8B). Coste aprox. fracciones de centavo por petición.
- Endpoints: `POST /cv/summary`, `POST /cv/pitch` (recibe jobId opcional para adaptar).
- Prompt corto y en español; cachear por (perfil, oferta) para no repetir gasto.

**Evitar sobreajuste (exploración vs. explotación, ε-greedy)**
- En el ranking de matching, con probabilidad 0.85 mostrar los mejores matches (explotación); con 0.15 inyectar ofertas bien pagadas de áreas tecnológicas adyacentes (exploración).
- Implementar en el service de matching, después de recuperar candidatos: mezclar resultados según ε.
- Parametrizar ε en config para poder ajustarlo/demostrarlo.

**Cuánto te van a pagar / trabajos en el exterior**
- Sin IA. Los JSON de Adzuna/Jooble ya traen `salary_min`, `salary_max`, `location`, `country`.
- En la normalización (módulo jobs): mapear esos campos; si `country != "Ecuador"` → `isForeign = true`.
- Endpoints de listado con filtro: `GET /jobs?scope=local|foreign`.

### 🟡 Nivel medio (código extra, dentro de presupuesto)

**Pruebas de lógica / encuestas / personalidad**
- Banco de preguntas **estático** en la tabla `QuestionBank` (no evaluar con IA en tiempo real → ahorra tokens).
- La IA se usa una sola vez para generar el banco (offline), o al final para redactar un reporte cualitativo a partir del puntaje numérico.
- Corrección: algoritmo determinista (comparar respuestas / sumar puntajes).
- Endpoints: `GET /tests/:type`, `POST /tests/:type/submit` → devuelve puntaje; `POST /tests/:type/report` (opcional, LLM).
- **Nota ética:** presentar los tests de personalidad como "estilo de trabajo / preferencias laborales", con disclaimer. Datos sensibles bajo LOPDP.

**Sugerir certificados (skill gap analysis)**
- Comparar skills del usuario contra las skills más repetidas en las ofertas afines.
- Las skills faltantes se mapean contra un **catálogo estático** (JSON local) de cursos (Coursera, edX, YouTube).
- Sin IA: es diferencia de conjuntos + lookup en tabla.
- Endpoint: `GET /certs/suggestions` → `{ missingSkills, suggestedCourses }`.

---

## 7. Ingesta de ofertas (interfaz JobSource)

Todas las fuentes implementan la misma interfaz para que agregar una nueva sea trivial:

```
JobSource.fetchJobs(query) -> RawJob[]
normalize(RawJob) -> Job   // esquema común
```

- Conector Adzuna: `GET https://api.adzuna.com/v1/api/jobs/{country}/search/1?app_id=...&app_key=...&results_per_page=20&what=...&content-type=application/json`.
- Adzuna devuelve solo un fragmento de la descripción → guardar también `url` de redirección.
- Verificar cobertura de Ecuador en Adzuna; si no aplica, Jooble cubre el mercado local.
- La ingesta corre en el worker (programada), no en el request del usuario.

---

## 8. Uso de OpenRouter (control de costos)

- **Embeddings:** preferir modelo local (bge-m3 / MiniLM) en el microservicio Python para no pagar por cada oferta. Si se usa API, un modelo de embedding barato (p. ej. text-embedding-3-small).
- **Generación (CV, pitch, reportes):** modelo pequeño y rápido. Prompts cortos en español.
- **Cachear** todo lo repetible (preguntas por skill, pitch por oferta).
- Nunca llamar al LLM en el filtrado de ofertas (eso es cosine, gratis).
- Centralizar las llamadas en `config/openrouter.js` con un wrapper que registre tokens usados.

**Nota sobre dimensiones:** el `vector(1536)` del esquema asume text-embedding-3-small (1536 dims). Si usas bge-m3 (1024) o MiniLM (384), ajusta la dimensión en el esquema y en las migraciones para que coincida con el modelo elegido.

---

## 9. Endpoints principales (resumen)

```
POST  /auth/register        # registro
POST  /auth/login           # login → JWT
POST  /profile/cv           # subir CV, extraer texto y skills
GET   /profile              # perfil actual
GET   /jobs?scope=          # listado (local/foreign)
GET   /matching/jobs        # ofertas rankeadas por afinidad (ε-greedy)
POST  /cv/summary           # extracto profesional (LLM)
POST  /cv/pitch             # pitch adaptado a oferta (LLM)
GET   /certs/suggestions    # skill gap + cursos
GET   /tests/:type          # banco de preguntas
POST  /tests/:type/submit   # puntaje
GET   /applications         # tablero de seguimiento
POST  /applications         # guardar/postular a una oferta
PATCH /applications/:id     # cambiar estado (Kanban)
```

---

## 10. Worker y notificaciones

- BullMQ + Redis ejecutan periódicamente: ingesta de ofertas + recálculo de matches.
- Cuando aparece una oferta sobre cierto umbral de afinidad para un usuario → el bot de Telegram lo notifica.
- El umbral es configurable (idealmente por usuario).
- El bot vive en `modules/notifications`; token en `.env`.

---

## 11. Qué NO hacer

- No llamar al LLM para filtrar/rankear ofertas (usar cosine).
- No evaluar tests con IA en tiempo real (banco estático + corrección determinista).
- No hardcodear claves ni tokens.
- No hacer scraping de LinkedIn (términos de servicio); priorizar APIs oficiales.
- No presentar los tests de personalidad como diagnóstico clínico.
- No meter la videollamada del simulador en esta fase (trabajo futuro).
