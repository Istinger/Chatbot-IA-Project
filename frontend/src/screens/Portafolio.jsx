import { Link } from 'react-router-dom';
import { IDEAS, imagenIdea } from '../lib/portafolio';
import Icon from '../components/Icon';
import PortTags from '../components/PortTags';

/**
 * "Ideas para portafolio": una idea destacada (grande) + el resto en una columna
 * de tarjetas. Cada una lleva a su caso de estudio (/portafolio/:id).
 */
export default function Portafolio() {
  const destacada = IDEAS.find((i) => i.destacada) || IDEAS[0];
  const resto = IDEAS.filter((i) => i !== destacada);

  return (
    <>
      <header className="saludo">
        <h1>Ideas para portafolio</h1>
        <p className="saludo__sub">
          {IDEAS.length} proyectos sugeridos para practicar y destacar
        </p>
      </header>

      <div className="port">
        <Link to={`/portafolio/${destacada.id}`} className="port-dest">
          <div
            className="port-dest__img"
            style={{ backgroundImage: `linear-gradient(150deg, ${destacada.tono[0]}, ${destacada.tono[1]})` }}
          >
            <img
              src={imagenIdea(destacada, 760, 720)}
              alt=""
              loading="lazy"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="port-dest__cuerpo">
            <span className="port__badge">Destacado</span>
            <h2>{destacada.titulo}</h2>
            <PortTags idea={destacada} />
            <p className="port-dest__desc">{destacada.resumen}</p>
            <span className="btn btn--primario port-dest__cta">
              Ver idea <Icon name="derecha" size={18} />
            </span>
          </div>
        </Link>

        <div className="port-lista">
          {resto.map((idea) => (
            <Link key={idea.id} to={`/portafolio/${idea.id}`} className="port-card">
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
          ))}
        </div>
      </div>
    </>
  );
}
