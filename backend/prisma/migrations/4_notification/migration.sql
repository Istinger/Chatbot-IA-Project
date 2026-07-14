-- Vinculacion con Telegram y umbral por usuario.
ALTER TABLE "Profile" ADD COLUMN "telegramChatId" TEXT;
ALTER TABLE "Profile" ADD COLUMN "notifMinScore" DOUBLE PRECISION;

-- Avisos ya enviados: la clave unica (userId, jobId) impide notificar dos veces
-- la misma oferta al mismo usuario, aunque el worker la vuelva a encontrar.
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Notification_userId_jobId_key" ON "Notification"("userId", "jobId");
CREATE INDEX "Notification_userId_sentAt_idx" ON "Notification"("userId", "sentAt");
