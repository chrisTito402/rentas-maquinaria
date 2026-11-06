// Dueño: Chris · HU-14a Enviar solicitud de cotización (KAN-11)
import { Router } from 'express';
import { pool } from '../db.js';
import { errorHttp } from '../errores.js';
import { calcularCostos, contarDias } from '../../../compartido/costos.js';
import { validarCliente } from '../../../compartido/validarCliente.js';
import { MAX_CANTIDAD, MAX_NOTAS } from '../../../compartido/constantes.js';

const r = Router();
const esObjeto = (valor) => valor !== null && typeof valor === 'object' && !Array.isArray(valor);
const CAMPOS_CLIENTE = { nombre: 150, telefono: 10, correo: 100, empresa: 100, municipio: 60, direccion: 200 };

// POST /api/cotizaciones/web
// recibe: { cliente: {nombre, telefono, correo, empresa, municipio, direccion}, notas,
//           lineas: [{ equipoId, cantidad, fechaInicio, fechaFin }] }
// regresa 201: { id, folio, total }   ·   400: { error, errores? }
r.post('/web', async (req, res) => {
  const cuerpo = req.body;
  if (!esObjeto(cuerpo) || !Array.isArray(cuerpo.lineas) || cuerpo.lineas.length === 0) {
    throw errorHttp(400, 'Agrega al menos un equipo a tu cotización.');
  }
  if (!esObjeto(cuerpo.cliente)) throw errorHttp(400, 'Faltan los datos del cliente.');
  if (cuerpo.notas != null && typeof cuerpo.notas !== 'string') {
    throw errorHttp(400, 'Las notas deben ser texto.');
  }
  if ((cuerpo.notas ?? '').length > MAX_NOTAS) {
    throw errorHttp(400, `Las notas no pueden superar ${MAX_NOTAS} caracteres.`);
  }

  const cliente = {};
  const errores = {};
  for (const [campo, maximo] of Object.entries(CAMPOS_CLIENTE)) {
    const valor = cuerpo.cliente[campo];
    cliente[campo] = typeof valor === 'string' ? valor.trim() : '';
    // Comprueba la forma y los límites de almacenamiento; las reglas de HU-06 son compartidas.
    if (valor != null && typeof valor !== 'string') errores[campo] = 'Debe ser texto.';
    else if (campo !== 'empresa' && !cliente[campo]) errores[campo] = 'Este dato es obligatorio.';
    else if (cliente[campo].length > maximo) errores[campo] = `Máximo ${maximo} caracteres.`;
  }
  Object.assign(errores, validarCliente(cliente));
  if (Object.keys(errores).length > 0) {
    throw errorHttp(400, 'Revisa los datos del cliente.', { errores });
  }

  for (const [indice, linea] of cuerpo.lineas.entries()) {
    if (!esObjeto(linea) || !Number.isInteger(linea.equipoId) || linea.equipoId < 1 || linea.equipoId > 2147483647) {
      throw errorHttp(400, `El equipo de la línea ${indice + 1} no es válido.`);
    }
    if (!Number.isInteger(linea.cantidad) || linea.cantidad < 1 || linea.cantidad > MAX_CANTIDAD) {
      throw errorHttp(400, `La cantidad de la línea ${indice + 1} debe ser de 1 a ${MAX_CANTIDAD}.`);
    }
    if (contarDias(linea.fechaInicio, linea.fechaFin) === 0 || linea.fechaInicio.startsWith('0000')) {
      throw errorHttp(400, `Revisa las fechas de la línea ${indice + 1}.`);
    }
  }

  const db = await pool.connect();
  try {
    await db.query('BEGIN');
    const ids = [...new Set(cuerpo.lineas.map((linea) => linea.equipoId))];
    const { rows: equipos } = await db.query('SELECT id, tarifa_dia FROM equipos WHERE id = ANY($1::int[])', [ids]);
    if (equipos.length !== ids.length) throw errorHttp(400, 'Uno o más equipos ya no existen en el catálogo.');
    const tarifas = new Map(equipos.map((equipo) => [equipo.id, equipo.tarifa_dia]));
    const costos = calcularCostos(cuerpo.lineas.map((linea) => ({
      equipoId: linea.equipoId,
      cantidad: linea.cantidad,
      fechaInicio: linea.fechaInicio,
      fechaFin: linea.fechaFin,
      tarifaDia: tarifas.get(linea.equipoId),
    })));
    if (!Number.isFinite(costos.total) || costos.total >= 10000000000) {
      throw errorHttp(400, 'El importe de la solicitud supera el máximo permitido.');
    }

    const { rows: clientes } = await db.query(
      'INSERT INTO clientes (nombre, telefono, correo, empresa, municipio, direccion) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
      [cliente.nombre, cliente.telefono, cliente.correo, cliente.empresa || null, cliente.municipio, cliente.direccion],
    );
    const { rows: cotizaciones } = await db.query(
      `INSERT INTO cotizaciones (cliente_id, origen, estado, notas, subtotal, iva, total)
       VALUES ($1, 'Web', 'Pendiente', $2, $3, $4, $5) RETURNING id`,
      [clientes[0].id, cuerpo.notas?.trim() || null, costos.subtotal, costos.iva, costos.total],
    );
    const id = cotizaciones[0].id;
    const folio = `COT-${String(id).padStart(4, '0')}`;
    await db.query('UPDATE cotizaciones SET folio = $1 WHERE id = $2', [folio, id]);
    for (const linea of costos.lineas) {
      await db.query(
        `INSERT INTO cotizacion_equipos (cotizacion_id, equipo_id, cantidad, fecha_inicio, fecha_fin, dias, tarifa_dia, importe)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [id, linea.equipoId, linea.cantidad, linea.fechaInicio, linea.fechaFin, linea.dias, linea.tarifaDia, linea.importe],
      );
    }
    await db.query('COMMIT');
    res.status(201).json({ id, folio, total: costos.total });
  } catch (error) {
    await db.query('ROLLBACK').catch(() => {});
    throw error;
  } finally {
    db.release();
  }
});

export default r;
