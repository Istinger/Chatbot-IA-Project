const CLAVE = 'jobia_animaciones';
const CANAL = 'jobia-animacion';
const LIMITE = 6;

export const METAS_ANIMACION = {
  cv_generado: { titulo: 'Que ocurre cuando cargas tu CV', subtitulo: 'Sigue el recorrido desde el documento hasta las oportunidades' },
  ofertas_encontradas: { titulo: 'Como encontramos ofertas para ti', subtitulo: 'Tu perfil pasa por cuatro etapas faciles de seguir' },
  busqueda_abierta: { titulo: 'Como funciona Buscar ofertas', subtitulo: 'Del texto escrito a las tarjetas que aparecen en pantalla' },
  busqueda_realizada: { titulo: 'Como una busqueda llega a resultados', subtitulo: 'Mira que ocurre desde que escribes hasta que aparecen ofertas' },
  crecimiento_analizado: { titulo: 'Como construimos tu siguiente paso', subtitulo: 'Fortalezas, oportunidades de mejora y recursos en un solo recorrido' },
  portafolio_sugerido: { titulo: 'Como nacen tus ideas de portafolio', subtitulo: 'Tus habilidades se convierten en proyectos que puedes mostrar' },
  oferta_guardada: { titulo: 'Que ocurre al guardar una oferta', subtitulo: 'La oportunidad viaja hasta tu lista personal' },
  inicio: { titulo: 'Mira como trabaja Jobia', subtitulo: 'Cada accion se explica con un mapa claro y datos reales' },
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

export function prepararOfertasAnimacion(ofertas, limite = 6) {
  return (Array.isArray(ofertas) ? ofertas : []).slice(0, limite).map((job) => ({
    id: job.id,
    title: job.title,
    company: job.company,
    location: job.location,
    country: job.country,
    source: job.source,
    skills: Array.isArray(job.skills) ? job.skills.slice(0, 4) : [],
    score: job.score,
    salaryUsdMin: job.salaryUsdMin,
    salaryUsdMax: job.salaryUsdMax,
    salaryPredicted: job.salaryPredicted,
    explored: job.explored,
    isForeign: job.isForeign,
  }));
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
