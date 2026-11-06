// Arranca Express y conecta el módulo de operaciones.
import express from 'express';
import { query } from './db.js';
import operacion from './rutas/operacion.rutas.js';

const app = express();
app.use('/api/operacion', express.json({ limit: '1200kb' }), operacion);

app.get('/api/salud', async (req, res) => {
  await query('SELECT 1');
  res.json({ ok: true });
});

app.use((req, res) => res.status(404).json({ error: 'Ruta no encontrada' }));

// En Express 5 los errores de las funciones async llegan aquí solos (no hace falta try/catch).
app.use((err, req, res, next) => {
  if (!err.status) console.error(err);
  res.status(err.status || 500).json({ error: err.status ? err.message : 'Error del servidor', ...err.extra });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Backend listo en http://localhost:${PORT}/api/salud`));
