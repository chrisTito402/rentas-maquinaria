-- BASE · Datos de ejemplo: 6 equipos y 3 cotizaciones (para probar el panel desde el día 1).
-- Las fotos son de muestra; las reales llegan con HU-01b (Sprint 2).

INSERT INTO equipos (nombre, tipo, modelo, caracteristicas, tarifa_dia, foto) VALUES
('Montacargas Toyota 8FG25', 'Montacargas', '8FG25', 'Capacidad de carga 2.5 t · Gas LP · Elevación máxima 4.80 m', 1200, 'https://placehold.co/480x300/D8F0E4/2F6A4F?text=Montacargas'),
('Retroexcavadora CAT 416F', 'Retroexcavadora', '416F', 'Motor de 74 hp · Profundidad de excavación 4.3 m', 3500, 'https://placehold.co/480x300/FDEBC8/8A6A2A?text=Retroexcavadora'),
('Plataforma de tijera Genie GS-1930', 'Plataforma', 'GS-1930', 'Altura de trabajo 7.8 m · Eléctrica · Carga 227 kg', 900, 'https://placehold.co/480x300/CFE3F7/35557A?text=Plataforma'),
('Compresor Atlas Copco XAS 185', 'Compresor', 'XAS 185', '185 CFM · Diésel · Remolcable', 800, 'https://placehold.co/480x300/E5DDF5/5A4690?text=Compresor'),
('Generador Cummins C60', 'Generador', 'C60 D6', '60 kVA · Diésel · Cabina insonorizada', 1500, 'https://placehold.co/480x300/FBE3D3/8A5330?text=Generador'),
('Minicargador Bobcat S510', 'Minicargador', 'S510', 'Carga operativa 862 kg · Motor de 49 hp', 2200, 'https://placehold.co/480x300/D6EFD8/3E6B45?text=Minicargador');

INSERT INTO clientes (nombre, telefono, correo, empresa, municipio, direccion) VALUES
('Ana Valenzuela Ochoa', '6441234567', 'ana@vallegrupo.com', 'Constructora Valle del Yaqui', 'Cajeme', 'Calle 5 de Febrero 120, Col. Centro'),
('María López Ruiz', '6429876543', 'maria.lopez@correo.com', NULL, 'Navojoa', 'Av. Obregón 45, Col. Juárez'),
('Jorge Ramírez Soto', '6471112233', 'jorge@agricolamayo.mx', 'Agrícola del Mayo', 'Huatabampo', 'Carretera a Yavaros km 3, Col. Ejidal');

INSERT INTO cotizaciones (folio, cliente_id, origen, estado, notas, subtotal, iva, total, creada_en) VALUES
('COT-0001', 1, 'Web', 'Pendiente', 'Entregar antes de las 8 a. m.', 7200, 1152, 8352, NOW() - INTERVAL '2 days'),
('COT-0002', 2, 'Web', 'Aprobada', NULL, 25000, 4000, 29000, NOW() - INTERVAL '1 day'),
('COT-0003', 3, 'Web', 'Pendiente', NULL, 4800, 768, 5568, NOW() - INTERVAL '3 hours');

INSERT INTO cotizacion_equipos (cotizacion_id, equipo_id, cantidad, fecha_inicio, fecha_fin, dias, tarifa_dia, importe) VALUES
(1, 1, 2, '2026-11-10', '2026-11-12', 3, 1200, 7200),
(2, 2, 1, '2026-11-16', '2026-11-20', 5, 3500, 17500),
(2, 5, 1, '2026-11-16', '2026-11-20', 5, 1500, 7500),
(3, 4, 3, '2026-11-12', '2026-11-13', 2, 800, 4800);
