const { prisma } = require('../../config/db');
const { fetchCandidates } = require('../matching/matching.service');
const { cursosPara } = require('./cursos.catalog');

/**
 * Skill gap analysis. CERO IA.
 *
 * Es una diferencia de conjuntos:
 *
 *   faltan = skills_demandadas_en_mis_ofertas_afines  -  mis_skills
 *
 * y luego un lookup en el catalogo de cursos. Meter un LLM aqui seria pagar por
 * un calculo que un `Set` hace exacto y gratis.
 *
 * El detalle que hace que sea util: NO se mide la demanda sobre la base entera
 * (569 ofertas), sino sobre las ofertas AFINES al perfil. Sobre la base entera,
 * a un desarrollador Python le saldria "te falta Java" solo porque hay muchas
 * vacantes de Java en el mundo — un consejo cierto y a la vez inservible. Sobre
 * sus ofertas afines, le sale lo que le piden A EL.
 */
const OFERTAS_ANALIZADAS = 50; // suficiente para que las frecuencias signifiquen algo
const MAX_FALTANTES = 8; // mas de 8 no es un plan, es una lista de la compra

class CertsError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

/** Cuenta en cuantas ofertas aparece cada skill. */
function contarSkills(ofertas) {
  const conteo = new Map();
  for (const oferta of ofertas) {
    // Set: si una oferta repite "python" en titulo y descripcion, cuenta 1 vez.
    for (const skill of new Set(oferta.skills || [])) {
      conteo.set(skill, (conteo.get(skill) || 0) + 1);
    }
  }
  return conteo;
}

async function suggestions(userId) {
  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: { id: true, skills: true },
  });

  if (!profile) throw new CertsError('Perfil no encontrado', 404);

  if (!profile.skills.length) {
    throw new CertsError(
      'Aun no tienes skills en tu perfil. Sube tu CV para detectarlas.',
      400,
    );
  }

  const ofertas = await fetchCandidates({
    profile_id: profile.id,
    limit: OFERTAS_ANALIZADAS,
  });

  if (!ofertas.length) {
    return {
      analizadas: 0,
      tusSkills: profile.skills,
      fortalezas: [],
      faltantes: [],
      cursos: [],
      mensaje: 'Todavia no hay ofertas suficientes para analizar tu brecha.',
    };
  }

  const conteo = contarSkills(ofertas);
  const mias = new Set(profile.skills);
  const total = ofertas.length;

  const conFrecuencia = (skill, apariciones) => ({
    skill,
    apariciones,
    // % de las ofertas afines que piden esta skill. Es la cifra que convence:
    // "el 62% de las ofertas que encajan contigo pide Docker" pesa mas que
    // "te falta Docker".
    porcentaje: Math.round((apariciones / total) * 100),
  });

  const ordenadas = [...conteo.entries()].sort((a, b) => b[1] - a[1]);

  // Lo que YA tienes y ademas te lo piden: refuerza, no solo senala carencias.
  const fortalezas = ordenadas
    .filter(([skill]) => mias.has(skill))
    .slice(0, 6)
    .map(([skill, n]) => conFrecuencia(skill, n));

  // La brecha propiamente dicha.
  const faltantes = ordenadas
    .filter(([skill]) => !mias.has(skill))
    .slice(0, MAX_FALTANTES)
    .map(([skill, n]) => conFrecuencia(skill, n));

  const cursos = faltantes.map(({ skill, porcentaje }) => ({
    skill,
    porcentaje,
    opciones: cursosPara(skill),
  }));

  return {
    analizadas: total,
    tusSkills: profile.skills,
    fortalezas,
    faltantes,
    cursos,
  };
}

module.exports = { suggestions, contarSkills, CertsError };
