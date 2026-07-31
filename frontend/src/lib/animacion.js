const CLAVE = 'jobia_animaciones';
const CANAL = 'jobia-animacion';
const LIMITE = 6;

export const METAS_ANIMACION = {
  cv_generado: { titulo: 'Tu CV activa el perfil', subtitulo: 'De tus habilidades a oportunidades reales' },
  ofertas_encontradas: { titulo: 'Tus ofertas toman forma', subtitulo: 'Encontramos oportunidades para tu perfil' },
  busqueda_realizada: { titulo: 'Tu busqueda se convierte en resultados', subtitulo: 'La consulta encuentra oportunidades afines' },
  crecimiento_analizado: { titulo: 'Tu proximo paso se aclara', subtitulo: 'Brechas, habilidades y cursos recomendados' },
  portafolio_sugerido: { titulo: 'Tus habilidades inspiran proyectos', subtitulo: 'Ideas para demostrar lo que sabes hacer' },
  oferta_guardada: { titulo: 'La oportunidad queda contigo', subtitulo: 'Guardada para revisarla cuando quieras' },
  inicio: { titulo: 'Asi se mueve tu camino', subtitulo: 'Elige una accion de la aplicacion para verla aqui' },
};

function leer() {
  try {
    const lista = JSON.parse(localStorage.getItem(CLAVE) || '[]');
    return Array.isArray(lista) ? lista : [];
  } catch {
    return [];
  }
}

export function obtenerAnimaciones() {
  return leer();
}

export function registrarAnimacion(tipo, datos = {}) {
  if (typeof window === 'undefined') return null;
  const accion = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    tipo,
    datos,
    fecha: Date.now(),
  };
  const lista = [accion, ...leer()].slice(0, LIMITE);
  localStorage.setItem(CLAVE, JSON.stringify(lista));
  window.dispatchEvent(new CustomEvent('jobia-animacion', { detail: accion }));
  if ('BroadcastChannel' in window) {
    const canal = new BroadcastChannel(CANAL);
    canal.postMessage(accion);
    canal.close();
  }
  return accion;
}

export function escucharAnimaciones(alRecibir) {
  if (typeof window === 'undefined') return () => {};
  const propia = (e) => alRecibir(e.detail);
  const almacenamiento = (e) => {
    if (e.key === CLAVE) alRecibir(null);
  };
  const canal = 'BroadcastChannel' in window ? new BroadcastChannel(CANAL) : null;
  const mensaje = (e) => alRecibir(e.data);

  window.addEventListener('jobia-animacion', propia);
  window.addEventListener('storage', almacenamiento);
  canal?.addEventListener('message', mensaje);
  return () => {
    window.removeEventListener('jobia-animacion', propia);
    window.removeEventListener('storage', almacenamiento);
    canal?.removeEventListener('message', mensaje);
    canal?.close();
  };
}
