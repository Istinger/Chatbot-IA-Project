/**
 * Banco estatico de preguntas de entrevista. CERO IA -> $0.
 *
 * Es la base del modo hibrido: las preguntas salen de aqui (gratis) y la IA solo
 * se usa, racionada, para una repregunta puntual y para el feedback final.
 *
 * Organizado por TIPO (tecnica | rrhh | mixta) y, en tecnica, por AREA. El nivel
 * se usa para elegir cuantas preguntas duras entran. Preguntas en espanol de
 * Ecuador, abiertas (para que el candidato practique explicar, no responder si/no).
 */

// Preguntas de RRHH / comportamiento: valen para cualquier puesto.
const RRHH = [
  'Cuentame sobre ti en un minuto: quien eres y que buscas.',
  'Por que te interesa este puesto y esta empresa?',
  'Cuentame un proyecto del que te sientas orgulloso y cual fue tu aporte.',
  'Describe un momento en que trabajaste en equipo y hubo un desacuerdo. Que hiciste?',
  'Cuentame de una vez que cometiste un error. Como lo resolviste y que aprendiste?',
  'Como priorizas cuando tienes varias tareas y poco tiempo?',
  'Cuales dirias que son tus dos principales fortalezas y una debilidad real?',
  'Como te mantienes al dia y sigues aprendiendo en tu area?',
  'Donde te ves profesionalmente en dos o tres anos?',
  'Cuentame de una vez que recibiste una critica dificil. Como reaccionaste?',
];

// Preguntas tecnicas por area. `general` aplica a cualquier perfil tecnico.
const TECNICA = {
  general: [
    'Explica un concepto tecnico que domines como si se lo contaras a alguien sin experiencia.',
    'Como abordas un bug que no sabes reproducir?',
    'Que haces cuando te atascas en un problema por mas de una hora?',
    'Como decides entre resolver algo rapido o hacerlo bien desde el inicio?',
    'Que es para ti codigo "limpio" y por que importa?',
  ],
  frontend: [
    'Que diferencia hay entre estado local y estado global, y cuando usarias cada uno?',
    'Como harias accesible (a11y) un formulario? Menciona al menos tres cosas concretas.',
    'Explica que es el modelo de caja de CSS y como afecta al layout.',
    'Como evitarias que una lista larga vuelva lenta la interfaz?',
    'Que pasa, paso a paso, desde que el usuario escribe una URL hasta que ve la pagina?',
    'Como manejas el estado de carga, error y vacio en una vista que pide datos?',
  ],
  backend: [
    'Que es una API REST y como disenarias el endpoint para crear un recurso?',
    'Como proteges una contrasena en la base de datos y por que asi?',
    'Explica la diferencia entre autenticacion y autorizacion.',
    'Que es un indice en una base de datos y cuando conviene ponerlo?',
    'Como evitarias que un endpoint lento bloquee a todos los usuarios?',
    'Que devuelve tu API cuando algo falla? Como manejas los errores?',
  ],
  data: [
    'Como limpiarias un dataset con valores faltantes y datos inconsistentes?',
    'Que metrica elegirias para evaluar un modelo y por que no solo la exactitud?',
    'Explica la diferencia entre correlacion y causalidad con un ejemplo.',
    'Como comunicarias un hallazgo de datos a alguien no tecnico?',
    'Que es el sobreajuste (overfitting) y como lo detectas?',
  ],
  ux: [
    'Como validarias que un diseno resuelve el problema del usuario?',
    'Cuentame tu proceso desde que recibes un problema hasta el prototipo.',
    'Como priorizas que arreglar cuando una prueba de usabilidad arroja diez problemas?',
    'Que diferencia hay entre UX y UI, y por que importan las dos?',
    'Como defenderias una decision de diseno ante alguien que no esta de acuerdo?',
  ],
  devops: [
    'Que gana un proyecto al dockerizarse y que problema resuelve?',
    'Explica que hace un pipeline de CI/CD, paso a paso.',
    'Como desplegarias una app con cero downtime?',
    'Que revisas primero si un servicio en produccion empieza a fallar?',
    'Como manejas los secretos (claves, tokens) en un despliegue?',
  ],
  mobile: [
    'Como manejas que una app siga usable sin conexion?',
    'Que consideras para que una app no consuma demasiada bateria o datos?',
    'Como adaptas una interfaz a pantallas de tamanos muy distintos?',
    'Explica el ciclo de vida basico de una pantalla en una app movil.',
    'Como manejarias el estado de carga y error al pedir datos a una API?',
  ],
};

// Mapa palabra-clave -> area, para deducir el area del puesto que escribe el usuario.
const CLAVES_AREA = {
  frontend: ['frontend', 'front-end', 'react', 'vue', 'angular', 'css', 'ui develop', 'maquet'],
  backend: ['backend', 'back-end', 'api', 'node', 'java', 'python back', 'php', 'servidor', 'base de datos'],
  data: ['data', 'datos', 'analista', 'analyst', 'machine learning', 'ml', 'cientifico', 'bi', 'sql'],
  ux: ['ux', 'ui/ux', 'diseno', 'disenador', 'designer', 'producto', 'research'],
  devops: ['devops', 'infra', 'cloud', 'docker', 'kubernetes', 'sre', 'sistemas'],
  mobile: ['mobile', 'movil', 'android', 'ios', 'react native', 'flutter'],
};

/** Deduce el area a partir del texto del puesto. Cae a 'general' si no calza. */
function areaDePuesto(texto = '') {
  const t = String(texto).toLowerCase();
  for (const [area, claves] of Object.entries(CLAVES_AREA)) {
    if (claves.some((c) => t.includes(c))) return area;
  }
  // "fullstack" toca ambos: se prioriza backend por sus preguntas de sistema.
  if (t.includes('fullstack') || t.includes('full stack') || t.includes('full-stack')) return 'backend';
  return 'general';
}

/** Baraja sin mutar (Fisher-Yates). */
function barajar(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Devuelve N preguntas para la config dada, sin repetir.
 *
 *  - tecnica: preguntas del area (+ generales de relleno).
 *  - rrhh: preguntas de comportamiento.
 *  - mixta: arranca con 1 de RRHH ("hablame de ti"), luego tecnicas del area.
 *
 * El nivel modula cuantas: junior 4, semi 5, senior 6 (por defecto 5).
 */
function preguntasPara({ tipo = 'mixta', area = 'general', nivel = 'junior', n } = {}) {
  const cuantas = n || { junior: 4, 'semi senior': 5, semi: 5, senior: 6 }[String(nivel).toLowerCase()] || 5;

  const tecnicas = barajar([...(TECNICA[area] || []), ...TECNICA.general]);
  const rrhh = barajar(RRHH);

  let base;
  if (tipo === 'tecnica') {
    base = tecnicas;
  } else if (tipo === 'rrhh') {
    base = rrhh;
  } else {
    // mixta: 'hablame de ti' primero + intercalar tecnica/rrhh.
    const intro = RRHH[0];
    base = [intro, ...barajar([...tecnicas.slice(0, cuantas), ...rrhh.slice(1, cuantas)])];
  }

  // Sin duplicados, recortado a `cuantas`.
  const vistas = new Set();
  const salida = [];
  for (const q of base) {
    if (!vistas.has(q)) {
      vistas.add(q);
      salida.push(q);
    }
    if (salida.length >= cuantas) break;
  }
  return salida;
}

module.exports = { RRHH, TECNICA, areaDePuesto, preguntasPara };
