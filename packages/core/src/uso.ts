// Análisis del uso de la app: dónde hay fricción (formularios abandonados, errores, la IA que falla) y qué no se usa.

export interface EventoUso {
	momento: string;
	ruta: string | null;
	evento: string;
	nombre: string | null;
	duracionMs: number | null;
	datos: Record<string, unknown> | null;
	movil: boolean | null;
}

/** «Repostaje · Ibiza», «Gasto: Aislar la puerta» → «Repostaje», «Gasto». */
export const nombreHoja = (t: string | null) => (t ?? '—').split(/ · |: /)[0].trim() || '—';

const mediana = (xs: number[]) => {
	if (!xs.length) return null;
	const o = [...xs].sort((a, b) => a - b);
	const m = Math.floor(o.length / 2);
	return o.length % 2 ? o[m] : Math.round((o[m - 1] + o[m]) / 2);
};

const contar = <T>(xs: T[], clave: (x: T) => string) => {
	const m = new Map<string, number>();
	for (const x of xs) m.set(clave(x), (m.get(clave(x)) ?? 0) + 1);
	return [...m.entries()].map(([nombre, n]) => ({ nombre, n })).sort((a, b) => b.n - a.n);
};

export function analizarUso(eventos: EventoUso[], rutasConocidas: string[] = []) {
	const de = (tipo: string) => eventos.filter((e) => e.evento === tipo);

	// Formularios en hoja: abiertos, completados, abandonados y lo que se tarda
	const porHoja = new Map<string, { abiertas: number; completadas: number; abandonadas: number; tiempos: number[]; errores: number }>();
	const hoja = (n: string | null) => {
		const k = nombreHoja(n);
		if (!porHoja.has(k)) porHoja.set(k, { abiertas: 0, completadas: 0, abandonadas: 0, tiempos: [], errores: 0 });
		return porHoja.get(k)!;
	};
	for (const e of de('hoja_abierta')) hoja(e.nombre).abiertas++;
	for (const e of de('hoja_completada')) {
		const h = hoja(e.nombre);
		h.completadas++;
		if (e.duracionMs) h.tiempos.push(e.duracionMs);
	}
	for (const e of de('hoja_abandonada')) hoja(e.nombre).abandonadas++;
	for (const e of de('envio_error')) if (e.datos?.hoja) hoja(String(e.datos.hoja)).errores++;
	const formularios = [...porHoja.entries()]
		.map(([nombre, h]) => {
			const cerradas = h.completadas + h.abandonadas;
			return {
				nombre,
				abiertas: h.abiertas,
				completadas: h.completadas,
				abandonadas: h.abandonadas,
				abandono: cerradas ? h.abandonadas / cerradas : 0,
				medianaMs: mediana(h.tiempos),
				errores: h.errores
			};
		})
		.filter((f) => f.abiertas || f.completadas)
		// Lo que más fricción da primero: abandonos y errores
		.sort((a, b) => b.abandonadas + b.errores - (a.abandonadas + a.errores) || b.abiertas - a.abiertas);

	// Lectura de tickets con IA: si acierta o hay que corregir
	const revisados = de('ticket_revisado');
	const corregidos = revisados.filter((e) => Array.isArray(e.datos?.corregidos) && (e.datos!.corregidos as unknown[]).length);
	const ticket = {
		lecturas: de('ticket_ok').length,
		fallos: de('ticket_error').length,
		revisados: revisados.length,
		corregidos: corregidos.length,
		campos: contar(corregidos.flatMap((e) => e.datos!.corregidos as string[]), (c) => c),
		medianaMs: mediana(de('ticket_ok').flatMap((e) => (e.duracionMs ? [e.duracionMs] : [])))
	};

	const vistas = contar(de('vista'), (e) => e.ruta ?? '—');
	const visitadas = new Set(vistas.map((v) => v.nombre.split('?')[0]));
	return {
		total: eventos.length,
		dias: new Set(eventos.map((e) => e.momento.slice(0, 10))).size,
		movil: eventos.length ? eventos.filter((e) => e.movil).length / eventos.length : 0,
		formularios,
		errores: contar(de('envio_error').concat(de('accion_error')), (e) => `${nombreHoja((e.datos?.hoja as string) ?? null) !== '—' ? `${nombreHoja(e.datos!.hoja as string)}: ` : ''}${String(e.datos?.mensaje ?? 'Error')}`).slice(0, 10),
		acciones: contar(de('envio_ok').concat(de('accion_ok')), (e) => e.nombre ?? '—').slice(0, 12),
		vistas: vistas.slice(0, 15),
		sinUso: rutasConocidas.filter((r) => !visitadas.has(r)),
		erroresJs: contar(de('error_js'), (e) => String(e.datos?.mensaje ?? e.nombre ?? 'Error')).slice(0, 10),
		ticket
	};
}

/** /flota/12?pestana=papeles&x=1 → /flota/[id]?pestana=papeles (los ids no importan; la pestaña sí). */
export function normalizarRuta(pathname: string, search = ''): string {
	const ruta = pathname.replace(/\/\d+(?=\/|$)/g, '/[id]') || '/';
	const pestana = new URLSearchParams(search).get('pestana');
	return pestana ? `${ruta}?pestana=${pestana}` : ruta;
}
