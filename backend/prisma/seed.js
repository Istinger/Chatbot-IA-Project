/**
 * Seed de desarrollo: SOLO el usuario demo.
 *
 * Aqui habia 16 ofertas inventadas. Se eliminaron a proposito: sus `url`
 * apuntaban a ejemplo.test, o sea, a ninguna parte. Una oferta a la que no
 * puedes postular no es una oferta: es una mentira bonita. Y mezclarlas con las
 * reales ensuciaba el matching y las estadisticas.
 *
 * Las ofertas ahora salen SIEMPRE de fuentes reales (Adzuna, Jooble, RemoteOK,
 * ArbeitNow) mediante la ingesta:
 *
 *   docker compose exec api npm run seed     # usuario demo
 *   curl -X POST localhost:8080/api/jobs/ingest   # ofertas reales
 */
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();
const MATCHING_URL = process.env.MATCHING_URL || 'http://matching:8000';

const DEMO = {
  userId: '11111111-1111-1111-1111-111111111111',
  profileId: '22222222-2222-2222-2222-222222222222',
  email: 'demo@jobia.ec',
  password: 'demo1234',
  skills: ['node.js', 'express', 'javascript', 'postgresql', 'git', 'docker'],
  cvText:
    'Egresado de Ingenieria en Software. He construido APIs REST con Node.js y Express, ' +
    'usando PostgreSQL como base de datos. Manejo Git y he trabajado con contenedores Docker. ' +
    'Busco mi primer empleo formal como desarrollador backend.',
};

async function main() {
  // Limpiar las ofertas falsas de versiones anteriores del seed.
  const { count } = await prisma.job.deleteMany({ where: { source: 'seed' } });
  if (count) console.log(`[seed] eliminadas ${count} ofertas falsas (source="seed")`);

  const hash = await bcrypt.hash(DEMO.password, 10);

  await prisma.user.upsert({
    where: { id: DEMO.userId },
    update: { password: hash },
    create: { id: DEMO.userId, email: DEMO.email, password: hash },
  });

  await prisma.profile.upsert({
    where: { id: DEMO.profileId },
    update: { cvText: DEMO.cvText, skills: DEMO.skills },
    create: {
      id: DEMO.profileId,
      userId: DEMO.userId,
      cvText: DEMO.cvText,
      skills: DEMO.skills,
    },
  });

  const res = await fetch(`${MATCHING_URL}/embed/profile/${DEMO.profileId}`, {
    method: 'POST',
  });
  console.log('[seed] perfil demo vectorizado:', await res.json());

  console.log(`\n[seed] usuario demo listo: ${DEMO.email} / ${DEMO.password}`);
  console.log('[seed] las ofertas salen de la ingesta real:');
  console.log('       curl -X POST http://localhost:8080/api/jobs/ingest');
}

main()
  .catch((err) => {
    console.error('[seed] error:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
