import { useEffect, useRef, useState } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { nombreDe } from '../lib/format';
import { crearDictado, soportado as vozSoportada } from '../lib/voz';
import Icon from '../components/Icon';
import RichText from '../components/RichText';
import JobCard from '../components/JobCard';
import JobModal from '../components/JobModal';

const CLAVE_SESION = 'jobia_chat';

const SUGERENCIAS = [
  'Busco trabajo remoto de backend',
  'Simula una entrevista tecnica junior',
  'Que certificaciones me convienen?',
  'Como mejoro mi CV?',
];

/**
 * Asistente (DESIGN.md, "Chatbot IA").
 *
 * Dos modos, como pide el diseno:
 *   - ESCUCHA:   el orb ocupa el centro, "Hola Jossue / Estoy escuchando...".
 *   - ESCRITURA: el orb se mantiene arriba y aparece la barra inferior.
 *
 * Funciona sin sesion: un visitante puede preguntar mientras ojea la web. La
 * conversacion se guarda por sessionId, asi que sobrevive a un F5.
 */
export default function Chat() {
  const { perfil } = useAuth();

  const [mensajes, setMensajes] = useState([]);
  const [texto, setTexto] = useState('');
  const [pensando, setPensando] = useState(false);
  const [error, setError] = useState(null);
  const [escuchando, setEscuchando] = useState(false);
  const [abierta, setAbierta] = useState(null);

  const sesion = useRef(localStorage.getItem(CLAVE_SESION));
  const finRef = useRef(null);
  const dictadoRef = useRef(null);

  // Recuperar la conversacion anterior (si la hay).
  useEffect(() => {
    if (!sesion.current) return;
    api
      .historialChat(sesion.current)
      .then((r) => setMensajes(r.mensajes.map((m) => ({ role: m.role, content: m.content }))))
      .catch(() => localStorage.removeItem(CLAVE_SESION));
  }, []);

  // Autoscroll al ultimo mensaje.
  useEffect(() => {
    finRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [mensajes, pensando]);

  const enviar = async (mensaje) => {
    const m = (mensaje ?? texto).trim();
    if (!m || pensando) return;

    setTexto('');
    setError(null);
    setMensajes((prev) => [...prev, { role: 'user', content: m }]);
    setPensando(true);

    try {
      const r = await api.chat(m, sesion.current);

      sesion.current = r.sessionId;
      localStorage.setItem(CLAVE_SESION, r.sessionId);

      setMensajes((prev) => [
        ...prev,
        { role: 'assistant', content: r.respuesta, jobs: r.jobs },
      ]);
    } catch (err) {
      setError(err.message);
      // Devolver el texto al input: que el usuario no pierda lo que escribio.
      setTexto(m);
      setMensajes((prev) => prev.slice(0, -1));
    } finally {
      setPensando(false);
    }
  };

  const alternarVoz = () => {
    if (escuchando) {
      dictadoRef.current?.stop();
      return;
    }

    const d = crearDictado({
      onTexto: (t) => setTexto(t),
      onFin: () => setEscuchando(false),
      onError: () => {
        setEscuchando(false);
        setError('No se pudo acceder al microfono.');
      },
    });

    if (!d) return;
    dictadoRef.current = d;
    setEscuchando(true);
    d.start();
  };

  const vacio = mensajes.length === 0;

  return (
    <div className={`chat ${vacio ? 'chat--escucha' : ''}`}>
      {/* Modo ESCUCHA: el orb es el protagonista. */}
      <div className={`chat__orb orb ${escuchando ? 'orb--vivo' : ''}`} aria-hidden="true" />

      {vacio && (
        <header className="chat__saludo">
          <h1>Hola {nombreDe(perfil?.email) || 'de nuevo'}</h1>
          <p className="saludo__sub">
            {escuchando ? 'Estoy escuchando…' : 'Preguntame lo que necesites.'}
          </p>

          <ul className="buscar__ejemplos chat__sugerencias">
            {SUGERENCIAS.map((s) => (
              <li key={s}>
                <button type="button" className="chip chip--btn" onClick={() => enviar(s)}>
                  {s}
                </button>
              </li>
            ))}
          </ul>
        </header>
      )}

      {/* aria-live: el lector de pantalla anuncia las respuestas al llegar. */}
      <div className="chat__hilo" aria-live="polite">
        {mensajes.map((m, i) => (
          <article key={i} className={`burbuja burbuja--${m.role}`}>
            {m.role === 'assistant' ? <RichText texto={m.content} /> : <p>{m.content}</p>}

            {/* Las ofertas se pintan como TARJETAS reales, con su enlace: el
                usuario no depende de que el modelo las transcriba bien. */}
            {m.jobs?.length > 0 && (
              <div className="chat__ofertas">
                {m.jobs.slice(0, 4).map((j) => (
                  <JobCard key={j.id} job={j} onOpen={setAbierta} />
                ))}
              </div>
            )}
          </article>
        ))}

        {pensando && (
          <div className="burbuja burbuja--assistant burbuja--pensando">
            <span />
            <span />
            <span />
          </div>
        )}

        <div ref={finRef} />
      </div>

      {error && (
        <p className="alerta chat__error" role="alert">
          <Icon name="aviso" size={16} />
          {error}
        </p>
      )}

      {/* Modo ESCRITURA: barra inferior. Sin teclado virtual propio. */}
      <form
        className="chat__barra"
        onSubmit={(e) => {
          e.preventDefault();
          enviar();
        }}
      >
        <label htmlFor="msg" className="sr-only">
          Escribe tu mensaje
        </label>
        <input
          id="msg"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder={escuchando ? 'Escuchando…' : 'Escribe tu mensaje…'}
          autoComplete="off"
          disabled={pensando}
        />

        {/* El microfono solo se muestra si el navegador lo soporta: un boton que
            no hace nada es peor que no tenerlo. */}
        {vozSoportada && (
          <button
            type="button"
            className={`iconbtn ${escuchando ? 'iconbtn--activo' : ''}`}
            onClick={alternarVoz}
            aria-label={escuchando ? 'Dejar de escuchar' : 'Dictar por voz'}
            aria-pressed={escuchando}
          >
            <Icon name="micro" />
          </button>
        )}

        <button
          type="submit"
          className="iconbtn iconbtn--enviar"
          disabled={pensando || !texto.trim()}
          aria-label="Enviar mensaje"
        >
          <Icon name="enviar" />
        </button>
      </form>

      <JobModal job={abierta} onClose={() => setAbierta(null)} />
    </div>
  );
}
