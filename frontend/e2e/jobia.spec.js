import { test, expect } from '@playwright/test';

/**
 * Pruebas de UX de Jobia. Cubren lo que se rediseño hacia los mockups y los
 * arreglos de la ronda 2 (fila de 4, sin card gigante, snap, sin perfil-chip),
 * mas los flujos base (login, buscar, modo voz) y "cero errores de consola".
 *
 * Corre contra la app YA levantada por docker-compose (no arranca servidor).
 * baseURL = E2E_BASE_URL o http://localhost:8080 (ver playwright.config.js).
 */

const DEMO = { email: 'demo@jobia.ec', password: 'demo1234' };

// Ruido de red que NO es un bug de la app (imagenes externas de prueba, etc.).
const RUIDO = [/net::/i, /Failed to load resource/i, /favicon/i, /picsum/i, /placehold/i, /pravatar/i, /loremflickr/i];

/** Adjunta captura de errores reales de consola/JS; devuelve el array vivo. */
function cazarErrores(page) {
  const errores = [];
  page.on('console', (m) => {
    if (m.type() === 'error' && !RUIDO.some((r) => r.test(m.text()))) errores.push(m.text());
  });
  page.on('pageerror', (e) => errores.push('PAGEERROR ' + e.message));
  return errores;
}

async function login(page) {
  await page.goto('/login');
  await page.fill('#email', DEMO.email);
  await page.fill('#password', DEMO.password);
  await page.click('button[type="submit"]');
  // El demo tiene skills -> aterriza en la home (no en onboarding).
  await expect(page).toHaveURL(/\/$|\/$/);
  await expect(page.locator('.ofertas__cab h1')).toHaveText(/Ofertas nuevas/i);
}

test.describe('Login', () => {
  test('entra con credenciales validas', async ({ page }) => {
    const errores = cazarErrores(page);
    await login(page);
    expect(errores, errores.join('\n')).toEqual([]);
  });

  test('credenciales invalidas muestran mensaje claro', async ({ page }) => {
    await page.goto('/login');
    await page.fill('#email', 'demo@jobia.ec');
    await page.fill('#password', 'clave-mala');
    await page.click('button[type="submit"]');
    await expect(page.locator('.alerta')).toContainText(/Credenciales incorrectas/i);
  });

  test('toggle de contrasena muestra y oculta', async ({ page }) => {
    await page.goto('/login');
    const input = page.locator('#password');
    await expect(input).toHaveAttribute('type', 'password');
    await page.click('.campo__toggle');
    await expect(input).toHaveAttribute('type', 'text');
  });
});

test.describe('Home — Ofertas nuevas', () => {
  test('una sola destacada y fila de 4 (escritorio)', async ({ page }, info) => {
    test.skip(info.project.name !== 'desktop', 'la fila de 4 es de escritorio');
    const errores = cazarErrores(page);
    await login(page);

    // Exactamente UNA destacada (el bug era que crecia gigante / se rompia).
    await expect(page.locator('.card--destacada')).toHaveCount(1);
    // La fila tiene 4 tarjetas (destacada + 3).
    await expect(page.locator('.ofertas__fila .card')).toHaveCount(4);
    expect(errores, errores.join('\n')).toEqual([]);
  });

  test('la fila no rompe el layout: alturas iguales', async ({ page }, info) => {
    test.skip(info.project.name !== 'desktop', 'solo escritorio');
    await login(page);
    const alturas = await page.locator('.ofertas__fila .card').evaluateAll((els) =>
      els.map((e) => Math.round(e.getBoundingClientRect().height)),
    );
    expect(alturas.length).toBe(4);
    // Todas las tarjetas de la fila deben medir casi lo mismo (±4px por redondeo).
    const max = Math.max(...alturas);
    const min = Math.min(...alturas);
    expect(max - min).toBeLessThanOrEqual(4);
  });

  test('NO existe el chip de perfil (Demo · Ver perfil)', async ({ page }) => {
    await login(page);
    await expect(page.locator('.perfil-chip')).toHaveCount(0);
  });

  test('segunda pagina "Mas ofertas" con nota de scroll', async ({ page }, info) => {
    test.skip(info.project.name !== 'desktop', 'solo escritorio');
    await login(page);
    await expect(page.locator('.ofertas__scroll')).toBeVisible();
    await expect(page.locator('.ofertas__mas .carrusel__title')).toHaveText(/Mas ofertas/i);
    // Son dos "paginas" con snap.
    await expect(page.locator('.ofertas-pagina')).toHaveCount(2);
  });

  test('las tarjetas tienen imagen de portada', async ({ page }) => {
    await login(page);
    await expect(page.locator('.ofertas__fila .card__img').first()).toBeVisible();
  });
});

test.describe('Movil', () => {
  test('sin scroll horizontal y con barra inferior', async ({ page }, info) => {
    test.skip(info.project.name !== 'movil', 'solo movil');
    await login(page);
    const hscroll = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 1,
    );
    expect(hscroll).toBe(false);
    await expect(page.locator('.tabbar')).toBeVisible();
    await expect(page.locator('.tabbar__asis')).toBeVisible();
  });
});

test.describe('Buscar', () => {
  test('una consulta devuelve resultados', async ({ page }) => {
    const errores = cazarErrores(page);
    await login(page);
    await page.goto('/buscar');
    await page.fill('#q', 'remoto junior backend');
    await page.click('button[type="submit"]');
    await expect(page.locator('.resultados .carrusel__title')).toContainText(/ofertas encontradas/i);
    await expect(page.locator('.ofertas__rejilla .card').first()).toBeVisible();
    expect(errores, errores.join('\n')).toEqual([]);
  });
});

test.describe('Portafolio', () => {
  test('la IA sugiere 4 ideas (1 destacada) adaptadas al perfil', async ({ page }) => {
    const errores = cazarErrores(page);
    await login(page);
    await page.goto('/portafolio');

    // 1 destacada + 3 en la lista = 4 proyectos.
    await expect(page.locator('.port-dest')).toHaveCount(1);
    await expect(page.locator('.port-lista .port-card')).toHaveCount(3);
    // Titulo de la seccion presente.
    await expect(page.locator('.portlist h1')).toHaveText(/Ideas para portafolio/i);
    expect(errores, errores.join('\n')).toEqual([]);
  });

  test('deep-link al detalle de una idea funciona (refresh)', async ({ page }) => {
    await login(page);
    await page.goto('/portafolio');
    // a.port-dest = el link real (el esqueleto es un div con la misma clase).
    const destacada = page.locator('a.port-dest');
    await expect(destacada).toBeVisible();
    const href = await destacada.getAttribute('href');
    expect(href).toMatch(/\/portafolio\/.+/);

    // Navegar directo (como un refresh/enlace compartido): el detalle debe
    // resolver la idea por la API, no depender de que venga del listado.
    await page.goto(href);
    await expect(page.locator('.portidea__titulo')).toBeVisible();
    await expect(page.getByRole('button', { name: /Empezar proyecto/i })).toBeVisible();
  });
});

test.describe('Entrevista', () => {
  test('subseccion: setup -> pregunta -> feedback', async ({ page }, info) => {
    test.skip(info.project.name !== 'desktop', 'el panel esta siempre visible en escritorio');
    await login(page);

    // Cambiar a la subseccion Entrevista del panel.
    await page.getByRole('tab', { name: /Entrevista/i }).click();
    await expect(page.locator('.entrev-setup')).toBeVisible();
    // La tarjeta de video aparece como "proximamente".
    await expect(page.locator('.entrev-video--soon')).toContainText(/Proximamente/i);

    // Empezar: preguntas del banco (sin depender del LLM).
    await page.locator('.entrev-setup input').first().fill('Desarrollador frontend junior');
    await page.getByRole('button', { name: /Empezar entrevista/i }).click();

    // Aparece la primera pregunta y la zona de respuesta.
    await expect(page.locator('.entrev-sesion .burbuja--assistant')).toBeVisible();
    await page.locator('.entrev__resp').fill(
      'Soy egresado de sistemas, me gusta el frontend con React y he hecho proyectos personales de practica para aprender.',
    );

    // Terminar salta al feedback (usa fallback si el LLM no responde: nunca cuelga).
    await page.getByRole('button', { name: /^Terminar$/i }).click();
    await expect(page.locator('.entrev-feedback')).toBeVisible();
    await expect(page.getByRole('button', { name: /Practicar otra vez/i })).toBeVisible();
  });
});

test.describe('Modo voz', () => {
  test('abrir el microfono muestra el overlay a pantalla completa', async ({ page }, info) => {
    await login(page);
    if (info.project.name === 'movil') {
      await page.click('.tabbar__asis'); // abre la hoja del asistente
    }
    await page.click('button[aria-label="Hablar por voz"]');
    const voz = page.locator('.voz');
    await expect(voz).toBeVisible();
    // El overlay va por portal a <body>: debe cubrir toda la ventana.
    const cubre = await voz.evaluate((el) => {
      const r = el.getBoundingClientRect();
      return r.width >= window.innerWidth - 2 && r.height >= window.innerHeight - 2;
    });
    expect(cubre).toBe(true);
  });
});
