// BASE · No se toca. Etiqueta de color para el estado de una cotización.
export default function Estado({ valor }) {
  return <span className={`estado estado-${(valor || '').toLowerCase()}`}>{valor}</span>;
}
