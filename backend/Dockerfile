# backend/Dockerfile
# API Node + Express/Fastify con Prisma. Sirve también al worker (mismo código).

FROM node:20-slim

# Prisma necesita openssl
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Instalar dependencias primero (mejor caché de capas)
COPY package*.json ./
RUN npm ci --omit=dev

# Copiar el esquema y generar el cliente de Prisma
COPY prisma ./prisma
RUN npx prisma generate

# Copiar el resto del código
COPY . .

EXPOSE 3000

# La API arranca aquí; el worker usa este mismo Dockerfile pero
# sobreescribe el comando en docker-compose (command: node src/worker.js)
CMD ["node", "src/app.js"]
