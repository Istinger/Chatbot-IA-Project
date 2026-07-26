import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { VistaProvider, useVista } from '../lib/vista';
import Icon from './Icon';
import AsistentePanel from './AsistentePanel';
import JobModal from './JobModal';

/**
 * Navegacion HIBRIDA (el asistente es el protagonista, no las pestañas):
 *
 *  - Escritorio: tres columnas -> rail de navegacion | contenido | Asistente
 *    (el Asistente vive SIEMPRE a la derecha).
 *  - Movil: contenido + barra inferior; el Asistente se abre como hoja a
 *    pantalla completa desde el boton central de la barra.
 *
 * Ya no hay pestaña "Asistente": esta siempre presente. La barra minima es solo
 * el respaldo para saltar entre zonas (Inicio, Buscar, Crecer, Perfil).
 */
const RUTAS = [
  { to: '/', icono: 'inicio', texto: 'Inicio' },
  { to: '/buscar', icono: 'buscar', texto: 'Buscar' },
  { to: '/crecer', icono: 'crecer', texto: 'Crecer' },
  { to: '/portafolio', icono: 'maletin', texto: 'Portafolio' },
  { to: '/entrevista', icono: 'entrevista', texto: 'Entrevista' },
  { to: '/ofertas-guardadas', icono: 'marcador', texto: 'Guardados' },
  { to: '/perfil', icono: 'usuario', texto: 'Perfil' },
];

/** Donde parte la barra de movil: mitad a cada lado del boton del Asistente. */
const CORTE = Math.ceil(RUTAS.length / 2);

/**
 * Rutas que se ven a PANTALLA COMPLETA: ocupan tambien la columna del Asistente.
 * La entrevista es un chat de por si; tener otro chat al lado confunde y parte la
 * atencion, asi que ahi el panel se oculta (en escritorio) y el chat se expande.
 */
const RUTAS_FULL = ['/entrevista'];

export default function Shell() {
  // El proveedor envuelve TODO el shell: la home (Outlet) y el asistente
  // comparten la misma "oferta activa", y el modal se monta una sola vez.
  return (
    <VistaProvider>
      <ShellInterno />
    </VistaProvider>
  );
}

function ShellInterno() {
  const { salir } = useAuth();
  const [asisAbierto, setAsisAbierto] = useState(false);
  const { ofertaActiva, setOfertaActiva } = useVista();
  const { pathname } = useLocation();

  // En las rutas "full" el contenido se come la columna del Asistente. El panel
  // se sigue MONTANDO (en movil es la hoja que abre la barra inferior); solo se
  // oculta por CSS en escritorio.
  const full = RUTAS_FULL.some((r) => pathname.startsWith(r));

  return (
    <div className={`shell ${full ? 'shell--full' : ''}`}>
      {/* Rail de navegacion (escritorio, izquierda) */}
      <nav className="rail" aria-label="Navegacion principal">
        {/* Marca: mismo orbe animado que el modo voz (anillo con halo + la onda
            SVG de dos trazos), a escala del rail. */}
        <span className="rail__marca" aria-hidden="true">
          <svg className="rail__marca-onda" viewBox="0 0 200 80" preserveAspectRatio="none">
            <path d="M0,40 Q25,10 50,40 T100,40 T150,40 T200,40" />
            <path className="rail__marca-onda2" d="M0,40 Q25,64 50,40 T100,40 T150,40 T200,40" />
          </svg>
        </span>
        <ul className="rail__lista">
          {RUTAS.map((r) => (
            <li key={r.to}>
              <NavLink to={r.to} end={r.to === '/'} className="rail__link">
                <Icon name={r.icono} />
                <span>{r.texto}</span>
              </NavLink>
            </li>
          ))}
        </ul>
        <button type="button" className="rail__link rail__salir" onClick={salir}>
          <Icon name="salir" />
          <span>Salir</span>
        </button>
      </nav>

      {/* Contenido */}
      <main className="lienzo">
        <Outlet />
      </main>

      {/* Asistente: fijo a la derecha en escritorio; hoja en movil. */}
      <div className={`asis-host ${asisAbierto ? 'asis-host--abierto' : ''}`}>
        <button
          type="button"
          className="asis-host__cerrar"
          onClick={() => setAsisAbierto(false)}
          aria-label="Cerrar asistente"
        >
          <Icon name="cerrar" size={20} />
        </button>
        <AsistentePanel />
      </div>

      {/* Barra inferior (solo movil) con el Asistente en el centro y las rutas
          repartidas a ambos lados (ver CORTE). */}
      <nav className="tabbar" aria-label="Navegacion">
        {RUTAS.slice(0, CORTE).map((r) => (
          <NavLink key={r.to} to={r.to} end={r.to === '/'} className="tabbar__link">
            <Icon name={r.icono} size={22} />
            <span>{r.texto}</span>
          </NavLink>
        ))}

        <button type="button" className="tabbar__asis" onClick={() => setAsisAbierto(true)}>
          <Icon name="asistente" size={26} />
          <span>Asistente</span>
        </button>

        {RUTAS.slice(CORTE).map((r) => (
          <NavLink key={r.to} to={r.to} className="tabbar__link">
            <Icon name={r.icono} size={22} />
            <span>{r.texto}</span>
          </NavLink>
        ))}
      </nav>

      {/* Modal unico y compartido: lo abren tanto las tarjetas de la home como
          las del chat, y el Asistente sabe que oferta esta activa. */}
      <JobModal job={ofertaActiva} onClose={() => setOfertaActiva(null)} />
    </div>
  );
}
