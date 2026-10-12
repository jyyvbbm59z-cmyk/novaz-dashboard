// Mejoras (tuning, accesorios…): qué dice la normativa y cómo cambian el mantenimiento futuro.

export interface RevisionMejora {
	nombre: string;
	cadaKm: number | null;
	cadaMeses: number | null;
	tareas: string[];
}

interface Componente {
	clave: string;
	nombre: string;
	patron: RegExp;
	/** Revisiones periódicas que conviene añadir al vehículo cuando se monta. */
	revisiones: RevisionMejora[];
	/** Cosas que hacer una vez después de montarlo. */
	tareas: string[];
	/** Aviso sobre homologación / reforma (ITV). */
	legal?: string;
}

const COMPONENTES: Componente[] = [
	{
		clave: 'neumaticos',
		nombre: 'Ruedas y neumáticos',
		patron: /neum[aá]tic|rueda|llanta|cubierta/i,
		revisiones: [
			{ nombre: 'Neumáticos: rotación y desgaste', cadaKm: 10000, cadaMeses: 12, tareas: ['Rotar ruedas (delante ↔ detrás)', 'Medir el dibujo (mínimo legal 1,6 mm; cambiar a 3 mm)', 'Revisar presiones y desgaste irregular'] },
			{ nombre: 'Neumáticos: cambio por edad', cadaKm: null, cadaMeses: 60, tareas: ['Cambiar neumáticos (5 años desde la fecha DOT aunque tengan dibujo)'] }
		],
		tareas: ['Alinear la dirección', 'Reapretar los tornillos de rueda a los 50–100 km', 'Ajustar las presiones a la nueva medida']
	},
	{
		clave: 'suspension',
		nombre: 'Suspensión',
		patron: /amortiguador|suspensi[oó]n|coilover|roscad|muelle|resorte/i,
		revisiones: [{ nombre: 'Suspensión: revisión', cadaKm: 20000, cadaMeses: 24, tareas: ['Amortiguadores: fugas de aceite y rebote', 'Silentblocks, copelas y rótulas', 'Altura y reglajes'] }],
		tareas: ['Alinear la dirección', 'Revisar alturas y reapretar a los 500 km'],
		legal:
			'Solo amortiguadores, con los mismos anclajes y sin cambiar la altura: no es reforma. Muelles más cortos o roscados que bajan el coche: es una reforma (homologación del fabricante e ITV de reforma) y hay que avisar al seguro.'
	},
	{
		clave: 'frenos',
		nombre: 'Frenos',
		patron: /pastilla|disco|freno|pinza|latiguillo/i,
		revisiones: [{ nombre: 'Frenos: revisión', cadaKm: 10000, cadaMeses: 12, tareas: ['Grosor de pastillas y discos', 'Líquido de frenos: nivel y color'] }],
		tareas: ['Asentar pastillas y discos (primeros 300 km sin frenadas fuertes)'],
		legal: 'Pastillas y discos equivalentes a los de serie: no es reforma. Pinzas o discos de otra medida: sí lo es.'
	},
	{
		clave: 'escape',
		nombre: 'Escape',
		patron: /escape|silencioso|colector|downpipe/i,
		revisiones: [],
		tareas: ['Revisar fugas y anclajes a los 200 km'],
		legal: 'Debe estar homologado (marcado E) y no superar el ruido que pone la ficha técnica; si no, es reforma.'
	},
	{
		clave: 'luces',
		nombre: 'Luces',
		patron: /\bled\b|x[eé]non|faro|luces|bombilla/i,
		revisiones: [],
		tareas: ['Ajustar el reglaje de los faros'],
		legal: 'Las bombillas LED o xenón sin homologación para tu faro no pasan la ITV. Busca el marcado E para ese faro.'
	},
	{
		clave: 'admision',
		nombre: 'Admisión',
		patron: /admisi[oó]n|filtro (de aire )?deportivo|k&n|\bkn\b/i,
		revisiones: [{ nombre: 'Filtro de aire deportivo: limpieza', cadaKm: 15000, cadaMeses: 12, tareas: ['Limpiar y aceitar el filtro'] }],
		tareas: []
	},
	{
		clave: 'potencia',
		nombre: 'Potencia',
		patron: /reprogram|centralita|\bchip\b|stage ?\d/i,
		revisiones: [],
		tareas: [],
		legal: 'Cambiar la potencia es una reforma: necesita ITV de reforma y hay que comunicarlo al seguro.'
	},
	{
		clave: 'bateria',
		nombre: 'Batería',
		patron: /bater[ií]a/i,
		revisiones: [{ nombre: 'Batería: comprobación', cadaKm: null, cadaMeses: 12, tareas: ['Tensión en reposo (12,4 V o más)', 'Bornes limpios y apretados'] }],
		tareas: []
	}
];

const MEDIDA = /(\d{3})\s*\/\s*(\d{2})\s*Z?R?\s*(\d{2})/gi;
const medidas = (t: string) => [...t.matchAll(MEDIDA)].map((m) => `${m[1]}/${m[2]} R${m[3]}`);

export interface AnalisisMejora {
	componentes: string[];
	revisiones: RevisionMejora[];
	tareas: string[];
	avisos: string[];
	/** Medida de neumático nueva para la ficha del vehículo (si se deduce). */
	medidaNeumatico: string | null;
}

/**
 * Qué implica una mejora: componentes que toca, avisos legales (cruzando con la ficha técnica), revisiones
 * periódicas nuevas y tareas de después de montarla.
 */
export function analizarMejora(texto: string, vehiculo: { notas: string | null; campos: Record<string, unknown> }): AnalisisMejora {
	const comps = COMPONENTES.filter((c) => c.patron.test(texto));
	const avisos = comps.flatMap((c) => (c.legal ? [c.legal] : []));
	let medidaNeumatico: string | null = null;

	if (comps.some((c) => c.clave === 'neumaticos')) {
		const ficha = medidas(`${vehiculo.notas ?? ''} ${String(vehiculo.campos.neumaticos ?? '')}`);
		const pedida = medidas(texto)[0] ?? null;
		const llanta = texto.match(/\b(1[2-9]|2[0-2])\s*(["”]|pulgadas|\b)/)?.[1] ?? pedida?.slice(-2) ?? null;
		if (pedida) {
			medidaNeumatico = pedida;
			avisos.unshift(
				ficha.includes(pedida)
					? `La medida ${pedida} figura en tu ficha técnica: no necesita reforma.`
					: `La medida ${pedida} no figura en tu ficha técnica${ficha.length ? ` (${[...new Set(ficha)].join(', ')})` : ''}: tiene que ser equivalente (±3 % de diámetro, mismo índice de carga y velocidad o superior) o hacer una reforma.`
			);
		} else if (llanta) {
			const enFicha = [...new Set(ficha.filter((m) => m.endsWith(`R${llanta}`)))];
			if (enFicha.length) {
				medidaNeumatico = enFicha[0];
				avisos.unshift(`Para llanta de ${llanta}" tu ficha técnica tiene homologada ${enFicha.join(' o ')}: con esa medida no necesitas reforma.`);
			} else avisos.unshift(`Tu ficha técnica no recoge ninguna medida de ${llanta}": comprueba la equivalencia o tendrás que hacer una reforma.`);
		}
	}

	return {
		componentes: comps.map((c) => c.nombre),
		revisiones: comps.flatMap((c) => c.revisiones),
		tareas: [...new Set(comps.flatMap((c) => c.tareas))],
		avisos,
		medidaNeumatico
	};
}

/** Planes del vehículo que quedan hechos con la mejora (los dedicados a ese componente: «Neumáticos», «Frenos»…). */
export function planesCubiertos(texto: string, planes: { id: number; nombre: string }[]): number[] {
	const comps = COMPONENTES.filter((c) => c.patron.test(texto));
	return planes.filter((p) => comps.some((c) => c.patron.test(p.nombre))).map((p) => p.id);
}

/**
 * Orden de lo pendiente de un vehículo: primero lo que hay que arreglar (por prioridad), luego lo que quedó por
 * hacer tras una mejora y al final las mejoras planificadas (son deseos, no urgencias).
 */
export function ordenPendientes<P extends { tipo: string; prioridad: string; detalle: string | null; fechaDetectado: string }>(a: P, b: P) {
	const grupo = (p: P) => (p.tipo === 'mejora' ? 2 : p.detalle?.startsWith('Después de la mejora') ? 1 : 0);
	const PRIORIDAD: Record<string, number> = { alta: 0, media: 1, baja: 2 };
	return grupo(a) - grupo(b) || (PRIORIDAD[a.prioridad] ?? 1) - (PRIORIDAD[b.prioridad] ?? 1) || a.fechaDetectado.localeCompare(b.fechaDetectado);
}
