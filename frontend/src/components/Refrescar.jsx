import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../lib/api';
import Icon from './Icon';

/** "hace 5 min", "hace 3 h", "hace 2 dias". */
function hace(iso) {
  if (!iso) return null;
  const seg = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seg < 60) return 'hace unos segundos';
  if (seg < 3600) return `hace ${Math.floor(seg / 60)} min`;
  if (seg < 86400) return `hace ${Math.floor(seg / 3600)} h`;
  return `hace ${Math.floor(seg / 86400)} d`;
}

/**
 * Estado de las ofertas + boton de refresco.
 *
 * El worker las refresca solo cada INGESTA_HORAS, pero el usuario quiere poder
 * pedirlo AHORA. El backend encola el trabajo (tarda minutos), asi que aqui se
 * sondea el estado hasta que termina, en vez de dejar un spinner colgado.
 */
export default function Refrescar({ onFin }) {
  const [estado, setEstado] = useState(null);
  const [mensaje, setMensaje] = useState(null);
  const timer = useRef(null);

  const cargar = useCallback(async () => {
    try {
      const e = await api.estadoOfertas();
      setEstado(e);
      return e;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    cargar();
    return () => clearInterval(timer.current);
  }, [cargar]);

  // Mientras haya una ingesta en curso, se sondea cada 5 s.
  useEffect(() => {
    clearInterval(timer.current);
    if (!estado?.enCurso) return undefined;

    timer.current = setInterval(async () => {
      const e = await cargar();
      if (e && !e.enCurso) {
        clearInterval(timer.current);
        setMensaje(`Listo: ahora hay ${e.total} ofertas.`);
        onFin?.();
      }
    }, 5000);

    return () => clearInterval(timer.current);
  }, [estado?.enCurso, cargar, onFin]);

  const refrescar = async () => {
    setMensaje(null);
    try {
      const r = await api.refrescarOfertas();
      setMensaje(r.mensaje);
      setEstado((p) => ({ ...p, enCurso: true }));
    } catch (err) {
      // 429 = enfriamiento, 409 = ya hay una en curso. No son errores feos: son
      // informacion util, y se muestran tal cual.
      setMensaje(err.message);
    }
  };

  if (!estado) return null;

  return (
    <div className="refrescar">
      <span className="refrescar__info">
        {estado.total} ofertas
        {estado.ultimaActualizacion && ` · actualizadas ${hace(estado.ultimaActualizacion)}`}
        {` · se refrescan solas cada ${estado.cadaHoras} h`}
      </span>

      <button
        type="button"
        className="btn btn--glass btn--peq"
        onClick={refrescar}
        disabled={estado.enCurso}
      >
        <Icon name="refrescar" size={16} className={estado.enCurso ? 'girando' : ''} />
        {estado.enCurso ? 'Buscando ofertas nuevas…' : 'Buscar ofertas nuevas'}
      </button>

      {mensaje && (
        <span className="refrescar__msg" role="status">
          {mensaje}
        </span>
      )}
    </div>
  );
}
