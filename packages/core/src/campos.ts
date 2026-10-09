// Campos personalizados: cada tipo de vehículo define los suyos y cada vehículo guarda sus valores.

export const TIPOS_CAMPO = ['texto', 'textoLargo', 'numero', 'fecha', 'lista', 'booleano'] as const;
export type TipoCampo = (typeof TIPOS_CAMPO)[number];

export interface CampoDef {
	clave: string;
	etiqueta: string;
	tipo: TipoCampo;
	opciones?: string[];
	unidad?: string;
	obligatorio?: boolean;
}

export interface FasePlantilla {
	nombre: string;
	tareas: string[];
}

export const ETIQUETAS_TIPO_CAMPO: Record<TipoCampo, string> = {
	texto: 'Texto',
	textoLargo: 'Texto largo',
	numero: 'Número',
	fecha: 'Fecha',
	lista: 'Lista de opciones',
	booleano: 'Sí / No'
};

/** "Nº de plazas" → "n_de_plazas" */
export function claveDesdeEtiqueta(etiqueta: string): string {
	return (
		etiqueta
			.normalize('NFD')
			.replace(/[̀-ͯ]/g, '')
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, '_')
			.replace(/^_+|_+$/g, '') || 'campo'
	);
}

export type ResultadoCampos =
	| { ok: true; valores: Record<string, unknown> }
	| { ok: false; errores: Record<string, string> };

/**
 * Convierte los valores crudos de un formulario (strings) a valores tipados según las definiciones.
 * Ignora claves que no estén definidas. Los vacíos se guardan como ausentes.
 */
export function parsearCampos(defs: CampoDef[], crudos: Record<string, string | null | undefined>): ResultadoCampos {
	const valores: Record<string, unknown> = {};
	const errores: Record<string, string> = {};

	for (const def of defs) {
		const crudo = (crudos[def.clave] ?? '').trim();

		if (def.tipo === 'booleano') {
			valores[def.clave] = crudo === 'on' || crudo === 'true' || crudo === '1';
			continue;
		}
		if (crudo === '') {
			if (def.obligatorio) errores[def.clave] = 'Obligatorio';
			continue;
		}
		switch (def.tipo) {
			case 'numero': {
				const n = Number(crudo.replace(',', '.'));
				if (Number.isFinite(n)) valores[def.clave] = n;
				else errores[def.clave] = 'Debe ser un número';
				break;
			}
			case 'fecha':
				if (/^\d{4}-\d{2}-\d{2}$/.test(crudo)) valores[def.clave] = crudo;
				else errores[def.clave] = 'Fecha no válida';
				break;
			case 'lista':
				if (!def.opciones?.length || def.opciones.includes(crudo)) valores[def.clave] = crudo;
				else errores[def.clave] = 'Opción no válida';
				break;
			default:
				valores[def.clave] = crudo;
		}
	}

	return Object.keys(errores).length ? { ok: false, errores } : { ok: true, valores };
}

/** Valor legible para mostrar en la ficha. */
export function mostrarCampo(def: CampoDef, valor: unknown): string {
	if (valor === undefined || valor === null || valor === '') return '—';
	if (def.tipo === 'booleano') return valor ? 'Sí' : 'No';
	if (def.tipo === 'numero') {
		const n = Number(valor).toLocaleString('es-ES');
		return def.unidad ? `${n} ${def.unidad}` : n;
	}
	if (def.tipo === 'fecha') return formatearFechaCorta(String(valor));
	return String(valor);
}

function formatearFechaCorta(iso: string): string {
	const [a, m, d] = iso.split('-');
	return `${d}/${m}/${a}`;
}
