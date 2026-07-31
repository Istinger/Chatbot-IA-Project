const express = require('express');
const { ok, fail } = require('../../shared/envelope');
const service = require('./access.service');
const { esMovil } = require('./access.device');

const router = express.Router();

const ejecutar = (fn) => async (req, res) => {
  try {
    return ok(res, await fn(req, res));
  } catch (err) {
    return fail(res, err.message, err.status || 500);
  }
};

function requireAdminMovil(req, res, next) {
  if (!esMovil(req)) return fail(res, 'El panel solo esta disponible en telefono', 403);
  const admin = service.resolverAdmin(req);
  if (!admin) return fail(res, 'Sesion administrativa requerida', 401);
  req.demoAdmin = admin;
  return next();
}

router.get('/status', ejecutar((req, res) => service.estado(req, res)));
router.post('/request', ejecutar((req, res) => service.solicitar(req, res)));

router.post('/admin/login', ejecutar((req, res) => service.loginAdmin(req, res, req.body || {})));
router.post('/admin/logout', requireAdminMovil, (req, res) => {
  service.cerrarAdmin(req, res);
  return ok(res, { closed: true });
});
router.get('/admin/session', requireAdminMovil, (req, res) =>
  ok(res, { email: req.demoAdmin.email }));
router.get('/admin/devices', requireAdminMovil, ejecutar(() => service.listar()));
router.get('/admin/settings', requireAdminMovil, ejecutar(() => service.obtenerSettings()));
router.put('/admin/settings', requireAdminMovil, ejecutar((req) =>
  service.cambiarSettings(req.body?.allowAll)));
router.patch('/admin/devices/:id', requireAdminMovil, ejecutar((req) =>
  service.revisar(req.params.id, req.body?.status)));

module.exports = router;
