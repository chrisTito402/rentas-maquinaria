// Dueño: Héctor · HU-15a Aprobar cotización (KAN-15)
// Uso: <BotonAprobar cotizacion={{ id, folio, estado }} onAprobada={(r) => ...} />
import { useRef, useState } from 'react';
import { api } from '../api.js';

export default function BotonAprobar({ cotizacion, onAprobada }) {
  const [aprobando, setAprobando] = useState(false);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const enCurso = useRef(false);

  // Solo las cotizaciones Pendientes muestran el botón Aprobar.
  if (cotizacion.estado !== 'Pendiente') return null;

  async function aprobar() {
    if (enCurso.current) return;
    enCurso.current = true;
    setAprobando(true);
    setError('');
    setMensaje('');
    try {
      const respuesta = await api.patch(`/cotizaciones/${cotizacion.id}/aprobar`);
      setMensaje(`La cotización ${respuesta.folio} quedó ${respuesta.estado}.`);
      if (onAprobada) onAprobada(respuesta);
    } catch (fallo) {
      setError(fallo.message || 'No se pudo aprobar la cotización.');
    } finally {
      enCurso.current = false;
      setAprobando(false);
    }
  }

  return (
    <div>
      <button className="button dark" type="button" onClick={aprobar} disabled={aprobando}>
        {aprobando ? 'Aprobando…' : 'Aprobar cotización'}
      </button>
      {error && <p className="error" role="alert">{error}</p>}
      {mensaje && <p className="exito" role="status">{mensaje}</p>}
    </div>
  );
}
