# Pruebas E2E de UX (Playwright)

Verifican la experiencia real en el navegador: login, la home rediseñada (fila de 4
sin card gigante, snap, sin chip de perfil), búsqueda, modo voz y **cero errores de
consola**. Corren contra la app ya levantada por `docker-compose` — no arrancan ningún
servidor.

> Este es un **proyecto aislado** (su propio `package.json`): Playwright **no** entra en
> la imagen del frontend, así que `npm ci` del `Dockerfile` no se ve afectado.

Usuario de prueba: `demo@jobia.ec` / `demo1234`.

## Correr

Primero levanta la app:

```bash
docker compose -f docker-compose.yml -f docker-compose.local.yml up -d --build frontend
```

### Opción A — local (requiere Node)

```bash
cd frontend/e2e
npm install
npx playwright install --with-deps    # solo la primera vez (descarga navegadores)
npm test                              # usa http://localhost:8080
```

Reporte visual: `npm run report`. Modo interactivo: `npm run test:ui`.

### Opción B — docker (sin instalar nada)

Corre dentro de la imagen oficial de Playwright, en la misma red que el contenedor
`frontend` (así no depende del puerto publicado):

```bash
docker run --rm --network proxy \
  -e E2E_BASE_URL=http://frontend:80 \
  -v "$PWD/frontend/e2e":/e2e -w /e2e \
  mcr.microsoft.com/playwright:v1.48.0-jammy \
  bash -lc "npm install && npx playwright test"
```

## Config

`playwright.config.js` define dos proyectos: **desktop** (1440×900) y **movil**
(390×844). Algunos casos (fila de 4, snap) son solo de escritorio; otros (sin scroll
horizontal, barra inferior) solo de móvil — se auto-saltan con `test.skip`.

`baseURL` sale de `E2E_BASE_URL` o cae a `http://localhost:8080`.
