import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { FASES, claveNota, guardarNota, ideaPorId, imagenIdea, leerNota } from '../lib/portafolio';
import Icon from '../components/Icon';

/**
 * Detalle de un item de fase: guia accionable + notas del usuario.
 *
 * Va con `key` = clave de la nota, asi al cambiar de item el componente se
 * remonta y la nota se re-lee de localStorage.
 */
function DetalleItem({ clave, item, hecho, onToggle, onVolver }) {
  const [nota, setNota] = useState(() => leerNota(clave));

  const cambiar = (e) => {
    setNota(e.target.value);
    guardarNota(clave, e.target.value);
  };

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

      <p className="portproy__subtit">Cómo abordarlo</p>
      <ol className="portproy__guia">
        {item.pasos.map((p, i) => (
          <li key={i}>{p}</li>
        ))}
      </ol>

      {item.tip && (
        <p className="portproy__tip">
          <Icon name="chispa" size={16} /> {item.tip}
        </p>
      )}

      <label className="portproy__notaslbl" htmlFor="nota-item">Tus notas</label>
      <textarea
        id="nota-item"
        className="portproy__notas"
        placeholder="Escribe aquí tus respuestas, ideas o avances… (se guardan solas)"
        value={nota}
        onChange={cambiar}
      />

      <div className="portproy__nav">
        <button type="button" className="btn btn--glass" onClick={onVolver}>
          <Icon name="izquierda" size={18} /> Volver
        </button>
        <button
          type="button"
          className={`btn ${hecho ? 'btn--glass' : 'btn--primario'}`}
          onClick={onToggle}
          aria-pressed={hecho}
        >
          {hecho ? <>Hecho <Icon name="ok" size={18} /></> : <>Marcar como hecho <Icon name="ok" size={18} /></>}
        </button>
      </div>
    </div>
  );
}

/**
 * Asistente de proyecto: guia la idea por 4 fases (Analisis, Preproduccion,
 * Pruebas, Ejecucion). Cada item de una fase abre su propio detalle (guia +
 * notas). El paso vive en estado local; "Continuar"/"Volver" navegan entre fases.
 */
export default function PortafolioProyecto() {
  const { id } = useParams();
  const navegar = useNavigate();
  const idea = ideaPorId(id);
  const [paso, setPaso] = useState(0);
  // Item cuyo detalle se muestra (o null = vista general de la fase).
  const [itemAbierto, setItemAbierto] = useState(null);
  // Tareas marcadas por el usuario, por fase+item.
  const [hechos, setHechos] = useState(() => new Set());

  const alternarItem = (faseId, i) =>
    setHechos((prev) => {
      const s = new Set(prev);
      const clave = `${faseId}-${i}`;
      if (s.has(clave)) s.delete(clave);
      else s.add(clave);
      return s;
    });

  // Cambiar de fase cierra el detalle abierto.
  const irAFase = (i) => {
    setPaso(i);
    setItemAbierto(null);
  };

  if (!idea) {
    return (
      <div className="portproy">
        <header className="port-cab">
          <Link to="/portafolio" className="iconbtn" aria-label="Volver"><Icon name="izquierda" /></Link>
          <span>Ideas para portafolio</span>
        </header>
        <p className="vacio">Esa idea no existe. Vuelve al listado.</p>
      </div>
    );
  }

  const fase = FASES[paso];
  const esUltimo = paso === FASES.length - 1;
  const degradado = `linear-gradient(150deg, ${idea.tono[0]}, ${idea.tono[1]})`;

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

              <ul className="portproy__items">
                {fase.items.map((it, i) => {
                  const hecho = hechos.has(`${fase.id}-${i}`);
                  return (
                    <li key={it.titulo}>
                      <button
                        type="button"
                        className={`portproy__item ${hecho ? 'portproy__item--hecho' : ''}`}
                        onClick={() => setItemAbierto(i)}
                      >
                        <span className="port-ico port-ico--sm"><Icon name={it.icono} size={18} /></span>
                        <div className="portproy__itemtxt">
                          <h3>{it.titulo}</h3>
                          <p>{it.texto}</p>
                        </div>
                        <span className={`portproy__check ${hecho ? 'is-on' : ''}`} aria-hidden="true">
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
                <button type="button" className="btn btn--primario" onClick={siguiente}>
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
              clave={claveNota(idea.id, fase.id, itemAbierto)}
              item={fase.items[itemAbierto]}
              hecho={hechos.has(`${fase.id}-${itemAbierto}`)}
              onToggle={() => alternarItem(fase.id, itemAbierto)}
              onVolver={() => setItemAbierto(null)}
            />
          )}
        </section>
      </div>
    </div>
  );
}
