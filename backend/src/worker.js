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

const QUEUE = 'ingesta';

const worker = new Worker(
  QUEUE,
  async (job) => {
    console.log(`[worker] ${job.name}: arrancando ingesta…`);
    const resumen = await jobs.ingest();
    console.log('[worker] ingesta terminada:', JSON.stringify(resumen));
    return resumen;
  },
  { connection },
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
