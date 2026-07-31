import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useVista } from '../lib/vista';
import {
  IDEAS,
  guardarIdeasCache,
  ideasGuardadas,
  imagenIdea,
  leerEstadoIdeasCache,
} from '../lib/portafolio';
import Icon from '../components/Icon';
import PortTags from '../components/PortTags';
import PortCard from '../components/PortCard';
import { registrarAnimacion } from '../lib/animacion';

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
 * "Ideas para portafolio": un ranking elige 4 proyectos (1 destacado) usando
 * skills + brecha. La IA solo adapta los textos; si falla, se usa el catalogo.
 */
export default function Portafolio() {
  const [cacheInicial] = useState(() => leerEstadoIdeasCache());
  const [ideas, setIdeas] = useState(() => (cacheInicial.ideas.length ? cacheInicial.ideas : null));
  const [personalizado, setPersonalizado] = useState(cacheInicial.personalizado);
  const [error, setError] = useState(null);
  const guardadas = ideasGuardadas();
  const { setContextoPantalla } = useVista();

  useEffect(() => {
    let vivo = true;
    registrarAnimacion('portafolio_abierto', {});
    api
      .portafolioIdeas()
      .then((r) => {
        if (!vivo) return;
        setIdeas(r.ideas);
        setPersonalizado(Boolean(r.personalizado));
        guardarIdeasCache(r.ideas, {
          personalizado: r.personalizado,
          origen: r.proceso?.origen,
        }); // el detalle/asistente leen de aqui
        registrarAnimacion('portafolio_sugerido', {
          ideas: r.ideas.map((idea) => ({
            id: idea.id,
            titulo: idea.titulo,
            tipo: idea.tipo,
            skills: idea.skills,
            destacada: Boolean(idea.destacada),
            porQueTi: idea.porQueTi || null,
          })),
          skills: r.proceso?.skills || [],
          faltantes: r.proceso?.faltantes || [],
          catalogo: r.proceso?.catalogo || 50,
          origen: r.proceso?.origen || (r.personalizado ? 'openrouter' : 'respaldo'),
          personalizado: Boolean(r.personalizado),
          guardadas: ideasGuardadas().map((idea) => ({
            id: idea.id,
            titulo: idea.titulo,
          })),
        });
      })
      .catch((err) => {
        if (!vivo) return;
        // Si ya habia una respuesta local, se conserva sin interrumpir la vista.
        if (cacheInicial.ideas.length) return;
        // Ultimo respaldo del cliente: si la API ni responde, las estaticas.
        setError(err.message);
        setIdeas(IDEAS);
        registrarAnimacion('portafolio_sugerido', {
          ideas: IDEAS.map((idea) => ({
            id: idea.id,
            titulo: idea.titulo,
            tipo: idea.tipo,
            destacada: Boolean(idea.destacada),
          })),
          catalogo: IDEAS.length,
          origen: 'cliente_sin_api',
          personalizado: false,
          guardadas: ideasGuardadas().map((idea) => ({
            id: idea.id,
            titulo: idea.titulo,
          })),
        });
      });
    return () => {
      vivo = false;
    };
  }, [cacheInicial]);

  const cargando = ideas === null;
  const destacada = !cargando && (ideas.find((i) => i.destacada) || ideas[0]);
  const resto = !cargando ? ideas.filter((i) => i !== destacada) : [];
  const idsVisibles = new Set((ideas || []).map((idea) => idea.id));
  const guardadasNoRepetidas = guardadas.filter((idea) => !idsVisibles.has(idea.id));

  // El Asistente sabe que ideas tienes delante, para poder responder "cual me
  // conviene mas?" o "como empiezo la segunda" sin que se las expliques.
  useEffect(() => {
    if (!ideas?.length) return undefined;
    setContextoPantalla(
      `El usuario esta en "Ideas para portafolio"${
        personalizado ? ' (elegidas por afinidad y con texto adaptado a su perfil)' : ''
      }. Las ideas que ve son: ${ideas.map((i) => `${i.titulo} (${i.tipo})`).join('; ')}.`,
    );
    return () => setContextoPantalla(null);
  }, [ideas, personalizado, setContextoPantalla]);

  return (
    <div className="portlist">
      <header className="saludo">
        <h1>Ideas para portafolio</h1>
        <p className="saludo__sub">
          {cargando
            ? 'Buscando proyectos que encajen contigo…'
            : personalizado
            ? 'Proyectos elegidos por afinidad y explicados para tu perfil'
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

        {guardadasNoRepetidas.length ? (
          <div className="port-guardadas__grid">
            {guardadasNoRepetidas.map((idea) => (
              <PortCard key={idea.id} idea={idea} />
            ))}
          </div>
        ) : (
          <div className="port-guardadas__vacio">
            <Icon name="marcador" size={24} />
            {guardadas.length ? (
              <p>Tus ideas guardadas ya aparecen entre las recomendaciones de arriba.</p>
            ) : (
              <p>
                Aun no has guardado ninguna idea. Abre una y pulsa <strong>Guardar idea</strong>{' '}
                para tenerla aqui.
              </p>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
