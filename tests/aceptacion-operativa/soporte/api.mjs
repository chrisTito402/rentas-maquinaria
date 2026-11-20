import { applyOperation } from '../../../compartido/operacion/operaciones.js';
import { asignarUnidades } from '../../../backend/src/reservaciones.js';
import { estadoPara } from './datos.mjs';

export async function prepararAPI(page) {
  const cliente = { nombre: 'Constructora del Norte', telefono: '6621234567', correo: 'obra@example.com', direccion: 'Avenida principal 10', municipio: 'Hermosillo', empresa: 'Obras del Norte' };
  const linea = { id: 1, equipoId: 1, equipo: 'Montacargas', modelo: 'M1', tipo: 'Carga', cantidad: 2, inicio: '2026-11-09', fin: '2026-11-15', fechaInicio: '2026-11-09', fechaFin: '2026-11-15', dias: 7, tarifaDia: 100, importe: 1400 };
  let cot = { id: 1, folio: 'COT-0001', estado: 'Pendiente', origen: 'Web', cliente, creadaEn: '2026-11-09T12:00:00Z', lineas: [linea], subtotal: 1400, iva: 224, total: 1624 };
  let data = { units: [], rentals: [], reservaciones: [], catalogo: [{ id: 1, nombre: 'Montacargas', modelo: 'M1', tipo: 'Carga' }] };
  const errores = [];
  page.on('pageerror', e => errores.push(e.message));
  let falloAccion = false;
  await page.route('**/api/**', async route => {
    const url = new URL(route.request().url());
    let body;
    let status = 200;
    if (url.pathname === '/api/auth/sesion') body = { usuario: { id: 1, nombre: 'operativa' } };
    else if (url.pathname === '/api/cotizaciones/1/aprobar') { cot.estado = 'Aprobada'; data.reservaciones = [cot]; body = { id: 1, folio: cot.folio, estado: 'Aprobada' }; }
    else if (url.pathname === '/api/cotizaciones/1') body = cot;
    else if (url.pathname === '/api/cotizaciones') body = [{ ...cot, cliente: cliente.nombre, fechaInicio: linea.inicio, fechaFin: linea.fin }];
    else if (url.pathname === '/api/operacion/reservaciones/1/asignar') {
      data = { ...data, ...asignarUnidades(data, cot, route.request().postDataJSON().unidades), reservaciones: [] }; body = data;
    } else if (url.pathname === '/api/operacion/acciones') {
      if (falloAccion) { status = 409; body = { error: 'No se pudo guardar. Intenta de nuevo.' }; falloAccion = false; }
      else { const { id, accion, campos } = route.request().postDataJSON(); data = { ...data, ...applyOperation(data, id, accion, campos) }; body = data; }
    } else if (url.pathname === '/api/operacion') body = data;
    else if (url.pathname === '/api/equipos') body = [];
    else { status = 404; body = { error: 'Ruta no simulada' }; }
    await route.fulfill({ status, json: body });
  });
  return {
    errores,
    estado: () => structuredClone(data),
    iniciarEstado: etapa => { cot.estado = 'Aprobada'; data = { ...data, ...estadoPara(etapa), reservaciones: [] }; },
    fallarSiguiente: () => { falloAccion = true; },
    iniciarAsignada: () => { cot.estado = 'Aprobada'; data = { ...data, ...asignarUnidades(data, cot, ['MC-01', 'MC-02']), reservaciones: [] }; },
  };
}
