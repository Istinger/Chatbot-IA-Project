const crypto = require('node:crypto');

const COOKIE_DEVICE = 'jobia_device';
const COOKIE_ADMIN = 'jobia_demo_admin';

function leerCookies(req) {
  return String(req.headers.cookie || '')
    .split(';')
    .map((parte) => parte.trim())
    .filter(Boolean)
    .reduce((cookies, parte) => {
      const indice = parte.indexOf('=');
      if (indice < 1) return cookies;
      const nombre = parte.slice(0, indice);
      const valor = parte.slice(indice + 1);
      try {
        cookies[nombre] = decodeURIComponent(valor);
      } catch {
        cookies[nombre] = valor;
      }
      return cookies;
    }, {});
}

function hashToken(token) {
  return crypto.createHash('sha256').update(String(token || '')).digest('hex');
}

function esMovil(req) {
  const ua = String(req.headers['user-agent'] || '');
  return /iPhone|iPod|Android.+Mobile|Windows Phone|Opera Mini|IEMobile/i.test(ua);
}

function ipCliente(req) {
  const reenviadas = String(req.headers['x-forwarded-for'] || '')
    .split(',')
    .map((ip) => ip.trim())
    .filter(Boolean);
  const ip = reenviadas[0] || req.socket?.remoteAddress || 'desconocida';
  return ip.replace(/^::ffff:/, '');
}

function esConexionSegura(req) {
  const protocolo = String(req.headers['x-forwarded-proto'] || '').split(',')[0].trim();
  return protocolo === 'https' || req.hostname === 'jobia.duckdns.org';
}

function serializarCookie(nombre, valor, req, opciones = {}) {
  const partes = [
    `${nombre}=${encodeURIComponent(valor)}`,
    'Path=/',
    'HttpOnly',
    `SameSite=${opciones.sameSite || 'Lax'}`,
  ];
  if (esConexionSegura(req)) partes.push('Secure');
  if (opciones.maxAge != null) partes.push(`Max-Age=${Math.max(0, Math.floor(opciones.maxAge))}`);
  return partes.join('; ');
}

function crearTokenDispositivo() {
  return crypto.randomBytes(32).toString('base64url');
}

function tokenDispositivo(req) {
  return leerCookies(req)[COOKIE_DEVICE] || null;
}

function tokenAdmin(req) {
  return leerCookies(req)[COOKIE_ADMIN] || null;
}

module.exports = {
  COOKIE_ADMIN,
  COOKIE_DEVICE,
  crearTokenDispositivo,
  esMovil,
  hashToken,
  ipCliente,
  serializarCookie,
  tokenAdmin,
  tokenDispositivo,
};
