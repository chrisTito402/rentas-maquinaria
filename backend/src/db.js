// BASE · No se toca. Conexión a PostgreSQL.
import 'dotenv/config';
import pg from 'pg';

pg.types.setTypeParser(1082, (v) => v);              // DATE    -> '2026-10-14' (sin líos de zona horaria)
pg.types.setTypeParser(1700, (v) => parseFloat(v));  // NUMERIC -> número de JavaScript
pg.types.setTypeParser(20, (v) => parseInt(v, 10));  // COUNT() -> número

export const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

// Uso: const { rows } = await query('SELECT * FROM equipos WHERE id = $1', [id]);
export const query = (texto, params) => pool.query(texto, params);
