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
      },
      {
        icono: 'usuario',
        titulo: 'Investigación de usuario',
        texto: 'Entendemos a la audiencia objetivo, sus comportamientos, necesidades y motivaciones.',
      },
      {
        icono: 'buscar',
        titulo: 'Problema y oportunidad',
        texto: 'Identificamos los puntos de dolor, causas raíz y oportunidades de mejora o innovación.',
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
      },
      {
        icono: 'candado',
        titulo: 'Requerimientos no funcionales',
        texto: 'Establecemos los atributos de calidad, restricciones y criterios técnicos del sistema.',
      },
      {
        icono: 'rejilla',
        titulo: 'Diagrama de contexto',
        texto: 'Representamos el sistema y su interacción con actores externos a alto nivel.',
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
      { icono: 'chispa2', titulo: 'Prototipo funcional', texto: 'Montamos una versión navegable o un primer entregable real.' },
      { icono: 'usuario', titulo: 'Prueba con usuarios', texto: 'Lo enfrentamos a personas reales y recogemos su feedback.' },
      { icono: 'refrescar', titulo: 'Iteración', texto: 'Corregimos los problemas detectados y mejoramos la propuesta.' },
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
      { icono: 'estrella', titulo: 'Entrega final', texto: 'Rematamos los detalles y dejamos el proyecto presentable.' },
      { icono: 'sobre', titulo: 'Documentación', texto: 'Explicamos proceso, decisiones y resultados con claridad.' },
      { icono: 'enlace', titulo: 'Publicación', texto: 'Lo subimos y lo preparamos para compartir en tu portafolio.' },
    ],
    resultados: [
      { icono: 'estrella', titulo: 'Proyecto terminado', texto: 'Tienes un entregable pulido y presentable.' },
      { icono: 'sobre', titulo: 'Caso documentado', texto: 'Tu proceso queda contado, no solo el resultado.' },
      { icono: 'enlace', titulo: 'Listo para enseñar', texto: 'Está publicado y listo para tu portafolio.' },
    ],
  },
];

export const ideaPorId = (id) => IDEAS.find((i) => i.id === id) || null;

/**
 * Imagen relevante para una idea, servida por LoremFlickr (fotos por palabra
 * clave, sin API key). El `lock` fija la foto para que no cambie en cada carga.
 */
export const imagenIdea = (idea, w, h) =>
  `https://loremflickr.com/${w}/${h}/${encodeURIComponent(idea.img)}?lock=${idea.lock}`;
