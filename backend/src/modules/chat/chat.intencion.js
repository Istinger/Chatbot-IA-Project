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
  // Formas en imperativo: estaban "busco"/"buscando" pero NO "busca", asi que
  // "busca algo que concuerde con mis gustos" no se reconocia como consulta de
  // empleo y el chat respondia en abstracto, sin traer ni una oferta.
  'busca', 'buscame', 'encuentra', 'encuentrame', 'sugiere', 'sugiereme',
  'sugerencia', 'sugerencias', 'proponme', 'dame opciones',
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

const ACCIONES_DE_OFERTAS = [
  'busco trabajo', 'buscar trabajo', 'busca trabajo', 'buscame trabajo',
  'encuentra trabajo', 'encuentrame trabajo', 'ver ofertas', 'muestra ofertas',
  'dame ofertas', 'postular', 'postulacion', 'aplicar a', 'dame opciones',
  'recomiendame trabajo',
];

const OTRO_CONTEXTO = [
  'entrevista', 'simulacion', 'simular', 'simula', 'pregunta', 'preguntas',
  'certificacion', 'certificaciones', 'curso', 'cursos', 'ruta de aprendizaje',
  'curriculum', 'cv', 'perfil', 'portafolio', 'proyecto', 'mejorar', 'practicar',
];

/**
 * Decide si las ofertas recuperadas deben convertirse en un boton visible.
 * Recuperarlas y mostrarlas son decisiones distintas: una entrevista puede usar
 * vacantes como contexto sin interrumpir la conversacion con "Ver 5 ofertas".
 */
function debeMostrarOfertas(mensaje) {
  const texto = normalizar(mensaje);
  const contiene = (lista) => lista.some((frase) => texto.includes(normalizar(frase)));

  if (contiene(ACCIONES_DE_OFERTAS)) return true;
  if (contiene(OTRO_CONTEXTO)) return false;
  return esConsultaDeEmpleo(mensaje);
}

module.exports = { esConsultaDeEmpleo, debeMostrarOfertas, INTENCION, ROLES };
