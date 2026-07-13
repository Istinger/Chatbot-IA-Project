import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import Icon from './Icon';

const RUTAS = [
  { to: '/', icono: 'inicio', texto: 'Inicio' },
  { to: '/buscar', icono: 'buscar', texto: 'Buscar' },
  { to: '/perfil', icono: 'usuario', texto: 'Perfil' },
];

/**
 * Navegacion tipo sistema operativo: rail lateral en escritorio, barra inferior
 * en movil (la regla de Material: maximo 5 destinos, siempre con icono Y texto;
 * los iconos solos matan la descubribilidad).
 */
export default function Shell() {
  const { salir } = useAuth();

  return (
    <div className="shell">
      <nav className="rail" aria-label="Navegacion principal">
        <span className="rail__marca" aria-hidden="true" />

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

        {/* Salir va separado del resto: es una accion destructiva de sesion y no
            debe quedar pegada a la navegacion normal. */}
        <button type="button" className="rail__link rail__salir" onClick={salir}>
          <Icon name="salir" />
          <span>Salir</span>
        </button>
      </nav>

      <main className="lienzo">
        <Outlet />
      </main>
    </div>
  );
}
