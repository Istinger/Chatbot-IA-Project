/**
 * Fondo animado de la app (mock fondo-animado.html).
 *
 * Cinco capas CSS puras (imagen azul con deriva + niebla, glow, particulas y
 * viñeta) fijas detras de TODO. El rail y el panel del asistente son
 * translucidos con blur, asi que dejan ver este fondo a traves suyo: es el fondo
 * de toda la app, no solo del contenido. Sin JS ni canvas.
 *
 * La imagen vive en frontend/public/fondo-azul.png (se sirve como /fondo-azul.png).
 * Con prefers-reduced-motion las animaciones se apagan (ver ui.css).
 */
export default function AmbientBackground() {
  return (
    <div className="ambient" aria-hidden="true">
      <div className="ambient__bg" />
      <div className="ambient__mist" />
      <div className="ambient__glow" />
      <div className="ambient__particles" />
      <div className="ambient__vignette" />
    </div>
  );
}
