import { defineConfig, devices } from '@playwright/test';

/**
 * Suite E2E de UX de Jobia. Proyecto AISLADO (frontend/e2e): tiene su propio
 * package.json para no meter Playwright en la imagen de la app.
 *
 * baseURL sale de E2E_BASE_URL (para correr contra el contenedor `frontend` en la
 * red de docker) o cae a localhost:8080 (el puerto publicado en local). No arranca
 * ningun servidor: prueba la app ya levantada por docker-compose.
 */
export default defineConfig({
  testDir: '.',
  timeout: 30_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:8080',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
    {
      name: 'movil',
      use: { ...devices['Pixel 5'], viewport: { width: 390, height: 844 } },
    },
  ],
});
