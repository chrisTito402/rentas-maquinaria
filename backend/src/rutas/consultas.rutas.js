// Dueño: Katia · HU-10 Consultar cotizaciones (KAN-19)
// VERSIÓN FALSA: responde datos fijos con la forma definitiva. Katia la reemplaza por la real.
import { Router } from 'express';

const r = Router();

// GET /api/cotizaciones?q=texto
// -> [{ id, folio, cliente, origen, estado, total, creadaEn, fechaInicio, fechaFin }]  (más reciente primero)
r.get('/', (req, res) => {
  res.json([
    { id: 1, folio: 'COT-0001', cliente: 'Cliente FALSO', origen: 'Web', estado: 'Pendiente',
      total: 0, creadaEn: '2026-11-06T10:00:00', fechaInicio: '2026-11-10', fechaFin: '2026-11-12' },
  ]);
});

// GET /api/cotizaciones/:id
// -> { id, folio, origen, estado, notas, subtotal, iva, total, creadaEn,
//      cliente: { nombre, telefono, correo, empresa, municipio, direccion },
//      lineas: [{ id, equipo, cantidad, fechaInicio, fechaFin, dias, tarifaDia, importe }] }
r.get('/:id', (req, res) => {
  const id = Number(req.params.id);
  res.json({
    id, folio: `COT-${String(id).padStart(4, '0')}`, origen: 'Web', estado: 'Pendiente', notas: null,
    subtotal: 0, iva: 0, total: 0, creadaEn: '2026-11-06T10:00:00',
    cliente: { nombre: 'Cliente FALSO', telefono: '6440000000', correo: 'falso@correo.com',
               empresa: null, municipio: 'Cajeme', direccion: 'Sin dirección' },
    lineas: [],
  });
});

export default r;
