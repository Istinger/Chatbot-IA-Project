import { useEffect, useRef, useState } from 'react';
import { api } from '../lib/api';
import { useVista } from '../lib/vista';
import {
  callarVoz,
  crearDictado,
  esBrave,
  leerEnVozAlta,
  mensajeDeError,
  soportado as vozSoportada,
  ttsSoportado,
} from '../lib/voz';
import Icon from './Icon';
import RichText from './RichText';

const NIVELES = ['Junior', 'Semi Senior', 'Senior'];
const TIPOS = [
  { id: 'mixta', txt: 'Mixta' },
  { id: 'tecnica', txt: 'Tecnica' },
  { id: 'rrhh', txt: 'RRHH' },
];

/**
 * Subseccion "Entrevista" del panel del Asistente.
 *
 * Flujo hibrido: las preguntas salen del banco del backend (gratis) y la IA solo
 * se usa, racionada, para una repregunta puntual y para el feedback final.
 *
 * Modalidades: TEXTO (siempre), AUDIO (responder por voz + leer la pregunta con
 * el sintetizador del navegador) y RECOMENDACIONES al terminar. El VIDEO es una
 * tarjeta "proximamente" (trabajo futuro).
 */
export default function EntrevistaPanel() {
  const { ofertaActiva } = useVista();

  const [fase, setFase] = useState('setup'); // setup | sesion | feedback
  const [cfg, setCfg] = useState({
    puesto: ofertaActiva?.title || '',
    nivel: 'Junior',
    tipo: 'mixta',
    leerVoz: ttsSoportado,
  });

  const [sessionId, setSessionId] = useState(null);
  const [cola, setCola] = useState([]); // [{ texto, rep }]
  const [historial, setHistorial] = useState([]); // [{ pregunta, respuesta, rep }]
  const [baseTotal, setBaseTotal] = useState(0);
  const [respuesta, setRespuesta] = useState('');
  const [pensando, setPensando] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [error, setError] = useState(null);
  const [escuchando, setEscuchando] = useState(false);

  const dictadoRef = useRef(null);
  const braveRef = useRef(false);
  const finRef = useRef(null);

  useEffect(() => {
    if (vozSoportada) esBrave().then((b) => (braveRef.current = b));
    return () => callarVoz(); // al desmontar, corta cualquier lectura
  }, []);

  const actual = cola[0] || null;

  // Al cambiar de pregunta: leerla en voz alta si esta activado, y hacer scroll.
  useEffect(() => {
    if (fase === 'sesion' && actual && cfg.leerVoz) leerEnVozAlta(actual.texto);
    finRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actual?.texto, fase]);

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
      setRespuesta('');
      setFase('sesion');
    } catch (err) {
      setError(err.message);
    } finally {
      setPensando(false);
    }
  };

  const pedirFeedback = async (hist) => {
    // Se muestra la pantalla de feedback YA (con su estado "Preparando…"), sin
    // esperar al LLM: el usuario ve que termino y la respuesta llega en segundos.
    setFase('feedback');
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
    detenerVoz();
    const par = { pregunta: actual.texto, respuesta: respuesta.trim(), rep: actual.rep };
    const hist = [...historial, par];
    setHistorial(hist);
    setRespuesta('');

    if (terminar) {
      setCola([]);
      await pedirFeedback(hist);
      return;
    }

    setPensando(true);
    let resto = cola.slice(1);

    // Repregunta racionada: solo tras respuestas base sustantivas.
    if (!actual.rep && par.respuesta.length >= 40) {
      try {
        const f = await api.interviewFollowup({
          sessionId,
          pregunta: actual.texto,
          respuesta: par.respuesta,
        });
        if (f?.texto) resto = [{ texto: f.texto, rep: true }, ...resto];
      } catch {
        /* la repregunta es opcional: si falla, seguimos con el banco */
      }
    }

    setPensando(false);

    if (resto.length) {
      setCola(resto);
    } else {
      setCola([]);
      await pedirFeedback(hist);
    }
  };

  const alternarVoz = () => {
    if (escuchando) {
      dictadoRef.current?.stop();
      return;
    }
    setError(null);
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

  const detenerVoz = () => {
    dictadoRef.current?.stop();
    callarVoz();
  };

  const reiniciar = () => {
    detenerVoz();
    setFase('setup');
    setFeedback(null);
    setHistorial([]);
    setCola([]);
    setError(null);
  };

  // --- SETUP -----------------------------------------------------------------
  if (fase === 'setup') {
    return (
      <div className="entrev entrev-setup">
        <p className="entrev__intro">
          Practica una entrevista simulada. La IA te hace preguntas de tu area y al final
          te da recomendaciones.
        </p>

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

        {/* Video: trabajo futuro, se muestra deshabilitado. */}
        <div className="entrev-video--soon" aria-disabled="true">
          <Icon name="asistente" size={18} />
          <div>
            <strong>Entrevista en video</strong>
            <span>Proximamente</span>
          </div>
        </div>

        {error && (
          <p className="alerta" role="alert"><Icon name="aviso" size={16} /> {error}</p>
        )}

        <button type="button" className="btn btn--primario btn--bloque" onClick={empezar} disabled={pensando}>
          {pensando ? 'Preparando…' : 'Empezar entrevista'}
        </button>
      </div>
    );
  }

  // --- FEEDBACK --------------------------------------------------------------
  if (fase === 'feedback') {
    return (
      <div className="entrev entrev-feedback">
        {pensando || !feedback ? (
          <p className="entrev__intro">Preparando tus recomendaciones…</p>
        ) : (
          <>
            <h3 className="entrev__tit"><Icon name="ok" size={18} /> Entrevista terminada</h3>
            {feedback.resumen && <p className="entrev__resumen">{feedback.resumen}</p>}

            {feedback.fortalezas?.length > 0 && (
              <section className="entrev__bloque">
                <h4>Lo que hiciste bien</h4>
                <ul>{feedback.fortalezas.map((f, i) => <li key={i}>{f}</li>)}</ul>
              </section>
            )}

            {feedback.mejorar?.length > 0 && (
              <section className="entrev__bloque">
                <h4>Para mejorar</h4>
                <ul>{feedback.mejorar.map((f, i) => <li key={i}>{f}</li>)}</ul>
              </section>
            )}

            {feedback.respuestaModelo?.respuesta && (
              <section className="entrev__bloque">
                <h4>Respuesta modelo</h4>
                <p className="entrev__modelo-preg">{feedback.respuestaModelo.pregunta}</p>
                <RichText texto={feedback.respuestaModelo.respuesta} />
              </section>
            )}
          </>
        )}

        <button type="button" className="btn btn--glass btn--bloque" onClick={reiniciar}>
          <Icon name="refrescar" size={16} /> Practicar otra vez
        </button>
      </div>
    );
  }

  // --- SESION ----------------------------------------------------------------
  const baseHechas = historial.filter((h) => !h.rep).length;
  const nActual = Math.min(baseHechas + (actual?.rep ? 0 : 1), baseTotal);

  return (
    <div className="entrev entrev-sesion">
      <div className="entrev__prog">
        {actual?.rep ? (
          <span className="entrev__rep"><Icon name="chispa" size={13} /> Repregunta</span>
        ) : (
          <span>Pregunta {nActual} de {baseTotal}</span>
        )}
        <button type="button" className="entrev__salir" onClick={reiniciar}>Salir</button>
      </div>

      <div className="entrev__hilo">
        {actual && (
          <article className="burbuja burbuja--assistant">
            <p>{actual.texto}</p>
            {ttsSoportado && (
              <button type="button" className="entrev__leer" onClick={() => leerEnVozAlta(actual.texto)} aria-label="Leer en voz alta">
                <Icon name="micro" size={14} /> Escuchar
              </button>
            )}
          </article>
        )}
        <div ref={finRef} />
      </div>

      {error && (
        <p className="alerta" role="alert"><Icon name="aviso" size={16} /> {error}</p>
      )}

      <div className="entrev__respzona">
        <textarea
          className="entrev__resp"
          rows={3}
          value={respuesta}
          onChange={(e) => setRespuesta(e.target.value)}
          placeholder={escuchando ? 'Escuchando…' : 'Escribe o dicta tu respuesta…'}
          disabled={pensando}
        />
        <div className="entrev__acciones">
          {vozSoportada && (
            <button
              type="button"
              className={`iconbtn ${escuchando ? 'iconbtn--activo' : ''}`}
              onClick={alternarVoz}
              aria-label={escuchando ? 'Detener dictado' : 'Responder por voz'}
            >
              <Icon name="micro" />
            </button>
          )}
          <button
            type="button"
            className="btn btn--glass"
            onClick={() => responder(true)}
            disabled={pensando}
          >
            Terminar
          </button>
          <button
            type="button"
            className="btn btn--primario"
            onClick={() => responder(false)}
            disabled={pensando || !respuesta.trim()}
          >
            {pensando ? '…' : 'Responder'}
          </button>
        </div>
      </div>
    </div>
  );
}
