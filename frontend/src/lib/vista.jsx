import { createContext, useCallback, useContext, useMemo, useState } from 'react';

/**
 * Contexto de "lo que el usuario esta viendo ahora mismo". Lo consume el
 * Asistente para responder sobre lo que hay en pantalla sin que el usuario tenga
 * que repetirlo. Piezas:
 *
 *   - ofertaActiva: la oferta abierta en el modal. Se comparte entre quien la
 *     abre (tarjetas de la home o del chat), el unico JobModal (montado en el
 *     Shell, para no duplicarlo) y el Asistente (que manda su id al chat).
 *
 *   - contextoPantalla: un resumen breve, en texto, de lo que muestra la
 *     pantalla actual (p. ej. las brechas y cursos de "Crecer"). Cada pantalla
 *     lo declara al montarse y lo limpia al salir; el Asistente lo adjunta al
 *     chat como DATOS.
 *
 *   - peticionIA / pedirIA / consumirIA: canal para que una pantalla EMPUJE un
 *     mensaje al chat (p. ej. el boton "Pedir orientacion a la IA" del worksheet).
 *     La pantalla llama pedirIA(texto); el Asistente lo envia y llama consumirIA.
 */
const VistaContext = createContext(null);

export function VistaProvider({ children }) {
  const [ofertaActiva, setOfertaActiva] = useState(null);
  const [contextoPantalla, setContextoPantalla] = useState(null);
  const [peticionIA, setPeticionIA] = useState(null); // { texto, id }

  const pedirIA = useCallback((texto) => setPeticionIA({ texto, id: Date.now() }), []);
  const consumirIA = useCallback(() => setPeticionIA(null), []);

  const valor = useMemo(
    () => ({
      ofertaActiva,
      setOfertaActiva,
      contextoPantalla,
      setContextoPantalla,
      peticionIA,
      pedirIA,
      consumirIA,
    }),
    [ofertaActiva, contextoPantalla, peticionIA, pedirIA, consumirIA],
  );
  return <VistaContext.Provider value={valor}>{children}</VistaContext.Provider>;
}

export const useVista = () => useContext(VistaContext);
