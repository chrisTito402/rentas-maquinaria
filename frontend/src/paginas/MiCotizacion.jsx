// Dueño: Chris · HU-14a Enviar solicitud de cotización (KAN-11) y HU-13b Costo de envío por zona (KAN-53)
// Diseño: frames «3 · Solicitud de cotización», «4 · Solicitud enviada (cliente)» y «E1 · Cotización vacía» del Figma.
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCarrito } from '../carrito/CarritoContext.jsx';
import { api } from '../api.js';
import FormularioCliente from '../componentes/FormularioCliente.jsx';
import DesgloseCostos from '../componentes/DesgloseCostos.jsx';
import IconoCheck from '../componentes/IconoCheck.jsx';
import { imagenEquipo, tieneIlustracion } from '../logica/imagenEquipo.js';
import { validarCliente } from '@compartido/validarCliente.js';
import { MAX_NOTAS } from '@compartido/constantes.js';
import { calcularCostos } from '@compartido/costos.js';
import { dinero } from '@compartido/formato.js';
import { DIAS_VIGENCIA, fechaVigencia } from '@compartido/vigencia.js';

const CLIENTE_INICIAL = { nombre: '', telefono: '', correo: '', empresa: '', codigoPostal: '', municipio: '', colonia: '', direccion: '' };
const ETIQUETAS = { nombre: 'Nombre', telefono: 'Teléfono', correo: 'Correo', empresa: 'Empresa', codigoPostal: 'Código postal', municipio: 'Municipio', colonia: 'Colonia', direccion: 'Calle y número' };
const corta = (iso) => new Date(`${iso}T12:00:00`).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });

export default function MiCotizacion() {
  const { lineas, quitar, vaciar, municipio, setMunicipio } = useCarrito();
  // HU-13b: el municipio llega del catálogo (encabezado o diálogo) y si se cambia aquí se recalcula el envío.
  const [cliente, setCliente] = useState(() => ({ ...CLIENTE_INICIAL, municipio }));
  useEffect(() => { setCliente((actual) => ({ ...actual, municipio })); }, [municipio]);
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
    <section className="f-tarjeta confirmacion" role="status">
      <div className="confirmacion__icono"><IconoCheck /></div>
      <h1>¡Recibimos tu solicitud!</h1>
      <p>Tu folio es <strong>{recibida.folio}</strong>. Guárdalo: con él puedes preguntar por tu cotización.</p>
      <p className="f-alerta f-alerta--exito">Total estimado: {dinero(recibida.total)} (incluye envío e IVA). Tu solicitud está Pendiente de revisión.</p>
      {/* Notas de la re-presentación del Sprint 1: más información del folio y qué sigue */}
      <div className="confirmacion__pasos">
        <strong>¿Qué sigue?</strong>
        <ol>
          <li>El área comercial revisa que los equipos estén disponibles en tus fechas.</li>
          <li>Te contactamos por WhatsApp al {cliente.telefono} con la cotización formal.</li>
          <li>Tú decides si la aceptas. Hasta entonces no hay cobro ni compromiso.</li>
        </ol>
      </div>
      {/* Ajuste A1: vigencia de 15 días naturales */}
      <p className="solicitud-nota">
        Tu cotización es válida por {DIAS_VIGENCIA} días naturales, hasta el <strong>{fechaVigencia(recibida.creadaEn ?? Date.now())}</strong>.
        Si para esa fecha no se confirma, se cancela automáticamente y puedes pedir una nueva.
      </p>
      <div className="confirmacion__acciones">
        <Link className="f-btn f-btn--primario" to="/">Ir al catálogo de maquinaria</Link>
      </div>
    </section>
  );

  if (lineas.length === 0) return (
    <section className="f-tarjeta confirmacion">
      <div className="confirmacion__icono" style={{ background: 'var(--f-accion-suave)' }}>
        <img src="/img/iconos/cotizacion.svg" alt="" width="22" height="24" />
      </div>
      <h1>Tu cotización está vacía</h1>
      <p>Agrega uno o varios equipos desde el catálogo para pedir tu cotización.</p>
      <div className="confirmacion__acciones">
        <Link className="f-btn f-btn--primario" to="/">Ver catálogo de maquinaria</Link>
      </div>
    </section>
  );

  const costos = calcularCostos(lineas, cliente.municipio || undefined);
  const fueraDeZona = Boolean(cliente.municipio) && costos.fueraDeZona;   // HU-13b

  return (
    <>
      <section className="solicitud-intro">
        <Link className="f-volver" to="/">← Seguir viendo equipos</Link>
        <h1>Solicitud de cotización</h1>
        <p>Déjanos tus datos una sola vez para todos tus equipos. El total incluye el envío a tu municipio y el IVA.</p>
      </section>

      <div className="solicitud">
        <form className="f-tarjeta solicitud-form" onSubmit={enviar} aria-busy={enviando} id="form-solicitud" noValidate>
          <header>
            <h2>Tus datos de contacto</h2>
            <p>Todos los campos son obligatorios, salvo Empresa y las notas.</p>
          </header>
          <FormularioCliente valores={cliente} errores={errores} onCambio={(campo, valor) => (campo === 'municipio' ? setMunicipio(valor) : setCliente((actual) => ({ ...actual, [campo]: valor })))} />
          <div className="f-campo">
            <label htmlFor="notas">Notas de entrega u obra <span className="f-campo__ayuda">(opcional)</span></label>
            <textarea id="notas" value={notas} maxLength={MAX_NOTAS} onChange={(evento) => setNotas(evento.target.value)} aria-describedby="ayuda-notas"
              placeholder="Indicaciones de acceso, requerimiento de operador certificado o maniobra especial…" />
            <p className="f-campo__ayuda" id="ayuda-notas">{notas.length}/{MAX_NOTAS} caracteres</p>
          </div>
          {error && (
            <div className="f-alerta f-alerta--error" role="alert">
              <p>{error}</p>
              {Object.keys(errores).length > 0 && <ul>{Object.entries(errores).map(([campo, mensaje]) => <li key={campo}>{ETIQUETAS[campo] || campo}: {mensaje}</li>)}</ul>}
            </div>
          )}
        </form>

        <aside className="f-tarjeta solicitud-resumen" aria-label="Equipos en tu cotización">
          <header>
            <h2>Equipos en tu cotización</h2>
            <span>{lineas.length} {lineas.length === 1 ? 'EQUIPO' : 'EQUIPOS'}</span>
          </header>
          {costos.lineas.map((linea, indice) => (
            <div className="linea-equipo" key={indice}>
              <div className={`linea-equipo__miniatura${tieneIlustracion(linea) ? '' : ' linea-equipo__miniatura--generica'}`}>
                <img src={imagenEquipo(linea)} alt="" />
              </div>
              <div className="linea-equipo__info">
                <strong>{linea.nombre}</strong>
                <span>{dinero(linea.tarifaDia).replace('.00', '')} / día · {linea.cantidad} {linea.cantidad === 1 ? 'unidad' : 'unidades'}</span>
                <span className="linea-equipo__fechas">{corta(linea.fechaInicio)} – {corta(linea.fechaFin)} · {linea.dias} {linea.dias === 1 ? 'día' : 'días'}</span>
              </div>
              <div className="linea-equipo__lado">
                <strong>{dinero(linea.importe).replace('.00', '')}</strong>
                <button className="f-boton-texto" type="button" disabled={enviando} onClick={() => quitar(indice)} aria-label={`Quitar ${linea.nombre}`}>Quitar</button>
              </div>
            </div>
          ))}
          <Link className="agregar-otro" to="/">+ Agregar otro equipo</Link>
          <DesgloseCostos lineas={lineas} municipio={cliente.municipio} />
          <button type="submit" form="form-solicitud" className="f-btn f-btn--primario f-btn--grande" disabled={enviando || fueraDeZona}>
            {enviando ? 'Enviando…' : 'Enviar solicitud de cotización →'}
          </button>
          {/* Ajuste A2: cotizar no genera compromiso para el cliente ni para la empresa */}
          <p className="solicitud-nota">
            Pedir una cotización es gratis y no te compromete a nada: no se cobra ni se apartan equipos.
            Tampoco obliga a la empresa: primero revisamos la disponibilidad y te enviamos la cotización formal.
            Al enviar, verás tu folio en esta misma página.
          </p>
        </aside>
      </div>
    </>
  );
}
