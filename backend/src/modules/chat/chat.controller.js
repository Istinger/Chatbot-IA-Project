const express = require('express');
const { ok, fail } = require('../../shared/envelope');
const { optionalAuth } = require('../../shared/auth.middleware');
const { prisma } = require('../../config/db');
const jobs = require('../jobs/jobs.repository');
const service = require('./chat.service');

const router = express.Router();

/**
 * POST /api/chat   { mensaje, sessionId? }
 *
 * Funciona con y sin sesion: un visitante puede conversar mientras ojea la web
 * (se le identifica por sessionId). Si esta logueado, el chat conoce su perfil y
 * recomienda en consecuencia.
 */
router.post('/', optionalAuth, async (req, res) => {
  try {
    const perfil = req.user?.profileId
      ? await prisma.profile.findUnique({
          where: { id: req.user.profileId },
          select: { id: true, skills: true },
        })
      : null;

    // La oferta que el usuario esta viendo. El cliente manda solo el id: la
    // oferta se lee de NUESTRA base, nunca del cuerpo de la peticion, asi el
    // texto (de terceros) no puede colarse sin pasar por el bloque de DATOS.
    const jobViendo = req.body?.jobId ? await jobs.obtenerPorId(req.body.jobId) : null;

    const r = await service.responder({
      mensaje: req.body?.mensaje,
      sessionId: req.body?.sessionId,
      user: req.user,
      perfil,
      jobViendo,
      contextoPantalla: req.body?.contexto,
    });

    return ok(res, r);
  } catch (err) {
    return fail(res, err.message, err.status || 502);
  }
});

/** GET /api/chat/:sessionId — recuperar una conversacion. */
router.get('/:sessionId', async (req, res) => {
  try {
    const mensajes = await service.obtenerHistorial(req.params.sessionId);
    return ok(res, { sessionId: req.params.sessionId, mensajes });
  } catch (err) {
    return fail(res, err.message, 500);
  }
});

module.exports = router;
