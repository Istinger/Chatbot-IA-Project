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

/** POST /api/auth/login  { email, password } -> { token, user } */
router.post('/login', async (req, res) => {
  try {
    return ok(res, await service.login(req.body));
  } catch (err) {
    return fail(res, err.message, err.status || 500);
  }
});

module.exports = router;
