// Dueño: Chris · HU-14a Enviar solicitud de cotización (KAN-11)
import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCarrito } from '../carrito/CarritoContext.jsx';
import { api } from '../api.js';
import FormularioCliente from '../componentes/FormularioCliente.jsx';
import DesgloseCostos from '../componentes/DesgloseCostos.jsx';
import { validarCliente } from '@compartido/validarCliente.js';
import { MAX_NOTAS } from '@compartido/constantes.js';
import { dinero, fecha } from '@compartido/formato.js';

const CLIENTE_INICIAL = { nombre: '', telefono: '', correo: '', empresa: '', municipio: '', direccion: '' };
const ETIQUETAS = { nombre: 'Nombre', telefono: 'Teléfono', correo: 'Correo', empresa: 'Empresa', municipio: 'Municipio', direccion: 'Dirección' };

export default function MiCotizacion() {
  const { lineas, quitar, vaciar } = useCarrito();
  const [cliente, setCliente] = useState(CLIENTE_INICIAL);
  const [notas, setNotas] = useState('');
  const [errores, setErrores] = useState({});
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [recibida, setRecibida] = useState(null);
  const solicitudEnCurso = useRef(false);

  async function enviar(evento) {
    evento.preventDefault();
    if (solicitudEnCurso.current || lineas.length === 0) return;
    const erroresCliente = validarCliente(cliente);
    setErrores(erroresCliente);
    setError('');
    if (Object.keys(erroresCliente).length > 0) {
      setError('Revisa los datos del cliente.');
      return;
    }
    if (notas.length > MAX_NOTAS) {
      setError(`Las notas no pueden superar ${MAX_NOTAS} caracteres.`);
      return;
    }
    solicitudEnCurso.current = true;
    setEnviando(true);
    try {
      const respuesta = await api.post('/cotizaciones/web', {
        cliente,
        notas,
        lineas: lineas.map(({ equipoId, cantidad, fechaInicio, fechaFin }) => ({ equipoId, cantidad, fechaInicio, fechaFin })),
      });
      setRecibida(respuesta);
      vaciar();
    } catch (fallo) {
      setError(fallo.message || 'No se pudo enviar la solicitud. Intenta de nuevo.');
      setErrores(fallo.datos?.errores || {});
    } finally {
      solicitudEnCurso.current = false;
      setEnviando(false);
    }
  }

  if (recibida) return (
    <>
      <h1>Recibimos tu solicitud</h1>
      <div className="exito" role="status">
        <p>Tu folio es <strong>{recibida.folio}</strong>.</p>
        <p>Total con IVA: <strong>{dinero(recibida.total)}</strong>.</p>
        <p>Tu cotización está Pendiente de revisión por el equipo comercial.</p>
      </div>
      <Link className="boton" to="/">Volver al catálogo</Link>
    </>
  );

  if (lineas.length === 0) return (
    <>
      <h1>Mi cotización</h1>
      <p>No has agregado equipos a tu cotización.</p>
      <Link className="boton" to="/">Ver catálogo</Link>
    </>
  );

  return (
    <>
      <h1>Mi cotización</h1>
      <div className="dos-columnas">
        <div>
          <h2>Equipos seleccionados</h2>
          {lineas.map((linea, indice) => (
            <div className="linea" key={indice}>
              <div>
                <strong>{linea.nombre}</strong>
                <p className="tenue">Cantidad: {linea.cantidad}</p>
                <p className="tenue">{fecha(linea.fechaInicio)} al {fecha(linea.fechaFin)}</p>
              </div>
              <button className="enlace" type="button" disabled={enviando} onClick={() => quitar(indice)} aria-label={`Quitar ${linea.nombre}`}>Quitar</button>
            </div>
          ))}
          <form onSubmit={enviar} aria-busy={enviando}>
            <h2>Datos de contacto</h2>
            <FormularioCliente valores={cliente} errores={errores} onCambio={(campo, valor) => setCliente((actual) => ({ ...actual, [campo]: valor }))} />
            <label htmlFor="notas">Notas para la solicitud (opcional)</label>
            <textarea id="notas" value={notas} maxLength={MAX_NOTAS} onChange={(evento) => setNotas(evento.target.value)} aria-describedby="ayuda-notas" />
            <p className="tenue" id="ayuda-notas">{notas.length}/{MAX_NOTAS} caracteres</p>
            {error && (
              <div className="error" role="alert">
                <p>{error}</p>
                {Object.keys(errores).length > 0 && <ul>{Object.entries(errores).map(([campo, mensaje]) => <li key={campo}>{ETIQUETAS[campo] || campo}: {mensaje}</li>)}</ul>}
              </div>
            )}
            <button type="submit" disabled={enviando}>{enviando ? 'Enviando…' : 'Enviar solicitud de cotización'}</button>
          </form>
        </div>
        <DesgloseCostos lineas={lineas} />
      </div>
    </>
  );
}
