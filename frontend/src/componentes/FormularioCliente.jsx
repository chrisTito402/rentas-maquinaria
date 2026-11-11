// Dueño: Katia · HU-06 Registrar datos del cliente (KAN-12)
// Uso: <FormularioCliente valores={cliente} errores={errores} onCambio={(campo, valor) => ...} />
// Las reglas viven en compartido/validarCliente.js (las usa también el backend).
// Diseño: «Tus datos de contacto» del frame «3 · Solicitud de cotización» del Figma.
import { MUNICIPIOS } from '@compartido/constantes.js';

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
      <Campo id="municipio" etiqueta="Municipio de entrega" error={errores.municipio}>
        <select {...props('municipio')}>
          <option value="">Elige un municipio…</option>
          {MUNICIPIOS.map((m) => <option key={m}>{m}</option>)}
        </select>
      </Campo>
      <Campo id="direccion" etiqueta="Dirección de entrega" error={errores.direccion}>
        <input {...props('direccion')} maxLength={200} placeholder="Calle, número y colonia" autoComplete="street-address" />
      </Campo>
    </>
  );
}
