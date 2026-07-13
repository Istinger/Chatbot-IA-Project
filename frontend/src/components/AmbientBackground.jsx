import { useEffect, useRef } from 'react';

/**
 * Fondo vivo: neblina y luz ambiental sobre canvas 2D.
 *
 * DESIGN.md pide un fondo "que se sienta vivo" (gradientes, neblina, bloom) sin
 * comprometer la fluidez. Decisiones para que no cueste casi nada:
 *
 *   - 4 blobs, no particulas. Menos de 10 operaciones de dibujo por frame.
 *   - Se dibuja a media resolucion y el navegador lo escala: 4x menos pixeles.
 *   - Se limita a ~30 fps: el ojo no nota la diferencia en algo tan lento.
 *   - Se PAUSA si la pestana no esta visible (no gastar bateria de fondo).
 *   - Se APAGA por completo con prefers-reduced-motion (queda un degradado fijo).
 *
 * WebGPU queda como mejora opcional futura, tal como dice DESIGN.md.
 */
const BLOBS = [
  { x: 0.2, y: 0.15, r: 0.55, color: '79, 163, 255', a: 0.16, vx: 0.006, vy: 0.004 },
  { x: 0.8, y: 0.2, r: 0.45, color: '110, 200, 255', a: 0.1, vx: -0.005, vy: 0.006 },
  { x: 0.65, y: 0.85, r: 0.6, color: '22, 40, 61', a: 0.5, vx: 0.004, vy: -0.005 },
  { x: 0.15, y: 0.8, r: 0.4, color: '79, 163, 255', a: 0.08, vx: 0.007, vy: -0.003 },
];

export default function AmbientBackground() {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return undefined;

    const sinMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const ctx = canvas.getContext('2d');
    const blobs = BLOBS.map((b) => ({ ...b, t: Math.random() * 100 }));

    let ancho = 0;
    let alto = 0;
    let raf = 0;
    let ultimo = 0;

    const redimensionar = () => {
      // Media resolucion: el blur del CSS disimula por completo la perdida.
      ancho = canvas.width = Math.floor(window.innerWidth / 2);
      alto = canvas.height = Math.floor(window.innerHeight / 2);
    };

    const pintar = () => {
      ctx.clearRect(0, 0, ancho, alto);
      for (const b of blobs) {
        const cx = b.x * ancho;
        const cy = b.y * alto;
        const r = b.r * Math.max(ancho, alto);
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
        g.addColorStop(0, `rgba(${b.color}, ${b.a})`);
        g.addColorStop(1, `rgba(${b.color}, 0)`);
        ctx.fillStyle = g;
        ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
      }
    };

    const animar = (ahora) => {
      raf = requestAnimationFrame(animar);

      // ~30 fps basta para una deriva tan lenta; ahorra la mitad de CPU.
      if (ahora - ultimo < 33) return;
      ultimo = ahora;

      for (const b of blobs) {
        b.t += 0.005;
        // Deriva sinusoidal: nunca se sale de la pantalla ni necesita rebotes.
        b.x += Math.sin(b.t) * b.vx * 0.02;
        b.y += Math.cos(b.t * 0.8) * b.vy * 0.02;
      }
      pintar();
    };

    redimensionar();
    pintar(); // primer frame inmediato: nada de fondo negro mientras arranca

    if (!sinMovimiento) raf = requestAnimationFrame(animar);

    // No animar una pestana que nadie esta mirando.
    const visibilidad = () => {
      cancelAnimationFrame(raf);
      if (!document.hidden && !sinMovimiento) raf = requestAnimationFrame(animar);
    };

    const onResize = () => {
      redimensionar();
      pintar();
    };

    window.addEventListener('resize', onResize);
    document.addEventListener('visibilitychange', visibilidad);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', visibilidad);
    };
  }, []);

  return (
    <div className="ambient" aria-hidden="true">
      <canvas ref={ref} className="ambient__canvas" />
      <div className="ambient__grain" />
    </div>
  );
}
