import { useEffect, useRef, useState } from 'react';
import Icon from '../components/Icon';
import { escucharAnimaciones, METAS_ANIMACION, obtenerAnimaciones } from '../lib/animacion';

const AZUL = '#57a8ff';
const CIAN = '#72e5ff';
const VERDE = '#6ee7b7';
const VIOLETA = '#a78bfa';

const cortar = (texto, limite = 24) => {
  const limpio = String(texto || '').trim();
  return limpio.length > limite ? `${limpio.slice(0, limite - 1)}...` : limpio;
};

function redondear(ctx, x, y, w, h, r = 16) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

function tarjeta(ctx, x, y, w, h, { titulo, detalle, color = AZUL, icono = 'o', pulso = 0 }) {
  ctx.save();
  ctx.shadowColor = `${color}66`;
  ctx.shadowBlur = 18 + pulso * 12;
  redondear(ctx, x, y, w, h);
  ctx.fillStyle = 'rgba(7, 19, 40, 0.88)';
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = `${color}aa`;
  ctx.lineWidth = 1.3;
  ctx.stroke();
  ctx.fillStyle = `${color}22`;
  redondear(ctx, x + 12, y + 12, 34, 34, 10);
  ctx.fill();
  ctx.fillStyle = color;
  ctx.font = '700 17px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(icono, x + 29, y + 35);
  ctx.textAlign = 'left';
  ctx.fillStyle = '#edf5ff';
  ctx.font = '600 14px system-ui, sans-serif';
  ctx.fillText(cortar(titulo, Math.max(15, Math.floor(w / 8))), x + 56, y + 29);
  ctx.fillStyle = '#9eafc7';
  ctx.font = '12px system-ui, sans-serif';
  ctx.fillText(cortar(detalle, Math.max(18, Math.floor(w / 7))), x + 56, y + 49);
  ctx.restore();
}

function conexion(ctx, x1, y1, x2, y2, p, color = AZUL) {
  ctx.save();
  ctx.strokeStyle = `${color}66`;
  ctx.lineWidth = 1.5;
  ctx.setLineDash([5, 7]);
  ctx.lineDashOffset = -p * 42;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.setLineDash([]);
  const t = (Math.sin(p * Math.PI * 2) + 1) / 2;
  const x = x1 + (x2 - x1) * t;
  const y = y1 + (y2 - y1) * t;
  ctx.beginPath();
  ctx.arc(x, y, 5, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = 16;
  ctx.fill();
  ctx.restore();
}

function etiqueta(ctx, texto, x, y, color = '#dceaff') {
  ctx.fillStyle = color;
  ctx.font = '600 12px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(cortar(texto, 28), x, y);
  ctx.textAlign = 'left';
}

function ficha(ctx, texto, x, y, color, alfa = 1) {
  ctx.save();
  ctx.globalAlpha = alfa;
  ctx.font = '600 11px system-ui, sans-serif';
  const w = Math.max(58, ctx.measureText(cortar(texto, 14)).width + 20);
  ctx.fillStyle = `${color}22`;
  redondear(ctx, x, y, w, 26, 13);
  ctx.fill();
  ctx.strokeStyle = `${color}88`;
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.fillText(cortar(texto, 14), x + w / 2, y + 17);
  ctx.restore();
  return w;
}

function dibujarFondo(ctx, w, h, t) {
  const fondo = ctx.createRadialGradient(w * 0.56, h * 0.16, 0, w * 0.56, h * 0.16, Math.max(w, h));
  fondo.addColorStop(0, '#12366d');
  fondo.addColorStop(0.42, '#061630');
  fondo.addColorStop(1, '#020813');
  ctx.fillStyle = fondo;
  ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 58; i += 1) {
    const x = (i * 97 + 41) % w;
    const y = (i * 61 + 29) % h;
    const brillo = 0.18 + ((Math.sin(t * 0.001 + i) + 1) / 2) * 0.34;
    ctx.fillStyle = `rgba(116, 177, 255, ${brillo})`;
    ctx.fillRect(x, y, i % 5 === 0 ? 2 : 1, i % 5 === 0 ? 2 : 1);
  }
}

function escenaCv(ctx, w, h, p, datos) {
  const y = h * 0.42;
  const cvX = w * 0.09;
  const perfilX = w * 0.39;
  const ofertaX = w * 0.68;
  tarjeta(ctx, cvX, y - 42, w * 0.19, 82, { titulo: datos.archivo || 'Tu CV', detalle: datos.nombre || 'Nuevo perfil', color: CIAN, icono: 'CV', pulso: p });
  tarjeta(ctx, perfilX, y - 52, w * 0.2, 100, { titulo: datos.rol || 'Tu perfil', detalle: `${(datos.skills || []).length} habilidades`, color: AZUL, icono: 'Yo', pulso: p });
  tarjeta(ctx, ofertaX, y - 52, w * 0.23, 100, { titulo: 'Ofertas para ti', detalle: datos.ofertas || 'Coincidencias reales', color: VERDE, icono: '+', pulso: p });
  conexion(ctx, cvX + w * 0.19, y, perfilX, y, p, CIAN);
  conexion(ctx, perfilX + w * 0.2, y, ofertaX, y, p + 0.3, VERDE);
  let x = perfilX - 4;
  (datos.skills || []).slice(0, 4).forEach((skill, i) => { x += ficha(ctx, skill, x, y + 68 + (i % 2) * 34, i % 2 ? VIOLETA : CIAN, 0.7 + 0.3 * Math.sin(p * 6 + i)); });
  etiqueta(ctx, 'El CV hace visible lo que sabes hacer', w / 2, h * 0.2, '#b9d7ff');
}

function escenaOfertas(ctx, w, h, p, datos, esBusqueda = false) {
  const consulta = esBusqueda ? datos.consulta || 'Tu busqueda' : datos.perfil || 'Tu perfil';
  const resultados = datos.ofertas || [];
  const origenX = w * 0.1;
  const centroX = w * 0.4;
  const destinoX = w * 0.68;
  tarjeta(ctx, origenX, h * 0.42 - 42, w * 0.21, 82, { titulo: consulta, detalle: esBusqueda ? 'Lo que quieres encontrar' : 'Habilidades y preferencias', color: CIAN, icono: esBusqueda ? '?' : 'Yo', pulso: p });
  tarjeta(ctx, centroX, h * 0.42 - 42, w * 0.18, 82, { titulo: 'Afinidad', detalle: 'Buscando coincidencias', color: VIOLETA, icono: '~', pulso: p });
  conexion(ctx, origenX + w * 0.21, h * 0.42, centroX, h * 0.42, p, CIAN);
  conexion(ctx, centroX + w * 0.18, h * 0.42, destinoX, h * 0.42, p + 0.5, VERDE);
  resultados.slice(0, 3).forEach((oferta, i) => tarjeta(ctx, destinoX, h * 0.24 + i * 86, w * 0.24, 68, { titulo: oferta.title || oferta, detalle: oferta.company || 'Oportunidad encontrada', color: i === 0 ? VERDE : AZUL, icono: '+', pulso: Math.max(0, Math.sin(p * 7 + i)) }));
  etiqueta(ctx, esBusqueda ? 'Tu consulta se transforma en oportunidades' : 'Las mejores coincidencias llegan a tu pantalla', w / 2, h * 0.16, '#b9d7ff');
}

function escenaCrecimiento(ctx, w, h, p, datos) {
  const faltantes = datos.faltantes || [];
  const cursos = datos.cursos || [];
  tarjeta(ctx, w * 0.1, h * 0.36, w * 0.22, 84, { titulo: 'Lo que ya tienes', detalle: datos.fortalezas || 'Tus habilidades', color: VERDE, icono: '+', pulso: p });
  tarjeta(ctx, w * 0.4, h * 0.36, w * 0.2, 84, { titulo: 'Siguiente paso', detalle: faltantes[0] || 'Brecha prioritaria', color: VIOLETA, icono: '!', pulso: p });
  tarjeta(ctx, w * 0.68, h * 0.36, w * 0.22, 84, { titulo: 'Por donde empezar', detalle: cursos[0] || 'Curso recomendado', color: CIAN, icono: '>', pulso: p });
  conexion(ctx, w * 0.32, h * 0.4, w * 0.4, h * 0.4, p, VERDE);
  conexion(ctx, w * 0.6, h * 0.4, w * 0.68, h * 0.4, p + 0.4, CIAN);
  faltantes.slice(0, 3).forEach((skill, i) => ficha(ctx, skill, w * 0.39 + i * 82, h * 0.56, VIOLETA, 0.9));
  etiqueta(ctx, `Analizamos ${datos.analizadas || 'tus'} ofertas para sugerir un camino claro`, w / 2, h * 0.2, '#b9d7ff');
}

function escenaPortafolio(ctx, w, h, p, datos) {
  const ideas = datos.ideas || [];
  tarjeta(ctx, w * 0.1, h * 0.4, w * 0.22, 84, { titulo: 'Tus habilidades', detalle: (datos.skills || []).slice(0, 3).join(', ') || 'Tu perfil', color: AZUL, icono: 'Yo', pulso: p });
  tarjeta(ctx, w * 0.4, h * 0.4, w * 0.2, 84, { titulo: 'Una idea toma forma', detalle: 'Lo que puedes demostrar', color: VIOLETA, icono: '*', pulso: p });
  conexion(ctx, w * 0.32, h * 0.44, w * 0.4, h * 0.44, p, AZUL);
  conexion(ctx, w * 0.6, h * 0.44, w * 0.68, h * 0.44, p + 0.35, CIAN);
  ideas.slice(0, 3).forEach((idea, i) => tarjeta(ctx, w * 0.68, h * 0.23 + i * 88, w * 0.22, 68, { titulo: idea.titulo || idea, detalle: idea.tipo || 'Proyecto sugerido', color: i === 0 ? CIAN : VERDE, icono: 'P', pulso: Math.max(0, Math.sin(p * 7 + i)) }));
  etiqueta(ctx, 'Un proyecto convierte tus habilidades en evidencia visible', w / 2, h * 0.2, '#b9d7ff');
}

function escenaGuardada(ctx, w, h, p, datos) {
  const oferta = datos.oferta || {};
  tarjeta(ctx, w * 0.12, h * 0.38, w * 0.26, 90, { titulo: oferta.title || 'Oferta', detalle: oferta.company || 'Oportunidad seleccionada', color: AZUL, icono: '+', pulso: p });
  tarjeta(ctx, w * 0.62, h * 0.38, w * 0.26, 90, { titulo: 'Guardados', detalle: `${datos.total || 1} oportunidad${datos.total === 1 ? '' : 'es'} a mano`, color: VERDE, icono: 'B', pulso: p });
  conexion(ctx, w * 0.38, h * 0.43, w * 0.62, h * 0.43, p, VERDE);
  etiqueta(ctx, 'La guardaste para volver a ella cuando quieras', w / 2, h * 0.23, '#b9d7ff');
}

function dibujarEscena(ctx, w, h, accion, p) {
  dibujarFondo(ctx, w, h, p * 1000);
  const tipo = accion?.tipo || 'inicio';
  const datos = accion?.datos || {};
  if (tipo === 'cv_generado') escenaCv(ctx, w, h, p, datos);
  else if (tipo === 'ofertas_encontradas') escenaOfertas(ctx, w, h, p, datos);
  else if (tipo === 'busqueda_realizada') escenaOfertas(ctx, w, h, p, datos, true);
  else if (tipo === 'crecimiento_analizado') escenaCrecimiento(ctx, w, h, p, datos);
  else if (tipo === 'portafolio_sugerido') escenaPortafolio(ctx, w, h, p, datos);
  else if (tipo === 'oferta_guardada') escenaGuardada(ctx, w, h, p, datos);
  else escenaOfertas(ctx, w, h, p, { perfil: 'Tu actividad en Jobia', ofertas: [] });
}

export default function Animacion() {
  const canvasRef = useRef(null);
  const marcoRef = useRef(null);
  const inicioRef = useRef(performance.now());
  const [acciones, setAcciones] = useState(() => obtenerAnimaciones());
  const [activa, setActiva] = useState(() => obtenerAnimaciones()[0] || { tipo: 'inicio', datos: {} });
  const [pausada, setPausada] = useState(false);

  useEffect(() => escucharAnimaciones((nueva) => {
    const lista = obtenerAnimaciones();
    setAcciones(lista);
    if (nueva) {
      setActiva(nueva);
      inicioRef.current = performance.now();
    }
  }), []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const marco = marcoRef.current;
    if (!canvas || !marco) return undefined;
    const ctx = canvas.getContext('2d');
    let frame = 0;
    let ancho = 0;
    let alto = 0;
    const ajustar = () => {
      const rect = marco.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      ancho = rect.width;
      alto = rect.height;
      canvas.width = Math.floor(ancho * dpr);
      canvas.height = Math.floor(alto * dpr);
      canvas.style.width = `${ancho}px`;
      canvas.style.height = `${alto}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const dibujar = (ahora) => {
      const progreso = pausada ? 0.5 : ((ahora - inicioRef.current) % 9000) / 9000;
      dibujarEscena(ctx, ancho, alto, activa, progreso);
      frame = requestAnimationFrame(dibujar);
    };
    ajustar();
    const observer = new ResizeObserver(ajustar);
    observer.observe(marco);
    frame = requestAnimationFrame(dibujar);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [activa, pausada]);

  const meta = METAS_ANIMACION[activa?.tipo] || METAS_ANIMACION.inicio;
  const repetir = () => { inicioRef.current = performance.now(); setPausada(false); };

  return (
    <main ref={marcoRef} className="animacion">
      <canvas ref={canvasRef} className="animacion__canvas" aria-label="Animacion de la actividad reciente" />
      <header className="animacion__cab">
        <span className="animacion__marca"><Icon name="animacion" size={18} /> JOBIA EN MOVIMIENTO</span>
        <div>
          <h1>{meta.titulo}</h1>
          <p>{meta.subtitulo}</p>
        </div>
      </header>
      <aside className="animacion__controles" aria-label="Controles de animacion">
        <button type="button" className="iconbtn" onClick={() => setPausada((v) => !v)} aria-label={pausada ? 'Reanudar' : 'Pausar'}>
          <Icon name={pausada ? 'derecha' : 'pausa'} size={18} />
        </button>
        <button type="button" className="iconbtn" onClick={repetir} aria-label="Repetir animacion"><Icon name="refrescar" size={18} /></button>
        <button type="button" className="iconbtn" onClick={() => window.close()} aria-label="Cerrar pestaña"><Icon name="cerrar" size={18} /></button>
      </aside>
      <section className="animacion__historial" aria-label="Acciones recientes">
        <span>Acciones recientes</span>
        <div>
          {acciones.length ? acciones.map((accion) => {
            const item = METAS_ANIMACION[accion.tipo] || METAS_ANIMACION.inicio;
            return <button key={accion.id} type="button" className={activa?.id === accion.id ? 'is-on' : ''} onClick={() => { setActiva(accion); inicioRef.current = performance.now(); }}><Icon name="animacion" size={14} />{item.titulo}</button>;
          }) : <p>Aun no hay una accion para mostrar.</p>}
        </div>
      </section>
    </main>
  );
}
