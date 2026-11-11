// Ilustración animada de una máquina (se mueve suave en reposo y "avanza" al pasar el mouse).
// Si el tipo de equipo no tiene ilustración en el Figma, o su foto no carga, muestra un ícono genérico.
import { useState } from 'react';
import { tieneIlustracion, imagenEquipo } from '../logica/imagenEquipo.js';

export default function Maquina({ equipo, indice = 0, grande = false }) {
  const [fallo, setFallo] = useState(false);
  const ilustrada = tieneIlustracion(equipo);
  return (
    <div className={`maquina${grande ? ' maquina--grande' : ''}`} style={{ '--i': indice }}>
      <span className="maquina__polvo" aria-hidden="true" />
      {ilustrada && !fallo ? (
        <img src={imagenEquipo(equipo)} alt={equipo.nombre} loading="lazy" onError={() => setFallo(true)} />
      ) : (
        <div className="maquina__generica" role="img" aria-label={equipo.nombre}>
          <span><img src="/img/iconos/logo.svg" alt="" /></span>
          {equipo.tipo}
        </div>
      )}
    </div>
  );
}
