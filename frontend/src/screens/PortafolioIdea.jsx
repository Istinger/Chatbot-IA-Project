import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { alternarGuardada, idsGuardadas, imagenIdea } from '../lib/portafolio';
import { usePortafolioIdea } from '../lib/usePortafolioIdea';
import Icon from '../components/Icon';
import PortTags from '../components/PortTags';

// Las cuatro secciones del caso de estudio (mock). Icono + campo del detalle.
const SECCIONES = [
  { icono: 'ojo', titulo: 'Objetivo', campo: 'objetivo' },
  { icono: 'chispa', titulo: 'Qué vas a crear', campo: 'queCrear' },
  { icono: 'rejilla', titulo: 'Entregables', campo: 'entregables' },
  { icono: 'crecer', titulo: 'Cómo te ayuda en tu portafolio', campo: 'portafolio' },
];

export default function PortafolioIdea() {
  const { id } = useParams();
  const navegar = useNavigate();
  const { idea, estado } = usePortafolioIdea(id);
  const [guardada, setGuardada] = useState(() => idsGuardadas().has(id));

  if (estado !== 'listo' || !idea) {
    return (
      <div className="portidea">
        <header className="port-cab">
          <Link to="/portafolio" className="iconbtn" aria-label="Volver"><Icon name="izquierda" /></Link>
          <span>Ideas para portafolio</span>
        </header>
        {estado === 'cargando' ? (
          <p className="vacio">Cargando la idea…</p>
        ) : (
          <p className="vacio">Esa idea no existe. Vuelve al listado.</p>
        )}
      </div>
    );
  }

  const alternarGuardar = () => setGuardada(alternarGuardada(id));

  const degradado = `linear-gradient(150deg, ${idea.tono[0]}, ${idea.tono[1]})`;

  return (
    <div className="portidea">
      <header className="port-cab">
        <button type="button" className="iconbtn" onClick={() => navegar('/portafolio')} aria-label="Volver">
          <Icon name="izquierda" />
        </button>
        <span>Ideas para portafolio</span>
      </header>

      <div className="portidea__cols">
        <div className="portidea__media" style={{ backgroundImage: degradado }}>
          <img src={imagenIdea(idea, 760, 900)} alt="" loading="lazy" referrerPolicy="no-referrer" />
          <div className="portidea__marca">
            <span className="port-ico"><Icon name={idea.icono} size={22} /></span>
            <div>
              <strong>{idea.marca.nombre}</strong>
              <span>{idea.marca.sub}</span>
            </div>
          </div>
        </div>

        <div className="portidea__info">
          <span className="port-chip"><Icon name="marcador" size={14} /> {idea.categoria}</span>
          <h1 className="portidea__titulo">{idea.titulo}</h1>
          <PortTags idea={idea} />
          <p className="portidea__desc">{idea.descripcion}</p>

          <div className="portidea__secciones">
            {SECCIONES.map((s) => (
              <div key={s.campo} className="portidea__sec">
                <span className="port-ico port-ico--sm"><Icon name={s.icono} size={18} /></span>
                <div>
                  <h3>{s.titulo}</h3>
                  <p>{idea.detalle[s.campo]}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <footer className="portidea__acciones">
        <button
          type="button"
          className="btn btn--primario"
          onClick={() => navegar(`/portafolio/${idea.id}/proyecto`)}
        >
          <Icon name="chispa2" size={18} /> Empezar proyecto
        </button>
        <button type="button" className="btn btn--glass" onClick={alternarGuardar} aria-pressed={guardada}>
          <Icon name="marcador" size={18} /> {guardada ? 'Idea guardada' : 'Guardar idea'}
        </button>
        <button type="button" className="btn btn--glass" onClick={() => navegar('/portafolio')}>
          <Icon name="izquierda" size={18} /> Volver
        </button>
      </footer>
    </div>
  );
}
