const express = require('express');
const { Queue } = require('bullmq');
const { connection } = require('../../config/redis');
const { ok, fail } = require('../../shared/envelope');
const service = require('./jobs.service');

const router = express.Router();

// Misma cola que escucha el worker.
const cola = new Queue('ingesta', { connection });

const encolarIngesta = () => cola.add('ingesta-manual', {});

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
 * ENCOLA el trabajo y responde al instante. No lo ejecuta dentro del request:
 * la ingesta hace ~45 llamadas a APIs externas y vectoriza cientos de ofertas,
 * asi que tarda minutos y reventaba el timeout del proxy. Ademas, dejar una
 * peticion HTTP abierta esperando a APIs de terceros es una forma excelente de
 * tumbar el servidor.
 *
 * El progreso se sigue con GET /api/jobs/stats o en los logs del worker.
 */
router.post('/ingest', async (_req, res) => {
  try {
    const job = await encolarIngesta();
    return ok(
      res,
      {
        encolado: true,
        jobId: job.id,
        mensaje: 'Ingesta encolada. Sigue el progreso con GET /api/jobs/stats.',
      },
      202,
    );
  } catch (err) {
    return fail(res, err.message, 502);
  }
});

module.exports = router;
