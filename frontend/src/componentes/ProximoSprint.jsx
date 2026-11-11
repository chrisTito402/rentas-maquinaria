// Tarjeta punteada que aparta, dentro de la pantalla, una sección que se termina en un sprint posterior.
// Sirve para mostrar en la revisión del sprint dónde va a vivir cada historia que sigue.
// Uso: <ProximoSprint hu="HU-13b" kan="KAN-53" titulo="Costo de envío por zona" duenio="Chris">Qué hará</ProximoSprint>
// Cuando la historia se programe, se reemplaza esta tarjeta por la sección real.
export default function ProximoSprint({ sprint = 2, hu, kan, titulo, duenio, children, className = '' }) {
  return (
    <div className={`proximo ${className}`.trim()} role="note" aria-label={`${titulo}: se termina en el Sprint ${sprint}`}>
      <div className="proximo__cabecera">
        <span className="proximo__sprint">Sprint {sprint}</span>
        <strong>{titulo}</strong>
      </div>
      {children && <p>{children}</p>}
      <small>{[hu, kan, duenio && `Dueño: ${duenio}`].filter(Boolean).join(' · ')}</small>
    </div>
  );
}
