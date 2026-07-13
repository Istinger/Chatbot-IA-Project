const env = require('../../../config/env');
const { toJob } = require('../normalize');

/**
 * ArbeitNow. Publica y SIN CLAVE. Remotas de Europa (mayoria en Alemania).
 *
 * No devuelve salario en absoluto, asi que sus ofertas no alimentan la feature
 * "cuanto te van a pagar". A cambio trae `remote` y `tags`, que son buenas
 * pistas de skills.
 *
 * Su API no acepta filtro de busqueda: devuelve un tablon paginado. El filtrado
 * por palabra clave se hace aqui, en memoria.
 */
async function fetchJobs({ what = '', page = 1, onlyRemote = true }) {
  const res = await fetch(`${env.arbeitnow.url}?page=${page}`, {
    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok) throw new Error(`ArbeitNow respondio ${res.status}`);

  const body = await res.json();
  let jobs = body.data || [];

  if (onlyRemote) jobs = jobs.filter((j) => j.remote);

  if (what) {
    const terminos = what.toLowerCase().split(/\s+/).filter(Boolean);
    jobs = jobs.filter((j) => {
      const texto = `${j.title} ${(j.tags || []).join(' ')}`.toLowerCase();
      return terminos.some((t) => texto.includes(t));
    });
  }

  return jobs;
}

function normalize(raw) {
  return toJob({
    source: 'arbeitnow',
    externalId: raw.slug,
    title: raw.title,
    company: raw.company_name,
    location: raw.remote ? `${raw.location} (remoto)` : raw.location,
    country: 'Alemania',
    salaryMin: null, // ArbeitNow nunca trae salario
    salaryMax: null,
    description: raw.description, // viene en HTML: normalize lo limpia
    url: raw.url,
    extraSkillText: (raw.tags || []).join(' '),
  });
}

module.exports = { name: 'arbeitnow', fetchJobs, normalize };
