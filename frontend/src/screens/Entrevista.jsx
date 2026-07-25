import { useEffect, useRef, useState } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { useVista } from '../lib/vista';
import { nombreDe } from '../lib/format';
import {
  callarVoz,
  crearDictado,
  esBrave,
  leerEnVozAlta,
  mensajeDeError,
  soportado as vozSoportada,
  ttsSoportado,
} from '../lib/voz';
import Icon from '../components/Icon';
import RichText from '../components/RichText';
import VideoLlamada from '../components/VideoLlamada';

const NIVELES = ['Junior', 'Semi Senior', 'Senior'];
const TIPOS = [
  { id: 'mixta', txt: 'Mixta' },
  { id: 'tecnica', txt: 'Tecnica' },
  { id: 'rrhh', txt: 'RRHH' },
];

/**
 * Entrevista simulada, a PANTALLA COMPLETA (como un chat comun).
 *
 * Vive en su propia ruta (/entrevista) y el Shell le cede la columna del
 * Asistente: tener dos chats lado a lado partia la atencion. Aqui la
 * conversacion es la pantalla.
 *
 * Flujo hibrido (respeta el presupuesto): las preguntas salen del banco del
 * backend (gratis) y la IA solo se usa, racionada, para una repregunta puntual y
 * para el feedback final.
 *
 * Modalidades: TEXTO (el hilo), AUDIO (dictado para responder + lectura de la
 * pregunta con el sintetizador del navegador) y RECOMENDACIONES al terminar. El
 * VIDEO es una tarjeta "proximamente" (trabajo futuro).
 */
export default function Entrevista() {
  const { ofertaActiva } = useVista();
  const { perfil } = useAuth();

  const [fase, setFase] = useState('setup'); // setup | chat | video
  const [cfg, setCfg] = useState({
    puesto: ofertaActiva?.title || '',
    nivel: 'Junior',
    tipo: 'mixta',
    leerVoz: ttsSoportado,
    modalidad: 'texto', // texto | video
  });

  const [sessionId, setSessionId] = useState(null);
  const [cola, setCola] = useState([]); // preguntas pendientes [{ texto, rep }]
  const [hilo, setHilo] = useState([]); // [{ role:'assistant'|'user', content, rep }]
  const [historial, setHistorial] = useState([]); // [{ pregunta, respuesta, rep }]
  const [baseTotal, setBaseTotal] = useState(0);
  const [respuesta, setRespuesta] = useState('');
  const [pensando, setPensando] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [terminada, setTerminada] = useState(false);
  const [error, setError] = useState(null);
  const [escuchando, setEscuchando] = useState(false);
  // Solo para el modo video: el avatar mueve la boca mientras `hablando`, y `pulso`
  // marca el acento de cada palabra que dicta el TTS.
  const [hablando, setHablando] = useState(false);
  const [pulso, setPulso] = useState(0);
  const [enviarTrasDictado, setEnviarTrasDictado] = useState(false);

  const dictadoRef = useRef(null);
  const braveRef = useRef(false);
  const finRef = useRef(null);

  useEffect(() => {
    if (vozSoportada) esBrave().then((b) => (braveRef.current = b));
    return () => callarVoz(); // al salir de la pantalla, corta la lectura
  }, []);

  // El hilo siempre muestra lo ultimo, como cualquier chat.
  useEffect(() => {
    finRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [hilo, pensando, feedback]);

  const actual = cola[0] || null;

  /**
   * Empuja la pregunta al hilo y la lee en voz alta si esta activado.
   *
   * En VIDEO la lectura es parte de la simulacion: mientras habla se anima la boca
   * del avatar (`hablando` + `pulso` por palabra) y, al terminar, se abre el micro
   * automaticamente — como en una entrevista real, donde no hay que pulsar nada
   * para contestar.
   */
  const mostrarPregunta = (p, video = cfg.modalidad === 'video') => {
    setHilo((h) => [...h, { role: 'assistant', content: p.texto, rep: p.rep }]);
    if (!cfg.leerVoz && !video) return;

    leerEnVozAlta(p.texto, {
      onInicio: () => setHablando(true),
      onPalabra: () => setPulso((n) => (n + 1) % 1000),
      onFin: () => {
        setHablando(false);
        // Turno del candidato: en video el micro se abre solo.
        if (video && vozSoportada) abrirDictado();
      },
    });
  };

  const empezar = async () => {
    setError(null);
    setPensando(true);
    try {
      const r = await api.interviewStart(cfg);
      setSessionId(r.sessionId);
      const preguntas = (r.preguntas || []).map((texto) => ({ texto, rep: false }));
      setCola(preguntas);
      setBaseTotal(preguntas.length);
      setHistorial([]);
      setFeedback(null);
      setTerminada(false);
      setRespuesta('');
      setHilo([]);
      const video = cfg.modalidad === 'video';
      setFase(video ? 'video' : 'chat');
      // `video` se pasa explicito: cfg ya esta fijado, pero mostrarPregunta se
      // llama aqui antes de que React re-renderice con la fase nueva.
      if (preguntas[0]) mostrarPregunta(preguntas[0], video);
    } catch (err) {
      setError(err.message);
    } finally {
      setPensando(false);
    }
  };

  const pedirFeedback = async (hist) => {
    setTerminada(true);
    setPensando(true);
    try {
      const r = await api.interviewFeedback({
        preguntas: hist.map((h) => h.pregunta),
        respuestas: hist.map((h) => h.respuesta),
      });
      setFeedback(r);
    } catch (err) {
      setError(err.message);
    } finally {
      setPensando(false);
    }
  };

  const responder = async (terminar = false) => {
    if (!actual || pensando) return;
    detenerDictado();
    callarVoz();
    setHablando(false);

    const texto = respuesta.trim();
    const par = { pregunta: actual.texto, respuesta: texto, rep: actual.rep };
    const hist = [...historial, par];
    setHistorial(hist);
    setRespuesta('');
    if (texto) setHilo((h) => [...h, { role: 'user', content: texto }]);

    if (terminar) {
      setCola([]);
      await pedirFeedback(hist);
      return;
    }

    setPensando(true);
    let resto = cola.slice(1);

    // Repregunta racionada: solo tras respuestas base sustantivas. Si el backend
    // dice que no (tope/cuota/fallo), seguimos con el banco: nunca se corta.
    if (!actual.rep && texto.length >= 40) {
      try {
        const f = await api.interviewFollowup({ sessionId, pregunta: actual.texto, respuesta: texto });
        if (f?.texto) resto = [{ texto: f.texto, rep: true }, ...resto];
      } catch {
        /* la repregunta es opcional */
      }
    }

    setPensando(false);

    if (resto.length) {
      setCola(resto);
      mostrarPregunta(resto[0]);
    } else {
      setCola([]);
      await pedirFeedback(hist);
    }
  };

  /** Abre el micro. Se usa a mano (boton) y solo (tras hablar el entrevistador). */
  const abrirDictado = () => {
    setError(null);
    callarVoz(); // no dictar encima de la lectura
    const d = crearDictado({
      onTexto: (t) => setRespuesta(t),
      onFin: () => setEscuchando(false),
      onError: (codigo) => {
        setEscuchando(false);
        const msg = mensajeDeError(codigo, { brave: braveRef.current });
        if (msg) setError(msg);
      },
    });
    if (!d) return;
    dictadoRef.current = d;
    setEscuchando(true);
    d.start();
  };

  const alternarDictado = () => {
    if (escuchando) {
      dictadoRef.current?.stop();
      return;
    }
    abrirDictado();
  };

  /**
   * Microfono en la videollamada: pulsar mientras hablas equivale a "ya termine mi
   * respuesta", asi que ademas de cerrar el micro la envia.
   *
   * El envio no se hace aqui sino en un efecto, porque la transcripcion final
   * llega en el ultimo evento del dictado: leer `respuesta` en este instante
   * cogeria el valor viejo del closure.
   */
  const micVideo = () => {
    if (escuchando) {
      setEnviarTrasDictado(true);
      dictadoRef.current?.stop();
      return;
    }
    abrirDictado();
  };

  useEffect(() => {
    if (!enviarTrasDictado || escuchando) return;
    setEnviarTrasDictado(false);
    if (respuesta.trim()) responder(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enviarTrasDictado, escuchando]);

  const detenerDictado = () => dictadoRef.current?.stop();

  const reiniciar = () => {
    detenerDictado();
    callarVoz();
    setHablando(false);
    setFase('setup');
    setFeedback(null);
    setTerminada(false);
    setHilo([]);
    setHistorial([]);
    setCola([]);
    setError(null);
    setRespuesta('');
  };

  // --- SETUP -----------------------------------------------------------------
  if (fase === 'setup') {
    return (
      <div className="entrev-chat entrev-chat--setup">
        <header className="entrev-chat__cab">
          <div>
            <h1>Entrevista simulada</h1>
            <p className="saludo__sub">
              Practica con preguntas de tu area. Al final recibes recomendaciones.
            </p>
          </div>
        </header>

        <div className="entrev entrev-setup">
          <label className="entrev__campo">
            <span>Puesto</span>
            <input
              value={cfg.puesto}
              onChange={(e) => setCfg({ ...cfg, puesto: e.target.value })}
              placeholder="ej. Desarrollador frontend junior"
            />
          </label>

          <div className="entrev__fila">
            <label className="entrev__campo">
              <span>Nivel</span>
              <select value={cfg.nivel} onChange={(e) => setCfg({ ...cfg, nivel: e.target.value })}>
                {NIVELES.map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </label>
            <label className="entrev__campo">
              <span>Tipo</span>
              <select value={cfg.tipo} onChange={(e) => setCfg({ ...cfg, tipo: e.target.value })}>
                {TIPOS.map((t) => (
                  <option key={t.id} value={t.id}>{t.txt}</option>
                ))}
              </select>
            </label>
          </div>

          {ttsSoportado && (
            <label className="entrev__toggle">
              <input
                type="checkbox"
                checked={cfg.leerVoz}
                onChange={(e) => setCfg({ ...cfg, leerVoz: e.target.checked })}
              />
              <span><Icon name="micro" size={14} /> Leer las preguntas en voz alta</span>
            </label>
          )}

          {/* Modalidad: chat de texto o videollamada simulada. */}
          <fieldset className="entrev__modos">
            <legend>Modalidad</legend>
            <label className={`entrev__modo ${cfg.modalidad === 'texto' ? 'is-on' : ''}`}>
              <input
                type="radio"
                name="modalidad"
                value="texto"
                checked={cfg.modalidad === 'texto'}
                onChange={() => setCfg({ ...cfg, modalidad: 'texto' })}
              />
              <Icon name="entrevista" size={20} />
              <span>
                <strong>Chat de texto</strong>
                <em>Escribe o dicta tus respuestas</em>
              </span>
            </label>

            <label className={`entrev__modo ${cfg.modalidad === 'video' ? 'is-on' : ''}`}>
              <input
                type="radio"
                name="modalidad"
                value="video"
                checked={cfg.modalidad === 'video'}
                onChange={() => setCfg({ ...cfg, modalidad: 'video' })}
              />
              <Icon name="asistente" size={20} />
              <span>
                <strong>Videollamada</strong>
                <em>Te habla en video y respondes hablando</em>
              </span>
            </label>
          </fieldset>

          {cfg.modalidad === 'video' && (
            <p className="entrev__aviso-video">
              <Icon name="aviso" size={14} /> Usaremos tu camara solo para que te veas
              mientras practicas: <strong>no se graba ni se sube nada</strong>.
            </p>
          )}

          {error && (
            <p className="alerta" role="alert"><Icon name="aviso" size={16} /> {error}</p>
          )}

          <button
            type="button"
            className="btn btn--primario btn--bloque"
            onClick={empezar}
            disabled={pensando}
          >
            {pensando ? 'Preparando…' : 'Empezar entrevista'}
          </button>
        </div>
      </div>
    );
  }

  // --- VIDEOLLAMADA ----------------------------------------------------------
  // Misma logica que el chat (preguntas, repregunta, feedback): solo cambia la
  // presentacion. Al colgar se muestran las recomendaciones.
  if (fase === 'video' && !terminada) {
    return (
      <div className="entrev-video">
        <VideoLlamada
          nombreUsuario={nombreDe(perfil?.email)}
          hablando={hablando}
          escuchando={escuchando}
          pregunta={actual?.texto}
          pulso={pulso}
          transcripcion={respuesta}
          error={error}
          puedeDictar={vozSoportada}
          respuestaTexto={respuesta}
          onCambiarTexto={setRespuesta}
          onEnviarTexto={() => responder(false)}
          onMic={micVideo}
          onColgar={() => responder(true)}
          // El texto se escribe en el chat lateral: aqui sobraria un segundo campo.
          ocultarTexto
        />

        {/* Chat de la llamada: la transcripcion en vivo y un campo para responder
            escribiendo. Ocupa la columna que quedaba vacia a la derecha. */}
        <aside className="entrev-vchat" aria-label="Chat de la entrevista">
          <header className="entrev-vchat__cab">
            <span className="port-ico port-ico--sm"><Icon name="teclado" size={16} /></span>
            <div>
              <strong>Chat de la entrevista</strong>
              <span>{cfg.puesto || 'Puesto general'} · {cfg.nivel}</span>
            </div>
          </header>

          <div className="entrev-vchat__hilo" aria-live="polite">
            {hilo.map((m, i) => (
              <article key={i} className={`burbuja burbuja--${m.role}`}>
                {m.rep && (
                  <span className="entrev__rep"><Icon name="chispa" size={13} /> Repregunta</span>
                )}
                <p>{m.content}</p>
              </article>
            ))}
            {pensando && (
              <div className="burbuja burbuja--assistant burbuja--pensando">
                <span /><span /><span />
              </div>
            )}
            <div ref={finRef} />
          </div>

          <form
            className="entrev-chat__barra"
            onSubmit={(e) => {
              e.preventDefault();
              responder(false);
            }}
          >
            <label htmlFor="resp-video" className="sr-only">Tu respuesta</label>
            <textarea
              id="resp-video"
              className="entrev-chat__input"
              rows={1}
              value={respuesta}
              onChange={(e) => setRespuesta(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  responder(false);
                }
              }}
              placeholder={escuchando ? 'Te escucho…' : 'Escribe tu respuesta…'}
              disabled={pensando}
            />
            <button
              type="submit"
              className="iconbtn iconbtn--enviar"
              disabled={pensando || !respuesta.trim()}
              aria-label="Enviar respuesta"
            >
              <Icon name="enviar" />
            </button>
          </form>
        </aside>
      </div>
    );
  }

  // --- CHAT ------------------------------------------------------------------
  const baseHechas = historial.filter((h) => !h.rep).length;
  const nActual = Math.min(baseHechas + (actual && !actual.rep ? 1 : 0), baseTotal);

  return (
    <div className="entrev-chat">
      <header className="entrev-chat__cab">
        <button type="button" className="iconbtn" onClick={reiniciar} aria-label="Volver">
          <Icon name="izquierda" size={20} />
        </button>
        <div className="entrev-chat__info">
          <h1>Entrevista simulada</h1>
          <p className="entrev-chat__meta">
            {cfg.puesto || 'Puesto general'} · {cfg.nivel} ·{' '}
            {TIPOS.find((t) => t.id === cfg.tipo)?.txt}
            {!terminada && baseTotal > 0 && ` · Pregunta ${Math.max(nActual, 1)} de ${baseTotal}`}
          </p>
        </div>
        {!terminada && (
          <button type="button" className="btn btn--glass" onClick={() => responder(true)} disabled={pensando}>
            Terminar
          </button>
        )}
      </header>

      <div className="entrev-chat__hilo" aria-live="polite">
        {hilo.map((m, i) => (
          <article key={i} className={`burbuja burbuja--${m.role}`}>
            {m.rep && (
              <span className="entrev__rep"><Icon name="chispa" size={13} /> Repregunta</span>
            )}
            <p>{m.content}</p>
            {m.role === 'assistant' && ttsSoportado && (
              <button
                type="button"
                className="entrev__leer"
                onClick={() => leerEnVozAlta(m.content)}
                aria-label="Leer en voz alta"
              >
                <Icon name="micro" size={14} /> Escuchar
              </button>
            )}
          </article>
        ))}

        {pensando && !terminada && (
          <div className="burbuja burbuja--assistant burbuja--pensando">
            <span /><span /><span />
          </div>
        )}

        {/* Recomendaciones: cierran el hilo, como el resumen de una conversacion. */}
        {terminada && (
          <section className="entrev-feedback">
            {pensando || !feedback ? (
              <p className="entrev__intro">Preparando tus recomendaciones…</p>
            ) : (
              <>
                <h3 className="entrev__tit"><Icon name="ok" size={18} /> Entrevista terminada</h3>
                {feedback.resumen && <p className="entrev__resumen">{feedback.resumen}</p>}

                {feedback.fortalezas?.length > 0 && (
                  <div className="entrev__bloque">
                    <h4>Lo que hiciste bien</h4>
                    <ul>{feedback.fortalezas.map((f, i) => <li key={i}>{f}</li>)}</ul>
                  </div>
                )}

                {feedback.mejorar?.length > 0 && (
                  <div className="entrev__bloque">
                    <h4>Para mejorar</h4>
                    <ul>{feedback.mejorar.map((f, i) => <li key={i}>{f}</li>)}</ul>
                  </div>
                )}

                {feedback.respuestaModelo?.respuesta && (
                  <div className="entrev__bloque">
                    <h4>Respuesta modelo</h4>
                    <p className="entrev__modelo-preg">{feedback.respuestaModelo.pregunta}</p>
                    <RichText texto={feedback.respuestaModelo.respuesta} />
                  </div>
                )}
              </>
            )}

            <button type="button" className="btn btn--glass" onClick={reiniciar}>
              <Icon name="refrescar" size={16} /> Practicar otra vez
            </button>
          </section>
        )}

        <div ref={finRef} />
      </div>

      {error && (
        <p className="alerta entrev-chat__error" role="alert">
          <Icon name="aviso" size={16} /> {error}
        </p>
      )}

      {/* Barra de escritura, como un chat comun. */}
      {!terminada && (
        <form
          className="entrev-chat__barra"
          onSubmit={(e) => {
            e.preventDefault();
            responder(false);
          }}
        >
          <label htmlFor="resp" className="sr-only">Tu respuesta</label>
          <textarea
            id="resp"
            className="entrev-chat__input"
            rows={1}
            value={respuesta}
            onChange={(e) => setRespuesta(e.target.value)}
            onKeyDown={(e) => {
              // Enter envia, Shift+Enter hace salto de linea (convencion de chat).
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                responder(false);
              }
            }}
            placeholder={escuchando ? 'Escuchando…' : 'Escribe tu respuesta…'}
            disabled={pensando}
          />
          {vozSoportada && (
            <button
              type="button"
              className={`iconbtn ${escuchando ? 'iconbtn--activo' : ''}`}
              onClick={alternarDictado}
              aria-label={escuchando ? 'Detener dictado' : 'Responder por voz'}
            >
              <Icon name="micro" />
            </button>
          )}
          <button
            type="submit"
            className="iconbtn iconbtn--enviar"
            disabled={pensando || !respuesta.trim()}
            aria-label="Enviar respuesta"
          >
            <Icon name="enviar" />
          </button>
        </form>
      )}
    </div>
  );
}
