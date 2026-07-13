const env = require('../../../config/env');
const { toJob } = require('../normalize');

/**
 * Adzuna. La mejor fuente: trae salario NUMERICO (salary_min / salary_max),
 * que es justo lo que necesita la feature "cuanto te van a pagar".
 *
 * Ecuador NO esta soportado (la API devuelve 404). Paises validos:
 * at au be br ca ch de es fr gb in it mx nl nz pl sg us za
 */
const PAISES = {
  us: 'Estados Unidos',
  gb: 'Reino Unido',
  es: 'Espana',
  mx: 'Mexico',
  br: 'Brasil',
  ca: 'Canada',
  de: 'Alemania',
  fr: 'Francia',
  it: 'Italia',
  nl: 'Paises Bajos',
  au: 'Australia',
  in: 'India',
};

const BASE = 'https://api.adzuna.com/v1/api/jobs';

async function fetchJobs({ what, country = 'us', page = 1, resultsPerPage = 20 }) {
  if (!env.adzuna.appId || !env.adzuna.appKey) {
    throw new Error('Faltan ADZUNA_APP_ID / ADZUNA_APP_KEY en el .env');
  }
  if (!PAISES[country]) {
    throw new Error(`Adzuna no cubre "${country}". Paises: ${Object.keys(PAISES).join(', ')}`);
  }

  const qs = new URLSearchParams({
    app_id: env.adzuna.appId,
    app_key: env.adzuna.appKey,
    results_per_page: String(resultsPerPage),
    what,
    'content-type': 'application/json', // ojo: parametro de query, no cabecera
  });

  const res = await fetch(`${BASE}/${country}/search/${page}?${qs}`, {
    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok) {
    throw new Error(`Adzuna respondio ${res.status}: ${await res.text().catch(() => '')}`);
  }

  const body = await res.json();
  return (body.results || []).map((r) => ({ ...r, _country: country }));
}

function normalize(raw) {
  return toJob({
    source: 'adzuna',
    externalId: String(raw.id),
    title: raw.title,
    company: raw.company?.display_name,
    location: raw.location?.display_name,
    country: PAISES[raw._country],
    salaryMin: raw.salary_min ?? null,
    salaryMax: raw.salary_max ?? null,
    // "1" = Adzuna ESTIMO el sueldo; la empresa no lo publico. La UI debe
    // marcarlo como estimado en vez de presentarlo como un hecho.
    salaryPredicted: String(raw.salary_is_predicted) === '1',
    description: raw.description,
    url: raw.redirect_url,
    extraSkillText: raw.category?.label || '',
  });
}

module.exports = { name: 'adzuna', fetchJobs, normalize, PAISES };
