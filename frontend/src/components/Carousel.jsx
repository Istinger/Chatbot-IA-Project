import { useCallback, useEffect, useRef, useState } from 'react';
import Icon from './Icon';

/**
 * Carrusel horizontal (DESIGN.md: "nunca listas largas, nunca tablas").
 *
 * Se apoya en el scroll NATIVO del navegador con scroll-snap, en vez de mover
 * elementos con JS. Eso da inercia nativa, gesto tactil correcto, rueda del
 * raton y navegacion por teclado sin escribir una linea, y no toca el layout
 * (no hay reflow, no hay jank).
 *
 * Las flechas son una ayuda para raton, no el mecanismo principal.
 */
export default function Carousel({ titulo, subtitulo, children, accion }) {
  const pista = useRef(null);
  const [puedeIzq, setPuedeIzq] = useState(false);
  const [puedeDer, setPuedeDer] = useState(false);

  const revisar = useCallback(() => {
    const el = pista.current;
    if (!el) return;
    setPuedeIzq(el.scrollLeft > 8);
    setPuedeDer(el.scrollLeft + el.clientWidth < el.scrollWidth - 8);
  }, []);

  useEffect(() => {
    revisar();
    const el = pista.current;
    if (!el) return undefined;
    el.addEventListener('scroll', revisar, { passive: true });
    window.addEventListener('resize', revisar);
    return () => {
      el.removeEventListener('scroll', revisar);
      window.removeEventListener('resize', revisar);
    };
  }, [revisar, children]);

  const mover = (dir) => {
    const el = pista.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: 'smooth' });
  };

  return (
    <section className="carrusel">
      <header className="carrusel__head">
        <div>
          <h2 className="carrusel__title">{titulo}</h2>
          {subtitulo && <p className="carrusel__sub">{subtitulo}</p>}
        </div>

        <div className="carrusel__ctrl">
          {accion}
          <button
            type="button"
            className="iconbtn"
            onClick={() => mover(-1)}
            disabled={!puedeIzq}
            aria-label={`Desplazar ${titulo} a la izquierda`}
          >
            <Icon name="izquierda" />
          </button>
          <button
            type="button"
            className="iconbtn"
            onClick={() => mover(1)}
            disabled={!puedeDer}
            aria-label={`Desplazar ${titulo} a la derecha`}
          >
            <Icon name="derecha" />
          </button>
        </div>
      </header>

      <div className="carrusel__pista" ref={pista}>
        {children}
      </div>
    </section>
  );
}
