const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { prisma } = require('../../config/db');
const env = require('../../config/env');

const RONDAS = 10;

class AuthError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

function firmar(user) {
  return jwt.sign({ sub: user.id, email: user.email }, env.jwtSecret, {
    expiresIn: env.jwtExpira,
  });
}

function correoConSufijo(email, sufijo = 0) {
  const correo = String(email || '').trim().toLowerCase();
  const indiceArroba = correo.lastIndexOf('@');
  if (indiceArroba < 1) return correo;

  const nombre = correo.slice(0, indiceArroba);
  const dominio = correo.slice(indiceArroba);
  return `${nombre}${sufijo || ''}${dominio}`;
}

/**
 * Registro. Crea el User y su Profile vacio de una sola vez: el perfil es
 * obligatorio para el matching, y no tener que crearlo despues evita estados
 * intermedios raros.
 */
async function register({ email, password }) {
  const correo = String(email || '').trim().toLowerCase();

  if (!correo.includes('@')) throw new AuthError('Correo invalido', 400);
  if (!password || password.length < 8) {
    throw new AuthError('La contrasena debe tener al menos 8 caracteres', 400);
  }

  const existe = await prisma.user.findUnique({ where: { email: correo } });
  if (existe) throw new AuthError('Ese correo ya esta registrado', 409);

  let user;
  try {
    user = await prisma.user.create({
      data: {
        email: correo,
        password: await bcrypt.hash(password, RONDAS),
        profile: { create: { skills: [] } },
      },
      include: { profile: { select: { id: true } } },
    });
  } catch (err) {
    // Dos equipos pueden pedir el mismo correo al mismo tiempo. La restriccion
    // unica de Postgres es la ultima autoridad; se traduce al error de dominio.
    if (err.code === 'P2002') throw new AuthError('Ese correo ya esta registrado', 409);
    throw err;
  }

  return {
    token: firmar(user),
    user: { id: user.id, email: user.email, profileId: user.profile.id },
  };
}

/** Opciones de correo de la casa abierta, sin exponer una consulta arbitraria. */
async function sugerirCorreosDemo(correos) {
  const bases = [...new Set((Array.isArray(correos) ? correos : [])
    .slice(0, 8)
    .map((correo) => String(correo || '').trim().toLowerCase())
    .filter((correo) => correo.includes('@')))];

  if (!bases.length) return [];

  const ocupados = new Set((await prisma.user.findMany({
    where: {
      OR: bases.map((correo) => ({ email: { startsWith: correo.split('@')[0] } })),
    },
    select: { email: true },
  })).map((user) => user.email));

  return bases.map((correo) => {
    let sufijo = 0;
    let candidato = correoConSufijo(correo, sufijo);
    while (ocupados.has(candidato)) {
      sufijo += 1;
      candidato = correoConSufijo(correo, sufijo);
    }
    ocupados.add(candidato);
    return candidato;
  });
}

/** Registro exclusivo de la demo: resuelve choques de correo entre equipos. */
async function registerDemo({ email, password }) {
  for (let sufijo = 0; sufijo < 100; sufijo += 1) {
    try {
      return await register({ email: correoConSufijo(email, sufijo), password });
    } catch (err) {
      if (err.status !== 409) throw err;
    }
  }
  throw new AuthError('No se pudo asignar un correo de demostracion', 409);
}

async function login({ email, password }) {
  const correo = String(email || '').trim().toLowerCase();

  const user = await prisma.user.findUnique({
    where: { email: correo },
    include: { profile: { select: { id: true } } },
  });

  // Mismo mensaje si no existe el correo o si la contrasena falla: revelar cual
  // de las dos cosa fallo permitiria enumerar usuarios registrados.
  const generico = new AuthError('Correo o contrasena incorrectos', 401);

  if (!user) throw generico;
  if (!(await bcrypt.compare(String(password || ''), user.password))) throw generico;

  return {
    token: firmar(user),
    user: { id: user.id, email: user.email, profileId: user.profile?.id ?? null },
  };
}

module.exports = { register, registerDemo, sugerirCorreosDemo, login, AuthError };
