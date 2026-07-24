import { useState } from 'react';
import Icon from './Icon';
import { formatearSalario } from '../lib/format';
import { imagenOferta, imagenFallback } from '../lib/imagen';

/**
 * Iniciales de la empresa para el badge (mock: "ID", "AX", "PS"...).
 *
 * Las ofertas vienen de APIs y NO traen logo, asi que la marca de la empresa
 * son sus iniciales reales, no una imagen inventada.
 */
function iniciales(nombre) {
  const palabras = String(nombre || '').trim().split(/\s+/).filter(Boolean);
  if (!palabras.length) return '·';
  if (palabras.length === 1) return palabras[0].slice(0, 2).toUpperCase();
  return (palabras[0][0] + palabras[1][0]).toUpperCase();
}

/**
 * Tarjeta de oferta al estilo del mock: portada con imagen + cuerpo con marca de
 * empresa, meta y accion. `destacada` la agranda (la primera de la home).
 *
 * Sigue siendo un <button>: la tarjeta entera abre el detalle (funciona con
 * teclado y lo anuncian los lectores de pantalla). El "Ver oferta" y el marcador
 * son visuales — no botones anidados (HTML invalido) — porque la accion es una
 * sola: abrir la oferta.
 */
export default function JobCard({ job, onOpen, destacada = false }) {
  const [imgError, setImgError] = useState(false);
  const salario = formatearSalario(job);
  const score = job.score != null ? Math.round(job.score * 100) : null;
  const ubicacion = [job.location, job.country].filter(Boolean).join(' · ');

  return (
    <button
      type="button"
      className={`card ${destacada ? 'card--destacada' : ''}`}
      onClick={() => onOpen(job)}
    >
      <div className="card__visual">
        <img
          className="card__img"
          src={imgError ? imagenFallback() : imagenOferta(job)}
          onError={() => setImgError(true)}
          alt=""
          loading="lazy"
          width="640"
          height="420"
        />
        <div className="card__chips">
          <span className={`chip chip--${job.isForeign ? 'exterior' : 'local'}`}>
            <Icon name={job.isForeign ? 'globo' : 'brujula'} size={14} />
            {job.isForeign ? 'Exterior' : 'Ecuador'}
          </span>
          {/* ε-greedy: ofertas inyectadas por exploracion (peor afinidad, mejor
              sueldo). Se etiquetan para que el usuario entienda por que las ve. */}
          {job.explored && (
            <span className="chip chip--explora">
              <Icon name="chispa" size={14} />
              Descubre
            </span>
          )}
        </div>
        {destacada && (
          <span className="card__destacada-badge">
            <Icon name="estrella" size={14} />
            Destacada
          </span>
        )}
      </div>

      <div className="card__cuerpo">
        <div className="card__head">
          <span className="card__badge" aria-hidden="true">
            {iniciales(job.company)}
          </span>
          <div className="card__headtext">
            <h3 className="card__title">{job.title}</h3>
            <p className="card__company">{job.company}</p>
          </div>
        </div>

        <p className="card__meta">
          <span>{ubicacion || 'Ubicacion no indicada'}</span>
          {salario && (
            <span className="dot">
              {salario.texto}
              {salario.estimado && <em className="card__estimado"> est.</em>}
            </span>
          )}
        </p>

        {job.skills?.length > 0 && (
          <ul className="card__skills">
            {job.skills.slice(0, 3).map((s) => (
              <li key={s}>{s}</li>
            ))}
            {job.skills.length > 3 && <li className="card__mas">+{job.skills.length - 3}</li>}
          </ul>
        )}

        {score != null && (
          <div className="card__score">
            <div className="card__bar">
              <span style={{ width: `${score}%` }} />
            </div>
            <span className="card__pct">{score}% afin</span>
          </div>
        )}

        <div className="card__acciones">
          <span className="card__ver">
            Ver oferta <Icon name="derecha" size={16} />
          </span>
          <span className="card__marcador" aria-hidden="true">
            <Icon name="marcador" size={18} />
          </span>
        </div>
      </div>
    </button>
  );
}
