const express = require('express');
const { ok, fail } = require('../../shared/envelope');
const { requireAuth } = require('../../shared/auth.middleware');
const service = require('./portafolio.service');

const router = express.Router();

router.use(requireAuth); // personalizar usa el perfil: solo con sesion

/** GET /api/portafolio/ideas — 4 ideas (1 destacada), adaptadas al perfil. */
router.get('/ideas', async (req, res) => {
  try {
    return ok(res, await service.ideas(req.user.id));
  } catch (err) {
    return fail(res, err.message, err.status || 502);
  }
});

/** GET /api/portafolio/ideas/:id — una idea (para deep-link/refresh del detalle). */
router.get('/ideas/:id', async (req, res) => {
  try {
    return ok(res, await service.idea(req.user.id, req.params.id));
  } catch (err) {
    return fail(res, err.message, err.status || 502);
  }
});

module.exports = router;
