// Ajustes globales (tabla `ajustes`, clave → JSON). Los valores ausentes toman el defecto.
import type { MunicipioCombustible, PreciosCombustible } from './combustible';

export const EVENTOS_MOMENTO = ['tareaHecha', 'faseCompletada', 'restauracionTerminada', 'vencimientoRenovado', 'entradaCreada', 'cajaCuadrada'] as const;
export type EventoMomento = (typeof EVENTOS_MOMENTO)[number];

export const EFECTOS = ['ninguno', 'pulso', 'confeti', 'fuegos'] as const;
export type Efecto = (typeof EFECTOS)[number];

export const SONIDOS = ['ninguno', 'clic', 'campana', 'llave', 'aplausos', 'personalizado'] as const;
export type Sonido = (typeof SONIDOS)[number];

export interface Momento {
	efecto: Efecto;
	sonido: Sonido;
	/** URL de un audio subido cuando sonido = 'personalizado'. */
	sonidoUrl?: string;
}

export const ETIQUETAS_EVENTO: Record<EventoMomento, string> = {
	tareaHecha: 'Tarea completada',
	faseCompletada: 'Fase completada',
	restauracionTerminada: 'Restauración terminada',
	vencimientoRenovado: 'Vencimiento renovado',
	entradaCreada: 'Entrada registrada',
	cajaCuadrada: 'Caja cuadrada con el banco'
};

export interface Ajustes {
	nombreTaller: string;
	lema: string;
	acento: string;
	tema: 'oscuro' | 'claro' | 'sistema';
	zonaHoraria: string;
	urgenteDias: number;
	telegramChatId: string | null;
	/** Cada mañana, un parte con todo lo pendiente (si no, solo avisos al cruzar un umbral). */
	parteDiario: boolean;
	resumenSemanal: boolean;
	momentosActivos: boolean;
	momentos: Record<EventoMomento, Momento>;
	/** De dónde sale el dinero por defecto al registrar un gasto. */
	pagoPorDefecto: 'banco' | 'caja' | 'socio';
	/** Tipo del impuesto de sociedades para la estimación (%). */
	tipoImpuestoSociedades: number;
	/** Última vez que se cuadró la tesorería con el banco real. */
	ultimoCuadre: string | null;
	/** Gasto habitual al mes que se usa en la previsión (céntimos, positivo). null = calcularlo solo. */
	gastoHabitualCent: number | null;
	/** Dónde se mira el precio del combustible (Geoportal de Gasolineras). */
	municipioCombustible: MunicipioCombustible;
	/** Último precio descargado (se actualiza cada día). */
	precioCombustible: PreciosCombustible | null;
	/** Datos que aparecen en las facturas. */
	fiscal: { razonSocial: string; nif: string; direccion: string; email: string; telefono: string; iban: string };
	serieFactura: string;
	tarifaHoraCent: number;
	pieFactura: string;
	/** 'novaz' = logo incluido; clave de R2 = logo subido; 'ninguno' = sin logo. */
	logoFactura: string;
	/** Logo de la app: el de Novaz (moto) o la tuerca con el nombre del taller. */
	logoApp: 'novaz' | 'texto';
}

export const AJUSTES_POR_DEFECTO: Ajustes = {
	nombreTaller: 'Novaz',
	lema: 'Taller · Restauración',
	acento: '#f2a33a',
	tema: 'oscuro',
	zonaHoraria: 'Europe/Madrid',
	urgenteDias: 7,
	telegramChatId: null,
	parteDiario: true,
	resumenSemanal: true,
	momentosActivos: true,
	pagoPorDefecto: 'banco',
	tipoImpuestoSociedades: 25,
	ultimoCuadre: null,
	gastoHabitualCent: null,
	municipioCombustible: { id: '7130', nombre: 'Moncada', provinciaId: '46' },
	precioCombustible: null,
	fiscal: { razonSocial: 'Novaz', nif: '', direccion: '', email: '', telefono: '', iban: '' },
	serieFactura: 'NVZ',
	tarifaHoraCent: 3500,
	pieFactura: 'Gracias por confiar en Novaz.',
	logoFactura: 'novaz',
	logoApp: 'novaz',
	momentos: {
		tareaHecha: { efecto: 'pulso', sonido: 'clic' },
		faseCompletada: { efecto: 'confeti', sonido: 'campana' },
		restauracionTerminada: { efecto: 'fuegos', sonido: 'aplausos' },
		vencimientoRenovado: { efecto: 'confeti', sonido: 'llave' },
		entradaCreada: { efecto: 'ninguno', sonido: 'ninguno' },
		cajaCuadrada: { efecto: 'confeti', sonido: 'campana' }
	}
};

export function fusionarAjustes(filas: { clave: string; valor: unknown }[]): Ajustes {
	const a = structuredClone(AJUSTES_POR_DEFECTO) as unknown as Record<string, unknown>;
	for (const { clave, valor } of filas) {
		if (!(clave in a) || valor === undefined) continue;
		if (clave === 'momentos' && valor && typeof valor === 'object') {
			a.momentos = { ...(a.momentos as object), ...(valor as object) };
		} else {
			a[clave] = valor;
		}
	}
	return a as unknown as Ajustes;
}
