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

  jwtSecret: required('JWT_SECRET'),
  jwtExpira: process.env.JWT_EXPIRA || '7d',

  // epsilon-greedy: 0.15 => 15% de las ranuras se reservan a exploracion.
  epsilon: Number(process.env.MATCHING_EPSILON ?? 0.15),

  // Umbrales contra el fallo silencioso del coseno (ver matching.service.js).
  // Calibrados con datos reales: consultas validas superan 0.57; las absurdas
  // no pasan de 0.50.
  minTopScore: Number(process.env.MATCHING_MIN_TOP ?? 0.52),
  minItemScore: Number(process.env.MATCHING_MIN_ITEM ?? 0.42),

  openrouter: {
    apiKey: process.env.OPENROUTER_API_KEY,

    /**
     * CADENA de modelos, no uno solo. Los endpoints :free se saturan a ratos y
     * devuelven 429; si el primero esta caido, se usa el siguiente.
     *
     * Se descarto Llama 3.3 70B :free (el candidato obvio) porque es el gratuito
     * mas demandado y devuelve 429 casi siempre. Tambien se descartan los modelos
     * de razonamiento (nemotron-*-reasoning): sueltan su monologo interno dentro
     * de la respuesta y queman tokens.
     */
    modelos: (
      process.env.OPENROUTER_MODELS ||
      'google/gemma-4-31b-it:free,google/gemma-4-26b-a4b-it:free,openai/gpt-oss-20b:free'
    )
      .split(',')
      .map((m) => m.trim())
      .filter(Boolean),
    referer: process.env.OPENROUTER_REFERER || 'https://jobia.duckdns.org',
    // Tope de peticiones al LLM por usuario y dia. El plan gratuito da 50/dia
    // (1000/dia si se han cargado $10): sin tope, un solo usuario agota la cuota
    // de todos.
    limiteDiario: Number(process.env.LLM_LIMITE_DIARIO ?? 25),
  },

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

  remoteok: {
    url: process.env.REMOTEOK_URL || 'https://remoteok.com/api',
  },

  // Cada cuantas horas el worker vuelve a traer ofertas.
  ingestaHoras: Number(process.env.INGESTA_HORAS ?? 6),
};
