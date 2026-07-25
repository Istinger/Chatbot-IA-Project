/**
 * Historial de entrevistas simuladas.
 *
 * Vive en localStorage: el backend no persiste sesiones de entrevista (no hay
 * modelo ni endpoint de historial), y para practicar basta con el propio equipo.
 * Mismo patron que las ideas guardadas del portafolio.
 */
const CLAVE = 'jobia_entrevistas';

/** Tope de entrevistas sin guardar. Las guardadas NUNCA se descartan. */
const MAX_SUELTAS = 15;

export function leerEntrevistas() {
  try {
    const lista = JSON.parse(localStorage.getItem(CLAVE) || '[]');
    return Array.isArray(lista) ? lista : [];
  } catch {
    return [];
  }
}

function escribir(lista) {
  localStorage.setItem(CLAVE, JSON.stringify(lista));
  return lista;
}

/**
 * Añade una entrevista terminada (la mas reciente primero) y poda las viejas.
 * Devuelve el historial ya actualizado.
 */
export function anotarEntrevista(entrada) {
  const lista = [{ id: `e${Date.now()}`, fecha: Date.now(), guardada: false, ...entrada }, ...leerEntrevistas()];

  // Se podan solo las NO guardadas: lo que el usuario marco se queda.
  let sueltas = 0;
  const podada = lista.filter((e) => {
    if (e.guardada) return true;
    sueltas += 1;
    return sueltas <= MAX_SUELTAS;
  });

  return escribir(podada);
}

export function alternarGuardadaEntrevista(id) {
  return escribir(leerEntrevistas().map((e) => (e.id === id ? { ...e, guardada: !e.guardada } : e)));
}

export function borrarEntrevista(id) {
  return escribir(leerEntrevistas().filter((e) => e.id !== id));
}

/**
 * Los puntos de "para mejorar" que MAS se repiten en tu historial.
 *
 * Cero IA: es un conteo sobre el feedback que ya se genero al terminar cada
 * entrevista. Personalizado de verdad y sin gastar cuota.
 */
export function puntosRecurrentes(lista, tope = 3) {
  const cuenta = new Map();
  for (const e of lista) {
    for (const p of e.feedback?.mejorar || []) {
      // Se normaliza para agrupar variantes ("Da ejemplos." / "da ejemplos").
      const clave = String(p).trim().toLowerCase().replace(/[.:;]+$/, '');
      if (!clave) continue;
      const previo = cuenta.get(clave);
      cuenta.set(clave, { texto: previo?.texto || String(p).trim(), n: (previo?.n || 0) + 1 });
    }
  }
  return [...cuenta.values()].sort((a, b) => b.n - a.n).slice(0, tope);
}

/** Consejos base para quien todavia no tiene historial. */
export const CONSEJOS_BASE = [
  'Responde con la estructura STAR: situacion, tarea, accion y resultado.',
  'Cuantifica lo que puedas: "baje el tiempo de carga un 40%" pesa mas que "lo mejore".',
  'Si no sabes algo, dilo y explica como lo averiguarias. Es mejor que improvisar.',
  'Prepara 2 o 3 proyectos tuyos y practicalos: sirven para casi cualquier pregunta.',
];

export const fechaCorta = (ts) =>
  new Date(ts).toLocaleDateString('es-EC', { day: '2-digit', month: 'short' });
