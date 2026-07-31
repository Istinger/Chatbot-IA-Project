const express = require('express');
const { ok, fail } = require('../../shared/envelope');
const service = require('./auth.service');

const router = express.Router();

/** POST /api/auth/register  { email, password } -> { token, user } */
router.post('/register', async (req, res) => {
  try {
    return ok(res, await service.register(req.body), 201);
  } catch (err) {
    return fail(res, err.message, err.status || 500);
  }
});

/** POST /api/auth/demo-emails { emails } -> { emails } */
router.post('/demo-emails', async (req, res) => {
  try {
    return ok(res, { emails: await service.sugerirCorreosDemo(req.body?.emails) });
  } catch (err) {
    return fail(res, err.message, err.status || 500);
  }
});

/** POST /api/auth/demo-register. Evita choques entre equipos de la casa abierta. */
router.post('/demo-register', async (req, res) => {
  try {
    return ok(res, await service.registerDemo(req.body), 201);
  } catch (err) {
    return fail(res, err.message, err.status || 500);
  }
});

/** POST /api/auth/login  { email, password } -> { token, user } */
router.post('/login', async (req, res) => {
  try {
    return ok(res, await service.login(req.body));
  } catch (err) {
    return fail(res, err.message, err.status || 500);
  }
});

module.exports = router;
