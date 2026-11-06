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
