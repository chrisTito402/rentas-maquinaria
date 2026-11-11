-- OPCIONAL · Alinea el catálogo de una base YA EXISTENTE con los 6 equipos del prototipo de Figma.
-- Solo cambia nombre, tipo, modelo, características, tarifa e imagen de los equipos 1 a 6
-- (los ids no cambian). No toca cotizaciones ni las unidades del módulo de Operaciones:
-- las cotizaciones guardadas conservan la tarifa con la que se cotizaron.
-- Avísale al equipo de Operaciones antes de correrlo, porque ellos también ven estos nombres.
--
-- Uso:  psql "$DATABASE_URL" -f backend/db/equipos-figma.sql

BEGIN;
UPDATE equipos SET nombre = 'Montacargas Toyota 8FG25', tipo = 'Montacargas', modelo = '8FG25',
  caracteristicas = 'Capacidad de carga 2.5 t · Gas LP · Elevación máxima 4.80 m', tarifa_dia = 1200,
  foto = '/img/equipos/montacargas-toyota.png' WHERE id = 1;
UPDATE equipos SET nombre = 'Excavadora de Oruga CAT 320D', tipo = 'Excavadora', modelo = '320D',
  caracteristicas = 'Motor diésel · Cucharón de 1.2 m³', tarifa_dia = 6800,
  foto = '/img/equipos/excavadora.png' WHERE id = 2;
UPDATE equipos SET nombre = 'Retroexcavadora John Deere 310L', tipo = 'Retroexcavadora', modelo = '310L',
  caracteristicas = 'Tracción 4×4 · Cucharón frontal y bote', tarifa_dia = 4500,
  foto = '/img/equipos/retroexcavadora.png' WHERE id = 3;
UPDATE equipos SET nombre = 'Montacargas Eléctrico Hyster J50XN', tipo = 'Montacargas', modelo = 'J50XN',
  caracteristicas = 'Capacidad de carga 5,000 lb · Torre triple · Eléctrico', tarifa_dia = 1450,
  foto = '/img/equipos/montacargas-electrico.png' WHERE id = 4;
UPDATE equipos SET nombre = 'Minicargador Bobcat S650', tipo = 'Minicargador', modelo = 'S650',
  caracteristicas = 'Cargador compacto · Cucharón estándar', tarifa_dia = 2900,
  foto = '/img/equipos/minicargador.png' WHERE id = 5;
UPDATE equipos SET nombre = 'Compactador de rodillo liso 10 ton', tipo = 'Compactador', modelo = 'Rodillo 10 t',
  caracteristicas = 'Rodillo vibratorio · Diésel', tarifa_dia = 2300,
  foto = '/img/equipos/compactador.png' WHERE id = 6;
COMMIT;
