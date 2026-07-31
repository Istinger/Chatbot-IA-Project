import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useVista } from '../lib/vista';
import { alternarProgreso, leerProgreso, proyeccion } from '../lib/crecer';
import Icon from '../components/Icon';
import RichText from '../components/RichText';
import SkillIcon from '../components/SkillIcon';
import { registrarAnimacion } from '../lib/animacion';

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

  // Lo que el usuario marca a mano: en que esta trabajando / que ya aprendio.
  const [progreso, setProgreso] = useState(() => leerProgreso());
  // Habilidad cuyo detalle esta abierto, y la explicacion que pidio a la IA.
  const [abierta, setAbierta] = useState(null);
  const [explica, setExplica] = useState({}); // { [skill]: texto }
  const [cargandoIA, setCargandoIA] = useState(null); // 'skill:python' | 'plan'
  const [plan, setPlan] = useState(null);

  useEffect(() => {
    api
      .certificados()
      .then((r) => {
        setDatos(r);
        registrarAnimacion('crecimiento_analizado', {
          analizadas: r.analizadas,
          faltantes: r.faltantes?.slice(0, 3).map((item) => item.skill),
          fortalezas: r.fortalezas?.slice(0, 3).map((item) => item.skill).join(', '),
          cursos: r.cursos?.slice(0, 3).map((item) => item.opciones?.[0]?.titulo || item.skill),
        });
      })
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

  // Lo marcado alimenta la proyeccion: "si aprendes esto, alcanzas N ofertas".
  const proy = proyeccion(faltantes, progreso, analizadas);
  const cursosDe = (skill) => cursos.find((c) => c.skill === skill)?.opciones || [];

  /** Explicacion de UNA brecha. Se muestra aqui mismo, junto a sus cursos. */
  const explicar = async (skill) => {
    const pct = faltantes.find((f) => f.skill === skill)?.porcentaje ?? 0;
    setCargandoIA(`skill:${skill}`);
    setError(null);
    try {
      const r = await api.chat(
        `Estoy revisando mi brecha de habilidades. El ${pct}% de las ${analizadas} ofertas que encajan con mi perfil pide "${skill}", y yo no lo tengo. Explicame brevemente: para que se usa en el trabajo real, que nivel me basta para un puesto junior, y por donde empezar. Se concreto y no te enrolles.`,
      );
      setExplica((prev) => ({ ...prev, [skill]: r.respuesta }));
    } catch (err) {
      setError(err.message);
    } finally {
      setCargandoIA(null);
    }
  };

  /** Plan de 4 semanas a partir de las brechas (y de lo que ya marcaste). */
  const pedirPlan = async () => {
    const enCurso = Object.keys(progreso).filter((s) => progreso[s] === 'progreso');
    setCargandoIA('plan');
    setError(null);
    try {
      const r = await api.chat(
        [
          `Estas son mis brechas frente a las ${analizadas} ofertas que encajan conmigo:`,
          faltantes.map((f) => `${f.skill} (${f.porcentaje}%)`).join(', ') + '.',
          enCurso.length ? `Ya estoy trabajando en: ${enCurso.join(', ')}.` : '',
          'Armame un plan de 4 semanas, semana a semana, para cerrar las mas importantes. Se realista con el tiempo de alguien que ademas busca trabajo.',
        ]
          .filter(Boolean)
          .join(' '),
      );
      setPlan(r.respuesta);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargandoIA(null);
    }
  };

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

      {/* Dos columnas para que quepa sin scroll: las dos listas de brechas a la
          izquierda y los cursos a la derecha (como en "Tu perfil"). */}
      <div className="crecer">
      <div className="crecer__col">
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
            {faltantes.map((f) => {
              const estado = progreso[f.skill] || '';
              return (
                <li key={f.skill} className={`gap__item gap__item--${estado || 'sin'}`}>
                  {/* Toda la fila abre el detalle de esa habilidad. */}
                  <button
                    type="button"
                    className="gap__fila"
                    onClick={() => setAbierta(abierta === f.skill ? null : f.skill)}
                    aria-expanded={abierta === f.skill}
                  >
                    <SkillIcon skill={f.skill} size={20} />
                    <span className="gap__skill">{f.skill}</span>
                    <Barra porcentaje={f.porcentaje} />
                    <span className="gap__pct">{f.porcentaje}%</span>
                  </button>

                  {/* Marca tu avance: sin marcar -> en progreso -> aprendida. */}
                  <button
                    type="button"
                    className="gap__marca"
                    onClick={() => setProgreso(alternarProgreso(f.skill))}
                    title={
                      estado === 'progreso'
                        ? 'En progreso (pulsa: aprendida)'
                        : estado === 'aprendida'
                        ? 'Aprendida (pulsa: quitar)'
                        : 'Marcar: la estoy aprendiendo'
                    }
                    aria-label={`Marcar ${f.skill}`}
                  >
                    <Icon name={estado === 'aprendida' ? 'ok' : 'marcador'} size={15} />
                  </button>
                </li>
              );
            })}
          </ul>

          {/* Proyeccion: que ganas con lo que has marcado. Calculo local, sin IA. */}
          {proy && (
            <p className="gap__proy">
              <Icon name="crecer" size={16} />
              {proy.exacto ? (
                <>
                  Con <strong>{proy.skills.join(', ')}</strong> alcanzarias{' '}
                  <strong>{proy.tope}</strong> de tus {analizadas} ofertas.
                </>
              ) : (
                <>
                  Con lo que marcaste alcanzarias entre <strong>{proy.minimo}</strong> y{' '}
                  <strong>{proy.tope}</strong> de tus {analizadas} ofertas.
                  <em> (es un rango: hay ofertas que piden varias de ellas)</em>
                </>
              )}
            </p>
          )}

          <p className="gap__nota">
            El porcentaje es cuantas de esas {analizadas} ofertas piden la habilidad.
            Pulsa una para ver de que va; el marcador guarda en cuales trabajas.
          </p>

          <button
            type="button"
            className="perfil__iabtn"
            onClick={pedirPlan}
            disabled={cargandoIA === 'plan'}
          >
            <Icon name="asistente" size={16} />
            {cargandoIA === 'plan' ? 'Armando el plan…' : 'Armar mi plan de 4 semanas'}
          </button>
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

      </div>

      {/* Columna derecha. El detalle y el plan se AÑADEN arriba: los cursos
          siguen siempre visibles debajo. */}
      <div className="crecer__der">

      {abierta && (
        <section className="panel crecer__detalle">
          <header className="seccion__cab">
            <span className="seccion__icono"><SkillIcon skill={abierta} size={28} /></span>
            <div className="seccion__txt">
              <h2 className="seccion__titulo">{abierta}</h2>
              <p className="seccion__sub">
                Lo pide el {faltantes.find((f) => f.skill === abierta)?.porcentaje}% de tus{' '}
                {analizadas} ofertas.
              </p>
            </div>
            <button
              type="button"
              className="iconbtn"
              onClick={() => setAbierta(null)}
              aria-label="Cerrar"
            >
              <Icon name="cerrar" size={18} />
            </button>
          </header>

          {explica[abierta] ? (
            <div className="crecer__ia"><RichText texto={explica[abierta]} /></div>
          ) : (
            <button
              type="button"
              className="perfil__iabtn"
              onClick={() => explicar(abierta)}
              disabled={cargandoIA === `skill:${abierta}`}
            >
              <Icon name="asistente" size={16} />
              {cargandoIA === `skill:${abierta}` ? 'Preguntando…' : 'Explicame esta habilidad'}
            </button>
          )}

          {cursosDe(abierta).length > 0 && (
            <>
              <p className="portproy__subtit">Para aprenderla</p>
              <ul className="curso__extra crecer__detcursos">
                {cursosDe(abierta).map((o) => (
                  <li key={o.url}>
                    <a href={o.url} target="_blank" rel="noopener noreferrer">
                      <Icon name="enlace" size={14} /> {o.titulo}
                      {o.horas ? ` · ${o.horas} h` : ''}
                    </a>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      )}

      {plan && (
        <section className="panel crecer__detalle">
          <header className="seccion__cab">
            <span className="seccion__icono seccion__icono--cursos"><Icon name="crecer" size={20} /></span>
            <div className="seccion__txt">
              <h2 className="seccion__titulo">Tu plan de 4 semanas</h2>
              <p className="seccion__sub">Generado a partir de tus brechas.</p>
            </div>
            <button type="button" className="iconbtn" onClick={() => setPlan(null)} aria-label="Cerrar">
              <Icon name="cerrar" size={18} />
            </button>
          </header>
          <div className="crecer__ia"><RichText texto={plan} /></div>
        </section>
      )}

      {cursos.length > 0 && (
        <section className="panel crecer__cursos">
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
                  <div className="curso__head">
                    <SkillIcon skill={c.skill} size={40} />
                    <div className="curso__headtxt">
                      <h3 className="curso__nombre">{curso.titulo}</h3>
                      <p className="curso__prov">
                        <span className="curso__provname">{curso.proveedor}</span>
                        {curso.nivel && (
                          <span className="curso__nivel">
                            <Icon name="nivel" size={13} /> {curso.nivel}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  {curso.descripcion && <p className="curso__desc">{curso.descripcion}</p>}

                  <footer className="curso__foot">
                    <span className="curso__horas">
                      <Icon name="reloj" size={14} /> {curso.horas ? `${curso.horas} h` : 'a tu ritmo'}
                    </span>
                    <span className={`curso__demanda curso__demanda--${dem.tono}`}>{dem.texto}</span>
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
      </div>
      </div>
    </>
  );
}
