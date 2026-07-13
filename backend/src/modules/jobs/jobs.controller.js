const express = require('express');
const { Queue } = require('bullmq');
const { connection } = require('../../config/redis');
const { ok, fail } = require('../../shared/envelope');
const { requireAuth } = require('../../shared/auth.middleware');
const service = require('./jobs.service');

const router = express.Router();

// Misma cola que escucha el worker.
const cola = new Queue('ingesta', { connection });

/** Espera minima entre refrescos manuales. */
const ENFRIAMIENTO_MIN = 10;

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

/**
 * GET /api/jobs/stats — cuantas ofertas hay, por fuente, cuando se refrescaron
 * por ultima vez y si hay una ingesta en curso.
 */
router.get('/stats', async (_req, res) => {
  try {
    const [stats, ultima, enCurso] = await Promise.all([
      service.stats(),
      connection.get('ingesta:ultima'),
      connection.get('ingesta:enCurso'),
    ]);

    const info = ultima ? JSON.parse(ultima) : null;

    return ok(res, {
      ...stats,
      ultimaActualizacion: info?.fecha ?? null,
      ultimoResumen: info?.resumen ?? null,
      enCurso: Boolean(enCurso),
      // Cada cuanto la refresca el worker por su cuenta.
      cadaHoras: Number(process.env.INGESTA_HORAS ?? 6),
    });
  } catch (err) {
    return fail(res, err.message, 500);
  }
});

/**
 * POST /api/jobs/ingest — refrescar las ofertas AHORA.
 *
 * ENCOLA y responde al instante: la ingesta hace ~60 llamadas a APIs externas y
 * vectoriza cientos de ofertas, asi que tarda minutos. Ejecutarla dentro del
 * request reventaba el timeout del proxy.
 *
 * Exige sesion y tiene enfriamiento: sin eso, cualquiera podria martillear el
 * boton y agotar la cuota de Adzuna y Jooble en un rato.
 */
router.post('/ingest', requireAuth, async (_req, res) => {
  try {
    if (await connection.get('ingesta:enCurso')) {
      return fail(res, 'Ya hay una actualizacion en curso. Espera a que termine.', 409);
    }

    const enfriando = await connection.get('ingesta:enfriamiento');
    if (enfriando) {
      const restan = await connection.ttl('ingesta:enfriamiento');
      return fail(
        res,
        `Las ofertas se acaban de actualizar. Vuelve a intentarlo en ${Math.ceil(restan / 60)} min.`,
        429,
      );
    }

    await connection.set('ingesta:enfriamiento', '1', 'EX', ENFRIAMIENTO_MIN * 60);
    const job = await cola.add('ingesta-manual', {});

    return ok(
      res,
      {
        encolado: true,
        jobId: job.id,
        mensaje: 'Buscando ofertas nuevas. Tarda unos minutos; puedes seguir navegando.',
      },
      202,
    );
  } catch (err) {
    return fail(res, err.message, 502);
  }
});

module.exports = router;
