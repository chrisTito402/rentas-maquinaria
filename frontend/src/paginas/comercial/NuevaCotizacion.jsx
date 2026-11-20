// Dueño: Katia · HU-05 Crear cotización desde el panel (KAN-13)
// Diseño: frames «4 · Nueva cotización (panel)» y «4b · Nueva cotización: elegir fechas» del Figma.
import { useEffect, useState } from 'react';
import { useSesion } from '../../auth/Sesion.jsx';
import { puedeCapturarCotizacion } from '@compartido/perfiles.js';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { api } from '../../api.js';
import FormularioCliente from '../../componentes/FormularioCliente.jsx';
import DesgloseCostos from '../../componentes/DesgloseCostos.jsx';
import CalendarioRango from '../../componentes/CalendarioRango.jsx';
import { validarCliente } from '@compartido/validarCliente.js';
import { MAX_CANTIDAD, MAX_NOTAS } from '@compartido/constantes.js';
import { calcularCostos } from '@compartido/costos.js';
import { dinero } from '@compartido/formato.js';
import './nuevaCotizacion.css';

const CLIENTE_INICIAL = { nombre: '', telefono: '', correo: '', empresa: '', municipio: '', direccion: '' };
const LINEA_NUEVA = { equipoId: '', cantidad: 1, fechaInicio: '', fechaFin: '' };
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

function textoFechas(inicio, fin) {
  if (!inicio) return 'Elegir fechas';
  const [, m1, d1] = inicio.split('-').map(Number);
  if (!fin) return `${d1} ${MESES[m1 - 1]} – …`;
  const [, m2, d2] = fin.split('-').map(Number);
  return m1 === m2 ? `${d1} – ${d2} ${MESES[m2 - 1]}` : `${d1} ${MESES[m1 - 1]} – ${d2} ${MESES[m2 - 1]}`;
}

export default function NuevaCotizacion() {
  const { usuario } = useSesion();
  return puedeCapturarCotizacion(usuario.rol) ? <Formulario /> : <Navigate to="/comercial/cotizaciones" replace />;
}

function Formulario() {
  const navegar = useNavigate();
  const [equipos, setEquipos] = useState([]);
  const [lineas, setLineas] = useState([{ ...LINEA_NUEVA }]);
  const [cliente, setCliente] = useState(CLIENTE_INICIAL);
  const [notas, setNotas] = useState('');
  const [errores, setErrores] = useState({});
  const [error, setError] = useState('');
  const [calendarioAbierto, setCalendarioAbierto] = useState(null);   // índice de la línea
  const [guardando, setGuardando] = useState(false);
  const [ocupados, setOcupados] = useState({});   // { equipoId: [{ inicio, fin }] } · HU-02a
  const [choque, setChoque] = useState('');

  useEffect(() => {
    api.get('/equipos').then(setEquipos).catch(() => setError('No se pudo cargar el catálogo de equipos.'));
  }, []);

  function elegirEquipo(indice, equipoId) {
    cambiarLinea(indice, { equipoId, fechaInicio: '', fechaFin: '' });
    if (equipoId && !ocupados[equipoId]) {
      api.get(`/equipos/${equipoId}/ocupadas`)
        .then((rangos) => setOcupados((actuales) => ({ ...actuales, [equipoId]: rangos })))
        .catch(() => {});
    }
  }

  function cambiarLinea(indice, cambios) {
    setLineas((actuales) => actuales.map((linea, i) => (i === indice ? { ...linea, ...cambios } : linea)));
  }

  function quitarLinea(indice) {
    setLineas((actuales) => actuales.filter((_, i) => i !== indice));
    setCalendarioAbierto(null);
  }

  // Cada línea necesita el nombre y la tarifa del equipo para calcular el importe.
  const conTarifa = lineas.map((linea) => {
    const equipo = equipos.find((e) => e.id === Number(linea.equipoId));
    return { ...linea, nombre: equipo?.nombre, tarifaDia: equipo?.tarifaDia ?? 0, cantidad: Number(linea.cantidad) };
  });
  const calculadas = calcularCostos(conTarifa).lineas;
  const completas = conTarifa.filter((l) => l.equipoId && l.fechaInicio && l.fechaFin);

  async function guardar(evento) {
    evento.preventDefault();
    if (guardando) return;
    const erroresCliente = validarCliente(cliente);
    setErrores(erroresCliente);
    setError('');
    if (Object.keys(erroresCliente).length > 0) return setError('Revisa los datos del cliente.');
    if (lineas.length === 0) return setError('Agrega al menos un equipo.');
    const incompleta = lineas.findIndex((l) => !l.equipoId || !l.fechaInicio || !l.fechaFin);
    if (incompleta !== -1) return setError(`Elige el equipo y las fechas de la línea ${incompleta + 1}.`);
    const malCantidad = lineas.findIndex((l) => !Number.isInteger(Number(l.cantidad)) || l.cantidad < 1 || l.cantidad > MAX_CANTIDAD);
    if (malCantidad !== -1) return setError(`La cantidad de la línea ${malCantidad + 1} debe ser de 1 a ${MAX_CANTIDAD}.`);

    setGuardando(true);
    try {
      const respuesta = await api.post('/cotizaciones/panel', {
        cliente,
        notas,
        lineas: lineas.map((l) => ({ equipoId: Number(l.equipoId), cantidad: Number(l.cantidad), fechaInicio: l.fechaInicio, fechaFin: l.fechaFin })),
      });
      navegar(`/comercial/cotizaciones/${respuesta.id}`);
    } catch (fallo) {
      setError(fallo.message || 'No se pudo guardar la cotización. Intenta de nuevo.');
      setErrores(fallo.datos?.errores || {});
    } finally {
      setGuardando(false);
    }
  }

  return (
    <>
      <section className="nueva-intro">
        <Link className="f-volver" to="/comercial/cotizaciones">← Volver a cotizaciones</Link>
        <h1>Nueva cotización</h1>
        <p>Para clientes que piden por teléfono o WhatsApp. Se guarda como Pendiente.</p>
      </section>

      <div className="nueva">
        <form className="f-tarjeta nueva-form" id="form-nueva" onSubmit={guardar} aria-busy={guardando} noValidate>
          <header>
            <h2>Datos del cliente</h2>
            <p>Los mismos datos y validaciones que el formulario web (HU-06).</p>
          </header>
          <FormularioCliente valores={cliente} errores={errores} onCambio={(campo, valor) => setCliente((actual) => ({ ...actual, [campo]: valor }))} />

          <section className="nueva-equipos">
            <h2>Equipos</h2>
            <div className="nueva-equipos__titulos" aria-hidden="true">
              <span>Equipo</span><span>Fechas</span><span>Cant.</span><span>Subtotal</span><span />
            </div>
            {lineas.map((linea, indice) => {
              const dias = calculadas[indice].dias;
              return (
                <div className="nueva-linea" key={indice}>
                  <select aria-label={`Equipo de la línea ${indice + 1}`} value={linea.equipoId}
                    onChange={(e) => elegirEquipo(indice, e.target.value)}>
                    <option value="">Elige un equipo…</option>
                    {equipos.map((e) => (
                      <option key={e.id} value={e.id} disabled={!e.disponible}>{e.nombre}{e.disponible ? '' : ' (no disponible)'}</option>
                    ))}
                  </select>

                  <div className="nueva-linea__fechas">
                    <button type="button" className={`nueva-linea__boton-fechas${calendarioAbierto === indice ? ' abierto' : ''}`}
                      aria-expanded={calendarioAbierto === indice} aria-label={`Fechas de la línea ${indice + 1}`}
                      onClick={() => { setChoque(''); setCalendarioAbierto(calendarioAbierto === indice ? null : indice); }}>
                      📅 {textoFechas(linea.fechaInicio, linea.fechaFin)}
                      {dias > 0 && <small>{dias} {dias === 1 ? 'día' : 'días'}</small>}
                    </button>
                    {calendarioAbierto === indice && (
                      <div className="nueva-linea__calendario">
                        <CalendarioRango inicio={linea.fechaInicio} fin={linea.fechaFin}
                          ocupados={ocupados[linea.equipoId] || []} onChoque={setChoque}
                          onCambio={(fechaInicio, fechaFin) => { setChoque(''); cambiarLinea(indice, { fechaInicio, fechaFin }); }} />
                        {choque && <p className="f-alerta f-alerta--error nueva-linea__choque" role="alert">{choque}</p>}
                        <div className="nueva-linea__pie">
                          <div>
                            <strong>{dias > 0 ? `${textoFechas(linea.fechaInicio, linea.fechaFin)} · ${dias} ${dias === 1 ? 'día' : 'días'}` : 'Elige el inicio y el fin'}</strong>
                            {dias > 0 && linea.equipoId && <small>{dinero(calculadas[indice].importe)} por {linea.cantidad} {Number(linea.cantidad) === 1 ? 'unidad' : 'unidades'}</small>}
                          </div>
                          <button type="button" className="f-btn f-btn--primario" disabled={!linea.fechaFin} onClick={() => setCalendarioAbierto(null)}>Listo</button>
                        </div>
                      </div>
                    )}
                  </div>

                  <input type="number" min="1" max={MAX_CANTIDAD} aria-label={`Cantidad de la línea ${indice + 1}`} value={linea.cantidad}
                    onChange={(e) => cambiarLinea(indice, { cantidad: e.target.value === '' ? '' : Number(e.target.value) })} />
                  <strong className="nueva-linea__subtotal">{calculadas[indice].importe > 0 ? dinero(calculadas[indice].importe) : '—'}</strong>
                  <button type="button" className="nueva-linea__quitar" aria-label={`Quitar la línea ${indice + 1}`} onClick={() => quitarLinea(indice)}>×</button>
                </div>
              );
            })}
            <button type="button" className="nueva-equipos__agregar" onClick={() => setLineas((actuales) => [...actuales, { ...LINEA_NUEVA }])}>
              + Agregar otro equipo
            </button>
          </section>

          <div className="f-campo nueva-notas">
            <label htmlFor="notas">Notas (opcional)</label>
            <textarea id="notas" value={notas} maxLength={MAX_NOTAS} onChange={(e) => setNotas(e.target.value)}
              placeholder="Ej. Acceso por la puerta 3, se requiere operador certificado" />
          </div>

          {error && <div className="f-alerta f-alerta--error" role="alert"><p>{error}</p></div>}
        </form>

        <aside className="nueva-lado">
          <div className="f-tarjeta nueva-desglose">
            <h2>Desglose</h2>
            <DesgloseCostos lineas={completas} municipio={cliente.municipio} />
          </div>
          <button type="submit" form="form-nueva" className="f-btn f-btn--primario f-btn--grande" disabled={guardando}>
            {guardando ? 'Guardando…' : 'Guardar cotización'}
          </button>
          <Link className="f-btn f-btn--secundario f-btn--grande" to="/comercial/cotizaciones">Cancelar</Link>
          {/* Ajuste A2 */}
          <p className="nueva-lado__nota">
            Se guarda con un folio nuevo y estado Pendiente. No compromete al cliente ni a la empresa
            ni aparta equipos hasta que se apruebe.
          </p>
        </aside>
      </div>
    </>
  );
}
