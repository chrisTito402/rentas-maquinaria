// Dueño: Héctor · HU-01a Ver catálogo de equipos (KAN-6)
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { dinero } from '@compartido/formato.js';

export default function Catalogo() {
  const [equipos, setEquipos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/equipos')
      .then((datos) => setEquipos(datos))
      .catch((fallo) => setError(fallo.message || 'No se pudo cargar el catálogo.'))
      .finally(() => setCargando(false));
  }, []);

  if (cargando) return <p>Cargando…</p>;
  if (error) return <p className="error">{error}</p>;

  return (
    <>
      <h1>Catálogo de equipos</h1>
      <div className="rejilla">
        {equipos.map((equipo) => (
          <Link className="tarjeta" to={`/equipos/${equipo.id}`} key={equipo.id}>
            <img src={equipo.foto} alt={equipo.nombre} />
            <div className="tarjeta-cuerpo">
              <span className="etiqueta">{equipo.tipo}</span>
              <h3>{equipo.nombre}</h3>
              <p className="tenue">Modelo {equipo.modelo}</p>
              <p className="precio">{dinero(equipo.tarifaDia)} <small>/ día</small></p>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
