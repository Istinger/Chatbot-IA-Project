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
  } else if (tipo === 'persona') {
    ctx.arc(cx, cy - 8, 7, 0, Math.PI * 2);
    ctx.moveTo(cx - 14, cy + 14);
    ctx.quadraticCurveTo(cx, cy - 1, cx + 14, cy + 14);
  } else if (tipo === 'app') {
    ctx.rect(cx - 15, cy - 13, 30, 26);
    ctx.moveTo(cx - 15, cy - 5);
    ctx.lineTo(cx + 15, cy - 5);
    ctx.moveTo(cx - 10, cy - 9);
    ctx.lineTo(cx - 9, cy - 9);
    ctx.moveTo(cx - 5, cy - 9);
    ctx.lineTo(cx - 4, cy - 9);
    ctx.moveTo(cx - 9, cy + 1);
    ctx.lineTo(cx + 9, cy + 1);
    ctx.moveTo(cx - 9, cy + 7);
    ctx.lineTo(cx + 4, cy + 7);
  } else if (tipo === 'base') {
    ctx.ellipse(cx, cy - 11, 14, 6, 0, 0, Math.PI * 2);
    ctx.moveTo(cx - 14, cy - 11);
    ctx.lineTo(cx - 14, cy + 11);
    ctx.moveTo(cx + 14, cy - 11);
    ctx.lineTo(cx + 14, cy + 11);
    ctx.moveTo(cx - 14, cy);
    ctx.bezierCurveTo(cx - 8, cy + 7, cx + 8, cy + 7, cx + 14, cy);
    ctx.moveTo(cx - 14, cy + 10);
    ctx.bezierCurveTo(cx - 8, cy + 17, cx + 8, cy + 17, cx + 14, cy + 10);
  } else if (tipo === 'resultado') {
    [-10, 0, 10].forEach((salto, indice) => {
      ctx.rect(cx - 14, cy + salto - 4, 6, 6);
      ctx.moveTo(cx - 3, cy + salto - 1);
      ctx.lineTo(cx + 14 - indice * 2, cy + salto - 1);
    });
  } else if (tipo === 'convertir') {
    ctx.rect(cx - 13, cy - 13, 9, 9);
    ctx.rect(cx + 4, cy - 13, 9, 9);
    ctx.rect(cx - 4, cy + 4, 9, 9);
    ctx.moveTo(cx - 8, cy - 4);
    ctx.lineTo(cx - 2, cy + 2);
    ctx.moveTo(cx + 8, cy - 4);
    ctx.lineTo(cx + 2, cy + 2);
  } else if (tipo === 'fuentes') {
    [-10, 0, 10].forEach((salto) => {
      ctx.rect(cx - 14, cy + salto - 4, 8, 8);
      ctx.moveTo(cx - 2, cy + salto);
      ctx.lineTo(cx + 14, cy + salto);
    });
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
        { titulo: 'Tu CV', detalle: datos.archivo || 'Documento en PDF', dato: 'Archivo de entrada', icono: 'documento', color: COLORES.cian },
        { titulo: 'Lector de CV', detalle: 'Reconoce la informacion del documento', dato: datos.nombre || 'Datos detectados', icono: 'leer', color: COLORES.azul },
        { titulo: 'Tu perfil en Jobia', detalle: skills.slice(0, 3).join(', ') || 'Habilidades encontradas', dato: `${skills.length} habilidades`, icono: 'persona', color: COLORES.violeta },
        { titulo: 'Buscador de ofertas', detalle: datos.ofertas || 'Oportunidades relacionadas', dato: 'Perfil listo', icono: 'oferta', color: COLORES.verde },
      ],
      relaciones: ['envia el documento', 'crea', 'activa'],
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
      modo: 'matching',
      pasos: [
        { titulo: esBusqueda ? 'Tu busqueda' : 'Tu perfil', detalle: esBusqueda ? datos.consulta || 'Lo que quieres encontrar' : datos.perfil || 'Habilidades y preferencias', dato: esBusqueda ? 'Consulta' : 'Perfil profesional', icono: esBusqueda ? 'buscar' : 'persona', color: COLORES.cian },
        { titulo: 'Jobia', detalle: 'Recibe lo que estas buscando', dato: 'Solicitud recibida', icono: 'app', color: COLORES.azul },
        { titulo: 'Ofertas disponibles', detalle: `${ofertas.length || datos.total || 0} oportunidades para revisar`, dato: 'Catalogo de empleos', icono: 'base', color: COLORES.violeta },
        { titulo: 'Resultados para ti', detalle: ofertas[0]?.title || ofertas[0] || 'Ofertas ordenadas por afinidad', dato: ofertas[0]?.company || 'Mejor coincidencia', icono: 'resultado', color: COLORES.verde },
      ],
      relaciones: ['envia', 'consulta', 'devuelve'],
      transferencias: [
        esBusqueda ? datos.consulta || 'Tu busqueda' : datos.perfil || 'Tu perfil',
        esBusqueda ? datos.consulta || 'Palabras de busqueda' : 'Habilidades + preferencias',
        `${ofertas.length || datos.total || 0} ofertas encontradas`,
      ],
      resultado: esBusqueda ? 'Tu busqueda ya tiene resultados' : 'Estas son las oportunidades mas cercanas a ti',
      indicadores: [['Consulta', 1], ['Revisadas', Math.max(ofertas.length, Number(datos.total) || 0)], ['Destacadas', Math.min(3, ofertas.length)]],
      matching: {
        entrada: esBusqueda ? datos.consulta || 'Tu busqueda' : datos.perfil || 'Tu perfil profesional',
        total: Math.max(ofertas.length, Number(datos.total) || 0),
        mejor: ofertas[0],
        ofertas,
        skills: esBusqueda ? [] : lista(datos.skills),
      },
    };
  }

  if (tipo === 'crecimiento_analizado') {
    return {
      pasos: [
        { titulo: 'Tu perfil', detalle: datos.fortalezas || 'Habilidades que ya tienes', dato: 'Tus fortalezas', icono: 'persona', color: COLORES.verde },
        { titulo: 'Ofertas del mercado', detalle: `${datos.analizadas || 'Varias'} ofertas publicadas`, dato: 'Lo que estan pidiendo', icono: 'base', color: COLORES.azul },
        { titulo: 'Comparador de habilidades', detalle: faltantes.slice(0, 2).join(', ') || 'Oportunidades para mejorar', dato: `${faltantes.length} por aprender`, icono: 'comparar', color: COLORES.violeta },
        { titulo: 'Cursos recomendados', detalle: cursos[0]?.titulo || cursos[0] || 'Recursos para avanzar', dato: `${cursos.length} recursos`, icono: 'curso', color: COLORES.cian },
      ],
      relaciones: ['se compara con', 'pasa por', 'encuentra'],
      transferencias: [
        datos.fortalezas || 'Tus habilidades',
        `Requisitos de ${datos.analizadas || 'varias'} ofertas`,
        faltantes.slice(0, 2).join(' + ') || `${faltantes.length} oportunidades`,
      ],
      resultado: 'Ya tienes un siguiente paso claro',
      indicadores: [['Fortalezas', Number(datos.fortalezas?.length) || 1], ['Por aprender', faltantes.length], ['Cursos', cursos.length]],
    };
  }

  if (tipo === 'portafolio_sugerido') {
    return {
      pasos: [
        { titulo: 'Tus habilidades', detalle: skills.slice(0, 3).join(', ') || 'Lo que sabes hacer', dato: `${skills.length} habilidades`, icono: 'habilidades', color: COLORES.azul },
        { titulo: 'Jobia', detalle: 'Combina tus fortalezas', dato: 'Perfil recibido', icono: 'app', color: COLORES.violeta },
        { titulo: 'Ideas de proyecto', detalle: ideas[0]?.titulo || ideas[0] || 'Proyecto sugerido', dato: `${ideas.length} ideas`, icono: 'proyecto', color: COLORES.cian },
        { titulo: 'Tu portafolio', detalle: 'Proyectos que puedes mostrar', dato: 'Vitrina profesional', icono: 'resultado', color: COLORES.verde },
      ],
      relaciones: ['se envian a', 'genera', 'alimenta'],
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
        { titulo: 'Oferta elegida', detalle: oferta.title || 'Oportunidad seleccionada', dato: oferta.company || 'Oferta', icono: 'oferta', color: COLORES.azul },
        { titulo: 'Jobia', detalle: 'Recibe tu seleccion', dato: 'Marcada por ti', icono: 'app', color: COLORES.cian },
        { titulo: 'Guardados', detalle: 'Conserva la oportunidad', dato: `${datos.total || 1} oferta${datos.total === 1 ? '' : 's'}`, icono: 'base', color: COLORES.violeta },
        { titulo: 'Tu perfil', detalle: 'La muestra cuando vuelvas', dato: 'Disponible', icono: 'persona', color: COLORES.verde },
      ],
      relaciones: ['envia', 'guarda en', 'muestra a'],
      transferencias: [
        oferta.title || 'Oferta elegida',
        oferta.id || oferta.company || 'Identificador de oferta',
        `${datos.total || 1} guardada${datos.total === 1 ? '' : 's'}`,
      ],
      resultado: 'La oportunidad quedo guardada correctamente',
      indicadores: [['Elegida', 1], ['Guardadas', Number(datos.total) || 1], ['Disponible', 1]],
    };
  }

  return {
    pasos: [
      { titulo: 'Tu accion', detalle: 'Carga un CV, busca o guarda una oferta', dato: 'Esperando', icono: 'persona', color: COLORES.cian },
      { titulo: 'Jobia', detalle: 'Recibe la accion que realizaste', dato: 'Paso a paso', icono: 'app', color: COLORES.azul },
      { titulo: 'Datos relacionados', detalle: 'Solo la informacion necesaria', dato: 'Datos reales', icono: 'base', color: COLORES.violeta },
      { titulo: 'Resultado', detalle: 'Lo que la aplicacion preparo para ti', dato: 'Listo', icono: 'resultado', color: COLORES.verde },
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

function puntoCurva(inicio, control, fin, t) {
  const inverso = 1 - t;
  return {
    x: inverso * inverso * inicio.x + 2 * inverso * t * control.x + t * t * fin.x,
    y: inverso * inverso * inicio.y + 2 * inverso * t * control.y + t * t * fin.y,
  };
}

function dibujarConexionCurva(ctx, inicio, fin, control, avance, color, etiqueta, dato, movimiento) {
  const progreso = limitar(avance);
  const puntoFinal = puntoCurva(inicio, control, fin, progreso);
  const centro = puntoCurva(inicio, control, fin, 0.5);

  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'rgba(105, 145, 196, 0.25)';
  ctx.beginPath();
  ctx.moveTo(inicio.x, inicio.y);
  ctx.quadraticCurveTo(control.x, control.y, fin.x, fin.y);
  ctx.stroke();

  if (progreso > 0) {
    ctx.lineWidth = 4;
    ctx.strokeStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 9;
    ctx.beginPath();
    ctx.moveTo(inicio.x, inicio.y);
    ctx.quadraticCurveTo(
      inicio.x + (control.x - inicio.x) * progreso,
      inicio.y + (control.y - inicio.y) * progreso,
      puntoFinal.x,
      puntoFinal.y,
    );
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  const antes = puntoCurva(inicio, control, fin, 0.96);
  const angulo = Math.atan2(fin.y - antes.y, fin.x - antes.x);
  ctx.fillStyle = progreso >= 1 ? color : 'rgba(105, 145, 196, 0.42)';
  ctx.beginPath();
  ctx.moveTo(fin.x, fin.y);
  ctx.lineTo(fin.x - 12 * Math.cos(angulo - 0.5), fin.y - 12 * Math.sin(angulo - 0.5));
  ctx.lineTo(fin.x - 12 * Math.cos(angulo + 0.5), fin.y - 12 * Math.sin(angulo + 0.5));
  ctx.closePath();
  ctx.fill();

  ctx.font = '700 11px system-ui, sans-serif';
  ctx.textAlign = 'center';
  const rotulo = textoCorto(etiqueta, 22);
  const anchoRotulo = ctx.measureText(rotulo).width + 20;
  redondear(ctx, centro.x - anchoRotulo / 2, centro.y - 31, anchoRotulo, 22, 11);
  ctx.fillStyle = 'rgba(5, 16, 34, 0.96)';
  ctx.fill();
  ctx.strokeStyle = `${color}66`;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = progreso >= 1 ? color : COLORES.suave;
  ctx.fillText(rotulo, centro.x, centro.y - 16);

  if (progreso > 0) {
    const posicion = progreso < 1 ? progreso : movimiento;
    const paquete = puntoCurva(inicio, control, fin, posicion);
    const opciones = Array.isArray(dato) ? dato.filter(Boolean) : [dato];
    const opcion = opciones[Math.floor(movimiento * Math.max(1, opciones.length)) % Math.max(1, opciones.length)];
    const contenido = textoCorto(opcion, 34);
    const anchoDato = Math.max(78, ctx.measureText(contenido).width + 24);
    redondear(ctx, paquete.x - anchoDato / 2, paquete.y + 12, anchoDato, 27, 13);
    ctx.fillStyle = 'rgba(8, 24, 49, 0.98)';
    ctx.shadowColor = color;
    ctx.shadowBlur = 13;
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = `${color}aa`;
    ctx.stroke();
    ctx.fillStyle = COLORES.texto;
    ctx.fillText(contenido, paquete.x, paquete.y + 30);
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

function dibujarMapaMatching(ctx, ancho, alto, flujo, progreso) {
  const margenX = Math.max(84, ancho * 0.065);
  const superior = Math.max(205, alto * 0.29);
  const inferior = Math.min(alto - 235, alto * 0.67);
  const centroY = (superior + inferior) / 2;
  const xEntrada = margenX;
  const xConversor = ancho * 0.31;
  const xComparador = ancho * 0.57;
  const xResultado = ancho - margenX;
  const total = flujo.matching.total;
  const mejor = flujo.matching.mejor;
  const ofertas = flujo.matching.ofertas;
  const fuentes = [...new Set(ofertas.map((oferta) => oferta.source).filter(Boolean))];
  const habilidades = flujo.matching.skills;
  const ofertasEnViaje = ofertas.map((oferta) =>
    [oferta.title, oferta.company, oferta.location || oferta.country].filter(Boolean).join(' · '),
  );
  const catalogoEnViaje = ofertas.map((oferta) =>
    [
      oferta.source,
      oferta.skills?.slice(0, 2).join(' + '),
      oferta.salaryUsdMax ? `$${Math.round(oferta.salaryUsdMax / 1000)}k USD` : null,
    ].filter(Boolean).join(' · '),
  );
  const resultadosEnViaje = ofertas.map((oferta) =>
    [
      oferta.score != null ? `${Math.round(oferta.score * 100)}%` : null,
      oferta.title,
      oferta.company,
    ].filter(Boolean).join(' · '),
  );
  const puntaje = mejor?.score ? `${Math.round(mejor.score * 100)}% afinidad` : `${total} ofertas ordenadas`;
  const recorrido = progreso * 4;
  const movimiento = (progreso * 6) % 1;

  const nodos = [
    {
      paso: {
        titulo: flujo.pasos[0].titulo,
        detalle: flujo.pasos[0].detalle,
        dato: flujo.pasos[0].dato,
        icono: flujo.pasos[0].icono,
        color: COLORES.cian,
      },
      x: xEntrada,
      y: superior,
      etapa: 0,
    },
    {
      paso: {
        titulo: 'Fuentes de empleo',
        detalle: fuentes.join(' · ') || 'Adzuna · Jooble · Remote OK · Careerjet · Arbeitnow',
        dato: `${fuentes.length || 5} fuentes presentes`,
        icono: 'fuentes',
        color: COLORES.azul,
      },
      x: xEntrada,
      y: inferior,
      etapa: 0,
    },
    {
      paso: {
        titulo: 'Vector de tu perfil',
        detalle: habilidades.join(' · ') || flujo.matching.entrada,
        dato: '384 valores calculados',
        icono: 'convertir',
        color: COLORES.cian,
      },
      x: xConversor,
      y: superior,
      etapa: 1,
    },
    {
      paso: {
        titulo: 'Catálogo preparado',
        detalle: ofertas.slice(0, 2).map((oferta) => oferta.title).filter(Boolean).join(' · ') || 'Normaliza, detecta skills y evita duplicados',
        dato: `${total || 'Varias'} ofertas`,
        icono: 'oferta',
        color: COLORES.azul,
      },
      x: xConversor,
      y: inferior,
      etapa: 1,
    },
    {
      paso: {
        titulo: 'PostgreSQL + pgvector',
        detalle: 'Compara qué tan cerca están los vectores',
        dato: 'Similitud semántica',
        icono: 'base',
        color: COLORES.violeta,
      },
      x: xComparador,
      y: centroY,
      etapa: 2,
    },
    {
      paso: {
        titulo: 'Resultados para ti',
        detalle: [mejor?.title, mejor?.location || mejor?.country].filter(Boolean).join(' · ') || mejor || 'Las oportunidades más cercanas',
        dato: mejor?.company || puntaje,
        icono: 'resultado',
        color: COLORES.verde,
      },
      x: xResultado,
      y: centroY,
      etapa: 3,
    },
  ];

  const conexiones = [
    {
      inicio: { x: xEntrada + 55, y: superior },
      fin: { x: xConversor - 55, y: superior },
      control: { x: (xEntrada + xConversor) / 2, y: superior },
      etapa: 0,
      color: COLORES.cian,
      etiqueta: 'convierte',
      dato: habilidades.length ? habilidades : flujo.matching.entrada,
    },
    {
      inicio: { x: xEntrada + 55, y: inferior },
      fin: { x: xConversor - 55, y: inferior },
      control: { x: (xEntrada + xConversor) / 2, y: inferior },
      etapa: 0,
      color: COLORES.azul,
      etiqueta: 'reúne y limpia',
      dato: ofertasEnViaje.length ? ofertasEnViaje : 'título + empresa + salario + skills',
    },
    {
      inicio: { x: xConversor + 55, y: superior },
      fin: { x: xComparador - 58, y: centroY - 30 },
      control: { x: ancho * 0.45, y: superior },
      etapa: 1,
      color: COLORES.cian,
      etiqueta: 'envía',
      dato: [
        ...habilidades.map((skill) => `${skill} → valor numérico`),
        'vector del perfil · 384 valores',
      ],
    },
    {
      inicio: { x: xConversor + 55, y: inferior },
      fin: { x: xComparador - 58, y: centroY + 30 },
      control: { x: ancho * 0.45, y: inferior },
      etapa: 1,
      color: COLORES.azul,
      etiqueta: 'consulta',
      dato: catalogoEnViaje.length ? catalogoEnViaje : `${total || 'varios'} vectores de ofertas`,
    },
    {
      inicio: { x: xComparador + 58, y: centroY },
      fin: { x: xResultado - 58, y: centroY },
      control: { x: (xComparador + xResultado) / 2, y: centroY },
      etapa: 2,
      color: COLORES.verde,
      etiqueta: 'ordena por afinidad',
      dato: resultadosEnViaje.length ? resultadosEnViaje : puntaje,
    },
  ];

  conexiones.forEach((conexion, indice) => {
    dibujarConexionCurva(
      ctx,
      conexion.inicio,
      conexion.fin,
      conexion.control,
      limitar(recorrido - conexion.etapa - 0.62),
      conexion.color,
      conexion.etiqueta,
      conexion.dato,
      (movimiento + indice * 0.17) % 1,
    );
  });

  nodos.forEach(({ paso, x, y, etapa }) => {
    dibujarNodo(ctx, paso, etapa, x, y, Math.min(230, ancho * 0.17), limitar(recorrido - etapa));
  });
}

function dibujarMapa(ctx, ancho, alto, accion, progreso) {
  dibujarFondo(ctx, ancho, alto);
  const flujo = flujoDe(accion);
  if (flujo.modo === 'matching') {
    dibujarMapaMatching(ctx, ancho, alto, flujo, progreso);
    return;
  }
  const margen = Math.max(80, ancho * 0.075);
  const espacioUtil = ancho - margen * 2;
  const anchoNodo = Math.min(220, espacioUtil / 4.6);
  const y = Math.max(235, alto * 0.42);
  const recorrido = progreso * flujo.pasos.length;
  const centros = flujo.pasos.map((_, indice) => margen + (espacioUtil * indice) / 3);

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

  const repetir = () => {
    inicioRef.current = performance.now();
    setPausada(false);
  };

  return (
    <main ref={marcoRef} className="animacion">
      <canvas ref={canvasRef} className="animacion__canvas" aria-label="Mapa visual de la actividad reciente" />
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
