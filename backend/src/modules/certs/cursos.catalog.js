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
 *
 * Campos por curso:
 *   titulo, proveedor, url
 *   gratis: true (contenido completo gratis) | 'auditable' (gratis; certificado de pago)
 *   nivel:  'Basico' | 'Intermedio' | 'Avanzado'
 *   horas:  estimacion de dedicacion (numero). Es una GUIA, no un dato oficial:
 *           sirve para ordenar el esfuerzo, no para prometer una duracion exacta.
 *   descripcion: una linea de que se lleva el usuario del curso.
 */

// gratis: true       -> el contenido completo es gratuito
// gratis: 'auditable'-> se puede cursar gratis; el certificado se paga
const CURSOS = {
  // --- Lenguajes ---
  python: [
    { titulo: 'Python for Everybody', proveedor: 'Coursera · U. Michigan', url: 'https://www.coursera.org/specializations/python', gratis: 'auditable', nivel: 'Basico', horas: 40, descripcion: 'Programacion desde cero con Python, datos y web scraping.' },
    { titulo: 'Tutorial oficial de Python', proveedor: 'python.org', url: 'https://docs.python.org/es/3/tutorial/', gratis: true, nivel: 'Basico', horas: 10, descripcion: 'La referencia oficial del lenguaje, en espanol.' },
  ],
  javascript: [
    { titulo: 'JavaScript Algorithms and Data Structures', proveedor: 'freeCodeCamp', url: 'https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures/', gratis: true, nivel: 'Intermedio', horas: 30, descripcion: 'JavaScript moderno, algoritmos y estructuras de datos.' },
    { titulo: 'Guia de JavaScript', proveedor: 'MDN', url: 'https://developer.mozilla.org/es/docs/Web/JavaScript/Guide', gratis: true, nivel: 'Basico', horas: 12, descripcion: 'Fundamentos del lenguaje explicados por Mozilla.' },
  ],
  typescript: [
    { titulo: 'TypeScript Handbook', proveedor: 'typescriptlang.org', url: 'https://www.typescriptlang.org/docs/handbook/intro.html', gratis: true, nivel: 'Intermedio', horas: 8, descripcion: 'Tipado estatico sobre JavaScript, de la fuente oficial.' },
  ],
  java: [
    { titulo: 'Learn Java', proveedor: 'dev.java (Oracle)', url: 'https://dev.java/learn/', gratis: true, nivel: 'Basico', horas: 20, descripcion: 'Ruta oficial de Oracle para aprender Java.' },
  ],
  'c#': [
    { titulo: 'Tour of C#', proveedor: 'Microsoft Learn', url: 'https://learn.microsoft.com/en-us/dotnet/csharp/tour-of-csharp/', gratis: true, nivel: 'Basico', horas: 12, descripcion: 'Recorrido por C# y .NET desde Microsoft.' },
  ],
  php: [
    { titulo: 'Manual de PHP', proveedor: 'php.net', url: 'https://www.php.net/manual/es/tutorial.php', gratis: true, nivel: 'Basico', horas: 10, descripcion: 'Tutorial oficial de PHP en espanol.' },
  ],
  go: [
    { titulo: 'A Tour of Go', proveedor: 'go.dev', url: 'https://go.dev/tour/', gratis: true, nivel: 'Intermedio', horas: 6, descripcion: 'Introduccion interactiva al lenguaje Go.' },
  ],
  ruby: [
    { titulo: 'Rails: Getting Started', proveedor: 'rubyonrails.org', url: 'https://guides.rubyonrails.org/getting_started.html', gratis: true, nivel: 'Intermedio', horas: 8, descripcion: 'Tu primera app con Ruby on Rails.' },
  ],
  kotlin: [
    { titulo: 'Kotlin: Getting Started', proveedor: 'kotlinlang.org', url: 'https://kotlinlang.org/docs/getting-started.html', gratis: true, nivel: 'Basico', horas: 8, descripcion: 'Primeros pasos con Kotlin desde la fuente oficial.' },
  ],
  swift: [
    { titulo: 'Swift Documentation', proveedor: 'swift.org', url: 'https://www.swift.org/documentation/', gratis: true, nivel: 'Basico', horas: 10, descripcion: 'Documentacion oficial del lenguaje Swift.' },
  ],
  sql: [
    { titulo: 'Relational Database (certificacion)', proveedor: 'freeCodeCamp', url: 'https://www.freecodecamp.org/learn/relational-database/', gratis: true, nivel: 'Basico', horas: 25, descripcion: 'Bases de datos relacionales y SQL con proyectos.' },
  ],

  // --- Backend ---
  'node.js': [
    { titulo: 'Back End Development and APIs', proveedor: 'freeCodeCamp', url: 'https://www.freecodecamp.org/learn/back-end-development-and-apis/', gratis: true, nivel: 'Intermedio', horas: 30, descripcion: 'APIs y backend con Node.js y Express.' },
    { titulo: 'Learn Node.js', proveedor: 'nodejs.org', url: 'https://nodejs.org/en/learn', gratis: true, nivel: 'Basico', horas: 10, descripcion: 'Guia oficial de Node.js desde los fundamentos.' },
  ],
  express: [
    { titulo: 'Guia de Express', proveedor: 'expressjs.com', url: 'https://expressjs.com/es/guide/routing.html', gratis: true, nivel: 'Intermedio', horas: 6, descripcion: 'Rutas y middleware con Express, en espanol.' },
  ],
  django: [
    { titulo: 'Tutorial oficial de Django', proveedor: 'djangoproject.com', url: 'https://docs.djangoproject.com/es/stable/intro/tutorial01/', gratis: true, nivel: 'Intermedio', horas: 12, descripcion: 'Construye una app web completa con Django.' },
  ],
  flask: [
    { titulo: 'Flask Tutorial', proveedor: 'palletsprojects.com', url: 'https://flask.palletsprojects.com/en/stable/tutorial/', gratis: true, nivel: 'Intermedio', horas: 8, descripcion: 'Microframework web de Python paso a paso.' },
  ],
  fastapi: [
    { titulo: 'Tutorial de FastAPI', proveedor: 'fastapi.tiangolo.com', url: 'https://fastapi.tiangolo.com/es/tutorial/', gratis: true, nivel: 'Intermedio', horas: 8, descripcion: 'APIs rapidas y tipadas con Python, en espanol.' },
  ],
  spring: [
    { titulo: 'Spring Guides', proveedor: 'spring.io', url: 'https://spring.io/guides', gratis: true, nivel: 'Intermedio', horas: 15, descripcion: 'Guias oficiales de Spring y Spring Boot.' },
  ],
  laravel: [
    { titulo: 'Documentacion de Laravel', proveedor: 'laravel.com', url: 'https://laravel.com/docs', gratis: true, nivel: 'Intermedio', horas: 12, descripcion: 'Framework PHP moderno, de la fuente oficial.' },
  ],
  rest: [
    { titulo: 'HTTP y APIs REST', proveedor: 'MDN', url: 'https://developer.mozilla.org/es/docs/Web/HTTP', gratis: true, nivel: 'Basico', horas: 6, descripcion: 'Como funcionan HTTP y las APIs REST.' },
  ],
  graphql: [
    { titulo: 'Learn GraphQL', proveedor: 'graphql.org', url: 'https://graphql.org/learn/', gratis: true, nivel: 'Intermedio', horas: 6, descripcion: 'Consultas de APIs con GraphQL desde su web oficial.' },
  ],
  microservicios: [
    { titulo: 'Microservices Patterns', proveedor: 'microservices.io', url: 'https://microservices.io/patterns/microservices.html', gratis: true, nivel: 'Avanzado', horas: 10, descripcion: 'Patrones de arquitectura de microservicios.' },
  ],

  // --- Frontend ---
  react: [
    { titulo: 'Aprende React', proveedor: 'react.dev', url: 'https://es.react.dev/learn', gratis: true, nivel: 'Intermedio', horas: 15, descripcion: 'La guia oficial de React, en espanol.' },
    { titulo: 'Front End Development Libraries', proveedor: 'freeCodeCamp', url: 'https://www.freecodecamp.org/learn/front-end-development-libraries/', gratis: true, nivel: 'Intermedio', horas: 30, descripcion: 'React, Redux, Bootstrap y Sass con proyectos.' },
  ],
  angular: [
    { titulo: 'Tutoriales de Angular', proveedor: 'angular.dev', url: 'https://angular.dev/tutorials', gratis: true, nivel: 'Intermedio', horas: 15, descripcion: 'Tutoriales oficiales del framework Angular.' },
  ],
  vue: [
    { titulo: 'Tutorial de Vue', proveedor: 'vuejs.org', url: 'https://vuejs.org/tutorial/', gratis: true, nivel: 'Basico', horas: 8, descripcion: 'Introduccion interactiva a Vue.js.' },
  ],
  nextjs: [
    { titulo: 'Learn Next.js', proveedor: 'nextjs.org', url: 'https://nextjs.org/learn', gratis: true, nivel: 'Intermedio', horas: 10, descripcion: 'Framework de React para produccion, paso a paso.' },
  ],
  html: [
    { titulo: 'Responsive Web Design (certificacion)', proveedor: 'freeCodeCamp', url: 'https://www.freecodecamp.org/learn/responsive-web-design/', gratis: true, nivel: 'Basico', horas: 30, descripcion: 'HTML y CSS responsivo con proyectos y certificado.' },
  ],
  css: [
    { titulo: 'Aprende CSS', proveedor: 'web.dev (Google)', url: 'https://web.dev/learn/css', gratis: true, nivel: 'Intermedio', horas: 12, descripcion: 'CSS moderno explicado por Google.' },
  ],
  tailwind: [
    { titulo: 'Documentacion de Tailwind', proveedor: 'tailwindcss.com', url: 'https://tailwindcss.com/docs/styling-with-utility-classes', gratis: true, nivel: 'Basico', horas: 5, descripcion: 'CSS por utilidades, de la fuente oficial.' },
  ],

  // --- Datos / IA ---
  postgresql: [
    { titulo: 'Tutorial de PostgreSQL', proveedor: 'postgresql.org', url: 'https://www.postgresql.org/docs/current/tutorial.html', gratis: true, nivel: 'Intermedio', horas: 8, descripcion: 'Base de datos relacional avanzada, oficial.' },
  ],
  mysql: [
    { titulo: 'MySQL Tutorial', proveedor: 'dev.mysql.com', url: 'https://dev.mysql.com/doc/mysql-tutorial-excerpt/8.0/en/', gratis: true, nivel: 'Basico', horas: 6, descripcion: 'Primeros pasos con la base de datos MySQL.' },
  ],
  mongodb: [
    { titulo: 'MongoDB University', proveedor: 'MongoDB', url: 'https://learn.mongodb.com/', gratis: true, nivel: 'Intermedio', horas: 12, descripcion: 'Cursos oficiales de la base de datos NoSQL.' },
  ],
  redis: [
    { titulo: 'Redis University', proveedor: 'Redis', url: 'https://redis.io/learn', gratis: true, nivel: 'Intermedio', horas: 6, descripcion: 'Cache y estructuras en memoria con Redis.' },
  ],
  pandas: [
    { titulo: 'Data Analysis with Python (certificacion)', proveedor: 'freeCodeCamp', url: 'https://www.freecodecamp.org/learn/data-analysis-with-python/', gratis: true, nivel: 'Intermedio', horas: 30, descripcion: 'Analisis de datos con Pandas y NumPy.' },
  ],
  etl: [
    { titulo: 'Data Engineering Foundations', proveedor: 'Coursera · IBM', url: 'https://www.coursera.org/professional-certificates/ibm-data-engineer', gratis: 'auditable', nivel: 'Intermedio', horas: 40, descripcion: 'Fundamentos de ingenieria de datos y ETL.' },
  ],
  airflow: [
    { titulo: 'Tutorial de Apache Airflow', proveedor: 'airflow.apache.org', url: 'https://airflow.apache.org/docs/apache-airflow/stable/tutorial/', gratis: true, nivel: 'Avanzado', horas: 8, descripcion: 'Orquestacion de pipelines de datos con Airflow.' },
  ],
  'machine learning': [
    { titulo: 'Machine Learning Specialization', proveedor: 'Coursera · Andrew Ng', url: 'https://www.coursera.org/specializations/machine-learning-introduction', gratis: 'auditable', nivel: 'Intermedio', horas: 60, descripcion: 'El clasico de Andrew Ng: fundamentos de ML.' },
    { titulo: 'Machine Learning with Python', proveedor: 'freeCodeCamp', url: 'https://www.freecodecamp.org/learn/machine-learning-with-python/', gratis: true, nivel: 'Intermedio', horas: 30, descripcion: 'ML practico con Python y TensorFlow.' },
  ],
  pytorch: [
    { titulo: 'PyTorch Tutorials', proveedor: 'pytorch.org', url: 'https://pytorch.org/tutorials/', gratis: true, nivel: 'Avanzado', horas: 15, descripcion: 'Deep learning con PyTorch, oficial.' },
  ],
  tensorflow: [
    { titulo: 'Tutoriales de TensorFlow', proveedor: 'tensorflow.org', url: 'https://www.tensorflow.org/tutorials?hl=es', gratis: true, nivel: 'Avanzado', horas: 15, descripcion: 'Redes neuronales con TensorFlow, en espanol.' },
  ],
  'power bi': [
    { titulo: 'Ruta de aprendizaje de Power BI', proveedor: 'Microsoft Learn', url: 'https://learn.microsoft.com/es-es/training/powerplatform/power-bi', gratis: true, nivel: 'Basico', horas: 12, descripcion: 'Visualizacion de datos con Power BI.' },
  ],
  tableau: [
    { titulo: 'Tableau Free Training', proveedor: 'Tableau', url: 'https://www.tableau.com/learn/training/20222', gratis: true, nivel: 'Basico', horas: 10, descripcion: 'Videos oficiales para dominar Tableau.' },
  ],
  excel: [
    { titulo: 'Formacion de Excel', proveedor: 'Microsoft', url: 'https://support.microsoft.com/es-es/office/formacion-de-excel-9bc05390-e94c-46af-a5b3-d7c22f6990bb', gratis: true, nivel: 'Basico', horas: 8, descripcion: 'Cursos oficiales de Excel, de basico a formulas.' },
  ],

  // --- Infra / DevOps ---
  docker: [
    { titulo: 'Docker: Get Started', proveedor: 'docker.com', url: 'https://docs.docker.com/get-started/', gratis: true, nivel: 'Intermedio', horas: 6, descripcion: 'Contenedores desde cero, guia oficial.' },
  ],
  kubernetes: [
    { titulo: 'Kubernetes Basics', proveedor: 'kubernetes.io', url: 'https://kubernetes.io/es/docs/tutorials/kubernetes-basics/', gratis: true, nivel: 'Avanzado', horas: 10, descripcion: 'Orquestacion de contenedores, tutorial oficial.' },
  ],
  aws: [
    { titulo: 'AWS Skill Builder', proveedor: 'Amazon', url: 'https://skillbuilder.aws/', gratis: true, nivel: 'Intermedio', horas: 20, descripcion: 'Formacion oficial en la nube de Amazon.' },
  ],
  azure: [
    { titulo: 'Rutas de Azure', proveedor: 'Microsoft Learn', url: 'https://learn.microsoft.com/es-es/training/azure/', gratis: true, nivel: 'Intermedio', horas: 20, descripcion: 'Rutas de aprendizaje de la nube de Microsoft.' },
  ],
  gcp: [
    { titulo: 'Google Cloud Training', proveedor: 'Google', url: 'https://cloud.google.com/learn/training', gratis: true, nivel: 'Intermedio', horas: 20, descripcion: 'Formacion oficial de Google Cloud.' },
  ],
  terraform: [
    { titulo: 'Terraform Tutorials', proveedor: 'HashiCorp', url: 'https://developer.hashicorp.com/terraform/tutorials', gratis: true, nivel: 'Avanzado', horas: 10, descripcion: 'Infraestructura como codigo con Terraform.' },
  ],
  linux: [
    { titulo: 'Linux Journey', proveedor: 'linuxjourney.com', url: 'https://linuxjourney.com/', gratis: true, nivel: 'Basico', horas: 12, descripcion: 'Linux desde cero, de forma guiada y gratuita.' },
  ],
  'ci/cd': [
    { titulo: 'GitHub Actions', proveedor: 'GitHub Docs', url: 'https://docs.github.com/es/actions', gratis: true, nivel: 'Intermedio', horas: 8, descripcion: 'Integracion y despliegue continuo con Actions.' },
  ],
  git: [
    { titulo: 'Pro Git (libro completo, en espanol)', proveedor: 'git-scm.com', url: 'https://git-scm.com/book/es/v2', gratis: true, nivel: 'Basico', horas: 10, descripcion: 'El libro de referencia de Git, gratis y en espanol.' },
    { titulo: 'Learn Git Branching (interactivo)', proveedor: 'learngitbranching.js.org', url: 'https://learngitbranching.js.org/?locale=es_ES', gratis: true, nivel: 'Basico', horas: 4, descripcion: 'Ramas de Git aprendidas jugando.' },
  ],

  // --- QA ---
  testing: [
    { titulo: 'Quality Assurance (certificacion)', proveedor: 'freeCodeCamp', url: 'https://www.freecodecamp.org/learn/quality-assurance/', gratis: true, nivel: 'Intermedio', horas: 25, descripcion: 'Testing y aseguramiento de calidad con proyectos.' },
  ],
  selenium: [
    { titulo: 'Documentacion de Selenium', proveedor: 'selenium.dev', url: 'https://www.selenium.dev/documentation/', gratis: true, nivel: 'Intermedio', horas: 8, descripcion: 'Automatizacion de pruebas de navegador.' },
  ],
  cypress: [
    { titulo: 'Cypress: Get Started', proveedor: 'cypress.io', url: 'https://docs.cypress.io/app/get-started/why-cypress', gratis: true, nivel: 'Intermedio', horas: 6, descripcion: 'Pruebas end-to-end modernas para la web.' },
  ],

  // --- Diseno / producto ---
  figma: [
    { titulo: 'Figma Learn', proveedor: 'Figma', url: 'https://help.figma.com/hc/en-us', gratis: true, nivel: 'Basico', horas: 6, descripcion: 'Diseno de interfaces con Figma, oficial.' },
  ],
  ux: [
    { titulo: 'Google UX Design Certificate', proveedor: 'Coursera · Google', url: 'https://www.coursera.org/professional-certificates/google-ux-design', gratis: 'auditable', nivel: 'Basico', horas: 60, descripcion: 'Certificado profesional de UX de Google.' },
  ],
  ui: [
    { titulo: 'Material Design 3', proveedor: 'Google', url: 'https://m3.material.io/', gratis: true, nivel: 'Intermedio', horas: 6, descripcion: 'Sistema de diseno de interfaces de Google.' },
  ],
  scrum: [
    { titulo: 'La Guia de Scrum (en espanol)', proveedor: 'scrumguides.org', url: 'https://scrumguides.org/', gratis: true, nivel: 'Basico', horas: 3, descripcion: 'El marco Scrum oficial, lectura breve.' },
  ],

  // --- Idiomas ---
  ingles: [
    { titulo: 'Ingles desde espanol', proveedor: 'Duolingo', url: 'https://www.duolingo.com/', gratis: true, nivel: 'Basico', horas: 40, descripcion: 'Practica diaria de ingles, gratis y gamificada.' },
    { titulo: 'English for Career Development', proveedor: 'Coursera · U. Pennsylvania', url: 'https://www.coursera.org/learn/careerdevelopment', gratis: 'auditable', nivel: 'Intermedio', horas: 20, descripcion: 'Ingles enfocado a la busqueda de empleo.' },
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
      nivel: 'Basico',
      horas: null,
      descripcion: `Cursos de ${skill} en Coursera.`,
    },
    {
      titulo: `Tutoriales de "${skill}" en YouTube`,
      proveedor: 'YouTube',
      url: `https://www.youtube.com/results?search_query=${q}+curso+espanol`,
      gratis: true,
      nivel: 'Basico',
      horas: null,
      descripcion: `Tutoriales gratuitos de ${skill} en video.`,
    },
  ];
}

module.exports = { CURSOS, cursosPara };
