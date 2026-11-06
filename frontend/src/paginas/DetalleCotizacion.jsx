// Dueño: Katia · HU-10 Consultar cotizaciones (KAN-19)
// VERSIÓN FALSA: ya muestra el botón de HU-15a para que Héctor pueda probarlo. Katia la reemplaza.
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api.js';
import Pendiente from '../componentes/Pendiente.jsx';
import BotonAprobar from '../componentes/BotonAprobar.jsx';

export default function DetalleCotizacion() {
  const { id } = useParams();
  const [cot, setCot] = useState(null);
  useEffect(() => { api.get(`/cotizaciones/${id}`).then(setCot); }, [id]);
  if (!cot) return <p>Cargando…</p>;
  return (
    <Pendiente hu="HU-10" titulo={`Detalle de ${cot.folio}`} duenio="Katia">
      <BotonAprobar cotizacion={cot} onAprobada={(r) => setCot({ ...cot, estado: r.estado })} />
    </Pendiente>
  );
}
