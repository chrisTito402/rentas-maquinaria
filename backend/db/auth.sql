-- HU-16: migración aditiva. No altera los datos comerciales u operativos.
CREATE TABLE IF NOT EXISTS auth_usuarios (
  id SERIAL PRIMARY KEY,
  usuario_cifrado TEXT NOT NULL,
  usuario_indice TEXT NOT NULL UNIQUE,
  contrasena_hash TEXT NOT NULL,
  activo BOOLEAN NOT NULL DEFAULT TRUE
);
CREATE TABLE IF NOT EXISTS auth_sesiones (
  token_hash TEXT PRIMARY KEY,
  usuario_id INTEGER NOT NULL REFERENCES auth_usuarios(id) ON DELETE CASCADE,
  vence_en TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS auth_sesiones_vencimiento ON auth_sesiones(vence_en);
