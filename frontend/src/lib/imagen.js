/**
 * Imagenes de prueba.
 *
 * Las ofertas vienen de APIs (Adzuna/Jooble) y NO traen foto ni logo. Para que
 * las tarjetas se vean como el mock usamos un proveedor externo SEMBRADO por el
 * id de la oferta: asi cada oferta tiene siempre la misma imagen (no parpadea
 * entre renders) sin inventar datos que no existen.
 *
 * Un solo lugar para el proveedor: si mas adelante hay imagenes reales, se
 * cambia aqui y nada mas.
 */

/** Imagen de portada de una oferta, estable por `job.id`. */
export function imagenOferta(job, ancho = 640, alto = 420) {
  const semilla = encodeURIComponent(job?.id || job?.externalId || 'jobia');
  return `https://picsum.photos/seed/${semilla}/${ancho}/${alto}`;
}

/** Placeholder si la imagen externa falla (sin red). */
export function imagenFallback(ancho = 640, alto = 420) {
  return `https://placehold.co/${ancho}x${alto}/071424/4b9cff?text=Jobia`;
}

/** Avatar del usuario, estable por email. */
export function avatarPerfil(email, tam = 96) {
  const u = encodeURIComponent(email || 'jobia');
  return `https://i.pravatar.cc/${tam}?u=${u}`;
}
