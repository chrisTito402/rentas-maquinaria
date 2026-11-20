// Dueño: Chris · HU-14a Enviar solicitud de cotización (KAN-11)
import { Router } from 'express';
import { crearCotizacion } from '../cotizacion.js';

const r = Router();

// POST /api/cotizaciones/web  (pública: el cliente no inicia sesión)
// recibe: { cliente: {nombre, telefono, correo, empresa, municipio, direccion}, notas,
//           lineas: [{ equipoId, cantidad, fechaInicio, fechaFin }] }
// regresa 201: { id, folio, total }   ·   400: { error, errores? }
// La validación, el cálculo y el guardado viven en ../cotizacion.js (los comparte con /panel).
r.post('/web', async (req, res) => {
  res.status(201).json(await crearCotizacion(req.body, 'Web'));
});

export default r;
