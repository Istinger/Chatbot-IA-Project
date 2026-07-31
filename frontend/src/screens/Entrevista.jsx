import { useEffect, useMemo, useRef, useState } from 'react';
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
import { registrarAnimacion } from '../lib/animacion';

import {
  CONSEJOS_BASE,
  alternarGuardadaEntrevista,
  anotarEntrevista,
  borrarEntrevista,
  fechaCorta,
  leerEntrevistas,
  puntosRecurrentes,
} from '../lib/entrevistas';

const NIVELES = ['Junior', 'Semi Senior', 'Senior'];

/**
 * Silencio que cierra tu turno en la videollamada (ms). Con menos, una pausa para
 * pensar cortaba la respuesta a medias; con mucho mas, la entrevista se siente
 * lenta. Es el mismo margen que deja un entrevistador antes de seguir.
 */
const PAUSA_FIN = 2800;
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
  // Historial de entrevistas terminadas (localStorage: el backend no las guarda).
  const [entrevistas, setEntrevistas] = useState(() => leerEntrevistas());
  const [plan, setPlan] = useState(null); // consejo de la IA en la pantalla inicial
  const [planCargando, setPlanCargando] = useState(false);
  const [vistaInicio, setVistaInicio] = useState('entrevista'); // entrevista | historial
  const [sesionMeta, setSesionMeta] = useState(null);
  const [ultimaRepregunta, setUltimaRepregunta] = useState(null);

  const dictadoRef = useRef(null);
  // Al parar el dictado todavia llega un ultimo `onresult`. Si ya se envio (o el
  // usuario se puso a teclear), ese texto tardio NO debe repoblar la respuesta:
  // parecia que enviar "no hacia nada" porque el campo se volvia a llenar solo.
  const ignorarDictado = useRef(false);
  // Cuenta atras de silencio en video: el turno termina cuando llevas PAUSA_FIN
  // sin decir nada, no al primer respiro (asi puedes pensar a media respuesta).
  const silencioRef = useRef(null);
  const braveRef = useRef(false);
  const finRef = useRef(null);

  useEffect(() => {
    if (vozSoportada) esBrave().then((b) => (braveRef.current = b));
    return () => {
      // Al salir de la pantalla: corta la lectura, el micro y la cuenta atras.
      callarVoz();
      ignorarDictado.current = true;
      clearTimeout(silencioRef.current);
      dictadoRef.current?.stop();
    };
  }, []);

  // El hilo siempre muestra lo ultimo, como cualquier chat.
  useEffect(() => {
    finRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [hilo, pensando, feedback]);

  const actual = cola[0] || null;
  const recurrentesAnimacion = useMemo(
    () => puntosRecurrentes(entrevistas),
    [entrevistas],
  );

  useEffect(() => {
    const temporizador = window.setTimeout(() => {
      const tipo =
        fase === 'setup'
          ? vistaInicio === 'historial'
            ? 'entrevista_historial'
            : 'entrevista_configurada'
          : feedback || terminada
            ? 'entrevista_feedback'
            : 'entrevista_practica';

      registrarAnimacion(tipo, {
        fase,
        vistaInicio,
        cfg,
        area: sesionMeta?.area || null,
        sessionId,
        totalPreguntas: baseTotal,
        pendientes: cola.length,
        respondidas: historial.length,
        preguntaActual: actual?.texto || null,
        esRepregunta: Boolean(actual?.rep),
        respuestaActual: respuesta.trim(),
        pensando,
        escuchando,
        ultimaRepregunta,
        transcript: historial.slice(-4),
        feedback,
        entrevistas: entrevistas.slice(0, 6).map((item) => ({
          puesto: item.puesto,
          nivel: item.nivel,
          modalidad: item.modalidad,
          guardada: Boolean(item.guardada),
          mejorar: item.feedback?.mejorar || [],
        })),
        recurrentes: recurrentesAnimacion,
        planEstado: planCargando ? 'generando' : plan ? 'listo' : 'disponible',
      });
    }, 180);

    return () => window.clearTimeout(temporizador);
  }, [
    actual,
    baseTotal,
    cfg,
    cola.length,
    entrevistas,
    escuchando,
    fase,
    feedback,
    historial,
    pensando,
    plan,
    planCargando,
    recurrentesAnimacion,
    respuesta,
    sesionMeta,
    sessionId,
    terminada,
    ultimaRepregunta,
    vistaInicio,
  ]);

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
      setSesionMeta({ area: r.area, tipo: r.tipo, nivel: r.nivel });
      setUltimaRepregunta(null);
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
      // Queda anotada en el historial (con su feedback: de ahi salen luego los
      // puntos que mas se te repiten).
      setEntrevistas(
        anotarEntrevista({
          puesto: cfg.puesto,
          nivel: cfg.nivel,
          tipo: cfg.tipo,
          modalidad: cfg.modalidad,
          nRespuestas: hist.filter((h) => h.respuesta?.trim()).length,
          feedback: { resumen: r.resumen, mejorar: r.mejorar, fortalezas: r.fortalezas },
        }),
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setPensando(false);
    }
  };

  const responder = async (terminar = false) => {
    if (!actual || pensando) return;
    // La transcripcion que llegue tarde ya no cuenta: esta respuesta se envia.
    ignorarDictado.current = true;
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
        if (f?.texto) {
          setUltimaRepregunta({ estado: 'generada', texto: f.texto });
          resto = [{ texto: f.texto, rep: true }, ...resto];
        } else {
          setUltimaRepregunta({ estado: f?.motivo || 'omitida', texto: null });
        }
      } catch {
        setUltimaRepregunta({ estado: 'error', texto: null });
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

  const limpiarPausaFin = () => {
    clearTimeout(silencioRef.current);
    silencioRef.current = null;
  };

  /**
   * Reinicia la cuenta atras de fin de turno. Se llama en cada trozo de voz: el
   * turno solo termina tras PAUSA_FIN de silencio, no en cada respiro.
   */
  const armarPausaFin = () => {
    limpiarPausaFin();
    silencioRef.current = setTimeout(() => dictadoRef.current?.stop(), PAUSA_FIN);
  };

  /** Abre el micro. Se usa a mano (boton) y solo (tras hablar el entrevistador). */
  const abrirDictado = () => {
    setError(null);
    callarVoz(); // no dictar encima de la lectura
    ignorarDictado.current = false;
    const esVideo = cfg.modalidad === 'video';
    const d = crearDictado({
      // En video el dictado NO se corta solo: lo cierra la pausa de abajo.
      continuo: esVideo,
      onTexto: (t) => {
        if (ignorarDictado.current) return;
        setRespuesta(t);
        // Cada vez que dices algo se reinicia la cuenta atras del turno.
        if (esVideo) armarPausaFin();
      },
      onFin: () => {
        limpiarPausaFin();
        setEscuchando(false);
        // En video, cerrar el micro ES terminar tu turno: la respuesta se envia
        // sola (sin pulsar nada, como en una entrevista real). Antes se quedaba
        // parada aqui y no pasaba nada.
        if (esVideo && !ignorarDictado.current) setEnviarTrasDictado(true);
      },
      onError: (codigo) => {
        limpiarPausaFin();
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

  const detenerDictado = () => {
    limpiarPausaFin();
    dictadoRef.current?.stop();
  };

  const reiniciar = () => {
    ignorarDictado.current = true; // parada a proposito: no autoenvia al salir
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
    setSesionMeta(null);
    setUltimaRepregunta(null);
  };

  // --- SETUP -----------------------------------------------------------------
  if (fase === 'setup') {
    const recurrentes = puntosRecurrentes(entrevistas);

    // El plan se pide y se muestra AQUI, no en el panel del Asistente: /entrevista
    // lo oculta en escritorio, asi que la respuesta no se veria.
    const pedirPlan = async () => {
      setPlanCargando(true);
      setError(null);
      try {
        const r = await api.chat(
          recurrentes.length
            ? `He hecho ${entrevistas.length} entrevistas simuladas para "${cfg.puesto || 'un puesto tech'}" (${cfg.nivel}). Lo que mas se me repite para mejorar es: ${recurrentes
                .map((p) => p.texto)
                .join('; ')}. Dame un plan corto y concreto para corregirlo antes de mi proxima entrevista.`
            : `Voy a practicar una entrevista simulada para "${cfg.puesto || 'un puesto tech'}" (${cfg.nivel}). Dame 3 consejos concretos para responder mejor y un ejercicio para practicarlos.`,
        );
        setPlan(r.respuesta);
      } catch (err) {
        setError(err.message);
      } finally {
        setPlanCargando(false);
      }
    };

    return (
      <div className={`entrev-inicio entrev-inicio--${vistaInicio}`}>
      <div className="entrev-chat entrev-chat--setup">
        <header className="entrev-chat__cab entrev-inicio__cab">
          <div>
            <h1>Entrevista simulada</h1>
            <p className="saludo__sub">
              Practica con preguntas de tu area. Al final recibes recomendaciones.
            </p>
          </div>
          <button
            type="button"
            className="entrev-miga-btn"
            onClick={() => setVistaInicio('historial')}
          >
            <Icon name="reloj" size={16} />
            Historial y mejoras
          </button>
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

      {/* Panel lateral: lo que ya practicaste y en que fallas mas. */}
      <aside className="entrev-lat">
        <h1 className="entrev-lat__titulo">Historial y mejoras</h1>
        <nav className="entrev-migas" aria-label="Migas de pan">
          <button type="button" onClick={() => setVistaInicio('entrevista')}>
            Entrevista
          </button>
        </nav>

        <section className="entrev-lat__caja">
          <header className="entrev-lat__cab">
            <span className="port-ico port-ico--sm"><Icon name="reloj" size={16} /></span>
            <div>
              <strong>Entrevistas anteriores</strong>
              <span>
                {entrevistas.length
                  ? `${entrevistas.length} practicada${entrevistas.length > 1 ? 's' : ''}`
                  : 'Todavia no has practicado'}
              </span>
            </div>
          </header>

          {entrevistas.length ? (
            <ul className="entrev-lat__lista">
              {entrevistas.map((e) => (
                <li key={e.id} className={`entrev-lat__item ${e.guardada ? 'is-guardada' : ''}`}>
                  <div className="entrev-lat__txt">
                    <strong>{e.puesto || 'Puesto general'}</strong>
                    <span>
                      {e.nivel} · {e.modalidad === 'video' ? 'Videollamada' : 'Chat'} ·{' '}
                      {fechaCorta(e.fecha)}
                    </span>
                    {e.feedback?.resumen && <p>{e.feedback.resumen}</p>}
                  </div>
                  <div className="entrev-lat__acc">
                    <button
                      type="button"
                      className="iconbtn"
                      onClick={() => setEntrevistas(alternarGuardadaEntrevista(e.id))}
                      aria-pressed={Boolean(e.guardada)}
                      aria-label={e.guardada ? 'Quitar de guardadas' : 'Guardar esta entrevista'}
                      title={e.guardada ? 'Guardada' : 'Guardar'}
                    >
                      <Icon name="marcador" size={16} />
                    </button>
                    <button
                      type="button"
                      className="iconbtn"
                      onClick={() => setEntrevistas(borrarEntrevista(e.id))}
                      aria-label="Borrar del historial"
                      title="Borrar"
                    >
                      <Icon name="cerrar" size={16} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="entrev-lat__vacio">
              Cuando termines una entrevista aparecera aqui, con su resumen. Puedes
              guardar las que quieras conservar.
            </p>
          )}
        </section>

        <section className="entrev-lat__caja">
          <header className="entrev-lat__cab">
            <span className="port-ico port-ico--sm"><Icon name="crecer" size={16} /></span>
            <div>
              <strong>Como mejorar</strong>
              <span>
                {recurrentes.length ? 'Lo que mas se te repite' : 'Consejos para empezar'}
              </span>
            </div>
          </header>

          <ul className="entrev-lat__consejos">
            {recurrentes.length
              ? recurrentes.map((p) => (
                  <li key={p.texto}>
                    {p.texto}
                    {p.n > 1 && <em className="entrev-lat__veces">{p.n} entrevistas</em>}
                  </li>
                ))
              : CONSEJOS_BASE.map((c) => <li key={c}>{c}</li>)}
          </ul>

          <button
            type="button"
            className="perfil__iabtn"
            onClick={pedirPlan}
            disabled={planCargando}
          >
            <Icon name="asistente" size={16} />
            {planCargando ? 'Pensando…' : 'Pedir un plan a la IA'}
          </button>

          {plan && (
            <div className="entrev-lat__plan">
              <RichText texto={plan} />
            </div>
          )}
        </section>
      </aside>
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
              onChange={(e) => {
                // El micro se abre solo en video y el dictado escribe en este mismo
                // estado: si el usuario teclea, manda el teclado y se corta el
                // dictado (si no, la transcripcion le pisa o le vacia lo escrito).
                if (escuchando) {
                  ignorarDictado.current = true; // parada a proposito: no autoenvia
                  detenerDictado();
                }
                setRespuesta(e.target.value);
              }}
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
