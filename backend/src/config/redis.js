const IORedis = require('ioredis');
const env = require('./env');

// BullMQ exige maxRetriesPerRequest: null en la conexion que comparte con el worker.
const connection = new IORedis(env.redisUrl, { maxRetriesPerRequest: null });

module.exports = { connection };
