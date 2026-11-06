// Dueño: Héctor · HU-01a Ver catálogo de equipos (KAN-6) y HU-04 Ver detalle del equipo (KAN-8)
// VERSIÓN FALSA: responde datos fijos con la forma definitiva. Héctor la reemplaza por la real.
import { Router } from 'express';

const r = Router();

const FALSOS = [
  { id: 1, nombre: 'Montacargas Toyota 8FG25 (FALSO)', tipo: 'Montacargas', modelo: '8FG25',
    caracteristicas: 'Capacidad 2.5 t', tarifaDia: 1200, foto: 'https://placehold.co/480x300?text=Falso' },
];

// HU-01a · GET /api/equipos -> [{ id, nombre, tipo, modelo, tarifaDia, foto }]
r.get('/', (req, res) => res.json(FALSOS));

// HU-04 · GET /api/equipos/:id -> { id, nombre, tipo, modelo, caracteristicas, tarifaDia, foto }
r.get('/:id', (req, res) => res.json({ ...FALSOS[0], id: Number(req.params.id) }));

export default r;
