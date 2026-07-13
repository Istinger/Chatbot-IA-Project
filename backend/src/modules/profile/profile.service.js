const { prisma } = require('../../config/db');
const env = require('../../config/env');
const { detectSkills } = require('../jobs/skills.catalog');

class ProfileError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

/**
 * Revectoriza el perfil en el microservicio Python.
 *
 * Solo se llama cuando el CV o las skills CAMBIAN, nunca en cada busqueda: el
 * embedding del perfil es estable hasta que el usuario lo modifica.
 */
async function revectorizar(profileId) {
  const res = await fetch(`${env.matchingUrl}/embed/profile/${profileId}`, {
    method: 'POST',
    signal: AbortSignal.timeout(30000),
  });
  if (!res.ok) {
    throw new ProfileError(`El servicio de matching respondio ${res.status}`, 502);
  }
  return res.json();
}

/**
 * Extrae el texto de un PDF delegando en el microservicio Python (pypdf).
 *
 * En Node lo natural seria pdf-parse, pero esta abandonado y es INESTABLE: con
 * el mismo PDF valido fallaba 2 de cada 3 intentos con "bad XRef entry". El
 * servicio Python ya esta en la ruta de esta peticion (es quien vectoriza el
 * CV), asi que extraer alli sale gratis y es fiable.
 */
async function extraerTexto(buffer) {
  const res = await fetch(`${env.matchingUrl}/extract-text`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/pdf' },
    body: buffer,
    signal: AbortSignal.timeout(30000),
  });

  if (!res.ok) {
    const detalle = await res.json().catch(() => ({}));
    throw new ProfileError(detalle.detail || 'No se pudo leer el PDF', 400);
  }

  return (await res.json()).text;
}

async function get(userId) {
  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: { id: true, cvText: true, skills: true, updatedAt: true },
  });

  if (!profile) throw new ProfileError('Perfil no encontrado', 404);

  // El cvText puede ser muy largo: se devuelve solo si lo piden explicitamente.
  return {
    id: profile.id,
    skills: profile.skills,
    tieneCv: Boolean(profile.cvText),
    cvLongitud: profile.cvText?.length ?? 0,
    updatedAt: profile.updatedAt,
  };
}

/**
 * Sube un CV en PDF: extrae el texto, detecta las skills con el catalogo
 * estatico (sin IA: es busqueda de palabras) y revectoriza el perfil.
 *
 * Las skills detectadas se SUGIEREN; el usuario las confirma despues con
 * PUT /profile/skills. Es el paso 2 del onboarding de DESIGN.md.
 */
async function subirCv(userId, file) {
  if (!file) throw new ProfileError('Falta el archivo (campo "cv")', 400);
  if (file.mimetype !== 'application/pdf') {
    throw new ProfileError('El CV debe ser un PDF', 400);
  }

  const texto = (await extraerTexto(file.buffer)).replace(/\s+/g, ' ').trim();

  // Un PDF escaneado (imagen) no tiene capa de texto: pdf-parse devuelve casi
  // nada. Sin OCR no hay forma de leerlo, asi que se avisa en vez de guardar
  // un perfil vacio que arruinaria el matching.
  if (texto.length < 100) {
    throw new ProfileError(
      'El PDF no contiene texto legible. Si es escaneado, sube uno digital.',
      400,
    );
  }

  const detectadas = detectSkills(texto);

  const profile = await prisma.profile.update({
    where: { userId },
    data: { cvText: texto, skills: detectadas },
    select: { id: true, skills: true },
  });

  await revectorizar(profile.id);

  return {
    profileId: profile.id,
    cvLongitud: texto.length,
    skillsDetectadas: detectadas,
  };
}

/** Confirma / corrige las skills (paso 2 del onboarding, o edicion posterior). */
async function actualizarSkills(userId, skills) {
  if (!Array.isArray(skills) || skills.length === 0) {
    throw new ProfileError('Envia un array de skills no vacio', 400);
  }

  const limpias = [
    ...new Set(skills.map((s) => String(s).trim().toLowerCase()).filter(Boolean)),
  ];

  const profile = await prisma.profile.update({
    where: { userId },
    data: { skills: limpias },
    select: { id: true, skills: true },
  });

  // Las skills forman parte del texto que se vectoriza: hay que recalcular.
  await revectorizar(profile.id);

  return { profileId: profile.id, skills: profile.skills };
}

module.exports = { get, subirCv, actualizarSkills, ProfileError };
