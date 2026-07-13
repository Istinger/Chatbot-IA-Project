-- Historial del chatbot.
--
-- userId es NULLABLE a proposito: un visitante puede conversar sin registrarse.
-- El indice (sessionId, createdAt) es el que sostiene la consulta del historial:
-- "dame los ultimos N mensajes de esta sesion".

CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Message_sessionId_createdAt_idx" ON "Message"("sessionId", "createdAt");
