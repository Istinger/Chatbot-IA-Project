/**
 * Prueba de punta a punta de los avisos por Telegram.
 *
 *   docker compose exec worker node scripts/probar-telegram.js <CODIGO> <CHAT_ID>
 *
 * Reproduce lo que ocurre cuando el usuario pulsa "Iniciar" en Telegram: canjea
 * el codigo, comprueba que el chat queda vinculado y lanza una ronda de avisos
 * real. Al terminar desvincula y borra los avisos de prueba.
 *
 * La propiedad que se verifica NO es "la segunda ronda no envia nada": si hay
 * mas ofertas buenas que el tope por tanda (3), la segunda ronda envia las 3
 * SIGUIENTES, y eso es correcto (un goteo, no un muro de 30 ofertas).
 *
 * La propiedad real es: UNA OFERTA NUNCA SE AVISA DOS VECES. Se comprueba
 * marcando como avisadas TODAS las que superan el umbral y verificando que
 * entonces el bot se calla.
 */
const { prisma } = require('../src/config/db');
const { connection } = require('../src/config/redis');
const env = require('../src/config/env');
const { fetchCandidates } = require('../src/modules/matching/matching.service');
const svc = require('../src/modules/notifications/notifications.service');

const [codigo, chatId] = process.argv.slice(2);

(async () => {
  if (!codigo || !chatId) {
    console.error('uso: node scripts/probar-telegram.js <CODIGO> <CHAT_ID>');
    process.exit(1);
  }

  let ok = true;

  console.log('1. canjeando el codigo (= el usuario pulsa Iniciar)');
  const email = await svc.canjear(codigo, chatId);
  if (!email) {
    console.error('   codigo invalido o caducado');
    process.exit(1);
  }
  console.log(`   vinculado -> ${email}`);

  const profile = await prisma.profile.findFirst({
    where: { telegramChatId: String(chatId) },
    select: { id: true, userId: true, telegramChatId: true, notifMinScore: true },
  });

  console.log('2. primera ronda: debe avisar');
  const enviadas = await svc.notificarA(profile);
  const avisados1 = await prisma.notification.findMany({
    where: { userId: profile.userId },
    select: { jobId: true },
  });
  console.log(`   ofertas enviadas: ${enviadas} | registradas: ${avisados1.length}`);
  if (enviadas === 0) {
    console.log('   (ninguna oferta supera el umbral: prueba no concluyente)');
  }

  console.log('3. ya avisadas TODAS las que superan el umbral: debe callarse');
  const umbral = profile.notifMinScore ?? env.telegram.minScore;
  const candidatos = await fetchCandidates({ profile_id: profile.id, limit: 30 });
  const buenos = candidatos.filter((c) => (c.score ?? 0) >= umbral);

  await prisma.notification.createMany({
    data: buenos.map((j) => ({ userId: profile.userId, jobId: j.id, score: j.score ?? 0 })),
    skipDuplicates: true,
  });

  const repetidas = await svc.notificarA(profile);
  console.log(`   ofertas enviadas: ${repetidas}  ${repetidas === 0 ? '(correcto: no repite)' : '(MAL: repite)'}`);
  if (repetidas !== 0) ok = false;

  console.log('4. la clave unica (userId, jobId) impide el duplicado en la BD');
  const total = await prisma.notification.count({ where: { userId: profile.userId } });
  const distintas = await prisma.notification.findMany({
    where: { userId: profile.userId },
    select: { jobId: true },
    distinct: ['jobId'],
  });
  console.log(`   filas: ${total} | jobId distintos: ${distintas.length}  ${total === distintas.length ? '(correcto)' : '(MAL: hay duplicados)'}`);
  if (total !== distintas.length) ok = false;

  console.log('5. limpiando (desvincular + borrar avisos de prueba)');
  await svc.desvincular(profile.userId);
  await prisma.notification.deleteMany({ where: { userId: profile.userId } });

  await prisma.$disconnect();
  connection.disconnect();
  console.log(ok ? '\nOK' : '\nFALLO');
  process.exit(ok ? 0 : 1);
})();
