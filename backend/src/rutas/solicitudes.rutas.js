// Dueño: Chris · HU-14a Enviar solicitud de cotización (KAN-11)
// VERSIÓN FALSA: todavía no guarda nada. Chris la reemplaza por la real.
import { Router } from 'express';
import { errorHttp } from '../errores.js';

const r = Router();

// POST /api/cotizaciones/web
// recibe: { cliente: {nombre, telefono, correo, empresa, municipio, direccion}, notas,
//           lineas: [{ equipoId, cantidad, fechaInicio, fechaFin }] }
// regresa 201: { id, folio, total }   ·   400: { error, errores? }
r.post('/web', () => {
  throw errorHttp(501, 'HU-14a: pendiente de programar (Chris)');
});

export default r;
