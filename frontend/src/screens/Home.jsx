import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, ApiError } from '../lib/api';
import { useVista } from '../lib/vista';
import JobCard from '../components/JobCard';
import Icon from '../components/Icon';
import Refrescar from '../components/Refrescar';

export default function Home() {
  const [recomendadas, setRecomendadas] = useState(null);
  const [exterior, setExterior] = useState(null);
  const [locales, setLocales] = useState(null);
  const [sinPerfil, setSinPerfil] = useState(false);
  const [version, recargar] = useState(0);
  // Filas EXTRA de ofertas en la primera pagina. En pantallas altas la fila
  // principal deja mucho hueco; se rellena con las filas que quepan (ver efecto).
  const [filasExtra, setFilasExtra] = useState(0);
  // La oferta abierta vive en el contexto compartido: asi el Asistente sabe
  // cual estas viendo. El modal se monta una sola vez en el Shell.
  const { setOfertaActiva } = useVista();

  useEffect(() => {
    const calcular = () => {
      // Como MUCHO una fila extra (2 filas en total): mas romperia el scroll-snap
      // de la primera pagina. Y solo se añade si las 2 filas caben ENTERAS en el
      // viewport, para que no asome una tercera ni desborde la pagina.
      if (window.innerWidth < 861) {
        setFilasExtra(0);
        return;
      }
      const CHROME = 210; // cabecera + nota "haz scroll" + margenes
      const FILA = 430; // alto real de una fila de tarjetas (imagen + cuerpo)
      const filasQueCaben = Math.floor((window.innerHeight - CHROME) / FILA);
      setFilasExtra(filasQueCaben >= 2 ? 1 : 0);
    };
    calcular();
    window.addEventListener('resize', calcular);
    return () => window.removeEventListener('resize', calcular);
  }, []);

  useEffect(() => {
    let vivo = true;

    api
      .recomendadas(12)
      .then((r) => vivo && setRecomendadas(r.jobs))
      .catch((err) => {
        if (!vivo) return;
        // 409 = el perfil aun no tiene embedding. No es un error: es un usuario
        // que no ha terminado el onboarding.
        if (err instanceof ApiError && err.status === 409) setSinPerfil(true);
        setRecomendadas([]);
      });

    api.ofertas({ scope: 'foreign', limit: 12 }).then((r) => vivo && setExterior(r.jobs));
    api.ofertas({ scope: 'local', limit: 12 }).then((r) => vivo && setLocales(r.jobs));

    return () => {
      vivo = false;
    };
  }, [version]);

  const cargando = recomendadas === null;
  const destacada = recomendadas?.[0];
  const chicas = recomendadas?.slice(1, 4) ?? [];

  // "Mas ofertas": el resto de recomendadas + exterior + locales, sin repetir.
  // Asi la home conserva el valor de exterior/local que el mock no muestra.
  const vistos = new Set(recomendadas?.slice(0, 4).map((j) => j.id));
  const mas = [];
  for (const j of [...(recomendadas?.slice(4) ?? []), ...(exterior ?? []), ...(locales ?? [])]) {
    if (j && !vistos.has(j.id)) {
      vistos.add(j.id);
      mas.push(j);
    }
  }

  // Las que suben a la primera pagina para rellenar el hueco, y las que quedan
  // para "Mas ofertas".
  const extras = mas.slice(0, filasExtra * 4);
  const masRestante = mas.slice(filasExtra * 4);

  return (
    <>
      {/* Pagina 1: "Ofertas nuevas" — una fila de 4 (destacada + 3). El contenido
          va dentro de .ofertas-blink: un wrapper "sticky" que se queda fijo en la
          columna mientras la seccion scrollea, y se funde (blink) con la scroll
          timeline de la seccion. Ver .ofertas-pagina--blink en ui.css. */}
      <section className="ofertas-pagina ofertas-pagina--blink">
       <div className="ofertas-blink">
        <header className="ofertas__cab">
          <div>
            <h1>Ofertas nuevas</h1>
            <p className="saludo__sub">
              {cargando
                ? 'Buscando lo mejor para ti…'
                : recomendadas.length
                ? `${recomendadas.length} oportunidades encontradas para ti`
                : 'Aun no hay recomendaciones para ti'}
            </p>
            <Refrescar onFin={() => recargar((n) => n + 1)} />
          </div>
        </header>

        {sinPerfil && (
          <div className="aviso-panel">
            <Icon name="aviso" size={20} />
            <div>
              <strong>Aun no sabemos que buscas.</strong>
              <p>Sube tu CV o dinos tus habilidades para recibir recomendaciones.</p>
            </div>
            <Link to="/onboarding" className="btn btn--primario">
              Completar perfil
            </Link>
          </div>
        )}

        {cargando ? (
          <div className="ofertas__fila">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="card card--esqueleto" aria-hidden="true" />
            ))}
          </div>
        ) : recomendadas.length ? (
          <div className="ofertas__fila">
            <JobCard job={destacada} onOpen={setOfertaActiva} destacada />
            {chicas.map((j) => (
              <JobCard key={j.id} job={j} onOpen={setOfertaActiva} />
            ))}
          </div>
        ) : (
          <p className="vacio">Todavia no hay recomendaciones. Completa tu perfil.</p>
        )}

        {/* Filas extra: rellenan el hueco vertical en pantallas altas. */}
        {!cargando && extras.length > 0 && (
          <div className="ofertas__fila ofertas__fila--extra">
            {extras.map((j) => (
              <JobCard key={j.id} job={j} onOpen={setOfertaActiva} />
            ))}
          </div>
        )}

        {masRestante.length > 0 && (
          <p className="ofertas__scroll" aria-hidden="true">
            <Icon name="derecha" size={18} className="ofertas__scroll-flecha" />
            Haz scroll para ver mas ofertas
          </p>
        )}
       </div>
      </section>

      {/* Pagina 2: "Mas ofertas" — rejilla de 4 columnas. */}
      {masRestante.length > 0 && (
        <section className="ofertas-pagina ofertas__mas">
          <div>
            <h2 className="carrusel__title">Mas ofertas</h2>
            <p className="saludo__sub">Sigue explorando oportunidades para ti</p>
          </div>
          <div className="ofertas__rejilla">
            {masRestante.slice(0, 12).map((j) => (
              <JobCard key={j.id} job={j} onOpen={setOfertaActiva} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
