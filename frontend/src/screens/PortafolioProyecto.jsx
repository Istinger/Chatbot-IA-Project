import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  FASES,
  claveRespuesta,
  guardarNota,
  imagenIdea,
  itemCompleto,
  leerNota,
} from '../lib/portafolio';
import { useVista } from '../lib/vista';
import { usePortafolioIdea } from '../lib/usePortafolioIdea';
import Icon from '../components/Icon';

/**
 * Detalle de una tarea: worksheet: cada pregunta guia tiene su propio campo de
 * respuesta, con barra de progreso. La tarea se completa sola al responderlas
 * todas (no hay marca manual). Las respuestas se guardan en localStorage.
 *
 * Va con `key` = fase+item, asi al cambiar de tarea el componente se remonta y
 * las respuestas se re-leen.
 */
function DetalleItem({ ideaId, ideaTitulo, faseId, itemIndex, item, onVolver }) {
  const { pedirIA } = useVista();
  const [respuestas, setRespuestas] = useState(() => {
    const init = {};
    item.pasos.forEach((_, j) => {
      init[j] = leerNota(claveRespuesta(ideaId, faseId, itemIndex, j));
    });
    return init;
  });

  const cambiar = (j, valor) => {
    setRespuestas((prev) => ({ ...prev, [j]: valor }));
    guardarNota(claveRespuesta(ideaId, faseId, itemIndex, j), valor);
  };

  // Pide feedback de UNA pregunta al chat. El mensaje es autocontenido: la
  // pregunta y la respuesta viajan dentro, y se pide orientacion (no la respuesta).
  const pedirOrientacion = (j) => {
    const resp = (respuestas[j] || '').trim();
    pedirIA(
      [
        `Estoy en la tarea "${item.titulo}" de mi proyecto de portafolio "${ideaTitulo}".`,
        `Pregunta: "${item.pasos[j]}".`,
        resp ? `Mi respuesta actual: "${resp}".` : 'Todavia no la he respondido.',
        'Dame feedback y orientacion para responderla mejor. No la escribas por mi: solo guiame con preguntas o pistas.',
      ].join(' '),
    );
  };

  const total = item.pasos.length;
  const respondidas = item.pasos.filter((_, j) => (respuestas[j] || '').trim()).length;
  const completo = respondidas === total;
  const pct = total ? Math.round((respondidas / total) * 100) : 0;

  return (
    <div className="portproy__detalle">
      <button type="button" className="portproy__volver" onClick={onVolver}>
        <Icon name="izquierda" size={16} /> Volver a la fase
      </button>

      <div className="portproy__dethead">
        <span className="port-ico"><Icon name={item.icono} size={22} /></span>
        <h1 className="portproy__titulo">{item.titulo}</h1>
      </div>
      <p className="portproy__desc">{item.intro}</p>

      <div className="portproy__progreso">
        <div className="portproy__progtxt">
          <span>Tu avance</span>
          {completo ? (
            <span className="portproy__completado"><Icon name="ok" size={14} /> Completado</span>
          ) : (
            <span>{respondidas} de {total} respondidas</span>
          )}
        </div>
        <span className="barra">
          <span className="barra__fill" style={{ width: `${pct}%` }} />
        </span>
      </div>

      <p className="portproy__subtit">Responde para avanzar</p>
      <ol className="portproy__worksheet">
        {item.pasos.map((p, j) => {
          const resuelta = (respuestas[j] || '').trim();
          return (
            <li key={j} className={`portproy__preg ${resuelta ? 'is-resuelta' : ''}`}>
              <div className="portproy__pregcab">
                <span className="portproy__pregnum">
                  {resuelta ? <Icon name="ok" size={14} /> : j + 1}
                </span>
                <p>{p}</p>
              </div>
              <textarea
                className="portproy__resp"
                rows={2}
                placeholder="Tu respuesta… (se guarda sola)"
                value={respuestas[j] || ''}
                onChange={(e) => cambiar(j, e.target.value)}
              />
              <button type="button" className="portproy__pregia" onClick={() => pedirOrientacion(j)}>
                <Icon name="asistente" size={14} /> Pedir orientación a la IA
              </button>
            </li>
          );
        })}
      </ol>

      {item.tip && (
        <p className="portproy__tip">
          <Icon name="chispa" size={16} /> {item.tip}
        </p>
      )}

      <div className="portproy__nav">
        <button type="button" className="btn btn--glass" onClick={onVolver}>
          <Icon name="izquierda" size={18} /> Volver a la fase
        </button>
      </div>
    </div>
  );
}

/**
 * Asistente de proyecto: guia la idea por 4 fases. Cada tarea abre su worksheet
 * (preguntas con respuesta + progreso); la tarea se completa sola al responderlas
 * todas. El paso vive en estado local; "Continuar"/"Volver" navegan entre fases.
 */
export default function PortafolioProyecto() {
  const { id } = useParams();
  const navegar = useNavigate();
  const { idea, estado } = usePortafolioIdea(id);
  const [paso, setPaso] = useState(0);
  // Tarea cuyo detalle se muestra (o null = vista general de la fase).
  const [itemAbierto, setItemAbierto] = useState(null);

  // Cambiar de fase cierra el detalle abierto.
  const irAFase = (i) => {
    setPaso(i);
    setItemAbierto(null);
  };

  if (estado !== 'listo' || !idea) {
    return (
      <div className="portproy">
        <header className="port-cab">
          <Link to="/portafolio" className="iconbtn" aria-label="Volver"><Icon name="izquierda" /></Link>
          <span>Ideas para portafolio</span>
        </header>
        <p className="vacio">
          {estado === 'cargando' ? 'Cargando la idea…' : 'Esa idea no existe. Vuelve al listado.'}
        </p>
      </div>
    );
  }

  const fase = FASES[paso];
  const esUltimo = paso === FASES.length - 1;
  const degradado = `linear-gradient(150deg, ${idea.tono[0]}, ${idea.tono[1]})`;

  const hechasFase = fase.items.filter((it, i) => itemCompleto(idea.id, fase.id, it, i)).length;
  const todoHecho = hechasFase === fase.items.length;

  const anterior = () => (paso > 0 ? irAFase(paso - 1) : navegar(`/portafolio/${idea.id}`));
  const siguiente = () => (esUltimo ? navegar(`/portafolio/${idea.id}`) : irAFase(paso + 1));

  return (
    <div className="portproy">
      <header className="port-cab">
        <button type="button" className="iconbtn" onClick={() => navegar(`/portafolio/${idea.id}`)} aria-label="Volver">
          <Icon name="izquierda" />
        </button>
        <span>Ideas para portafolio</span>
      </header>

      <div className="portproy__cols">
        <aside className="portproy__lateral">
          <div className="portproy__media" style={{ backgroundImage: degradado }}>
            <img src={imagenIdea(idea, 420, 300)} alt="" loading="lazy" referrerPolicy="no-referrer" />
          </div>

          <div className="portproy__idea">
            <span className="port-ico"><Icon name={idea.icono} size={22} /></span>
            <div>
              <strong>{idea.titulo}</strong>
              <span>{idea.marca.nombre}</span>
            </div>
          </div>

          <div className="portproy__meta">
            <span><Icon name="globo" size={14} /> {idea.tipo}</span>
            <Icon name="derecha" size={12} className="portproy__metasep" />
            <span><Icon name="nivel" size={14} /> {idea.nivel}</span>
            <Icon name="derecha" size={12} className="portproy__metasep" />
            <span><Icon name="marcador" size={14} /> {idea.categoria}</span>
          </div>

          <ol className="portproy__pasos">
            {FASES.map((f, i) => (
              <li
                key={f.id}
                className={`portproy__paso ${i === paso ? 'is-activo' : ''} ${i < paso ? 'is-hecho' : ''}`}
              >
                <button type="button" onClick={() => irAFase(i)}>
                  <span className="portproy__num">{i < paso ? <Icon name="ok" size={16} /> : i + 1}</span>
                  {f.nombre}
                </button>
              </li>
            ))}
          </ol>
        </aside>

        <section className="portproy__panel">
          {itemAbierto === null ? (
            <>
              <p className="portproy__contador">Paso {paso + 1} de {FASES.length}</p>
              <h1 className="portproy__titulo">{fase.nombre}</h1>
              <p className="portproy__desc">{fase.descripcion}</p>

              <div className="portproy__faseprog">
                <span>Tareas de esta fase</span>
                <span className={`portproy__faseprog-cont ${todoHecho ? 'is-listo' : ''}`}>
                  {hechasFase}/{fase.items.length}
                </span>
              </div>

              <ul className="portproy__items">
                {fase.items.map((it, i) => {
                  const completo = itemCompleto(idea.id, fase.id, it, i);
                  return (
                    <li key={it.titulo}>
                      <button
                        type="button"
                        className={`portproy__item ${completo ? 'portproy__item--hecho' : ''}`}
                        onClick={() => setItemAbierto(i)}
                      >
                        <span className="port-ico port-ico--sm"><Icon name={it.icono} size={18} /></span>
                        <div className="portproy__itemtxt">
                          <h3>{it.titulo}</h3>
                          <p>{it.texto}</p>
                        </div>
                        <span className={`portproy__check ${completo ? 'is-on' : ''}`} aria-hidden="true">
                          <Icon name="ok" size={16} />
                        </span>
                        <Icon name="derecha" size={18} className="portproy__itemir" />
                      </button>
                    </li>
                  );
                })}
              </ul>

              <p className="portproy__subtit">Resultados de esta fase</p>
              <div className="portproy__resultados">
                {fase.resultados.map((r) => (
                  <div key={r.titulo} className="portproy__res">
                    <span className="port-ico port-ico--sm"><Icon name={r.icono} size={16} /></span>
                    <div>
                      <strong>{r.titulo}</strong>
                      <p>{r.texto}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="portproy__nav">
                <button type="button" className="btn btn--glass" onClick={anterior}>
                  <Icon name="izquierda" size={18} /> Volver
                </button>
                <button
                  type="button"
                  className={`btn btn--primario ${todoHecho ? 'is-listo' : ''}`}
                  onClick={siguiente}
                >
                  {esUltimo ? (
                    <>Terminar <Icon name="ok" size={18} /></>
                  ) : (
                    <>Continuar <Icon name="derecha" size={18} /></>
                  )}
                </button>
              </div>
            </>
          ) : (
            <DetalleItem
              key={`${fase.id}-${itemAbierto}`}
              ideaId={idea.id}
              ideaTitulo={idea.titulo}
              faseId={fase.id}
              itemIndex={itemAbierto}
              item={fase.items[itemAbierto]}
              onVolver={() => setItemAbierto(null)}
            />
          )}
        </section>
      </div>
    </div>
  );
}
