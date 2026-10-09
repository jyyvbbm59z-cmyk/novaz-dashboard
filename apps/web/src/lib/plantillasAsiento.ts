// Operaciones típicas como plantillas de asiento manual.
export interface PlantillaAsiento {
	clave: string;
	titulo: string;
	descripcion: string;
	concepto: string;
	apuntes: { cuenta: string; debe: number; haber: number }[];
}

export function plantillas(o: { ivaPendiente: number; debeSocio: number }): PlantillaAsiento[] {
	return [
		{
			clave: 'capital',
			titulo: 'Aportar capital',
			descripcion: 'Metes dinero en la empresa (constitución o ampliación).',
			concepto: 'Aportación de capital',
			apuntes: [
				{ cuenta: '572', debe: 300000, haber: 0 },
				{ cuenta: '100', debe: 0, haber: 300000 }
			]
		},
		{
			clave: 'iva',
			titulo: 'Pagar IVA a Hacienda',
			descripcion: 'Ingreso del resultado del modelo 303.',
			concepto: 'Pago IVA (modelo 303)',
			apuntes: [
				{ cuenta: '4750', debe: Math.max(o.ivaPendiente, 0), haber: 0 },
				{ cuenta: '572', debe: 0, haber: Math.max(o.ivaPendiente, 0) }
			]
		},
		{
			clave: 'socio',
			titulo: 'Devolverte dinero',
			descripcion: 'La empresa te reembolsa lo que pagaste de tu bolsillo.',
			concepto: 'Reembolso al socio',
			apuntes: [
				{ cuenta: '551', debe: Math.max(o.debeSocio, 0), haber: 0 },
				{ cuenta: '572', debe: 0, haber: Math.max(o.debeSocio, 0) }
			]
		},
		{
			clave: 'prestamo',
			titulo: 'Préstamo recibido',
			descripcion: 'Un banco (o tú) presta dinero a la empresa.',
			concepto: 'Préstamo recibido',
			apuntes: [
				{ cuenta: '572', debe: 0, haber: 0 },
				{ cuenta: '170', debe: 0, haber: 0 }
			]
		}
	];
}
