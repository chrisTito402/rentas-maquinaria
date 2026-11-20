// Dueño: Katia · HU-05 Crear cotización desde el panel (KAN-13)
import { Router } from 'express';
import { crearCotizacion } from '../cotizacion.js';

const r = Router();

// POST /api/cotizaciones/panel  (requiere sesión; mismo cuerpo que /web)
// regresa 201: { id, folio, total } · 400 datos inválidos · 409 fechas ocupadas
r.post('/panel', async (req, res) => {
  res.status(201).json(await crearCotizacion(req.body, 'Panel'));
});

export default r;
