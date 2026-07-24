/**
 * Icono de una skill/herramienta.
 *
 * Los logos reales se consumen de Devicon via jsDelivr (CDN), a color:
 *   https://cdn.jsdelivr.net/gh/devicons/devicon/icons/<name>/<name>-<variante>.svg
 * El mapa LOGOS resuelve cada skill a su ruta (variante verificada contra el
 * catalogo oficial de Devicon).
 *
 * Las skills que NO son un producto con logo (sql generico, rest, testing, ux,
 * "machine learning"...) caen en un badge: un cuadro de color con su abreviatura.
 */
const CDN = 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons';

const LOGOS = {
  python: 'python/python-original',
  javascript: 'javascript/javascript-original',
  typescript: 'typescript/typescript-original',
  java: 'java/java-original',
  'c#': 'csharp/csharp-original',
  php: 'php/php-original',
  go: 'go/go-original',
  ruby: 'ruby/ruby-original',
  kotlin: 'kotlin/kotlin-original',
  swift: 'swift/swift-original',
  'node.js': 'nodejs/nodejs-original',
  express: 'express/express-original',
  django: 'django/django-plain',
  flask: 'flask/flask-original',
  fastapi: 'fastapi/fastapi-original',
  spring: 'spring/spring-original',
  laravel: 'laravel/laravel-original',
  graphql: 'graphql/graphql-plain',
  react: 'react/react-original',
  angular: 'angular/angular-original',
  vue: 'vuejs/vuejs-original',
  nextjs: 'nextjs/nextjs-original',
  html: 'html5/html5-original',
  css: 'css3/css3-original',
  tailwind: 'tailwindcss/tailwindcss-original',
  postgresql: 'postgresql/postgresql-original',
  mysql: 'mysql/mysql-original',
  mongodb: 'mongodb/mongodb-original',
  redis: 'redis/redis-original',
  pandas: 'pandas/pandas-original',
  airflow: 'apacheairflow/apacheairflow-original',
  pytorch: 'pytorch/pytorch-original',
  tensorflow: 'tensorflow/tensorflow-original',
  docker: 'docker/docker-original',
  kubernetes: 'kubernetes/kubernetes-original',
  aws: 'amazonwebservices/amazonwebservices-original-wordmark',
  azure: 'azure/azure-original',
  gcp: 'googlecloud/googlecloud-original',
  terraform: 'terraform/terraform-original',
  linux: 'linux/linux-original',
  'ci/cd': 'githubactions/githubactions-original',
  git: 'git/git-original',
  selenium: 'selenium/selenium-original',
  cypress: 'cypressio/cypressio-original',
  figma: 'figma/figma-original',
};

/** Badge de color para skills sin logo (abreviatura + tono de marca). */
const BADGE = {
  sql: { label: 'SQL', bg: '#336791' },
  rest: { label: 'API', bg: '#2b6cb0' },
  microservicios: { label: 'µS', bg: '#4f46e5' },
  etl: { label: 'ETL', bg: '#0f766e' },
  'machine learning': { label: 'ML', bg: '#7c3aed' },
  'power bi': { label: 'BI', bg: '#f2c811', fg: '#12131a' },
  tableau: { label: 'Tb', bg: '#e97627' },
  excel: { label: 'XL', bg: '#217346' },
  testing: { label: 'QA', bg: '#15803d' },
  selenium: { label: 'Se', bg: '#43b02a' },
  ux: { label: 'UX', bg: '#4285f4' },
  ui: { label: 'UI', bg: '#6d28d9' },
  scrum: { label: 'Sc', bg: '#0ea5e9' },
  ingles: { label: 'EN', bg: '#2563eb' },
};

/** Color estable para skills sin marca curada: mismo nombre -> mismo tono. */
function colorDe(skill) {
  let h = 0;
  for (let i = 0; i < skill.length; i += 1) h = (h * 31 + skill.charCodeAt(i)) % 360;
  return `hsl(${h} 48% 42%)`;
}

export default function SkillIcon({ skill, size = 40 }) {
  const clave = String(skill || '').toLowerCase();
  const logo = LOGOS[clave];

  if (logo) {
    return (
      <span className="skillogo skillogo--img" style={{ width: size, height: size }} aria-hidden="true">
        {/* referrerPolicy: el CDN no necesita saber de donde viene el clic. */}
        <img src={`${CDN}/${logo}.svg`} alt="" loading="lazy" referrerPolicy="no-referrer" />
      </span>
    );
  }

  const b = BADGE[clave];
  const bg = b?.bg ?? colorDe(clave);
  const fg = b?.fg ?? '#fff';
  const label = b?.label ?? clave.slice(0, 2).toUpperCase();

  return (
    <span
      className="skillogo"
      style={{ width: size, height: size, background: bg, color: fg, fontSize: Math.round(size * 0.34) }}
      aria-hidden="true"
    >
      {label}
    </span>
  );
}
