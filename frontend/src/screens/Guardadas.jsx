import { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { useVista } from '../lib/vista';
import { ofertasGuardadas } from '../lib/ofertasGuardadas';
import { ideasGuardadas } from '../lib/portafolio';
import Icon from '../components/Icon';
import JobCard from '../components/JobCard';
import PortCard from '../components/PortCard';

/**
 * Todo lo que el usuario marco, en un solo sitio: ofertas e ideas de portafolio.
 *
 * Las dos cosas viven en localStorage (ver lib/ofertasGuardadas y lib/portafolio):
 * el modelo `Application` existe en la base pero no hay endpoint que lo use. Por
 * eso el aviso de que se quedan en este equipo — no es un detalle menor si el
 * usuario cambia de movil.
 *
 * Las ideas siguen apareciendo tambien al pie de "Portafolio": alli rellenan el
 * hueco bajo el listado, que es para lo que se pusieron.
 */
export default function Guardadas() {
  const { perfil } = useAuth();
  const { guardadas, setOfertaActiva, setContextoPantalla, pedirIA } = useVista();
  // Se releen de disco cuando cambia el Set del contexto: asi la lista reacciona
  // a guardar o quitar desde el modal sin recargar la pantalla.
  const marcadas = useMemo(() => ofertasGuardadas(), [guardadas]);
  const ideas = ideasGuardadas();

  const skills = perfil?.skills ?? [];
  const skillsTexto = skills.join(', ') || '(ninguna todavia)';
  const vacio = !marcadas.length && !ideas.length;

  // El asistente sabe que tienes aqui delante: "cual me conviene?" funciona sin
  // que se lo dictes.
  useEffect(() => {
    const partes = [];
    if (marcadas.length)
      partes.push(
        `${marcadas.length} ofertas guardadas: ${marcadas
          .map((j) => `${j.title} en ${j.company}${j.location ? ` (${j.location})` : ''}`)
          .join('; ')}`,
      );
    if (ideas.length)
      partes.push(`${ideas.length} ideas de portafolio guardadas: ${ideas.map((i) => i.titulo).join('; ')}`);

    setContextoPantalla(
      partes.length
        ? `El usuario esta en "Guardados", viendo lo que ha marcado. Tiene ${partes.join('. Y ')}.`
        : 'El usuario esta en "Guardados" y todavia no ha marcado nada.',
    );
    return () => setContextoPantalla(null);
    // ideas se relee en cada render; con marcadas basta para reaccionar a los
    // cambios que ocurren sin salir de la pantalla.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        <h1>Guardados</h1>
        <p className="saludo__sub">
          {vacio
            ? 'Aqui tendras a mano las ofertas y las ideas que marques.'
            : 'Lo que has marcado para tenerlo a mano. Se queda en este equipo.'}
        </p>
      </header>

      {vacio ? (
        <div className="guardadas__vacio">
          <Icon name="marcador" size={22} />
          <div>
            <strong>Todavia no has guardado nada.</strong>
            <p>
              Abre una oferta y pulsa "Guardar oferta", o marca una idea en{' '}
              <Link to="/portafolio">Portafolio</Link>.
            </p>
          </div>
        </div>
      ) : (
        <>
          {marcadas.length > 0 && (
            <section className="guardadas__seccion">
              <header className="seccion__cab">
                <span className="seccion__icono"><Icon name="marcador" size={20} /></span>
                <div className="seccion__txt">
                  <h2 className="seccion__titulo">Ofertas</h2>
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
          )}

          {ideas.length > 0 && (
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
          )}
        </>
      )}
    </>
  );
}
