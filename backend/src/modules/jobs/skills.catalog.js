/**
 * Catalogo estatico de skills. Sin IA: la deteccion es busqueda de palabras.
 *
 * Clave = skill canonica (la que se guarda en Job.skills / Profile.skills).
 * Valor = alias que pueden aparecer en el texto de la oferta.
 *
 * Se usa tambien en el skill gap analysis (modulo certs): comparar las skills
 * del usuario contra las mas repetidas en las ofertas afines es una diferencia
 * de conjuntos, no un problema de IA.
 */
const CATALOG = {
  // Lenguajes
  javascript: ['javascript', 'js', 'ecmascript'],
  typescript: ['typescript', 'ts'],
  python: ['python'],
  java: ['java'],
  'c#': ['c#', 'csharp', '.net', 'dotnet'],
  php: ['php'],
  go: ['golang', 'go lang'],
  ruby: ['ruby', 'rails'],
  kotlin: ['kotlin'],
  swift: ['swift'],
  sql: ['sql'],

  // Backend
  'node.js': ['node.js', 'nodejs', 'node js'],
  express: ['express', 'expressjs'],
  django: ['django'],
  flask: ['flask'],
  fastapi: ['fastapi'],
  spring: ['spring boot', 'springboot', 'spring'],
  laravel: ['laravel'],
  rest: ['rest api', 'restful', 'api rest'],
  graphql: ['graphql'],
  microservicios: ['microservicios', 'microservices'],

  // Frontend
  react: ['react', 'reactjs', 'react.js'],
  angular: ['angular'],
  vue: ['vue', 'vuejs', 'vue.js'],
  nextjs: ['next.js', 'nextjs'],
  html: ['html', 'html5'],
  css: ['css', 'css3', 'sass', 'scss'],
  tailwind: ['tailwind'],

  // Datos / IA
  postgresql: ['postgresql', 'postgres'],
  mysql: ['mysql', 'mariadb'],
  mongodb: ['mongodb', 'mongo'],
  redis: ['redis'],
  pandas: ['pandas'],
  etl: ['etl', 'pipeline de datos', 'data pipeline'],
  airflow: ['airflow'],
  'machine learning': ['machine learning', 'aprendizaje automatico', 'ml'],
  pytorch: ['pytorch'],
  tensorflow: ['tensorflow'],
  'power bi': ['power bi', 'powerbi'],
  tableau: ['tableau'],
  excel: ['excel'],

  // Infra / DevOps
  docker: ['docker', 'contenedores', 'containers'],
  kubernetes: ['kubernetes', 'k8s'],
  aws: ['aws', 'amazon web services'],
  azure: ['azure'],
  gcp: ['gcp', 'google cloud'],
  terraform: ['terraform'],
  linux: ['linux', 'unix'],
  'ci/cd': ['ci/cd', 'cicd', 'jenkins', 'github actions', 'gitlab ci'],
  git: ['git', 'github', 'gitlab'],

  // QA
  testing: ['testing', 'pruebas unitarias', 'unit test', 'qa'],
  selenium: ['selenium'],
  cypress: ['cypress'],

  // Diseno / producto
  figma: ['figma'],
  ux: ['ux', 'experiencia de usuario', 'user experience'],
  ui: ['ui design', 'diseno de interfaces'],
  scrum: ['scrum', 'agile', 'agil'],

  // Blandas / idiomas
  ingles: ['ingles', 'english', 'b2', 'c1'],
};

/**
 * Detecta skills en un texto libre (titulo + descripcion + tags).
 *
 * La frontera se comprueba con lookarounds contra [a-z0-9], NO contra un
 * conjunto de caracteres literales. Es importante: excluir el punto de la
 * frontera (para proteger "node.js") hacia que cualquier skill al final de una
 * frase —"...con Django." o "...y PostgreSQL."— dejara de detectarse en silencio.
 *
 * Los lookarounds tambien evitan los falsos positivos: "go" no dispara dentro de
 * "algo", ni "ml" dentro de "html", ni "react" dentro de "reactivo".
 */
function detectSkills(text) {
  if (!text) return [];
  const haystack = text.toLowerCase();
  const found = new Set();

  for (const [skill, aliases] of Object.entries(CATALOG)) {
    for (const alias of aliases) {
      // Escapar los caracteres especiales de regex (., #, /, +)
      const safe = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      if (new RegExp(`(?<![a-z0-9])${safe}(?![a-z0-9])`, 'i').test(haystack)) {
        found.add(skill);
        break;
      }
    }
  }
  return [...found];
}

module.exports = { CATALOG, detectSkills };
