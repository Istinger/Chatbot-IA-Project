const crypto = require('crypto');
const { prisma } = require('../../config/db');
const { connection } = require('../../config/redis');
const env = require('../../config/env');
const { fetchCandidates } = require('../matching/matching.service');
const tg = require('./telegram');

/**
 * Avisos por Telegram.
 *
 * El flujo dificil aqui es la VINCULACION: para escribirle a alguien por Telegram
 * hace falta su chat_id, y el usuario no tiene forma humana de saber cual es el
 * suyo. Pedirselo seria pedirle un dato que no puede conseguir.
 *
 * Solucion: un codigo de un solo uso.
 *   1. La web genera un codigo y abre  t.me/<bot>?start=<codigo>
 *   2. El usuario pulsa "Iniciar" en Telegram; el bot recibe "/start <codigo>"
 *      junto con su chat_id, que Telegram adjunta de oficio.
 *   3. El worker canjea el codigo por el userId y guarda el chat_id.
 *
 * El usuario no copia nada. Y el codigo caduca en 15 minutos, asi que un codigo
 * filtrado no sirve para secuestrar los avisos de otro.
 */
const TTL_CODIGO = 15 * 60; // segundos
const CLAVE_OFFSET = 'tg:offset';

class NotifError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

/** Username del bot. Se pide una vez y se cachea: no cambia. */
let cacheBot = null;
async function usuarioDelBot() {
  if (cacheBot) return cacheBot;
  const me = await tg.getMe();
  cacheBot = me.username;
  return cacheBot;
}

// ---------------------------------------------------------------- vinculacion

/**
 * Codigo de un solo uso. Base32 sin vocales ni caracteres ambiguos: aunque el
 * usuario tenga que leerlo, no puede confundir O con 0 ni I con 1.
 */
function nuevoCodigo() {
  const abc = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  const bytes = crypto.randomBytes(8);
  return [...bytes].map((b) => abc[b % abc.length]).join('');
}

async function generarCodigo(userId) {
  if (!tg.activo()) throw new NotifError('Los avisos por Telegram no estan configurados', 503);

  const codigo = nuevoCodigo();
  await connection.set(`tg:code:${codigo}`, userId, 'EX', TTL_CODIGO);

  return {
    codigo,
    bot: await usuarioDelBot(),
    enlace: `https://t.me/${await usuarioDelBot()}?start=${codigo}`,
    expiraEnMin: TTL_CODIGO / 60,
  };
}

async function estado(userId) {
  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: { telegramChatId: true, notifMinScore: true },
  });

  const avisos = await prisma.notification.count({ where: { userId } });

  return {
    disponible: tg.activo(),
    vinculado: Boolean(profile?.telegramChatId),
    umbral: profile?.notifMinScore ?? env.telegram.minScore,
    umbralPorDefecto: env.telegram.minScore,
    avisosEnviados: avisos,
  };
}

async function desvincular(userId) {
  await prisma.profile.update({
    where: { userId },
    data: { telegramChatId: null },
  });
  return { vinculado: false };
}

async function setUmbral(userId, minScore) {
  const n = Number(minScore);
  // Fuera de [0.4, 0.95] el umbral deja de tener sentido: por debajo avisa de
  // cualquier cosa, por encima no avisa nunca.
  if (!Number.isFinite(n) || n < 0.4 || n > 0.95) {
    throw new NotifError('El umbral debe estar entre 0.4 y 0.95', 400);
  }

  await prisma.profile.update({
    where: { userId },
    data: { notifMinScore: n },
  });

  return { umbral: n };
}

// -------------------------------------------------------------------- entrada

/** Canjea el codigo: deja vinculado el chat de Telegram con el usuario. */
async function canjear(codigo, chatId) {
  const clave = `tg:code:${codigo.toUpperCase()}`;
  const userId = await connection.get(clave);
  if (!userId) return null;

  // Se borra ANTES de usarlo: un codigo es de un solo uso, y si algo falla
  // despues es preferible que el usuario lo reintente a que quede reutilizable.
  await connection.del(clave);

  const profile = await prisma.profile.update({
    where: { userId },
    data: { telegramChatId: String(chatId) },
    select: { user: { select: { email: true } } },
  });

  return profile.user.email;
}

/**
 * Procesa los mensajes entrantes del bot. Lo llama el worker en bucle.
 *
 * El offset se guarda en Redis: es lo que le dice a Telegram "estos ya los vi".
 * Sin persistirlo, un reinicio del worker reprocesaria mensajes antiguos.
 */
async function procesarMensajes() {
  const guardado = await connection.get(CLAVE_OFFSET);
  const offset = guardado ? Number(guardado) : undefined;

  const updates = await tg.getUpdates(offset);
  if (!updates.length) return 0;

  for (const u of updates) {
    const texto = u.message?.text?.trim();
    const chatId = u.message?.chat?.id;
    if (!texto || !chatId) continue;

    const [comando, arg] = texto.split(/\s+/);

    if (comando === '/start' && arg) {
      const email = await canjear(arg, chatId);
      await tg.enviar(
        chatId,
        email
          ? `Listo. Este chat quedo vinculado a <b>${tg.esc(email)}</b>.\n\nTe avisare aqui cuando aparezca una oferta que encaje contigo. Para dejar de recibir avisos, desvincula el bot desde tu perfil en Jobia.`
          : 'Ese codigo no es valido o ya caduco. Genera uno nuevo desde tu perfil en Jobia.',
      );
    } else if (comando === '/start') {
      await tg.enviar(
        chatId,
        'Hola, soy el bot de <b>Jobia</b>.\n\nPara recibir avisos de ofertas, entra en tu perfil en Jobia y pulsa "Vincular Telegram". Yo solo puedo escribirte si tu me lo pides desde ahi.',
      );
    } else {
      // El bot NO conversa: el chat esta en la web. Aqui solo avisa.
      await tg.enviar(
        chatId,
        'Solo envio avisos de ofertas. Si quieres conversar con el asistente, entra en Jobia.',
      );
    }
  }

  // update_id + 1 = "confirmados". Telegram no los volvera a enviar.
  const ultimo = updates[updates.length - 1].update_id;
  await connection.set(CLAVE_OFFSET, String(ultimo + 1));

  return updates.length;
}

// --------------------------------------------------------------------- salida

function formatearOferta(job) {
  const salario = job.salaryUsdMax
    ? ` · ~$${Math.round(job.salaryUsdMax / 1000)}k${job.salaryPredicted ? ' (estimado)' : ''}`
    : '';

  const donde = job.location ? ` · ${tg.esc(job.location)}` : '';

  return [
    `<b>${tg.esc(job.title)}</b>`,
    `${tg.esc(job.company)}${donde}${salario}`,
    `Afinidad ${Math.round((job.score ?? 0) * 100)}% · <a href="${tg.esc(job.url)}">ver oferta</a>`,
  ].join('\n');
}

/**
 * Busca ofertas nuevas para un usuario y le avisa. Devuelve cuantas envio.
 *
 * "Nuevas" = por encima de SU umbral y que nunca se le hayan notificado. La
 * tabla Notification es la memoria: sin ella, cada ingesta (cada 6 h) le
 * reenviaria las mismas ofertas hasta hartarlo.
 */
async function notificarA(profile) {
  const umbral = profile.notifMinScore ?? env.telegram.minScore;

  const candidatos = await fetchCandidates({
    profile_id: profile.id,
    limit: 30,
  });

  const buenos = candidatos.filter((c) => (c.score ?? 0) >= umbral);
  if (!buenos.length) return 0;

  const yaAvisados = new Set(
    (
      await prisma.notification.findMany({
        where: { userId: profile.userId, jobId: { in: buenos.map((b) => b.id) } },
        select: { jobId: true },
      })
    ).map((n) => n.jobId),
  );

  const nuevos = buenos.filter((b) => !yaAvisados.has(b.id)).slice(0, env.telegram.maxPorTanda);
  if (!nuevos.length) return 0;

  const cabecera =
    nuevos.length === 1
      ? 'Encontre una oferta que encaja contigo:'
      : `Encontre ${nuevos.length} ofertas que encajan contigo:`;

  await tg.enviar(
    profile.telegramChatId,
    [cabecera, '', ...nuevos.map(formatearOferta)].join('\n\n'),
  );

  // Se registra DESPUES de enviar: si el envio falla, no se marca como avisado y
  // se reintentara en la siguiente ronda. Es preferible reintentar a perder el
  // aviso en silencio.
  await prisma.notification.createMany({
    data: nuevos.map((j) => ({ userId: profile.userId, jobId: j.id, score: j.score ?? 0 })),
    skipDuplicates: true,
  });

  return nuevos.length;
}

/** Recorre a todos los vinculados. Lo llama el worker tras cada ingesta. */
async function notificarTodos() {
  if (!tg.activo()) return { avisados: 0, ofertas: 0, omitido: 'sin token' };

  const perfiles = await prisma.profile.findMany({
    where: { telegramChatId: { not: null } },
    select: { id: true, userId: true, telegramChatId: true, notifMinScore: true },
  });

  let avisados = 0;
  let ofertas = 0;

  for (const p of perfiles) {
    try {
      const n = await notificarA(p);
      if (n > 0) {
        avisados += 1;
        ofertas += n;
      }
    } catch (err) {
      // El fallo de UN usuario no puede tumbar la ronda de los demas. El caso
      // tipico: el usuario bloqueo el bot (403 "bot was blocked by the user").
      console.error(`[notif] fallo al avisar a ${p.userId}: ${err.message}`);
    }

    // Telegram limita a ~30 mensajes/segundo. Con 100 ms entre chats no nos
    // acercamos ni de lejos al limite.
    await new Promise((r) => setTimeout(r, 100));
  }

  return { perfiles: perfiles.length, avisados, ofertas };
}

module.exports = {
  generarCodigo,
  estado,
  desvincular,
  setUmbral,
  procesarMensajes,
  notificarTodos,
  notificarA,
  canjear,
  NotifError,
};
