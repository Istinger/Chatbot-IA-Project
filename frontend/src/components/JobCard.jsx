import Icon from './Icon';
import { formatearSalario } from '../lib/format';

/**
 * Iniciales de la empresa para el badge (mock: "ID", "AX", "PS"...).
 *
 * Se usa como avatar honesto: las ofertas vienen de APIs y NO traen logo, asi
 * que en vez de inventar una imagen (enganar al usuario) se muestran las
 * iniciales de la empresa real.
 */
function iniciales(nombre) {
  const palabras = String(nombre || '').trim().split(/\s+/).filter(Boolean);
  if (!palabras.length) return '·';
  if (palabras.length === 1) return palabras[0].slice(0, 2).toUpperCase();
  return (palabras[0][0] + palabras[1][0]).toUpperCase();
}

/**
 * Tarjeta de oferta. Grande, glass, con glow al hover (DESIGN.md).
 *
 * Es un <button>, no un <div> con onClick: asi funciona con teclado y los
 * lectores de pantalla la anuncian como pulsable, gratis.
 */
export default function JobCard({ job, onOpen }) {
  const salario = formatearSalario(job);
  const score = job.score != null ? Math.round(job.score * 100) : null;

  return (
    <button type="button" className="card" onClick={() => onOpen(job)}>
      <div className="card__top">
        <span className={`chip chip--${job.isForeign ? 'exterior' : 'local'}`}>
          <Icon name={job.isForeign ? 'globo' : 'brujula'} size={14} />
          {job.isForeign ? 'Exterior' : 'Ecuador'}
        </span>

        {/* El backend marca con `explored` las ofertas inyectadas por la
            exploracion (epsilon-greedy): peor afinidad, mejor sueldo. Se
            etiquetan para que el usuario entienda por que las ve. */}
        {job.explored && (
          <span className="chip chip--explora">
            <Icon name="chispa" size={14} />
            Descubre
          </span>
        )}
      </div>

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
        {[job.location, job.country].filter(Boolean).join(' · ') || 'Ubicacion no indicada'}
      </p>

      <div className="card__salary">
        {salario ? (
          <>
            <strong>{salario.texto}</strong>
            {/* Nunca presentar una estimacion como cifra publicada. */}
            {salario.estimado && <span className="card__estimado">estimado</span>}
          </>
        ) : (
          <span className="card__sinsalario">Salario no publicado</span>
        )}
      </div>

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
    </button>
  );
}
