// Envelope unico de respuesta: { ok, data, error }
const ok = (res, data, status = 200) =>
  res.status(status).json({ ok: true, data, error: null });

const fail = (res, message, status = 400) =>
  res.status(status).json({ ok: false, data: null, error: message });

module.exports = { ok, fail };
