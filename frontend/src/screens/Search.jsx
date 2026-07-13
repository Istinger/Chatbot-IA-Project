import { useState } from 'react';
import { api } from '../lib/api';
import JobCard from '../components/JobCard';
import JobModal from '../components/JobModal';
import Icon from '../components/Icon';

/**
 * Ejemplos afirmativos a proposito.
 *
 * Los embeddings NO entienden la negacion: "remoto junior backend sin ingles"
 * (el ejemplo de DESIGN.md) se parece vectorialmente a "...con ingles" y arruina
 * el ranking. Se sugieren consultas que describen lo que SI se busca.
 */
const EJEMPLOS = [
  'remoto junior backend',
  'trabajo en la nube con contenedores',
  'analizar datos con python',
  'frontend con react bien pagado',
];

/**
 * Busqueda por lenguaje natural (DESIGN.md: "una barra grande y limpia").
 *
 * No hace falta iniciar sesion: el backend vectoriza el texto al vuelo y busca
 * por similitud. Por eso funciona escribiendo la intencion, no palabras clave.
 */
export default function Search() {
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
      <section className="buscar">
        <h1>Que buscas?</h1>
        <p className="saludo__sub">
          Escribelo con tus palabras. No hacen falta palabras clave exactas.
        </p>

        <form
          className="buscar__barra"
          onSubmit={(e) => {
            e.preventDefault();
            buscar();
          }}
        >
          <Icon name="buscar" size={22} />
          <label htmlFor="q" className="sr-only">
            Describe el trabajo que buscas
          </label>
          <input
            id="q"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="remoto junior backend sin ingles"
            autoComplete="off"
          />
          <button type="submit" className="btn btn--primario" disabled={buscando || !texto.trim()}>
            {buscando ? 'Buscando…' : 'Buscar'}
          </button>
        </form>

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
      </section>

      {error && (
        <p className="alerta" role="alert">
          <Icon name="aviso" size={16} />
          {error}
        </p>
      )}

      {resultados !== null && (
        <section className="resultados" aria-live="polite">
          <h2 className="carrusel__title">
            {resultados.length ? `${resultados.length} ofertas` : 'Sin resultados'}
          </h2>

          {resultados.length === 0 && !error && (
            <p className="vacio">
              No encontramos nada parecido. Prueba a describirlo de otra forma.
            </p>
          )}

          <div className="rejilla">
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
