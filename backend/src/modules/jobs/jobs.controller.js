const express = require('express');
const { ok, fail } = require('../../shared/envelope');
const service = require('./jobs.service');

const router = express.Router();

/**
 * GET /api/jobs?scope=local|foreign&q=react&limit=20&page=1
 *
 * Listado plano, SIN IA: filtros de base de datos. El ranking por afinidad vive
 * en /api/matching/jobs.
 */
router.get('/', async (req, res) => {
  const { scope, q } = req.query;
  const limit = Math.min(Number(req.query.limit) || 20, 100);
  const page = Math.max(Number(req.query.page) || 1, 1);

  if (scope && !['local', 'foreign'].includes(scope)) {
    return fail(res, 'scope debe ser "local" o "foreign"', 400);
  }

  try {
    return ok(res, await service.list({ scope, q, limit, page }));
  } catch (err) {
    return fail(res, err.message, 500);
  }
});

/** GET /api/jobs/stats — cuantas ofertas hay, por fuente, y cuantas sin vectorizar. */
router.get('/stats', async (_req, res) => {
  try {
    return ok(res, await service.stats());
  } catch (err) {
    return fail(res, err.message, 500);
  }
});

/**
 * POST /api/jobs/ingest — dispara la ingesta a mano.
 *
 * En produccion esto lo hace el worker de forma programada; el endpoint existe
 * para poder demostrarlo y depurarlo. Tarda decenas de segundos.
 */
router.post('/ingest', async (_req, res) => {
  try {
    const resumen = await service.ingest();
    return ok(res, resumen);
  } catch (err) {
    return fail(res, err.message, 502);
  }
});

module.exports = router;
