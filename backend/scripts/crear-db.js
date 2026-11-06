// BASE · Crea la base renta_equipos (si no existe), sus tablas y los datos de ejemplo.
// Uso: npm run db:crear      (se puede correr las veces que quieras: deja todo como nuevo)
import 'dotenv/config';
import pg from 'pg';
import { readFileSync } from 'node:fs';

const leer = (archivo) => readFileSync(new URL(`../db/${archivo}`, import.meta.url), 'utf8');

try {
  if (!process.env.DATABASE_URL) throw new Error('NO_ENV');
  const url = new URL(process.env.DATABASE_URL);
  const nombre = url.pathname.slice(1);
  const urlAdmin = new URL(url);
  urlAdmin.pathname = '/postgres';

  const admin = new pg.Client({ connectionString: urlAdmin.toString() });
  await admin.connect();
  const { rowCount } = await admin.query('SELECT 1 FROM pg_database WHERE datname = $1', [nombre]);
  if (!rowCount) {
    await admin.query(`CREATE DATABASE "${nombre}"`);
    console.log(`Base de datos "${nombre}" creada.`);
  }
  await admin.end();

  const db = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await db.connect();
  await db.query('SET client_min_messages TO WARNING');
  await db.query(leer('schema.sql'));
  await db.query(leer('semilla.sql'));
  const { rows } = await db.query(
    'SELECT (SELECT COUNT(*) FROM equipos) AS equipos, (SELECT COUNT(*) FROM cotizaciones) AS cotizaciones',
  );
  await db.end();
  console.log(`Listo: ${rows[0].equipos} equipos y ${rows[0].cotizaciones} cotizaciones de ejemplo.`);
} catch (e) {
  if (e.message === 'NO_ENV') console.error('Falta el archivo backend/.env (copia .env.example como .env).');
  else if (e.code === '28P01') console.error('Contraseña incorrecta: revisa TU_CONTRASEÑA en backend/.env.');
  else if (e.code === 'ECONNREFUSED') console.error('PostgreSQL no está prendido o no está en el puerto 5432.');
  else console.error('Error:', e.message);
  process.exit(1);
}
