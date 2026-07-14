const express = require('express');
const { ok, fail } = require('../../shared/envelope');
const { requireAuth } = require('../../shared/auth.middleware');
const service = require('./notifications.service');

const router = express.Router();

// Todo el modulo exige sesion: los avisos son de un usuario concreto.
router.use(requireAuth);

/** GET /api/notifications  -> estado de la vinculacion */
router.get('/', async (req, res) => {
  try {
    return ok(res, await service.estado(req.user.id));
  } catch (err) {
    return fail(res, err.message, err.status || 500);
  }
});

/**
 * POST /api/notifications/telegram/code
 * Genera el codigo y el enlace t.me/<bot>?start=<codigo>.
 */
router.post('/telegram/code', async (req, res) => {
  try {
    return ok(res, await service.generarCodigo(req.user.id));
  } catch (err) {
    return fail(res, err.message, err.status || 500);
  }
});

/** DELETE /api/notifications/telegram  -> dejar de recibir avisos */
router.delete('/telegram', async (req, res) => {
  try {
    return ok(res, await service.desvincular(req.user.id));
  } catch (err) {
    return fail(res, err.message, err.status || 500);
  }
});

/** PUT /api/notifications/umbral   { minScore: 0.7 } */
router.put('/umbral', async (req, res) => {
  try {
    return ok(res, await service.setUmbral(req.user.id, req.body.minScore));
  } catch (err) {
    return fail(res, err.message, err.status || 500);
  }
});

module.exports = router;
