-- Crea las tablas que falten sin borrar los datos guardados.
CREATE TABLE IF NOT EXISTS equipos (
  id               SERIAL PRIMARY KEY,
  nombre           VARCHAR(100)  NOT NULL,
  tipo             VARCHAR(50)   NOT NULL,
  modelo           VARCHAR(80)   NOT NULL,
  caracteristicas  TEXT          NOT NULL,
  tarifa_dia       NUMERIC(10,2) NOT NULL,
  foto             VARCHAR(300)  NOT NULL,
  disponible       BOOLEAN       NOT NULL DEFAULT TRUE   -- HU-01b
);

CREATE TABLE IF NOT EXISTS clientes (
  id         SERIAL PRIMARY KEY,
  nombre     VARCHAR(150) NOT NULL,
  telefono   CHAR(10)     NOT NULL,
  correo     VARCHAR(100) NOT NULL,
  empresa    VARCHAR(100),
  municipio  VARCHAR(60)  NOT NULL,
  direccion  VARCHAR(200) NOT NULL
);

CREATE TABLE IF NOT EXISTS cotizaciones (
  id          SERIAL PRIMARY KEY,
  folio       VARCHAR(12)   UNIQUE,
  cliente_id  INT           NOT NULL REFERENCES clientes(id),
  origen      VARCHAR(10)   NOT NULL DEFAULT 'Web',
  estado      VARCHAR(20)   NOT NULL DEFAULT 'Pendiente',
  notas       VARCHAR(500),
  subtotal    NUMERIC(12,2) NOT NULL,
  envio       NUMERIC(12,2) NOT NULL DEFAULT 0,   -- HU-13b
  iva         NUMERIC(12,2) NOT NULL,
  total       NUMERIC(12,2) NOT NULL,
  creada_en   TIMESTAMP     NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cotizacion_equipos (
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

-- Sprint 2: columnas nuevas para bases que ya existen (no borra datos).
ALTER TABLE equipos      ADD COLUMN IF NOT EXISTS disponible BOOLEAN       NOT NULL DEFAULT TRUE;   -- HU-01b
ALTER TABLE cotizaciones ADD COLUMN IF NOT EXISTS envio      NUMERIC(12,2) NOT NULL DEFAULT 0;      -- HU-13b

-- A4 (re-presentación del Sprint 1): código postal y colonia del cliente.
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS codigo_postal VARCHAR(5);
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS colonia       VARCHAR(100);
-- Catálogo de códigos postales de Sonora (Correos de México). Se llena con: npm run cp:cargar --prefix backend
-- El archivo de Correos no se guarda en el repo: su licencia no permite redistribuirlo.
CREATE TABLE IF NOT EXISTS codigos_postales (
  codigo_postal VARCHAR(5)   NOT NULL,
  colonia       VARCHAR(100) NOT NULL,
  municipio     VARCHAR(80)  NOT NULL,
  estado        VARCHAR(40)  NOT NULL
);
CREATE INDEX IF NOT EXISTS codigos_postales_cp ON codigos_postales (codigo_postal);

-- HU-01b: solo sustituye las ilustraciones originales de la demo.
-- No altera las fotos ni la disponibilidad que alguien actualice después.
UPDATE equipos AS e
   SET disponible = CASE WHEN e.modelo = 'Rodillo 10 t' AND e.foto = '/img/equipos/compactador.png'
                         THEN FALSE ELSE e.disponible END,
       foto = fotos.url
  FROM (VALUES
    ('/img/equipos/montacargas-toyota.png', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/5/55/Toyota_forklift_vehicle.jpg/960px-Toyota_forklift_vehicle.jpg'),
    ('/img/equipos/excavadora.png', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/3/39/ROCA_Caterpillar_320D_Excavator_Display_in_Chaiyi_Air_Force_Base_20120811a.jpg/960px-ROCA_Caterpillar_320D_Excavator_Display_in_Chaiyi_Air_Force_Base_20120811a.jpg'),
    ('/img/equipos/retroexcavadora.png', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/3/3b/Deere_310L_-_Arlington%2C_MA.jpg/960px-Deere_310L_-_Arlington%2C_MA.jpg'),
    ('/img/equipos/montacargas-electrico.png', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/f/fb/Hyster_50XT_forklift_parked_in_downtown_Campbell.jpg/960px-Hyster_50XT_forklift_parked_in_downtown_Campbell.jpg'),
    ('/img/equipos/minicargador.png', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f5/Bobcat_S650_skid_steer_loader_%2815084521732%29.jpg/960px-Bobcat_S650_skid_steer_loader_%2815084521732%29.jpg'),
    ('/img/equipos/compactador.png', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/6/62/Caterpillar_CB54B_roller_on_dirt_lot_in_Campbell.jpg/960px-Caterpillar_CB54B_roller_on_dirt_lot_in_Campbell.jpg')
  ) AS fotos(local, url)
 WHERE e.foto = fotos.local;
