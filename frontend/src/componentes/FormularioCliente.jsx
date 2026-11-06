// Dueño: Katia · HU-06 Registrar datos del cliente (KAN-12)
// VERSIÓN FALSA: campos simples, sin lista de municipios ni errores. Katia la reemplaza.
// Uso: <FormularioCliente valores={cliente} errores={errores} onCambio={(campo, valor) => ...} />
const CAMPOS = ['nombre', 'telefono', 'correo', 'empresa', 'municipio', 'direccion'];

export default function FormularioCliente({ valores, errores, onCambio }) {
  return (
    <div className="pendiente">
      <b>Datos del cliente (versión falsa)</b>
      <span>HU-06 · Dueño: Katia</span>
      {CAMPOS.map((c) => (
        <input key={c} placeholder={c} value={valores[c]} onChange={(e) => onCambio(c, e.target.value)} />
      ))}
    </div>
  );
}
