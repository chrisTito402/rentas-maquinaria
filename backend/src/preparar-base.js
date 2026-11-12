import { readFile } from 'node:fs/promises';
import { pool } from './db.js';

// Prepara Render sin usar db:crear, que está pensado para reiniciar la base local.
export async function prepararBase(conexion = pool) {
  if (!process.env.DATABASE_URL) throw new Error('Falta DATABASE_URL para conectar la base.');
  const db = await conexion.connect();
  try {
    await db.query('BEGIN');
    await db.query("SELECT pg_advisory_xact_lock(hashtext('rentas-maquinaria.arranque'))");
    const { rows: [estado] } = await db.query(`SELECT
      to_regclass('equipos') AS equipos,
      to_regclass('clientes') AS clientes,
      to_regclass('cotizaciones') AS cotizaciones,
      to_regclass('cotizacion_equipos') AS detalle`);
    const nueva = Object.values(estado).every(tabla => tabla === null);
    await db.query(await readFile(new URL('../db/arranque.sql', import.meta.url), 'utf8'));
    if (nueva) {
      await db.query(await readFile(new URL('../db/semilla.sql', import.meta.url), 'utf8'));
    }
    await db.query('COMMIT');
    console.log(nueva ? 'Base lista con datos de ejemplo.' : 'Base lista. Se conservaron los datos.');
  } catch (error) {
    await db.query('ROLLBACK').catch(() => {});
    throw error;
  } finally {
    db.release();
  }
}
