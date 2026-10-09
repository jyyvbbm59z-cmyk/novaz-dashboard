-- Configuración de partida. Todo es editable desde Ajustes.

INSERT INTO `categorias` (`id`, `nombre`, `tipo`, `color`, `orden`) VALUES
	(1, 'Recambios', 'gasto', '#f2a33a', 1),
	(2, 'Consumibles', 'gasto', '#d9822b', 2),
	(3, 'Herramienta', 'gasto', '#8a8f98', 3),
	(4, 'Seguros', 'gasto', '#4f8cff', 4),
	(5, 'Impuestos y tasas', 'gasto', '#9b6dff', 5),
	(6, 'ITV', 'gasto', '#2fb8a6', 6),
	(7, 'Combustible', 'gasto', '#e5534b', 7),
	(8, 'Servicios externos', 'gasto', '#c76b98', 8),
	(9, 'Compra de vehículo', 'gasto', '#6b7280', 9),
	(10, 'Venta de vehículo', 'ingreso', '#3fb950', 10),
	(11, 'Trabajos a terceros', 'ingreso', '#56d364', 11),
	(12, 'YouTube', 'ingreso', '#ff4b4b', 12);
--> statement-breakpoint
INSERT INTO `tipos_vehiculo` (`id`, `nombre`, `icono`, `orden`, `campos`) VALUES
	(1, 'Coche', 'car-front', 1, '[{"clave":"combustible","etiqueta":"Combustible","tipo":"lista","opciones":["Gasolina","Diésel","Híbrido","Eléctrico","GLP"]},{"clave":"potencia","etiqueta":"Potencia","tipo":"numero","unidad":"CV"},{"clave":"neumaticos","etiqueta":"Medida neumáticos","tipo":"texto"},{"clave":"aceite","etiqueta":"Aceite motor","tipo":"texto"}]'),
	(2, 'Moto', 'motorbike', 2, '[{"clave":"cilindrada","etiqueta":"Cilindrada","tipo":"numero","unidad":"cc"},{"clave":"potencia","etiqueta":"Potencia","tipo":"numero","unidad":"CV"},{"clave":"neumaticos","etiqueta":"Medida neumáticos","tipo":"texto"},{"clave":"aceite","etiqueta":"Aceite motor","tipo":"texto"},{"clave":"limitada_a2","etiqueta":"Limitada A2","tipo":"booleano"}]'),
	(3, 'Furgoneta', 'truck', 3, '[{"clave":"combustible","etiqueta":"Combustible","tipo":"lista","opciones":["Gasolina","Diésel","Eléctrico"]},{"clave":"mma","etiqueta":"MMA","tipo":"numero","unidad":"kg"}]'),
	(4, 'Otro', 'cog', 9, '[]');
--> statement-breakpoint
INSERT INTO `estados` (`id`, `nombre`, `color`, `final`, `orden`) VALUES
	(1, 'En uso', '#3fb950', 0, 1),
	(2, 'En restauración', '#f2a33a', 0, 2),
	(3, 'Parado', '#8a8f98', 0, 3),
	(4, 'En taller', '#4f8cff', 0, 4),
	(5, 'A la venta', '#9b6dff', 0, 5),
	(6, 'Vendido', '#6b7280', 1, 6),
	(7, 'Entregado', '#6b7280', 1, 7);
--> statement-breakpoint
INSERT INTO `tipos_vencimiento` (`id`, `nombre`, `icono`, `meses_validez`, `avisos_dias`, `tipos_vehiculo_ids`, `categoria_id`, `orden`) VALUES
	(1, 'ITV', 'clipboard-check', 24, '[30,7,1]', '[]', 6, 1),
	(2, 'Seguro', 'shield-check', 12, '[30,7,1]', '[]', 4, 2),
	(3, 'Impuesto de circulación', 'landmark', 12, '[30,7]', '[]', 5, 3);
--> statement-breakpoint
INSERT INTO `planes_mantenimiento` (`id`, `nombre`, `cada_km`, `cada_meses`, `tipo_vehiculo_id`, `aviso_km`, `aviso_dias`) VALUES
	(1, 'Aceite y filtro', 10000, 12, 1, 750, 30),
	(2, 'Aceite y filtro', 6000, 12, 2, 500, 30),
	(3, 'Engrase de cadena', 800, NULL, 2, 150, 7),
	(4, 'Líquido de frenos', NULL, 24, NULL, 0, 30);
--> statement-breakpoint
INSERT INTO `plantillas_fases` (`id`, `nombre`, `fases`) VALUES
	(1, 'Restauración completa', '[{"nombre":"Valoración y compra","tareas":["Inspección inicial","Fotos del estado original","Lista de piezas que faltan"]},{"nombre":"Desmontaje","tareas":["Desmontar y etiquetar","Inventario de tornillería","Fotos de referencia"]},{"nombre":"Chasis y chapa","tareas":["Decapado","Reparación de óxido","Imprimación"]},{"nombre":"Pintura","tareas":["Preparación","Aparejo","Color","Barniz y pulido"]},{"nombre":"Mecánica","tareas":["Motor","Transmisión","Frenos","Suspensión"]},{"nombre":"Electricidad","tareas":["Revisar instalación","Luces","Encendido"]},{"nombre":"Montaje","tareas":["Montaje final","Ajustes","Prueba"]},{"nombre":"Papeles","tareas":["ITV","Seguro","Cambio de nombre"]}]'),
	(2, 'Puesta a punto', '[{"nombre":"Diagnóstico","tareas":["Revisión general","Lista de fallos"]},{"nombre":"Mantenimiento","tareas":["Aceite y filtros","Frenos","Neumáticos","Batería"]},{"nombre":"Prueba","tareas":["Prueba en carretera"]}]');
