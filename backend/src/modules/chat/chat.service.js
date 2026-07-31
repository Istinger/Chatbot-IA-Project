const crypto = require('node:crypto');
const { prisma } = require('../../config/db');
const env = require('../../config/env');
const llm = require('../../config/openrouter');
const { consumir, asomar } = require('../../shared/ratelimit');
const { cacheado, hash } = require('../../shared/cache');
const matching = require('../matching/matching.service');
const {
  SYSTEM,
  bloqueOfertas,
  bloquePerfil,
  bloqueOfertaActual,
  bloquePantalla,
} = require('./chat.prompt');
const { esConsultaDeEmpleo } = require('./chat.intencion');

/** Turnos de conversacion que viajan en el prompt. Ver `historial()`. */
const TURNOS = 6;

/** Tope del mensaje del usuario. Un prompt gigante es coste y superficie de ataque. */
const MAX_MENSAJE = 1000;

/**
 * Tope para que un mensaje sea CACHEABLE. Por encima de esto ya no es una
 * pregunta de arranque repetida, es algo que solo escribe esa persona: cachearlo
 * llenaria Redis de claves que nadie vuelve a pedir.
 */
const MAX_CACHEABLE = 200;

/** TTL de la cache en frio. La ingesta corre cada 6 h; un dia es el horizonte util. */
const TTL_CACHE = 60 * 60 * 24;

class ChatError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

/**
 * Ultimos N mensajes de la sesion, en orden cronologico.
 *
 * OJO: hay que pedirlos DESC y darles la vuelta. Pedirlos ASC con LIMIT devuelve
 * los N PRIMEROS mensajes, no los N ultimos: el bot se quedaria anclado al
 * principio de la conversacion y nunca veria lo que el usuario acaba de decir.
 * (Es el bug que tenia la version original.)
 */
async function historial(sessionId) {
  const mensajes = await prisma.message.findMany({
    where: { sessionId },
    orderBy: { createdAt: 'desc' },
    take: TURNOS * 2, // un turno = pregunta + respuesta
    select: { role: true, content: true },
  });

  return mensajes.reverse();
}

/**
 * Recupera ofertas relevantes para el mensaje (la "R" de RAG).
 *
 * Dos filtros en cadena, y hacen falta LOS DOS:
 *
 *   1. ¿Va de empleo? -> lexico (chat.intencion.js). Los embeddings NO sirven
 *      para esto: con 684 ofertas, "quien gano el mundial" puntuaba 0.645, por
 *      encima de "remoto junior backend" (0.601). Ver la explicacion completa en
 *      chat.intencion.js.
 *
 *   2. ¿Que oferta encaja? -> similitud de coseno. Para esto SI sirven los
 *      embeddings, y muy bien.
 *
 * Sin el paso 1, preguntar por una receta de cocina devolvia cinco vacantes de
 * portero y de atencion al cliente, presentadas como si vinieran a cuento.
 *
 * A diferencia del backend original, el paso 1 NO dispara llamadas a APIs
 * externas: la busqueda es una consulta SQL local sobre ofertas ya ingeridas.
 */
/**
 * Peticiones que NO describen un puesto, sino "algo para mi".
 *
 * Buscar por ese texto no sirve de nada: "algo que concuerde con mis gustos" no
 * se parece a ninguna oferta. Lo que hay que usar es el embedding del PERFIL,
 * que es justo lo que alimenta la home.
 */
const PIDE_PERSONALIZADO =
  /\b(mi perfil|mis gustos|mis skills|mis habilidades|mi experiencia|para mi|conmigo|me convenga|me convienen|me quede|afin|afines|encaje|encajen)\b/i;

async function recuperar({ mensaje, perfil }) {
  if (!esConsultaDeEmpleo(mensaje)) return [];

  // Si pide algo a su medida y tiene perfil, se busca POR EL PERFIL.
  const porPerfil = Boolean(perfil?.id) && PIDE_PERSONALIZADO.test(mensaje);

  try {
    if (porPerfil) {
      return await matching.suggestJobs({ profileId: perfil.id, limit: 5 });
    }
    return await matching.suggestJobs({ text: mensaje, limit: 5 });
  } catch {
    // Que el matching falle no debe tumbar la conversacion: el chat sigue,
    // simplemente sin ofertas. Y el prompt le prohibe inventarselas.
    return [];
  }
}

/**
 * Forma canonica del mensaje para la clave de cache. "Hola!", "hola" y "HOLA"
 * son la misma pregunta; sin normalizar, cada variante pagaria su propia
 * llamada. Se quitan tildes porque en una feria la mitad escribe sin ellas.
 */
function normalizar(texto) {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // marcas diacriticas que suelta NFD
    .replace(/\s+/g, ' ')
    // Signos de apertura y cierre: "hola", "hola!" y "¿hola?" son la misma
    // pregunta de arranque. Medido: sin esta linea, "HOLA!" fallaba la cache.
    .replace(/^[¡¿"'\s]+|[!?.,;:"'\s]+$/g, '')
    .trim();
}

async function responder({ mensaje, sessionId, user, perfil, jobViendo, contextoPantalla }) {
  const texto = String(mensaje || '').trim().slice(0, MAX_MENSAJE);
  if (!texto) throw new ChatError('El mensaje esta vacio', 400);

  const sesion = sessionId || crypto.randomUUID();

  // Los visitantes tambien consumen cuota: se les limita por sesion.
  //
  // OJO con el orden: la identidad se calcula sobre `sesion`, no sobre el
  // `sessionId` que llega. En el PRIMER mensaje no llega ninguno, asi que la
  // version anterior metia a todos los anonimos en el mismo cubo
  // (`anon:undefined`) y compartian un unico cupo de 25 al dia: en una feria,
  // el visitante 26 se encontraba un 429 por culpa de los 25 anteriores.
  const identidad = user?.id || `anon:${sesion}`;

  const [previos, jobs] = await Promise.all([
    historial(sesion),
    recuperar({ mensaje: texto, perfil }),
  ]);

  // El contexto recuperado va en un mensaje aparte, delimitado y anunciado como
  // DATOS. Nunca concatenado al texto del usuario: eso es lo que abre la puerta
  // a la inyeccion indirecta de prompts.
  const contexto = [
    bloquePerfil(perfil),
    bloquePantalla(contextoPantalla),
    bloqueOfertaActual(jobViendo),
    bloqueOfertas(jobs),
  ]
    .filter(Boolean)
    .join('\n\n');

  const messages = [
    ...previos,
    { role: 'user', content: `${contexto}\n\nMensaje del usuario:\n${texto}` },
  ];

  /**
   * CACHE "EN FRIO": solo el PRIMER mensaje de una sesion anonima y sin contexto
   * propio. En una feria decenas de visitantes escriben lo mismo de arranque
   * ("hola", "busco trabajo de backend"): esa respuesta se sirve gratis y al
   * instante en vez de pagarla una vez por persona.
   *
   * Las condiciones son restrictivas A PROPOSITO. En cuanto hay historial,
   * perfil, oferta en pantalla o contexto de pantalla, el prompt lleva datos de
   * ESA persona y servirle texto generado para otra seria, ademas de incorrecto,
   * una fuga. Por eso se exigen todas a la vez.
   *
   * Y se excluyen las CONSULTAS DE EMPLEO, aunque sean las mas repetidas. No es
   * por privacidad, es que no se pueden cachear bien: el ranking lleva
   * exploracion epsilon-greedy (15% aleatorio), asi que "busco backend" trae un
   * set distinto en cada llamada. Cachear el texto sin las ofertas lo dejaria
   * describiendo vacantes que no son las que la UI pinta al lado; meter los ids
   * en la clave hace que no acierte nunca. Comprobado midiendo: dos peticiones
   * identicas seguidas fallaban la cache por eso.
   *
   * Queda lo que de verdad se repite en un stand y es estable: "hola", "que
   * eres", "como funciona esto".
   */
  const enFrio =
    previos.length === 0 &&
    !perfil &&
    !jobViendo &&
    !contextoPantalla &&
    !esConsultaDeEmpleo(texto) &&
    texto.length <= MAX_CACHEABLE;

  // El modelo entra en la clave: si se cambia, no se sirve texto escrito por otro.
  const clave = `chat:cold:${hash(normalizar(texto), env.openrouter.modelos[0])}`;

  // La cuota se descuenta DENTRO de generar(): un acierto de cache no llama al
  // LLM, asi que no tiene por que gastarle el cupo del dia a nadie.
  let cuota = null;
  const generar = async () => {
    cuota = await consumir(identidad, env.openrouter.limiteDiario);
    if (!cuota.permitido) {
      throw new ChatError(
        `Has alcanzado el limite de ${cuota.limite} mensajes por hoy. Vuelve manana.`,
        429,
      );
    }

    const { texto: generado } = await llm.chat({ system: SYSTEM, messages, maxTokens: 600 });
    return generado;
  };

  const { texto: respuesta, cacheado: servidoDeCache } = enFrio
    ? await cacheado(clave, generar, TTL_CACHE)
    : { texto: await generar(), cacheado: false };

  // Si vino de cache no se llamo a consumir(): se lee el contador sin tocarlo.
  if (!cuota) cuota = await asomar(identidad, env.openrouter.limiteDiario);

  // Persistir despues de que el LLM responda: si falla, no queda un turno cojo.
  await prisma.message.createMany({
    data: [
      { sessionId: sesion, userId: user?.id ?? null, role: 'user', content: texto },
      { sessionId: sesion, userId: user?.id ?? null, role: 'assistant', content: respuesta },
    ],
  });

  return {
    sessionId: sesion,
    respuesta,
    // Se devuelven las ofertas reales para que la UI pinte tarjetas de verdad,
    // con su enlace: el usuario no depende de que el modelo las transcriba bien.
    jobs,
    cuota: { usadas: cuota.usadas, limite: cuota.limite },
    cacheado: servidoDeCache,
  };
}

async function obtenerHistorial(sessionId) {
  return prisma.message.findMany({
    where: { sessionId },
    orderBy: { createdAt: 'asc' },
    select: { role: true, content: true, createdAt: true },
  });
}

module.exports = { responder, obtenerHistorial, ChatError };
