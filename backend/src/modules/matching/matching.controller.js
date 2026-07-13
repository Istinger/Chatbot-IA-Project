const express = require('express');
const { ok, fail } = require('../../shared/envelope');
const { optionalAuth } = require('../../shared/auth.middleware');
const service = require('./matching.service');

const router = express.Router();

/**
 * GET /api/matching/jobs
 *
 * Dos modos:
 *   - Con sesion (Bearer token) y sin `text` -> ofertas afines A TU PERFIL.
 *   - Con `?text=...` -> busqueda por lenguaje natural, no necesita sesion.
 *     Es la barra de busqueda de DESIGN.md ("remoto junior backend sin ingles").
 *
 * Ranking: similitud de coseno + epsilon-greedy. Sin LLM.
 */
router.get('/jobs', optionalAuth, async (req, res) => {
  const { text } = req.query;
  const limit = Math.min(Number(req.query.limit) || 10, 50);

  // El texto libre manda; si no lo hay, se usa el perfil del usuario logueado.
  const profileId = text ? null : req.user?.profileId;

  if (!text && !profileId) {
    return fail(res, 'Inicia sesion o envia el parametro "text"', 401);
  }

  try {
    const jobs = await service.suggestJobs({ profileId, text, limit });
    return ok(res, { count: jobs.length, jobs });
  } catch (err) {
    if (err.status === 404) return fail(res, 'Perfil no encontrado', 404);
    if (err.status === 409) {
      return fail(res, 'Tu perfil aun no tiene CV ni skills: sube tu CV primero', 409);
    }
    return fail(res, err.message, 502);
  }
});

module.exports = router;
