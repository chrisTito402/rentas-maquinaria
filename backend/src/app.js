// Ambos módulos usan la misma conexión a PostgreSQL.
import express from 'express';
import { fileURLToPath } from 'node:url';
import { query } from './db.js';
import equipos from './rutas/equipos.rutas.js';
import solicitudes from './rutas/solicitudes.rutas.js';
import aprobaciones from './rutas/aprobaciones.rutas.js';
import consultas from './rutas/consultas.rutas.js';
import operacion from './rutas/operacion.rutas.js';

export const app = express();
app.use('/api/operacion', express.json({ limit: '1200kb' }), operacion);
app.use(express.json());

app.get('/api/salud', async (req, res) => {
  await query('SELECT 1');
  res.json({ ok: true });
});

app.use('/api/equipos', equipos);
app.use('/api/cotizaciones', solicitudes, aprobaciones, consultas);

// Las rutas de la API nunca deben devolver la página de React.
app.use('/api', (req, res) => res.status(404).json({ error: 'Ruta no encontrada' }));
const pagina = fileURLToPath(new URL('../../frontend/dist/', import.meta.url));
app.use(express.static(pagina));
app.get(/.*/, (req, res, next) => {
  if (!req.accepts('html')) return next();
  res.sendFile('index.html', { root: pagina }, error => {
    if (error) next(error);
  });
});

app.use((req, res) => res.status(404).json({ error: 'Ruta no encontrada' }));

// En Express 5 los errores de las funciones async llegan aquí solos (no hace falta try/catch).
app.use((err, req, res, next) => {
  if (!err.status) console.error(err);
  res.status(err.status || 500).json({ error: err.status ? err.message : 'Error del servidor', ...err.extra });
});

