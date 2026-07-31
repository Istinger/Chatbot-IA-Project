const express = require('express');
const multer = require('multer');
const { ok, fail } = require('../../shared/envelope');
const { requireAuth } = require('../../shared/auth.middleware');
const service = require('./profile.service');

const router = express.Router();

// El PDF se procesa en memoria y no se guarda en disco: solo interesa su TEXTO.
// Asi no hay que gestionar almacenamiento ni limpiar archivos huerfanos.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB: un CV nunca pesa mas
});

/** POST /api/profile/demo-cv. Crea la sesion demo desde el correo del PDF. */
router.post('/demo-cv', upload.single('cv'), async (req, res) => {
  try {
    return ok(res, await service.subirCvDemo(req.file), 201);
  } catch (err) {
    if (err.code === 'LIMIT_FILE_SIZE') return fail(res, 'El PDF supera los 5 MB', 400);
    return fail(res, err.message, err.status || 500);
  }
});

router.use(requireAuth); // el resto del modulo exige sesion

/** GET /api/profile */
router.get('/', async (req, res) => {
  try {
    return ok(res, await service.get(req.user.id));
  } catch (err) {
    return fail(res, err.message, err.status || 500);
  }
});

/** POST /api/profile/cv   (multipart/form-data, campo "cv") */
router.post('/cv', upload.single('cv'), async (req, res) => {
  try {
    return ok(res, await service.subirCv(req.user.id, req.file));
  } catch (err) {
    if (err.code === 'LIMIT_FILE_SIZE') return fail(res, 'El PDF supera los 5 MB', 400);
    return fail(res, err.message, err.status || 500);
  }
});

/** PUT /api/profile/skills   { skills: ["node.js", "react"] } */
router.put('/skills', async (req, res) => {
  try {
    return ok(res, await service.actualizarSkills(req.user.id, req.body.skills));
  } catch (err) {
    return fail(res, err.message, err.status || 500);
  }
});

module.exports = router;
