-- Categorías y cuentas para el asistente de registro (facturas, tasas, socio…)
INSERT OR IGNORE INTO `cuentas` (`codigo`, `nombre`) VALUES
	('118', 'Aportaciones de socios o propietarios');
--> statement-breakpoint
INSERT INTO `categorias` (`nombre`, `tipo`, `color`, `cuenta_contable`, `iva_pct`, `orden`) VALUES
	('Suministros (luz, agua, gas)', 'gasto', '#e0b03a', '628', 21, 13),
	('Teléfono e internet', 'gasto', '#5aa9e6', '629', 21, 14),
	('Alquiler', 'gasto', '#a07cf0', '621', 21, 15),
	('Tributos locales (IBI, tasas)', 'gasto', '#b46bd6', '631', 0, 16),
	('Gestoría y profesionales', 'gasto', '#7f8fa6', '623', 21, 17),
	('Publicidad', 'gasto', '#ff7a59', '627', 21, 18),
	('Comisiones bancarias', 'gasto', '#8d99ae', '626', 0, 19),
	('Transporte y envíos', 'gasto', '#4fb3a9', '624', 21, 20),
	('Venta de piezas', 'ingreso', '#2fbf71', '700', 21, 21),
	('Otros ingresos', 'ingreso', '#76c893', '759', 21, 22);
