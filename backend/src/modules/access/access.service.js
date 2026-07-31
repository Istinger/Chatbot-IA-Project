const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { prisma } = require('../../config/db');
const { connection } = require('../../config/redis');
const env = require('../../config/env');
const {
  COOKIE_ADMIN,
  COOKIE_DEVICE,
  crearTokenDispositivo,
  esMovil,
  hashToken,
  ipCliente,
  serializarCookie,
  tokenAdmin,
  tokenDispositivo,
} = require('./access.device');

class AccessError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

function resumenDispositivo(registro) {
  if (!registro) return null;
  return {
    id: registro.id,
    ip: registro.ip,
    userAgent: registro.userAgent,
    status: registro.status,
    requestedAt: registro.requestedAt,
    reviewedAt: registro.reviewedAt,
    lastSeenAt: registro.lastSeenAt,
  };
}

function asegurarToken(req, res) {
  let token = tokenDispositivo(req);
  if (token) return token;

  token = crearTokenDispositivo();
  const segundos = env.demoAccess.deviceCookieDays * 24 * 60 * 60;
  res.append(
    'Set-Cookie',
    serializarCookie(COOKIE_DEVICE, token, req, { maxAge: segundos, sameSite: 'Lax' }),
  );
  return token;
}

async function estado(req, res) {
  const token = asegurarToken(req, res);
  const [registro, settings] = await Promise.all([
    prisma.deviceAccess.findUnique({
      where: { tokenHash: hashToken(token) },
    }),
    obtenerSettings(),
  ]);

  return {
    mobile: esMovil(req),
    status: !esMovil(req) && settings.allowAll
      ? 'approved'
      : registro?.status || 'not_requested',
    allowAll: settings.allowAll,
    device: resumenDispositivo(registro),
  };
}

async function solicitar(req, res) {
  if (esMovil(req)) throw new AccessError('Jobia solo esta disponible en computadoras', 403);

  const token = asegurarToken(req, res);
  const tokenHash = hashToken(token);
  const ip = ipCliente(req);
  const userAgent = String(req.headers['user-agent'] || '').slice(0, 500);
  const existente = await prisma.deviceAccess.findUnique({ where: { tokenHash } });

  const registro = existente?.status === 'approved'
    ? await prisma.deviceAccess.update({
      where: { tokenHash },
      data: { ip, userAgent, lastSeenAt: new Date() },
    })
    : await prisma.deviceAccess.upsert({
      where: { tokenHash },
      create: { tokenHash, ip, userAgent, status: 'pending' },
      update: {
        ip,
        userAgent,
        status: 'pending',
        requestedAt: new Date(),
        reviewedAt: null,
        lastSeenAt: new Date(),
      },
    });

  return { status: registro.status, device: resumenDispositivo(registro) };
}

async function limitarLogin(ip) {
  const clave = `demo-admin-login:${ip}`;
  const intentos = await connection.incr(clave);
  if (intentos === 1) await connection.expire(clave, 15 * 60);
  if (intentos > 8) {
    throw new AccessError('Demasiados intentos. Espera 15 minutos.', 429);
  }
}

async function loginAdmin(req, res, { email, password }) {
  if (!esMovil(req)) throw new AccessError('El panel solo esta disponible en telefono', 403);
  if (!env.demoAccess.adminPasswordHash) {
    throw new AccessError('El acceso administrativo no esta configurado', 503);
  }

  const ip = ipCliente(req);
  await limitarLogin(ip);
  const correo = String(email || '').trim().toLowerCase();
  const claveValida = await bcrypt.compare(
    String(password || ''),
    env.demoAccess.adminPasswordHash,
  );
  if (correo !== env.demoAccess.adminEmail || !claveValida) {
    throw new AccessError('Correo o contrasena incorrectos', 401);
  }

  await connection.del(`demo-admin-login:${ip}`);
  const token = jwt.sign(
    { scope: 'demo-admin', email: correo },
    env.demoAccess.adminJwtSecret,
    { expiresIn: env.demoAccess.adminExpira },
  );
  res.append(
    'Set-Cookie',
    serializarCookie(COOKIE_ADMIN, token, req, {
      maxAge: 8 * 60 * 60,
      sameSite: 'Strict',
    }),
  );
  return { email: correo };
}

function resolverAdmin(req) {
  const token = tokenAdmin(req);
  if (!token) return null;
  try {
    const payload = jwt.verify(token, env.demoAccess.adminJwtSecret);
    return payload.scope === 'demo-admin' ? payload : null;
  } catch {
    return null;
  }
}

function cerrarAdmin(req, res) {
  res.append(
    'Set-Cookie',
    serializarCookie(COOKIE_ADMIN, '', req, { maxAge: 0, sameSite: 'Strict' }),
  );
}

async function listar() {
  const registros = await prisma.deviceAccess.findMany({
    orderBy: [{ status: 'asc' }, { requestedAt: 'desc' }],
    take: 200,
  });
  return registros.map(resumenDispositivo);
}

async function obtenerSettings() {
  return prisma.demoAccessSettings.upsert({
    where: { id: 'main' },
    create: { id: 'main', allowAll: false },
    update: {},
  });
}

async function cambiarSettings(allowAll) {
  if (typeof allowAll !== 'boolean') {
    throw new AccessError('El valor de acceso libre debe ser booleano', 400);
  }
  return prisma.demoAccessSettings.upsert({
    where: { id: 'main' },
    create: { id: 'main', allowAll },
    update: { allowAll },
  });
}

async function revisar(id, status) {
  if (!['approved', 'rejected', 'revoked'].includes(status)) {
    throw new AccessError('Estado de revision invalido', 400);
  }
  try {
    const registro = await prisma.deviceAccess.update({
      where: { id },
      data: { status, reviewedAt: new Date() },
    });
    return resumenDispositivo(registro);
  } catch (err) {
    if (err.code === 'P2025') throw new AccessError('Solicitud no encontrada', 404);
    throw err;
  }
}

module.exports = {
  AccessError,
  cerrarAdmin,
  cambiarSettings,
  estado,
  listar,
  loginAdmin,
  resolverAdmin,
  revisar,
  solicitar,
  obtenerSettings,
};
