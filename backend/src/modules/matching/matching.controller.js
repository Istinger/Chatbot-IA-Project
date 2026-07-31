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

/**
 * POST /api/matching/reformular  { texto } -> { consulta, cambiada }
 *
 * Reescribe una busqueda en lenguaje natural como consulta AFIRMATIVA, porque el
 * buscador es semantico y las negaciones lo confunden (ver matching.service).
 *
 * NO se hace por /chat a proposito: ese endpoint persiste cada mensaje y
 * alimenta el historial de la conversacion, asi que reescribir busquedas por ahi
 * ensuciaria el chat del usuario.
 *
 * Nunca falla hacia fuera: si el LLM no responde o no hay cuota, devuelve el
 * texto original y la busqueda sigue su curso.
 */
router.post('/reformular', optionalAuth, async (req, res) => {
  const texto = req.body?.texto;
  if (!texto) return fail(res, 'Falta el texto de la busqueda', 400);

  // Los visitantes tambien consumen cuota: se les limita por su IP.
  const identidad = req.user?.id || `anon:${req.ip}`;
  return ok(res, await service.reformular(texto, identidad));
});

module.exports = router;
