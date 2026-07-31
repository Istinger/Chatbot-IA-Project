import { claveLocalUsuario } from './api';

/**
 * Ofertas que el usuario marca para tenerlas a mano.
 *
 * En localStorage, aisladas por id de usuario: el modelo `Application` existe en
 * la base pero no hay ningun endpoint que lo use. Separar la clave evita que una
 * cuenta nueva herede los marcadores dejados en una computadora compartida.
 *
 * Se guarda una COPIA de la oferta, no solo su id: el backend no expone
 * `GET /jobs/:id`, asi que con el id suelto no habria forma de volver a pintarla
 * en el listado. La contrapartida es que el sueldo o el enlace pueden quedar
 * viejos; por eso se guarda tambien `guardadaEn` y el detalle avisa.
 */
const CLAVE = 'jobia_ofertas_guardadas';
const clave = () => claveLocalUsuario(CLAVE);

/** Lo que hay en disco, ya normalizado a objetos. */
function leer() {
  try {
    const lista = JSON.parse(localStorage.getItem(clave()) || '[]');
    if (!Array.isArray(lista)) return [];
    // Formato viejo: un array de ids sueltos. Se conservan para que el marcador
    // de la tarjeta siga encendido, aunque sin datos no se puedan listar.
    return lista.map((o) => (typeof o === 'string' ? { id: o } : o)).filter((o) => o?.id);
  } catch {
    return [];
  }
}

export function idsGuardadas() {
  return new Set(leer().map((o) => o.id));
}

/**
 * Las ofertas guardadas, de la mas reciente a la mas antigua.
 * Se descartan las del formato viejo (solo id): no hay nada que pintar.
 */
export function ofertasGuardadas() {
  return leer()
    .filter((o) => o.title)
    .sort((a, b) => (b.guardadaEn ?? 0) - (a.guardadaEn ?? 0));
}

/**
 * Guarda/quita una oferta y devuelve el Set de ids ya actualizado.
 * Acepta la oferta entera; si solo llega un id, se comporta como antes (quitar
 * funciona igual, guardar deja el registro sin datos).
 */
export function alternarGuardada(oferta) {
  const id = typeof oferta === 'string' ? oferta : oferta?.id;
  if (!id) return idsGuardadas();

  const lista = leer();
  const i = lista.findIndex((o) => o.id === id);
  if (i >= 0) lista.splice(i, 1);
  else lista.push({ ...(typeof oferta === 'object' ? oferta : {}), id, guardadaEn: Date.now() });

  localStorage.setItem(clave(), JSON.stringify(lista));
  return new Set(lista.map((o) => o.id));
}
