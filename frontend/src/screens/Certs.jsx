import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useVista } from '../lib/vista';
import Icon from '../components/Icon';

/**
 * Brecha de habilidades (skill gap).
 *
 * La cifra que convence no es "te falta Docker", es "el 62% de las ofertas que
 * encajan CONTIGO pide Docker". Por eso el porcentaje va delante y la barra lo
 * hace visible de un vistazo: el usuario decide que estudiar comparando barras,
 * no leyendo una lista.
 */
function Barra({ porcentaje, tono = 'falta' }) {
  return (
    <span className={`barra barra--${tono}`} aria-hidden="true">
      <span className="barra__fill" style={{ width: `${porcentaje}%` }} />
    </span>
  );
}

export default function Certs() {
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState(null);
  const { setContextoPantalla } = useVista();

  useEffect(() => {
    api
      .certificados()
      .then(setDatos)
      .catch((e) => setError(e.message));
  }, []);

  // Se le cuenta al Asistente que brechas y cursos esta viendo el usuario, para
  // que "que aprendo primero?" o "cursos para X" tengan contexto real. Se limpia
  // al salir de la pantalla para no arrastrar contexto viejo a otras rutas.
  useEffect(() => {
    if (!datos) return undefined;
    const { analizadas, faltantes, fortalezas, cursos } = datos;
    const resumen = [
      `El usuario esta en la pantalla "Crecer": analisis de brechas de habilidades frente a ${analizadas} ofertas afines a su perfil.`,
      faltantes.length
        ? `Brechas (habilidad: % de esas ofertas que la piden): ${faltantes
            .map((f) => `${f.skill} ${f.porcentaje}%`)
            .join(', ')}.`
        : 'No tiene brechas: ya cubre lo que piden sus ofertas.',
      fortalezas.length
        ? `Ya domina y le valoran: ${fortalezas.map((f) => `${f.skill} ${f.porcentaje}%`).join(', ')}.`
        : '',
      cursos.length ? `Hay cursos sugeridos para: ${cursos.map((c) => c.skill).join(', ')}.` : '',
    ]
      .filter(Boolean)
      .join(' ');

    setContextoPantalla(resumen);
    return () => setContextoPantalla(null);
  }, [datos, setContextoPantalla]);

  if (error) {
    return (
      <>
        <header className="saludo">
          <h1>Crecer</h1>
        </header>
        <section className="aviso-panel">
          <Icon name="aviso" size={20} />
          <p>{error}</p>
        </section>
      </>
    );
  }

  if (!datos) {
    return (
      <>
        <header className="saludo">
          <h1>Crecer</h1>
          <p className="saludo__sub">Analizando las ofertas que encajan contigo…</p>
        </header>
      </>
    );
  }

  const { analizadas, fortalezas, faltantes, cursos } = datos;

  return (
    <>
      <header className="saludo">
        <h1>Crecer</h1>
        <p className="saludo__sub">
          Comparamos tus habilidades con las de <strong>{analizadas} ofertas</strong> que
          encajan contigo. Esto es lo que te separa de ellas.
        </p>
      </header>

      {!faltantes.length && (
        <section className="panel">
          <p className="onb__sub">
            <Icon name="ok" size={16} /> No detectamos brechas: ya cubres lo que piden tus
            ofertas afines.
          </p>
        </section>
      )}

      {faltantes.length > 0 && (
        <section className="panel">
          <h2 className="carrusel__title">Lo que te falta</h2>
          <ul className="gap">
            {faltantes.map((f) => (
              <li key={f.skill} className="gap__item">
                <span className="gap__skill">{f.skill}</span>
                <Barra porcentaje={f.porcentaje} />
                <span className="gap__pct">{f.porcentaje}%</span>
              </li>
            ))}
          </ul>
          <p className="gap__nota">
            El porcentaje es cuantas de esas {analizadas} ofertas piden la habilidad.
          </p>
        </section>
      )}

      {fortalezas.length > 0 && (
        <section className="panel">
          <h2 className="carrusel__title">Lo que ya tienes y te piden</h2>
          <ul className="gap">
            {fortalezas.map((f) => (
              <li key={f.skill} className="gap__item">
                <span className="gap__skill">{f.skill}</span>
                <Barra porcentaje={f.porcentaje} tono="tengo" />
                <span className="gap__pct">{f.porcentaje}%</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {cursos.length > 0 && (
        <section className="panel">
          <h2 className="carrusel__title">Por donde empezar</h2>
          <p className="onb__sub">
            Cursos gratuitos, ordenados por lo que mas te piden. Ninguno los eligio una IA:
            son un catalogo revisado a mano.
          </p>

          <div className="cursos">
            {cursos.map((c) => (
              <article key={c.skill} className="curso">
                <header className="curso__head">
                  <h3>{c.skill}</h3>
                  <span className="curso__pct">{c.porcentaje}% de tus ofertas</span>
                </header>

                <ul className="curso__lista">
                  {c.opciones.map((o) => (
                    <li key={o.url}>
                      {/* rel=noreferrer: el destino no debe saber de donde viene el clic. */}
                      <a
                        className="curso__link"
                        href={o.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Icon name="enlace" size={16} />
                        <span className="curso__titulo">{o.titulo}</span>
                      </a>
                      <span className="curso__meta">
                        {o.proveedor}
                        {o.gratis === true && <em className="curso__gratis">gratis</em>}
                        {o.gratis === 'auditable' && (
                          <em className="curso__gratis" title="Se puede cursar gratis; el certificado se paga">
                            gratis (certificado de pago)
                          </em>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
