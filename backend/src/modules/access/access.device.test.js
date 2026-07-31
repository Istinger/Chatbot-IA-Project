const test = require('node:test');
const assert = require('node:assert/strict');
const {
  esMovil,
  hashToken,
  ipCliente,
  serializarCookie,
} = require('./access.device');

function request(headers = {}, hostname = 'localhost') {
  return {
    headers,
    hostname,
    socket: { remoteAddress: '::ffff:172.20.0.4' },
  };
}

test('distingue un telefono de una computadora', () => {
  assert.equal(esMovil(request({
    'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Mobile',
  })), true);
  assert.equal(esMovil(request({
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/126',
  })), false);
});

test('usa la primera IP reenviada por los proxies', () => {
  const req = request({ 'x-forwarded-for': '181.39.20.10, 172.18.0.2, 172.20.0.3' });
  assert.equal(ipCliente(req), '181.39.20.10');
  assert.equal(ipCliente(request()), '172.20.0.4');
});

test('el hash no guarda el token original y es estable', () => {
  const token = 'token-aleatorio-de-prueba';
  assert.notEqual(hashToken(token), token);
  assert.equal(hashToken(token), hashToken(token));
  assert.notEqual(hashToken(token), hashToken(`${token}-otro`));
});

test('las cookies de produccion son HttpOnly, Secure y SameSite', () => {
  const cookie = serializarCookie(
    'jobia_device',
    'valor',
    request({ 'x-forwarded-proto': 'https' }, 'jobia.duckdns.org'),
    { maxAge: 3600, sameSite: 'Strict' },
  );
  assert.match(cookie, /HttpOnly/);
  assert.match(cookie, /Secure/);
  assert.match(cookie, /SameSite=Strict/);
  assert.match(cookie, /Max-Age=3600/);
});
