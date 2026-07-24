import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Icon from './Icon';

/**
 * Modo voz a pantalla completa (mock: design/escuchando.html).
 *
 * Es un takeover: cuando el usuario activa la voz, ocupa toda la pantalla con el
 * orb luminoso y tres controles — teclado (volver a escribir), microfono (parar/
 * reanudar la escucha) y cerrar. Reemplaza el estado "escucha" en linea que habia
 * antes dentro del chat, que se perdia entre el resto de la interfaz.
 *
 * No gestiona el reconocimiento de voz: eso vive en Chat (crearDictado). Aqui solo
 * se pinta el estado y se disparan callbacks. Asi el overlay es tonto y testeable.
 */
export default function VozOverlay({
  nombre,
  escuchando,
  transcripcion,
  error,
  onMic,
  onTeclado,
  onCerrar,
}) {
  const micRef = useRef(null);

  // Esc cierra; el foco entra al boton de microfono para que el teclado funcione.
  useEffect(() => {
    micRef.current?.focus();
    const alTecla = (e) => {
      if (e.key === 'Escape') onCerrar();
    };
    document.addEventListener('keydown', alTecla);
    return () => document.removeEventListener('keydown', alTecla);
  }, [onCerrar]);

  // Portal a <body>: el panel del asistente tiene backdrop-filter, que crea un
  // contenedor de posicionamiento y atraparia el position:fixed del overlay
  // dejandolo dentro de la columna. En el body ocupa toda la pantalla (mock).
  return createPortal(
    <div className="voz" role="dialog" aria-modal="true" aria-label="Modo voz">
      <div className="voz__fondo" aria-hidden="true" />

      <header className="voz__saludo">
        <h2>Hola {nombre || 'de nuevo'}</h2>
        <p>{escuchando ? 'Estoy escuchando…' : 'Toca el microfono para hablar'}</p>
      </header>

      {/* Orb luminoso con onda. La onda solo se anima mientras escucha. */}
      <div className={`voz__orb ${escuchando ? 'voz__orb--vivo' : ''}`} aria-hidden="true">
        <span className="voz__glow" />
        <span className="voz__anillo" />
        <svg className="voz__onda" viewBox="0 0 200 80" preserveAspectRatio="none">
          <path d="M0,40 Q25,10 50,40 T100,40 T150,40 T200,40" />
          <path d="M0,40 Q25,64 50,40 T100,40 T150,40 T200,40" className="voz__onda2" />
        </svg>
      </div>

      {/* La transcripcion en vivo: el usuario ve que lo entendimos bien. */}
      <p className="voz__texto" aria-live="polite">
        {error || transcripcion || ' '}
      </p>

      <div className="voz__controles">
        <button
          type="button"
          className="voz__btn"
          onClick={onTeclado}
          aria-label="Escribir en vez de hablar"
        >
          <Icon name="teclado" size={26} />
        </button>

        <button
          ref={micRef}
          type="button"
          className={`voz__btn voz__btn--mic ${escuchando ? 'voz__btn--activo' : ''}`}
          onClick={onMic}
          aria-pressed={escuchando}
          aria-label={escuchando ? 'Dejar de escuchar' : 'Empezar a escuchar'}
        >
          <Icon name="micro" size={34} />
        </button>

        <button
          type="button"
          className="voz__btn"
          onClick={onCerrar}
          aria-label="Cerrar modo voz"
        >
          <Icon name="cerrar" size={26} />
        </button>
      </div>
    </div>,
    document.body,
  );
}
