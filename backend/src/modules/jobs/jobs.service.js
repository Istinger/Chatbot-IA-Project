const env = require('../../config/env');
const repo = require('./jobs.repository');
const { SOURCES } = require('./sources');

/**
 * Plan de ingesta.
 *
 * Objetivo: VOLUMEN y VARIEDAD reales. Antes se traian ~110 ofertas con una
 * consulta por fuente; ahora se pagina y se cubren varias areas (no solo
 * backend), porque el usuario del producto puede ser de datos, QA, soporte,
 * diseno o redes, no solo desarrollador.
 *
 * NOTA SOBRE ECUADOR: ninguna de las fuentes actuales cubre Ecuador.
 *   - Adzuna no soporta el pais (404).
 *   - La clave de Jooble esta atada al indice de EE.UU.; ec.jooble.org da 403.
 * El enfoque es REMOTO: ofertas a las que se puede postular desde Ecuador.
 * Para desbloquear ofertas locales hay que conseguir credenciales (ver DEPLOY.md).
 */
const BUSQUEDAS = [
  'backend developer',
  'frontend developer',
  'full stack developer',
  'data analyst',
  'qa tester',
  'devops',
  'soporte tecnico',
  'diseñador ux',
];

const BUSQUEDAS_ES = [
  'desarrollador',
  'programador',
  'analista de datos',
  'soporte tecnico',
];

/** Adzuna: varias areas x varios paises x varias paginas. 50 resultados por pagina. */
function planAdzuna() {
  const pasos = [];

  for (const what of BUSQUEDAS) {
    for (const page of [1, 2]) {
      pasos.push({
        source: 'adzuna',
        query: { what: `remote ${what}`, country: 'us', page, resultsPerPage: 50 },
      });
    }
  }

  // Mercado hispanohablante: mas afin a un egresado ecuatoriano.
  for (const what of BUSQUEDAS_ES) {
    for (const country of ['es', 'mx']) {
      pasos.push({
        source: 'adzuna',
        query: { what: `${what} remoto`, country, page: 1, resultsPerPage: 50 },
      });
    }
  }

  return pasos;
}

function planJooble() {
  const pasos = [];
  for (const what of [...BUSQUEDAS.slice(0, 5), ...BUSQUEDAS_ES.slice(0, 2)]) {
    for (const page of [1, 2]) {
      pasos.push({ source: 'jooble', query: { what, location: 'remote', page } });
    }
  }
  return pasos;
}

const PLAN = [
  ...planAdzuna(),
  ...planJooble(),
  // ArbeitNow: tablon paginado, sin filtro de busqueda en la API.
  { source: 'arbeitnow', query: { page: 1, onlyRemote: true } },
  { source: 'arbeitnow', query: { page: 2, onlyRemote: true } },
  { source: 'arbeitnow', query: { page: 3, onlyRemote: true } },
  // RemoteOK: devuelve el tablon completo de una vez. Sin `what` = todas.
  { source: 'remoteok', query: {} },

  // Careerjet: la unica fuente con ofertas de ECUADOR. Si falta CAREERJET_AFFID
  // lanza un error que la ingesta registra y sigue: no rompe nada.
  { source: 'careerjet', query: { what: 'desarrollador', location: 'Ecuador' } },
  { source: 'careerjet', query: { what: 'sistemas', location: 'Quito' } },
  { source: 'careerjet', query: { what: 'tecnologia', location: 'Guayaquil' } },
];

/**
 * Pide al microservicio Python que vectorice las ofertas nuevas.
 * Es idempotente: solo toca las que tienen embedding NULL.
 */
async function vectorizar() {
  const res = await fetch(`${env.matchingUrl}/embed/jobs`, {
    method: 'POST',
    signal: AbortSignal.timeout(300000), // un lote grande tarda
  });
  if (!res.ok) throw new Error(`matching-service respondio ${res.status}`);
  return res.json();
}

/**
 * Ingesta completa: fuentes -> normalizar -> guardar -> vectorizar.
 *
 * Corre en el worker (programada), NUNCA en el request de un usuario: por eso el
 * chatbot y la busqueda no llaman jamas a una API externa. Todo sale de Postgres.
 *
 * Si una fuente falla, las demas siguen: una API caida no debe tumbar la ingesta.
 */
async function ingest({ plan = PLAN } = {}) {
  const resumen = { fuentes: {}, creadas: 0, actualizadas: 0, duplicadas: 0, errores: [] };

  for (const paso of plan) {
    const source = SOURCES[paso.source];
    if (!source) {
      resumen.errores.push(`Fuente desconocida: ${paso.source}`);
      continue;
    }

    try {
      const crudas = await source.fetchJobs(paso.query);
      const normalizadas = crudas
        .map((r) => source.normalize(r))
        // Una oferta sin enlace es inutil: el usuario no puede postular. Se
        // descarta en vez de mostrarla y frustrarlo.
        .filter((j) => j.url && j.title);

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
      resumen.duplicadas += duplicadas;
    } catch (err) {
      resumen.errores.push(`${paso.source} (${paso.query.what || 'sin filtro'}): ${err.message}`);
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
