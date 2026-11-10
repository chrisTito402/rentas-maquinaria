CREATE TABLE IF NOT EXISTS operacion_equipos (
  id TEXT PRIMARY KEY,
  datos JSONB NOT NULL,
  estado TEXT GENERATED ALWAYS AS (datos ->> 'state') STORED NOT NULL
);

CREATE TABLE IF NOT EXISTS operacion_rentas (
  id TEXT PRIMARY KEY,
  equipo_id TEXT NOT NULL REFERENCES operacion_equipos(id),
  datos JSONB NOT NULL,
  estado TEXT GENERATED ALWAYS AS (datos ->> 'status') STORED NOT NULL
);

-- Retira los ejemplos de versiones anteriores y conserva los apartados de Comercial.
DELETE FROM operacion_rentas AS renta
USING generate_series(13, 25) AS ejemplo(numero)
WHERE renta.id = 'R-' || lpad(ejemplo.numero::text, 3, '0')
  AND renta.datos ->> 'commercial' = 'AP-2026-' || lpad((ejemplo.numero + 76)::text, 4, '0')
  AND NOT (renta.datos ? 'cotizacionId');

DELETE FROM operacion_equipos AS unidad
USING generate_series(1, 23) AS ejemplo(numero)
WHERE unidad.id = 'UN-' || lpad(ejemplo.numero::text, 3, '0')
  AND unidad.datos ->> 'serial' = 'SER-' || (ejemplo.numero + 204799)
  AND NOT EXISTS (SELECT 1 FROM operacion_rentas WHERE equipo_id = unidad.id);
