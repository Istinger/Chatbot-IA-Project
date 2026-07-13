const env = require('../../../config/env');
const { toJob, parseSalaryString } = require('../normalize');

/**
 * Careerjet. LA UNICA FUENTE ENCONTRADA QUE CUBRE ECUADOR OFICIALMENTE
 * (careerjet.com.ec), sin recurrir a scraping (que CLAUDE.md prohibe).
 *
 * Requiere un `affid` de afiliado: es GRATIS, pero hay que registrarse en
 * https://www.careerjet.com/partners/ . Sin el, la API responde 403.
 *
 * En cuanto tengas el ID, ponlo en el .env y las ofertas de Ecuador entran solas
 * (con isForeign = false, porque el pais es Ecuador):
 *
 *   CAREERJET_AFFID=tu_id
 *
 * Mientras CAREERJET_AFFID este vacio, la fuente se salta sin romper la ingesta.
 */
const BASE = 'http://public.api.careerjet.net/search';

async function fetchJobs({ what = '', location = 'Ecuador', page = 1, locale = 'es_EC' } = {}) {
  if (!env.careerjet.affid) {
    throw new Error(
      'Falta CAREERJET_AFFID. Registro gratuito en careerjet.com/partners. ' +
        'Es la unica fuente que cubre Ecuador.',
    );
  }

  const qs = new URLSearchParams({
    keywords: what,
    location,
    locale_code: locale,
    affid: env.careerjet.affid,
    pagesize: '50',
    page: String(page),
    // La API los exige, aunque sean nominales: identifican al usuario final.
    user_ip: '127.0.0.1',
    user_agent: 'Jobia/1.0',
  });

  const res = await fetch(`${BASE}?${qs}`, { signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`Careerjet respondio ${res.status}`);

  const body = await res.json();

  if (body.type === 'ERROR') {
    throw new Error(`Careerjet: ${body.error || 'affid invalido'}`);
  }

  return body.jobs || [];
}

function normalize(raw) {
  // Careerjet da el salario como string libre ("$1.200 - $1.500 por mes").
  const { salaryMin, salaryMax, currency } = parseSalaryString(raw.salary, 'USD');

  return toJob({
    source: 'careerjet',
    externalId: raw.url, // Careerjet no expone un id estable; la url lo es
    title: raw.title,
    company: raw.company,
    location: raw.locations,
    country: 'Ecuador', // el locale de la busqueda fija el pais
    salaryMin,
    salaryMax,
    currency,
    description: raw.description,
    url: raw.url,
  });
}

module.exports = { name: 'careerjet', fetchJobs, normalize };
