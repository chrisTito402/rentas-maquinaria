-- BASE · Datos de ejemplo: 6 equipos y 3 cotizaciones (para probar el panel desde el día 1).
-- Las URL HTTPS de fotos ilustrativas se guardan en equipos.foto, no los archivos en el repo.
-- El rodillo queda No disponible para mostrar ambos estados en la demo.

INSERT INTO equipos (nombre, tipo, modelo, caracteristicas, tarifa_dia, foto, disponible) VALUES
('Montacargas Toyota 8FG25', 'Montacargas', '8FG25', 'Capacidad de carga 2.5 t · Gas LP · Elevación máxima 4.80 m', 1200, 'https://thumb.wikimedia.org/wikipedia/commons/thumb/5/55/Toyota_forklift_vehicle.jpg/960px-Toyota_forklift_vehicle.jpg', TRUE),
('Excavadora de Oruga CAT 320D', 'Excavadora', '320D', 'Motor diésel · Cucharón de 1.2 m³', 6800, 'https://thumb.wikimedia.org/wikipedia/commons/thumb/3/39/ROCA_Caterpillar_320D_Excavator_Display_in_Chaiyi_Air_Force_Base_20120811a.jpg/960px-ROCA_Caterpillar_320D_Excavator_Display_in_Chaiyi_Air_Force_Base_20120811a.jpg', TRUE),
('Retroexcavadora John Deere 310L', 'Retroexcavadora', '310L', 'Tracción 4×4 · Cucharón frontal y bote', 4500, 'https://thumb.wikimedia.org/wikipedia/commons/thumb/3/3b/Deere_310L_-_Arlington%2C_MA.jpg/960px-Deere_310L_-_Arlington%2C_MA.jpg', TRUE),
('Montacargas Eléctrico Hyster J50XN', 'Montacargas', 'J50XN', 'Capacidad de carga 5,000 lb · Torre triple · Eléctrico', 1450, 'https://thumb.wikimedia.org/wikipedia/commons/thumb/f/fb/Hyster_50XT_forklift_parked_in_downtown_Campbell.jpg/960px-Hyster_50XT_forklift_parked_in_downtown_Campbell.jpg', TRUE),
('Minicargador Bobcat S650', 'Minicargador', 'S650', 'Cargador compacto · Cucharón estándar', 2900, 'https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f5/Bobcat_S650_skid_steer_loader_%2815084521732%29.jpg/960px-Bobcat_S650_skid_steer_loader_%2815084521732%29.jpg', TRUE),
('Compactador de rodillo liso 10 ton', 'Compactador', 'Rodillo 10 t', 'Rodillo vibratorio · Diésel', 2300, 'https://thumb.wikimedia.org/wikipedia/commons/thumb/6/62/Caterpillar_CB54B_roller_on_dirt_lot_in_Campbell.jpg/960px-Caterpillar_CB54B_roller_on_dirt_lot_in_Campbell.jpg', FALSE);

INSERT INTO clientes (nombre, telefono, correo, empresa, municipio, direccion) VALUES
('Ana Valenzuela Ochoa', '6441234567', 'ana@vallegrupo.com', 'Constructora Valle del Yaqui', 'Cajeme', 'Calle 5 de Febrero 120, Col. Centro'),
('María López Ruiz', '6429876543', 'maria.lopez@correo.com', NULL, 'Navojoa', 'Av. Obregón 45, Col. Juárez'),
('Jorge Ramírez Soto', '6471112233', 'jorge@agricolamayo.mx', 'Agrícola del Mayo', 'Huatabampo', 'Carretera a Yavaros km 3, Col. Ejidal');

-- HU-13b: envío por unidad según la zona (Cajeme z1 $500, Navojoa z2 $1,200, Huatabampo z3 $2,000)
-- e IVA 16 % sobre renta + envío.
INSERT INTO cotizaciones (folio, cliente_id, origen, estado, notas, subtotal, envio, iva, total, creada_en) VALUES
('COT-0001', 1, 'Web', 'Pendiente', 'Entregar antes de las 8 a. m.', 7200, 1000, 1312, 9512, NOW() - INTERVAL '2 days'),
('COT-0002', 2, 'Web', 'Aprobada', NULL, 48500, 2400, 8144, 59044, NOW() - INTERVAL '1 day'),
('COT-0003', 3, 'Web', 'Pendiente', NULL, 8700, 6000, 2352, 17052, NOW() - INTERVAL '3 hours');

-- Fechas relativas al día en que se crea la base, para que la demo siempre tenga fechas futuras.
-- COT-0002 está Aprobada: la excavadora (2) y el minicargador (5) se ven ocupados en el calendario (HU-02a).
INSERT INTO cotizacion_equipos (cotizacion_id, equipo_id, cantidad, fecha_inicio, fecha_fin, dias, tarifa_dia, importe) VALUES
(1, 1, 2, CURRENT_DATE + 3, CURRENT_DATE + 5, 3, 1200, 7200),
(2, 2, 1, CURRENT_DATE + 7, CURRENT_DATE + 11, 5, 6800, 34000),
(2, 5, 1, CURRENT_DATE + 7, CURRENT_DATE + 11, 5, 2900, 14500),
(3, 4, 3, CURRENT_DATE + 4, CURRENT_DATE + 5, 2, 1450, 8700);
