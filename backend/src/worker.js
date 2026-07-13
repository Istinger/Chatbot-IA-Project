// Worker BullMQ. Por ahora solo se conecta y procesa una cola vacia: sirve para
// verificar que Redis y la imagen del backend funcionan. La ingesta de ofertas y
// las notificaciones de Telegram se agregan despues.
const { Worker } = require('bullmq');
const { connection } = require('./config/redis');

const QUEUE = 'ingesta';

const worker = new Worker(
  QUEUE,
  async (job) => {
    console.log(`[worker] job ${job.name} recibido`, job.data);
  },
  { connection },
);

worker.on('ready', () => console.log(`[worker] escuchando la cola "${QUEUE}"`));
worker.on('failed', (job, err) =>
  console.error(`[worker] job ${job?.id} fallo:`, err.message),
);
