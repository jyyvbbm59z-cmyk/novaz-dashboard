-- Subcuentas de liquidación de IVA (las usan los asientos automáticos de cada trimestre)
INSERT OR IGNORE INTO `cuentas` (`codigo`, `nombre`) VALUES
	('4700', 'Hacienda Pública, deudora por IVA'),
	('4750', 'Hacienda Pública, acreedora por IVA');
