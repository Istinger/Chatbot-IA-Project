const { connection } = require('../config/redis');

/**
 * Tope de peticiones al LLM por usuario y dia, en Redis.
 *
 * No es antifraude: es proteger la CUOTA. El plan gratuito de OpenRouter da 50
 * peticiones/dia (1000 si se han cargado $10 alguna vez). Sin tope, un solo
 * usuario cachondeandose con el chat deja sin servicio a todos los demas, y en
 * mitad de una demo eso es fatal.
 *
 * La clave lleva la fecha, asi que la ventana se reinicia sola cada dia; el TTL
 * limpia la basura sin cron.
 */
async function consumir(identidad, limite) {
  const hoy = new Date().toISOString().slice(0, 10);
  const clave = `llm:${hoy}:${identidad}`;

  const usadas = await connection.incr(clave);

  // Solo al crearla: si no, el TTL se renovaria en cada peticion y la ventana
  // nunca cerraria.
  if (usadas === 1) await connection.expire(clave, 60 * 60 * 26);

  return { permitido: usadas <= limite, usadas, limite };
}

module.exports = { consumir };
