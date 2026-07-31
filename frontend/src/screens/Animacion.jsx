import { useEffect, useRef, useState } from 'react';
import Icon from '../components/Icon';
import { escucharAnimaciones, METAS_ANIMACION, obtenerAnimaciones } from '../lib/animacion';

const COLORES = {
  azul: '#58a6ff',
  cian: '#62d9f5',
  verde: '#62d6a8',
  violeta: '#a78bfa',
  amarillo: '#f7c66b',
  texto: '#eef5ff',
  suave: '#9eb0c9',
};

const limitar = (valor, minimo = 0, maximo = 1) => Math.max(minimo, Math.min(maximo, valor));
const lista = (valor) => (Array.isArray(valor) ? valor : []);
const textoCorto = (valor, limite = 38) => {
  const texto = String(valor || '').trim();
  return texto.length > limite ? `${texto.slice(0, limite - 1)}...` : texto;
};

function redondear(ctx, x, y, ancho, alto, radio = 12) {
  ctx.beginPath();
  ctx.roundRect(x, y, ancho, alto, radio);
}

function escribirLineas(ctx, texto, x, y, ancho, maximo = 2, altoLinea = 18) {
  const palabras = String(texto || '').split(/\s+/).filter(Boolean);
  const lineas = [];
  let linea = '';

  palabras.forEach((palabra) => {
    const candidata = linea ? `${linea} ${palabra}` : palabra;
    if (ctx.measureText(candidata).width <= ancho || !linea) linea = candidata;
    else {
      lineas.push(linea);
      linea = palabra;
    }
  });
  if (linea) lineas.push(linea);

  lineas.slice(0, maximo).forEach((item, indice) => {
    const ultima = indice === maximo - 1 && lineas.length > maximo;
    ctx.fillText(ultima ? `${textoCorto(item, Math.max(8, item.length - 2))}...` : item, x, y + indice * altoLinea);
  });
}

function dibujarIcono(ctx, tipo, x, y, tamano, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = `${color}22`;
  ctx.lineWidth = 2;
  redondear(ctx, x, y, tamano, tamano, 12);
  ctx.fill();

  const cx = x + tamano / 2;
  const cy = y + tamano / 2;
  ctx.beginPath();

  if (tipo === 'documento') {
    ctx.rect(cx - 10, cy - 14, 20, 28);
    ctx.moveTo(cx - 5, cy - 5);
    ctx.lineTo(cx + 6, cy - 5);
    ctx.moveTo(cx - 5, cy + 1);
    ctx.lineTo(cx + 6, cy + 1);
    ctx.moveTo(cx - 5, cy + 7);
    ctx.lineTo(cx + 3, cy + 7);
  } else if (tipo === 'leer') {
    ctx.ellipse(cx, cy, 15, 9, 0, 0, Math.PI * 2);
    ctx.moveTo(cx + 4, cy);
    ctx.arc(cx, cy, 4, 0, Math.PI * 2);
  } else if (tipo === 'habilidades') {
    ctx.arc(cx - 9, cy - 6, 4, 0, Math.PI * 2);
    ctx.moveTo(cx + 4, cy - 10);
    ctx.lineTo(cx + 13, cy - 10);
    ctx.moveTo(cx - 13, cy + 7);
    ctx.lineTo(cx - 2, cy + 7);
    ctx.moveTo(cx + 6, cy + 3);
    ctx.arc(cx + 6, cy + 7, 4, -Math.PI / 2, Math.PI * 1.5);
  } else if (tipo === 'buscar') {
    ctx.arc(cx - 3, cy - 3, 10, 0, Math.PI * 2);
    ctx.moveTo(cx + 5, cy + 5);
    ctx.lineTo(cx + 14, cy + 14);
  } else if (tipo === 'comparar') {
    [-8, 0, 8].forEach((salto, indice) => {
      ctx.moveTo(cx - 13, cy + salto);
      ctx.lineTo(cx + 13, cy + salto);
      ctx.moveTo(cx - 5 + indice * 7, cy + salto - 4);
      ctx.lineTo(cx - 5 + indice * 7, cy + salto + 4);
    });
  } else if (tipo === 'ordenar') {
    [10, 17, 24].forEach((ancho, indice) => {
      ctx.rect(cx - 13, cy - 12 + indice * 10, ancho, 5);
    });
  } else if (tipo === 'oferta') {
    ctx.rect(cx - 14, cy - 8, 28, 20);
    ctx.moveTo(cx - 6, cy - 8);
    ctx.lineTo(cx - 6, cy - 13);
    ctx.lineTo(cx + 6, cy - 13);
    ctx.lineTo(cx + 6, cy - 8);
    ctx.moveTo(cx - 14, cy);
    ctx.lineTo(cx + 14, cy);
  } else if (tipo === 'curso') {
    ctx.moveTo(cx - 14, cy + 10);
    ctx.lineTo(cx - 4, cy);
    ctx.lineTo(cx + 4, cy + 5);
    ctx.lineTo(cx + 14, cy - 10);
    ctx.moveTo(cx + 8, cy - 10);
    ctx.lineTo(cx + 14, cy - 10);
    ctx.lineTo(cx + 14, cy - 4);
  } else if (tipo === 'proyecto') {
    ctx.rect(cx - 14, cy - 12, 11, 11);
    ctx.rect(cx + 3, cy - 12, 11, 11);
    ctx.rect(cx - 14, cy + 5, 11, 11);
    ctx.rect(cx + 3, cy + 5, 11, 11);
  } else if (tipo === 'guardar') {
    ctx.moveTo(cx - 9, cy - 14);
    ctx.lineTo(cx + 9, cy - 14);
    ctx.lineTo(cx + 9, cy + 14);
    ctx.lineTo(cx, cy + 8);
    ctx.lineTo(cx - 9, cy + 14);
    ctx.closePath();
  } else {
    ctx.arc(cx, cy, 12, 0, Math.PI * 2);
    ctx.moveTo(cx - 5, cy);
    ctx.lineTo(cx + 5, cy);
  }

  ctx.stroke();
  ctx.restore();
}

function flujoDe(accion) {
  const tipo = accion?.tipo || 'inicio';
  const datos = accion?.datos || {};
  const skills = lista(datos.skills);
  const ofertas = lista(datos.ofertas);
  const faltantes = lista(datos.faltantes);
  const cursos = lista(datos.cursos);
  const ideas = lista(datos.ideas);

  if (tipo === 'cv_generado') {
    return {
      pasos: [
        { titulo: 'Recibimos tu CV', detalle: datos.archivo || 'Documento listo', dato: '1 archivo', icono: 'documento', color: COLORES.cian },
        { titulo: 'Leemos tu informacion', detalle: datos.nombre || 'Datos del perfil', dato: datos.rol || 'Perfil detectado', icono: 'leer', color: COLORES.azul },
        { titulo: 'Encontramos habilidades', detalle: skills.slice(0, 3).join(', ') || 'Habilidades del CV', dato: `${skills.length} encontradas`, icono: 'habilidades', color: COLORES.violeta },
        { titulo: 'Preparamos oportunidades', detalle: datos.ofertas || 'Ofertas para tu perfil', dato: 'Perfil listo', icono: 'oferta', color: COLORES.verde },
      ],
      relaciones: ['se lee', 'crea tu perfil', 'busca coincidencias'],
      transferencias: [
        datos.archivo || 'CV en PDF',
        datos.nombre || datos.rol || 'Datos del perfil',
        skills.slice(0, 2).join(' + ') || `${skills.length} habilidades`,
      ],
      resultado: 'Tu perfil ya puede buscar oportunidades',
      indicadores: [['CV', 1], ['Habilidades', skills.length], ['Perfil', 1]],
    };
  }

  if (tipo === 'ofertas_encontradas' || tipo === 'busqueda_realizada') {
    const esBusqueda = tipo === 'busqueda_realizada';
    return {
      pasos: [
        { titulo: esBusqueda ? 'Recibimos tu busqueda' : 'Tomamos tu perfil', detalle: esBusqueda ? datos.consulta || 'Lo que quieres encontrar' : datos.perfil || 'Tus preferencias', dato: esBusqueda ? 'Consulta lista' : 'Perfil listo', icono: esBusqueda ? 'buscar' : 'habilidades', color: COLORES.cian },
        { titulo: 'Revisamos oportunidades', detalle: 'Buscamos coincidencias utiles', dato: `${ofertas.length || datos.total || 0} resultados`, icono: 'buscar', color: COLORES.azul },
        { titulo: 'Comparamos contigo', detalle: 'Habilidades, puesto y preferencias', dato: 'Mejor encaje primero', icono: 'comparar', color: COLORES.violeta },
        { titulo: 'Mostramos lo mejor', detalle: ofertas[0]?.title || ofertas[0] || 'Resultados ordenados', dato: ofertas[0]?.company || 'Listo para revisar', icono: 'ordenar', color: COLORES.verde },
      ],
      relaciones: ['inicia la revision', 'compara contigo', 'ordena resultados'],
      transferencias: [
        esBusqueda ? datos.consulta || 'Tu busqueda' : datos.perfil || 'Tu perfil',
        `${ofertas.length || datos.total || 0} ofertas`,
        ofertas[0]?.title || ofertas[0] || 'Mejores resultados',
      ],
      resultado: esBusqueda ? 'Tu busqueda ya tiene resultados' : 'Estas son las oportunidades mas cercanas a ti',
      indicadores: [['Consulta', 1], ['Revisadas', Math.max(ofertas.length, Number(datos.total) || 0)], ['Destacadas', Math.min(3, ofertas.length)]],
    };
  }

  if (tipo === 'crecimiento_analizado') {
    return {
      pasos: [
        { titulo: 'Miramos tus fortalezas', detalle: datos.fortalezas || 'Lo que ya sabes hacer', dato: 'Punto de partida', icono: 'habilidades', color: COLORES.verde },
        { titulo: 'Vemos que estan pidiendo', detalle: `${datos.analizadas || 'Varias'} ofertas revisadas`, dato: 'Demanda real', icono: 'buscar', color: COLORES.azul },
        { titulo: 'Detectamos oportunidades', detalle: faltantes.slice(0, 2).join(', ') || 'Habilidades por reforzar', dato: `${faltantes.length} por aprender`, icono: 'comparar', color: COLORES.violeta },
        { titulo: 'Trazamos un camino', detalle: cursos[0]?.titulo || cursos[0] || 'Curso recomendado', dato: `${cursos.length} recursos`, icono: 'curso', color: COLORES.cian },
      ],
      relaciones: ['se contrasta con', 'descubre', 'recomienda'],
      transferencias: [
        datos.fortalezas || 'Tus habilidades',
        `${datos.analizadas || 'Varias'} ofertas`,
        faltantes.slice(0, 2).join(' + ') || `${faltantes.length} oportunidades`,
      ],
      resultado: 'Ya tienes un siguiente paso claro',
      indicadores: [['Fortalezas', Number(datos.fortalezas?.length) || 1], ['Por aprender', faltantes.length], ['Cursos', cursos.length]],
    };
  }

  if (tipo === 'portafolio_sugerido') {
    return {
      pasos: [
        { titulo: 'Partimos de tus habilidades', detalle: skills.slice(0, 3).join(', ') || 'Tu perfil', dato: `${skills.length} habilidades`, icono: 'habilidades', color: COLORES.azul },
        { titulo: 'Buscamos combinaciones', detalle: 'Ideas que puedes demostrar', dato: 'Opciones posibles', icono: 'comparar', color: COLORES.violeta },
        { titulo: 'Creamos ideas practicas', detalle: ideas[0]?.titulo || ideas[0] || 'Proyecto sugerido', dato: `${ideas.length} ideas`, icono: 'proyecto', color: COLORES.cian },
        { titulo: 'Preparamos tu vitrina', detalle: 'Proyectos para mostrar', dato: 'Portafolio listo', icono: 'oferta', color: COLORES.verde },
      ],
      relaciones: ['se combinan', 'generan', 'se convierten en'],
      transferencias: [
        skills.slice(0, 2).join(' + ') || 'Tus habilidades',
        `${ideas.length} ideas`,
        ideas[0]?.titulo || ideas[0] || 'Proyecto sugerido',
      ],
      resultado: 'Tus habilidades ahora tienen algo visible que mostrar',
      indicadores: [['Habilidades', skills.length], ['Ideas', ideas.length], ['Proyecto', ideas.length ? 1 : 0]],
    };
  }

  if (tipo === 'oferta_guardada') {
    const oferta = datos.oferta || {};
    return {
      pasos: [
        { titulo: 'Elegiste una oferta', detalle: oferta.title || 'Oportunidad seleccionada', dato: oferta.company || 'Oferta', icono: 'oferta', color: COLORES.azul },
        { titulo: 'Confirmamos tu eleccion', detalle: 'La marcamos para ti', dato: 'Seleccionada', icono: 'comparar', color: COLORES.cian },
        { titulo: 'La llevamos a Guardados', detalle: 'Queda disponible en tu perfil', dato: 'Guardada', icono: 'guardar', color: COLORES.violeta },
        { titulo: 'Lista para volver', detalle: 'Puedes revisarla cuando quieras', dato: `${datos.total || 1} guardada${datos.total === 1 ? '' : 's'}`, icono: 'ordenar', color: COLORES.verde },
      ],
      relaciones: ['la seleccionas', 'se mueve a', 'queda disponible'],
      transferencias: [
        oferta.title || 'Oferta elegida',
        oferta.company || 'Oportunidad',
        `${datos.total || 1} guardada${datos.total === 1 ? '' : 's'}`,
      ],
      resultado: 'La oportunidad quedo guardada correctamente',
      indicadores: [['Elegida', 1], ['Guardadas', Number(datos.total) || 1], ['Disponible', 1]],
    };
  }

  return {
    pasos: [
      { titulo: 'Haz una accion en Jobia', detalle: 'Carga un CV, busca o guarda una oferta', dato: 'Esperando', icono: 'documento', color: COLORES.cian },
      { titulo: 'Veremos que ocurre', detalle: 'Cada etapa aparecera aqui', dato: 'Paso a paso', icono: 'leer', color: COLORES.azul },
      { titulo: 'Usaremos tus datos', detalle: 'Solo lo necesario para explicarlo', dato: 'Datos reales', icono: 'comparar', color: COLORES.violeta },
      { titulo: 'Mostraremos el resultado', detalle: 'Claro y facil de seguir', dato: 'Listo', icono: 'oferta', color: COLORES.verde },
    ],
    relaciones: ['activa', 'conecta', 'produce'],
    transferencias: ['Tu accion', 'Datos reales', 'Resultado'],
    resultado: 'El mapa se actualiza con la actividad de la aplicacion',
    indicadores: [['Entrada', 1], ['Etapas', 4], ['Resultado', 1]],
  };
}

function dibujarFondo(ctx, ancho, alto) {
  const fondo = ctx.createLinearGradient(0, 0, ancho, alto);
  fondo.addColorStop(0, '#06152d');
  fondo.addColorStop(0.48, '#041023');
  fondo.addColorStop(1, '#020812');
  ctx.fillStyle = fondo;
  ctx.fillRect(0, 0, ancho, alto);

  ctx.strokeStyle = 'rgba(100, 157, 225, 0.055)';
  ctx.lineWidth = 1;
  const tamano = 48;
  for (let x = 0; x < ancho; x += tamano) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, alto);
    ctx.stroke();
  }
  for (let y = 0; y < alto; y += tamano) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(ancho, y);
    ctx.stroke();
  }
}

function dibujarConexion(ctx, x1, x2, y, avance, color, etiqueta, dato, movimiento) {
  ctx.save();
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'rgba(105, 145, 196, 0.28)';
  ctx.beginPath();
  ctx.moveTo(x1, y);
  ctx.lineTo(x2, y);
  ctx.stroke();

  const progreso = limitar(avance);
  const finalX = x1 + (x2 - x1) * progreso;
  ctx.lineWidth = 4;
  ctx.strokeStyle = color;
  ctx.beginPath();
  ctx.moveTo(x1, y);
  ctx.lineTo(finalX, y);
  ctx.stroke();

  ctx.fillStyle = progreso >= 1 ? color : 'rgba(105, 145, 196, 0.4)';
  ctx.beginPath();
  ctx.moveTo(x2 - 9, y - 6);
  ctx.lineTo(x2, y);
  ctx.lineTo(x2 - 9, y + 6);
  ctx.closePath();
  ctx.fill();

  if (progreso > 0 && progreso < 1) {
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.arc(finalX, y, 7, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.shadowBlur = 0;
  ctx.font = '700 11px system-ui, sans-serif';
  const rotulo = textoCorto(etiqueta, 24);
  const anchoRotulo = ctx.measureText(rotulo).width + 20;
  redondear(ctx, (x1 + x2 - anchoRotulo) / 2, y - 31, anchoRotulo, 22, 11);
  ctx.fillStyle = 'rgba(5, 16, 34, 0.96)';
  ctx.fill();
  ctx.strokeStyle = `${color}66`;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = progreso >= 1 ? color : COLORES.suave;
  ctx.textAlign = 'center';
  ctx.fillText(rotulo, (x1 + x2) / 2, y - 16);

  if (progreso > 0) {
    const contenido = textoCorto(dato, 22);
    ctx.font = '700 11px system-ui, sans-serif';
    const anchoDato = Math.min(x2 - x1 - 10, Math.max(66, ctx.measureText(contenido).width + 24));
    const posicion = progreso < 1 ? progreso : movimiento;
    const centroDato = x1 + anchoDato / 2 + (x2 - x1 - anchoDato) * posicion;
    redondear(ctx, centroDato - anchoDato / 2, y + 14, anchoDato, 26, 13);
    ctx.fillStyle = 'rgba(8, 24, 49, 0.97)';
    ctx.shadowColor = color;
    ctx.shadowBlur = 12;
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = `${color}aa`;
    ctx.stroke();
    ctx.fillStyle = COLORES.texto;
    ctx.fillText(contenido, centroDato, y + 31);
  }
  ctx.restore();
}

function dibujarNodo(ctx, paso, indice, x, y, ancho, avance) {
  const completado = avance >= 1;
  const activo = avance > 0 && avance < 1;
  const intensidad = completado ? 1 : activo ? 0.94 : 0.42;
  const tamanoIcono = 82;

  ctx.save();
  ctx.globalAlpha = intensidad;
  if (activo || completado) {
    ctx.strokeStyle = `${paso.color}${activo ? 'aa' : '66'}`;
    ctx.lineWidth = activo ? 3 : 2;
    ctx.shadowColor = paso.color;
    ctx.shadowBlur = activo ? 26 : 10;
    ctx.beginPath();
    ctx.arc(x, y, tamanoIcono / 2 + 13, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  dibujarIcono(ctx, paso.icono, x - tamanoIcono / 2, y - tamanoIcono / 2, tamanoIcono, paso.color);

  ctx.fillStyle = completado ? COLORES.verde : activo ? COLORES.amarillo : COLORES.suave;
  ctx.font = '700 10px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(completado ? 'COMPLETADO' : activo ? 'AHORA' : `PASO ${indice + 1}`, x, y - 64);

  ctx.fillStyle = COLORES.texto;
  ctx.font = '700 18px system-ui, sans-serif';
  escribirLineas(ctx, paso.titulo, x, y + 70, ancho, 2, 21);

  ctx.fillStyle = COLORES.suave;
  ctx.font = '13px system-ui, sans-serif';
  escribirLineas(ctx, paso.detalle, x, y + 116, ancho, 2, 18);

  ctx.font = '700 12px system-ui, sans-serif';
  const dato = textoCorto(paso.dato, 28);
  const pastilla = Math.min(ancho, ctx.measureText(dato).width + 24);
  redondear(ctx, x - pastilla / 2, y + 151, pastilla, 27, 14);
  ctx.fillStyle = `${paso.color}1f`;
  ctx.fill();
  ctx.strokeStyle = `${paso.color}66`;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = paso.color;
  ctx.fillText(dato, x, y + 169);
  ctx.restore();
}

function dibujarIndicadores(ctx, flujo, x, y, ancho, alto, visible) {
  ctx.save();
  ctx.globalAlpha = visible;
  redondear(ctx, x, y, ancho, alto, 14);
  ctx.fillStyle = 'rgba(7, 20, 42, 0.9)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(100, 154, 220, 0.28)';
  ctx.stroke();

  ctx.fillStyle = COLORES.suave;
  ctx.font = '700 11px system-ui, sans-serif';
  ctx.fillText('RESULTADO DE ESTA EJECUCION', x + 20, y + 26);
  ctx.fillStyle = COLORES.texto;
  ctx.font = '700 18px system-ui, sans-serif';
  escribirLineas(ctx, flujo.resultado, x + 20, y + 54, ancho * 0.52, 2, 22);

  const maximo = Math.max(1, ...flujo.indicadores.map(([, valor]) => Number(valor) || 0));
  const inicioX = x + ancho * 0.58;
  const disponible = ancho * 0.36;
  flujo.indicadores.slice(0, 3).forEach(([nombre, valor], indice) => {
    const filaY = y + 25 + indice * 34;
    const numero = Number(valor) || 0;
    ctx.fillStyle = COLORES.suave;
    ctx.font = '11px system-ui, sans-serif';
    ctx.fillText(nombre, inicioX, filaY);
    ctx.fillStyle = 'rgba(95, 133, 185, 0.18)';
    redondear(ctx, inicioX, filaY + 7, disponible, 8, 4);
    ctx.fill();
    const barra = numero === 0 ? 0 : Math.max(8, disponible * (numero / maximo));
    ctx.fillStyle = [COLORES.cian, COLORES.violeta, COLORES.verde][indice];
    redondear(ctx, inicioX, filaY + 7, barra, 8, 4);
    ctx.fill();
    ctx.fillStyle = COLORES.texto;
    ctx.font = '700 11px system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(String(numero), x + ancho - 20, filaY);
    ctx.textAlign = 'left';
  });
  ctx.restore();
}

function dibujarMapa(ctx, ancho, alto, accion, progreso) {
  dibujarFondo(ctx, ancho, alto);
  const flujo = flujoDe(accion);
  const margen = Math.max(80, ancho * 0.075);
  const espacioUtil = ancho - margen * 2;
  const anchoNodo = Math.min(220, espacioUtil / 4.6);
  const y = Math.max(265, alto * 0.39);
  const recorrido = progreso * flujo.pasos.length;
  const centros = flujo.pasos.map((_, indice) => margen + (espacioUtil * indice) / 3);

  ctx.fillStyle = COLORES.suave;
  ctx.font = '700 11px system-ui, sans-serif';
  ctx.fillText('ELEMENTOS CONECTADOS EN ESTA ACCION', margen, y - 112);

  flujo.relaciones.forEach((relacion, indice) => {
    const avanceConexion = limitar(recorrido - indice - 0.72);
    dibujarConexion(
      ctx,
      centros[indice] + 56,
      centros[indice + 1] - 56,
      y,
      avanceConexion,
      flujo.pasos[indice].color,
      relacion,
      flujo.transferencias[indice],
      (progreso * 5 + indice * 0.24) % 1,
    );
  });

  flujo.pasos.forEach((paso, indice) => {
    dibujarNodo(ctx, paso, indice, centros[indice], y, anchoNodo, limitar(recorrido - indice));
  });

  const panelY = Math.min(alto - 185, y + 215);
  dibujarIndicadores(ctx, flujo, margen, panelY, Math.min(ancho * 0.48, 650), 135, limitar((progreso - 0.62) * 3));
}

export default function Animacion() {
  const canvasRef = useRef(null);
  const marcoRef = useRef(null);
  const inicioRef = useRef(performance.now());
  const [acciones, setAcciones] = useState(() => obtenerAnimaciones());
  const [activa, setActiva] = useState(() => obtenerAnimaciones()[0] || { tipo: 'inicio', datos: {} });
  const [pausada, setPausada] = useState(false);

  useEffect(() => escucharAnimaciones((nueva) => {
    const accionesActuales = obtenerAnimaciones();
    setAcciones(accionesActuales);
    if (nueva) {
      setActiva(nueva);
      inicioRef.current = performance.now();
      setPausada(false);
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
      const transcurrido = (ahora - inicioRef.current) % 11000;
      const progreso = pausada ? 1 : Math.min(transcurrido / 8500, 1);
      dibujarMapa(ctx, ancho, alto, activa, progreso);
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
  const repetir = () => {
    inicioRef.current = performance.now();
    setPausada(false);
  };

  return (
    <main ref={marcoRef} className="animacion">
      <canvas ref={canvasRef} className="animacion__canvas" aria-label="Mapa visual de la actividad reciente" />
      <header className="animacion__cab">
        <span className="animacion__marca"><Icon name="animacion" size={18} /> MAPA EN VIVO</span>
        <div>
          <h1>{meta.titulo}</h1>
          <p>{meta.subtitulo}</p>
        </div>
      </header>
      <aside className="animacion__controles" aria-label="Controles del mapa">
        <button type="button" className="iconbtn" onClick={() => setPausada((valor) => !valor)} aria-label={pausada ? 'Reanudar recorrido' : 'Mostrar resultado'}>
          <Icon name={pausada ? 'derecha' : 'pausa'} size={18} />
        </button>
        <button type="button" className="iconbtn" onClick={repetir} aria-label="Repetir recorrido"><Icon name="refrescar" size={18} /></button>
        <button type="button" className="iconbtn" onClick={() => window.close()} aria-label="Cerrar pestana"><Icon name="cerrar" size={18} /></button>
      </aside>
      <section className="animacion__historial" aria-label="Acciones recientes">
        <span>Ver otra ejecucion</span>
        <div>
          {acciones.length ? acciones.map((accion) => {
            const item = METAS_ANIMACION[accion.tipo] || METAS_ANIMACION.inicio;
            return (
              <button
                key={accion.id}
                type="button"
                className={activa?.id === accion.id ? 'is-on' : ''}
                onClick={() => {
                  setActiva(accion);
                  inicioRef.current = performance.now();
                  setPausada(false);
                }}
              >
                <Icon name="animacion" size={14} />{item.titulo}
              </button>
            );
          }) : <p>Realiza una accion en Jobia para verla paso a paso.</p>}
        </div>
      </section>
    </main>
  );
}
