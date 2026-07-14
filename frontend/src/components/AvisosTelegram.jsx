import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import Icon from './Icon';

/**
 * Vinculacion con el bot de Telegram.
 *
 * El usuario NO tiene que copiar ningun codigo: el enlace t.me/<bot>?start=<codigo>
 * lo lleva ya dentro. Solo pulsa "Iniciar" en Telegram y el worker hace el resto.
 * Se muestra el codigo igualmente por si abre el enlace en otro dispositivo.
 *
 * Tras abrir el enlace no hay forma de saber desde el navegador si el usuario
 * llego a pulsar Iniciar, asi que se sondea el estado unos segundos. Es feo pero
 * honesto: la alternativa (dar por vinculado sin comprobarlo) mentiria.
 */
const UMBRALES = [
  { valor: 0.55, texto: 'Muchos avisos', ayuda: 'Cualquier oferta razonable' },
  { valor: 0.62, texto: 'Equilibrado', ayuda: 'Recomendado' },
  { valor: 0.75, texto: 'Solo lo excelente', ayuda: 'Muy pocos avisos' },
];

export default function AvisosTelegram() {
  const [estado, setEstado] = useState(null);
  const [vinculacion, setVinculacion] = useState(null); // { codigo, enlace, bot }
  const [error, setError] = useState(null);
  const [esperando, setEsperando] = useState(false);

  const cargar = () => api.estadoAvisos().then(setEstado).catch((e) => setError(e.message));

  useEffect(() => {
    cargar();
  }, []);

  // Mientras hay una vinculacion abierta, se sondea: el "Iniciar" ocurre en
  // Telegram, fuera del navegador, y no hay evento que nos avise.
  useEffect(() => {
    if (!vinculacion || estado?.vinculado) return undefined;

    setEsperando(true);
    const t = setInterval(async () => {
      const e = await api.estadoAvisos().catch(() => null);
      if (e?.vinculado) {
        setEstado(e);
        setVinculacion(null);
        setEsperando(false);
        clearInterval(t);
      }
    }, 3000);

    // A los 2 minutos se deja de sondear: el codigo dura 15, pero mantener un
    // temporizador vivo indefinidamente contra la API no tiene sentido.
    const fin = setTimeout(() => {
      clearInterval(t);
      setEsperando(false);
    }, 120000);

    return () => {
      clearInterval(t);
      clearTimeout(fin);
    };
  }, [vinculacion, estado?.vinculado]);

  const vincular = async () => {
    setError(null);
    try {
      const v = await api.vincularTelegram();
      setVinculacion(v);
      window.open(v.enlace, '_blank', 'noopener,noreferrer');
    } catch (e) {
      setError(e.message);
    }
  };

  const desvincular = async () => {
    try {
      await api.desvincularTelegram();
      await cargar();
    } catch (e) {
      setError(e.message);
    }
  };

  const cambiarUmbral = async (valor) => {
    setEstado((p) => ({ ...p, umbral: valor })); // optimista: el control responde ya
    try {
      await api.umbralAvisos(valor);
    } catch (e) {
      setError(e.message);
      await cargar();
    }
  };

  if (!estado) return null;

  if (!estado.disponible) {
    return (
      <section className="panel">
        <h2 className="carrusel__title">Avisos por Telegram</h2>
        <p className="onb__sub">No estan configurados en este servidor.</p>
      </section>
    );
  }

  return (
    <section className="panel">
      <h2 className="carrusel__title">Avisos por Telegram</h2>

      {!estado.vinculado && (
        <>
          <p className="onb__sub">
            Te avisamos por Telegram cuando aparezca una oferta que encaje contigo. Sin
            vincular, no te escribimos nunca.
          </p>

          <button type="button" className="btn btn--glass" onClick={vincular}>
            <Icon name="telegram" size={18} />
            Vincular Telegram
          </button>

          {vinculacion && (
            <div className="tg">
              <p className="tg__paso">
                Se abrio Telegram. Pulsa <strong>Iniciar</strong> y vuelve aqui.
              </p>
              <p className="tg__paso">
                Si no se abrio:{' '}
                <a href={vinculacion.enlace} target="_blank" rel="noopener noreferrer">
                  abrir @{vinculacion.bot}
                </a>{' '}
                y enviar <code className="tg__codigo">/start {vinculacion.codigo}</code>
              </p>
              {esperando && (
                <p className="tg__esperando" role="status">
                  Esperando la confirmacion…
                </p>
              )}
            </div>
          )}
        </>
      )}

      {estado.vinculado && (
        <>
          <p className="exito" role="status">
            <Icon name="ok" size={16} />
            Telegram vinculado. Te hemos enviado {estado.avisosEnviados}{' '}
            {estado.avisosEnviados === 1 ? 'oferta' : 'ofertas'}.
          </p>

          <h3 className="tg__sub">Cuando avisarte</h3>
          <div className="tg__umbrales" role="radiogroup" aria-label="Umbral de avisos">
            {UMBRALES.map((u) => (
              <button
                key={u.valor}
                type="button"
                role="radio"
                aria-checked={Math.abs(estado.umbral - u.valor) < 0.001}
                className={`chip chip--btn ${
                  Math.abs(estado.umbral - u.valor) < 0.001 ? 'chip--on' : ''
                }`}
                onClick={() => cambiarUmbral(u.valor)}
              >
                {u.texto}
                <em className="tg__ayuda">{u.ayuda}</em>
              </button>
            ))}
          </div>

          <button type="button" className="btn btn--texto" onClick={desvincular}>
            Dejar de recibir avisos
          </button>
        </>
      )}

      {error && (
        <p className="alerta" role="status">
          <Icon name="aviso" size={16} />
          {error}
        </p>
      )}
    </section>
  );
}
