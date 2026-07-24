const express = require('express');
const { ok, fail } = require('../../shared/envelope');
const { requireAuth } = require('../../shared/auth.middleware');
const service = require('./interview.service');

const router = express.Router();

router.use(requireAuth); // practicar usa cuota del LLM: solo con sesion

/** POST /api/interview/start { puesto, nivel, tipo } — arma la sesion (sin LLM). */
router.post('/start', async (req, res) => {
  const { puesto, nivel, tipo } = req.body || {};
  try {
    return ok(res, await service.iniciar({ puesto, nivel, tipo }));
  } catch (err) {
    return fail(res, err.message, err.status || 502);
  }
});

/** POST /api/interview/followup { sessionId, pregunta, respuesta } — repregunta racionada. */
router.post('/followup', async (req, res) => {
  const { sessionId, pregunta, respuesta } = req.body || {};
  if (!pregunta) return fail(res, 'Falta la pregunta', 400);
  try {
    return ok(res, await service.repregunta(req.user.id, { sessionId, pregunta, respuesta }));
  } catch (err) {
    return fail(res, err.message, err.status || 502);
  }
});

/** POST /api/interview/feedback { preguntas, respuestas } — recomendaciones finales. */
router.post('/feedback', async (req, res) => {
  const { preguntas, respuestas } = req.body || {};
  try {
    return ok(res, await service.feedback(req.user.id, { preguntas, respuestas }));
  } catch (err) {
    return fail(res, err.message, err.status || 502);
  }
});

module.exports = router;
