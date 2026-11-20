// Muestra la foto guardada en la BD; si falta o no carga, muestra un ícono genérico.
import { useState } from 'react';
import { tieneIlustracion, imagenEquipo } from '../logica/imagenEquipo.js';

export default function Maquina({ equipo, indice = 0, grande = false }) {
  const [fotoFallida, setFotoFallida] = useState('');
  const foto = imagenEquipo(equipo);
  const mostrarFoto = tieneIlustracion(equipo) && fotoFallida !== foto;
  const externa = mostrarFoto && foto.startsWith('https://');
  return (
    <div className={`maquina${grande ? ' maquina--grande' : ''}${externa ? ' maquina--foto' : ''}`} style={{ '--i': indice }}>
      <span className="maquina__polvo" aria-hidden="true" />
      {mostrarFoto ? (
        <img src={foto} alt={equipo.nombre} loading="lazy" onError={() => setFotoFallida(foto)} />
      ) : (
        <div className="maquina__generica" role="img" aria-label={equipo.nombre}>
          <span><img src="/img/iconos/logo.svg" alt="" /></span>
          {equipo.tipo}
        </div>
      )}
    </div>
  );
}
