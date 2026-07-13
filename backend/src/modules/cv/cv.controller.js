const express = require('express');
const { ok, fail } = require('../../shared/envelope');
const { requireAuth } = require('../../shared/auth.middleware');
const service = require('./cv.service');

const router = express.Router();

router.use(requireAuth); // generar texto cuesta cuota: solo usuarios con sesion

/** POST /api/cv/summary — extracto profesional a partir del CV. */
router.post('/summary', async (req, res) => {
  try {
    return ok(res, await service.resumen(req.user.id));
  } catch (err) {
    return fail(res, err.message, err.status || 502);
  }
});

/** POST /api/cv/pitch  { jobId } — pitch adaptado a una oferta. */
router.post('/pitch', async (req, res) => {
  const { jobId } = req.body || {};
  if (!jobId) return fail(res, 'Falta jobId', 400);

  try {
    return ok(res, await service.pitch(req.user.id, jobId));
  } catch (err) {
    return fail(res, err.message, err.status || 502);
  }
});

module.exports = router;
