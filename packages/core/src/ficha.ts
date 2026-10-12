// Ficha técnica de cada vehículo (nuestro manual): datos por secciones, verificados o no, que crecen con el uso;
// procedimientos propios paso a paso; y un formato JSON («novaz-ficha») para importar un manual entero de golpe.

export const SECCIONES_FICHA = [
	{ clave: 'motor', nombre: 'Motor' },
	{ clave: 'transmision', nombre: 'Transmisión' },
	{ clave: 'frenos', nombre: 'Frenos' },
	{ clave: 'ruedas', nombre: 'Ruedas y neumáticos' },
	{ clave: 'electricidad', nombre: 'Electricidad' },
	{ clave: 'pares', nombre: 'Pares de apriete' },
	{ clave: 'recambios', nombre: 'Referencias de recambios' },
	{ clave: 'otros', nombre: 'Otros' }
] as const;
export type SeccionFicha = (typeof SECCIONES_FICHA)[number]['clave'];

export interface DatoPlantilla {
	seccion: SeccionFicha;
	clave: string;
	nombre: string;
	unidad?: string;
	ayuda?: string;
}

const COMUN_FINAL: DatoPlantilla[] = [
	{ seccion: 'frenos', clave: 'liquido_frenos', nombre: 'Líquido de frenos', ayuda: 'DOT 4, DOT 5.1…' },
	{ seccion: 'ruedas', clave: 'neumatico_del', nombre: 'Neumático delantero', ayuda: 'Medida e índices' },
	{ seccion: 'ruedas', clave: 'neumatico_tras', nombre: 'Neumático trasero' },
	{ seccion: 'ruedas', clave: 'presion_del', nombre: 'Presión delantera', unidad: 'bar' },
	{ seccion: 'ruedas', clave: 'presion_tras', nombre: 'Presión trasera', unidad: 'bar' },
	{ seccion: 'electricidad', clave: 'bateria', nombre: 'Batería', ayuda: 'Capacidad, amperios de arranque, referencia' },
	{ seccion: 'recambios', clave: 'filtro_aceite_ref', nombre: 'Filtro de aceite' },
	{ seccion: 'recambios', clave: 'filtro_aire_ref', nombre: 'Filtro de aire' }
];

const PLANTILLA_COCHE: DatoPlantilla[] = [
	{ seccion: 'motor', clave: 'aceite_motor', nombre: 'Aceite de motor', ayuda: 'Viscosidad y norma (5W30 VW 507.00…)' },
	{ seccion: 'motor', clave: 'aceite_motor_litros', nombre: 'Cantidad de aceite (con filtro)', unidad: 'L' },
	{ seccion: 'motor', clave: 'refrigerante', nombre: 'Refrigerante', ayuda: 'Tipo (G12, G13…)' },
	{ seccion: 'motor', clave: 'refrigerante_litros', nombre: 'Cantidad de refrigerante', unidad: 'L' },
	{ seccion: 'motor', clave: 'bujias', nombre: 'Bujías / calentadores', ayuda: 'Referencia y separación' },
	{ seccion: 'motor', clave: 'distribucion', nombre: 'Distribución', ayuda: 'Correa o cadena, intervalo de cambio' },
	{ seccion: 'transmision', clave: 'aceite_caja', nombre: 'Aceite de la caja de cambios', ayuda: 'Tipo y cantidad' },
	{ seccion: 'frenos', clave: 'disco_del_min', nombre: 'Espesor mínimo disco delantero', unidad: 'mm' },
	{ seccion: 'frenos', clave: 'disco_tras_min', nombre: 'Espesor mínimo disco trasero', unidad: 'mm' },
	...COMUN_FINAL,
	{ seccion: 'electricidad', clave: 'bombilla_cruce', nombre: 'Bombilla de cruce', ayuda: 'H7, H4…' },
	{ seccion: 'pares', clave: 'par_ruedas', nombre: 'Tornillos de rueda', unidad: 'Nm' },
	{ seccion: 'pares', clave: 'par_carter', nombre: 'Tapón del cárter', unidad: 'Nm' },
	{ seccion: 'pares', clave: 'par_bujias', nombre: 'Bujías / calentadores', unidad: 'Nm' },
	{ seccion: 'recambios', clave: 'filtro_combustible_ref', nombre: 'Filtro de combustible' },
	{ seccion: 'recambios', clave: 'filtro_habitaculo_ref', nombre: 'Filtro de habitáculo' },
	{ seccion: 'recambios', clave: 'pastillas_del_ref', nombre: 'Pastillas delanteras' },
	{ seccion: 'recambios', clave: 'correa_accesorios_ref', nombre: 'Correa de accesorios' }
];

const PLANTILLA_MOTO: DatoPlantilla[] = [
	{ seccion: 'motor', clave: 'aceite_motor', nombre: 'Aceite de motor', ayuda: 'Viscosidad y norma (10W40 JASO MA2…)' },
	{ seccion: 'motor', clave: 'aceite_motor_litros', nombre: 'Cantidad de aceite (con filtro)', unidad: 'L' },
	{ seccion: 'motor', clave: 'bujias', nombre: 'Bujías', ayuda: 'Referencia y separación' },
	{ seccion: 'motor', clave: 'holgura_valvulas', nombre: 'Holgura de válvulas', ayuda: 'Admisión / escape en frío', unidad: 'mm' },
	{ seccion: 'transmision', clave: 'kit_transmision', nombre: 'Kit de transmisión', ayuda: 'Paso de cadena, eslabones, piñón/corona' },
	{ seccion: 'transmision', clave: 'holgura_cadena', nombre: 'Holgura de la cadena', unidad: 'mm' },
	...COMUN_FINAL,
	{ seccion: 'pares', clave: 'par_eje_del', nombre: 'Eje delantero', unidad: 'Nm' },
	{ seccion: 'pares', clave: 'par_eje_tras', nombre: 'Eje trasero', unidad: 'Nm' },
	{ seccion: 'pares', clave: 'par_carter', nombre: 'Tapón del cárter', unidad: 'Nm' },
	{ seccion: 'pares', clave: 'par_bujias', nombre: 'Bujías', unidad: 'Nm' },
	{ seccion: 'recambios', clave: 'pastillas_del_ref', nombre: 'Pastillas delanteras' },
	{ seccion: 'recambios', clave: 'pastillas_tras_ref', nombre: 'Pastillas traseras' }
];

/** Los huecos de la ficha según el tipo de vehículo (moto o lo demás). */
export function plantillaFicha(tipoVehiculo: string | null | undefined): DatoPlantilla[] {
	return /moto|scooter|ciclomotor|vespa/i.test(tipoVehiculo ?? '') ? PLANTILLA_MOTO : PLANTILLA_COCHE;
}

export const claveDato = (nombre: string) =>
	nombre
		.normalize('NFD')
		.replace(/[̀-ͯ]/g, '')
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '_')
		.replace(/^_|_$/g, '')
		.slice(0, 40) || 'dato';

// ─── Formato JSON «novaz-ficha» (para importar un manual entero) ─────────────

export interface DatoFicha {
	seccion: SeccionFicha;
	clave: string;
	nombre: string;
	valor: string;
	unidad?: string | null;
	detalle?: string | null;
	fuente?: string | null;
	verificado?: boolean;
}

export interface PasoProcedimiento {
	texto: string;
	/** Par de apriete o dato clave de ese paso («25 Nm»). */
	par?: string | null;
	/** Foto del paso (clave del archivo en la app). */
	foto?: string | null;
}

export interface ProcedimientoFicha {
	titulo: string;
	tiempoMin?: number | null;
	herramientas?: string[];
	pasos: PasoProcedimiento[];
	notas?: string | null;
}

export interface FichaJSON {
	formato: 'novaz-ficha';
	version: 1;
	vehiculo?: string;
	datos: DatoFicha[];
	procedimientos?: ProcedimientoFicha[];
}

/** Ejemplo del formato (para quien genere el manual con una IA). */
export const EJEMPLO_FICHA: FichaJSON = {
	formato: 'novaz-ficha',
	version: 1,
	vehiculo: 'Suzuki GSF 600 Bandit (1999)',
	datos: [
		{ seccion: 'motor', clave: 'aceite_motor', nombre: 'Aceite de motor', valor: '10W40 JASO MA', fuente: 'Manual de taller, pág. 2-3' },
		{ seccion: 'motor', clave: 'aceite_motor_litros', nombre: 'Cantidad de aceite (con filtro)', valor: '3,3', unidad: 'L' },
		{ seccion: 'pares', clave: 'par_carter', nombre: 'Tapón del cárter', valor: '23', unidad: 'Nm' }
	],
	procedimientos: [
		{
			titulo: 'Cambio de aceite y filtro',
			tiempoMin: 40,
			herramientas: ['Llave de vaso 17', 'Llave de filtro', 'Bandeja de aceite'],
			pasos: [{ texto: 'Calentar el motor 5 minutos y apagarlo.' }, { texto: 'Quitar el tapón del cárter y vaciar.', par: '23 Nm al montarlo' }]
		}
	]
};

const SECCIONES = new Set<string>(SECCIONES_FICHA.map((s) => s.clave));
const txt = (v: unknown, max = 200) => (typeof v === 'string' || typeof v === 'number' ? String(v).trim().slice(0, max) : '');

/** Lee un JSON «novaz-ficha» (o algo parecido) y devuelve lo aprovechable, sin fiarse de nada. */
export function leerFichaJSON(raw: unknown): { datos: DatoFicha[]; procedimientos: ProcedimientoFicha[]; avisos: string[] } {
	const avisos: string[] = [];
	const o = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
	if (o.formato && o.formato !== 'novaz-ficha') avisos.push(`El formato es «${String(o.formato)}», no «novaz-ficha»: intento leerlo igual.`);
	const datos: DatoFicha[] = [];
	for (const d of Array.isArray(o.datos) ? (o.datos as Record<string, unknown>[]) : []) {
		const nombre = txt(d?.nombre, 80);
		const valor = txt(d?.valor, 300);
		if (!nombre || !valor) continue;
		const seccion = SECCIONES.has(txt(d.seccion)) ? (txt(d.seccion) as SeccionFicha) : 'otros';
		datos.push({ seccion, clave: claveDato(txt(d.clave, 40) || nombre), nombre, valor, unidad: txt(d.unidad, 20) || null, detalle: txt(d.detalle, 300) || null, fuente: txt(d.fuente, 120) || null, verificado: d.verificado === true });
	}
	const procedimientos: ProcedimientoFicha[] = [];
	for (const p of Array.isArray(o.procedimientos) ? (o.procedimientos as Record<string, unknown>[]) : []) {
		const titulo = txt(p?.titulo, 120);
		const pasos = (Array.isArray(p?.pasos) ? (p.pasos as unknown[]) : [])
			.map((x) => (typeof x === 'string' ? { texto: x } : (x as Record<string, unknown>)))
			.map((x) => ({ texto: txt(x?.texto, 600), par: txt(x?.par, 60) || null }))
			.filter((x) => x.texto);
		if (!titulo || !pasos.length) continue;
		const tiempo = Number(p.tiempoMin);
		procedimientos.push({
			titulo,
			tiempoMin: Number.isFinite(tiempo) && tiempo > 0 ? Math.round(tiempo) : null,
			herramientas: (Array.isArray(p.herramientas) ? (p.herramientas as unknown[]) : []).map((h) => txt(h, 80)).filter(Boolean).slice(0, 30),
			pasos: pasos.slice(0, 60),
			notas: txt(p.notas, 600) || null
		});
	}
	if (!datos.length && !procedimientos.length) avisos.push('No he encontrado datos ni procedimientos en el archivo.');
	return { datos, procedimientos, avisos };
}

// ─── Sugerencias a partir de lo que usas en los mantenimientos ────────────────

export interface UsoMaterial {
	nombre: string;
	marca: string | null;
	referencia: string | null;
	cantidad: number;
	unidad: string;
	fecha: string;
}

export interface Sugerencia {
	clave: string;
	nombre: string;
	seccion: SeccionFicha;
	valor: string;
	unidad?: string | null;
	fuente: string;
}

const sinTildes = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const fechaCorta = (f: string) => f.split('-').reverse().join('/');

/** Lo que la ficha podría aprender de los materiales usados (aceite, filtros, bujías…), si cambia algo. */
export function sugerenciasFicha(usos: UsoMaterial[], actuales: Record<string, string>, plantilla: DatoPlantilla[]): Sugerencia[] {
	const salida = new Map<string, Sugerencia>();
	const nombreDe = (clave: string) => plantilla.find((p) => p.clave === clave);
	const proponer = (clave: string, valor: string, u: UsoMaterial, unidad?: string | null) => {
		const p = nombreDe(clave);
		if (!p || !valor || sinTildes(actuales[clave] ?? '') === sinTildes(valor)) return;
		salida.set(clave, { clave, nombre: p.nombre, seccion: p.seccion, valor, unidad: unidad ?? p.unidad ?? null, fuente: `Usado el ${fechaCorta(u.fecha)}: ${u.nombre}` });
	};
	// De lo más antiguo a lo más reciente: gana lo último que usaste
	for (const u of [...usos].sort((a, b) => a.fecha.localeCompare(b.fecha))) {
		const n = sinTildes(`${u.nombre} ${u.marca ?? ''}`);
		const ref = u.referencia || [u.marca, u.nombre].filter(Boolean).join(' ');
		if (/filtro/.test(n)) {
			if (/aceite/.test(n)) proponer('filtro_aceite_ref', ref, u);
			else if (/aire/.test(n)) proponer('filtro_aire_ref', ref, u);
			else if (/combustible|gasoil|gasolina/.test(n)) proponer('filtro_combustible_ref', ref, u);
			else if (/habitaculo|polen/.test(n)) proponer('filtro_habitaculo_ref', ref, u);
			continue;
		}
		if (/aceite/.test(n) && !/caja|cambio|diferencial|horquilla/.test(n)) {
			const visc = `${u.nombre} ${u.referencia ?? ''}`.match(/\b\d{1,2}\s?W\s?-?\s?\d{2}\b/i)?.[0].replace(/\s|-/g, '').toUpperCase();
			proponer('aceite_motor', [visc ?? u.nombre, u.marca].filter(Boolean).join(' · '), u);
			if (/^(l|litros?)$/i.test(u.unidad) && u.cantidad > 0.5 && u.cantidad < 15) proponer('aceite_motor_litros', String(u.cantidad).replace('.', ','), u, 'L');
			continue;
		}
		if (/buji/.test(n)) proponer('bujias', ref, u);
		else if (/pastilla/.test(n)) proponer(/tras/.test(n) ? 'pastillas_tras_ref' : 'pastillas_del_ref', ref, u);
		else if (/liquido de frenos|dot ?[345]/.test(n)) proponer('liquido_frenos', u.nombre.match(/dot ?[0-9.]+/i)?.[0].toUpperCase() ?? u.nombre, u);
		else if (/refrigerante|anticongelante/.test(n)) proponer('refrigerante', u.nombre, u);
		else if (/correa/.test(n) && !/distrib/.test(n)) proponer('correa_accesorios_ref', ref, u);
	}
	return [...salida.values()];
}

// ─── Buscar en la ficha («¿qué aceite lleva?», «par de las ruedas») ────────────

const SINONIMOS: [RegExp, string[]][] = [
	[/\baceite\b/, ['aceite_motor', 'aceite_motor_litros']],
	[/\bpresion|presiones|inflar|hinchar\b/, ['presion_del', 'presion_tras']],
	[/\bneumatic|ruedas?\b/, ['neumatico_del', 'neumatico_tras', 'presion_del', 'presion_tras']],
	[/\bbuji/, ['bujias', 'par_bujias']],
	[/\bfiltro/, ['filtro_aceite_ref', 'filtro_aire_ref', 'filtro_combustible_ref', 'filtro_habitaculo_ref']],
	[/\bfreno/, ['liquido_frenos', 'disco_del_min', 'disco_tras_min', 'pastillas_del_ref', 'pastillas_tras_ref']],
	[/\brefrigerante|anticongelante|agua\b/, ['refrigerante', 'refrigerante_litros']],
	[/\bbateria\b/, ['bateria']],
	[/\bcadena|transmision|corona|pinon\b/, ['kit_transmision', 'holgura_cadena']],
	[/\bvalvula/, ['holgura_valvulas']]
];

/** Los datos de la ficha que responden a una pregunta, los mejores primero. */
export function buscarEnFicha<D extends { clave: string; nombre: string; seccion: string; valor: string }>(pregunta: string, datos: D[], max = 4): D[] {
	const q = sinTildes(pregunta);
	const esPar = /\bpar\b|apriete|apretar|nm\b/.test(q);
	const claves = new Set(SINONIMOS.filter(([re]) => re.test(q)).flatMap(([, c]) => c));
	const palabras = q.split(/[^a-z0-9]+/).filter((w) => w.length > 3 && !['lleva', 'tiene', 'cual', 'cuanto', 'cuanta', 'donde', 'para'].includes(w));
	const puntos = (d: D) => {
		const nom = sinTildes(`${d.nombre} ${d.clave}`);
		let p = 0;
		if (claves.has(d.clave)) p += 3;
		if (esPar) p += d.seccion === 'pares' ? 3 : -2;
		for (const w of palabras) if (nom.includes(w.replace(/(es|s)$/, ''))) p += 2;
		return p;
	};
	return datos
		.map((d) => ({ d, p: puntos(d) }))
		.filter((x) => x.p > 1)
		.sort((a, b) => b.p - a.p)
		.slice(0, max)
		.map((x) => x.d);
}
