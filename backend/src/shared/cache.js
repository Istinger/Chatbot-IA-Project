const crypto = require('node:crypto');
const { connection } = require('../config/redis');

/**
 * Cache de texto generado por el LLM, en Redis.
 *
 * Mismo patron que ya usaba cv.service.js para los pitches: la clave incluye un
 * hash del contenido, asi que lo mismo no se paga dos veces. Es la diferencia
 * entre gastar la cuota una vez o cien.
 *
 * Acertar con la clave es responsabilidad de quien llama: debe incluir TODO lo
 * que cambia la respuesta (contenido de entrada + modelo). Si se cambia de
 * modelo, la clave cambia y no se sirve texto viejo escrito por otro.
 *
 * Si Redis no responde NO se rompe la funcionalidad: se genera y se sigue. Un
 * cache caido es un problema de coste, no de servicio.
 */

const SEMANA = 60 * 60 * 24 * 7;

/** Hash corto y estable de las partes que identifican el contenido. */
function hash(...partes) {
  return crypto.createHash('sha1').update(partes.join('|')).digest('hex').slice(0, 16);
}

/**
 * Devuelve lo guardado o ejecuta `generar()` y lo guarda.
 * @returns {Promise<{ texto: string, cacheado: boolean }>}
 */
async function cacheado(clave, generar, ttl = SEMANA) {
  try {
    const guardado = await connection.get(clave);
    if (guardado) return { texto: guardado, cacheado: true };
  } catch {
    /* cache caido: se genera igual */
  }

  const texto = await generar();

  try {
    await connection.set(clave, texto, 'EX', ttl);
  } catch {
    /* no poder guardar no invalida lo generado */
  }

  return { texto, cacheado: false };
}

module.exports = { cacheado, hash };
