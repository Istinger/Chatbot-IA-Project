/**
 * Estado de "Crecer" que el usuario marca a mano: en que habilidades esta
 * trabajando y cuales ya considera aprendidas.
 *
 * En localStorage (el backend calcula la brecha, pero no guarda tu progreso).
 * Mismo patron que las ideas guardadas del portafolio y el historial de
 * entrevistas.
 */
const CLAVE = 'jobia_crecer_progreso';

/** Ciclo del boton: sin marcar -> en progreso -> aprendida -> sin marcar. */
const SIGUIENTE = { '': 'progreso', progreso: 'aprendida', aprendida: '' };

export function leerProgreso() {
  try {
    const p = JSON.parse(localStorage.getItem(CLAVE) || '{}');
    return p && typeof p === 'object' ? p : {};
  } catch {
    return {};
  }
}

/** Avanza el estado de una skill y devuelve el mapa completo ya guardado. */
export function alternarProgreso(skill) {
  const p = leerProgreso();
  const nuevo = SIGUIENTE[p[skill] || ''];
  if (nuevo) p[skill] = nuevo;
  else delete p[skill];
  localStorage.setItem(CLAVE, JSON.stringify(p));
  return { ...p };
}

/**
 * Cuantas ofertas mas alcanzarias con las habilidades marcadas.
 *
 * OJO: no se pueden sumar los porcentajes y quedarse tan ancho. Una misma oferta
 * puede pedir varias de esas habilidades, asi que la suma CUENTA DOBLE. Sin el
 * detalle por oferta (el backend solo manda frecuencias) lo honesto es dar el
 * rango: el minimo seguro es la habilidad que mas ofertas abre, y el tope es la
 * suma, acotada al total analizado.
 */
export function proyeccion(faltantes, marcadas, analizadas) {
  const elegidas = faltantes.filter((f) => marcadas[f.skill]);
  if (!elegidas.length) return null;

  const cuentas = elegidas.map((f) => f.apariciones ?? Math.round((f.porcentaje / 100) * analizadas));
  const minimo = Math.max(...cuentas);
  const tope = Math.min(cuentas.reduce((a, b) => a + b, 0), analizadas);

  return { minimo, tope, exacto: minimo === tope, skills: elegidas.map((f) => f.skill) };
}
