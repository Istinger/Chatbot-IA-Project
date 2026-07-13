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

  const user = await prisma.user.create({
    data: {
      email: correo,
      password: await bcrypt.hash(password, RONDAS),
      profile: { create: { skills: [] } },
    },
    include: { profile: { select: { id: true } } },
  });

  return {
    token: firmar(user),
    user: { id: user.id, email: user.email, profileId: user.profile.id },
  };
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

module.exports = { register, login, AuthError };
