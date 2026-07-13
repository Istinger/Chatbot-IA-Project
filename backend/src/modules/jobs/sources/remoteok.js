const env = require('../../../config/env');
const { toJob } = require('../normalize');

/**
 * RemoteOK. Publica, sin clave, y 100% remoto: encaja con el enfoque del
 * producto (trabajo remoto al que se puede postular desde Ecuador).
 *
 * Portado del backend de Alan (Backend_Job_AI), con tres correcciones:
 *
 *  1. El PRIMER elemento del array NO es una oferta: es un aviso legal
 *     ({legal: "API Terms of Service..."}). Su version lo convertia en una
 *     oferta fantasma con titulo vacio. Aqui se descarta.
 *  2. Leia `item.salary`, un campo que la API no devuelve: los reales son
 *     `salary_min` / `salary_max`. Por eso nunca capturaba sueldos.
 *  3. La API responde el tablon completo sin filtro de busqueda; el filtrado
 *     por palabra clave se hace aqui, en memoria.
 *
 * Sus terminos de servicio piden enlazar de vuelta a la oferta: por eso se
 * guarda `url` y el frontend siempre enlaza a la fuente.
 */
const URL = 'https://remoteok.com/api';

async function fetchJobs({ what = '' } = {}) {
  const res = await fetch(env.remoteok.url || URL, {
    // Sin User-Agent, algunos proxies de RemoteOK rechazan la peticion.
    headers: { 'User-Agent': 'Jobia/1.0 (agente de empleo academico)' },
    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok) throw new Error(`RemoteOK respondio ${res.status}`);

  const body = await res.json();

  // Descartar el aviso legal de la posicion 0.
  const ofertas = (Array.isArray(body) ? body : []).filter((j) => j?.id && j?.position);

  if (!what) return ofertas;

  const terminos = what.toLowerCase().split(/\s+/).filter(Boolean);
  return ofertas.filter((j) => {
    const texto = `${j.position} ${(j.tags || []).join(' ')}`.toLowerCase();
    return terminos.some((t) => texto.includes(t));
  });
}

function normalize(raw) {
  // 0 significa "sin dato" en RemoteOK, no "sueldo cero".
  const min = Number(raw.salary_min) || null;
  const max = Number(raw.salary_max) || null;

  return toJob({
    source: 'remoteok',
    externalId: String(raw.id),
    title: raw.position,
    company: raw.company,
    location: raw.location ? `${raw.location} (remoto)` : 'Remoto',
    // Sin pais concreto -> isForeign queda en true, que es lo correcto.
    country: null,
    salaryMin: min,
    salaryMax: max,
    currency: 'USD', // RemoteOK publica siempre en USD
    description: raw.description,
    url: raw.url || raw.apply_url,
    extraSkillText: (raw.tags || []).join(' '),
  });
}

module.exports = { name: 'remoteok', fetchJobs, normalize };
