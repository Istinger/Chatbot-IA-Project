const { prisma } = require('../../config/db');

/**
 * Guarda ofertas de forma idempotente.
 *
 * `externalId` es unico, asi que reingerir la misma oferta la actualiza en vez
 * de duplicarla. Importante: NO se toca `embedding` aqui. Si una oferta cambia
 * de texto, se invalida su vector poniendolo a NULL para que el matching-service
 * lo recalcule (solo entonces).
 */
async function upsertMany(jobs) {
  let creadas = 0;
  let actualizadas = 0;
  let duplicadas = 0;

  for (const job of jobs) {
    const existente = await prisma.job.findUnique({
      where: { externalId: job.externalId },
      select: { id: true, title: true, description: true },
    });

    if (!existente) {
      // Las empresas rocian el MISMO puesto remoto por decenas de ciudades:
      // GovCIO publico un unico "React/Redux Frontend Developer (Remote)" en 32
      // localidades, cada una con su externalId. La identidad real de una oferta
      // es (fuente, titulo, empresa); la ubicacion es ruido y NO entra en la clave.
      const clon = await prisma.job.findFirst({
        where: { source: job.source, title: job.title, company: job.company },
        select: { id: true },
      });

      if (clon) {
        duplicadas += 1;
        continue;
      }

      await prisma.job.create({ data: job });
      creadas += 1;
      continue;
    }

    const cambioTexto =
      existente.title !== job.title || existente.description !== job.description;

    await prisma.job.update({ where: { externalId: job.externalId }, data: job });
    actualizadas += 1;

    // El texto cambio -> el vector viejo ya no representa la oferta.
    if (cambioTexto) {
      await prisma.$executeRaw`UPDATE "Job" SET embedding = NULL WHERE "externalId" = ${job.externalId}`;
    }
  }

  return { creadas, actualizadas, duplicadas };
}

async function list({ scope, q, limit = 20, page = 1 }) {
  const where = {};

  if (scope === 'local') where.isForeign = false;
  if (scope === 'foreign') where.isForeign = true;

  if (q) {
    where.OR = [
      { title: { contains: q, mode: 'insensitive' } },
      { company: { contains: q, mode: 'insensitive' } },
      { skills: { has: q.toLowerCase() } },
    ];
  }

  const [total, jobs] = await Promise.all([
    prisma.job.count({ where }),
    prisma.job.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: (page - 1) * limit,
      // El embedding es un vector de 384 floats: nunca se envia al cliente.
      select: {
        id: true,
        externalId: true,
        source: true,
        title: true,
        company: true,
        location: true,
        country: true,
        salaryMin: true,
        salaryMax: true,
        currency: true,
        salaryUsdMin: true,
        salaryUsdMax: true,
        salaryPredicted: true,
        url: true,
        skills: true,
        isForeign: true,
        createdAt: true,
      },
    }),
  ]);

  return { total, page, limit, jobs };
}

async function stats() {
  const [total, pendientes, porFuente] = await Promise.all([
    prisma.job.count(),
    // `embedding` es Unsupported("vector(384)"): Prisma no puede filtrarlo desde
    // el cliente tipado, hay que preguntarlo en SQL.
    prisma.$queryRaw`SELECT COUNT(*)::int AS n FROM "Job" WHERE embedding IS NULL`,
    prisma.job.groupBy({ by: ['source'], _count: true }),
  ]);

  return {
    total,
    sinEmbedding: pendientes[0].n,
    porFuente: Object.fromEntries(porFuente.map((f) => [f.source, f._count])),
  };
}

module.exports = { upsertMany, list, stats };
