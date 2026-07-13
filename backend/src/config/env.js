// Unico punto donde se leen variables de entorno. Nada hardcodeado.
function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Falta la variable de entorno: ${name}`);
  return value;
}

module.exports = {
  port: Number(process.env.PORT || 3000),
  databaseUrl: required('DATABASE_URL'),
  redisUrl: required('REDIS_URL'),
  matchingUrl: process.env.MATCHING_URL || 'http://matching:8000',

  // epsilon-greedy: 0.15 => 15% de las ranuras se reservan a exploracion.
  epsilon: Number(process.env.MATCHING_EPSILON ?? 0.15),

  adzuna: {
    appId: process.env.ADZUNA_APP_ID,
    appKey: process.env.ADZUNA_APP_KEY,
  },

  jooble: {
    apiKey: process.env.JOOBLE_API_KEY,
    // Jooble da una clave por pais. Hoy: indice de EE.UU.
    // Con la clave de Ecuador -> JOOBLE_HOST=ec.jooble.org, JOOBLE_COUNTRY=Ecuador
    host: process.env.JOOBLE_HOST || 'jooble.org',
    country: process.env.JOOBLE_COUNTRY || 'Estados Unidos',
  },

  arbeitnow: {
    url: process.env.ARBEIT_NOW_URL || 'https://www.arbeitnow.com/api/job-board-api',
  },

  // Cada cuantas horas el worker vuelve a traer ofertas.
  ingestaHoras: Number(process.env.INGESTA_HORAS ?? 6),
};
