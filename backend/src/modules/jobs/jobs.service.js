const env = require('../../config/env');
const repo = require('./jobs.repository');
const { SOURCES } = require('./sources');

/**
 * Que se busca en cada ingesta. Como no hay fuente para Ecuador (ni Adzuna ni
 * Jooble lo cubren hoy), el foco es REMOTO: ofertas a las que un egresado
 * ecuatoriano puede postular desde casa.
 */
const PLAN = [
  { source: 'adzuna', query: { what: 'remote backend developer', country: 'us' } },
  { source: 'adzuna', query: { what: 'remote frontend developer', country: 'us' } },
  { source: 'adzuna', query: { what: 'remote data analyst', country: 'us' } },
  { source: 'adzuna', query: { what: 'desarrollador remoto', country: 'es' } },
  { source: 'adzuna', query: { what: 'desarrollador remoto', country: 'mx' } },
  { source: 'jooble', query: { what: 'remote developer', location: 'remote' } },
  { source: 'jooble', query: { what: 'desarrollador remoto' } },
  { source: 'arbeitnow', query: { what: 'developer engineer', onlyRemote: true } },
  // RemoteOK: 100% remoto y sin clave. Portado del backend de Alan.
  { source: 'remoteok', query: { what: 'developer engineer data' } },
];

/**
 * Pide al microservicio Python que vectorice las ofertas nuevas.
 * Es idempotente: solo toca las que tienen embedding NULL.
 */
async function vectorizar() {
  const res = await fetch(`${env.matchingUrl}/embed/jobs`, {
    method: 'POST',
    signal: AbortSignal.timeout(120000), // vectorizar un lote grande tarda
  });
  if (!res.ok) throw new Error(`matching-service respondio ${res.status}`);
  return res.json();
}

/**
 * Ingesta completa: fuentes -> normalizar -> guardar -> vectorizar.
 *
 * Corre en el worker (programada), NUNCA en el request de un usuario.
 * Si una fuente falla, las demas siguen: una API caida no debe tumbar la ingesta.
 */
async function ingest({ plan = PLAN } = {}) {
  const resumen = { fuentes: {}, creadas: 0, actualizadas: 0, errores: [] };

  for (const paso of plan) {
    const source = SOURCES[paso.source];
    if (!source) {
      resumen.errores.push(`Fuente desconocida: ${paso.source}`);
      continue;
    }

    try {
      const crudas = await source.fetchJobs(paso.query);
      const normalizadas = crudas.map((r) => source.normalize(r));

      // Deduplicar por (titulo, empresa). La ubicacion se excluye a proposito:
      // un mismo puesto remoto llega repetido en decenas de ciudades.
      const unicas = [
        ...new Map(
          normalizadas.map((j) => [`${j.title}|${j.company}`.toLowerCase(), j]),
        ).values(),
      ];

      const { creadas, actualizadas, duplicadas } = await repo.upsertMany(unicas);

      const acc =
        resumen.fuentes[paso.source] ||
        { traidas: 0, creadas: 0, actualizadas: 0, duplicadas: 0 };
      acc.traidas += crudas.length;
      acc.creadas += creadas;
      acc.actualizadas += actualizadas;
      acc.duplicadas += duplicadas;
      resumen.fuentes[paso.source] = acc;

      resumen.creadas += creadas;
      resumen.actualizadas += actualizadas;
      resumen.duplicadas = (resumen.duplicadas || 0) + duplicadas;
    } catch (err) {
      resumen.errores.push(`${paso.source} (${paso.query.what}): ${err.message}`);
    }
  }

  // Vectorizar al final, una sola vez para todo el lote.
  try {
    resumen.vectorizadas = (await vectorizar()).updated;
  } catch (err) {
    resumen.errores.push(`vectorizacion: ${err.message}`);
  }

  return resumen;
}

module.exports = { ingest, list: repo.list, stats: repo.stats, PLAN };
