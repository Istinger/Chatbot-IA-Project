/**
 * Catalogo estatico de 50 ideas de proyecto para portafolio.
 *
 * Es la "base de datos" de recomendaciones comunes: cero IA, $0. Se usa de dos
 * formas (ver portafolio.service.js):
 *   1. Se RANKEA gratis contra el perfil (skills que tienes + skills que te
 *      faltan y el mercado pide) para elegir las 4 mas relevantes.
 *   2. Es el RESPALDO cuando no hay perfil, el LLM falla o se agota la cuota.
 *
 * El LLM nunca elige el proyecto (eso es solape de conjuntos, gratis): solo
 * reescribe el TEXTO de los 4 elegidos para personalizarlo. Por eso cada idea
 * trae ya su detalle completo: si no se personaliza, sigue siendo util.
 *
 * `skills` son las tecnologias/areas que el proyecto ejercita (en minusculas,
 * como llegan del matching). `area` fija el look (icono + gradiente).
 */

// Paleta por area: icono (del set de la UI) + gradiente de fondo.
const AREAS = {
  frontend: { icono: 'rejilla', tono: ['#12324a', '#08202f'] },
  backend: { icono: 'candado', tono: ['#1b2a4a', '#0b1428'] },
  fullstack: { icono: 'chispa2', tono: ['#1e3a5f', '#0b1e33'] },
  data: { icono: 'crecer', tono: ['#123a3a', '#08211f'] },
  ux: { icono: 'ojo', tono: ['#2a1e4f', '#120b25'] },
  mobile: { icono: 'usuario', tono: ['#173a2c', '#0a1f18'] },
  devops: { icono: 'globo', tono: ['#0f2a33', '#07171c'] },
  branding: { icono: 'estrella', tono: ['#3f2d1e', '#1f150b'] },
  qa: { icono: 'ok', tono: ['#123a2a', '#08211a'] },
  marketing: { icono: 'telegram', tono: ['#3a1e2e', '#1f0b16'] },
};

/**
 * Helper para no repetir la estructura 50 veces. Rellena marca/detalle con
 * textos por defecto derivados del titulo cuando no se dan, para que toda idea
 * tenga un caso de estudio completo aunque no se personalice.
 */
let _n = 0;
function idea(o) {
  _n += 1;
  const marca = o.marca || { nombre: o.titulo, sub: o.categoria };
  const d = o.detalle || {};
  return {
    id: o.id,
    titulo: o.titulo,
    tipo: o.tipo,
    nivel: o.nivel || 'Junior',
    categoria: o.categoria,
    area: o.area,
    skills: o.skills,
    img: o.img,
    lock: 100 + _n, // fija la foto de LoremFlickr para que no cambie
    popularidad: o.popularidad ?? 50,
    resumen: o.resumen,
    descripcion: o.descripcion,
    marca,
    detalle: {
      objetivo: d.objetivo || `Resolver un problema real con ${o.titulo.toLowerCase()} y medir su impacto.`,
      queCrear: d.queCrear || 'Un entregable funcional, navegable y documentado.',
      entregables: d.entregables || 'Codigo o diseno, documentacion y una demo o presentacion final.',
      portafolio: d.portafolio || 'Demuestra tu forma de pensar y tu capacidad de llevar un proyecto de punta a punta.',
    },
  };
}

const CATALOGO = [
  // ---- Frontend ----
  idea({ id: 'landing-cafeteria', titulo: 'Landing page para cafeteria', tipo: 'Web', categoria: 'Proyecto real', area: 'frontend', popularidad: 92, skills: ['html', 'css', 'javascript', 'responsive', 'ui'], img: 'coffee,cafe', resumen: 'Una landing moderna que convierta visitantes en clientes.', descripcion: 'Construye una landing responsiva para una cafeteria de especialidad, con foco en la conversion y una estetica calida.', marca: { nombre: 'Cafe de Origen', sub: 'Landing de conversion' }, detalle: { objetivo: 'Presentar la cafeteria de forma atractiva para que el visitante reserve o visite el local.', queCrear: 'Landing responsiva con hero, menu destacado, testimonios y una CTA clara.', entregables: 'Diseno responsivo, HTML/CSS (o tu framework), copys y guia de estilos ligera.', portafolio: 'Muestra que sabes maquetar, jerarquizar contenido y disenar para la conversion.' } }),
  idea({ id: 'clon-netflix-ui', titulo: 'Clon de UI de Netflix', tipo: 'Web', categoria: 'Practica', area: 'frontend', popularidad: 88, skills: ['react', 'javascript', 'css', 'api', 'responsive'], img: 'tv,cinema', resumen: 'Recrea la interfaz de un servicio de streaming consumiendo una API real.', descripcion: 'Maqueta la home de un servicio de streaming con carruseles, detalle de titulo y buscador, tomando datos de una API publica de peliculas.' }),
  idea({ id: 'portfolio-personal', titulo: 'Tu propio portafolio web', tipo: 'Web', categoria: 'Proyecto real', area: 'frontend', popularidad: 95, skills: ['html', 'css', 'javascript', 'responsive', 'ui'], img: 'developer,portfolio', resumen: 'El sitio que presenta tu trabajo: tu mejor carta de presentacion.', descripcion: 'Disena y construye tu portafolio personal: proyectos, sobre ti y contacto, rapido y accesible.' }),
  idea({ id: 'componentes-ui', titulo: 'Libreria de componentes UI', tipo: 'Web', categoria: 'Sistema de diseno', area: 'frontend', popularidad: 70, skills: ['react', 'css', 'javascript', 'ui', 'storybook'], img: 'design,components', resumen: 'Un set de componentes reutilizables y documentados.', descripcion: 'Crea botones, inputs, modales y cards reutilizables con estados y documentacion viva.' }),
  idea({ id: 'dashboard-clima', titulo: 'Dashboard del clima', tipo: 'Web', categoria: 'Practica', area: 'frontend', popularidad: 78, skills: ['javascript', 'react', 'api', 'css', 'responsive'], img: 'weather,sky', resumen: 'Consulta y visualiza el clima de cualquier ciudad.', descripcion: 'App que consume una API de clima, guarda ciudades favoritas y muestra el pronostico de la semana.' }),
  idea({ id: 'todo-avanzado', titulo: 'Gestor de tareas con filtros', tipo: 'Web', categoria: 'Practica', area: 'frontend', popularidad: 74, skills: ['javascript', 'react', 'localstorage', 'ui'], img: 'todo,notes', resumen: 'Un to-do de verdad: filtros, prioridades y persistencia.', descripcion: 'Gestor de tareas con estados, prioridades, filtros y datos que persisten en el navegador.' }),

  // ---- Backend ----
  idea({ id: 'api-rest-tareas', titulo: 'API REST de tareas con auth', tipo: 'Backend', categoria: 'Proyecto real', area: 'backend', popularidad: 90, skills: ['node.js', 'express', 'jwt', 'rest', 'sql', 'postgresql'], img: 'server,code', resumen: 'Una API con autenticacion, CRUD y buenas practicas.', descripcion: 'Construye una API REST con registro/login por JWT, CRUD de tareas y validacion, lista para consumir desde un frontend.', detalle: { objetivo: 'Exponer datos de forma segura y con contratos claros.', queCrear: 'Endpoints REST, auth por JWT, validacion y manejo de errores consistente.', entregables: 'Codigo, coleccion de Postman, README y esquema de base de datos.', portafolio: 'Demuestra que entiendes HTTP, auth y como estructurar un backend.' } }),
  idea({ id: 'acortador-urls', titulo: 'Acortador de URLs', tipo: 'Backend', categoria: 'Practica', area: 'backend', popularidad: 82, skills: ['node.js', 'express', 'redis', 'sql', 'rest'], img: 'link,network', resumen: 'Convierte enlaces largos en cortos y cuenta sus clics.', descripcion: 'Servicio que genera enlaces cortos, redirige y registra metricas de uso por enlace.' }),
  idea({ id: 'api-clima-cache', titulo: 'API con cache y rate limit', tipo: 'Backend', categoria: 'Practica', area: 'backend', popularidad: 68, skills: ['node.js', 'redis', 'api', 'express'], img: 'server,cloud', resumen: 'Una API que no revienta la cuota de terceros: cachea y limita.', descripcion: 'Envuelve una API externa con cache en Redis y limitacion de peticiones por usuario.' }),
  idea({ id: 'auth-desde-cero', titulo: 'Sistema de autenticacion', tipo: 'Backend', categoria: 'Proyecto real', area: 'backend', popularidad: 80, skills: ['node.js', 'jwt', 'bcrypt', 'sql', 'security'], img: 'security,lock', resumen: 'Registro, login y sesiones con seguridad real.', descripcion: 'Implementa auth con hash de contrasenas, JWT, refresh tokens y proteccion de rutas.' }),
  idea({ id: 'webhook-notificaciones', titulo: 'Servicio de notificaciones', tipo: 'Backend', categoria: 'Practica', area: 'backend', popularidad: 60, skills: ['node.js', 'redis', 'queue', 'api'], img: 'notification,bell', resumen: 'Encola y envia notificaciones sin bloquear la API.', descripcion: 'Sistema con cola de trabajos que procesa y envia notificaciones (email o Telegram) en segundo plano.' }),

  // ---- Fullstack ----
  idea({ id: 'blog-fullstack', titulo: 'Blog fullstack con panel', tipo: 'Fullstack', categoria: 'Proyecto real', area: 'fullstack', popularidad: 85, skills: ['react', 'node.js', 'sql', 'postgresql', 'rest', 'jwt'], img: 'blog,writing', resumen: 'Un blog completo: publicas, editas y el mundo lee.', descripcion: 'CRUD de articulos con panel de administracion, autenticacion y vista publica optimizada.' }),
  idea({ id: 'ecommerce-mini', titulo: 'Mini e-commerce', tipo: 'Fullstack', categoria: 'Proyecto real', area: 'fullstack', popularidad: 89, skills: ['react', 'node.js', 'sql', 'stripe', 'rest'], img: 'shopping,store', resumen: 'Catalogo, carrito y checkout de punta a punta.', descripcion: 'Tienda con catalogo, carrito, checkout simulado y panel de pedidos.' }),
  idea({ id: 'chat-tiempo-real', titulo: 'Chat en tiempo real', tipo: 'Fullstack', categoria: 'Practica', area: 'fullstack', popularidad: 83, skills: ['react', 'node.js', 'websocket', 'socket.io', 'redis'], img: 'chat,message', resumen: 'Salas de chat con mensajes al instante.', descripcion: 'App de chat con WebSockets, salas, presencia de usuarios y persistencia de historial.' }),
  idea({ id: 'kanban-app', titulo: 'Tablero Kanban colaborativo', tipo: 'Fullstack', categoria: 'Proyecto real', area: 'fullstack', popularidad: 76, skills: ['react', 'node.js', 'sql', 'rest', 'drag-and-drop'], img: 'kanban,board', resumen: 'Organiza tareas arrastrando tarjetas entre columnas.', descripcion: 'Tablero estilo Trello con columnas, tarjetas, arrastrar y soltar y datos persistentes.' }),
  idea({ id: 'reservas-citas', titulo: 'App de reserva de citas', tipo: 'Fullstack', categoria: 'Proyecto real', area: 'fullstack', popularidad: 72, skills: ['react', 'node.js', 'sql', 'rest', 'calendario'], img: 'calendar,booking', resumen: 'Agenda que evita choques de horario.', descripcion: 'Sistema de reservas con calendario, disponibilidad y confirmacion, util para negocios reales.' }),

  // ---- Data ----
  idea({ id: 'dashboard-ventas', titulo: 'Dashboard de ventas', tipo: 'Data', categoria: 'Visualizacion', area: 'data', popularidad: 87, skills: ['python', 'pandas', 'sql', 'visualization', 'dashboard'], img: 'analytics,chart', resumen: 'Convierte datos de ventas en decisiones de un vistazo.', descripcion: 'Panel con KPIs, tendencias y filtros por periodo, categoria y producto.', detalle: { objetivo: 'Mostrar KPIs claros y dejar explorar tendencias de ventas.', queCrear: 'Dashboard con KPIs, graficos de tendencia y filtros.', entregables: 'Modelo de datos, dashboard interactivo, definicion de metricas y lectura de resultados.', portafolio: 'Demuestra que limpias datos, eliges la visualizacion correcta y cuentas una historia con numeros.' } }),
  idea({ id: 'analisis-encuesta', titulo: 'Analisis de una encuesta real', tipo: 'Data', categoria: 'Analisis', area: 'data', popularidad: 71, skills: ['python', 'pandas', 'matplotlib', 'jupyter', 'statistics'], img: 'data,survey', resumen: 'Saca conclusiones de datos reales y cuentalas bien.', descripcion: 'Toma un dataset publico, limpialo, analizalo y comunica 3 hallazgos con graficos claros.' }),
  idea({ id: 'etl-basico', titulo: 'Pipeline ETL basico', tipo: 'Data', categoria: 'Ingenieria de datos', area: 'data', popularidad: 63, skills: ['python', 'sql', 'etl', 'pandas', 'airflow'], img: 'pipeline,database', resumen: 'Extrae, transforma y carga datos de forma repetible.', descripcion: 'Construye un ETL que ingiere datos de una API o CSV, los limpia y los carga en una base.' }),
  idea({ id: 'prediccion-precios', titulo: 'Modelo de prediccion de precios', tipo: 'Data', categoria: 'Machine Learning', area: 'data', nivel: 'Semi Senior', popularidad: 66, skills: ['python', 'scikit-learn', 'pandas', 'machine learning'], img: 'machinelearning,graph', resumen: 'Un modelo que estima precios y explica por que.', descripcion: 'Entrena un modelo de regresion para estimar precios (vivienda, autos...) y evalua su error.' }),
  idea({ id: 'scraper-datos', titulo: 'Scraper + dataset publicado', tipo: 'Data', categoria: 'Practica', area: 'data', popularidad: 69, skills: ['python', 'scraping', 'beautifulsoup', 'pandas'], img: 'web,data', resumen: 'Recoge datos de la web y publicalos limpios.', descripcion: 'Extrae datos de un sitio permitido, normalizalos y publica un dataset reutilizable con su documentacion.' }),

  // ---- UX / UI ----
  idea({ id: 'rediseno-delivery', titulo: 'Rediseno de app de delivery', tipo: 'UI/UX', categoria: 'Caso de estudio', area: 'ux', popularidad: 91, skills: ['ui', 'ux', 'figma', 'research', 'prototyping'], img: 'food,delivery,smartphone', resumen: 'Rediseña una experiencia de delivery mas rapida y clara.', descripcion: 'Rediseña una app de delivery enfocada en la experiencia, la navegacion y el proceso de compra.', marca: { nombre: 'Delivery UX', sub: 'Caso de estudio de UX/UI' }, detalle: { objetivo: 'Mejorar usabilidad y accesibilidad para aumentar conversion y satisfaccion.', queCrear: 'Flujos, wireframes, UI de alta fidelidad y prototipo interactivo.', entregables: 'Investigacion UX, mapas de flujo, prototipo, guia de estilos y presentacion.', portafolio: 'Demuestra tu pensamiento de diseno y tu capacidad de resolver problemas reales.' } }),
  idea({ id: 'design-system', titulo: 'Sistema de diseno completo', tipo: 'UI/UX', categoria: 'Sistema de diseno', area: 'ux', popularidad: 64, skills: ['ui', 'figma', 'design system', 'tokens'], img: 'design,system', resumen: 'Tokens, componentes y reglas que escalan.', descripcion: 'Crea un sistema de diseno con tokens de color, tipografia, espaciado y componentes documentados.' }),
  idea({ id: 'auditoria-ux', titulo: 'Auditoria UX de un producto', tipo: 'UI/UX', categoria: 'Caso de estudio', area: 'ux', popularidad: 62, skills: ['ux', 'research', 'usability', 'accessibility'], img: 'usability,ux', resumen: 'Encuentra los problemas de uso y propone arreglos.', descripcion: 'Analiza un producto existente, detecta problemas de usabilidad/accesibilidad y propone mejoras priorizadas.' }),
  idea({ id: 'app-fitness-ux', titulo: 'Diseno de app de fitness', tipo: 'UI/UX', categoria: 'Caso de estudio', area: 'ux', popularidad: 67, skills: ['ui', 'ux', 'figma', 'prototyping', 'mobile'], img: 'fitness,gym', resumen: 'Una app que motiva a moverse, de la idea al prototipo.', descripcion: 'Disena la experiencia de una app de fitness: onboarding, rutinas y seguimiento de progreso.' }),

  // ---- Mobile ----
  idea({ id: 'app-notas-movil', titulo: 'App movil de notas', tipo: 'Mobile', categoria: 'Practica', area: 'mobile', popularidad: 73, skills: ['react native', 'javascript', 'mobile', 'storage'], img: 'phone,notes', resumen: 'Notas que llevas en el bolsillo, offline.', descripcion: 'App movil de notas con creacion, edicion, busqueda y almacenamiento local.' }),
  idea({ id: 'app-clima-movil', titulo: 'App movil del clima', tipo: 'Mobile', categoria: 'Practica', area: 'mobile', popularidad: 70, skills: ['react native', 'api', 'javascript', 'mobile'], img: 'weather,phone', resumen: 'El clima donde estes, con geolocalizacion.', descripcion: 'App movil que usa la ubicacion y una API de clima para mostrar el pronostico.' }),
  idea({ id: 'app-gastos', titulo: 'App de control de gastos', tipo: 'Mobile', categoria: 'Proyecto real', area: 'mobile', popularidad: 75, skills: ['react native', 'flutter', 'mobile', 'charts'], img: 'money,finance', resumen: 'Registra gastos y visualiza a donde se va el dinero.', descripcion: 'App para registrar ingresos/gastos por categoria con graficos mensuales.' }),

  // ---- DevOps ----
  idea({ id: 'dockeriza-app', titulo: 'Dockeriza una app y despliegala', tipo: 'DevOps', categoria: 'Proyecto real', area: 'devops', popularidad: 79, skills: ['docker', 'nginx', 'linux', 'deploy', 'devops'], img: 'docker,container', resumen: 'De "corre en mi maquina" a "corre en cualquier lado".', descripcion: 'Empaqueta una app con Docker, escribe su compose y desplegala en un VPS con HTTPS.', detalle: { objetivo: 'Hacer una app reproducible y desplegable en cualquier servidor.', queCrear: 'Dockerfile, docker-compose, configuracion de Nginx y HTTPS.', entregables: 'Repositorio con contenedores, guia de despliegue y la app en linea.', portafolio: 'Demuestra que entiendes contenedores, redes y despliegue real.' } }),
  idea({ id: 'ci-cd-pipeline', titulo: 'Pipeline CI/CD con GitHub Actions', tipo: 'DevOps', categoria: 'Practica', area: 'devops', popularidad: 65, skills: ['ci/cd', 'github actions', 'docker', 'testing', 'devops'], img: 'automation,pipeline', resumen: 'Que cada push pruebe y despliegue solo.', descripcion: 'Configura un pipeline que corre tests, construye la imagen y despliega automaticamente.' }),
  idea({ id: 'monitoreo-app', titulo: 'Monitoreo de una app', tipo: 'DevOps', categoria: 'Practica', area: 'devops', nivel: 'Semi Senior', popularidad: 55, skills: ['prometheus', 'grafana', 'docker', 'devops', 'linux'], img: 'monitoring,server', resumen: 'Metricas y alertas para saber si algo se cae.', descripcion: 'Instrumenta una app con metricas y monta paneles y alertas basicas.' }),

  // ---- Branding ----
  idea({ id: 'marca-emprendimiento', titulo: 'Marca para un emprendimiento', tipo: 'Branding', categoria: 'Identidad visual', area: 'branding', popularidad: 77, skills: ['branding', 'logo', 'illustrator', 'identity', 'design'], img: 'branding,stationery', resumen: 'Una identidad coherente y memorable de cero.', descripcion: 'Crea la identidad de un emprendimiento: logotipo, paleta, tipografias y aplicaciones.', marca: { nombre: 'Verde Natura', sub: 'Identidad de marca' }, detalle: { objetivo: 'Dar una identidad coherente que transmita los valores de la marca.', queCrear: 'Logotipo, paleta, sistema tipografico y aplicaciones (tarjeta, packaging, redes).', entregables: 'Manual de marca, logotipo en varios formatos, paleta y mockups.', portafolio: 'Muestra criterio visual y capacidad de traducir valores en diseno.' } }),
  idea({ id: 'rebranding', titulo: 'Rebranding de una marca local', tipo: 'Branding', categoria: 'Caso de estudio', area: 'branding', popularidad: 58, skills: ['branding', 'design', 'identity', 'logo'], img: 'logo,rebrand', resumen: 'Moderniza una marca sin perder su esencia.', descripcion: 'Toma un negocio local y propone un rebranding justificado, con antes/despues.' }),
  idea({ id: 'kit-redes', titulo: 'Kit de plantillas para redes', tipo: 'Branding', categoria: 'Proyecto real', area: 'branding', popularidad: 61, skills: ['design', 'social media', 'canva', 'branding'], img: 'socialmedia,design', resumen: 'Plantillas consistentes para publicar sin sufrir.', descripcion: 'Disena un set de plantillas de redes coherentes con una marca, listas para usar.' }),

  // ---- QA / Testing ----
  idea({ id: 'suite-e2e', titulo: 'Suite de pruebas E2E', tipo: 'QA', categoria: 'Proyecto real', area: 'qa', popularidad: 60, skills: ['testing', 'playwright', 'cypress', 'javascript', 'qa'], img: 'testing,checklist', resumen: 'Automatiza la prueba de una app de punta a punta.', descripcion: 'Escribe pruebas E2E que validen los flujos criticos de una app web y corran en CI.' }),
  idea({ id: 'plan-pruebas', titulo: 'Plan de pruebas de un producto', tipo: 'QA', categoria: 'Caso de estudio', area: 'qa', popularidad: 52, skills: ['qa', 'testing', 'test cases', 'documentation'], img: 'checklist,quality', resumen: 'Piensa como QA: que probar y como.', descripcion: 'Documenta un plan de pruebas con casos, prioridades y criterios de aceptacion para un producto real.' }),
  idea({ id: 'api-testing', titulo: 'Testing automatizado de una API', tipo: 'QA', categoria: 'Practica', area: 'qa', popularidad: 57, skills: ['testing', 'postman', 'javascript', 'api', 'qa'], img: 'api,testing', resumen: 'Pruebas que atrapan bugs antes que el usuario.', descripcion: 'Automatiza pruebas de contrato y de casos limite sobre una API REST.' }),

  // ---- Marketing / Contenido ----
  idea({ id: 'estrategia-contenido', titulo: 'Estrategia de contenido', tipo: 'Marketing', categoria: 'Caso de estudio', area: 'marketing', popularidad: 59, skills: ['marketing', 'content', 'seo', 'social media'], img: 'marketing,content', resumen: 'Un plan de contenido que atrae y convierte.', descripcion: 'Disena una estrategia de contenido para una marca: audiencia, temas, calendario y metricas.' }),
  idea({ id: 'auditoria-seo', titulo: 'Auditoria SEO de un sitio', tipo: 'Marketing', categoria: 'Analisis', area: 'marketing', popularidad: 56, skills: ['seo', 'analytics', 'marketing', 'web'], img: 'seo,analytics', resumen: 'Encuentra por que un sitio no aparece en Google.', descripcion: 'Audita el SEO tecnico y de contenido de un sitio y propone mejoras priorizadas.' }),
  idea({ id: 'campana-email', titulo: 'Campana de email marketing', tipo: 'Marketing', categoria: 'Proyecto real', area: 'marketing', popularidad: 51, skills: ['marketing', 'email', 'copywriting', 'analytics'], img: 'email,campaign', resumen: 'Una campana de correo pensada para convertir.', descripcion: 'Disena y redacta una campana de email con segmentacion, copys y metricas de exito.' }),

  // ---- Mas frontend/fullstack de relleno util ----
  idea({ id: 'buscador-recetas', titulo: 'Buscador de recetas', tipo: 'Web', categoria: 'Practica', area: 'frontend', popularidad: 66, skills: ['react', 'javascript', 'api', 'css'], img: 'food,recipe', resumen: 'Busca recetas por ingredientes que tengas.', descripcion: 'App que consume una API de recetas y filtra por ingredientes, tiempo y dieta.' }),
  idea({ id: 'quiz-app', titulo: 'App de quiz/trivia', tipo: 'Web', categoria: 'Practica', area: 'frontend', popularidad: 64, skills: ['javascript', 'react', 'api', 'ui'], img: 'quiz,game', resumen: 'Un juego de preguntas con puntaje y ranking.', descripcion: 'Trivia con preguntas de una API, temporizador, puntaje y tabla de resultados.' }),
  idea({ id: 'foro-comunidad', titulo: 'Foro de comunidad', tipo: 'Fullstack', categoria: 'Proyecto real', area: 'fullstack', popularidad: 62, skills: ['react', 'node.js', 'sql', 'rest', 'jwt'], img: 'forum,community', resumen: 'Hilos, respuestas y votos como un mini Reddit.', descripcion: 'Foro con categorias, hilos, respuestas anidadas y votos, con autenticacion.' }),
  idea({ id: 'gestor-finanzas', titulo: 'Gestor de finanzas personales', tipo: 'Fullstack', categoria: 'Proyecto real', area: 'fullstack', popularidad: 74, skills: ['react', 'node.js', 'sql', 'charts', 'rest'], img: 'finance,budget', resumen: 'Controla ingresos, gastos y ahorro con graficos.', descripcion: 'App para registrar movimientos, categorizar y visualizar el estado financiero mensual.' }),
  idea({ id: 'api-graphql', titulo: 'API GraphQL de un catalogo', tipo: 'Backend', categoria: 'Practica', area: 'backend', nivel: 'Semi Senior', popularidad: 54, skills: ['graphql', 'node.js', 'sql', 'api'], img: 'graphql,api', resumen: 'Una API donde el cliente pide justo lo que necesita.', descripcion: 'Expon un catalogo por GraphQL con queries, mutaciones y paginacion.' }),
  idea({ id: 'bot-telegram', titulo: 'Bot de Telegram util', tipo: 'Backend', categoria: 'Proyecto real', area: 'backend', popularidad: 72, skills: ['node.js', 'python', 'api', 'telegram', 'bot'], img: 'bot,telegram', resumen: 'Un bot que resuelve algo concreto de verdad.', descripcion: 'Construye un bot de Telegram que responda comandos y consuma una API (clima, recordatorios, precios).' }),
  idea({ id: 'landing-saas', titulo: 'Landing de un producto SaaS', tipo: 'Web', categoria: 'Proyecto real', area: 'frontend', popularidad: 80, skills: ['html', 'css', 'javascript', 'responsive', 'ui', 'react'], img: 'saas,startup', resumen: 'La pagina que vende un producto digital.', descripcion: 'Landing de un SaaS con hero, features, precios y testimonios, optimizada para convertir.' }),
  idea({ id: 'panel-admin', titulo: 'Panel de administracion', tipo: 'Fullstack', categoria: 'Proyecto real', area: 'fullstack', popularidad: 78, skills: ['react', 'node.js', 'sql', 'charts', 'rest', 'jwt'], img: 'dashboard,admin', resumen: 'El back-office que maneja un negocio.', descripcion: 'Panel con autenticacion, tablas, filtros y graficos para administrar datos de una app.' }),
  idea({ id: 'app-mapa', titulo: 'App con mapas interactivos', tipo: 'Web', categoria: 'Practica', area: 'frontend', popularidad: 63, skills: ['javascript', 'react', 'maps', 'api', 'geolocation'], img: 'map,location', resumen: 'Ubica cosas en un mapa y filtralas.', descripcion: 'App que muestra puntos de interes en un mapa con filtros, busqueda y geolocalizacion.' }),
  idea({ id: 'sitio-accesible', titulo: 'Rehacer un sitio accesible (a11y)', tipo: 'Web', categoria: 'Caso de estudio', area: 'frontend', popularidad: 60, skills: ['html', 'css', 'accessibility', 'javascript', 'ux'], img: 'accessibility,web', resumen: 'Un sitio que cualquiera puede usar, tambien con lector de pantalla.', descripcion: 'Toma una pagina con problemas de accesibilidad y rehazla cumpliendo WCAG: contraste, foco, teclado y semantica.' }),
];

/**
 * Ranking GRATIS del catalogo contra el perfil. Cero IA.
 *
 *   score = afinidad (skills que YA tienes)         * 1
 *         + brecha    (skills que te faltan y piden) * 2   <- pesa mas: el
 *                                                             proyecto que
 *                                                             construye lo que te
 *                                                             falta es el que mas
 *                                                             te emplea
 *         + popularidad/1000                                <- desempate estable
 *
 * `faltantes` viene de certs.service: [{ skill, porcentaje }]. El % (cuanto lo
 * pide el mercado afin a ti) pondera cuanto suma cerrar esa brecha.
 */
function rankear(tusSkills = [], faltantes = []) {
  const mias = new Set(tusSkills.map((s) => String(s).toLowerCase().trim()));
  const brecha = new Map(
    faltantes.map((f) => [String(f.skill).toLowerCase().trim(), (f.porcentaje ?? 50) / 100]),
  );

  const conScore = CATALOGO.map((idea) => {
    let afinidad = 0;
    let cierre = 0;
    for (const s of idea.skills) {
      const k = s.toLowerCase();
      if (mias.has(k)) afinidad += 1;
      if (brecha.has(k)) cierre += brecha.get(k);
    }
    const score = afinidad * 1 + cierre * 2 + idea.popularidad / 1000;
    return { idea, score };
  });

  conScore.sort((a, b) => b.score - a.score);
  return conScore.map((c) => c.idea);
}

/** Las N mas populares (respaldo sin perfil). */
function masPopulares(n = 4) {
  return [...CATALOGO].sort((a, b) => b.popularidad - a.popularidad).slice(0, n);
}

const porId = (id) => CATALOGO.find((i) => i.id === id) || null;

module.exports = { CATALOGO, AREAS, rankear, masPopulares, porId };
