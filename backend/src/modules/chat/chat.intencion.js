const { detectSkills } = require('../jobs/skills.catalog');

/**
 * ¿El mensaje pide ofertas de trabajo?
 *
 * POR QUE UN LEXICO Y NO EMBEDDINGS (que era el plan original):
 *
 * Se intentaron dos enfoques semanticos y los DOS fallaron, medidos con datos:
 *
 *   1. Umbral sobre el score de la mejor oferta. Con 129 ofertas separaba bien,
 *      pero con 684 las distribuciones se solapan: "quien gano el mundial"
 *      puntuaba 0.645, POR ENCIMA de "remoto junior backend" (0.601). Con
 *      suficientes ofertas, siempre hay alguna "cercana" a cualquier cosa.
 *
 *   2. Similitud contra frases ancla del dominio. Peor todavia: "cuanto es 2 mas
 *      2" daba 0.836 de afinidad con el dominio de empleo, mas que "analizar
 *      datos con python" (0.493).
 *
 * El modelo (MiniLM multilingue) es bueno RANKEANDO documentos parecidos, pero su
 * similitud absoluta no vale para CLASIFICAR. Son dos problemas distintos y solo
 * resuelve el primero.
 *
 * Asi que aqui va un lexico, que para esta tarea concreta es preciso, gratis,
 * instantaneo y auditable. Cubre tres familias:
 *   - intencion explicita ("busco trabajo", "vacantes", "postular")
 *   - el area o el rol ("backend", "disenador", "analista")
 *   - cualquier skill del catalogo ("figma", "python", "kubernetes")
 */
const INTENCION = [
  'trabajo', 'trabajos', 'empleo', 'empleos', 'vacante', 'vacantes', 'oferta',
  'ofertas', 'puesto', 'puestos', 'plaza', 'plazas', 'postular', 'postulacion',
  'aplicar a', 'contratar', 'contratacion', 'reclutamiento', 'busco', 'buscando',
  'recomiendame', 'recomiendame', 'recomienda', 'muestrame', 'ensename',
  'salario', 'sueldo', 'pagan', 'paga', 'remuneracion',
  'remoto', 'presencial', 'hibrido', 'freelance', 'medio tiempo', 'pasantia',
  'practicas', 'junior', 'senior', 'semi senior', 'trainee',
];

const ROLES = [
  'backend', 'frontend', 'full stack', 'fullstack', 'desarrollador', 'programador',
  'ingeniero', 'analista', 'disenador', 'diseñador', 'soporte', 'helpdesk',
  'qa', 'tester', 'devops', 'sysadmin', 'administrador de sistemas',
  'cientifico de datos', 'data scientist', 'data analyst', 'developer', 'engineer',
  'ciberseguridad', 'seguridad informatica', 'redes', 'cloud', 'movil', 'mobile',
];

/** Sin acentos y en minusculas: "diseñador" y "disenador" deben coincidir igual. */
const normalizar = (t) =>
  String(t || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');

function esConsultaDeEmpleo(mensaje) {
  const texto = normalizar(mensaje);

  // Cualquier skill del catalogo cuenta: "figma", "kubernetes", "power bi"...
  // Esto cubre consultas sin ninguna palabra de empleo ("diseñador ux figma").
  if (detectSkills(mensaje).length > 0) return true;

  const pega = (lista) =>
    lista.some((p) => new RegExp(`(^|[^a-z0-9])${normalizar(p)}([^a-z0-9]|$)`).test(texto));

  return pega(INTENCION) || pega(ROLES);
}

module.exports = { esConsultaDeEmpleo, INTENCION, ROLES };
