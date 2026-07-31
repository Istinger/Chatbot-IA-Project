import { Link } from 'react-router-dom';
import { imagenIdea } from '../lib/portafolio';
import Icon from './Icon';
import PortTags from './PortTags';

/**
 * Tarjeta compacta de una idea de portafolio.
 *
 * Vive aqui y no dentro de Portafolio porque la usan dos pantallas: el listado
 * de "Portafolio" (columna lateral y apartado de guardadas) y "Guardados".
 */
export default function PortCard({ idea }) {
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
