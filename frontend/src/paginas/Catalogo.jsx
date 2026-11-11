// Dueño: Héctor · HU-01a Ver catálogo de equipos (KAN-6)
// Diseño: frame «1 · Catálogo de equipos» del Figma.
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { dinero } from '@compartido/formato.js';
import Maquina from '../componentes/Maquina.jsx';
import { partesCaracteristicas } from '../logica/imagenEquipo.js';

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

  return (
    <>
      <section className="catalogo-intro">
        <span><span className="f-chip f-chip--accion">Sin crear cuenta · cotiza en minutos</span></span>
        <h1>Catálogo de equipos</h1>
        <p>Elige la maquinaria para tu proyecto y pide tu cotización con el costo de la renta.</p>
      </section>

      {cargando && <p className="f-cargando" role="status">Cargando equipos…</p>}
      {error && <p className="f-alerta f-alerta--error" role="alert">{error}</p>}

      {!cargando && !error && (
        <>
          <p className="catalogo-contador">Mostrando <strong>{equipos.length}</strong> {equipos.length === 1 ? 'equipo' : 'equipos'}</p>
          {equipos.length === 0 ? (
            <div className="f-tarjeta catalogo-vacio"><p>Todavía no hay equipos en el catálogo.</p></div>
          ) : (
            <div className="catalogo-rejilla">
              {equipos.map((equipo, indice) => (
                <Link className="equipo-tarjeta" to={`/equipos/${equipo.id}`} key={equipo.id} style={{ '--i': indice }}>
                  <div className="equipo-tarjeta__media">
                    <Maquina equipo={equipo} indice={indice} />
                  </div>
                  <div className="equipo-tarjeta__body">
                    <div className="equipo-tarjeta__meta">
                      <span className="f-chip f-chip--sutil">{equipo.tipo}</span>
                      <span className="equipo-tarjeta__codigo">{equipo.modelo}</span>
                    </div>
                    <h2>{equipo.nombre}</h2>
                    {equipo.caracteristicas && (
                      <p className="equipo-tarjeta__specs">{partesCaracteristicas(equipo.caracteristicas).slice(0, 2).join(' · ')}</p>
                    )}
                    <div className="equipo-tarjeta__pie">
                      <div>
                        <span className="equipo-precio">{dinero(equipo.tarifaDia).replace('.00', '')}<small>/ día</small></span>
                        <span className="equipo-precio__nota">+ IVA</span>
                      </div>
                      <span className="equipo-tarjeta__accion">Ver fechas <img src="/img/iconos/flecha-derecha.svg" alt="" /></span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </>
  );
}
