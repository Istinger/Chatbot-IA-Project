import { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { useVista } from '../lib/vista';
import { ofertasGuardadas } from '../lib/ofertasGuardadas';
import Icon from '../components/Icon';
import JobCard from '../components/JobCard';

/**
 * Ofertas guardadas.
 *
 * Viven en localStorage (ver lib/ofertasGuardadas): se guardan desde el modal de
 * la oferta y esta pantalla las relee cuando cambia el Set compartido del Shell.
 */
export default function OfertasGuardadas() {
  const { perfil } = useAuth();
  const { guardadas, setOfertaActiva, setContextoPantalla, pedirIA } = useVista();
  const marcadas = useMemo(() => ofertasGuardadas(), [guardadas]);

  const skills = perfil?.skills ?? [];
  const skillsTexto = skills.join(', ') || '(ninguna todavia)';

  useEffect(() => {
    setContextoPantalla(
      marcadas.length
        ? `El usuario esta en "Ofertas guardadas". Tiene ${marcadas.length} ofertas guardadas: ${marcadas
            .map((j) => `${j.title} en ${j.company}${j.location ? ` (${j.location})` : ''}`)
            .join('; ')}.`
        : 'El usuario esta en "Ofertas guardadas" y todavia no ha guardado ninguna oferta.',
    );
    return () => setContextoPantalla(null);
  }, [marcadas, setContextoPantalla]);

  const comparar = () =>
    pedirIA(
      `Estas son las ofertas que tengo guardadas: ${marcadas
        .map((j) => `"${j.title}" en ${j.company}${j.location ? ` (${j.location})` : ''}`)
        .join('; ')}. Mis habilidades: ${skillsTexto}. Comparalas: cual me conviene mas y por que, y que me falta para cada una.`,
    );

  return (
    <>
      <header className="saludo">
        <h1>Ofertas guardadas</h1>
        <p className="saludo__sub">
          {marcadas.length
            ? `${marcadas.length} oferta${marcadas.length === 1 ? '' : 's'} guardada${marcadas.length === 1 ? '' : 's'}. Se quedan en este equipo.`
            : 'Aqui tendras a mano las ofertas que marques.'}
        </p>
      </header>

      {marcadas.length ? (
        <section className="guardadas__seccion">
          <header className="seccion__cab">
            <span className="seccion__icono"><Icon name="marcador" size={20} /></span>
            <div className="seccion__txt">
              <h2 className="seccion__titulo">Tus ofertas</h2>
              <p className="seccion__sub">
                {marcadas.length === 1 ? '1 oferta guardada' : `${marcadas.length} ofertas guardadas`}
              </p>
            </div>
            {marcadas.length > 1 && (
              <button type="button" className="perfil__iabtn" onClick={comparar}>
                <Icon name="asistente" size={16} /> Comparalas por mi
              </button>
            )}
          </header>

          <div className="guardadas__grid">
            {marcadas.map((j) => (
              <JobCard key={j.id} job={j} onOpen={setOfertaActiva} />
            ))}
          </div>
        </section>
      ) : (
        <div className="guardadas__vacio">
          <Icon name="marcador" size={22} />
          <div>
            <strong>Todavia no has guardado ofertas.</strong>
            <p>
              Abre una oferta desde <Link to="/">Inicio</Link> o <Link to="/buscar">Buscar</Link> y pulsa
              "Guardar oferta".
            </p>
          </div>
        </div>
      )}
    </>
  );
}
