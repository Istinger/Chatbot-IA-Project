import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { useVista } from '../lib/vista';
import { nombreDe } from '../lib/format';
import { crearDictado, esBrave, mensajeDeError, soportado as vozSoportada } from '../lib/voz';
import Icon from './Icon';
import RichText from './RichText';

const CLAVE_SESION = 'jobia_chat';

/**
 * Panel del Asistente: el CENTRO de la navegacion (no las pestañas).
 *
 * Es el chat con el LLM (RAG + defensa anti-inyeccion) y el dictado por voz, que
 * escribe en la propia caja de texto: pulsar el microfono NO abre ninguna vista
 * aparte, solo enciende y apaga el dictado.
 *
 * Vive SIEMPRE montado en el Shell (derecha en escritorio, vista principal en
 * movil), asi que la conversacion no se pierde al moverse por la app.
 */

const SUGERENCIAS = [
  'Busco trabajo remoto de backend',
  'Simula una entrevista tecnica junior',
  'Que certificaciones me convienen?',
];

export default function AsistentePanel() {
  const { perfil } = useAuth();
  // Lo que el usuario ve ahora: la oferta abierta (modal compartido en el Shell)
  // y un resumen de la pantalla actual (p. ej. brechas/cursos de "Crecer"). Se
  // manda como contexto al chat para responder sobre lo que hay en pantalla.
  const { ofertaActiva, contextoPantalla, peticionIA, consumirIA, setOfertasSugeridas } =
    useVista();
  const navegar = useNavigate();

  const [mensajes, setMensajes] = useState([]);
  const [texto, setTexto] = useState('');
  const [pensando, setPensando] = useState(false);
  const [error, setError] = useState(null);
  const [escuchando, setEscuchando] = useState(false);

  const sesion = useRef(localStorage.getItem(CLAVE_SESION));
  const finRef = useRef(null);
  const dictadoRef = useRef(null);
  const braveRef = useRef(false);

  useEffect(() => {
    if (!sesion.current) return;
    api
      .historialChat(sesion.current)
      .then((r) => setMensajes(r.mensajes.map((m) => ({ role: m.role, content: m.content }))))
      .catch(() => localStorage.removeItem(CLAVE_SESION));
  }, []);

  useEffect(() => {
    if (vozSoportada) esBrave().then((b) => (braveRef.current = b));
  }, []);

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
      // Se adjunta lo que se ve en pantalla: el id de la oferta abierta (si la
      // hay) y el resumen de la pantalla actual (brechas/cursos de "Crecer", etc.).
      const r = await api.chat(m, sesion.current, ofertaActiva?.id, contextoPantalla);
      sesion.current = r.sessionId;
      localStorage.setItem(CLAVE_SESION, r.sessionId);
      setMensajes((prev) => [...prev, { role: 'assistant', content: r.respuesta, jobs: r.jobs }]);
    } catch (err) {
      setError(err.message);
      setTexto(m);
      setMensajes((prev) => prev.slice(0, -1));
    } finally {
      setPensando(false);
    }
  };

  // Otra pantalla (p. ej. el worksheet del portafolio) empuja un mensaje al chat.
  useEffect(() => {
    if (peticionIA) {
      enviar(peticionIA.texto);
      consumirIA();
    }
    // Solo reaccionar a nuevas peticiones (id cambia en cada pedirIA).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [peticionIA]);

  /**
   * Microfono de la barra: dicta EN EL PROPIO CHAT.
   *
   * Antes abria un overlay de voz a pantalla completa; ahora solo enciende y
   * apaga el dictado, que escribe en la caja de texto. Desde ahi el mensaje se
   * envia como cualquier otro (se puede corregir antes de mandarlo).
   */
  const alternarVoz = () => {
    if (escuchando) {
      dictadoRef.current?.stop();
      return;
    }
    setError(null);
    const d = crearDictado({
      onTexto: (t) => setTexto(t),
      onFin: () => {
        setEscuchando(false);
        // Al terminar, el foco vuelve a la caja para poder rematar y enviar.
        setTimeout(() => document.getElementById('msg')?.focus(), 0);
      },
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

  const vacio = mensajes.length === 0;

  return (
    <aside className="asis" aria-label="Asistente">
      <header className="asis__cab">
        <span className={`asis__pulse ${escuchando ? 'asis__pulse--vivo' : ''}`} aria-hidden="true">
          <Icon name="asistente" size={30} />
        </span>
        <div>
          <h2 className="asis__nombre">Asistente IA</h2>
          <p className="asis__estado"><span className="asis__punto" /> En linea</p>
        </div>
      </header>

      <div className="asis__cuerpo">
        {vacio ? (
          <>
            <p className="asis__hola">
              Hola {nombreDe(perfil?.email) || 'de nuevo'}, estoy aqui para ayudarte a
              encontrar la oportunidad ideal.
            </p>

            <p className="asis__sugtit">Sugerencias rapidas</p>
            <ul className="asis__sugs">
              {SUGERENCIAS.map((s) => (
                <li key={s}>
                  <button type="button" className="chip chip--btn" onClick={() => enviar(s)}>
                    {s}
                  </button>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <div className="asis__hilo" aria-live="polite">
            {mensajes.map((m, i) => (
              <article key={i} className={`burbuja burbuja--${m.role}`}>
                {m.role === 'assistant' ? <RichText texto={m.content} /> : <p>{m.content}</p>}
                {/* Las ofertas NO se pintan aqui: en una columna estrecha salen
                    apretadas. Se mandan a "Buscar", que tiene sitio y filtros. */}
                {m.jobs?.length > 0 && (
                  <button
                    type="button"
                    className="asis__verofertas"
                    onClick={() => {
                      setOfertasSugeridas(m.jobs);
                      navegar('/buscar');
                    }}
                  >
                    <Icon name="maletin" size={16} />
                    Ver {m.jobs.length} {m.jobs.length === 1 ? 'oferta' : 'ofertas'}
                    <Icon name="derecha" size={16} />
                  </button>
                )}
              </article>
            ))}
            {pensando && (
              <div className="burbuja burbuja--assistant burbuja--pensando">
                <span /><span /><span />
              </div>
            )}
            <div ref={finRef} />
          </div>
        )}
      </div>

      {error && (
        <p className="alerta asis__error" role="alert">
          <Icon name="aviso" size={16} />
          {error}
        </p>
      )}

      <form
        className="asis__barra"
        onSubmit={(e) => {
          e.preventDefault();
          enviar();
        }}
      >
        <label htmlFor="msg" className="sr-only">Escribe tu consulta</label>
        <input
          id="msg"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Escribe tu consulta…"
          autoComplete="off"
          disabled={pensando}
        />
        {vozSoportada && (
          <button
            type="button"
            className={`iconbtn ${escuchando ? 'iconbtn--escuchando' : ''}`}
            onClick={alternarVoz}
            aria-pressed={escuchando}
            aria-label={escuchando ? 'Dejar de dictar' : 'Dictar por voz'}
            title={escuchando ? 'Dejar de dictar' : 'Dictar por voz'}
          >
            <Icon name="micro" />
          </button>
        )}
        <button
          type="submit"
          className="iconbtn iconbtn--enviar"
          disabled={pensando || !texto.trim()}
          aria-label="Enviar"
        >
          <Icon name="enviar" />
        </button>
      </form>
    </aside>
  );
}
