// BASE · No se toca. Arranca Express y conecta las rutas de cada HU.
import express from 'express';
import { query } from './db.js';
import equipos from './rutas/equipos.rutas.js';             // Héctor · HU-01a y HU-04
import solicitudes from './rutas/solicitudes.rutas.js';     // Chris  · HU-14a
import aprobaciones from './rutas/aprobaciones.rutas.js';   // Héctor · HU-15a
import consultas from './rutas/consultas.rutas.js';         // Katia  · HU-10

const app = express();
app.use(express.json());

app.get('/api/salud', async (req, res) => {
  await query('SELECT 1');
  res.json({ ok: true });
});

app.use('/api/equipos', equipos);
app.use('/api/cotizaciones', solicitudes);
app.use('/api/cotizaciones', aprobaciones);
app.use('/api/cotizaciones', consultas);

app.use((req, res) => res.status(404).json({ error: 'Ruta no encontrada' }));

// En Express 5 los errores de las funciones async llegan aquí solos (no hace falta try/catch).
app.use((err, req, res, next) => {
  if (!err.status) console.error(err);
  res.status(err.status || 500).json({ error: err.status ? err.message : 'Error del servidor', ...err.extra });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Backend listo en http://localhost:${PORT}/api/salud`));
