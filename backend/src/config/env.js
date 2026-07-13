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
};
