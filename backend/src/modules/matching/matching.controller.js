const express = require('express');
const { ok, fail } = require('../../shared/envelope');
const service = require('./matching.service');

const router = express.Router();

/**
 * GET /api/matching/jobs?profileId=...&limit=10
 * GET /api/matching/jobs?text=remoto junior backend sin ingles
 *
 * Ranking por similitud de coseno + epsilon-greedy. Sin LLM.
 */
router.get('/jobs', async (req, res) => {
  const { profileId, text } = req.query;
  const limit = Math.min(Number(req.query.limit) || 10, 50);

  if (!profileId && !text) {
    return fail(res, 'Indica profileId o text', 400);
  }

  try {
    const jobs = await service.suggestJobs({ profileId, text, limit });
    return ok(res, { count: jobs.length, jobs });
  } catch (err) {
    if (err.status === 404) return fail(res, 'Perfil no encontrado', 404);
    if (err.status === 409) return fail(res, 'El perfil aun no tiene embedding', 409);
    return fail(res, err.message, 502);
  }
});

module.exports = router;
