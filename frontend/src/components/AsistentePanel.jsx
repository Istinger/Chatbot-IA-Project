import { useEffect, useRef, useState } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { useVista } from '../lib/vista';
import { nombreDe } from '../lib/format';
import { crearDictado, esBrave, mensajeDeError, soportado as vozSoportada } from '../lib/voz';
import Icon from './Icon';
import RichText from './RichText';
import JobCard from './JobCard';
import VozOverlay from './VozOverlay';

const CLAVE_SESION = 'jobia_chat';

/**
 * Panel del Asistente: el CENTRO de la navegacion (no las pestañas).
 *
 * Reune tres cosas que antes vivian en pantallas separadas:
 *   1. Tarjetas de accion que llevan a cada zona (ofertas, buscar, CV, crecer).
 *   2. El chat con el LLM (RAG + defensa anti-inyeccion, igual que antes).
 *   3. El modo voz a pantalla completa (mock: escuchando.html).
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
  const { ofertaActiva, setOfertaActiva, contextoPantalla } = useVista();

  const [mensajes, setMensajes] = useState([]);
  const [texto, setTexto] = useState('');
  const [pensando, setPensando] = useState(false);
  const [error, setError] = useState(null);
  const [escuchando, setEscuchando] = useState(false);
  const [vozAbierta, setVozAbierta] = useState(false);

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

  const alternarVoz = () => {
    if (escuchando) {
      dictadoRef.current?.stop();
      return;
    }
    const d = crearDictado({
      onTexto: (t) => setTexto(t),
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

  const abrirVoz = () => {
    setError(null);
    setVozAbierta(true);
    if (!escuchando) alternarVoz();
  };
  const cerrarVozAlTeclado = () => {
    dictadoRef.current?.stop();
    setVozAbierta(false);
    setTimeout(() => document.getElementById('msg')?.focus(), 0);
  };
  const cerrarVoz = () => {
    dictadoRef.current?.stop();
    setVozAbierta(false);
    setTexto('');
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
                {m.jobs?.length > 0 && (
                  <div className="asis__ofertas">
                    {m.jobs.slice(0, 3).map((j) => (
                      <JobCard key={j.id} job={j} onOpen={setOfertaActiva} />
                    ))}
                  </div>
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

      {error && !vozAbierta && (
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
          <button type="button" className="iconbtn" onClick={abrirVoz} aria-label="Hablar por voz">
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

      {vozAbierta && (
        <VozOverlay
          nombre={nombreDe(perfil?.email)}
          escuchando={escuchando}
          transcripcion={texto}
          error={error}
          onMic={alternarVoz}
          onTeclado={cerrarVozAlTeclado}
          onCerrar={cerrarVoz}
        />
      )}
    </aside>
  );
}
