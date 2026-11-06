-- BASE · No se toca. Tablas del Sprint 1.
-- Se corre solo con:  npm run db:crear   (borra y vuelve a crear todo)

DROP TABLE IF EXISTS cotizacion_equipos;
DROP TABLE IF EXISTS cotizaciones;
DROP TABLE IF EXISTS clientes;
DROP TABLE IF EXISTS equipos;

CREATE TABLE equipos (
  id               SERIAL PRIMARY KEY,
  nombre           VARCHAR(100)  NOT NULL,
  tipo             VARCHAR(50)   NOT NULL,
  modelo           VARCHAR(80)   NOT NULL,
  caracteristicas  TEXT          NOT NULL,
  tarifa_dia       NUMERIC(10,2) NOT NULL,
  foto             VARCHAR(300)  NOT NULL
);

CREATE TABLE clientes (
  id         SERIAL PRIMARY KEY,
  nombre     VARCHAR(150) NOT NULL,
  telefono   CHAR(10)     NOT NULL,
  correo     VARCHAR(100) NOT NULL,
  empresa    VARCHAR(100),
  municipio  VARCHAR(60)  NOT NULL,
  direccion  VARCHAR(200) NOT NULL
);

CREATE TABLE cotizaciones (
  id          SERIAL PRIMARY KEY,
  folio       VARCHAR(12)   UNIQUE,
  cliente_id  INT           NOT NULL REFERENCES clientes(id),
  origen      VARCHAR(10)   NOT NULL DEFAULT 'Web',
  estado      VARCHAR(20)   NOT NULL DEFAULT 'Pendiente',
  notas       VARCHAR(500),
  subtotal    NUMERIC(12,2) NOT NULL,
  iva         NUMERIC(12,2) NOT NULL,
  total       NUMERIC(12,2) NOT NULL,
  creada_en   TIMESTAMP     NOT NULL DEFAULT NOW()
);

CREATE TABLE cotizacion_equipos (
  id             SERIAL PRIMARY KEY,
  cotizacion_id  INT           NOT NULL REFERENCES cotizaciones(id) ON DELETE CASCADE,
  equipo_id      INT           NOT NULL REFERENCES equipos(id),
  cantidad       INT           NOT NULL CHECK (cantidad BETWEEN 1 AND 20),
  fecha_inicio   DATE          NOT NULL,
  fecha_fin      DATE          NOT NULL CHECK (fecha_fin >= fecha_inicio),
  dias           INT           NOT NULL,
  tarifa_dia     NUMERIC(10,2) NOT NULL,
  importe        NUMERIC(12,2) NOT NULL
);
