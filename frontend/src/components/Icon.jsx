/**
 * Iconos SVG en linea. Nunca emojis: dependen de la fuente del sistema, no se
 * pueden tematizar y se ven distintos en cada plataforma.
 *
 * Un solo trazo (1.5) y un solo tamano base para que todo el set case.
 */
const RUTAS = {
  buscar: <><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>,
  inicio: <><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V20h14V9.5" /></>,
  maletin: <><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></>,
  usuario: <><circle cx="12" cy="8" r="4" /><path d="M4 20a8 8 0 0 1 16 0" /></>,
  salir: <><path d="M9 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h4" /><path d="m16 8 4 4-4 4" /><path d="M20 12H9" /></>,
  subir: <><path d="M12 16V4" /><path d="m7 9 5-5 5 5" /><path d="M4 17v2a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-2" /></>,
  cerrar: <><path d="m6 6 12 12" /><path d="M18 6 6 18" /></>,
  izquierda: <path d="m14 6-6 6 6 6" />,
  derecha: <path d="m10 6 6 6-6 6" />,
  brujula: <><circle cx="12" cy="12" r="9" /><path d="m15 9-2 4-4 2 2-4z" /></>,
  globo: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18" /><path d="M12 3a15 15 0 0 1 0 18a15 15 0 0 1 0-18" /></>,
  chispa: <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18" />,
  aviso: <><circle cx="12" cy="12" r="9" /><path d="M12 8v5" /><path d="M12 16h.01" /></>,
  ok: <><circle cx="12" cy="12" r="9" /><path d="m8 12 3 3 5-6" /></>,
  micro: <><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0" /><path d="M12 18v3" /></>,
  enviar: <><path d="M4 12h15" /><path d="m13 6 6 6-6 6" /></>,
  chispa2: <><path d="M12 3v18" /><path d="M3 12h18" /></>,
  asistente: <><circle cx="12" cy="12" r="4" /><circle cx="12" cy="12" r="9" opacity=".4" /></>,
  refrescar: <><path d="M20 12a8 8 0 1 1-2.3-5.6" /><path d="M20 4v5h-5" /></>,
  crecer: <><path d="M4 19h16" /><path d="m5 15 4-5 4 3 5-7" /><path d="M18 6h3v3" /></>,
  telegram: <><path d="M21 5 3 11l5 2 2 6 3-4 5 3z" /><path d="m8 13 8-6" /></>,
  enlace: <><path d="M10 13a4 4 0 0 0 6 .5l2-2a4 4 0 0 0-5.7-5.7l-1 1" /><path d="M14 11a4 4 0 0 0-6-.5l-2 2A4 4 0 0 0 11.7 18l1-1" /></>,
};

export default function Icon({ name, size = 20, className = '' }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {RUTAS[name]}
    </svg>
  );
}
