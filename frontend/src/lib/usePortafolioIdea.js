import { useEffect, useState } from 'react';
import { api } from './api';
import { agregarIdeaCache, ideaPorId } from './portafolio';

/**
 * Resuelve una idea de portafolio por id para el detalle y el asistente.
 *
 * Primero mira el cache de sessionStorage (lo que trajo el listado). Si no esta
 * —deep-link o refresh—, la pide al backend (`GET /portafolio/ideas/:id`), que
 * la sirve del set personalizado del usuario o, en frio, del catalogo base.
 *
 * estado: 'cargando' | 'listo' | 'noexiste' | 'error'
 */
export function usePortafolioIdea(id) {
  const [idea, setIdea] = useState(() => ideaPorId(id));
  const [estado, setEstado] = useState(() => (ideaPorId(id) ? 'listo' : 'cargando'));

  useEffect(() => {
    const enCache = ideaPorId(id);
    if (enCache) {
      setIdea(enCache);
      setEstado('listo');
      return;
    }

    let vivo = true;
    setEstado('cargando');
    api
      .portafolioIdea(id)
      .then((r) => {
        if (!vivo) return;
        if (r?.idea) {
          agregarIdeaCache(r.idea);
          setIdea(r.idea);
          setEstado('listo');
        } else {
          setEstado('noexiste');
        }
      })
      .catch((err) => {
        if (!vivo) return;
        setEstado(err.status === 404 ? 'noexiste' : 'error');
      });

    return () => {
      vivo = false;
    };
  }, [id]);

  return { idea, estado };
}
