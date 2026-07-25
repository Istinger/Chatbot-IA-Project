const express = require('express');
const { ok } = require('../../shared/envelope');
const service = require('./imagenes.service');

const router = express.Router();

/**
 * GET /api/imagenes -> { activo, temas: { programming: [{ url, autor, enlace }] } }
 *
 * El cliente lo pide UNA vez y reparte esas fotos entre las ofertas de cada tema
 * (ver frontend/src/lib/imagen.js). Asi ~1000 ofertas cuestan 15 peticiones a
 * Pexels al dia, no 1000.
 *
 * No requiere sesion: son fotos de portada, no datos del usuario.
 *
 * Nunca falla hacia fuera: sin clave o con Pexels caido responde `temas: {}` y la
 * UI usa su respaldo.
 */
router.get('/', async (_req, res) => {
  const temas = await service.porTema();
  return ok(res, { activo: service.activo(), temas });
});

module.exports = router;
