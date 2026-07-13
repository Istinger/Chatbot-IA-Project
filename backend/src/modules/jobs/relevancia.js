const { detectSkills } = require('./skills.catalog');

/**
 * ¿Es una oferta del area TECNOLOGICA?
 *
 * Jooble devuelve resultados laxos: buscando "sistemas" en Ecuador trae
 * farmaceuticos, operadores de montacarga y asistentes contables. Son ofertas
 * REALES, pero no pintan nada en un agente de empleo para egresados de
 * tecnologia.
 *
 * Se filtra en la INGESTA, no en la consulta: guardar basura para luego
 * esquivarla en cada busqueda es pagar el coste dos veces (disco, embeddings y
 * ruido en el ranking).
 *
 * Tres reglas, aprendidas a base de fallar:
 *
 *  1. Solo se mira el TITULO. Buscar en la descripcion colaba de todo: un
 *     "SUPERVISOR DE COMPRA DE MATERIA PRIMA" entraba porque en su descripcion
 *     pedia "conocimientos informaticos".
 *
 *  2. Las skills GENERICAS no valen como senal. Un "ASISTENTE CONTABLE" entraba
 *     por tener `excel`, y un "ASISTENTE DE MARKETING" por tener `power bi`. Son
 *     herramientas que usa cualquier administrativo: no convierten un puesto en
 *     tecnologico.
 *
 *  3. Hay titulos que se descartan aunque coincidan con algo. "Profesional en
 *     Marketing Digital y Redes" hacia match con "redes"... que ahi significa
 *     redes SOCIALES.
 *
 * Ante la duda, se CONSERVA: se incluyen roles adyacentes (project manager,
 * product owner, scrum master, analista funcional), que son salidas legitimas
 * para un egresado de sistemas.
 */

/** Skills demasiado comunes fuera de tecnologia: no bastan por si solas. */
const SKILLS_GENERICAS = new Set(['excel', 'ingles', 'power bi', 'tableau', 'scrum']);

/** Si el titulo pega aqui, fuera: aunque haya coincidido con algo tecnico. */
const EXCLUIR = /\b(marketing|ventas?|comercial|vendedor\w*|contab\w*|contador\w*|farmac\w*|docente|profesor\w*|enfermer\w*|medic[oa]|abogad[oa]|chofer|conductor|montacarga|bodega|cajer[oa]|meser[oa]|recepcionista|limpieza|guardia|seguridad fisica|recursos humanos|talento humano|nomina|cobranza\w*|credito|hipotecari\w*|inmobiliari\w*|copywriter|redactor|content writer|housekeeping|houseperson)\b/i;

/** Roles tecnologicos. Se busca SOLO en el titulo. */
const ROLES_TECH =
  /\b(desarrollad\w+|programad\w+|software|sistemas|informatic\w+|tecnolog\w+|soporte (tecnico|ti|it)|help ?desk|mesa de ayuda|analista (de )?(datos|sistemas|funcional|bi)|data (analyst|scientist|engineer)|cientific\w+ de datos|base de datos|bases de datos|dba|redes|network\w*|telecomunicaciones|ciberseguridad|seguridad (informatica|de la informacion)|qa|tester|testing|quality assurance|automatizador|devops|sre|cloud|backend|back.end|frontend|front.end|full.?stack|web|movil|mobile|android|ios|business analyst|ingenier\w+ (de|en) (software|sistemas|datos|redes|computacion)|infraestructura|servidores|erp|crm|sap|product (owner|manager)|project manager|jefe de proyecto|scrum master|arquitect\w+ de (software|soluciones|datos|nube)|ux|ui|inteligencia artificial|machine learning|it\b|ti\b|developer|engineer|analyst|architect|technician|programmer|devsecops|helpdesk)\b/i;

function esRelevante({ title, skills }) {
  const titulo = title || '';

  // Regla 3: veto explicito.
  if (EXCLUIR.test(titulo)) return false;

  // Regla 2: skills, pero solo las que de verdad senalan tecnologia.
  const nucleo = (skills?.length ? skills : detectSkills(titulo)).filter(
    (s) => !SKILLS_GENERICAS.has(s),
  );
  if (nucleo.length > 0) return true;

  // Regla 1: el titulo, y solo el titulo.
  return ROLES_TECH.test(titulo);
}

module.exports = { esRelevante, ROLES_TECH, EXCLUIR, SKILLS_GENERICAS };
