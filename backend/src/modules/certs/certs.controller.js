const express = require('express');
const { ok, fail } = require('../../shared/envelope');
const { requireAuth } = require('../../shared/auth.middleware');
const service = require('./certs.service');

const router = express.Router();

/**
 * GET /api/certs/suggestions
 *
 * Exige sesion: el analisis se hace contra las skills del perfil. Sin perfil no
 * hay brecha que medir.
 */
router.get('/suggestions', requireAuth, async (req, res) => {
  try {
    return ok(res, await service.suggestions(req.user.id));
  } catch (err) {
    return fail(res, err.message, err.status || 500);
  }
});

module.exports = router;
