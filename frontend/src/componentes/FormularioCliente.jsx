// Dueño: Katia · HU-06 Registrar datos del cliente (KAN-12)
// Uso: <FormularioCliente valores={cliente} errores={errores} onCambio={(campo, valor) => ...} />
// Las reglas viven en compartido/validarCliente.js (las usa también el backend).
import { MUNICIPIOS } from '@compartido/constantes.js';

function Campo({ id, etiqueta, error, children }) {
  return (
    <div>
      <label htmlFor={id}>{etiqueta}</label>
      {children}
      {error && <p className="error">{error}</p>}
    </div>
  );
}

export default function FormularioCliente({ valores, errores = {}, onCambio }) {
  const props = (campo) => ({
    id: campo,
    value: valores[campo] ?? '',
    className: errores[campo] ? 'con-error' : '',
    onChange: (e) => onCambio(campo, e.target.value),
  });

  return (
    <div>
      <Campo id="nombre" etiqueta="Nombre completo" error={errores.nombre}>
        <input {...props('nombre')} maxLength={150} placeholder="Nombre y apellido" />
      </Campo>
      <div className="fila">
        <Campo id="telefono" etiqueta="WhatsApp (10 dígitos)" error={errores.telefono}>
          <input {...props('telefono')} inputMode="numeric" maxLength={10} placeholder="6441234567"
            onChange={(e) => onCambio('telefono', e.target.value.replace(/\D/g, ''))} />
        </Campo>
        <Campo id="correo" etiqueta="Correo" error={errores.correo}>
          <input {...props('correo')} type="email" maxLength={100} placeholder="nombre@correo.com" />
        </Campo>
      </div>
      <Campo id="empresa" etiqueta="Empresa (opcional)" error={errores.empresa}>
        <input {...props('empresa')} maxLength={100} />
      </Campo>
      <Campo id="municipio" etiqueta="Municipio" error={errores.municipio}>
        <select {...props('municipio')}>
          <option value="">Elige un municipio…</option>
          {MUNICIPIOS.map((m) => <option key={m}>{m}</option>)}
        </select>
      </Campo>
      <Campo id="direccion" etiqueta="Dirección de entrega" error={errores.direccion}>
        <input {...props('direccion')} maxLength={200} placeholder="Calle, número y colonia" />
      </Campo>
    </div>
  );
}
