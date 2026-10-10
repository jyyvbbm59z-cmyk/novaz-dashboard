// Revisiones por niveles (I1, I2…) y planes del fabricante listos para aplicar.

/** Ids de los planes elegidos más los que incluyen (recursivo: la I3 incluye la I2, que incluye la I1). */
export function expandirIncluidos(ids: number[], planes: { id: number; incluye: number[] }[]): number[] {
	const resultado = new Set<number>();
	const pila = [...ids];
	while (pila.length) {
		const id = pila.pop()!;
		if (resultado.has(id)) continue;
		resultado.add(id);
		for (const inc of planes.find((p) => p.id === id)?.incluye ?? []) pila.push(inc);
	}
	return [...resultado];
}

export interface NivelPlantilla {
	codigo: string;
	nombre: string;
	cadaKm: number | null;
	cadaMeses: number | null;
	cadaDias: number | null;
	avisoKm: number;
	avisoDias: number;
	tareas: string[];
	/** Códigos de otros niveles que quedan hechos con este. */
	incluye: string[];
	/** Palabras para heredar el historial de planes antiguos (aceite, cadena…). */
	heredaDe: string[];
	notas?: string;
}

export interface PlantillaRevisiones {
	id: string;
	nombre: string;
	descripcion: string;
	fuente: string;
	/** Para sugerirla según marca y modelo del vehículo. */
	sugerirSi: RegExp;
	/** Tipo de vehículo al que sirve (se compara con el nombre del tipo). */
	tipo: 'moto' | 'coche';
	niveles: NivelPlantilla[];
}

export const PLANTILLAS_REVISION: PlantillaRevisiones[] = [
	{
		id: 'suzuki-gsf600',
		nombre: 'Suzuki GSF600 Bandit (2000–2004)',
		descripcion:
			'Tabla de mantenimiento periódico del manual de servicio, agrupada en tus niveles I1–I5. Ningún intervalo es más largo que el del manual; donde se adelanta, se indica.',
		fuente: 'Manual de servicio Suzuki GSF600 (2000), «Periodic maintenance schedule» y procedimientos de cada elemento.',
		sugerirSi: /gsf\s*-?\s*600|bandit\s*600/i,
		tipo: 'moto',
		niveles: [
			{
				codigo: 'I1',
				nombre: 'Revisión rápida',
				cadaDias: 14,
				cadaMeses: null,
				cadaKm: 1000,
				avisoKm: 150,
				avisoDias: 3,
				tareas: [
					'Presión en frío: delantera 2,25 bar · trasera 2,50 bar',
					'Cadena: limpiar y engrasar (manual: cada 1.000 km)',
					'Cadena: tensión y holgura',
					'Nivel de aceite en el visor y fugas',
					'Nivel de líquido de frenos y pastillas a simple vista',
					'Luces, intermitentes y claxon',
					'Limpieza general'
				],
				incluye: [],
				heredaDe: ['cadena'],
				notas: 'Rutina del propietario. Del manual sale el engrase de cadena cada 1.000 km y la presión de neumáticos.'
			},
			{
				codigo: 'I2',
				nombre: 'Servicio',
				cadaDias: null,
				cadaMeses: 6,
				cadaKm: 6000,
				avisoKm: 500,
				avisoDias: 30,
				tareas: [
					'Cambiar aceite de motor (3,5 L con cambio de filtro)',
					'Cambiar filtro de aceite (el manual lo pide cada 18.000 km / 18 meses; aquí con cada aceite)',
					'Filtro de aire: inspeccionar y soplar por dentro',
					'Bujías: inspeccionar',
					'Ralentí y holgura del cable del acelerador',
					'Holgura del cable de embrague',
					'Frenos: pastillas y discos',
					'Latiguillos y líquido de frenos: inspeccionar',
					'Neumáticos: desgaste (mínimo delantera 1,6 mm · trasera 2,0 mm)',
					'Cadena, piñón y corona: desgaste',
					'Manguitos y filtro de gasolina: inspeccionar',
					'Apriete de la tornillería del chasis'
				],
				incluye: ['I1'],
				heredaDe: ['aceite'],
				notas: 'Manual: cada 6.000 km o 6 meses, lo que llegue antes.'
			},
			{
				codigo: 'I3',
				nombre: 'Revisión anual',
				cadaDias: null,
				cadaMeses: 12,
				cadaKm: 12000,
				avisoKm: 750,
				avisoDias: 30,
				tareas: [
					'Holgura de válvulas',
					'Cambiar bujías',
					'Cambiar filtro de gasolina',
					'Cambiar filtro de aire (el manual lo pide cada 18.000 km / 18 meses; aquí cada año)',
					'Sincronizar carburadores',
					'Sistema PAIR (aire secundario)',
					'Dirección: holgura y rodamientos',
					'Horquilla: retenes y fugas',
					'Suspensión trasera y bieletas',
					'Apriete del escape (colectores y silencioso)'
				],
				incluye: ['I2'],
				heredaDe: [],
				notas: 'Manual: cada 12.000 km o 12 meses. Incluye la I2 (y esta la I1).'
			},
			{
				codigo: 'I4',
				nombre: 'Cada 2 años',
				cadaDias: null,
				cadaMeses: 24,
				cadaKm: null,
				avisoKm: 0,
				avisoDias: 30,
				tareas: ['Cambiar líquido de frenos'],
				incluye: [],
				heredaDe: ['frenos'],
				notas: 'Manual: líquido de frenos cada 2 años.'
			},
			{
				codigo: 'I5',
				nombre: 'Cada 4 años',
				cadaDias: null,
				cadaMeses: 48,
				cadaKm: null,
				avisoKm: 0,
				avisoDias: 60,
				tareas: ['Cambiar latiguillos de freno', 'Cambiar manguitos de gasolina'],
				incluye: [],
				heredaDe: [],
				notas: 'Manual: latiguillos y manguitos de gasolina cada 4 años.'
			}
		]
	},
	{
		id: 'moto-niveles',
		nombre: 'Moto genérica por niveles',
		descripcion: 'Tu propuesta de niveles I1–I4, para motos sin plantilla propia. Ajusta tareas e intervalos a su manual.',
		fuente: 'Propuesta del taller (sin manual de referencia).',
		sugerirSi: /^$/,
		tipo: 'moto',
		niveles: [
			{ codigo: 'I1', nombre: 'Revisión rápida', cadaDias: 14, cadaMeses: null, cadaKm: 1000, avisoKm: 150, avisoDias: 3, tareas: ['Presión de neumáticos', 'Inspección visual', 'Limpieza', 'Cadena: limpiar, engrasar y tensar'], incluye: [], heredaDe: ['cadena'] },
			{ codigo: 'I2', nombre: 'Servicio', cadaDias: null, cadaMeses: 6, cadaKm: 6000, avisoKm: 500, avisoDias: 30, tareas: ['Cambiar aceite', 'Cambiar filtro de aceite'], incluye: ['I1'], heredaDe: ['aceite'] },
			{ codigo: 'I3', nombre: 'Revisión anual', cadaDias: null, cadaMeses: 12, cadaKm: 12000, avisoKm: 750, avisoDias: 30, tareas: ['Cambiar filtro de aire', 'Revisar carburación', 'Chequeo integral'], incluye: ['I2'], heredaDe: [] },
			{ codigo: 'I4', nombre: 'Cada 2 años', cadaDias: null, cadaMeses: 24, cadaKm: null, avisoKm: 0, avisoDias: 30, tareas: ['Cambiar filtro de combustible', 'Cambiar líquido de frenos'], incluye: [], heredaDe: ['frenos'] }
		]
	},
	{
		id: 'seat-ibiza-14tdi',
		nombre: 'SEAT Ibiza 1.4 TDI (6J/6P, 2015–2017)',
		descripcion:
			'Plan de servicio fijo de SEAT para el 1.4 TDI de 3 cilindros (EA288), agrupado en niveles C1–C6. Para un coche de uso particular con pocos km al año, manda casi siempre el tiempo.',
		fuente:
			'Plan de mantenimiento SEAT para el Ibiza (aceite, inspección y filtros) e intervalo de distribución del fabricante para el 1.4 TDI EA288 (210.000 km). Confírmalo con tu libro de mantenimiento o con el VIN en un concesionario.',
		sugerirSi: /ibiza.*1[.,]4\s*tdi|ibiza.*tdi/i,
		tipo: 'coche',
		niveles: [
			{
				codigo: 'C1',
				nombre: 'Comprobación mensual',
				cadaDias: null,
				cadaMeses: 1,
				cadaKm: null,
				avisoKm: 0,
				avisoDias: 5,
				tareas: [
					'Presión de neumáticos (ver etiqueta del marco de la puerta) y rueda de repuesto o kit',
					'Nivel de aceite (en frío, coche llano)',
					'Nivel de refrigerante y limpiaparabrisas',
					'Luces, intermitentes y luz de freno',
					'Testigos del cuadro al arrancar'
				],
				incluye: [],
				heredaDe: []
			},
			{
				codigo: 'C2',
				nombre: 'Aceite y filtro',
				cadaDias: null,
				cadaMeses: 12,
				cadaKm: 15000,
				avisoKm: 1000,
				avisoDias: 30,
				tareas: ['Cambiar aceite 5W-30 con norma VW 507.00 (obligatoria con filtro de partículas)', 'Cambiar filtro de aceite', 'Poner a cero el indicador de servicio'],
				incluye: ['C1'],
				heredaDe: ['aceite'],
				notas: 'Servicio fijo: 15.000 km o 1 año. El servicio flexible (LongLife) permite hasta 30.000 km o 2 años, pero solo con aceite LongLife y uso regular.'
			},
			{
				codigo: 'C3',
				nombre: 'Inspección',
				cadaDias: null,
				cadaMeses: 24,
				cadaKm: 30000,
				avisoKm: 1500,
				avisoDias: 30,
				tareas: [
					'Cambiar filtro de polen (habitáculo)',
					'Frenos: grosor de pastillas y discos, latiguillos',
					'Correa auxiliar: grietas y tensor',
					'Suspensión, rótulas y fuelles de transmisión',
					'Escape y filtro de partículas (sin avisos ni fugas)',
					'Batería y bornes',
					'Bajos: fugas de aceite, refrigerante o gasoil',
					'Escobillas del limpiaparabrisas'
				],
				incluye: ['C2'],
				heredaDe: ['revisión', 'inspección']
			},
			{
				codigo: 'C4',
				nombre: 'Líquido de frenos',
				cadaDias: null,
				cadaMeses: 24,
				cadaKm: null,
				avisoKm: 0,
				avisoDias: 30,
				tareas: ['Cambiar líquido de frenos DOT 4 y purgar'],
				incluye: [],
				heredaDe: ['frenos'],
				notas: 'SEAT pide el primer cambio a los 3 años y después cada 2.'
			},
			{
				codigo: 'C5',
				nombre: 'Filtros de aire y gasoil',
				cadaDias: null,
				cadaMeses: 48,
				cadaKm: 60000,
				avisoKm: 2000,
				avisoDias: 30,
				tareas: ['Cambiar filtro de aire', 'Cambiar filtro de gasoil y purgar (el plan de SEAT lo pide cada 90.000 km o 6 años; aquí se adelanta con el de aire)'],
				incluye: [],
				heredaDe: ['filtro de aire']
			},
			{
				codigo: 'C6',
				nombre: 'Distribución',
				cadaDias: null,
				cadaMeses: 120,
				cadaKm: 180000,
				avisoKm: 5000,
				avisoDias: 60,
				tareas: ['Cambiar correa de distribución con tensor y rodillos', 'Cambiar bomba de agua (la mueve la misma correa)', 'Cambiar correa auxiliar', 'Cambiar refrigerante G13'],
				incluye: [],
				heredaDe: ['distribución', 'correa'],
				notas:
					'El fabricante indica 210.000 km. Se adelanta a 180.000 km o 10 años porque tensores y rodillos dan guerra antes y la goma envejece aunque el coche ande poco. Si se rompe, el motor se daña.'
			}
		]
	},
	{
		id: 'seat-marbella',
		nombre: 'SEAT Marbella (903 cc, mecánica Fiat 127)',
		descripcion:
			'Plan para el motor 903 cc de válvulas en culata con varillas y cadena de distribución. Es un motor que pide cuidados frecuentes: el reglaje de válvulas es lo que más alarga su vida.',
		fuente:
			'Propuesta del taller basada en la mecánica Fiat 127/Panda y en las recomendaciones conocidas del modelo (reglaje de las 8 válvulas cada 10.000 km). Sin manual oficial: ajústala con el manual de taller si lo consigues.',
		sugerirSi: /marbella/i,
		tipo: 'coche',
		niveles: [
			{
				codigo: 'M1',
				nombre: 'Comprobación mensual',
				cadaDias: null,
				cadaMeses: 1,
				cadaKm: null,
				avisoKm: 0,
				avisoDias: 5,
				tareas: ['Presión de neumáticos', 'Nivel de aceite (este motor consume algo: vigílalo)', 'Nivel de refrigerante y líquido de frenos', 'Luces e intermitentes', 'Arrancarlo y dejarlo coger temperatura si lleva parado'],
				incluye: [],
				heredaDe: []
			},
			{
				codigo: 'M2',
				nombre: 'Aceite y filtro',
				cadaDias: null,
				cadaMeses: 12,
				cadaKm: 5000,
				avisoKm: 500,
				avisoDias: 30,
				tareas: ['Cambiar aceite 15W-40 (o 10W-40 semisintético)', 'Cambiar filtro de aceite'],
				incluye: ['M1'],
				heredaDe: ['aceite']
			},
			{
				codigo: 'M3',
				nombre: 'Puesta a punto',
				cadaDias: null,
				cadaMeses: 12,
				cadaKm: 10000,
				avisoKm: 750,
				avisoDias: 30,
				tareas: [
					'Reglaje de las 8 válvulas (en frío)',
					'Cambiar bujías',
					'Cambiar filtro de aire',
					'Tapa y rotor del delco: limpiar y revisar (la humedad lo para)',
					'Platinos y avance de encendido, si lleva encendido por contactos',
					'Carburador: ralentí y mezcla',
					'Correa del alternador: tensión y grietas',
					'Frenos: zapatas traseras y pastillas',
					'Bajos: óxido en pisos, largueros y pasos de rueda'
				],
				incluye: ['M2'],
				heredaDe: ['válvulas', 'puesta a punto', 'bujías']
			},
			{
				codigo: 'M4',
				nombre: 'Líquidos cada 2 años',
				cadaDias: null,
				cadaMeses: 24,
				cadaKm: null,
				avisoKm: 0,
				avisoDias: 30,
				tareas: ['Cambiar líquido de frenos DOT 4 y purgar', 'Cambiar refrigerante', 'Revisar manguitos y abrazaderas'],
				incluye: [],
				heredaDe: ['frenos', 'refrigerante']
			},
			{
				codigo: 'M5',
				nombre: 'Revisión mayor',
				cadaDias: null,
				cadaMeses: 48,
				cadaKm: 40000,
				avisoKm: 2000,
				avisoDias: 60,
				tareas: [
					'Cadena de distribución: ruido y tensión (cambiar si suena)',
					'Cambiar filtro de gasolina',
					'Cables de bujía',
					'Aceite de la caja de cambios',
					'Silentblocks y amortiguadores',
					'Compresión de cilindros'
				],
				incluye: ['M3'],
				heredaDe: ['cadena', 'distribución']
			}
		]
	}
];

export function plantillaSugerida(vehiculo: { marca: string | null; modelo: string | null; alias: string }) {
	const texto = `${vehiculo.marca ?? ''} ${vehiculo.modelo ?? ''} ${vehiculo.alias}`;
	return PLANTILLAS_REVISION.find((p) => p.sugerirSi.test(texto)) ?? null;
}

/** Plantillas que sirven para un tipo de vehículo («Moto», «Coche»…). Si el tipo no encaja con ninguna, todas. */
export function plantillasPara(nombreTipo: string | null | undefined) {
	const t = (nombreTipo ?? '').toLocaleLowerCase('es');
	const propias = PLANTILLAS_REVISION.filter((p) => t.includes(p.tipo));
	return propias.length ? propias : PLANTILLAS_REVISION;
}

/** Texto de periodicidad: «cada 2 semanas o 1.000 km». */
export function textoPeriodicidad(p: { cadaDias?: number | null; cadaMeses: number | null; cadaKm: number | null }) {
	const t: string[] = [];
	if (p.cadaDias) t.push(p.cadaDias % 7 === 0 ? `${p.cadaDias / 7 === 1 ? 'cada semana' : `cada ${p.cadaDias / 7} semanas`}` : `cada ${p.cadaDias} días`);
	else if (p.cadaMeses) t.push(p.cadaMeses % 12 === 0 && p.cadaMeses >= 12 ? (p.cadaMeses === 12 ? 'cada año' : `cada ${p.cadaMeses / 12} años`) : p.cadaMeses === 1 ? 'cada mes' : `cada ${p.cadaMeses} meses`);
	if (p.cadaKm) t.push(`${t.length ? '' : 'cada '}${p.cadaKm.toLocaleString('es-ES')} km`);
	return t.join(' o ');
}
