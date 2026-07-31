const AZUL = [31, 111, 235];
const TINTA = [25, 35, 52];
const MUTED = [91, 105, 126];
const CLARO = [241, 245, 251];

function textoSeguro(valor, respaldo = '') {
  return String(valor || respaldo).trim();
}

function nombreArchivo(nombre) {
  const base = textoSeguro(nombre, 'curriculum')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
  return `cv-${base || 'jobia'}.pdf`;
}

function escribirParrafo(doc, texto, x, y, ancho, { tamano = 9.5, color = TINTA, interlineado = 4.6 } = {}) {
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(tamano);
  doc.setTextColor(...color);
  const lineas = doc.splitTextToSize(textoSeguro(texto), ancho);
  doc.text(lineas, x, y);
  return y + Math.max(lineas.length, 1) * interlineado;
}

function tituloSeccion(doc, titulo, x, y, ancho) {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...AZUL);
  doc.text(titulo.toUpperCase(), x, y);
  doc.setDrawColor(211, 220, 232);
  doc.line(x, y + 2.2, x + ancho, y + 2.2);
  return y + 8;
}

function etiquetaLateral(doc, titulo, valores, x, y, ancho) {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text(titulo.toUpperCase(), x, y);
  let cursor = y + 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(214, 226, 245);
  valores.filter(Boolean).forEach((valor) => {
    const lineas = doc.splitTextToSize(textoSeguro(valor), ancho);
    doc.text(lineas, x, cursor);
    cursor += lineas.length * 4.1 + 1.2;
  });
  return cursor + 5;
}

export async function crearCvPdf(datos) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
  const nombre = textoSeguro(datos.nombre, 'Nombre del candidato');
  const rol = textoSeguro(datos.rol, 'Perfil profesional');
  const skills = (datos.skills || []).slice(0, 10);
  const idiomas = (datos.idiomas || []).slice(0, 5);

  doc.setFillColor(18, 42, 78);
  doc.rect(0, 0, 64, 297, 'F');
  doc.setFillColor(...AZUL);
  doc.rect(64, 0, 146, 38, 'F');

  const iniciales = nombre
    .split(/\s+/)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase())
    .join('');
  doc.setFillColor(255, 255, 255);
  doc.circle(32, 27, 13, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(...AZUL);
  doc.text(iniciales || 'CV', 32, 29.5, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(255, 255, 255);
  doc.text(doc.splitTextToSize(nombre, 126), 72, 15);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.text(`${rol} | ${textoSeguro(datos.nivel, 'Nivel profesional')}`, 72, 30);

  let lateralY = 56;
  lateralY = etiquetaLateral(
    doc,
    'Contacto',
    [datos.email, datos.telefono, datos.ciudad],
    10,
    lateralY,
    44,
  );
  lateralY = etiquetaLateral(doc, 'Habilidades', skills, 10, lateralY, 44);
  etiquetaLateral(doc, 'Idiomas', idiomas, 10, lateralY, 44);

  const x = 72;
  const ancho = 126;
  let y = 51;

  y = tituloSeccion(doc, 'Perfil profesional', x, y, ancho);
  y = escribirParrafo(doc, datos.perfil, x, y, ancho) + 5;

  y = tituloSeccion(doc, 'Experiencia', x, y, ancho);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(...TINTA);
  doc.text(textoSeguro(datos.puesto, rol), x, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...MUTED);
  doc.text(textoSeguro(datos.experiencia, 'Experiencia en desarrollo'), x, y + 5);
  y = escribirParrafo(
    doc,
    `Experiencia aplicando ${skills.slice(0, 4).join(', ') || 'habilidades profesionales'} para resolver necesidades reales, colaborar con equipos y entregar resultados claros.`,
    x,
    y + 11,
    ancho,
  ) + 5;

  y = tituloSeccion(doc, 'Formacion', x, y, ancho);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(...TINTA);
  doc.text(textoSeguro(datos.carrera, 'Formacion profesional'), x, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...MUTED);
  doc.text(textoSeguro(datos.estudios, 'Formacion en curso'), x, y + 5);
  y += 15;

  y = tituloSeccion(doc, 'Proyecto destacado', x, y, ancho);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(...TINTA);
  doc.text(textoSeguro(datos.proyecto, 'Proyecto profesional'), x, y);
  y = escribirParrafo(
    doc,
    `Proyecto orientado a demostrar conocimientos de ${skills.slice(0, 3).join(', ') || rol}, con foco en una solucion funcional, documentada y presentable.`,
    x,
    y + 6,
    ancho,
  );

  doc.setFillColor(...CLARO);
  doc.rect(64, 286, 146, 11, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...MUTED);
  doc.text('CV creado con Jobia', 198, 292.5, { align: 'right' });

  const archivo = nombreArchivo(nombre);
  const blob = doc.output('blob');
  return {
    blob,
    archivo,
    file: new File([blob], archivo, { type: 'application/pdf' }),
  };
}

export function descargarPdf(blob, archivo) {
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = archivo;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
