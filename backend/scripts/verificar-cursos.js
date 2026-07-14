/**
 * Verifica que TODAS las URLs del catalogo de cursos siguen vivas.
 *
 *   node scripts/verificar-cursos.js
 *
 * Un catalogo estatico es barato y honesto, pero se pudre: los cursos se retiran
 * y las docs se reorganizan. Esto lo detecta antes que el usuario.
 *
 * Nota: algunos sitios (Coursera, Cloudflare) responden 403 a un cliente que no
 * parece un navegador. Un 403 NO es un enlace roto: es el sitio bloqueando bots.
 * Solo el 404 y el fallo de red son fallos reales.
 */
const { CURSOS } = require('../src/modules/certs/cursos.catalog');

const UA =
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36';

async function comprobar(url) {
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: { 'User-Agent': UA },
      redirect: 'follow',
      signal: AbortSignal.timeout(15000),
    });
    return { status: res.status, final: res.url };
  } catch (err) {
    return { status: 0, error: err.message };
  }
}

(async () => {
  const entradas = Object.entries(CURSOS).flatMap(([skill, cursos]) =>
    cursos.map((c) => ({ skill, ...c })),
  );

  console.log(`Comprobando ${entradas.length} enlaces...\n`);

  const rotos = [];
  const bloqueados = [];

  for (const e of entradas) {
    const r = await comprobar(e.url);
    const roto = r.status === 0 || r.status === 404 || r.status >= 500;
    const bloqueado = r.status === 403 || r.status === 429;

    const marca = roto ? 'ROTO' : bloqueado ? 'bot?' : ' ok ';
    console.log(`[${marca}] ${String(r.status).padStart(3)}  ${e.skill.padEnd(18)} ${e.url}`);

    if (roto) rotos.push({ ...e, ...r });
    else if (bloqueado) bloqueados.push({ ...e, ...r });
  }

  console.log(`\n--- ${entradas.length} enlaces: ${rotos.length} rotos, ${bloqueados.length} bloqueados por antibot ---`);
  for (const r of rotos) console.log(`  ROTO  ${r.skill}: ${r.url}  (${r.status || r.error})`);

  process.exit(rotos.length ? 1 : 0);
})();
