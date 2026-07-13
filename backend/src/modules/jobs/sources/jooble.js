const env = require('../../../config/env');
const { toJob, parseSalaryString, monedaDe } = require('../normalize');

/**
 * Jooble. Aporta volumen, pero el salario viene como string libre y muy a
 * menudo vacio.
 *
 * IMPORTANTE: Jooble emite UNA CLAVE POR PAIS. La clave actual es del indice de
 * EE.UU. (jooble.org). Pegarle a ec.jooble.org con ella devuelve 403.
 *
 * Cuando consigas la clave de Ecuador, basta con cambiar en el .env:
 *   JOOBLE_HOST=ec.jooble.org
 *   JOOBLE_COUNTRY=Ecuador
 *   JOOBLE_API_KEY=<la clave de EC>
 * y las ofertas locales entran solas (isForeign pasara a false).
 */
async function fetchJobs({ what, location = '', page = 1 }) {
  if (!env.jooble.apiKey) throw new Error('Falta JOOBLE_API_KEY en el .env');

  const res = await fetch(`https://${env.jooble.host}/api/${env.jooble.apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ keywords: what, location, page: String(page) }),
    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok) {
    // Un 403 aqui suele significar: clave valida, pero no para ESTE indice de pais.
    throw new Error(
      `Jooble respondio ${res.status} en ${env.jooble.host}. ` +
        'Si es 403, la clave no sirve para ese indice de pais.',
    );
  }

  const body = await res.json();
  return body.jobs || [];
}

function normalize(raw) {
  // El indice de pais define la moneda por defecto (el string puede traer € o £).
  const { salaryMin, salaryMax, currency } = parseSalaryString(
    raw.salary,
    monedaDe(env.jooble.country),
  );

  return toJob({
    source: 'jooble',
    externalId: String(raw.id),
    title: raw.title,
    company: raw.company,
    location: raw.location,
    country: env.jooble.country,
    salaryMin,
    salaryMax,
    currency,
    description: raw.snippet,
    url: raw.link,
  });
}

module.exports = { name: 'jooble', fetchJobs, normalize };
