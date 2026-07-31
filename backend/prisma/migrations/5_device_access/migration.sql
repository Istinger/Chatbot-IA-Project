-- Acceso por computadora para la demostracion de la casa abierta.
-- La IP se muestra al administrador, pero no identifica al equipo: muchas PCs
-- de un laboratorio pueden compartirla. La identidad es el hash de una cookie
-- aleatoria HttpOnly que nunca se guarda en texto plano.
CREATE TABLE "DeviceAccess" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "ip" TEXT NOT NULL,
    "userAgent" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeviceAccess_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DeviceAccess_tokenHash_key" ON "DeviceAccess"("tokenHash");
CREATE INDEX "DeviceAccess_status_requestedAt_idx"
    ON "DeviceAccess"("status", "requestedAt");

CREATE TABLE "DemoAccessSettings" (
    "id" TEXT NOT NULL DEFAULT 'main',
    "allowAll" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DemoAccessSettings_pkey" PRIMARY KEY ("id")
);

INSERT INTO "DemoAccessSettings" ("id", "allowAll", "updatedAt")
VALUES ('main', false, CURRENT_TIMESTAMP);
