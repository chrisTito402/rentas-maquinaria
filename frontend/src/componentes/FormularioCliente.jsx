// Dueño: Katia · HU-06 Registrar datos del cliente (KAN-12)
// Uso: <FormularioCliente valores={cliente} errores={errores} onCambio={(campo, valor) => ...} />
// Las reglas viven en compartido/validarCliente.js (las usa también el backend).
// Diseño: «Tus datos de contacto» del frame «3 · Solicitud de cotización» del Figma.
import { useRef, useState } from 'react';
import { api } from '../api.js';
import { MUNICIPIOS } from '@compartido/constantes.js';
import './formularioCliente.css';

function Campo({ id, etiqueta, error, ayuda, children }) {
  return (
    <div className="f-campo">
      <label htmlFor={id}>{etiqueta}</label>
      {children}
      {error ? <p className="f-campo__error" id={`${id}-error`}>{error}</p> : ayuda && <p className="f-campo__ayuda">{ayuda}</p>}
    </div>
  );
}

export default function FormularioCliente({ valores, errores = {}, onCambio }) {
  const [info, setInfo] = useState(null);         // { municipio, estado, colonias } del C.P. escrito
  const [avisoCp, setAvisoCp] = useState('');
  const [buscando, setBuscando] = useState(false);
  const ultimo = useRef('');

  // A4: con 5 dígitos se busca el C.P.; si no se encuentra o el catálogo no está cargado,
  // el municipio y la colonia se capturan a mano como antes.
  async function cambiarCodigoPostal(codigoPostal) {
    onCambio('codigoPostal', codigoPostal);
    ultimo.current = codigoPostal;
    setAvisoCp('');
    if (info) { setInfo(null); onCambio('colonia', ''); }
    if (codigoPostal.length !== 5) return;
    setBuscando(true);
    try {
      const datos = await api.get(`/codigos-postales/${codigoPostal}`);
      if (ultimo.current !== codigoPostal) return;   // ya escribió otro
      if (!MUNICIPIOS.includes(datos.municipio)) {
        setAvisoCp(`Es de ${datos.municipio}: todavía no entregamos ahí.`);
        onCambio('municipio', '');
        return;
      }
      setInfo(datos);
      onCambio('municipio', datos.municipio);
      onCambio('colonia', datos.colonias.length === 1 ? datos.colonias[0] : '');
    } catch (fallo) {
      if (ultimo.current === codigoPostal && fallo.status === 404) setAvisoCp(fallo.message);
    } finally {
      if (ultimo.current === codigoPostal) setBuscando(false);
    }
  }

  const props = (campo) => ({
    id: campo,
    value: valores[campo] ?? '',
    className: errores[campo] ? 'con-error' : '',
    'aria-invalid': errores[campo] ? true : undefined,
    'aria-describedby': errores[campo] ? `${campo}-error` : undefined,
    onChange: (e) => onCambio(campo, e.target.value),
  });

  return (
    <>
      <Campo id="nombre" etiqueta="Nombre completo" error={errores.nombre}>
        <input {...props('nombre')} maxLength={150} placeholder="Ej. Juan Pérez López" autoComplete="name" />
      </Campo>
      <Campo id="empresa" etiqueta="Empresa (opcional)" error={errores.empresa}>
        <input {...props('empresa')} maxLength={100} placeholder="Ej. Constructora del Valle" autoComplete="organization" />
      </Campo>
      <div className="f-fila">
        <Campo id="telefono" etiqueta="Teléfono (WhatsApp)" error={errores.telefono}>
          <input {...props('telefono')} inputMode="numeric" maxLength={10} placeholder="6441234567" autoComplete="tel-national"
            onChange={(e) => onCambio('telefono', e.target.value.replace(/\D/g, ''))} />
        </Campo>
        <Campo id="correo" etiqueta="Correo electrónico" error={errores.correo}>
          <input {...props('correo')} type="email" maxLength={100} placeholder="tu@correo.com" autoComplete="email" />
        </Campo>
      </div>
      {/* Ajustes A3 y A4 (re-presentación del Sprint 1): dirección de entrega clara y código postal
          que llena el estado, el municipio y la colonia */}
      <p className="f-campo__ayuda formulario-entrega">
        <strong>¿Dónde entregamos el equipo?</strong> Es el lugar donde dejaremos la maquinaria
        (obra, predio o bodega), no la dirección de tu empresa.
      </p>
      <div className="f-fila">
        <Campo id="codigoPostal" etiqueta="Código postal" error={errores.codigoPostal || avisoCp}
          ayuda={buscando ? 'Buscando…' : 'Al escribirlo se llenan el municipio y la colonia.'}>
          <input {...props('codigoPostal')} inputMode="numeric" maxLength={5} placeholder="Ej. 85000" autoComplete="postal-code"
            className={errores.codigoPostal || avisoCp ? 'con-error' : ''}
            onChange={(e) => cambiarCodigoPostal(e.target.value.replace(/\D/g, ''))} />
        </Campo>
        <Campo id="estado" etiqueta="Estado">
          <input id="estado" value="Sonora" readOnly aria-readonly="true" className="formulario-fijo" />
        </Campo>
      </div>
      <div className="f-fila">
        <Campo id="municipio" etiqueta="Municipio" error={errores.municipio}
          ayuda={info ? 'Se llenó con tu código postal.' : undefined}>
          <select {...props('municipio')} disabled={Boolean(info)}>
            <option value="">Elige un municipio…</option>
            {MUNICIPIOS.map((m) => <option key={m}>{m}</option>)}
          </select>
        </Campo>
        <Campo id="colonia" etiqueta="Colonia" error={errores.colonia}>
          {info?.colonias.length ? (
            <select {...props('colonia')}>
              {info.colonias.length > 1 && <option value="">Elige tu colonia…</option>}
              {info.colonias.map((c) => <option key={c}>{c}</option>)}
            </select>
          ) : (
            <input {...props('colonia')} maxLength={100} placeholder="Ej. Centro" />
          )}
        </Campo>
      </div>
      <Campo id="direccion" etiqueta="Calle y número" error={errores.direccion}
        ayuda="Agrega una referencia si es difícil de encontrar.">
        <input {...props('direccion')} maxLength={200} placeholder="Ej. Sufragio Efectivo 120, junto a la plaza" autoComplete="street-address" />
      </Campo>
    </>
  );
}
