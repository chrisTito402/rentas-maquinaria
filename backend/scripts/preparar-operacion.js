import { readFile } from 'node:fs/promises';
import { pool } from '../src/db.js';

try {
  await pool.query(await readFile(new URL('../db/operacion.sql', import.meta.url), 'utf8'));
  console.log('Tablas de operaciones listas.');
} finally {
  await pool.end();
}
