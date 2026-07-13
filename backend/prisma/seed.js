/**
 * Seed de desarrollo: ofertas de prueba + un perfil demo.
 *
 * Sirve para probar el matching SIN depender de Adzuna/Jooble. Al final llama al
 * microservicio Python para vectorizar todo (embeddings locales, coste $0).
 *
 *   docker compose exec api npm run seed
 */
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();
const MATCHING_URL = process.env.MATCHING_URL || 'http://matching:8000';

const JOBS = [
  // --- Ecuador (backend / afines al perfil demo) ---
  { externalId: 'seed-1', title: 'Desarrollador Backend Node.js Junior', company: 'Kruger Corp', location: 'Quito', country: 'Ecuador', salaryMin: 900, salaryMax: 1300, skills: ['node.js', 'express', 'postgresql', 'git'], description: 'Buscamos junior para construir APIs REST con Node y Express sobre PostgreSQL. Trabajo hibrido en Quito.' },
  { externalId: 'seed-2', title: 'Desarrollador Full Stack (React + Node)', company: 'Tata Consultancy', location: 'Guayaquil', country: 'Ecuador', salaryMin: 1100, salaryMax: 1600, skills: ['react', 'node.js', 'typescript', 'docker'], description: 'Full stack para plataforma bancaria. React en el front, Node en el back, despliegue con Docker.' },
  { externalId: 'seed-3', title: 'Ingeniero de Datos Junior', company: 'Banco Pichincha', location: 'Quito', country: 'Ecuador', salaryMin: 1000, salaryMax: 1500, skills: ['python', 'sql', 'etl', 'airflow'], description: 'Construccion de pipelines ETL y modelado de datos para el area de riesgos.' },
  { externalId: 'seed-4', title: 'Soporte Tecnico Nivel 1', company: 'Claro Ecuador', location: 'Guayaquil', country: 'Ecuador', salaryMin: 460, salaryMax: 600, skills: ['windows', 'redes', 'atencion al cliente'], description: 'Atencion a usuarios, gestion de tickets y soporte de primer nivel.' },
  { externalId: 'seed-5', title: 'Desarrollador Python / Django', company: 'Yaganaste', location: 'Quito', country: 'Ecuador', salaryMin: 1200, salaryMax: 1700, skills: ['python', 'django', 'postgresql', 'rest'], description: 'Backend en Django para una fintech en crecimiento. APIs REST y PostgreSQL.' },
  { externalId: 'seed-6', title: 'Disenador UX/UI', company: 'Estudio Nube', location: 'Cuenca', country: 'Ecuador', salaryMin: 800, salaryMax: 1200, skills: ['figma', 'ux', 'prototipado'], description: 'Diseno de interfaces y prototipos para productos digitales.' },
  { externalId: 'seed-7', title: 'QA Automation Engineer', company: 'Telconet', location: 'Quito', country: 'Ecuador', salaryMin: 950, salaryMax: 1400, skills: ['selenium', 'javascript', 'testing', 'ci/cd'], description: 'Automatizacion de pruebas end to end y pipelines de CI.' },
  { externalId: 'seed-8', title: 'Community Manager', company: 'Agencia Norte', location: 'Quito', country: 'Ecuador', salaryMin: 500, salaryMax: 750, skills: ['redes sociales', 'copywriting', 'marketing'], description: 'Gestion de redes sociales y creacion de contenido para marcas locales.' },

  // --- Exterior / remoto (bien pagadas: alimentan la exploracion) ---
  { externalId: 'seed-9', title: 'Senior Backend Engineer (Remote LATAM)', company: 'Stripe', location: 'Remoto', country: 'Estados Unidos', salaryMin: 6000, salaryMax: 9000, skills: ['node.js', 'typescript', 'kubernetes', 'aws'], description: 'Backend distribuido a gran escala. Contratacion remota desde LATAM, ingles requerido.' },
  { externalId: 'seed-10', title: 'Machine Learning Engineer', company: 'Mercado Libre', location: 'Buenos Aires / Remoto', country: 'Argentina', salaryMin: 4000, salaryMax: 6500, skills: ['python', 'pytorch', 'mlops', 'sql'], description: 'Modelos de recomendacion y ranking para el marketplace.' },
  { externalId: 'seed-11', title: 'DevOps / Platform Engineer', company: 'Globant', location: 'Remoto', country: 'Colombia', salaryMin: 3500, salaryMax: 5500, skills: ['docker', 'kubernetes', 'terraform', 'aws'], description: 'Infraestructura como codigo, Kubernetes y observabilidad.' },
  { externalId: 'seed-12', title: 'Data Scientist', company: 'Rappi', location: 'Remoto', country: 'Colombia', salaryMin: 3000, salaryMax: 5000, skills: ['python', 'pandas', 'estadistica', 'sql'], description: 'Analisis de datos y modelos predictivos para logistica.' },
  { externalId: 'seed-13', title: 'Frontend Engineer (React)', company: 'Shopify', location: 'Remoto', country: 'Canada', salaryMin: 5000, salaryMax: 8000, skills: ['react', 'typescript', 'graphql', 'css'], description: 'Interfaces de alto rendimiento para millones de comerciantes.' },
  { externalId: 'seed-14', title: 'Cloud Solutions Architect', company: 'Microsoft', location: 'Remoto', country: 'Espana', salaryMin: 5500, salaryMax: 8500, skills: ['azure', 'arquitectura', 'kubernetes', 'seguridad'], description: 'Diseno de arquitecturas cloud para clientes empresariales.' },
  { externalId: 'seed-15', title: 'Site Reliability Engineer', company: 'Cloudflare', location: 'Remoto', country: 'Estados Unidos', salaryMin: 6500, salaryMax: 9500, skills: ['linux', 'go', 'kubernetes', 'observabilidad'], description: 'Fiabilidad y rendimiento de una red global de borde.' },
  { externalId: 'seed-16', title: 'Contador General', company: 'Corporacion Favorita', location: 'Quito', country: 'Ecuador', salaryMin: 700, salaryMax: 1000, skills: ['contabilidad', 'niif', 'excel'], description: 'Cierres contables mensuales y conciliaciones bancarias.' },
];

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
  console.log('[seed] insertando ofertas…');
  for (const job of JOBS) {
    // Los salarios del seed estan escritos MENSUALES (como se publican en
    // Ecuador). Las fuentes reales dan importes ANUALES, asi que hay que
    // anualizarlos o el ranking por sueldo compararia peras con manzanas.
    const anualMin = job.salaryMin * 12;
    const anualMax = job.salaryMax * 12;

    const data = {
      ...job,
      salaryMin: anualMin,
      salaryMax: anualMax,
      currency: 'USD', // Ecuador esta dolarizado; el resto del seed tambien va en USD
      salaryUsdMin: anualMin,
      salaryUsdMax: anualMax,
      source: 'seed',
      url: `https://ejemplo.test/${job.externalId}`,
      // Regla de negocio: si no es Ecuador, es oferta del exterior.
      isForeign: job.country !== 'Ecuador',
    };

    await prisma.job.upsert({
      where: { externalId: job.externalId },
      update: data,
      create: data,
    });
  }
  console.log(`[seed] ${JOBS.length} ofertas listas (salarios anualizados)`);

  // Contrasena hasheada con bcrypt, igual que en el registro real, para poder
  // iniciar sesion con el usuario demo: demo@jobia.ec / demo1234
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
  console.log(`[seed] perfil demo: ${DEMO.profileId}`);

  console.log('[seed] vectorizando en el matching-service (embeddings locales)…');
  const jobsRes = await fetch(`${MATCHING_URL}/embed/jobs`, { method: 'POST' });
  console.log('[seed] ofertas vectorizadas:', await jobsRes.json());

  const profRes = await fetch(`${MATCHING_URL}/embed/profile/${DEMO.profileId}`, {
    method: 'POST',
  });
  console.log('[seed] perfil vectorizado:', await profRes.json());

  console.log(`\n[seed] listo. Prueba:\n  curl "http://localhost:8080/api/matching/jobs?profileId=${DEMO.profileId}"`);
}

main()
  .catch((err) => {
    console.error('[seed] error:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
