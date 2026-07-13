/**
 * Renderiza la respuesta del modelo con un formato minimo (negritas y vinetas).
 *
 * SEGURIDAD: esto NO usa dangerouslySetInnerHTML, y es deliberado. El texto lo
 * genera un LLM que ha leido descripciones de ofertas escritas por terceros; si
 * inyectaramos ese texto como HTML, una oferta maliciosa podria acabar metiendo
 * <script> en la pagina. Se construyen elementos de React, asi que cualquier
 * etiqueta que venga en el texto se muestra como texto plano. Inofensiva.
 */
function negritas(linea, clave) {
  // Gemma y compania devuelven markdown ligero: **asi**.
  const trozos = linea.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);

  return trozos.map((t, i) =>
    t.startsWith('**') && t.endsWith('**') ? (
      <strong key={`${clave}-${i}`}>{t.slice(2, -2)}</strong>
    ) : (
      <span key={`${clave}-${i}`}>{t}</span>
    ),
  );
}

export default function RichText({ texto }) {
  const lineas = String(texto || '').split('\n');
  const bloques = [];
  let vinetas = [];

  const cerrarLista = (i) => {
    if (!vinetas.length) return;
    bloques.push(
      <ul className="rt__lista" key={`ul-${i}`}>
        {vinetas.map((v, j) => (
          <li key={j}>{negritas(v, `li-${i}-${j}`)}</li>
        ))}
      </ul>,
    );
    vinetas = [];
  };

  lineas.forEach((linea, i) => {
    const l = linea.trim();

    // Vinetas: "* ", "- ", "1. "
    const vineta = l.match(/^(?:[*-]|\d+\.)\s+(.*)$/);
    if (vineta) {
      vinetas.push(vineta[1]);
      return;
    }

    cerrarLista(i);
    if (l) bloques.push(<p key={`p-${i}`}>{negritas(l, `p-${i}`)}</p>);
  });

  cerrarLista('fin');

  return <div className="rt">{bloques}</div>;
}
