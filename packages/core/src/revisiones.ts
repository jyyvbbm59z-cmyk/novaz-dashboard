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
		fuente: 'Manual de servicio Suzuki GSF600/GSF600S 99500-36102-01E (3.ª ed., 2001): tabla de mantenimiento periódico (p. 2-2) y procedimientos de cada elemento (p. 2-4 a 2-25).',
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
					'Cambiar aceite de motor: 10W-40 API SF/SG, 3,3 L (3,5 L si toca filtro)',
					'Filtro de aire: inspeccionar y soplar por dentro',
					'Bujías: inspeccionar',
					'Ralentí y holgura del cable del acelerador',
					'Holgura del cable de embrague',
					'Frenos: pastillas y discos',
					'Latiguillos y líquido de frenos: inspeccionar',
					'Neumáticos: desgaste (mínimo delantera 1,6 mm · trasera 2,0 mm)',
					'Cadena, piñón y corona: desgaste',
					'Manguitos y filtro de gasolina: inspeccionar',
					'Apriete de la tornillería del chasis',
					'Engrasar puntos de lubricación: manetas, pedales, reposapiés y caballetes (p. 2-3)'
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
					'Filtro de aire: inspeccionar y soplar por dentro',
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
			},
			{
				codigo: 'F1',
				nombre: 'Filtro de aceite',
				cadaDias: null,
				cadaMeses: 18,
				cadaKm: 18000,
				avisoKm: 1000,
				avisoDias: 30,
				tareas: ['Cambiar filtro de aceite original Suzuki de moto: junta untada, contacto + 2 vueltas con la llave 09915-40610'],
				incluye: [],
				heredaDe: ['aceite'],
				notas: 'Manual: cada 18.000 km o 18 meses, junto con el cambio de aceite (p. 2-9).'
			},
			{
				codigo: 'F2',
				nombre: 'Filtro de aire',
				cadaDias: null,
				cadaMeses: 18,
				cadaKm: 18000,
				avisoKm: 1000,
				avisoDias: 30,
				tareas: ['Cambiar el filtro de aire (marca «*» hacia arriba) y vaciar el tubo de drenaje'],
				incluye: [],
				heredaDe: [],
				notas: 'Manual: cada 18.000 km o 18 meses; se revisa en cada servicio (p. 2-7).'
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
		nombre: 'SEAT Marbella 0.9i SPI (899 cc, 08 NCB)',
		descripcion:
			'Plan para el Marbella de inyección monopunto con catalizador: taqués hidráulicos (no se reglan) y encendido estático sin delco. Para un clásico de pocos km manda casi siempre el tiempo.',
		fuente:
			'Propuesta del taller con los datos del manual del Marbella (Bucheli) y del motor 899 de Fiat; no hay plan oficial publicado. En el 903 de carburación hay que añadir el reglaje de válvulas (ADM 0,15 / ESC 0,20 mm en frío) y la revisión del delco.',
		sugerirSi: /marbella/i,
		tipo: 'coche',
		niveles: [
			{
				codigo: 'M1',
				nombre: 'Comprobación mensual',
				cadaDias: null,
				cadaMeses: 1,
				cadaKm: 1000,
				avisoKm: 0,
				avisoDias: 5,
				tareas: ['Presión de neumáticos: 2,0 bar delante y detrás, en frío', 'Nivel de aceite (vigila el consumo)', 'Nivel de refrigerante y de líquido de frenos', 'Luces e intermitentes', 'Si lleva parado, arrancarlo y dejar que coja temperatura'],
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
				tareas: ['Cambiar aceite: 15W-40 o 10W-40 API SG o superior, 3,6 L con filtro', 'Cambiar filtro de aceite (Mann W 714/2)', 'Neumáticos: desgaste, grietas y edad (cambiarlos a los 6-8 años aunque tengan dibujo)'],
				incluye: ['M1'],
				heredaDe: ['aceite'],
				notas: 'Los taqués hidráulicos son sensibles al aceite viejo.'
			},
			{
				codigo: 'M3',
				nombre: 'Revisión anual',
				cadaDias: null,
				cadaMeses: 12,
				cadaKm: 10000,
				avisoKm: 750,
				avisoDias: 30,
				tareas: [
					'Frenos contra los límites: pastillas y zapatas 1,5 mm de forro, disco 9 mm, tambor Ø 186,3 mm',
					'Suspensión y ballestas: silentblocks, gemelas, abarcones y amortiguadores',
					'Dirección y rótulas: holguras, fuelles de la cremallera y guardapolvos',
					'Inyección: testigo, CO al ralentí (< 0,5 %) y lambda; el ralentí no se regula (lo controla la centralita)',
					'Taqués hidráulicos: escuchar si golpetean en frío (no se reglan)',
					'Batería y masas: limpiar los bornes y las masas al chasis y al motor',
					'Engrasar bisagras y cerraduras',
					'Bajos: óxido en pisos, largueros y pasos de rueda'
				],
				incluye: ['M2'],
				heredaDe: [],
				notas: 'El 899 SPI lleva taqués hidráulicos y encendido sin delco: no hay reglaje de válvulas ni platinos.'
			},
			{
				codigo: 'M4',
				nombre: 'Cada 2 años',
				cadaDias: null,
				cadaMeses: 24,
				cadaKm: 15000,
				avisoKm: 1000,
				avisoDias: 30,
				tareas: [
					'Cambiar filtro de aire',
					'Cambiar bujías: Champion RN9YCC (o Bosch WR7D), separación 0,8 mm',
					'Correa del alternador y bomba de agua: tensión y grietas',
					'Cambiar líquido de frenos DOT 4 (0,37 L) y purgar',
					'Cambiar refrigerante: 5,2 L al 50 % de anticongelante; comprobar termostato y electroventilador',
					'Aceite de la caja: nivel hasta el borde del tapón',
					'Revisar manguitos y abrazaderas'
				],
				incluye: ['M3'],
				heredaDe: ['frenos', 'refrigerante', 'bujías']
			},
			{
				codigo: 'M5',
				nombre: 'Cada 4 años',
				cadaDias: null,
				cadaMeses: 48,
				cadaKm: 30000,
				avisoKm: 2000,
				avisoDias: 60,
				tareas: ['Cambiar filtro de gasolina y revisar sus manguitos (va a presión)', 'Cambiar los latiguillos de freno (los dos a la vez)', 'Cambiar la correa del alternador', 'Cambiar aceite de la caja de 5: 2,95 L de SAE 80W-90 GL-4', 'Cables de bujía y bobinas'],
				incluye: ['M4'],
				heredaDe: []
			},
			{
				codigo: 'M6',
				nombre: 'Revisión mayor',
				cadaDias: null,
				cadaMeses: null,
				cadaKm: 60000,
				avisoKm: 3000,
				avisoDias: 60,
				tareas: ['Cadena de distribución: escuchar si golpea en frío (no hay intervalo de cambio publicado)', 'Sonda lambda y catalizador: CO y lambda antes de la ITV', 'Compresión de cilindros', 'Soportes del motor y silentblocks'],
				incluye: [],
				heredaDe: ['cadena', 'distribución'],
				notas: 'Sin intervalo oficial: propuesta del taller.'
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
