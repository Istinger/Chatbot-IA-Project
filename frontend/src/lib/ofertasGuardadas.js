/**
 * Ofertas que el usuario marca para tenerlas a mano.
 *
 * En localStorage: el modelo `Application` existe en la base pero no hay ningun
 * endpoint que lo use, y para no perder una oferta mientras se navega basta con
 * el propio equipo. Mismo patron que las ideas del portafolio y el historial de
 * entrevistas.
 */
const CLAVE = 'jobia_ofertas_guardadas';

export function idsGuardadas() {
  try {
    const lista = JSON.parse(localStorage.getItem(CLAVE) || '[]');
    return new Set(Array.isArray(lista) ? lista : []);
  } catch {
    return new Set();
  }
}

/** Guarda/quita una oferta y devuelve el Set ya actualizado. */
export function alternarGuardada(id) {
  const set = idsGuardadas();
  if (set.has(id)) set.delete(id);
  else set.add(id);
  localStorage.setItem(CLAVE, JSON.stringify([...set]));
  return set;
}
