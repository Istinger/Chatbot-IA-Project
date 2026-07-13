const jwt = require('jsonwebtoken');
const env = require('../config/env');
const { prisma } = require('../config/db');
const { fail } = require('./envelope');

/** Lee el token de `Authorization: Bearer <token>`. Devuelve null si no hay. */
function leerToken(req) {
  const header = req.headers.authorization || '';
  const [tipo, token] = header.split(' ');
  return tipo === 'Bearer' && token ? token : null;
}

/**
 * Resuelve el usuario del token y lo cuelga en req.user (con su profileId, que
 * es lo que necesita el matching). No corta la peticion si no hay token.
 */
async function resolver(req) {
  const token = leerToken(req);
  if (!token) return null;

  let payload;
  try {
    payload = jwt.verify(token, env.jwtSecret);
  } catch {
    return null; // token invalido o caducado
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: { id: true, email: true, profile: { select: { id: true } } },
  });

  if (!user) return null;

  return { id: user.id, email: user.email, profileId: user.profile?.id ?? null };
}

/** Exige sesion. Si no hay token valido -> 401. */
async function requireAuth(req, res, next) {
  const user = await resolver(req);
  if (!user) return fail(res, 'Necesitas iniciar sesion', 401);
  req.user = user;
  return next();
}

/**
 * Sesion opcional: si hay token, rellena req.user; si no, sigue igual.
 * Lo usa la busqueda por texto libre, que debe funcionar sin estar logueado.
 */
async function optionalAuth(req, _res, next) {
  req.user = await resolver(req);
  return next();
}

module.exports = { requireAuth, optionalAuth };
