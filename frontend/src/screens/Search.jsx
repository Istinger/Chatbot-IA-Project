import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import JobCard from '../components/JobCard';
import JobModal from '../components/JobModal';
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

// Filtros del mock. Son VISUALES por ahora: el backend busca por similitud
// semantica, no por facetas. Se dejan como guia y no prometen lo que no hacen.
const FILTROS = ['Ubicacion', 'Modalidad', 'Nivel', 'Salario', 'Categoria'];

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
  const [abierta, setAbierta] = useState(null);

  const buscar = async (consulta) => {
    const q = (consulta ?? texto).trim();
    if (!q) return;

    setTexto(q);
    setError(null);
    setBuscando(true);
    try {
      const r = await api.buscar(q, 18);
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

      <div className="buscar__filtros" aria-label="Filtros (proximamente)">
        {FILTROS.map((f) => (
          <span key={f} className="filtro-chip" aria-disabled="true">
            {f}
            <Icon name="derecha" size={14} className="filtro-chip__flecha" />
          </span>
        ))}
        <span className="filtro-chip filtro-chip--mas">
          <Icon name="filtros" size={16} /> Mas filtros
        </span>
      </div>

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
              {resultados.length ? `${resultados.length} ofertas encontradas` : 'Sin resultados'}
            </h2>
          </div>

          {resultados.length === 0 && !error && (
            <p className="vacio">No encontramos nada parecido. Prueba a describirlo de otra forma.</p>
          )}

          <div className="ofertas__rejilla">
            {resultados.map((j) => (
              <JobCard key={j.id} job={j} onOpen={setAbierta} />
            ))}
          </div>
        </section>
      )}

      <JobModal job={abierta} onClose={() => setAbierta(null)} />
    </>
  );
}
