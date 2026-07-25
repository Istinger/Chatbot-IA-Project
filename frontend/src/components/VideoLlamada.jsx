import { Suspense, lazy, useEffect, useRef, useState } from 'react';
import { useCamara } from '../lib/camara';
import Icon from './Icon';

// three.js pesa: solo se descarga si el usuario entra en la modalidad video.
const VideoLlamada3D = lazy(() => import('./VideoLlamada3D'));

const ENTREVISTADOR = { nombre: 'Ana Morales', rol: 'Recursos Humanos' };

const reloj = (s) =>
  `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

/** Iniciales para el recuadro cuando la camara esta apagada. */
function iniciales(nombre) {
  const p = String(nombre || 'Tu').trim().split(/\s+/);
  return ((p[0]?.[0] || 'T') + (p[1]?.[0] || '')).toUpperCase();
}

/**
 * Cromo de la videollamada simulada: escenario del entrevistador, tu recuadro
 * (PiP), subtitulos, reloj y controles.
 *
 * Es presentacional, como VozOverlay: no sabe nada de la entrevista, solo pinta el
 * estado que recibe y avisa por callbacks. La logica (preguntas, dictado, feedback)
 * vive en screens/Entrevista.jsx.
 *
 * NO SE GRABA NADA: la camara solo se enchufa a un <video> local (ver lib/camara.js).
 */
export default function VideoLlamada({
  nombreUsuario,
  hablando,
  escuchando,
  pregunta,
  pulso,
  transcripcion,
  error,
  puedeDictar,
  respuestaTexto,
  onCambiarTexto,
  onEnviarTexto,
  onMic,
  onColgar,
}) {
  const { videoRef, activa: camaraActiva, error: errorCamara, encender, apagar, alternar } = useCamara();
  const [segundos, setSegundos] = useState(0);
  const [subtitulos, setSubtitulos] = useState(true);
  const [modo3d, setModo3d] = useState('cargando'); // cargando | listo | error
  const colgarRef = useRef(null);

  // Se intenta encender la camara al entrar (es una videollamada). Si el usuario
  // dice no, la llamada sigue sin video: no es un requisito.
  useEffect(() => {
    encender();
    return () => apagar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const id = setInterval(() => setSegundos((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    colgarRef.current?.focus();
  }, []);

  const estado = hablando ? 'Hablando…' : escuchando ? 'Te escucha' : 'En la llamada';

  return (
    <div className="vc" role="group" aria-label="Entrevista en video simulada">
      {/* Escenario: el entrevistador 3D. Si no hay WebGL o falla el modelo, queda el
          fondo de sala con su nombre y el indicador: la llamada nunca se rompe. */}
      <div className={`vc__lienzo ${hablando ? 'vc__lienzo--habla' : ''}`}>
        <Suspense fallback={<span className="vc__conectando">Conectando…</span>}>
          <VideoLlamada3D
            hablando={hablando}
            pulso={pulso}
            onListo={() => setModo3d('listo')}
            onFallo={() => setModo3d('error')}
          />
        </Suspense>

        {modo3d === 'error' && (
          <div className="vc__sinvideo" aria-hidden="true">
            <span className="vc__sinvideo-ini">AM</span>
          </div>
        )}

        <span className="vc__badge">
          <Icon name="aviso" size={13} /> Simulacion · no se graba nada
        </span>

        <span className="vc__reloj">
          <span className="vc__punto" /> {reloj(segundos)}
        </span>

        <div className="vc__quien">
          <strong>{ENTREVISTADOR.nombre}</strong>
          <span className={`vc__estado ${hablando ? 'is-habla' : ''}`}>
            {hablando && (
              <span className="vc__ondas" aria-hidden="true">
                <i /><i /><i />
              </span>
            )}
            {ENTREVISTADOR.rol} · {estado}
          </span>
        </div>

        {/* Tu recuadro. Espejado como en cualquier videollamada: uno se espera
            verse como en un espejo. */}
        <div className="vc__pip">
          <video
            ref={videoRef}
            className="vc__pipvideo"
            muted
            playsInline
            autoPlay
            style={{ display: camaraActiva ? 'block' : 'none' }}
          />
          {!camaraActiva && (
            <span className="vc__pipini" aria-hidden="true">{iniciales(nombreUsuario)}</span>
          )}
          <span className="vc__pipnom">
            {nombreUsuario || 'Tu'}
            {escuchando && <em className="vc__pipmic"><Icon name="micro" size={11} /></em>}
          </span>
        </div>

        {/* Subtitulos: la pregunta escrita. Ayudan si el audio no se oye bien y
            hacen la practica accesible. */}
        {subtitulos && (pregunta || transcripcion) && (
          <div className="vc__sub" aria-live="polite">
            {pregunta && <p className="vc__sub-preg">{pregunta}</p>}
            {transcripcion && <p className="vc__sub-tu">{transcripcion}</p>}
          </div>
        )}
      </div>

      {(error || errorCamara) && (
        <p className="alerta vc__error" role="alert">
          <Icon name="aviso" size={16} /> {error || errorCamara}
        </p>
      )}

      {/* Respaldo escrito: si el navegador no dicta (Firefox) o lo bloquea (Brave),
          se responde por texto sin salir de la videollamada. */}
      {!puedeDictar && (
        <form
          className="vc__texto"
          onSubmit={(e) => {
            e.preventDefault();
            onEnviarTexto?.();
          }}
        >
          <label htmlFor="vc-resp" className="sr-only">Tu respuesta</label>
          <input
            id="vc-resp"
            value={respuestaTexto}
            onChange={(e) => onCambiarTexto?.(e.target.value)}
            placeholder="Escribe tu respuesta…"
            autoComplete="off"
          />
          <button type="submit" className="btn btn--primario" disabled={!respuestaTexto?.trim()}>
            Responder
          </button>
        </form>
      )}

      <div className="vc__barra">
        {puedeDictar && (
          <button
            type="button"
            className={`vc__btn ${escuchando ? 'vc__btn--on' : ''}`}
            onClick={onMic}
            aria-pressed={escuchando}
            aria-label={escuchando ? 'Terminar mi respuesta' : 'Hablar'}
            title={escuchando ? 'Terminar mi respuesta' : 'Hablar'}
          >
            <Icon name="micro" size={22} />
          </button>
        )}

        <button
          type="button"
          className={`vc__btn ${camaraActiva ? 'vc__btn--on' : ''}`}
          onClick={alternar}
          aria-pressed={camaraActiva}
          aria-label={camaraActiva ? 'Apagar mi camara' : 'Encender mi camara'}
          title={camaraActiva ? 'Apagar camara' : 'Encender camara'}
        >
          <Icon name="asistente" size={22} />
        </button>

        <button
          type="button"
          className={`vc__btn ${subtitulos ? 'vc__btn--on' : ''}`}
          onClick={() => setSubtitulos((s) => !s)}
          aria-pressed={subtitulos}
          aria-label={subtitulos ? 'Ocultar subtitulos' : 'Mostrar subtitulos'}
          title="Subtitulos"
        >
          <Icon name="teclado" size={22} />
        </button>

        <button
          ref={colgarRef}
          type="button"
          className="vc__btn vc__btn--colgar"
          onClick={onColgar}
          aria-label="Terminar la entrevista"
          title="Colgar y ver recomendaciones"
        >
          <Icon name="cerrar" size={22} />
        </button>
      </div>
    </div>
  );
}
