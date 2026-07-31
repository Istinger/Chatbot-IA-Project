const crypto = require('node:crypto');
const { connection } = require('../config/redis');

/**
 * Cache de texto generado por el LLM, en Redis.
 *
 * Es la pieza que separa "gastar la cuota una vez" de "gastarla cien". La
 * responsabilidad de acertar con la clave es de quien llama: debe incluir TODO
 * lo que cambia la respuesta (contenido de entrada + modelo). Si el modelo
 * cambia, la clave cambia y no se sirve texto viejo escrito por otro.
 *
 * Vivia duplicada en cv, portafolio e interview; esta aqui para que haya una
 * sola definicion de `hash` y un solo TTL por defecto.
 */
const TTL_SEMANA = 60 * 60 * 24 * 7;

/** Firma corta y estable de un conjunto de partes. */
function hash(...partes) {
  return crypto.createHash('sha1').update(partes.join('|')).digest('hex').slice(0, 16);
}

/**
 * Devuelve lo guardado o ejecuta `generar()` y lo guarda.
 * @returns {Promise<{ texto: string, cacheado: boolean }>}
 */
async function cacheado(clave, generar, ttl = TTL_SEMANA) {
  const guardado = await connection.get(clave);
  if (guardado) return { texto: guardado, cacheado: true };

  const texto = await generar();
  await connection.set(clave, texto, 'EX', ttl);
  return { texto, cacheado: false };
}

module.exports = { cacheado, hash, TTL_SEMANA };
