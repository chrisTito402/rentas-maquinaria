-- BASE · Datos de ejemplo: 6 equipos y 3 cotizaciones (para probar el panel desde el día 1).
-- Son los mismos 6 equipos del prototipo de Figma; las imágenes son sus ilustraciones.
-- Las fotos reales llegan con HU-01b (Sprint 2).

INSERT INTO equipos (nombre, tipo, modelo, caracteristicas, tarifa_dia, foto) VALUES
('Montacargas Toyota 8FG25', 'Montacargas', '8FG25', 'Capacidad de carga 2.5 t · Gas LP · Elevación máxima 4.80 m', 1200, '/img/equipos/montacargas-toyota.png'),
('Excavadora de Oruga CAT 320D', 'Excavadora', '320D', 'Motor diésel · Cucharón de 1.2 m³', 6800, '/img/equipos/excavadora.png'),
('Retroexcavadora John Deere 310L', 'Retroexcavadora', '310L', 'Tracción 4×4 · Cucharón frontal y bote', 4500, '/img/equipos/retroexcavadora.png'),
('Montacargas Eléctrico Hyster J50XN', 'Montacargas', 'J50XN', 'Capacidad de carga 5,000 lb · Torre triple · Eléctrico', 1450, '/img/equipos/montacargas-electrico.png'),
('Minicargador Bobcat S650', 'Minicargador', 'S650', 'Cargador compacto · Cucharón estándar', 2900, '/img/equipos/minicargador.png'),
('Compactador de rodillo liso 10 ton', 'Compactador', 'Rodillo 10 t', 'Rodillo vibratorio · Diésel', 2300, '/img/equipos/compactador.png');

INSERT INTO clientes (nombre, telefono, correo, empresa, municipio, direccion) VALUES
('Ana Valenzuela Ochoa', '6441234567', 'ana@vallegrupo.com', 'Constructora Valle del Yaqui', 'Cajeme', 'Calle 5 de Febrero 120, Col. Centro'),
('María López Ruiz', '6429876543', 'maria.lopez@correo.com', NULL, 'Navojoa', 'Av. Obregón 45, Col. Juárez'),
('Jorge Ramírez Soto', '6471112233', 'jorge@agricolamayo.mx', 'Agrícola del Mayo', 'Huatabampo', 'Carretera a Yavaros km 3, Col. Ejidal');

INSERT INTO cotizaciones (folio, cliente_id, origen, estado, notas, subtotal, iva, total, creada_en) VALUES
('COT-0001', 1, 'Web', 'Pendiente', 'Entregar antes de las 8 a. m.', 7200, 1152, 8352, NOW() - INTERVAL '2 days'),
('COT-0002', 2, 'Web', 'Aprobada', NULL, 48500, 7760, 56260, NOW() - INTERVAL '1 day'),
('COT-0003', 3, 'Web', 'Pendiente', NULL, 8700, 1392, 10092, NOW() - INTERVAL '3 hours');

INSERT INTO cotizacion_equipos (cotizacion_id, equipo_id, cantidad, fecha_inicio, fecha_fin, dias, tarifa_dia, importe) VALUES
(1, 1, 2, '2026-11-10', '2026-11-12', 3, 1200, 7200),
(2, 2, 1, '2026-11-16', '2026-11-20', 5, 6800, 34000),
(2, 5, 1, '2026-11-16', '2026-11-20', 5, 2900, 14500),
(3, 4, 3, '2026-11-12', '2026-11-13', 2, 1450, 8700);
