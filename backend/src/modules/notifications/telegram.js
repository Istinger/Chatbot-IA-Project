const env = require('../../config/env');

/**
 * Cliente minimo de la Bot API de Telegram. Sin librerias: son 3 llamadas HTTP.
 *
 * El token vive SOLO en .env (TELEGRAM_BOT_TOKEN). Nunca se registra en logs ni
 * se devuelve por la API: quien tenga el token controla el bot entero.
 */
const API = 'https://api.telegram.org';

class TelegramError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

const activo = () => Boolean(env.telegram.token);

async function llamar(metodo, body, timeoutMs = 15000) {
  if (!activo()) {
    throw new TelegramError('Telegram no esta configurado (falta TELEGRAM_BOT_TOKEN)', 503);
  }

  let res;
  try {
    res = await fetch(`${API}/bot${env.telegram.token}/${metodo}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body ?? {}),
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (err) {
    throw new TelegramError(`No se pudo contactar con Telegram: ${err.message}`, 502);
  }

  const json = await res.json().catch(() => null);

  if (!json?.ok) {
    // El mensaje de Telegram se propaga, pero NUNCA la URL: lleva el token dentro.
    throw new TelegramError(json?.description || `Telegram respondio ${res.status}`, 502);
  }

  return json.result;
}

/**
 * Escapa el texto para parse_mode HTML.
 *
 * Los titulos y las empresas vienen de Adzuna y Jooble: los escribe un tercero.
 * Una oferta llamada `Dev <b>SENIOR</b>` romperia el formato del mensaje, y una
 * con `<a href=...>` inyectaria un enlace que nosotros no pusimos. Se escapa
 * SIEMPRE, sin excepciones.
 */
function esc(texto) {
  return String(texto ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

const enviar = (chatId, html) =>
  llamar('sendMessage', {
    chat_id: chatId,
    text: html,
    parse_mode: 'HTML',
    // Sin preview: 3 ofertas con preview convierten el aviso en un muro.
    link_preview_options: { is_disabled: true },
  });

/**
 * Long polling. SOLO puede llamarlo un proceso a la vez (Telegram responde 409
 * Conflict si hay dos): por eso vive en el worker, que corre en una sola replica.
 */
const getUpdates = (offset, timeoutSeg = 25) =>
  llamar(
    'getUpdates',
    { offset, timeout: timeoutSeg, allowed_updates: ['message'] },
    (timeoutSeg + 10) * 1000,
  );

const getMe = () => llamar('getMe');

module.exports = { activo, enviar, getUpdates, getMe, esc, TelegramError };
