import Icon from './Icon';

/** Fila de etiquetas de una idea: tipo · nivel · categoria, con icono. */
export default function PortTags({ idea, sm = false }) {
  const tags = [
    { icono: 'chispa', texto: idea.tipo },
    { icono: 'nivel', texto: idea.nivel },
    { icono: 'marcador', texto: idea.categoria },
  ];
  return (
    <ul className={`port-tags ${sm ? 'port-tags--sm' : ''}`}>
      {tags.map((t) => (
        <li key={t.texto} className="port-tag">
          <Icon name={t.icono} size={14} /> {t.texto}
        </li>
      ))}
    </ul>
  );
}
