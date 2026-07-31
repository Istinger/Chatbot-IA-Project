const { prisma } = require('../config/db');
const { fail } = require('./envelope');
const {
  esMovil,
  hashToken,
  tokenDispositivo,
} = require('../modules/access/access.device');

async function requireDeviceAccess(req, res, next) {
  try {
    if (esMovil(req)) {
      return fail(res, 'Jobia solo esta disponible en computadoras autorizadas', 403);
    }

    const settings = await prisma.demoAccessSettings.findUnique({ where: { id: 'main' } });
    if (settings?.allowAll) return next();

    const token = tokenDispositivo(req);
    if (!token) return fail(res, 'Esta computadora necesita autorizacion', 403);

    const registro = await prisma.deviceAccess.findUnique({
      where: { tokenHash: hashToken(token) },
      select: { status: true },
    });
    if (registro?.status !== 'approved') {
      return fail(res, 'Esta computadora necesita autorizacion', 403);
    }
    return next();
  } catch (err) {
    return fail(res, `No se pudo comprobar el acceso: ${err.message}`, 500);
  }
}

module.exports = { requireDeviceAccess };
