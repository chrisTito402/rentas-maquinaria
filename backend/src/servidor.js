// Ambos módulos usan la misma conexión a PostgreSQL.
import express from 'express';
import { query } from './db.js';
import equipos from './rutas/equipos.rutas.js';
import solicitudes from './rutas/solicitudes.rutas.js';
import aprobaciones from './rutas/aprobaciones.rutas.js';
import consultas from './rutas/consultas.rutas.js';
import operacion from './rutas/operacion.rutas.js';

const app = express();
app.use('/api/operacion', express.json({ limit: '1200kb' }), operacion);
app.use(express.json());

app.get('/api/salud', async (req, res) => {
  await query('SELECT 1');
  res.json({ ok: true });
});

app.use('/api/equipos', equipos);
app.use('/api/cotizaciones', solicitudes, aprobaciones, consultas);

app.use((req, res) => res.status(404).json({ error: 'Ruta no encontrada' }));

// En Express 5 los errores de las funciones async llegan aquí solos (no hace falta try/catch).
app.use((err, req, res, next) => {
  if (!err.status) console.error(err);
  res.status(err.status || 500).json({ error: err.status ? err.message : 'Error del servidor', ...err.extra });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Backend listo en http://localhost:${PORT}/api/salud`));
