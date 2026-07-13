const express = require('express');
const { ok, fail } = require('../../shared/envelope');
const { optionalAuth } = require('../../shared/auth.middleware');
const { prisma } = require('../../config/db');
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

    const r = await service.responder({
      mensaje: req.body?.mensaje,
      sessionId: req.body?.sessionId,
      user: req.user,
      perfil,
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
