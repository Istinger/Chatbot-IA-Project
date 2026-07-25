const env = require('../../config/env');
const { connection } = require('../../config/redis');

/**
 * Fotos de portada por TEMA, servidas desde Pexels.
 *
 * Por que por tema y no por oferta:
 *   Hay ~1000 ofertas y el plan gratuito da 200 peticiones/hora. Pedir una foto
 *   por oferta agotaria la cuota en minutos. En su lugar se piden ~30 fotos de
 *   cada tema UNA vez, se cachean, y el cliente reparte esas fotos entre las
 *   ofertas de ese tema. Son 12 peticiones al dia en total.
 *
 * La clave vive solo aqui: el navegador pide a nuestra API, nunca a Pexels.
 */

/** Consulta real que se manda a Pexels por cada tema de la UI. */
const CONSULTAS = {
  programming: 'programming code developer',
  website: 'web design computer screen',
  datacenter: 'data center servers',
  analytics: 'data analytics charts',
  database: 'database technology',
  software: 'software testing computer',
  design: 'ux design workspace',
  smartphone: 'mobile app smartphone',
  branding: 'branding design studio',
  marketing: 'marketing team office',
  warehouse: 'warehouse logistics',
  architecture: 'architecture blueprint',
  business: 'business office desk',
  office: 'modern office workspace',
  server: 'server room technology',
};

const POR_TEMA = 30;
const TTL = 60 * 60 * 24 * 7; // 7 dias: las fotos no caducan, la cuota si
const CLAVE = 'img:pexels:v1';

const activo = () => Boolean(env.pexels.apiKey);

async function pedirTema(consulta) {
  const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(
    consulta,
  )}&per_page=${POR_TEMA}&orientation=landscape`;

  const res = await fetch(url, {
    headers: { Authorization: env.pexels.apiKey },
    signal: AbortSignal.timeout(8000),
  });

  if (!res.ok) throw new Error(`pexels respondio ${res.status}`);

  const datos = await res.json();
  // Solo lo que la UI necesita: la foto y a quien hay que acreditar.
  return (datos.photos || []).map((f) => ({
    url: f.src?.landscape || f.src?.medium,
    autor: f.photographer,
    enlace: f.url,
  }));
}

/**
 * Devuelve `{ [tema]: [{ url, autor, enlace }] }`.
 *
 * Ante cualquier problema devuelve `{}`: la UI tiene su propio respaldo, asi que
 * quedarse sin fotos nunca rompe la pantalla.
 */
async function porTema() {
  if (!activo()) return {};

  try {
    const guardado = await connection.get(CLAVE);
    if (guardado) return JSON.parse(guardado);
  } catch {
    /* cache caido: se pide de nuevo */
  }

  const temas = Object.entries(CONSULTAS);
  const resultados = await Promise.all(
    temas.map(async ([tema, consulta]) => {
      try {
        return [tema, await pedirTema(consulta)];
      } catch {
        return [tema, []]; // un tema caido no tumba al resto
      }
    }),
  );

  const mapa = Object.fromEntries(resultados.filter(([, fotos]) => fotos.length));
  if (!Object.keys(mapa).length) return {};

  try {
    await connection.set(CLAVE, JSON.stringify(mapa), 'EX', TTL);
  } catch {
    /* no poder cachear no invalida lo pedido */
  }

  return mapa;
}

module.exports = { porTema, activo, CONSULTAS };
