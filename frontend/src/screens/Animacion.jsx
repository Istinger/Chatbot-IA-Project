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

  if (tipo === 'busqueda_abierta' || tipo === 'busqueda_realizada') {
    return {
      modo: 'busqueda',
      busqueda: {
        esperando: tipo === 'busqueda_abierta',
        original: datos.consultaOriginal || datos.consulta || '',
        usada: datos.consulta || datos.consultaOriginal || '',
        reformulada: Boolean(datos.reformulada),
        filtros: lista(datos.filtros),
        total: Number(datos.total) || 0,
        visibles: Number(datos.visibles) || 0,
        ofertas,
        origen: datos.origen || 'usuario',
      },
    };
  }

  if (tipo === 'ofertas_encontradas') {
    return {
      modo: 'matching',
      pasos: [
        { titulo: 'Tu perfil', detalle: datos.perfil || 'Habilidades y preferencias', dato: 'Perfil profesional', icono: 'persona', color: COLORES.cian },
        { titulo: 'Jobia', detalle: 'Recibe lo que estas buscando', dato: 'Solicitud recibida', icono: 'app', color: COLORES.azul },
        { titulo: 'Ofertas disponibles', detalle: `${ofertas.length || datos.total || 0} oportunidades para revisar`, dato: 'Catalogo de empleos', icono: 'base', color: COLORES.violeta },
        { titulo: 'Resultados para ti', detalle: ofertas[0]?.title || ofertas[0] || 'Ofertas ordenadas por afinidad', dato: ofertas[0]?.company || 'Mejor coincidencia', icono: 'resultado', color: COLORES.verde },
      ],
      relaciones: ['envia', 'consulta', 'devuelve'],
      transferencias: [
        datos.perfil || 'Tu perfil',
        'Habilidades + preferencias',
        `${ofertas.length || datos.total || 0} ofertas encontradas`,
      ],
      resultado: 'Estas son las oportunidades mas cercanas a ti',
      indicadores: [['Consulta', 1], ['Revisadas', Math.max(ofertas.length, Number(datos.total) || 0)], ['Destacadas', Math.min(3, ofertas.length)]],
      matching: {
        esBusqueda: false,
        entrada: datos.perfil || 'Tu perfil profesional',
        total: Math.max(ofertas.length, Number(datos.total) || 0),
        mejor: ofertas[0],
        ofertas,
        skills: lista(datos.skills),
      },
    };
  }

  if (tipo === 'crecer_abierta' || tipo === 'crecimiento_analizado') {
    return {
      modo: 'crecer',
      crecer: {
        esperando: tipo === 'crecer_abierta',
        analizadas: Number(datos.analizadas) || 0,
        tusSkills: lista(datos.tusSkills),
        fortalezas: lista(datos.fortalezas),
        faltantes: lista(datos.faltantes),
        cursos: lista(datos.cursos),
        progreso: lista(datos.progreso),
        proyeccion: datos.proyeccion || null,
        abierta: datos.abierta || null,
        tienePlan: Boolean(datos.tienePlan),
        tieneExplicacion: Boolean(datos.tieneExplicacion),
        estadoPlan: datos.estadoPlan || (datos.tienePlan ? 'listo' : 'disponible'),
        errorPlan: datos.errorPlan || null,
      },
    };
  }

  if (tipo === 'portafolio_abierto' || tipo === 'portafolio_sugerido') {
    return {
      modo: 'portafolio',
      portafolio: {
        esperando: tipo === 'portafolio_abierto',
        skills: lista(datos.skills),
        faltantes: lista(datos.faltantes),
        ideas: lista(datos.ideas),
        guardadas: lista(datos.guardadas),
        catalogo: Number(datos.catalogo) || 50,
        origen: datos.origen || 'cargando',
        personalizado: Boolean(datos.personalizado),
      },
    };
  }

  if (
    tipo === 'entrevista_configurada'
    || tipo === 'entrevista_practica'
    || tipo === 'entrevista_feedback'
    || tipo === 'entrevista_historial'
  ) {
    return {
      modo: 'entrevista',
      entrevista: {
        estado:
          tipo === 'entrevista_historial'
            ? 'historial'
            : tipo === 'entrevista_feedback'
              ? 'feedback'
              : tipo === 'entrevista_practica'
                ? 'practica'
                : 'configuracion',
        fase: datos.fase || 'setup',
        cfg: datos.cfg || {},
        area: datos.area || null,
        sessionId: datos.sessionId || null,
        totalPreguntas: Number(datos.totalPreguntas) || 0,
        pendientes: Number(datos.pendientes) || 0,
        respondidas: Number(datos.respondidas) || 0,
        preguntaActual: datos.preguntaActual || null,
        esRepregunta: Boolean(datos.esRepregunta),
        respuestaActual: datos.respuestaActual || '',
        pensando: Boolean(datos.pensando),
        escuchando: Boolean(datos.escuchando),
        ultimaRepregunta: datos.ultimaRepregunta || null,
        transcript: lista(datos.transcript),
        feedback: datos.feedback || null,
        entrevistas: lista(datos.entrevistas),
        recurrentes: lista(datos.recurrentes),
        planEstado: datos.planEstado || 'disponible',
      },
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
  const intensidad = completado ? 1 : activo ? 0.94 : 0.6;
  const tamanoIcono = 82;

  ctx.save();
  ctx.globalAlpha = intensidad;
  ctx.shadowColor = paso.color;
  ctx.shadowBlur = activo ? 30 : completado ? 16 : 0;
  redondear(
    ctx,
    x - tamanoIcono / 2,
    y - tamanoIcono / 2,
    tamanoIcono,
    tamanoIcono,
    12,
  );
  ctx.fillStyle = `${paso.color}${activo ? '44' : completado ? '30' : '14'}`;
  ctx.fill();
  dibujarIcono(ctx, paso.icono, x - tamanoIcono / 2, y - tamanoIcono / 2, tamanoIcono, paso.color);
  ctx.shadowBlur = 0;

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
  const esBusqueda = flujo.matching.esBusqueda;
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

  ctx.save();
  ctx.textAlign = 'left';
  ctx.font = '700 12px system-ui, sans-serif';
  ctx.fillStyle = COLORES.cian;
  ctx.fillText(
    esBusqueda ? 'AL REALIZAR UNA BUSQUEDA' : 'AL BUSCAR RECOMENDACIONES',
    xEntrada - 42,
    superior - 112,
  );
  ctx.fillStyle = COLORES.azul;
  ctx.fillText('PROCESO AUTOMATICO PREVIO', xEntrada - 42, inferior - 112);
  ctx.font = '11px system-ui, sans-serif';
  ctx.fillStyle = COLORES.suave;
  ctx.fillText(
    esBusqueda
      ? 'FastEmbed y ONNX convierten la consulta actual en un vector'
      : 'La API utiliza el vector guardado cuando cambia el CV o las skills',
    xEntrada - 42,
    superior - 94,
  );
  ctx.fillText('Las ofertas se actualizan periodicamente antes de la busqueda', xEntrada - 42, inferior - 94);
  ctx.restore();

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
        titulo: esBusqueda ? 'Vector de tu busqueda' : 'Vector de tu perfil',
        detalle: esBusqueda
          ? 'FastEmbed + ONNX procesa la consulta'
          : 'FastEmbed + ONNX · embedding guardado',
        dato: 'Vector de 384 dimensiones',
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
        detalle: 'Normaliza, deduplica por externalId y detecta skills',
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
        detalle: 'pgvector es la extensión que calcula similitud coseno',
        dato: 'Operador <=>',
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
      etiqueta: esBusqueda ? 'convierte consulta' : 'lee embedding',
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
      etiqueta: esBusqueda ? 'embedding de consulta' : 'embedding del perfil',
      dato: [
        ...habilidades.map((skill) => `${skill} → valor numérico`),
        esBusqueda ? 'vector de consulta · 384 valores' : 'vector del perfil · 384 valores',
      ],
    },
    {
      inicio: { x: xConversor + 55, y: inferior },
      fin: { x: xComparador - 58, y: centroY + 30 },
      control: { x: ancho * 0.45, y: inferior },
      etapa: 1,
      color: COLORES.azul,
      etiqueta: 'embeddings de ofertas',
      dato: [
        'vectores de ofertas · 384 dimensiones',
        ...(catalogoEnViaje.length ? catalogoEnViaje : [`${total || 'varios'} vectores de ofertas`]),
      ],
    },
    {
      inicio: { x: xComparador + 58, y: centroY },
      fin: { x: xResultado - 58, y: centroY },
      control: { x: (xComparador + xResultado) / 2, y: centroY },
      etapa: 2,
      color: COLORES.verde,
      etiqueta: 'umbral + epsilon-greedy',
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

function dibujarMapaBusqueda(ctx, ancho, alto, flujo, progreso) {
  const datos = flujo.busqueda;
  const margen = Math.max(78, ancho * 0.06);
  const superior = Math.max(225, alto * 0.3);
  const inferior = Math.min(alto - 215, alto * 0.68);
  const anchoNodo = Math.min(205, ancho * 0.135);
  const recorrido = progreso * 7;
  const movimiento = (progreso * 7) % 1;
  const ofertas = datos.ofertas;
  const filtros = datos.filtros;
  const original = datos.original || 'Esperando una consulta';
  const usada = datos.usada || original;
  const resumenFiltros = filtros.length
    ? filtros.map((filtro) => `${filtro.nombre}: ${filtro.valor}`).join(' · ')
    : 'Sin filtros activos';
  const ofertasEnViaje = ofertas.map((oferta) =>
    [
      oferta.score != null ? `${Math.round(oferta.score * 100)}%` : null,
      oferta.title,
      oferta.company,
    ].filter(Boolean).join(' · '),
  );
  const posiciones = {
    consulta: { x: margen, y: superior },
    reformula: { x: ancho * 0.245, y: superior },
    vector: { x: ancho * 0.43, y: superior },
    pgvector: { x: ancho * 0.62, y: superior },
    seleccion: { x: ancho * 0.62, y: inferior },
    filtros: { x: ancho * 0.79, y: inferior },
    resultados: { x: ancho - margen, y: inferior },
  };

  ctx.save();
  ctx.textAlign = 'left';
  ctx.font = '700 12px system-ui, sans-serif';
  ctx.fillStyle = COLORES.cian;
  ctx.fillText('ENTRADA Y CONVERSION', posiciones.consulta.x - 42, superior - 112);
  ctx.fillStyle = COLORES.violeta;
  ctx.fillText('BUSQUEDA SEMANTICA EN EL SERVIDOR', posiciones.pgvector.x - 92, superior - 112);
  ctx.fillStyle = COLORES.verde;
  ctx.fillText('RESULTADO EN EL FRONTEND', posiciones.filtros.x - 72, inferior - 112);
  ctx.restore();

  const nodos = [
    {
      paso: {
        titulo: datos.origen === 'asistente' ? 'Solicitud del Asistente' : 'Tu consulta',
        detalle: original,
        dato: datos.esperando ? 'Esperando texto' : 'Texto recibido',
        icono: 'buscar',
        color: COLORES.cian,
      },
      posicion: posiciones.consulta,
      etapa: 0,
    },
    {
      paso: {
        titulo: datos.reformulada ? 'Reformulacion con IA' : 'Consulta afirmativa',
        detalle: datos.reformulada ? `${original} → ${usada}` : 'No necesita reformulacion',
        dato: datos.reformulada ? 'OpenRouter' : 'Sin llamada al LLM',
        icono: 'comparar',
        color: datos.reformulada ? COLORES.violeta : COLORES.azul,
      },
      posicion: posiciones.reformula,
      etapa: 1,
    },
    {
      paso: {
        titulo: 'FastEmbed + ONNX',
        detalle: 'matching-service · FastAPI',
        dato: 'Vector de 384 dimensiones',
        icono: 'convertir',
        color: COLORES.azul,
      },
      posicion: posiciones.vector,
      etapa: 2,
    },
    {
      paso: {
        titulo: 'PostgreSQL + pgvector',
        detalle: 'Compara la consulta con los embeddings de ofertas',
        dato: 'Distancia coseno <=>',
        icono: 'base',
        color: COLORES.violeta,
      },
      posicion: posiciones.pgvector,
      etapa: 3,
    },
    {
      paso: {
        titulo: 'Seleccion del backend',
        detalle: `${datos.total} resultados por la API · epsilon-greedy`,
        dato: 'MIN_TOP · MIN_ITEM',
        icono: 'ordenar',
        color: COLORES.amarillo,
      },
      posicion: posiciones.seleccion,
      etapa: 4,
    },
    {
      paso: {
        titulo: 'Filtros del navegador',
        detalle: resumenFiltros,
        dato: `${datos.visibles} de ${datos.total} visibles`,
        icono: 'comparar',
        color: COLORES.azul,
      },
      posicion: posiciones.filtros,
      etapa: 5,
    },
    {
      paso: {
        titulo: 'Tarjetas en pantalla',
        detalle: ofertas[0]?.title || (datos.esperando ? 'Aun no hay una busqueda' : 'No hay resultados visibles'),
        dato: `${datos.visibles} resultado${datos.visibles === 1 ? '' : 's'}`,
        icono: 'resultado',
        color: COLORES.verde,
      },
      posicion: posiciones.resultados,
      etapa: 6,
    },
  ];

  const conexiones = [
    {
      inicio: { x: posiciones.consulta.x + 55, y: superior },
      fin: { x: posiciones.reformula.x - 55, y: superior },
      control: { x: (posiciones.consulta.x + posiciones.reformula.x) / 2, y: superior },
      etapa: 0,
      color: COLORES.cian,
      etiqueta: 'lee',
      dato: original,
    },
    {
      inicio: { x: posiciones.reformula.x + 55, y: superior },
      fin: { x: posiciones.vector.x - 55, y: superior },
      control: { x: (posiciones.reformula.x + posiciones.vector.x) / 2, y: superior },
      etapa: 1,
      color: datos.reformulada ? COLORES.violeta : COLORES.azul,
      etiqueta: datos.reformulada ? 'reescribe' : 'continua igual',
      dato: usada,
    },
    {
      inicio: { x: posiciones.vector.x + 55, y: superior },
      fin: { x: posiciones.pgvector.x - 55, y: superior },
      control: { x: (posiciones.vector.x + posiciones.pgvector.x) / 2, y: superior },
      etapa: 2,
      color: COLORES.azul,
      etiqueta: 'vectoriza',
      dato: 'embedding de consulta · 384D',
    },
    {
      inicio: { x: posiciones.pgvector.x, y: superior + 55 },
      fin: { x: posiciones.seleccion.x, y: inferior - 55 },
      control: { x: posiciones.pgvector.x + ancho * 0.045, y: (superior + inferior) / 2 },
      etapa: 3,
      color: COLORES.violeta,
      etiqueta: 'devuelve candidatas',
      dato: ofertasEnViaje.length ? ofertasEnViaje : `${datos.total} candidatas`,
    },
    {
      inicio: { x: posiciones.seleccion.x + 55, y: inferior },
      fin: { x: posiciones.filtros.x - 55, y: inferior },
      control: { x: (posiciones.seleccion.x + posiciones.filtros.x) / 2, y: inferior },
      etapa: 4,
      color: COLORES.amarillo,
      etiqueta: 'entrega resultados',
      dato: ofertasEnViaje.length ? ofertasEnViaje : `${datos.total} ofertas`,
    },
    {
      inicio: { x: posiciones.filtros.x + 55, y: inferior },
      fin: { x: posiciones.resultados.x - 55, y: inferior },
      control: { x: (posiciones.filtros.x + posiciones.resultados.x) / 2, y: inferior },
      etapa: 5,
      color: COLORES.verde,
      etiqueta: 'muestra',
      dato: filtros.length ? filtros.map((filtro) => filtro.valor) : 'sin filtros',
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
      (movimiento + indice * 0.16) % 1,
    );
  });

  nodos.forEach(({ paso, posicion, etapa }) => {
    dibujarNodo(
      ctx,
      paso,
      etapa,
      posicion.x,
      posicion.y,
      anchoNodo,
      limitar(recorrido - etapa),
    );
  });
}

function dibujarMapaCrecer(ctx, ancho, alto, flujo, progreso) {
  const datos = flujo.crecer;
  const margen = Math.max(145, ancho * 0.075);
  const superior = Math.max(225, alto * 0.29);
  const medio = Math.max(superior + 185, alto * 0.51);
  const inferior = Math.min(alto - 170, alto * 0.77);
  const anchoNodo = Math.min(200, ancho * 0.125);
  const recorrido = progreso * 6;
  const movimiento = (progreso * 6) % 1;

  const skillTexto = (item) =>
    typeof item === 'string'
      ? item
      : [item?.skill, item?.porcentaje != null ? `${item.porcentaje}%` : null]
          .filter(Boolean)
          .join(' ');
  const skills = datos.tusSkills.map(skillTexto).filter(Boolean);
  const fortalezas = datos.fortalezas.map(skillTexto).filter(Boolean);
  const faltantes = datos.faltantes.map(skillTexto).filter(Boolean);
  const cursos = datos.cursos
    .flatMap((curso) =>
      lista(curso?.opciones).map((opcion) =>
        [opcion?.titulo, opcion?.proveedor].filter(Boolean).join(' · '),
      ),
    )
    .filter(Boolean);
  const progresoSkills = datos.progreso
    .map((item) => [item?.skill, item?.estado].filter(Boolean).join(' · '))
    .filter(Boolean);
  const demanda = [...datos.faltantes, ...datos.fortalezas]
    .map(skillTexto)
    .filter(Boolean);
  const proyeccion = datos.proyeccion;
  const detalleProyeccion = proyeccion
    ? proyeccion.exacto
      ? `${proyeccion.tope} de ${datos.analizadas} ofertas`
      : `${proyeccion.minimo}-${proyeccion.tope} de ${datos.analizadas} ofertas`
    : 'Marca una habilidad para proyectar';
  const posiciones = {
    perfil: { x: margen, y: superior },
    ofertas: { x: margen, y: inferior },
    analisis: { x: ancho * 0.35, y: medio },
    fortalezas: { x: ancho * 0.59, y: superior },
    asistente: { x: ancho * 0.84, y: superior },
    brechas: { x: ancho * 0.59, y: medio },
    cursos: { x: ancho * 0.84, y: medio + 34 },
    progreso: { x: ancho * 0.59, y: inferior },
    proyeccion: { x: ancho * 0.84, y: inferior },
  };

  ctx.save();
  ctx.textAlign = 'left';
  ctx.font = '700 12px system-ui, sans-serif';
  ctx.fillStyle = COLORES.cian;
  ctx.fillText('DATOS QUE SE COMPARAN', posiciones.perfil.x - 40, superior - 112);
  ctx.fillStyle = COLORES.violeta;
  ctx.fillText('CALCULO EXACTO · SIN IA', posiciones.analisis.x - 82, medio - 112);
  ctx.fillStyle = COLORES.verde;
  ctx.fillText('SIGUIENTE PASO', posiciones.cursos.x - 65, posiciones.cursos.y - 105);
  ctx.fillStyle = COLORES.violeta;
  ctx.fillText('AYUDA OPCIONAL CON IA', posiciones.asistente.x - 76, superior - 112);
  ctx.restore();

  const estadoPlan = {
    disponible: {
      detalle: 'Se activa al pulsar el boton de 4 semanas',
      dato: 'Listo para solicitar',
      color: COLORES.suave,
    },
    generando: {
      detalle: 'OpenRouter organiza tus brechas y progreso por semana',
      dato: 'Generando ahora',
      color: COLORES.amarillo,
    },
    listo: {
      detalle: 'El plan aparece y se enfoca en la columna derecha',
      dato: 'Plan de 4 semanas listo',
      color: COLORES.violeta,
    },
    error: {
      detalle: datos.errorPlan || 'El servicio no pudo responder',
      dato: 'Solicitud con error',
      color: COLORES.amarillo,
    },
  }[datos.estadoPlan] || {
    detalle: 'Se activa al pulsar el boton de 4 semanas',
    dato: 'Listo para solicitar',
    color: COLORES.suave,
  };

  const nodos = [
    {
      paso: {
        titulo: 'Habilidades de tu perfil',
        detalle: skills.join(' · ') || 'Esperando las habilidades del perfil',
        dato: `${skills.length} skill${skills.length === 1 ? '' : 's'}`,
        icono: 'persona',
        color: COLORES.cian,
      },
      posicion: posiciones.perfil,
      etapa: 0,
    },
    {
      paso: {
        titulo: 'Ofertas afines',
        detalle: 'matching-service + PostgreSQL + pgvector',
        dato: datos.esperando ? 'Consultando ofertas' : `${datos.analizadas} analizadas`,
        icono: 'fuentes',
        color: COLORES.azul,
      },
      posicion: posiciones.ofertas,
      etapa: 0,
    },
    {
      paso: {
        titulo: 'Comparador de conjuntos',
        detalle: 'Cuenta cada skill una vez por oferta y calcula su porcentaje',
        dato: 'Set + porcentajes · sin IA',
        icono: 'comparar',
        color: COLORES.violeta,
      },
      posicion: posiciones.analisis,
      etapa: 1,
    },
    {
      paso: {
        titulo: 'Tus fortalezas',
        detalle: fortalezas.join(' · ') || 'No hay fortalezas comunes todavia',
        dato: `${fortalezas.length} coincidencias`,
        icono: 'habilidades',
        color: COLORES.verde,
      },
      posicion: posiciones.fortalezas,
      etapa: 2,
    },
    {
      paso: {
        titulo: 'Plan opcional con IA',
        detalle: estadoPlan.detalle,
        dato: estadoPlan.dato,
        icono: 'app',
        color: estadoPlan.color,
      },
      posicion: posiciones.asistente,
      etapa: 3,
    },
    {
      paso: {
        titulo: 'Lo que te falta',
        detalle: faltantes.join(' · ') || 'No se detectaron brechas',
        dato: `${faltantes.length} brechas priorizadas`,
        icono: 'comparar',
        color: COLORES.amarillo,
      },
      posicion: posiciones.brechas,
      etapa: 2,
    },
    {
      paso: {
        titulo: 'Cursos recomendados',
        detalle: cursos.join(' · ') || 'No hacen falta cursos por ahora',
        dato: `${cursos.length} recursos del catalogo`,
        icono: 'curso',
        color: COLORES.verde,
      },
      posicion: posiciones.cursos,
      etapa: 3,
    },
    {
      paso: {
        titulo: datos.tienePlan ? 'Plan y progreso' : 'Tu progreso',
        detalle: datos.tienePlan
          ? 'Plan de 4 semanas con chat opcional y marcas guardadas localmente'
          : progresoSkills.join(' · ') || 'Aun no has marcado habilidades',
        dato: datos.tienePlan ? 'IA solo para el plan' : 'Guardado en localStorage',
        icono: 'guardar',
        color: COLORES.azul,
      },
      posicion: posiciones.progreso,
      etapa: 3,
    },
    {
      paso: {
        titulo: 'Proyeccion local',
        detalle: proyeccion?.skills?.join(' · ') || 'Se calcula con las brechas marcadas',
        dato: detalleProyeccion,
        icono: 'resultado',
        color: COLORES.verde,
      },
      posicion: posiciones.proyeccion,
      etapa: 4,
    },
  ];

  const conexiones = [
    {
      inicio: { x: posiciones.perfil.x + 55, y: superior },
      fin: { x: posiciones.analisis.x - 55, y: medio - 18 },
      control: { x: ancho * 0.21, y: superior },
      etapa: 0,
      color: COLORES.cian,
      etiqueta: 'lee tu perfil',
      dato: skills.length ? skills : 'skills del perfil',
    },
    {
      inicio: { x: posiciones.ofertas.x + 55, y: inferior },
      fin: { x: posiciones.analisis.x - 55, y: medio + 18 },
      control: { x: ancho * 0.21, y: inferior },
      etapa: 0,
      color: COLORES.azul,
      etiqueta: 'cuenta demanda',
      dato: demanda.length ? demanda : `${datos.analizadas} ofertas`,
    },
    {
      inicio: { x: posiciones.analisis.x + 55, y: medio - 15 },
      fin: { x: posiciones.fortalezas.x - 55, y: superior },
      control: { x: ancho * 0.46, y: superior },
      etapa: 1,
      color: COLORES.verde,
      etiqueta: 'interseccion',
      dato: fortalezas.length ? fortalezas : 'skills que ya tienes',
    },
    {
      inicio: { x: posiciones.analisis.x + 55, y: medio + 8 },
      fin: { x: posiciones.brechas.x - 55, y: posiciones.brechas.y },
      control: { x: ancho * 0.47, y: posiciones.brechas.y },
      etapa: 1,
      color: COLORES.amarillo,
      etiqueta: 'diferencia',
      dato: faltantes.length ? faltantes : 'sin brechas',
    },
    {
      inicio: { x: posiciones.brechas.x + 55, y: posiciones.brechas.y },
      fin: { x: posiciones.cursos.x - 55, y: posiciones.cursos.y },
      control: { x: ancho * 0.715, y: posiciones.cursos.y },
      etapa: 2,
      color: COLORES.verde,
      etiqueta: 'consulta catalogo',
      dato: cursos.length ? cursos : 'catalogo estatico',
    },
    {
      inicio: { x: posiciones.brechas.x + 40, y: posiciones.brechas.y - 38 },
      fin: { x: posiciones.asistente.x - 55, y: superior + 18 },
      control: { x: ancho * 0.7, y: superior + 42 },
      etapa: 2,
      color: COLORES.violeta,
      etiqueta: 'arma el mensaje',
      dato: [
        `${datos.analizadas} ofertas analizadas`,
        ...faltantes,
        ...(progresoSkills.length ? progresoSkills : ['sin progreso marcado']),
      ],
    },
    {
      inicio: { x: posiciones.brechas.x + 58, y: posiciones.brechas.y + 35 },
      fin: { x: posiciones.progreso.x + 58, y: inferior - 35 },
      control: { x: posiciones.brechas.x + ancho * 0.075, y: (posiciones.brechas.y + inferior) / 2 },
      etapa: 2,
      color: COLORES.azul,
      etiqueta: 'marca avance',
      dato: progresoSkills.length ? progresoSkills : 'sin marcas todavia',
    },
    {
      inicio: { x: posiciones.progreso.x + 55, y: inferior },
      fin: { x: posiciones.proyeccion.x - 55, y: inferior },
      control: { x: ancho * 0.695, y: inferior },
      etapa: 3,
      color: COLORES.verde,
      etiqueta: 'calcula localmente',
      dato: detalleProyeccion,
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
      (movimiento + indice * 0.13) % 1,
    );
  });

  nodos.forEach(({ paso, posicion, etapa }) => {
    dibujarNodo(
      ctx,
      paso,
      etapa,
      posicion.x,
      posicion.y,
      anchoNodo,
      limitar(recorrido - etapa),
    );
  });
}

function dibujarMapaPortafolio(ctx, ancho, alto, flujo, progreso) {
  const datos = flujo.portafolio;
  const margen = Math.max(145, ancho * 0.075);
  const superior = Math.max(225, alto * 0.29);
  const medio = Math.max(superior + 190, alto * 0.51);
  const inferior = Math.min(alto - 170, alto * 0.77);
  const anchoNodo = Math.min(205, ancho * 0.13);
  const recorrido = progreso * 5;
  const movimiento = (progreso * 5) % 1;

  const skills = datos.skills.map((skill) => String(skill)).filter(Boolean);
  const faltantes = datos.faltantes
    .map((item) =>
      typeof item === 'string'
        ? item
        : [item?.skill, item?.porcentaje != null ? `${item.porcentaje}%` : null]
            .filter(Boolean)
            .join(' '),
    )
    .filter(Boolean);
  const ideas = datos.ideas.map((idea) => idea?.titulo || idea).filter(Boolean);
  const ideasEnViaje = datos.ideas
    .map((idea) =>
      [
        idea?.destacada ? 'Destacada' : null,
        idea?.titulo || idea,
        idea?.tipo,
      ].filter(Boolean).join(' · '),
    )
    .filter(Boolean);
  const guardadas = datos.guardadas.map((idea) => idea?.titulo || idea).filter(Boolean);
  const posiciones = {
    perfil: { x: margen, y: superior },
    brechas: { x: margen, y: inferior },
    catalogo: { x: ancho * 0.3, y: medio },
    ranking: { x: ancho * 0.49, y: medio },
    texto: { x: ancho * 0.68, y: medio },
    tarjetas: { x: ancho * 0.86, y: superior },
    guardadas: { x: ancho * 0.86, y: inferior },
  };

  const personalizacion = {
    cargando: {
      titulo: 'Preparando textos',
      detalle: 'Comprobando cache y disponibilidad',
      dato: 'Procesando',
      icono: 'app',
      color: COLORES.violeta,
    },
    redis: {
      titulo: 'Redis reutiliza el resultado',
      detalle: 'La misma combinacion de perfil, brechas e ideas ya estaba cacheada',
      dato: 'Cache hit · sin nueva IA',
      icono: 'base',
      color: COLORES.cian,
    },
    openrouter: {
      titulo: 'OpenRouter adapta el texto',
      detalle: 'Reescribe resumen y detalle; no elige los proyectos',
      dato: '1 llamada · 4 textos',
      icono: 'app',
      color: COLORES.violeta,
    },
    ranking_sin_ia: {
      titulo: 'Texto base del catalogo',
      detalle: 'La cuota no esta disponible, pero las ideas elegidas se conservan',
      dato: 'Respaldo sin IA',
      icono: 'documento',
      color: COLORES.azul,
    },
    respaldo: {
      titulo: 'Texto base del catalogo',
      detalle: 'OpenRouter no respondio y Jobia usa el contenido curado',
      dato: 'Respaldo automatico',
      icono: 'documento',
      color: COLORES.azul,
    },
    catalogo_popular: {
      titulo: 'Ideas mas populares',
      detalle: 'Sin habilidades se evita la IA y se mantiene una seleccion util',
      dato: 'Popularidad · sin IA',
      icono: 'ordenar',
      color: COLORES.azul,
    },
    cliente_sin_api: {
      titulo: 'Respaldo del navegador',
      detalle: 'La API no respondio y se muestran las ideas incluidas en el frontend',
      dato: 'La pantalla no se rompe',
      icono: 'app',
      color: COLORES.amarillo,
    },
  }[datos.origen] || {
    titulo: 'Texto base del catalogo',
    detalle: 'Las ideas permanecen disponibles aunque no se personalicen',
    dato: 'Respaldo disponible',
    icono: 'documento',
    color: COLORES.azul,
  };

  ctx.save();
  ctx.textAlign = 'left';
  ctx.font = '700 12px system-ui, sans-serif';
  ctx.fillStyle = COLORES.cian;
  ctx.fillText('PERFIL Y MERCADO', posiciones.perfil.x - 44, superior - 112);
  ctx.fillStyle = COLORES.amarillo;
  ctx.fillText('SELECCION EXACTA · SIN IA', posiciones.ranking.x - 92, medio - 112);
  ctx.fillStyle = COLORES.violeta;
  ctx.fillText('TEXTO Y RESPALDO', posiciones.texto.x - 70, medio - 112);
  ctx.fillStyle = COLORES.verde;
  ctx.fillText('RESULTADO EN PANTALLA', posiciones.tarjetas.x - 82, superior - 112);
  ctx.restore();

  const nodos = [
    {
      paso: {
        titulo: 'Habilidades de tu perfil',
        detalle: skills.join(' · ') || 'Aun no hay habilidades para comparar',
        dato: `${skills.length} skills`,
        icono: 'persona',
        color: COLORES.cian,
      },
      posicion: posiciones.perfil,
      etapa: 0,
    },
    {
      paso: {
        titulo: 'Brechas del mercado',
        detalle: faltantes.join(' · ') || 'El ranking puede funcionar solo con tus skills',
        dato: `${faltantes.length} brechas`,
        icono: 'comparar',
        color: COLORES.amarillo,
      },
      posicion: posiciones.brechas,
      etapa: 0,
    },
    {
      paso: {
        titulo: 'Catalogo curado',
        detalle: 'Proyectos completos para web, datos, UX, mobile, DevOps y mas',
        dato: `${datos.catalogo} ideas estaticas`,
        icono: 'proyecto',
        color: COLORES.azul,
      },
      posicion: posiciones.catalogo,
      etapa: 0,
    },
    {
      paso: {
        titulo: 'Ranking de afinidad',
        detalle: 'Skills propias × 1 + demanda de brechas × 2 + popularidad para desempatar',
        dato: 'Elige 4 · cero IA',
        icono: 'ordenar',
        color: COLORES.amarillo,
      },
      posicion: posiciones.ranking,
      etapa: 1,
    },
    {
      paso: {
        titulo: personalizacion.titulo,
        detalle: personalizacion.detalle,
        dato: personalizacion.dato,
        icono: personalizacion.icono,
        color: personalizacion.color,
      },
      posicion: posiciones.texto,
      etapa: 2,
    },
    {
      paso: {
        titulo: 'Ideas para portafolio',
        detalle: ideas.join(' · ') || 'Esperando las cuatro ideas',
        dato: `${ideas.length} tarjetas · 1 destacada`,
        icono: 'resultado',
        color: COLORES.verde,
      },
      posicion: posiciones.tarjetas,
      etapa: 3,
    },
    {
      paso: {
        titulo: 'Ideas guardadas',
        detalle: guardadas.join(' · ') || 'Todavia no has guardado una idea',
        dato: `${guardadas.length} en localStorage`,
        icono: 'guardar',
        color: COLORES.cian,
      },
      posicion: posiciones.guardadas,
      etapa: 4,
    },
  ];

  const conexiones = [
    {
      inicio: { x: posiciones.perfil.x + 55, y: superior },
      fin: { x: posiciones.ranking.x - 55, y: medio - 24 },
      control: { x: ancho * 0.31, y: superior },
      etapa: 0,
      color: COLORES.cian,
      etiqueta: 'mide afinidad',
      dato: skills.length ? skills : 'sin skills',
    },
    {
      inicio: { x: posiciones.brechas.x + 55, y: inferior },
      fin: { x: posiciones.ranking.x - 55, y: medio + 24 },
      control: { x: ancho * 0.31, y: inferior },
      etapa: 0,
      color: COLORES.amarillo,
      etiqueta: 'prioriza aprendizaje',
      dato: faltantes.length ? faltantes : 'sin brechas',
    },
    {
      inicio: { x: posiciones.catalogo.x + 55, y: medio },
      fin: { x: posiciones.ranking.x - 55, y: medio },
      control: { x: ancho * 0.395, y: medio },
      etapa: 0,
      color: COLORES.azul,
      etiqueta: 'puntua 50 ideas',
      dato: `${datos.catalogo} proyectos candidatos`,
    },
    {
      inicio: { x: posiciones.ranking.x + 55, y: medio },
      fin: { x: posiciones.texto.x - 55, y: medio },
      control: { x: ancho * 0.585, y: medio },
      etapa: 1,
      color: COLORES.violeta,
      etiqueta: 'elige las mejores',
      dato: ideasEnViaje.length ? ideasEnViaje : '4 ideas seleccionadas',
    },
    {
      inicio: { x: posiciones.texto.x + 55, y: medio - 18 },
      fin: { x: posiciones.tarjetas.x - 55, y: superior + 18 },
      control: { x: ancho * 0.79, y: superior + 35 },
      etapa: 2,
      color: COLORES.verde,
      etiqueta: datos.personalizado ? 'entrega textos adaptados' : 'entrega textos base',
      dato: ideasEnViaje.length ? ideasEnViaje : 'ideas listas',
    },
    {
      inicio: { x: posiciones.tarjetas.x + 58, y: superior + 35 },
      fin: { x: posiciones.guardadas.x + 58, y: inferior - 35 },
      control: { x: posiciones.tarjetas.x + ancho * 0.065, y: (superior + inferior) / 2 },
      etapa: 3,
      color: COLORES.cian,
      etiqueta: 'si pulsas Guardar',
      dato: guardadas.length ? guardadas : 'seleccion del usuario',
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
      (movimiento + indice * 0.15) % 1,
    );
  });

  nodos.forEach(({ paso, posicion, etapa }) => {
    dibujarNodo(
      ctx,
      paso,
      etapa,
      posicion.x,
      posicion.y,
      anchoNodo,
      limitar(recorrido - etapa),
    );
  });
}

function dibujarMapaEntrevista(ctx, ancho, alto, flujo, progreso) {
  const datos = flujo.entrevista;
  const margen = Math.max(145, ancho * 0.075);
  const superior = Math.max(225, alto * 0.29);
  const medio = Math.max(superior + 190, alto * 0.51);
  const inferior = Math.min(alto - 170, alto * 0.77);
  const anchoNodo = Math.min(205, ancho * 0.13);
  const cfg = datos.cfg;
  let nodos = [];
  let conexiones = [];
  let etapas = 5;
  const titulos = [];

  const agregarTitulos = () => {
    ctx.save();
    ctx.textAlign = 'left';
    ctx.font = '700 12px system-ui, sans-serif';
    titulos.forEach((titulo) => {
      ctx.fillStyle = titulo.color;
      ctx.fillText(titulo.texto, titulo.x, titulo.y);
    });
    ctx.restore();
  };

  if (datos.estado === 'configuracion') {
    const posiciones = {
      config: { x: margen, y: superior },
      area: { x: ancho * 0.29, y: superior },
      banco: { x: ancho * 0.49, y: superior },
      sesion: { x: ancho * 0.69, y: superior },
      modalidad: { x: ancho * 0.29, y: inferior },
      pregunta: { x: ancho * 0.86, y: medio },
    };
    titulos.push(
      { texto: 'LO QUE ELIGES', x: posiciones.config.x - 43, y: superior - 112, color: COLORES.cian },
      { texto: 'PREPARACION EXACTA · SIN IA', x: posiciones.banco.x - 95, y: superior - 112, color: COLORES.azul },
      { texto: 'EXPERIENCIA EN EL NAVEGADOR', x: posiciones.modalidad.x - 95, y: inferior - 112, color: COLORES.verde },
    );
    nodos = [
      {
        paso: {
          titulo: 'Configuracion actual',
          detalle: `${cfg.puesto || 'Puesto general'} · ${cfg.nivel || 'Junior'} · ${cfg.tipo || 'mixta'}`,
          dato: cfg.modalidad === 'video' ? 'Videollamada' : 'Chat de texto',
          icono: 'comparar',
          color: COLORES.cian,
        },
        posicion: posiciones.config,
        etapa: 0,
      },
      {
        paso: {
          titulo: 'Detector de area',
          detalle: datos.area ? `Area detectada: ${datos.area}` : 'Lee palabras del puesto al comenzar',
          dato: datos.area || 'frontend · backend · data…',
          icono: 'buscar',
          color: COLORES.azul,
        },
        posicion: posiciones.area,
        etapa: 1,
      },
      {
        paso: {
          titulo: 'Banco de preguntas',
          detalle: 'Preguntas tecnicas y de RRHH incluidas en el backend',
          dato: 'Catalogo estatico · cero IA',
          icono: 'documento',
          color: COLORES.azul,
        },
        posicion: posiciones.banco,
        etapa: 2,
      },
      {
        paso: {
          titulo: 'Sesion temporal',
          detalle: 'Redis conserva puesto, nivel, tipo y area durante 2 horas',
          dato: datos.sessionId ? textoCorto(datos.sessionId, 16) : 'Se crea al empezar',
          icono: 'base',
          color: COLORES.violeta,
        },
        posicion: posiciones.sesion,
        etapa: 3,
      },
      {
        paso: {
          titulo: cfg.modalidad === 'video' ? 'Camara, microfono y voz' : 'Texto, dictado y voz',
          detalle: cfg.modalidad === 'video'
            ? 'La camara solo muestra tu imagen; no se graba ni se sube'
            : 'SpeechRecognition dicta y SpeechSynthesis lee localmente',
          dato: cfg.leerVoz ? 'Lectura en voz activa' : 'Lectura en voz desactivada',
          icono: cfg.modalidad === 'video' ? 'app' : 'entrevista',
          color: COLORES.verde,
        },
        posicion: posiciones.modalidad,
        etapa: 1,
      },
      {
        paso: {
          titulo: 'Primera pregunta',
          detalle: datos.preguntaActual || 'Aparece al pulsar Empezar entrevista',
          dato: datos.totalPreguntas ? `${datos.totalPreguntas} preguntas base` : 'Lista para comenzar',
          icono: 'resultado',
          color: COLORES.verde,
        },
        posicion: posiciones.pregunta,
        etapa: 4,
      },
    ];
    conexiones = [
      {
        inicio: { x: posiciones.config.x + 55, y: superior },
        fin: { x: posiciones.area.x - 55, y: superior },
        control: { x: ancho * 0.19, y: superior },
        etapa: 0, color: COLORES.cian, etiqueta: 'envia configuracion',
        dato: [cfg.puesto || 'puesto general', cfg.nivel || 'Junior', cfg.tipo || 'mixta'],
      },
      {
        inicio: { x: posiciones.area.x + 55, y: superior },
        fin: { x: posiciones.banco.x - 55, y: superior },
        control: { x: ancho * 0.39, y: superior },
        etapa: 1, color: COLORES.azul, etiqueta: 'elige la categoria',
        dato: datos.area || 'area por detectar',
      },
      {
        inicio: { x: posiciones.banco.x + 55, y: superior },
        fin: { x: posiciones.sesion.x - 55, y: superior },
        control: { x: ancho * 0.59, y: superior },
        etapa: 2, color: COLORES.violeta, etiqueta: 'baraja sin repetir',
        dato: cfg.nivel || 'Junior',
      },
      {
        inicio: { x: posiciones.sesion.x + 55, y: superior + 10 },
        fin: { x: posiciones.pregunta.x - 55, y: medio - 10 },
        control: { x: ancho * 0.8, y: superior + 20 },
        etapa: 3, color: COLORES.verde, etiqueta: 'abre la practica',
        dato: datos.preguntaActual || 'primera pregunta',
      },
      {
        inicio: { x: posiciones.config.x + 40, y: superior + 40 },
        fin: { x: posiciones.modalidad.x - 40, y: inferior - 40 },
        control: { x: margen + ancho * 0.08, y: medio },
        etapa: 0, color: COLORES.verde, etiqueta: 'activa modalidad',
        dato: cfg.modalidad === 'video' ? 'camara + microfono' : 'texto + dictado',
      },
      {
        inicio: { x: posiciones.modalidad.x + 55, y: inferior - 10 },
        fin: { x: posiciones.pregunta.x - 55, y: medio + 28 },
        control: { x: ancho * 0.62, y: inferior },
        etapa: 2, color: COLORES.verde, etiqueta: 'presenta la pregunta',
        dato: cfg.leerVoz ? 'texto + voz sintetizada' : 'texto en pantalla',
      },
    ];
  } else if (datos.estado === 'historial') {
    const recurrentes = datos.recurrentes.map((item) =>
      [item?.texto, item?.n > 1 ? `${item.n} veces` : null].filter(Boolean).join(' · '),
    );
    const practicas = datos.entrevistas.map((item) =>
      [item?.puesto || 'Puesto general', item?.nivel, item?.guardada ? 'guardada' : null]
        .filter(Boolean).join(' · '),
    );
    const posiciones = {
      local: { x: margen, y: medio },
      practicas: { x: ancho * 0.31, y: superior },
      base: { x: ancho * 0.31, y: inferior },
      conteo: { x: ancho * 0.52, y: medio },
      plan: { x: ancho * 0.72, y: medio },
      pantalla: { x: ancho * 0.87, y: medio },
    };
    titulos.push(
      { texto: 'DATOS DE ESTE EQUIPO', x: posiciones.local.x - 55, y: medio - 112, color: COLORES.cian },
      { texto: 'ANALISIS LOCAL · SIN IA', x: posiciones.conteo.x - 82, y: medio - 112, color: COLORES.verde },
      { texto: 'AYUDA OPCIONAL', x: posiciones.plan.x - 55, y: medio - 112, color: COLORES.violeta },
    );
    const planEstado = {
      generando: ['OpenRouter esta preparando el plan', 'Generando ahora', COLORES.amarillo],
      listo: ['El plan ya aparece debajo de las mejoras', 'Plan listo', COLORES.violeta],
      disponible: ['Solo se usa cuando pulsas Pedir un plan a la IA', 'Listo para solicitar', COLORES.suave],
    }[datos.planEstado] || ['Ayuda opcional', 'Disponible', COLORES.suave];
    nodos = [
      {
        paso: {
          titulo: 'Historial local',
          detalle: 'Las entrevistas terminadas viven en localStorage',
          dato: `${datos.entrevistas.length} practicas`,
          icono: 'guardar', color: COLORES.cian,
        },
        posicion: posiciones.local, etapa: 0,
      },
      {
        paso: {
          titulo: 'Entrevistas anteriores',
          detalle: practicas.join(' · ') || 'Todavia no hay entrevistas',
          dato: `${datos.entrevistas.filter((item) => item.guardada).length} guardadas`,
          icono: 'entrevista', color: COLORES.azul,
        },
        posicion: posiciones.practicas, etapa: 1,
      },
      {
        paso: {
          titulo: 'Consejos de inicio',
          detalle: 'STAR, datos concretos, honestidad y proyectos preparados',
          dato: 'Respaldo estatico',
          icono: 'documento', color: COLORES.azul,
        },
        posicion: posiciones.base, etapa: 1,
      },
      {
        paso: {
          titulo: 'Puntos recurrentes',
          detalle: recurrentes.join(' · ') || 'Se muestran consejos base hasta tener historial',
          dato: recurrentes.length ? `${recurrentes.length} patrones` : 'Conteo exacto · sin IA',
          icono: 'comparar', color: COLORES.verde,
        },
        posicion: posiciones.conteo, etapa: 2,
      },
      {
        paso: {
          titulo: 'Plan opcional con IA',
          detalle: planEstado[0],
          dato: planEstado[1],
          icono: 'app', color: planEstado[2],
        },
        posicion: posiciones.plan, etapa: 3,
      },
      {
        paso: {
          titulo: 'Historial y mejoras',
          detalle: recurrentes[0] || practicas[0] || 'Preparado para tu primera practica',
          dato: 'Visible en la pantalla',
          icono: 'resultado', color: COLORES.verde,
        },
        posicion: posiciones.pantalla, etapa: 4,
      },
    ];
    conexiones = [
      {
        inicio: { x: posiciones.local.x + 55, y: medio - 15 },
        fin: { x: posiciones.practicas.x - 55, y: superior + 15 },
        control: { x: ancho * 0.22, y: superior + 20 },
        etapa: 0, color: COLORES.azul, etiqueta: 'lee practicas',
        dato: practicas.length ? practicas : 'historial vacio',
      },
      {
        inicio: { x: posiciones.local.x + 55, y: medio + 15 },
        fin: { x: posiciones.base.x - 55, y: inferior - 15 },
        control: { x: ancho * 0.22, y: inferior - 20 },
        etapa: 0, color: COLORES.azul, etiqueta: 'usa respaldo',
        dato: 'consejos para empezar',
      },
      {
        inicio: { x: posiciones.practicas.x + 55, y: superior + 20 },
        fin: { x: posiciones.conteo.x - 55, y: medio - 20 },
        control: { x: ancho * 0.43, y: superior + 25 },
        etapa: 1, color: COLORES.verde, etiqueta: 'cuenta repeticiones',
        dato: recurrentes.length ? recurrentes : 'feedback de cada practica',
      },
      {
        inicio: { x: posiciones.conteo.x + 55, y: medio },
        fin: { x: posiciones.plan.x - 55, y: medio },
        control: { x: ancho * 0.62, y: medio },
        etapa: 2, color: COLORES.violeta, etiqueta: 'si pides un plan',
        dato: recurrentes.length ? recurrentes : '3 consejos + ejercicio',
      },
      {
        inicio: { x: posiciones.plan.x + 55, y: medio },
        fin: { x: posiciones.pantalla.x - 55, y: medio },
        control: { x: ancho * 0.795, y: medio },
        etapa: 3, color: COLORES.verde, etiqueta: 'muestra',
        dato: datos.planEstado === 'listo' ? 'plan personalizado' : 'mejoras actuales',
      },
    ];
  } else if (datos.estado === 'feedback') {
    const mejoras = lista(datos.feedback?.mejorar);
    const fortalezas = lista(datos.feedback?.fortalezas);
    const transcript = datos.transcript.map((item) =>
      `${textoCorto(item?.pregunta, 22)} → ${textoCorto(item?.respuesta || 'sin respuesta', 22)}`,
    );
    const origen = datos.feedback?.cacheado
      ? ['Redis reutiliza el feedback', 'Cache de 7 dias · sin nueva IA', COLORES.cian, 'base']
      : datos.feedback?.generico
        ? ['Feedback de respaldo', 'La cuota o el modelo no estuvieron disponibles', COLORES.azul, 'documento']
        : ['OpenRouter evalua el transcript', 'Una llamada al terminar la practica', COLORES.violeta, 'app'];
    const posiciones = {
      transcript: { x: margen, y: medio },
      fuente: { x: ancho * 0.34, y: medio },
      parseo: { x: ancho * 0.53, y: medio },
      fortalezas: { x: ancho * 0.72, y: superior },
      mejoras: { x: ancho * 0.72, y: inferior },
      historial: { x: ancho * 0.87, y: medio },
    };
    titulos.push(
      { texto: 'CIERRE DE LA PRACTICA', x: posiciones.transcript.x - 56, y: medio - 112, color: COLORES.cian },
      { texto: 'UNA EVALUACION AL FINAL', x: posiciones.fuente.x - 85, y: medio - 112, color: COLORES.violeta },
      { texto: 'RESULTADO ACCIONABLE', x: posiciones.fortalezas.x - 78, y: superior - 112, color: COLORES.verde },
    );
    nodos = [
      {
        paso: {
          titulo: 'Transcript de la entrevista',
          detalle: transcript.join(' · ') || 'Reuniendo preguntas y respuestas',
          dato: `${datos.respondidas} respuestas`,
          icono: 'documento', color: COLORES.cian,
        },
        posicion: posiciones.transcript, etapa: 0,
      },
      {
        paso: {
          titulo: origen[0], detalle: origen[1],
          dato: datos.pensando ? 'Evaluando ahora' : 'Evaluacion recibida',
          icono: origen[3], color: origen[2],
        },
        posicion: posiciones.fuente, etapa: 1,
      },
      {
        paso: {
          titulo: 'JSON validado',
          detalle: 'Resumen, fortalezas, mejoras y una respuesta modelo',
          dato: datos.feedback ? 'Estructura correcta' : 'Esperando respuesta',
          icono: 'comparar', color: COLORES.azul,
        },
        posicion: posiciones.parseo, etapa: 2,
      },
      {
        paso: {
          titulo: 'Fortalezas detectadas',
          detalle: fortalezas.join(' · ') || 'Preparando fortalezas',
          dato: `${fortalezas.length} puntos`,
          icono: 'habilidades', color: COLORES.verde,
        },
        posicion: posiciones.fortalezas, etapa: 3,
      },
      {
        paso: {
          titulo: 'Como mejorar',
          detalle: mejoras.join(' · ') || 'Preparando recomendaciones',
          dato: `${mejoras.length} acciones`,
          icono: 'curso', color: COLORES.amarillo,
        },
        posicion: posiciones.mejoras, etapa: 3,
      },
      {
        paso: {
          titulo: 'Historial local',
          detalle: 'Guarda resumen y recomendaciones; no el transcript completo',
          dato: `${datos.entrevistas.length} practicas`,
          icono: 'guardar', color: COLORES.verde,
        },
        posicion: posiciones.historial, etapa: 4,
      },
    ];
    conexiones = [
      {
        inicio: { x: posiciones.transcript.x + 55, y: medio },
        fin: { x: posiciones.fuente.x - 55, y: medio },
        control: { x: ancho * 0.245, y: medio },
        etapa: 0, color: origen[2], etiqueta: 'envia una vez',
        dato: transcript.length ? transcript : 'preguntas + respuestas',
      },
      {
        inicio: { x: posiciones.fuente.x + 55, y: medio },
        fin: { x: posiciones.parseo.x - 55, y: medio },
        control: { x: ancho * 0.435, y: medio },
        etapa: 1, color: COLORES.azul, etiqueta: 'devuelve JSON',
        dato: 'resumen + fortalezas + mejoras',
      },
      {
        inicio: { x: posiciones.parseo.x + 55, y: medio - 18 },
        fin: { x: posiciones.fortalezas.x - 55, y: superior + 18 },
        control: { x: ancho * 0.63, y: superior + 25 },
        etapa: 2, color: COLORES.verde, etiqueta: 'separa',
        dato: fortalezas.length ? fortalezas : 'fortalezas',
      },
      {
        inicio: { x: posiciones.parseo.x + 55, y: medio + 18 },
        fin: { x: posiciones.mejoras.x - 55, y: inferior - 18 },
        control: { x: ancho * 0.63, y: inferior - 25 },
        etapa: 2, color: COLORES.amarillo, etiqueta: 'prioriza',
        dato: mejoras.length ? mejoras : 'acciones para mejorar',
      },
      {
        inicio: { x: posiciones.fortalezas.x + 45, y: superior + 35 },
        fin: { x: posiciones.historial.x - 55, y: medio - 20 },
        control: { x: ancho * 0.82, y: superior + 45 },
        etapa: 3, color: COLORES.verde, etiqueta: 'guarda resumen',
        dato: datos.feedback?.resumen || 'feedback final',
      },
      {
        inicio: { x: posiciones.mejoras.x + 45, y: inferior - 35 },
        fin: { x: posiciones.historial.x - 55, y: medio + 20 },
        control: { x: ancho * 0.82, y: inferior - 45 },
        etapa: 3, color: COLORES.verde, etiqueta: 'guarda mejoras',
        dato: mejoras.length ? mejoras : 'recomendaciones',
      },
    ];
  } else {
    const respuesta = datos.respuestaActual || datos.transcript.at(-1)?.respuesta || 'Esperando tu respuesta';
    const rep = datos.ultimaRepregunta;
    const estadoRep = rep?.estado === 'generada'
      ? [rep.texto, 'Repregunta generada', COLORES.violeta]
      : rep
        ? [`Se omitio: ${rep.estado}`, 'La entrevista continua', COLORES.azul]
        : ['Solo se intenta con respuestas de 40 o mas caracteres', 'Maximo 2 por sesion', COLORES.suave];
    const posiciones = {
      config: { x: margen, y: superior },
      banco: { x: margen, y: inferior },
      sesion: { x: ancho * 0.29, y: medio },
      pregunta: { x: ancho * 0.47, y: medio },
      respuesta: { x: ancho * 0.64, y: medio },
      repregunta: { x: ancho * 0.82, y: superior },
      transcript: { x: ancho * 0.82, y: inferior },
    };
    titulos.push(
      { texto: 'SESION ACTIVA', x: posiciones.config.x - 40, y: superior - 112, color: COLORES.cian },
      { texto: 'TURNO ACTUAL', x: posiciones.pregunta.x - 50, y: medio - 112, color: COLORES.verde },
      { texto: 'IA OPCIONAL Y RACIONADA', x: posiciones.repregunta.x - 88, y: superior - 112, color: COLORES.violeta },
    );
    nodos = [
      {
        paso: {
          titulo: 'Configuracion de la practica',
          detalle: `${cfg.puesto || 'Puesto general'} · ${cfg.nivel || 'Junior'} · ${datos.area || 'general'}`,
          dato: cfg.tipo || 'mixta',
          icono: 'comparar', color: COLORES.cian,
        },
        posicion: posiciones.config, etapa: 0,
      },
      {
        paso: {
          titulo: 'Banco estatico',
          detalle: `${datos.totalPreguntas} preguntas base barajadas sin repetir`,
          dato: 'Preguntas · cero IA',
          icono: 'documento', color: COLORES.azul,
        },
        posicion: posiciones.banco, etapa: 0,
      },
      {
        paso: {
          titulo: 'Sesion en Redis',
          detalle: 'Configuracion temporal con vencimiento de 2 horas',
          dato: textoCorto(datos.sessionId || 'sesion activa', 18),
          icono: 'base', color: COLORES.violeta,
        },
        posicion: posiciones.sesion, etapa: 1,
      },
      {
        paso: {
          titulo: datos.esRepregunta ? 'Repregunta actual' : 'Pregunta actual',
          detalle: datos.preguntaActual || 'Preparando la siguiente pregunta',
          dato: `${datos.respondidas} respondidas · ${datos.pendientes} pendientes`,
          icono: 'entrevista', color: COLORES.verde,
        },
        posicion: posiciones.pregunta, etapa: 2,
      },
      {
        paso: {
          titulo: cfg.modalidad === 'video' ? 'Voz o texto del candidato' : 'Respuesta del candidato',
          detalle: respuesta,
          dato: datos.escuchando ? 'Microfono escuchando' : `${datos.respuestaActual.length} caracteres`,
          icono: cfg.modalidad === 'video' ? 'app' : 'persona',
          color: datos.escuchando ? COLORES.amarillo : COLORES.cian,
        },
        posicion: posiciones.respuesta, etapa: 3,
      },
      {
        paso: {
          titulo: 'Repregunta opcional',
          detalle: estadoRep[0],
          dato: estadoRep[1],
          icono: 'app', color: estadoRep[2],
        },
        posicion: posiciones.repregunta, etapa: 4,
      },
      {
        paso: {
          titulo: 'Transcript temporal',
          detalle: datos.transcript
            .map((item) => textoCorto(item?.respuesta || 'sin respuesta', 24))
            .join(' · ') || 'Se arma mientras respondes',
          dato: `${datos.respondidas} turnos guardados`,
          icono: 'documento', color: COLORES.azul,
        },
        posicion: posiciones.transcript, etapa: 4,
      },
    ];
    conexiones = [
      {
        inicio: { x: posiciones.config.x + 55, y: superior + 12 },
        fin: { x: posiciones.sesion.x - 55, y: medio - 18 },
        control: { x: ancho * 0.2, y: superior + 20 },
        etapa: 0, color: COLORES.cian, etiqueta: 'configura',
        dato: [cfg.puesto || 'puesto general', cfg.nivel || 'Junior', cfg.tipo || 'mixta'],
      },
      {
        inicio: { x: posiciones.banco.x + 55, y: inferior - 12 },
        fin: { x: posiciones.sesion.x - 55, y: medio + 18 },
        control: { x: ancho * 0.2, y: inferior - 20 },
        etapa: 0, color: COLORES.azul, etiqueta: 'entrega preguntas',
        dato: `${datos.totalPreguntas} preguntas`,
      },
      {
        inicio: { x: posiciones.sesion.x + 55, y: medio },
        fin: { x: posiciones.pregunta.x - 55, y: medio },
        control: { x: ancho * 0.38, y: medio },
        etapa: 1, color: COLORES.verde, etiqueta: 'muestra turno',
        dato: datos.preguntaActual || 'pregunta actual',
      },
      {
        inicio: { x: posiciones.pregunta.x + 55, y: medio },
        fin: { x: posiciones.respuesta.x - 55, y: medio },
        control: { x: ancho * 0.555, y: medio },
        etapa: 2, color: COLORES.cian, etiqueta: 'recibe respuesta',
        dato: respuesta,
      },
      {
        inicio: { x: posiciones.respuesta.x + 48, y: medio - 28 },
        fin: { x: posiciones.repregunta.x - 55, y: superior + 18 },
        control: { x: ancho * 0.74, y: superior + 35 },
        etapa: 3, color: COLORES.violeta, etiqueta: 'si tiene 40+ caracteres',
        dato: rep?.texto || `${datos.respuestaActual.length} caracteres`,
      },
      {
        inicio: { x: posiciones.respuesta.x + 48, y: medio + 28 },
        fin: { x: posiciones.transcript.x - 55, y: inferior - 18 },
        control: { x: ancho * 0.74, y: inferior - 35 },
        etapa: 3, color: COLORES.azul, etiqueta: 'anota el turno',
        dato: respuesta,
      },
      {
        inicio: { x: posiciones.repregunta.x + 58, y: superior + 35 },
        fin: { x: posiciones.transcript.x + 58, y: inferior - 35 },
        control: { x: posiciones.repregunta.x + ancho * 0.06, y: medio },
        etapa: 4, color: COLORES.violeta, etiqueta: 'si se genero',
        dato: rep?.texto || 'continua con el banco',
      },
    ];
  }

  agregarTitulos();
  const recorrido = progreso * etapas;
  const movimiento = (progreso * etapas) % 1;
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
      (movimiento + indice * 0.14) % 1,
    );
  });
  nodos.forEach(({ paso, posicion, etapa }) => {
    dibujarNodo(
      ctx,
      paso,
      etapa,
      posicion.x,
      posicion.y,
      anchoNodo,
      limitar(recorrido - etapa),
    );
  });
}

function dibujarMapa(ctx, ancho, alto, accion, progreso) {
  dibujarFondo(ctx, ancho, alto);
  const flujo = flujoDe(accion);
  if (flujo.modo === 'busqueda') {
    dibujarMapaBusqueda(ctx, ancho, alto, flujo, progreso);
    return;
  }
  if (flujo.modo === 'crecer') {
    dibujarMapaCrecer(ctx, ancho, alto, flujo, progreso);
    return;
  }
  if (flujo.modo === 'portafolio') {
    dibujarMapaPortafolio(ctx, ancho, alto, flujo, progreso);
    return;
  }
  if (flujo.modo === 'entrevista') {
    dibujarMapaEntrevista(ctx, ancho, alto, flujo, progreso);
    return;
  }
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
  const [activa, setActiva] = useState(() => obtenerAnimaciones()[0] || { tipo: 'inicio', datos: {} });
  const [pausada, setPausada] = useState(false);

  useEffect(() => escucharAnimaciones((nueva) => {
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
  const meta = METAS_ANIMACION[activa?.tipo] || METAS_ANIMACION.inicio;

  return (
    <main ref={marcoRef} className="animacion">
      <canvas ref={canvasRef} className="animacion__canvas" aria-label="Mapa visual de la actividad reciente" />
      <header className="animacion__cab">
        <h1>{meta.titulo}</h1>
      </header>
      <aside className="animacion__controles" aria-label="Controles del mapa">
        <button type="button" className="iconbtn" onClick={() => setPausada((valor) => !valor)} aria-label={pausada ? 'Reanudar recorrido' : 'Mostrar resultado'}>
          <Icon name={pausada ? 'derecha' : 'pausa'} size={18} />
        </button>
        <button type="button" className="iconbtn" onClick={repetir} aria-label="Repetir recorrido"><Icon name="refrescar" size={18} /></button>
        <button type="button" className="iconbtn" onClick={() => window.close()} aria-label="Cerrar pestana"><Icon name="cerrar" size={18} /></button>
      </aside>
    </main>
  );
}
