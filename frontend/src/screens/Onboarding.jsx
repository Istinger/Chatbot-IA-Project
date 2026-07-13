import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import Icon from '../components/Icon';

/**
 * Onboarding en 3 pasos (DESIGN.md): sube el CV -> confirma tus skills -> listo.
 *
 * Es el momento clave del sistema: aqui el usuario alimenta el motor de
 * matching. Cada paso ocupa la pantalla completa y el progreso son puntos, no
 * una barra corporativa.
 *
 * Se puede saltar el CV y escribir las skills a mano: no todo el mundo tiene un
 * PDF a mano, y sin skills el sistema no puede recomendar nada.
 */
export default function Onboarding() {
  const { refrescar } = useAuth();
  const navegar = useNavigate();
  const inputArchivo = useRef(null);

  const [paso, setPaso] = useState(1);
  const [skills, setSkills] = useState([]);
  const [seleccionadas, setSeleccionadas] = useState(new Set());
  const [manual, setManual] = useState('');
  const [arrastrando, setArrastrando] = useState(false);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState(null);

  const procesarArchivo = async (file) => {
    if (!file) return;
    setError(null);
    setSubiendo(true);
    try {
      const r = await api.subirCv(file);
      setSkills(r.skillsDetectadas);
      setSeleccionadas(new Set(r.skillsDetectadas));
      setPaso(2);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubiendo(false);
    }
  };

  const alternar = (s) => {
    setSeleccionadas((prev) => {
      const n = new Set(prev);
      if (n.has(s)) n.delete(s);
      else n.add(s);
      return n;
    });
  };

  const anadirManual = (e) => {
    e.preventDefault();
    const nuevas = manual
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
    if (!nuevas.length) return;

    setSkills((prev) => [...new Set([...prev, ...nuevas])]);
    setSeleccionadas((prev) => new Set([...prev, ...nuevas]));
    setManual('');
  };

  const confirmar = async () => {
    setError(null);
    setSubiendo(true);
    try {
      await api.guardarSkills([...seleccionadas]);
      await refrescar();
      setPaso(3);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubiendo(false);
    }
  };

  return (
    <main className="onb">
      <div className="orb orb--peq" aria-hidden="true" />

      {/* Progreso sutil: puntos, no barra. */}
      <ol className="onb__pasos" aria-label={`Paso ${paso} de 3`}>
        {[1, 2, 3].map((n) => (
          <li key={n} className={n <= paso ? 'on' : ''} aria-current={n === paso ? 'step' : undefined} />
        ))}
      </ol>

      {paso === 1 && (
        <section className="onb__panel">
          <h1>Sube tu CV</h1>
          <p className="onb__sub">
            Lo leemos, extraemos tus habilidades y buscamos ofertas que encajen. El
            archivo no se guarda: solo su texto.
          </p>

          <div
            className={`drop ${arrastrando ? 'drop--activo' : ''}`}
            onDragOver={(e) => {
              e.preventDefault();
              setArrastrando(true);
            }}
            onDragLeave={() => setArrastrando(false)}
            onDrop={(e) => {
              e.preventDefault();
              setArrastrando(false);
              procesarArchivo(e.dataTransfer.files?.[0]);
            }}
          >
            <Icon name="subir" size={40} />
            <p>Arrastra tu CV en PDF</p>
            <span className="onb__sub">o</span>

            <button
              type="button"
              className="btn btn--glass"
              onClick={() => inputArchivo.current?.click()}
              disabled={subiendo}
            >
              {subiendo ? 'Leyendo el PDF…' : 'Elegir archivo'}
            </button>

            <input
              ref={inputArchivo}
              type="file"
              accept="application/pdf"
              className="sr-only"
              onChange={(e) => procesarArchivo(e.target.files?.[0])}
            />
          </div>

          {error && (
            <p className="alerta" role="alert">
              <Icon name="aviso" size={16} />
              {error}
            </p>
          )}

          <button type="button" className="btn btn--texto" onClick={() => setPaso(2)}>
            No tengo el CV a mano
          </button>
        </section>
      )}

      {paso === 2 && (
        <section className="onb__panel">
          <h1>Confirma tus habilidades</h1>
          <p className="onb__sub">
            {skills.length
              ? 'Esto es lo que encontramos en tu CV. Quita lo que no te represente.'
              : 'Escribe las habilidades que manejas, separadas por comas.'}
          </p>

          <ul className="chips chips--grandes">
            {skills.map((s) => (
              <li key={s}>
                <button
                  type="button"
                  className={`chip chip--btn ${seleccionadas.has(s) ? 'chip--on' : ''}`}
                  onClick={() => alternar(s)}
                  aria-pressed={seleccionadas.has(s)}
                >
                  {s}
                </button>
              </li>
            ))}
          </ul>

          <form className="onb__manual" onSubmit={anadirManual}>
            <label htmlFor="manual" className="sr-only">
              Anadir habilidades
            </label>
            <input
              id="manual"
              value={manual}
              onChange={(e) => setManual(e.target.value)}
              placeholder="react, python, sql…"
            />
            <button type="submit" className="btn btn--glass">
              Anadir
            </button>
          </form>

          {error && (
            <p className="alerta" role="alert">
              <Icon name="aviso" size={16} />
              {error}
            </p>
          )}

          <button
            type="button"
            className="btn btn--primario"
            onClick={confirmar}
            disabled={subiendo || seleccionadas.size === 0}
          >
            {subiendo ? 'Guardando…' : `Continuar con ${seleccionadas.size} habilidades`}
          </button>

          {seleccionadas.size === 0 && (
            <p className="onb__sub">Elige al menos una habilidad para continuar.</p>
          )}
        </section>
      )}

      {paso === 3 && (
        <section className="onb__panel onb__panel--fin">
          <Icon name="ok" size={56} className="onb__ok" />
          <h1>Listo</h1>
          <p className="onb__sub">
            Tu perfil ya esta en el motor de busqueda. Vamos a ver que hay para ti.
          </p>
          <button
            type="button"
            className="btn btn--primario"
            onClick={() => navegar('/', { replace: true })}
          >
            Ver mis ofertas
          </button>
        </section>
      )}
    </main>
  );
}
