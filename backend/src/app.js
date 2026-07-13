const express = require('express');
const env = require('./config/env');
const { prisma } = require('./config/db');
const { connection } = require('./config/redis');
const { ok, fail } = require('./shared/envelope');

const app = express();
app.use(express.json());

// El frontend (o NPM) reenvia con el prefijo /api intacto.
const api = express.Router();

// Health: confirma que la API alcanza a Postgres, Redis y al microservicio de
// matching. Es la prueba del "ciclo completo" antes de meter features.
api.get('/health', async (_req, res) => {
  const check = async (fn) => {
    try {
      await fn();
      return 'up';
    } catch (err) {
      return `down: ${err.message}`;
    }
  };

  const [postgres, redis, matching] = await Promise.all([
    check(() => prisma.$queryRaw`SELECT 1`),
    check(() => connection.ping()),
    check(async () => {
      const r = await fetch(`${env.matchingUrl}/health`, {
        signal: AbortSignal.timeout(3000),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
    }),
  ]);

  const healthy = [postgres, redis, matching].every((s) => s === 'up');
  const body = { service: 'api', postgres, redis, matching };

  return healthy ? ok(res, body) : fail(res, JSON.stringify(body), 502);
});

app.use('/api', api);

app.use((_req, res) => fail(res, 'Ruta no encontrada', 404));

app.listen(env.port, '0.0.0.0', () => {
  console.log(`[api] escuchando en :${env.port}`);
});
