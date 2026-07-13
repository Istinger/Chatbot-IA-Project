import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, ApiError } from '../lib/api';
import { useAuth } from '../lib/auth';
import { nombreDe } from '../lib/format';
import Carousel from '../components/Carousel';
import JobCard from '../components/JobCard';
import JobModal from '../components/JobModal';
import Icon from '../components/Icon';

function Esqueleto() {
  // Reservar el espacio evita el salto de layout (CLS) cuando llegan los datos.
  return (
    <div className="carrusel__pista">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="card card--esqueleto" aria-hidden="true" />
      ))}
    </div>
  );
}

export default function Home() {
  const { perfil } = useAuth();

  const [recomendadas, setRecomendadas] = useState(null);
  const [exterior, setExterior] = useState(null);
  const [locales, setLocales] = useState(null);
  const [sinPerfil, setSinPerfil] = useState(false);
  const [abierta, setAbierta] = useState(null);

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
  }, []);

  const verBusqueda = (
    <Link to="/buscar" className="btn btn--texto">
      Buscar
    </Link>
  );

  return (
    <>
      <header className="saludo">
        <h1>Hola {nombreDe(perfil?.email) || 'de nuevo'}</h1>
        <p className="saludo__sub">Esto es lo que encontramos para ti hoy.</p>
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

      <Carousel
        titulo="Recomendadas para ti"
        subtitulo="Ordenadas por afinidad con tu perfil"
        accion={verBusqueda}
      >
        {recomendadas === null ? (
          <Esqueleto />
        ) : recomendadas.length ? (
          recomendadas.map((j) => <JobCard key={j.id} job={j} onOpen={setAbierta} />)
        ) : (
          <p className="vacio">Todavia no hay recomendaciones. Completa tu perfil.</p>
        )}
      </Carousel>

      <Carousel titulo="En el exterior" subtitulo="Remoto: puedes postular desde Ecuador">
        {exterior === null ? (
          <Esqueleto />
        ) : exterior.length ? (
          exterior.map((j) => <JobCard key={j.id} job={j} onOpen={setAbierta} />)
        ) : (
          <p className="vacio">No hay ofertas del exterior ahora mismo.</p>
        )}
      </Carousel>

      <Carousel titulo="Cerca de ti" subtitulo="Ofertas en Ecuador">
        {locales === null ? (
          <Esqueleto />
        ) : locales.length ? (
          locales.map((j) => <JobCard key={j.id} job={j} onOpen={setAbierta} />)
        ) : (
          <p className="vacio">
            Todavia no tenemos ofertas locales: las fuentes disponibles no cubren
            Ecuador. Mientras tanto, mira las remotas.
          </p>
        )}
      </Carousel>

      <JobModal job={abierta} onClose={() => setAbierta(null)} />
    </>
  );
}
