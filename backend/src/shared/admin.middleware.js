const crypto = require('node:crypto');
const env = require('../config/env');
const { fail } = require('./envelope');

/**
 * Puerta de las rutas de diagnostico (hoy: GET /health/llm, que expone tokens y
 * coste acumulado).
 *
 * No usa el JWT de usuario porque el modelo User no tiene rol y no merece una
 * migracion de esquema para esto: es un secreto compartido en el .env.
 *
 * Dos decisiones que importan:
 *
 *  1. Si ADMIN_TOKEN esta vacio, la ruta responde 404, no 401. Un despliegue sin
 *     configurar NO debe dejar el endpoint abierto, y devolver 404 tampoco
 *     delata que la ruta existe.
 *  2. La comparacion es en tiempo constante. Comparar con === filtra informacion
 *     por el tiempo de respuesta, y este token no caduca ni se rota solo.
 */
function tokenValido(recibido) {
  const esperado = env.adminToken;
  if (!esperado || !recibido) return false;

  const a = Buffer.from(recibido);
  const b = Buffer.from(esperado);

  // timingSafeEqual revienta si las longitudes difieren; comprobarlo antes no
  // filtra nada util (la longitud del token no es el secreto).
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function requireAdmin(req, res, next) {
  if (!env.adminToken) return fail(res, 'Ruta no encontrada', 404);
  if (!tokenValido(req.headers['x-admin-token'])) {
    return fail(res, 'Ruta no encontrada', 404);
  }
  return next();
}

module.exports = { requireAdmin };
