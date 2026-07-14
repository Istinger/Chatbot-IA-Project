/**
 * Worker BullMQ.
 *
 * Corre la ingesta de ofertas de forma PROGRAMADA (cada INGESTA_HORAS), fuera
 * del request del usuario: traer ~150 ofertas y vectorizarlas tarda decenas de
 * segundos y no puede colgar una peticion HTTP.
 */
const { Queue, Worker } = require('bullmq');
const { connection } = require('./config/redis');
const env = require('./config/env');
const jobs = require('./modules/jobs/jobs.service');
const notif = require('./modules/notifications/notifications.service');
const tg = require('./modules/notifications/telegram');

const QUEUE = 'ingesta';

const worker = new Worker(
  QUEUE,
  async (job) => {
    console.log(`[worker] ${job.name}: arrancando ingesta…`);

    // Marcar que hay una ingesta EN CURSO: la UI lo muestra y el endpoint la usa
    // para no encolar dos a la vez.
    await connection.set('ingesta:enCurso', '1', 'EX', 60 * 30);

    try {
      const resumen = await jobs.ingest();
      console.log('[worker] ingesta terminada:', JSON.stringify(resumen));

      await connection.set(
        'ingesta:ultima',
        JSON.stringify({ fecha: new Date().toISOString(), resumen }),
      );

      // Los avisos van DESPUES de la ingesta y dentro del mismo job: es el unico
      // momento en que puede haber ofertas nuevas que notificar. Si fallan, no
      // se pierde la ingesta (ya esta guardada); solo se pierde esa ronda de
      // avisos, y la siguiente los recupera (la tabla Notification recuerda lo
      // que YA se envio, no lo que falta).
      try {
        const avisos = await notif.notificarTodos();
        console.log('[worker] avisos:', JSON.stringify(avisos));
      } catch (err) {
        console.error('[worker] fallaron los avisos:', err.message);
      }

      return resumen;
    } finally {
      await connection.del('ingesta:enCurso');
    }
  },
  {
    connection,
    // Una sola ingesta a la vez: dos en paralelo se pisarian en la base y
    // duplicarian las llamadas a las APIs externas.
    concurrency: 1,
  },
);

worker.on('ready', () => console.log(`[worker] escuchando la cola "${QUEUE}"`));
worker.on('completed', (job) => console.log(`[worker] job ${job.id} completado`));
worker.on('failed', (job, err) =>
  console.error(`[worker] job ${job?.id} fallo:`, err.message),
);

/**
 * Job repetible. BullMQ deduplica por el nombre del scheduler, asi que reiniciar
 * el worker no crea programaciones duplicadas.
 */
async function programar() {
  const queue = new Queue(QUEUE, { connection });
  const cadaMs = env.ingestaHoras * 60 * 60 * 1000;

  await queue.upsertJobScheduler(
    'ingesta-periodica',
    { every: cadaMs },
    { name: 'ingesta-programada' },
  );

  console.log(`[worker] ingesta programada cada ${env.ingestaHoras} h`);
}

programar().catch((err) => console.error('[worker] no se pudo programar:', err.message));

/**
 * Escucha del bot de Telegram (long polling).
 *
 * Vive en el WORKER y no en la API por una razon dura: Telegram devuelve 409
 * Conflict si dos procesos llaman a getUpdates a la vez. La API puede escalar a
 * varias replicas; el worker corre en una sola. Si algun dia hubiera dos
 * workers, habria que pasar a webhook.
 *
 * Es un bucle secuencial, no un setInterval: con setInterval, una llamada lenta
 * se solaparia con la siguiente y provocaria justo el 409 que se quiere evitar.
 */
async function escucharBot() {
  if (!tg.activo()) {
    console.log('[worker] Telegram desactivado (sin TELEGRAM_BOT_TOKEN)');
    return;
  }

  const me = await tg.getMe().catch((err) => {
    console.error('[worker] token de Telegram invalido:', err.message);
    return null;
  });
  if (!me) return;

  console.log(`[worker] escuchando Telegram como @${me.username}`);

  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      await notif.procesarMensajes();
    } catch (err) {
      // Un fallo de red no puede matar la escucha: se espera y se reintenta.
      console.error('[worker] telegram:', err.message);
      await new Promise((r) => setTimeout(r, 5000));
    }
  }
}

escucharBot();
