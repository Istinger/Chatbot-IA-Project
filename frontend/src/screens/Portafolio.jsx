import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { IDEAS, guardarIdeasCache, ideasGuardadas, imagenIdea } from '../lib/portafolio';
import Icon from '../components/Icon';
import PortTags from '../components/PortTags';

/** Tarjeta compacta de una idea (columna lateral y apartado de guardadas). */
function PortCard({ idea }) {
  return (
    <Link to={`/portafolio/${idea.id}`} className="port-card">
      <div
        className="port-card__img"
        style={{ backgroundImage: `linear-gradient(150deg, ${idea.tono[0]}, ${idea.tono[1]})` }}
      >
        <img src={imagenIdea(idea, 360, 240)} alt="" loading="lazy" referrerPolicy="no-referrer" />
      </div>
      <div className="port-card__cuerpo">
        <h3>{idea.titulo}</h3>
        <PortTags idea={idea} sm />
        <p className="port-card__desc">{idea.resumen}</p>
      </div>
      <Icon name="derecha" size={18} className="port-card__flecha" />
    </Link>
  );
}

function Esqueleto() {
  return (
    <div className="port">
      <div className="port-dest port-dest--esqueleto card--esqueleto" aria-hidden="true" />
      <div className="port-lista">
        {[0, 1, 2].map((i) => (
          <div key={i} className="port-card port-card--esqueleto card--esqueleto" aria-hidden="true" />
        ))}
      </div>
    </div>
  );
}

/**
 * "Ideas para portafolio": la IA sugiere 4 proyectos (1 destacado) adaptados al
 * perfil del aplicante (skills + brecha). Las pide al backend, que las cachea; si
 * no hay perfil o el LLM falla, el backend responde con el catalogo (no rompe).
 */
export default function Portafolio() {
  const [ideas, setIdeas] = useState(null); // null = cargando
  const [personalizado, setPersonalizado] = useState(false);
  const [error, setError] = useState(null);
  const guardadas = ideasGuardadas();

  useEffect(() => {
    let vivo = true;
    api
      .portafolioIdeas()
      .then((r) => {
        if (!vivo) return;
        setIdeas(r.ideas);
        setPersonalizado(Boolean(r.personalizado));
        guardarIdeasCache(r.ideas); // el detalle/asistente leen de aqui
      })
      .catch((err) => {
        if (!vivo) return;
        // Ultimo respaldo del cliente: si la API ni responde, las estaticas.
        setError(err.message);
        setIdeas(IDEAS);
      });
    return () => {
      vivo = false;
    };
  }, []);

  const cargando = ideas === null;
  const destacada = !cargando && (ideas.find((i) => i.destacada) || ideas[0]);
  const resto = !cargando ? ideas.filter((i) => i !== destacada) : [];

  return (
    <div className="portlist">
      <header className="saludo">
        <h1>Ideas para portafolio</h1>
        <p className="saludo__sub">
          {cargando
            ? 'Buscando proyectos que encajen contigo…'
            : personalizado
            ? 'Proyectos elegidos por la IA para tu perfil y lo que te falta'
            : `${ideas.length} proyectos sugeridos para practicar y destacar`}
        </p>
        {personalizado && (
          <span className="port-pill">
            <Icon name="chispa" size={14} /> Personalizado para tu perfil
          </span>
        )}
      </header>

      {error && (
        <p className="alerta" role="alert">
          <Icon name="aviso" size={16} />
          No pudimos personalizar ahora mismo; te mostramos ideas base.
        </p>
      )}

      {cargando ? (
        <Esqueleto />
      ) : (
        <div className="port">
          <Link to={`/portafolio/${destacada.id}`} className="port-dest">
            <div
              className="port-dest__img"
              style={{ backgroundImage: `linear-gradient(150deg, ${destacada.tono[0]}, ${destacada.tono[1]})` }}
            >
              <img src={imagenIdea(destacada, 760, 720)} alt="" loading="lazy" referrerPolicy="no-referrer" />
            </div>
            <div className="port-dest__cuerpo">
              <span className="port__badge">Destacado</span>
              <h2>{destacada.titulo}</h2>
              <PortTags idea={destacada} />
              <p className="port-dest__desc">{destacada.resumen}</p>
              {destacada.porQueTi && (
                <p className="port-dest__porque">
                  <Icon name="chispa" size={14} /> {destacada.porQueTi}
                </p>
              )}
              <span className="btn btn--primario port-dest__cta">
                Ver idea <Icon name="derecha" size={18} />
              </span>
            </div>
          </Link>

          <div className="port-lista">
            {resto.map((idea) => (
              <PortCard key={idea.id} idea={idea} />
            ))}
          </div>
        </div>
      )}

      <section className="port-guardadas">
        <header className="seccion__cab">
          <span className="seccion__icono"><Icon name="marcador" size={20} /></span>
          <div className="seccion__txt">
            <h2 className="seccion__titulo">Tus ideas guardadas</h2>
            <p className="seccion__sub">Las ideas que guardaste para tenerlas a mano.</p>
          </div>
        </header>

        {guardadas.length ? (
          <div className="port-guardadas__grid">
            {guardadas.map((idea) => (
              <PortCard key={idea.id} idea={idea} />
            ))}
          </div>
        ) : (
          <div className="port-guardadas__vacio">
            <Icon name="marcador" size={24} />
            <p>
              Aun no has guardado ninguna idea. Abre una y pulsa <strong>Guardar idea</strong>{' '}
              para tenerla aqui.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
