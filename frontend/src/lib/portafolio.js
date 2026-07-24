/**
 * Catalogo estatico de "Ideas para portafolio".
 *
 * Cero backend: son ideas curadas para que un egresado tenga un proyecto que
 * enseñar. Cada idea trae su caso de estudio (objetivo, entregables...) y todas
 * comparten el mismo asistente de 4 fases (FASES), que es un metodo de proyecto
 * generico aplicable a cualquiera.
 *
 * Las imagenes del mock (renders/fotos) no se pueden generar aqui: cada idea
 * lleva un `tono` (gradiente de marca) + `icono`, y la UI pinta ese placeholder.
 */

export const IDEAS = [
  {
    id: 'delivery',
    destacada: true,
    titulo: 'Rediseño de app de delivery',
    tipo: 'UI/UX',
    nivel: 'Junior',
    categoria: 'Caso de estudio',
    icono: 'ojo',
    tono: ['#1e3a5f', '#0b1e33'],
    img: 'food,delivery,smartphone',
    lock: 21,
    resumen: 'Rediseña una experiencia de delivery más rápida, clara y atractiva.',
    descripcion:
      'Rediseña una aplicación de delivery enfocada en mejorar la experiencia del usuario, la navegación y el proceso de compra.',
    marca: { nombre: 'Delivery UX', sub: 'Caso de estudio de UX/UI' },
    detalle: {
      objetivo:
        'Mejorar la usabilidad y accesibilidad de una app de delivery para aumentar la conversión y la satisfacción del usuario.',
      queCrear:
        'Flujos de usuario, wireframes, UI de alta fidelidad y prototipo interactivo para móvil.',
      entregables:
        'Investigación UX, mapas de flujo, prototipo interactivo, guía de estilos y presentación final.',
      portafolio:
        'Demuestra tu pensamiento de diseño, habilidades UI/UX y capacidad para resolver problemas reales.',
    },
  },
  {
    id: 'cafeteria',
    titulo: 'Landing page para cafetería',
    tipo: 'Web',
    nivel: 'Junior',
    categoria: 'Proyecto real',
    icono: 'globo',
    tono: ['#3f2d1e', '#1f150b'],
    img: 'coffee,cafe',
    lock: 47,
    resumen: 'Diseña una landing moderna que convierta visitantes en clientes.',
    descripcion:
      'Construye una landing page responsiva para una cafetería de especialidad, con foco en la conversión y una estética cálida.',
    marca: { nombre: 'Café de Origen', sub: 'Landing de conversión' },
    detalle: {
      objetivo:
        'Presentar la cafetería y sus productos de forma atractiva para que el visitante reserve o visite el local.',
      queCrear:
        'Una landing responsiva con hero, menú destacado, testimonios y una llamada a la acción clara.',
      entregables:
        'Diseño responsivo, HTML/CSS (o el framework que uses), copys y una guía de estilos ligera.',
      portafolio:
        'Muestra que sabes maquetar, jerarquizar contenido y diseñar pensando en la conversión.',
    },
  },
  {
    id: 'dashboard',
    titulo: 'Dashboard de ventas',
    tipo: 'Data',
    nivel: 'Junior',
    categoria: 'Visualización',
    icono: 'crecer',
    tono: ['#12324a', '#08202f'],
    img: 'laptop,analytics,chart',
    lock: 88,
    resumen: 'Crea un dashboard interactivo para analizar el rendimiento de ventas.',
    descripcion:
      'Diseña y construye un panel que resuma métricas de ventas y permita explorar el rendimiento por periodo y producto.',
    marca: { nombre: 'Impulso Data', sub: 'Panel de métricas' },
    detalle: {
      objetivo:
        'Convertir datos de ventas en decisiones: mostrar KPIs claros y dejar explorar tendencias de un vistazo.',
      queCrear:
        'Un dashboard con KPIs, gráficos de tendencia y filtros por periodo, categoría y producto.',
      entregables:
        'Modelo de datos, dashboard interactivo, definición de métricas y una breve lectura de resultados.',
      portafolio:
        'Demuestra que sabes limpiar datos, elegir la visualización correcta y contar una historia con números.',
    },
  },
  {
    id: 'marca',
    titulo: 'Marca para emprendimiento',
    tipo: 'Branding',
    nivel: 'Junior',
    categoria: 'Identidad visual',
    icono: 'estrella',
    tono: ['#173a2c', '#0a1f18'],
    img: 'branding,stationery,design',
    lock: 63,
    resumen: 'Desarrolla una identidad visual completa para una marca sostenible.',
    descripcion:
      'Crea la identidad visual de un emprendimiento sostenible: logotipo, paleta, tipografías y aplicaciones.',
    marca: { nombre: 'Verde Natura', sub: 'Identidad de marca' },
    detalle: {
      objetivo:
        'Dar a un emprendimiento una identidad coherente y memorable que transmita sus valores.',
      queCrear:
        'Logotipo, paleta de color, sistema tipográfico y aplicaciones (tarjeta, packaging, redes).',
      entregables:
        'Manual de marca, logotipo en varios formatos, paleta, tipografías y mockups de aplicación.',
      portafolio:
        'Muestra criterio visual, coherencia de sistema y capacidad de traducir valores en diseño.',
    },
  },
];

/**
 * Asistente de proyecto: mismo metodo de 4 fases para cualquier idea. Cada fase
 * tiene su checklist (que se hace) y los resultados que deja al terminar.
 */
export const FASES = [
  {
    id: 'analisis',
    nombre: 'Análisis',
    descripcion:
      'En esta fase nos enfocamos en comprender el proyecto, al usuario y el problema antes de construir soluciones efectivas.',
    items: [
      {
        icono: 'ojo',
        titulo: 'Objetivos del proyecto',
        texto: 'Definimos qué se quiere lograr con el proyecto y cuáles son los resultados esperados.',
        intro:
          'Antes de diseñar o programar nada, decide a dónde quieres llegar. Un objetivo claro evita que el proyecto crezca sin control y te da una vara para medir si funcionó.',
        pasos: [
          '¿Qué problema resuelve el proyecto y para quién?',
          '¿Qué debe poder hacer el usuario al terminar?',
          '¿Cómo sabrás que salió bien? (una métrica concreta)',
          '¿Qué NO entra en esta versión? (para acotar el alcance)',
        ],
        tip: 'Escribe el objetivo en una sola frase medible: "que un usuario pueda X en menos de Y".',
      },
      {
        icono: 'usuario',
        titulo: 'Investigación de usuario',
        texto: 'Entendemos a la audiencia objetivo, sus comportamientos, necesidades y motivaciones.',
        intro:
          'Diseñar sin conocer al usuario es adivinar. Con un poco de investigación entiendes a quién sirves y qué le importa de verdad.',
        pasos: [
          '¿Quién es el usuario típico? Descríbelo en 2-3 frases.',
          '¿Qué intenta conseguir y qué le frustra hoy?',
          'Habla con 2-3 personas reales o busca reseñas/foros del tema.',
          'Resume 3 hallazgos que cambiarían tu diseño.',
        ],
        tip: 'Una sola entrevista real vale más que diez suposiciones. Pregunta por lo que HACEN, no por lo que dicen que harían.',
      },
      {
        icono: 'buscar',
        titulo: 'Problema y oportunidad',
        texto: 'Identificamos los puntos de dolor, causas raíz y oportunidades de mejora o innovación.',
        intro:
          'Detrás de cada buen proyecto hay un problema concreto. Definirlo bien es la mitad de la solución.',
        pasos: [
          'Enuncia el problema en una frase, desde la óptica del usuario.',
          '¿Cuál es la causa raíz, no solo el síntoma?',
          '¿Cómo se resuelve hoy y por qué no basta?',
          '¿Dónde está la oportunidad de mejorar o innovar?',
        ],
        tip: 'Si no puedes explicar el problema a alguien ajeno en 30 segundos, todavía no lo tienes claro.',
      },
    ],
    resultados: [
      { icono: 'marcador', titulo: 'Problema definido', texto: 'Hemos identificado el problema central y sus causas clave.' },
      { icono: 'usuario', titulo: 'Usuario comprendido', texto: 'Conocemos a la audiencia y sus necesidades principales.' },
      { icono: 'ojo', titulo: 'Objetivos claros', texto: 'Tenemos objetivos específicos y medibles para el proyecto.' },
    ],
  },
  {
    id: 'preproduccion',
    nombre: 'Preproducción',
    descripcion:
      'En esta fase definimos y estructuramos todo lo necesario para construir sobre bases sólidas. Un buen plan hoy, evita problemas mañana.',
    items: [
      {
        icono: 'lista',
        titulo: 'Requerimientos funcionales',
        texto: 'Definimos las funciones y comportamientos del sistema desde la perspectiva del usuario.',
        intro:
          'Son las cosas que el sistema debe HACER. Listarlas evita que se te olviden funciones clave a mitad del proyecto.',
        pasos: [
          'Enumera las acciones que el usuario podrá realizar.',
          'Escríbelas como "El usuario puede…" o historias de usuario.',
          'Marca cuáles son imprescindibles (MVP) y cuáles opcionales.',
          'Ordénalas por prioridad.',
        ],
        tip: 'Empieza solo por lo imprescindible: un MVP terminado enseña más que una app enorme a medias.',
      },
      {
        icono: 'candado',
        titulo: 'Requerimientos no funcionales',
        texto: 'Establecemos los atributos de calidad, restricciones y criterios técnicos del sistema.',
        intro:
          'Son las cosas que el sistema debe SER: rápido, accesible, seguro, responsivo… La calidad que se nota aunque no se vea en una lista de funciones.',
        pasos: [
          '¿Qué tan rápido debe responder? ¿En qué dispositivos?',
          '¿Necesita ser accesible, responsivo, funcionar offline?',
          '¿Hay límites técnicos (navegadores, tamaño, seguridad)?',
          'Elige 2-3 atributos y hazlos objetivos ("carga < 2s").',
        ],
        tip: 'No intentes cumplirlos todos: elige los 2-3 que de verdad importan para tu proyecto.',
      },
      {
        icono: 'rejilla',
        titulo: 'Diagrama de contexto',
        texto: 'Representamos el sistema y su interacción con actores externos a alto nivel.',
        intro:
          'Un dibujo simple de tu sistema y con quién habla (usuarios, APIs, servicios). Ayuda a ver el todo antes de meterte en los detalles.',
        pasos: [
          'Dibuja tu sistema como una caja en el centro.',
          'Añade alrededor los actores: usuarios, APIs, bases de datos…',
          'Traza flechas con lo que entra y sale de cada uno.',
          'Revisa: ¿falta algún actor o dependencia?',
        ],
        tip: 'A mano en papel o en Excalidraw/Figma basta. No busques perfección, busca claridad.',
      },
    ],
    resultados: [
      { icono: 'marcador', titulo: 'Documentación clara', texto: 'Base sólida para el desarrollo y la toma de decisiones.' },
      { icono: 'usuario', titulo: 'Alcance definido', texto: 'Todos los involucrados alineados con objetivos y expectativas.' },
      { icono: 'ojo', titulo: 'Menos riesgos', texto: 'Identificamos posibles problemas antes de comenzar.' },
    ],
  },
  {
    id: 'pruebas',
    nombre: 'Pruebas',
    descripcion:
      'Construimos una versión funcional y la ponemos a prueba con usuarios y datos reales para ajustar antes del final.',
    items: [
      {
        icono: 'chispa2',
        titulo: 'Prototipo funcional',
        texto: 'Montamos una versión navegable o un primer entregable real.',
        intro:
          'Una primera versión que se pueda tocar, aunque sea tosca. Pasar de la idea a algo real es donde más se aprende.',
        pasos: [
          'Construye lo mínimo para probar la idea de punta a punta.',
          'Que sea navegable/usable, aunque falten detalles.',
          'No pulas estética todavía: prioriza que funcione.',
          'Prepáralo para enseñárselo a alguien.',
        ],
        tip: 'Hecho es mejor que perfecto. Un prototipo feo pero funcional ya te enseña qué falla.',
      },
      {
        icono: 'usuario',
        titulo: 'Prueba con usuarios',
        texto: 'Lo enfrentamos a personas reales y recogemos su feedback.',
        intro:
          'Ponlo en manos de personas reales y observa. Verás problemas que tú, que lo hiciste, ya no ves.',
        pasos: [
          'Pide a 2-3 personas que intenten una tarea concreta.',
          'Observa en silencio: ¿dónde dudan o se traban?',
          'Pregunta qué esperaban que pasara y no pasó.',
          'Anota los problemas por frecuencia y gravedad.',
        ],
        tip: 'No expliques cómo se usa: si tienen que preguntártelo, ahí está el problema de diseño.',
      },
      {
        icono: 'refrescar',
        titulo: 'Iteración',
        texto: 'Corregimos los problemas detectados y mejoramos la propuesta.',
        intro:
          'Con el feedback en la mano, arregla lo importante. Iterar es lo que separa un proyecto bueno de uno mediocre.',
        pasos: [
          'Ordena los problemas: ¿cuáles rompen la experiencia?',
          'Arregla primero los graves y frecuentes.',
          'Aplica los cambios y vuelve a probar si puedes.',
          'Anota qué mejoró para contarlo en tu caso de estudio.',
        ],
        tip: 'No intentes arreglar todo. Dos o tres mejoras bien elegidas cambian más que veinte pequeñas.',
      },
    ],
    resultados: [
      { icono: 'ok', titulo: 'Feedback recogido', texto: 'Sabemos qué funciona y qué falla.' },
      { icono: 'refrescar', titulo: 'Versión mejorada', texto: 'Aplicamos los cambios más importantes.' },
      { icono: 'chispa2', titulo: 'Listo para producir', texto: 'La solución está validada para la versión final.' },
    ],
  },
  {
    id: 'ejecucion',
    nombre: 'Ejecución',
    descripcion:
      'Pulimos, documentamos y presentamos el proyecto terminado, listo para enseñarlo en tu portafolio.',
    items: [
      {
        icono: 'estrella',
        titulo: 'Entrega final',
        texto: 'Rematamos los detalles y dejamos el proyecto presentable.',
        intro:
          'El último 10% (pulido, detalles, consistencia) es el que hace que un proyecto parezca profesional.',
        pasos: [
          'Repasa espaciados, colores y textos: consistencia ante todo.',
          'Prueba en móvil y en un navegador distinto al tuyo.',
          'Quita lo que sobra: código muerto, placeholders, "lorem ipsum".',
          'Añade un toque final que lo haga memorable.',
        ],
        tip: 'Mira tu proyecto como si fuera de otra persona: ¿qué detalle te chirriaría?',
      },
      {
        icono: 'sobre',
        titulo: 'Documentación',
        texto: 'Explicamos proceso, decisiones y resultados con claridad.',
        intro:
          'Contar CÓMO y POR QUÉ lo hiciste vale tanto como el resultado. Es lo que demuestra tu forma de pensar.',
        pasos: [
          'Escribe un README: qué es, cómo se usa, cómo se ejecuta.',
          'Cuenta el problema, tu proceso y las decisiones clave.',
          'Incluye capturas o un gif del resultado.',
          'Menciona qué aprendiste y qué mejorarías.',
        ],
        tip: 'Un caso de estudio (problema → proceso → resultado) impresiona más que solo el enlace a la demo.',
      },
      {
        icono: 'enlace',
        titulo: 'Publicación',
        texto: 'Lo subimos y lo preparamos para compartir en tu portafolio.',
        intro:
          'Un proyecto que nadie puede ver no suma. Publícalo y déjalo listo para compartir.',
        pasos: [
          'Sube el código a GitHub con un README decente.',
          'Despliega la demo (Vercel, Netlify, GitHub Pages…).',
          'Comprueba que los enlaces funcionan desde otro dispositivo.',
          'Añádelo a tu portafolio y a tu perfil (LinkedIn, CV).',
        ],
        tip: 'Enlace a la demo + enlace al código, siempre juntos. Facilítale a quien te contrata verlo en 10 segundos.',
      },
    ],
    resultados: [
      { icono: 'estrella', titulo: 'Proyecto terminado', texto: 'Tienes un entregable pulido y presentable.' },
      { icono: 'sobre', titulo: 'Caso documentado', texto: 'Tu proceso queda contado, no solo el resultado.' },
      { icono: 'enlace', titulo: 'Listo para enseñar', texto: 'Está publicado y listo para tu portafolio.' },
    ],
  },
];

/* --- Cache de las ideas que sirve el backend (personalizadas) --------------
 * Las ideas ya no son estaticas: las genera el backend segun el perfil. Se
 * cachean en sessionStorage para que el detalle y el asistente de proyecto lean
 * las MISMAS que vio el listado, sin volver a pedirlas. IDEAS (arriba) queda solo
 * como ultimo respaldo si el backend no estuviera disponible. */
export const CLAVE_CACHE = 'jobia_portafolio_ideas';

export function guardarIdeasCache(ideas) {
  try {
    sessionStorage.setItem(CLAVE_CACHE, JSON.stringify(ideas));
  } catch {
    /* sessionStorage lleno o bloqueado: no es critico */
  }
}

export function leerIdeasCache() {
  try {
    return JSON.parse(sessionStorage.getItem(CLAVE_CACHE) || '[]');
  } catch {
    return [];
  }
}

/** Añade una idea suelta (deep-link) al cache sin duplicar. */
export function agregarIdeaCache(idea) {
  const cache = leerIdeasCache();
  if (!cache.some((i) => i.id === idea.id)) guardarIdeasCache([...cache, idea]);
}

/** Busca por id: primero en lo que trajo el backend, luego en el respaldo. */
export const ideaPorId = (id) =>
  leerIdeasCache().find((i) => i.id === id) || IDEAS.find((i) => i.id === id) || null;

/**
 * Imagen relevante para una idea, servida por LoremFlickr (fotos por palabra
 * clave, sin API key). El `lock` fija la foto para que no cambie en cada carga.
 */
export const imagenIdea = (idea, w, h) =>
  `https://loremflickr.com/${w}/${h}/${encodeURIComponent(idea.img)}?lock=${idea.lock}`;

/* --- Ideas guardadas (persisten en localStorage; se marcan desde el detalle) --- */
export const CLAVE_GUARDADAS = 'jobia_portafolio_guardadas';

export function idsGuardadas() {
  try {
    return new Set(JSON.parse(localStorage.getItem(CLAVE_GUARDADAS) || '[]'));
  } catch {
    return new Set();
  }
}

/** Guarda/quita una idea y devuelve si queda guardada. */
export function alternarGuardada(id) {
  const set = idsGuardadas();
  if (set.has(id)) set.delete(id);
  else set.add(id);
  localStorage.setItem(CLAVE_GUARDADAS, JSON.stringify([...set]));
  return set.has(id);
}

/** Las ideas guardadas, resueltas contra lo cacheado del backend + el respaldo. */
export function ideasGuardadas() {
  const ids = idsGuardadas();
  const pool = [...leerIdeasCache(), ...IDEAS];
  const vistos = new Set();
  const res = [];
  for (const i of pool) {
    if (ids.has(i.id) && !vistos.has(i.id)) {
      vistos.add(i.id);
      res.push(i);
    }
  }
  return res;
}

/* --- Notas del asistente de proyecto (localStorage, por idea+fase+item) --- */
export const CLAVE_NOTAS = 'jobia_portafolio_notas';

function leerNotas() {
  try {
    return JSON.parse(localStorage.getItem(CLAVE_NOTAS) || '{}');
  } catch {
    return {};
  }
}

/** Clave estable de una nota. */
export const claveNota = (ideaId, faseId, i) => `${ideaId}-${faseId}-${i}`;

/** Clave de la respuesta a la pregunta `j` de un item (worksheet). */
export const claveRespuesta = (ideaId, faseId, i, j) => `${ideaId}-${faseId}-${i}-r${j}`;

export const leerNota = (clave) => leerNotas()[clave] || '';

/** Guarda (o borra si queda vacia) la nota de una clave. */
export function guardarNota(clave, texto) {
  const notas = leerNotas();
  if (texto.trim()) notas[clave] = texto;
  else delete notas[clave];
  localStorage.setItem(CLAVE_NOTAS, JSON.stringify(notas));
}

/** Cuantas preguntas del item tienen respuesta (para la barra de progreso). */
export function respondidasItem(ideaId, faseId, item, i) {
  const notas = leerNotas();
  return item.pasos.filter((_, j) => (notas[claveRespuesta(ideaId, faseId, i, j)] || '').trim()).length;
}

/** El item esta completo cuando TODAS sus preguntas tienen respuesta. */
export function itemCompleto(ideaId, faseId, item, i) {
  return item.pasos.length > 0 && respondidasItem(ideaId, faseId, item, i) === item.pasos.length;
}
