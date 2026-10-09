-- Plan de cuentas de partida (PGC PYMES, selección para un taller). Editable desde Contabilidad.
INSERT INTO `cuentas` (`codigo`, `nombre`) VALUES
	('100', 'Capital social'),
	('113', 'Reservas voluntarias'),
	('120', 'Remanente'),
	('121', 'Resultados negativos de ejercicios anteriores'),
	('129', 'Resultado del ejercicio'),
	('170', 'Deudas a largo plazo con entidades de crédito'),
	('171', 'Deudas a largo plazo'),
	('206', 'Aplicaciones informáticas'),
	('213', 'Maquinaria'),
	('214', 'Utillaje'),
	('215', 'Otras instalaciones'),
	('216', 'Mobiliario'),
	('217', 'Equipos para procesos de información'),
	('218', 'Elementos de transporte'),
	('280', 'Amortización acumulada del inmovilizado intangible'),
	('281', 'Amortización acumulada del inmovilizado material'),
	('300', 'Mercaderías'),
	('400', 'Proveedores'),
	('410', 'Acreedores por prestaciones de servicios'),
	('430', 'Clientes'),
	('470', 'Hacienda Pública, deudora por diversos conceptos'),
	('472', 'Hacienda Pública, IVA soportado'),
	('475', 'Hacienda Pública, acreedora por conceptos fiscales'),
	('477', 'Hacienda Pública, IVA repercutido'),
	('520', 'Deudas a corto plazo con entidades de crédito'),
	('551', 'Cuenta corriente con socios y administradores'),
	('570', 'Caja, euros'),
	('572', 'Bancos e instituciones de crédito c/c vista, euros'),
	('600', 'Compras de mercaderías'),
	('602', 'Compras de otros aprovisionamientos'),
	('607', 'Trabajos realizados por otras empresas'),
	('621', 'Arrendamientos y cánones'),
	('622', 'Reparaciones y conservación'),
	('623', 'Servicios de profesionales independientes'),
	('624', 'Transportes'),
	('625', 'Primas de seguros'),
	('626', 'Servicios bancarios y similares'),
	('627', 'Publicidad, propaganda y relaciones públicas'),
	('628', 'Suministros'),
	('629', 'Otros servicios'),
	('631', 'Otros tributos'),
	('662', 'Intereses de deudas'),
	('669', 'Otros gastos financieros'),
	('678', 'Gastos excepcionales'),
	('680', 'Amortización del inmovilizado intangible'),
	('681', 'Amortización del inmovilizado material'),
	('700', 'Ventas de mercaderías'),
	('705', 'Prestaciones de servicios'),
	('752', 'Ingresos por arrendamientos'),
	('759', 'Ingresos por servicios diversos'),
	('769', 'Otros ingresos financieros'),
	('771', 'Beneficios procedentes del inmovilizado material'),
	('778', 'Ingresos excepcionales');
--> statement-breakpoint
UPDATE `categorias` SET `cuenta_contable` = '602', `iva_pct` = 21 WHERE `id` IN (1, 2);
--> statement-breakpoint
UPDATE `categorias` SET `cuenta_contable` = '629', `iva_pct` = 21 WHERE `id` = 3;
--> statement-breakpoint
UPDATE `categorias` SET `cuenta_contable` = '625', `iva_pct` = 0 WHERE `id` = 4;
--> statement-breakpoint
UPDATE `categorias` SET `cuenta_contable` = '631', `iva_pct` = 0 WHERE `id` = 5;
--> statement-breakpoint
UPDATE `categorias` SET `cuenta_contable` = '629', `iva_pct` = 21 WHERE `id` = 6;
--> statement-breakpoint
UPDATE `categorias` SET `cuenta_contable` = '628', `iva_pct` = 21 WHERE `id` = 7;
--> statement-breakpoint
UPDATE `categorias` SET `cuenta_contable` = '622', `iva_pct` = 21 WHERE `id` = 8;
--> statement-breakpoint
UPDATE `categorias` SET `cuenta_contable` = '600', `iva_pct` = 0 WHERE `id` = 9;
--> statement-breakpoint
UPDATE `categorias` SET `cuenta_contable` = '700', `iva_pct` = 0 WHERE `id` = 10;
--> statement-breakpoint
UPDATE `categorias` SET `cuenta_contable` = '705', `iva_pct` = 21 WHERE `id` = 11;
--> statement-breakpoint
UPDATE `categorias` SET `cuenta_contable` = '759', `iva_pct` = 0 WHERE `id` = 12;
--> statement-breakpoint
-- Los movimientos ya existentes heredan el IVA de su categoría
UPDATE `movimientos` SET `iva_pct` = COALESCE((SELECT `iva_pct` FROM `categorias` c WHERE c.`id` = `movimientos`.`categoria_id`), 21);
