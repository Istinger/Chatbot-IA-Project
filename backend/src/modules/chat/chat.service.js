const crypto = require('node:crypto');
const { prisma } = require('../../config/db');
const env = require('../../config/env');
const llm = require('../../config/openrouter');
const { consumir } = require('../../shared/ratelimit');
const matching = require('../matching/matching.service');
const { SYSTEM, bloqueOfertas, bloquePerfil } = require('./chat.prompt');

/** Turnos de conversacion que viajan en el prompt. Ver `historial()`. */
const TURNOS = 6;

/** Tope del mensaje del usuario. Un prompt gigante es coste y superficie de ataque. */
const MAX_MENSAJE = 1000;

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
 * Aqui esta el cambio de fondo respecto al backend original, que decidia si
 * buscar ofertas comparando el mensaje contra una LISTA FIJA de palabras
 * ("trabajo", "salario", "contrato"...). Eso hacia que "no me gusta mi trabajo
 * actual" disparara tres llamadas a APIs externas.
 *
 * Ahora la deteccion de intencion la hace el propio umbral semantico: se vectoriza
 * el mensaje y se busca. Si no es una consulta de empleo, ninguna oferta supera
 * el umbral de confianza y no se inyecta contexto. Sale gratis, es SQL, y no hay
 * ninguna lista que mantener.
 */
async function recuperar({ mensaje, profileId }) {
  try {
    const jobs = await matching.suggestJobs({ text: mensaje, limit: 5 });
    return jobs;
  } catch {
    // Que el matching falle no debe tumbar la conversacion: el chat sigue,
    // simplemente sin ofertas. Y el prompt le prohibe inventarselas.
    return [];
  }
}

async function responder({ mensaje, sessionId, user, perfil }) {
  const texto = String(mensaje || '').trim().slice(0, MAX_MENSAJE);
  if (!texto) throw new ChatError('El mensaje esta vacio', 400);

  // Los visitantes tambien consumen cuota: se les limita por sesion.
  const identidad = user?.id || `anon:${sessionId}`;
  const cuota = await consumir(identidad, env.openrouter.limiteDiario);
  if (!cuota.permitido) {
    throw new ChatError(
      `Has alcanzado el limite de ${cuota.limite} mensajes por hoy. Vuelve manana.`,
      429,
    );
  }

  const sesion = sessionId || crypto.randomUUID();

  const [previos, jobs] = await Promise.all([
    historial(sesion),
    recuperar({ mensaje: texto, profileId: perfil?.id }),
  ]);

  // El contexto recuperado va en un mensaje aparte, delimitado y anunciado como
  // DATOS. Nunca concatenado al texto del usuario: eso es lo que abre la puerta
  // a la inyeccion indirecta de prompts.
  const contexto = [bloquePerfil(perfil), bloqueOfertas(jobs)]
    .filter(Boolean)
    .join('\n\n');

  const messages = [
    ...previos,
    { role: 'user', content: `${contexto}\n\nMensaje del usuario:\n${texto}` },
  ];

  const { texto: respuesta } = await llm.chat({
    system: SYSTEM,
    messages,
    maxTokens: 600,
  });

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
