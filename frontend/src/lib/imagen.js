/**
 * Imagenes de portada de las ofertas.
 *
 * Las ofertas vienen de APIs (Adzuna/Jooble) y NO traen foto ni logo. Antes se
 * usaba picsum sembrado por id: cada oferta tenia SIEMPRE la misma imagen, pero
 * era aleatoria — salian paisajes, pelicanos y barcos en vacantes de backend.
 *
 * Ahora la imagen se elige por el CONTENIDO de la oferta (sus skills, y si no,
 * su titulo) y se pide por palabra clave. Sigue siendo estable: el `lock` sale
 * del id, asi que la misma oferta muestra siempre la misma foto y no parpadea
 * entre renders.
 *
 * Un solo lugar para el proveedor: si mas adelante hay imagenes reales, se
 * cambia aqui y nada mas.
 */

/* Temas por skill. El primero que encaje manda, asi que van de lo mas especifico
   a lo mas generico. */
const TEMAS_SKILL = [
  { skills: ['figma', 'ux', 'ui'], kw: 'design,workspace,creative' },
  {
    skills: ['docker', 'kubernetes', 'aws', 'azure', 'gcp', 'terraform', 'linux', 'ci/cd'],
    kw: 'server,datacenter,cloud',
  },
  {
    skills: ['machine learning', 'tensorflow', 'pytorch', 'pandas', 'power bi', 'tableau', 'etl', 'airflow'],
    kw: 'data,analytics,dashboard',
  },
  { skills: ['sql', 'postgresql', 'mysql', 'mongodb', 'redis'], kw: 'database,data,code' },
  { skills: ['testing', 'selenium', 'cypress'], kw: 'software,testing,laptop' },
  {
    skills: ['react', 'angular', 'vue', 'nextjs', 'html', 'css', 'tailwind', 'javascript', 'typescript'],
    kw: 'web,developer,screen',
  },
  {
    skills: ['java', 'spring', 'c#', 'php', 'go', 'kotlin', 'swift', 'ruby', 'node.js', 'express', 'django', 'laravel', 'fastapi', 'flask', 'microservicios'],
    kw: 'code,programming,keyboard',
  },
];

/* Por titulo, para las vacantes que no son de programacion (las hay: logistica,
   comercial, arquitectura...). */
const TEMAS_TITULO = [
  { re: /market|comercial|ventas|sales/i, kw: 'marketing,office,meeting' },
  { re: /logistic|operacion|operations|almacen|supply/i, kw: 'logistics,warehouse' },
  { re: /arquitect|architect|construc|civil|cad/i, kw: 'architecture,blueprint' },
  { re: /diseñ|design|grafic/i, kw: 'design,studio,creative' },
  { re: /conta|financ|admin|rrhh|recursos humanos|hr\b/i, kw: 'business,office,desk' },
  { re: /soporte|support|helpdesk|atencion/i, kw: 'support,headset,office' },
  { re: /data|analyst|analista de datos|bi\b/i, kw: 'data,analytics,dashboard' },
  { re: /develop|program|software|full ?stack|backend|frontend|ingenier/i, kw: 'code,programming,laptop' },
];

const GENERICO = 'office,laptop,technology';

/** Palabras clave que describen la oferta. */
function temaDe(job) {
  const skills = (job?.skills || []).map((s) => String(s).toLowerCase());
  const porSkill = TEMAS_SKILL.find((t) => t.skills.some((s) => skills.includes(s)));
  if (porSkill) return porSkill.kw;

  const titulo = String(job?.title || '');
  return TEMAS_TITULO.find((t) => t.re.test(titulo))?.kw || GENERICO;
}

/** Numero estable a partir de un texto: fija la foto de ese elemento. */
function lockDe(semilla) {
  const s = String(semilla || 'jobia');
  let n = 0;
  for (let i = 0; i < s.length; i += 1) n = (n * 31 + s.charCodeAt(i)) % 100000;
  return n;
}

/**
 * Foto por palabras clave, fija para una semilla dada.
 *
 * Lo usan las ofertas y tambien las ideas de portafolio: un solo sitio decide el
 * proveedor y como se mantiene estable la imagen.
 */
export function imagenTema(palabrasClave, semilla, ancho = 640, alto = 420) {
  const kw = encodeURIComponent(palabrasClave || GENERICO);
  return `https://loremflickr.com/${ancho}/${alto}/${kw}?lock=${lockDe(semilla)}`;
}

/** Imagen de portada de una oferta: acorde al puesto y estable por `job.id`. */
export function imagenOferta(job, ancho = 640, alto = 420) {
  return imagenTema(temaDe(job), job?.id || job?.externalId, ancho, alto);
}

/** Placeholder si la imagen externa falla (sin red). */
export function imagenFallback(ancho = 640, alto = 420) {
  return `https://placehold.co/${ancho}x${alto}/071424/4b9cff?text=Jobia`;
}

/** Avatar del usuario, estable por email. */
export function avatarPerfil(email, tam = 96) {
  const u = encodeURIComponent(email || 'jobia');
  return `https://i.pravatar.cc/${tam}?u=${u}`;
}
