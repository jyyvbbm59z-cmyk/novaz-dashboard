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
		niveles: [
			{ codigo: 'I1', nombre: 'Revisión rápida', cadaDias: 14, cadaMeses: null, cadaKm: 1000, avisoKm: 150, avisoDias: 3, tareas: ['Presión de neumáticos', 'Inspección visual', 'Limpieza', 'Cadena: limpiar, engrasar y tensar'], incluye: [], heredaDe: ['cadena'] },
			{ codigo: 'I2', nombre: 'Servicio', cadaDias: null, cadaMeses: 6, cadaKm: 6000, avisoKm: 500, avisoDias: 30, tareas: ['Cambiar aceite', 'Cambiar filtro de aceite'], incluye: ['I1'], heredaDe: ['aceite'] },
			{ codigo: 'I3', nombre: 'Revisión anual', cadaDias: null, cadaMeses: 12, cadaKm: 12000, avisoKm: 750, avisoDias: 30, tareas: ['Cambiar filtro de aire', 'Revisar carburación', 'Chequeo integral'], incluye: ['I2'], heredaDe: [] },
			{ codigo: 'I4', nombre: 'Cada 2 años', cadaDias: null, cadaMeses: 24, cadaKm: null, avisoKm: 0, avisoDias: 30, tareas: ['Cambiar filtro de combustible', 'Cambiar líquido de frenos'], incluye: [], heredaDe: ['frenos'] }
		]
	}
];

export function plantillaSugerida(vehiculo: { marca: string | null; modelo: string | null; alias: string }) {
	const texto = `${vehiculo.marca ?? ''} ${vehiculo.modelo ?? ''} ${vehiculo.alias}`;
	return PLANTILLAS_REVISION.find((p) => p.sugerirSi.test(texto)) ?? null;
}

/** Texto de periodicidad: «cada 2 semanas o 1.000 km». */
export function textoPeriodicidad(p: { cadaDias?: number | null; cadaMeses: number | null; cadaKm: number | null }) {
	const t: string[] = [];
	if (p.cadaDias) t.push(p.cadaDias % 7 === 0 ? `${p.cadaDias / 7 === 1 ? 'cada semana' : `cada ${p.cadaDias / 7} semanas`}` : `cada ${p.cadaDias} días`);
	else if (p.cadaMeses) t.push(p.cadaMeses % 12 === 0 && p.cadaMeses >= 12 ? (p.cadaMeses === 12 ? 'cada año' : `cada ${p.cadaMeses / 12} años`) : `cada ${p.cadaMeses} meses`);
	if (p.cadaKm) t.push(`${t.length ? '' : 'cada '}${p.cadaKm.toLocaleString('es-ES')} km`);
	return t.join(' o ');
}
