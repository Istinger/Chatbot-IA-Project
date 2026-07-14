/**
 * Catalogo estatico de cursos. Cero IA, cero llamadas externas.
 *
 * El skill gap se resuelve con dos operaciones baratas:
 *   1. diferencia de conjuntos (lo que piden las ofertas menos lo que sabes)
 *   2. un lookup en esta tabla
 *
 * Pedirle esto a un LLM seria pagar por que INVENTE enlaces: un modelo alucina
 * URLs de cursos con una facilidad pasmosa, y un enlace roto en la cara del
 * usuario destruye la confianza en todo lo demas.
 *
 * Criterio de seleccion:
 *   - Se prefiere la fuente OFICIAL (docs de React, de Docker...). No caduca,
 *     no la retiran del catalogo y es gratis.
 *   - Coursera/edX solo cuando el curso es un clasico reconocible (Python for
 *     Everybody, Google UX). Se marcan como `auditable`: se pueden seguir gratis;
 *     lo que se paga es el certificado.
 *
 * Cada URL de aqui esta verificada (scripts/verificar-cursos.js). Si una skill no
 * tiene entrada, `cursosPara()` genera busquedas en Coursera y YouTube: nunca se
 * devuelve una skill sin siguiente paso.
 */

// gratis: true       -> el contenido completo es gratuito
// gratis: 'auditable'-> se puede cursar gratis; el certificado se paga
const CURSOS = {
  // --- Lenguajes ---
  python: [
    { titulo: 'Python for Everybody', proveedor: 'Coursera · U. Michigan', url: 'https://www.coursera.org/specializations/python', gratis: 'auditable' },
    { titulo: 'Tutorial oficial de Python', proveedor: 'python.org', url: 'https://docs.python.org/es/3/tutorial/', gratis: true },
  ],
  javascript: [
    { titulo: 'JavaScript Algorithms and Data Structures', proveedor: 'freeCodeCamp', url: 'https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures/', gratis: true },
    { titulo: 'Guia de JavaScript', proveedor: 'MDN', url: 'https://developer.mozilla.org/es/docs/Web/JavaScript/Guide', gratis: true },
  ],
  typescript: [
    { titulo: 'TypeScript Handbook', proveedor: 'typescriptlang.org', url: 'https://www.typescriptlang.org/docs/handbook/intro.html', gratis: true },
  ],
  java: [
    { titulo: 'Learn Java', proveedor: 'dev.java (Oracle)', url: 'https://dev.java/learn/', gratis: true },
  ],
  'c#': [
    { titulo: 'Tour of C#', proveedor: 'Microsoft Learn', url: 'https://learn.microsoft.com/en-us/dotnet/csharp/tour-of-csharp/', gratis: true },
  ],
  php: [
    { titulo: 'Manual de PHP', proveedor: 'php.net', url: 'https://www.php.net/manual/es/tutorial.php', gratis: true },
  ],
  go: [
    { titulo: 'A Tour of Go', proveedor: 'go.dev', url: 'https://go.dev/tour/', gratis: true },
  ],
  ruby: [
    { titulo: 'Rails: Getting Started', proveedor: 'rubyonrails.org', url: 'https://guides.rubyonrails.org/getting_started.html', gratis: true },
  ],
  kotlin: [
    { titulo: 'Kotlin: Getting Started', proveedor: 'kotlinlang.org', url: 'https://kotlinlang.org/docs/getting-started.html', gratis: true },
  ],
  swift: [
    { titulo: 'Swift Documentation', proveedor: 'swift.org', url: 'https://www.swift.org/documentation/', gratis: true },
  ],
  sql: [
    { titulo: 'Relational Database (certificacion)', proveedor: 'freeCodeCamp', url: 'https://www.freecodecamp.org/learn/relational-database/', gratis: true },
  ],

  // --- Backend ---
  'node.js': [
    { titulo: 'Back End Development and APIs', proveedor: 'freeCodeCamp', url: 'https://www.freecodecamp.org/learn/back-end-development-and-apis/', gratis: true },
    { titulo: 'Learn Node.js', proveedor: 'nodejs.org', url: 'https://nodejs.org/en/learn', gratis: true },
  ],
  express: [
    { titulo: 'Guia de Express', proveedor: 'expressjs.com', url: 'https://expressjs.com/es/guide/routing.html', gratis: true },
  ],
  django: [
    { titulo: 'Tutorial oficial de Django', proveedor: 'djangoproject.com', url: 'https://docs.djangoproject.com/es/stable/intro/tutorial01/', gratis: true },
  ],
  flask: [
    { titulo: 'Flask Tutorial', proveedor: 'palletsprojects.com', url: 'https://flask.palletsprojects.com/en/stable/tutorial/', gratis: true },
  ],
  fastapi: [
    { titulo: 'Tutorial de FastAPI', proveedor: 'fastapi.tiangolo.com', url: 'https://fastapi.tiangolo.com/es/tutorial/', gratis: true },
  ],
  spring: [
    { titulo: 'Spring Guides', proveedor: 'spring.io', url: 'https://spring.io/guides', gratis: true },
  ],
  laravel: [
    { titulo: 'Documentacion de Laravel', proveedor: 'laravel.com', url: 'https://laravel.com/docs', gratis: true },
  ],
  rest: [
    { titulo: 'HTTP y APIs REST', proveedor: 'MDN', url: 'https://developer.mozilla.org/es/docs/Web/HTTP', gratis: true },
  ],
  graphql: [
    { titulo: 'Learn GraphQL', proveedor: 'graphql.org', url: 'https://graphql.org/learn/', gratis: true },
  ],
  microservicios: [
    { titulo: 'Microservices Patterns', proveedor: 'microservices.io', url: 'https://microservices.io/patterns/microservices.html', gratis: true },
  ],

  // --- Frontend ---
  react: [
    { titulo: 'Aprende React', proveedor: 'react.dev', url: 'https://es.react.dev/learn', gratis: true },
    { titulo: 'Front End Development Libraries', proveedor: 'freeCodeCamp', url: 'https://www.freecodecamp.org/learn/front-end-development-libraries/', gratis: true },
  ],
  angular: [
    { titulo: 'Tutoriales de Angular', proveedor: 'angular.dev', url: 'https://angular.dev/tutorials', gratis: true },
  ],
  vue: [
    { titulo: 'Tutorial de Vue', proveedor: 'vuejs.org', url: 'https://vuejs.org/tutorial/', gratis: true },
  ],
  nextjs: [
    { titulo: 'Learn Next.js', proveedor: 'nextjs.org', url: 'https://nextjs.org/learn', gratis: true },
  ],
  html: [
    { titulo: 'Responsive Web Design (certificacion)', proveedor: 'freeCodeCamp', url: 'https://www.freecodecamp.org/learn/responsive-web-design/', gratis: true },
  ],
  css: [
    { titulo: 'Aprende CSS', proveedor: 'web.dev (Google)', url: 'https://web.dev/learn/css', gratis: true },
  ],
  tailwind: [
    { titulo: 'Documentacion de Tailwind', proveedor: 'tailwindcss.com', url: 'https://tailwindcss.com/docs/styling-with-utility-classes', gratis: true },
  ],

  // --- Datos / IA ---
  postgresql: [
    { titulo: 'Tutorial de PostgreSQL', proveedor: 'postgresql.org', url: 'https://www.postgresql.org/docs/current/tutorial.html', gratis: true },
  ],
  mysql: [
    { titulo: 'MySQL Tutorial', proveedor: 'dev.mysql.com', url: 'https://dev.mysql.com/doc/mysql-tutorial-excerpt/8.0/en/', gratis: true },
  ],
  mongodb: [
    { titulo: 'MongoDB University', proveedor: 'MongoDB', url: 'https://learn.mongodb.com/', gratis: true },
  ],
  redis: [
    { titulo: 'Redis University', proveedor: 'Redis', url: 'https://redis.io/learn', gratis: true },
  ],
  pandas: [
    { titulo: 'Data Analysis with Python (certificacion)', proveedor: 'freeCodeCamp', url: 'https://www.freecodecamp.org/learn/data-analysis-with-python/', gratis: true },
  ],
  etl: [
    { titulo: 'Data Engineering Foundations', proveedor: 'Coursera · IBM', url: 'https://www.coursera.org/professional-certificates/ibm-data-engineer', gratis: 'auditable' },
  ],
  airflow: [
    { titulo: 'Tutorial de Apache Airflow', proveedor: 'airflow.apache.org', url: 'https://airflow.apache.org/docs/apache-airflow/stable/tutorial/', gratis: true },
  ],
  'machine learning': [
    { titulo: 'Machine Learning Specialization', proveedor: 'Coursera · Andrew Ng', url: 'https://www.coursera.org/specializations/machine-learning-introduction', gratis: 'auditable' },
    { titulo: 'Machine Learning with Python', proveedor: 'freeCodeCamp', url: 'https://www.freecodecamp.org/learn/machine-learning-with-python/', gratis: true },
  ],
  pytorch: [
    { titulo: 'PyTorch Tutorials', proveedor: 'pytorch.org', url: 'https://pytorch.org/tutorials/', gratis: true },
  ],
  tensorflow: [
    { titulo: 'Tutoriales de TensorFlow', proveedor: 'tensorflow.org', url: 'https://www.tensorflow.org/tutorials?hl=es', gratis: true },
  ],
  'power bi': [
    { titulo: 'Ruta de aprendizaje de Power BI', proveedor: 'Microsoft Learn', url: 'https://learn.microsoft.com/es-es/training/powerplatform/power-bi', gratis: true },
  ],
  tableau: [
    { titulo: 'Tableau Free Training', proveedor: 'Tableau', url: 'https://www.tableau.com/learn/training/20222', gratis: true },
  ],
  excel: [
    { titulo: 'Formacion de Excel', proveedor: 'Microsoft', url: 'https://support.microsoft.com/es-es/office/formacion-de-excel-9bc05390-e94c-46af-a5b3-d7c22f6990bb', gratis: true },
  ],

  // --- Infra / DevOps ---
  docker: [
    { titulo: 'Docker: Get Started', proveedor: 'docker.com', url: 'https://docs.docker.com/get-started/', gratis: true },
  ],
  kubernetes: [
    { titulo: 'Kubernetes Basics', proveedor: 'kubernetes.io', url: 'https://kubernetes.io/es/docs/tutorials/kubernetes-basics/', gratis: true },
  ],
  aws: [
    { titulo: 'AWS Skill Builder', proveedor: 'Amazon', url: 'https://skillbuilder.aws/', gratis: true },
  ],
  azure: [
    { titulo: 'Rutas de Azure', proveedor: 'Microsoft Learn', url: 'https://learn.microsoft.com/es-es/training/azure/', gratis: true },
  ],
  gcp: [
    { titulo: 'Google Cloud Training', proveedor: 'Google', url: 'https://cloud.google.com/learn/training', gratis: true },
  ],
  terraform: [
    { titulo: 'Terraform Tutorials', proveedor: 'HashiCorp', url: 'https://developer.hashicorp.com/terraform/tutorials', gratis: true },
  ],
  linux: [
    { titulo: 'Linux Journey', proveedor: 'linuxjourney.com', url: 'https://linuxjourney.com/', gratis: true },
  ],
  'ci/cd': [
    { titulo: 'GitHub Actions', proveedor: 'GitHub Docs', url: 'https://docs.github.com/es/actions', gratis: true },
  ],
  git: [
    { titulo: 'Pro Git (libro completo, en espanol)', proveedor: 'git-scm.com', url: 'https://git-scm.com/book/es/v2', gratis: true },
    { titulo: 'Learn Git Branching (interactivo)', proveedor: 'learngitbranching.js.org', url: 'https://learngitbranching.js.org/?locale=es_ES', gratis: true },
  ],

  // --- QA ---
  testing: [
    { titulo: 'Quality Assurance (certificacion)', proveedor: 'freeCodeCamp', url: 'https://www.freecodecamp.org/learn/quality-assurance/', gratis: true },
  ],
  selenium: [
    { titulo: 'Documentacion de Selenium', proveedor: 'selenium.dev', url: 'https://www.selenium.dev/documentation/', gratis: true },
  ],
  cypress: [
    { titulo: 'Cypress: Get Started', proveedor: 'cypress.io', url: 'https://docs.cypress.io/app/get-started/why-cypress', gratis: true },
  ],

  // --- Diseno / producto ---
  figma: [
    { titulo: 'Figma Learn', proveedor: 'Figma', url: 'https://help.figma.com/hc/en-us', gratis: true },
  ],
  ux: [
    { titulo: 'Google UX Design Certificate', proveedor: 'Coursera · Google', url: 'https://www.coursera.org/professional-certificates/google-ux-design', gratis: 'auditable' },
  ],
  ui: [
    { titulo: 'Material Design 3', proveedor: 'Google', url: 'https://m3.material.io/', gratis: true },
  ],
  scrum: [
    { titulo: 'La Guia de Scrum (en espanol)', proveedor: 'scrumguides.org', url: 'https://scrumguides.org/', gratis: true },
  ],

  // --- Idiomas ---
  ingles: [
    { titulo: 'Ingles desde espanol', proveedor: 'Duolingo', url: 'https://www.duolingo.com/', gratis: true },
    { titulo: 'English for Career Development', proveedor: 'Coursera · U. Pennsylvania', url: 'https://www.coursera.org/learn/careerdevelopment', gratis: 'auditable' },
  ],
};

/**
 * Cursos para una skill. Si no esta en el catalogo, se generan busquedas.
 *
 * Una skill sin recomendacion es un callejon sin salida: el usuario ve "te falta
 * X" y no sabe que hacer. Las busquedas son un peor recurso que un curso
 * curado, pero infinitamente mejor que un hueco.
 */
function cursosPara(skill) {
  const curados = CURSOS[skill];
  if (curados?.length) return curados;

  const q = encodeURIComponent(skill);
  return [
    {
      titulo: `Buscar "${skill}" en Coursera`,
      proveedor: 'Coursera',
      url: `https://www.coursera.org/search?query=${q}`,
      gratis: 'auditable',
    },
    {
      titulo: `Tutoriales de "${skill}" en YouTube`,
      proveedor: 'YouTube',
      url: `https://www.youtube.com/results?search_query=${q}+curso+espanol`,
      gratis: true,
    },
  ];
}

module.exports = { CURSOS, cursosPara };
