import { useState } from 'react';
import { enlaceWhatsApp } from '../logica/enlaceWhatsApp.js';
import './accionesCotizacionPdf.css';

export default function AccionesCotizacionPdf({ cotizacion }) {
  const [descargando, setDescargando] = useState(false);
  const [error, setError] = useState('');
  if (cotizacion.estado !== 'Aprobada') return null;

  const whatsapp = enlaceWhatsApp(cotizacion);

  async function descargar() {
    if (descargando) return;
    setDescargando(true);
    setError('');
    try {
      // Fetch (en el mismo origen) incluye la cookie y permite mostrar un error si la sesión caducó.
      const respuesta = await fetch(`/api/cotizaciones/${cotizacion.id}/pdf`, { credentials: 'same-origin' });
      if (!respuesta.ok) {
        if (respuesta.status === 401) window.dispatchEvent(new Event('sesion-expirada'));
        const datos = await respuesta.json().catch(() => ({}));
        throw new Error(datos.error || 'No se pudo generar el PDF.');
      }
      if (!respuesta.headers.get('content-type')?.includes('application/pdf')) {
        throw new Error('El servidor no devolvió un PDF.');
      }
      const url = URL.createObjectURL(await respuesta.blob());
      const enlace = document.createElement('a');
      enlace.href = url;
      enlace.download = `${String(cotizacion.folio).replace(/[^A-Za-z0-9-]/g, '')}.pdf`;
      document.body.append(enlace);
      enlace.click();
      enlace.remove();
      setTimeout(() => URL.revokeObjectURL(url), 30_000);
    } catch (fallo) {
      setError(fallo.message || 'No se pudo generar el PDF.');
    } finally {
      setDescargando(false);
    }
  }

  return (
    <div className="acciones-pdf">
      <button className="f-btn f-btn--secundario" type="button" onClick={descargar} disabled={descargando}>
        {descargando ? 'Preparando PDF…' : 'Descargar PDF'}
      </button>
      {whatsapp ? (
        <a className="f-btn f-btn--primario" href={whatsapp} target="_blank" rel="noopener noreferrer">
          Enviar por WhatsApp
        </a>
      ) : (
        <span className="f-alerta f-alerta--error">Falta un teléfono válido para abrir WhatsApp.</span>
      )}
      <p>Descarga el PDF y adjúntalo manualmente en el chat. No se envía al aprobar la cotización.</p>
      {error && <p className="f-alerta f-alerta--error" role="alert">{error}</p>}
    </div>
  );
}
