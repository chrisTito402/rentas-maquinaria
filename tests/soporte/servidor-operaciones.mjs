import { app } from '../../backend/src/app.js';
import { pool } from '../../backend/src/db.js';

const servicio = app.listen(0, '127.0.0.1', () => process.send(servicio.address().port));
process.on('disconnect', () => {
  servicio.close(() => { void pool.end(); });
});
