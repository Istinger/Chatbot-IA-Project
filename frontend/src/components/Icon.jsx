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
  teclado: <><rect x="3" y="7" width="18" height="10" rx="2" /><path d="M7 11h.01M11 11h.01M15 11h.01M8 14h8" /></>,
  reloj: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  nivel: <><path d="M6 20v-6" /><path d="M12 20V8" /><path d="M18 20v-9" /></>,
  marcador: <path d="M6 3h12v18l-6-4-6 4z" />,
  estrella: <path d="m12 3 2.6 5.6L21 9.3l-4.5 4.2L17.5 21 12 17.8 6.5 21l1-7.5L3 9.3l6.4-.7z" />,
  filtros: <><path d="M4 5h16" /><path d="M7 12h10" /><path d="M10 19h4" /></>,
  sobre: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>,
  candado: <><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></>,
  ojo: <><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6z" /><circle cx="12" cy="12" r="3" /></>,
  ojoOff: <><path d="M4 4l16 16" /><path d="M9.5 9.5a3 3 0 0 0 4.2 4.2" /><path d="M6.6 6.6C3.8 8.2 2 12 2 12s3.5 6 10 6c1.8 0 3.4-.5 4.8-1.2" /><path d="M9.9 5.2A9.8 9.8 0 0 1 12 5c6.5 0 10 6 10 6a17 17 0 0 1-2.4 3" /></>,
  rejilla: <><rect x="4" y="4" width="7" height="7" rx="1" /><rect x="13" y="4" width="7" height="7" rx="1" /><rect x="4" y="13" width="7" height="7" rx="1" /><rect x="13" y="13" width="7" height="7" rx="1" /></>,
  lista: <><path d="M8 6h12M8 12h12M8 18h12" /><path d="M4 6h.01M4 12h.01M4 18h.01" /></>,
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
