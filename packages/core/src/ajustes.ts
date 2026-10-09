// Ajustes globales (tabla `ajustes`, clave → JSON). Los valores ausentes toman el defecto.

export const EVENTOS_MOMENTO = ['tareaHecha', 'faseCompletada', 'restauracionTerminada', 'vencimientoRenovado', 'entradaCreada'] as const;
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
	entradaCreada: 'Entrada registrada'
};

export interface Ajustes {
	nombreTaller: string;
	lema: string;
	acento: string;
	tema: 'oscuro' | 'claro' | 'sistema';
	zonaHoraria: string;
	urgenteDias: number;
	telegramChatId: string | null;
	resumenSemanal: boolean;
	momentosActivos: boolean;
	momentos: Record<EventoMomento, Momento>;
	/** De dónde sale el dinero por defecto al registrar un gasto. */
	pagoPorDefecto: 'banco' | 'caja' | 'socio';
	/** Tipo del impuesto de sociedades para la estimación (%). */
	tipoImpuestoSociedades: number;
}

export const AJUSTES_POR_DEFECTO: Ajustes = {
	nombreTaller: 'Novaz',
	lema: 'Taller · Restauración',
	acento: '#f2a33a',
	tema: 'oscuro',
	zonaHoraria: 'Europe/Madrid',
	urgenteDias: 7,
	telegramChatId: null,
	resumenSemanal: true,
	momentosActivos: true,
	pagoPorDefecto: 'banco',
	tipoImpuestoSociedades: 25,
	momentos: {
		tareaHecha: { efecto: 'pulso', sonido: 'clic' },
		faseCompletada: { efecto: 'confeti', sonido: 'campana' },
		restauracionTerminada: { efecto: 'fuegos', sonido: 'aplausos' },
		vencimientoRenovado: { efecto: 'confeti', sonido: 'llave' },
		entradaCreada: { efecto: 'ninguno', sonido: 'ninguno' }
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
