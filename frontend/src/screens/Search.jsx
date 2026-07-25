import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useVista } from '../lib/vista';
import JobCard from '../components/JobCard';
import Icon from '../components/Icon';

/**
 * Ejemplos afirmativos a proposito.
 *
 * Los embeddings NO entienden la negacion: "remoto junior backend sin ingles"
 * se parece vectorialmente a "...con ingles" y arruina el ranking. Se sugieren
 * consultas que describen lo que SI se busca.
 */
const EJEMPLOS = [
  'remoto junior backend',
  'trabajo en la nube con contenedores',
  'analizar datos con python',
  'frontend con react bien pagado',
];

/**
 * Filtros. El backend busca por similitud semantica y NO tiene facetas, asi que
 * se filtra sobre los resultados ya recibidos. Es honesto: acota lo que ya se
 * encontro, no promete una busqueda por campos que el servidor no hace.
 *
 * Cada opcion es un predicado sobre la oferta. `todas` no filtra nada.
 */
const texto_ = (j) => `${j.title || ''} ${j.location || ''} ${j.description || ''}`.toLowerCase();
const tieneSkill = (j, lista) => (j.skills || []).some((s) => lista.includes(s));

const FILTROS = [
  {
    id: 'ubicacion',
    etiqueta: 'Ubicacion',
    opciones: [
      { v: 'todas', txt: 'Cualquier ubicacion' },
      { v: 'ec', txt: 'Ecuador', test: (j) => !j.isForeign },
      { v: 'fuera', txt: 'Exterior', test: (j) => j.isForeign },
    ],
  },
  {
    id: 'modalidad',
    etiqueta: 'Modalidad',
    opciones: [
      { v: 'todas', txt: 'Cualquier modalidad' },
      { v: 'remoto', txt: 'Remoto', test: (j) => /remot|teletrabajo|home office/.test(texto_(j)) },
      { v: 'presencial', txt: 'Presencial', test: (j) => !/remot|teletrabajo|home office/.test(texto_(j)) },
    ],
  },
  {
    id: 'nivel',
    etiqueta: 'Nivel',
    opciones: [
      { v: 'todas', txt: 'Cualquier nivel' },
      { v: 'junior', txt: 'Junior', test: (j) => /junior|jr\b|trainee|practic|becari|entry/.test(texto_(j)) },
      { v: 'senior', txt: 'Senior', test: (j) => /senior|sr\b|lead|principal/.test(texto_(j)) },
    ],
  },
  {
    id: 'salario',
    etiqueta: 'Salario',
    opciones: [
      { v: 'todas', txt: 'Cualquier salario' },
      { v: 'publicado', txt: 'Con salario', test: (j) => Boolean(j.salaryUsdMax) },
      { v: 'alto', txt: 'Desde $50k USD', test: (j) => (j.salaryUsdMax || 0) >= 50000 },
    ],
  },
  {
    id: 'categoria',
    etiqueta: 'Categoria',
    opciones: [
      { v: 'todas', txt: 'Cualquier area' },
      { v: 'front', txt: 'Frontend', test: (j) => tieneSkill(j, ['react', 'angular', 'vue', 'html', 'css', 'nextjs', 'tailwind']) },
      { v: 'back', txt: 'Backend', test: (j) => tieneSkill(j, ['node.js', 'django', 'spring', 'laravel', 'express', 'fastapi', 'flask', 'rest', 'microservicios']) },
      { v: 'datos', txt: 'Datos / IA', test: (j) => tieneSkill(j, ['sql', 'pandas', 'machine learning', 'tensorflow', 'pytorch', 'power bi', 'etl', 'airflow']) },
      { v: 'devops', txt: 'DevOps / Cloud', test: (j) => tieneSkill(j, ['docker', 'kubernetes', 'aws', 'azure', 'gcp', 'terraform', 'ci/cd', 'linux']) },
    ],
  },
];

const SIN_FILTROS = Object.fromEntries(FILTROS.map((f) => [f.id, 'todas']));

/**
 * Si merece la pena pedirle a la IA que reescriba la busqueda.
 *
 * Solo cuando el motor lo va a pasar mal: hay una negacion (que los embeddings no
 * entienden) o es una frase larga y conversacional. Una consulta ya buena como
 * "remoto junior backend" se busca tal cual y no gasta cuota.
 */
const NEGACIONES = /\b(sin|no|ni|excepto|salvo|menos|nada de|que no)\b/i;

function necesitaReformular(q) {
  return NEGACIONES.test(q) || q.trim().split(/\s+/).length > 6;
}

/** Aplica los filtros activos a la lista de resultados. */
function filtrar(ofertas, seleccion) {
  return ofertas.filter((j) =>
    FILTROS.every((f) => {
      const op = f.opciones.find((o) => o.v === seleccion[f.id]);
      return !op?.test || op.test(j);
    }),
  );
}

/**
 * Busqueda por lenguaje natural. El backend vectoriza el texto al vuelo y busca
 * por similitud, por eso funciona escribiendo la intencion, no palabras clave.
 */
export default function Search() {
  const navegar = useNavigate();
  const [texto, setTexto] = useState('');
  const [resultados, setResultados] = useState(null);
  const [buscando, setBuscando] = useState(false);
  const [error, setError] = useState(null);
  const [filtros, setFiltros] = useState(SIN_FILTROS);
  // { original, consulta } cuando la IA reescribio la busqueda. Se enseña: cambiar
  // lo que el usuario pidio en silencio es confuso cuando los resultados no cuadran.
  const [reformulado, setReformulado] = useState(null);
  // Modal compartido en el Shell: al abrir una oferta, el Asistente tambien
  // sabe cual estas viendo.
  const { setOfertaActiva } = useVista();

  // Lo que se pinta: los resultados pasados por los filtros activos.
  const visibles = useMemo(() => filtrar(resultados || [], filtros), [resultados, filtros]);

  /**
   * Busca. Si el texto lo pide, primero lo reescribe en afirmativo.
   *
   * `tosco` = usar el texto TAL CUAL (lo pulsa el usuario si no le gusta la
   * reescritura). Nunca se reformula dos veces la misma busqueda.
   */
  const buscar = async (consulta, { tosco = false } = {}) => {
    const q = (consulta ?? texto).trim();
    if (!q) return;

    setTexto(q);
    setError(null);
    setBuscando(true);
    setReformulado(null);

    let aBuscar = q;
    if (!tosco && necesitaReformular(q)) {
      try {
        const r = await api.reformular(q);
        if (r.cambiada && r.consulta) {
          aBuscar = r.consulta;
          setReformulado({ original: q, consulta: r.consulta });
        }
      } catch {
        // El reescrito es una ayuda, no un requisito: se busca con el original.
      }
    }

    try {
      const r = await api.buscar(aBuscar, 18);
      setResultados(r.jobs);
    } catch (err) {
      setError(err.message);
      setResultados([]);
    } finally {
      setBuscando(false);
    }
  };

  return (
    <>
      <header className="buscar__cab">
        <button type="button" className="iconbtn iconbtn--volver" onClick={() => navegar('/')} aria-label="Volver">
          <Icon name="izquierda" size={22} />
        </button>
        <div>
          <h1>Buscar ofertas</h1>
          <p className="saludo__sub">Encuentra oportunidades que impulsen tu carrera.</p>
        </div>
      </header>

      <form
        className="buscar__barra"
        onSubmit={(e) => {
          e.preventDefault();
          buscar();
        }}
      >
        <Icon name="buscar" size={22} />
        <label htmlFor="q" className="sr-only">Describe el trabajo que buscas</label>
        <input
          id="q"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Describe lo que buscas: remoto junior backend"
          autoComplete="off"
        />
        {texto && (
          <button type="button" className="buscar__limpiar" onClick={() => setTexto('')} aria-label="Limpiar">
            <Icon name="cerrar" size={18} />
          </button>
        )}
        <button type="submit" className="btn btn--primario" disabled={buscando || !texto.trim()}>
          {buscando ? 'Buscando…' : 'Buscar'}
        </button>
      </form>

      {/* Que se vea que la busqueda cambio, y poder deshacerlo. */}
      {reformulado && (
        <p className="buscar__reformulado">
          <Icon name="asistente" size={15} />
          <span>
            Buscamos por <strong>«{reformulado.consulta}»</strong>
          </span>
          <button type="button" onClick={() => buscar(reformulado.original, { tosco: true })}>
            Usar mi texto original
          </button>
        </p>
      )}

      {/* Filtran los resultados que ya se recibieron (el backend busca por
          similitud, no por facetas). Se muestran solo cuando hay algo que filtrar. */}
      {resultados !== null && (
        <div className="buscar__filtros" aria-label="Filtros">
          {FILTROS.map((f) => (
            <label
              key={f.id}
              className={`filtro-chip ${filtros[f.id] !== 'todas' ? 'filtro-chip--on' : ''}`}
            >
              <span className="sr-only">{f.etiqueta}</span>
              <select
                value={filtros[f.id]}
                onChange={(e) => setFiltros({ ...filtros, [f.id]: e.target.value })}
              >
                {f.opciones.map((o) => (
                  <option key={o.v} value={o.v}>
                    {o.v === 'todas' ? f.etiqueta : o.txt}
                  </option>
                ))}
              </select>
              <Icon name="derecha" size={14} className="filtro-chip__flecha" />
            </label>
          ))}

          {Object.values(filtros).some((v) => v !== 'todas') && (
            <button
              type="button"
              className="filtro-chip filtro-chip--mas"
              onClick={() => setFiltros(SIN_FILTROS)}
            >
              <Icon name="cerrar" size={16} /> Quitar filtros
            </button>
          )}
        </div>
      )}

      {resultados === null && (
        <ul className="buscar__ejemplos">
          {EJEMPLOS.map((e) => (
            <li key={e}>
              <button type="button" className="chip chip--btn" onClick={() => buscar(e)}>
                {e}
              </button>
            </li>
          ))}
        </ul>
      )}

      {error && (
        <p className="alerta" role="alert">
          <Icon name="aviso" size={16} />
          {error}
        </p>
      )}

      {resultados !== null && (
        <section className="resultados" aria-live="polite">
          <div className="resultados__barra">
            <h2 className="carrusel__title">
              {visibles.length
                ? `${visibles.length} ofertas encontradas`
                : resultados.length
                ? 'Ninguna cumple los filtros'
                : 'Sin resultados'}
              {/* Se dice cuantas se ocultaron: si no, parece que la busqueda fallo. */}
              {visibles.length < resultados.length && (
                <span className="resultados__filtradas">
                  {' '}de {resultados.length}
                </span>
              )}
            </h2>
          </div>

          {resultados.length === 0 && !error && (
            <p className="vacio">No encontramos nada parecido. Prueba a describirlo de otra forma.</p>
          )}

          {resultados.length > 0 && visibles.length === 0 && (
            <p className="vacio">
              Ninguna de las {resultados.length} ofertas cumple los filtros. Prueba a quitar
              alguno.
            </p>
          )}

          <div className="ofertas__rejilla">
            {visibles.map((j) => (
              <JobCard key={j.id} job={j} onOpen={setOfertaActiva} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
