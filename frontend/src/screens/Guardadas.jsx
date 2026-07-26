import { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useVista } from '../lib/vista';
import { ideasGuardadas } from '../lib/portafolio';
import Icon from '../components/Icon';
import PortCard from '../components/PortCard';

/**
 * Ideas de portafolio guardadas.
 *
 * Las ofertas guardadas viven en su propia pestaña (/ofertas-guardadas). Esta
 * ruta queda para conservar el acceso a las ideas marcadas desde Portafolio.
 */
export default function Guardadas() {
  const { setContextoPantalla } = useVista();
  const ideas = useMemo(() => ideasGuardadas(), []);

  useEffect(() => {
    setContextoPantalla(
      ideas.length
        ? `El usuario esta en "Ideas guardadas", viendo ${ideas.length} ideas de portafolio: ${ideas.map((i) => i.titulo).join('; ')}.`
        : 'El usuario esta en "Ideas guardadas" y todavia no ha marcado ninguna idea.',
    );
    return () => setContextoPantalla(null);
  }, [ideas, setContextoPantalla]);

  return (
    <>
      <header className="saludo">
        <h1>Ideas guardadas</h1>
        <p className="saludo__sub">
          {ideas.length
            ? 'Tus ideas de portafolio marcadas. Se quedan en este equipo.'
            : 'Aqui tendras a mano las ideas de portafolio que marques.'}
        </p>
      </header>

      {ideas.length ? (
        <section className="guardadas__seccion">
          <header className="seccion__cab">
            <span className="seccion__icono seccion__icono--cursos">
              <Icon name="chispa" size={20} />
            </span>
            <div className="seccion__txt">
              <h2 className="seccion__titulo">Ideas para portafolio</h2>
              <p className="seccion__sub">
                {ideas.length === 1 ? '1 idea guardada' : `${ideas.length} ideas guardadas`}
              </p>
            </div>
          </header>

          <div className="port-guardadas__grid">
            {ideas.map((idea) => (
              <PortCard key={idea.id} idea={idea} />
            ))}
          </div>
        </section>
      ) : (
        <div className="guardadas__vacio">
          <Icon name="marcador" size={22} />
          <div>
            <strong>Todavia no has guardado nada.</strong>
            <p>
              Marca una idea en <Link to="/portafolio">Portafolio</Link>.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
