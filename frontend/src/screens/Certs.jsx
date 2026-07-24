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

/**
 * Etiqueta de demanda derivada del % de ofertas que piden la skill. No es un
 * dato nuevo: es la misma cifra de la brecha, dicha en palabras para la tarjeta.
 */
function demandaDe(porcentaje) {
  if (porcentaje >= 15) return { texto: 'Alta demanda', tono: 'alta' };
  if (porcentaje >= 7) return { texto: 'Demanda media', tono: 'media' };
  return { texto: 'Demanda baja', tono: 'baja' };
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
          <header className="seccion__cab">
            <span className="seccion__icono"><Icon name="nivel" size={20} /></span>
            <div className="seccion__txt">
              <h2 className="seccion__titulo">Lo que te falta</h2>
              <p className="seccion__sub">Habilidades con mayor brecha respecto a las ofertas.</p>
            </div>
            <span className="seccion__pill">
              <Icon name="aviso" size={14} /> Basado en {analizadas} ofertas
            </span>
          </header>
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
          <header className="seccion__cab">
            <span className="seccion__icono seccion__icono--ok"><Icon name="ok" size={20} /></span>
            <div className="seccion__txt">
              <h2 className="seccion__titulo">Lo que ya tienes y te piden</h2>
              <p className="seccion__sub">Habilidades que dominas y las ofertas valoran.</p>
            </div>
          </header>
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
          <header className="seccion__cab">
            <span className="seccion__icono seccion__icono--cursos"><Icon name="crecer" size={20} /></span>
            <div className="seccion__txt">
              <h2 className="seccion__titulo">Por donde empezar</h2>
              <p className="seccion__sub">Cursos y recursos recomendados segun impacto y demanda.</p>
            </div>
          </header>

          <div className="cursos">
            {cursos.map((c) => {
              // Una tarjeta por brecha, con el curso principal (el catalogo lista
              // primero el mas recomendable). El resto de opciones, si las hay,
              // quedan como enlaces secundarios al pie.
              const [curso, ...extra] = c.opciones;
              const dem = demandaDe(c.porcentaje);

              return (
                <article key={c.skill} className="curso">
                  <header className="curso__top">
                    <span className="curso__skill">{c.skill}</span>
                    <span className={`curso__demanda curso__demanda--${dem.tono}`}>{dem.texto}</span>
                  </header>

                  <h3 className="curso__nombre">{curso.titulo}</h3>
                  <p className="curso__prov">
                    {curso.proveedor}
                    {curso.nivel ? ` · ${curso.nivel}` : ''}
                  </p>
                  {curso.descripcion && <p className="curso__desc">{curso.descripcion}</p>}

                  <footer className="curso__foot">
                    <span className="curso__horas">
                      <Icon name="reloj" size={14} /> {curso.horas ? `${curso.horas} h` : 'a tu ritmo'}
                    </span>
                    {curso.gratis === true && <span className="curso__gratis">gratis</span>}
                    {curso.gratis === 'auditable' && (
                      <span className="curso__gratis" title="Se puede cursar gratis; el certificado se paga">
                        gratis · cert. de pago
                      </span>
                    )}
                    {/* rel=noreferrer: el destino no debe saber de donde viene el clic. */}
                    <a
                      className="curso__ir"
                      href={curso.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Abrir ${curso.titulo} (${curso.proveedor})`}
                    >
                      <Icon name="derecha" size={18} />
                    </a>
                  </footer>

                  {extra.length > 0 && (
                    <ul className="curso__extra">
                      {extra.map((o) => (
                        <li key={o.url}>
                          <a href={o.url} target="_blank" rel="noopener noreferrer">
                            <Icon name="enlace" size={14} /> {o.titulo}
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                </article>
              );
            })}
          </div>
        </section>
      )}
    </>
  );
}
