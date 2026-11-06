// BASE · No se toca. Tarjeta punteada que marca lo que falta programar.
export default function Pendiente({ hu, titulo, duenio, children }) {
  return (
    <div className="pendiente">
      <b>{titulo}</b>
      <span>{hu} · Dueño: {duenio}</span>
      {children}
    </div>
  );
}
