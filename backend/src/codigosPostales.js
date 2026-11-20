// Dueño: Katia · A4 Código postal que llena el estado, el municipio y la colonia (HU-06)
// Datos: Catálogo Nacional de Códigos Postales de Correos de México (solo Sonora).
// Se cargan con `npm run cp:cargar`; la app solo responde un código postal a la vez.

// db: { query } o el cliente de una transacción
// regresa { codigoPostal, municipio, estado, colonias: [...] } o null si no existe
export async function buscarCodigoPostal(db, codigoPostal) {
  const { rows } = await db.query(
    `SELECT DISTINCT colonia, municipio, estado FROM codigos_postales
      WHERE codigo_postal = $1 ORDER BY colonia`,
    [codigoPostal],
  );
  if (!rows.length) return null;
  return { codigoPostal, municipio: rows[0].municipio, estado: rows[0].estado, colonias: rows.map((r) => r.colonia) };
}

// true si ya se corrió `npm run cp:cargar` (si no, la app sigue con la lista de municipios a mano)
// Primero revisa que la tabla exista, sin provocar un error (que echaría a perder una transacción abierta).
export async function hayCatalogo(db) {
  const { rows: [tabla] } = await db.query("SELECT to_regclass('codigos_postales') IS NOT NULL AS existe");
  if (!tabla.existe) return false;
  const { rows: [conteo] } = await db.query('SELECT EXISTS (SELECT 1 FROM codigos_postales) AS hay');
  return conteo.hay;
}
