# frontend/Dockerfile
# Build multi-etapa: compila React con Node, sirve los estáticos con Nginx.
# La imagen final pesa ~20 MB y casi no consume RAM en runtime.

# --- Etapa 1: build ---
FROM node:20-slim AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
# Ajusta si tu build sale a otra carpeta (Vite usa "dist", CRA usa "build")
RUN npm run build

# --- Etapa 2: servir ---
FROM nginx:alpine

# Copiar el build compilado al directorio que sirve Nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Config de Nginx para una SPA (React Router): todo cae en index.html
COPY nginx-spa.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
