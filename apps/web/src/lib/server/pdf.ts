// PDF de facturas e informes de trabajos (pdf-lib: funciona en Workers, sin dependencias nativas).
import { euros, fechaLarga, importeLinea, numeroFactura, type Ajustes } from '@novaz/core';
import type { Factura } from '@novaz/core/schema';
import { degrees, PDFDocument, rgb, StandardFonts, type PDFFont, type PDFPage } from 'pdf-lib';

const A4 = { w: 595.28, h: 841.89 };
const M = 48; // margen
const GRIS = rgb(0.42, 0.44, 0.47);
const TINTA = rgb(0.09, 0.09, 0.1);
const LINEA = rgb(0.86, 0.86, 0.84);

// Las fuentes estándar solo codifican WinAnsi: lo demás se sustituye.
const EXTRA = new Set('€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ');
const limpio = (s: string | null | undefined) =>
	(s ?? '')
		.replace(/ /g, ' ')
		.replace(/[^\n]/g, (c) => (c.charCodeAt(0) <= 0xff || EXTRA.has(c) ? c : '?'))
		.replace(/\t/g, ' ');

function hexARgb(hex: string) {
	const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
	return m ? rgb(parseInt(m[1], 16) / 255, parseInt(m[2], 16) / 255, parseInt(m[3], 16) / 255) : rgb(0.95, 0.64, 0.23);
}

/** Parte un texto en líneas que caben en `ancho`. */
function partir(texto: string, fuente: PDFFont, tam: number, ancho: number): string[] {
	const salida: string[] = [];
	for (const parrafo of limpio(texto).split('\n')) {
		let linea = '';
		for (const palabra of parrafo.split(/\s+/)) {
			const prueba = linea ? `${linea} ${palabra}` : palabra;
			if (fuente.widthOfTextAtSize(prueba, tam) <= ancho) linea = prueba;
			else {
				if (linea) salida.push(linea);
				// Palabras más largas que la línea: se cortan
				let resto = palabra;
				while (fuente.widthOfTextAtSize(resto, tam) > ancho && resto.length > 1) {
					let n = resto.length;
					while (n > 1 && fuente.widthOfTextAtSize(resto.slice(0, n), tam) > ancho) n--;
					salida.push(resto.slice(0, n));
					resto = resto.slice(n);
				}
				linea = resto;
			}
		}
		salida.push(linea);
	}
	return salida;
}

export async function pdfFactura(f: Factura, a: Ajustes, logo: { bytes: Uint8Array; tipo: string } | null = null): Promise<Uint8Array> {
	const doc = await PDFDocument.create();
	const normal = await doc.embedFont(StandardFonts.Helvetica);
	const negrita = await doc.embedFont(StandardFonts.HelveticaBold);
	const acento = hexARgb(a.acento);
	const esFactura = f.tipo === 'factura';
	const conPrecios = esFactura || f.lineas.some((l) => l.precioCent);
	const numero = numeroFactura(f.serie, f.anio, f.numero);
	doc.setTitle(`${esFactura ? 'Factura' : 'Informe'} ${numero}`);
	doc.setAuthor(a.fiscal.razonSocial || a.nombreTaller);
	doc.setCreator('Novaz Dashboard');

	const paginas: PDFPage[] = [];
	let p!: PDFPage;
	let y = 0;
	const texto = (t: string, x: number, yy: number, o: { f?: PDFFont; t?: number; c?: ReturnType<typeof rgb>; derecha?: boolean } = {}) => {
		const fuente = o.f ?? normal;
		const tam = o.t ?? 9.5;
		const s = limpio(t);
		p.drawText(s, { x: o.derecha ? x - fuente.widthOfTextAtSize(s, tam) : x, y: yy, size: tam, font: fuente, color: o.c ?? TINTA });
	};

	// Columnas de la tabla
	const X = { concepto: M, cant: A4.w - M - 230, precio: A4.w - M - 95, importe: A4.w - M };
	const anchoConcepto = conPrecios ? X.cant - M - 50 : A4.w - 2 * M - 60;

	function nuevaPagina(primera: boolean) {
		p = doc.addPage([A4.w, A4.h]);
		paginas.push(p);
		p.drawRectangle({ x: 0, y: A4.h - 6, width: A4.w, height: 6, color: acento });
		y = A4.h - M;
		if (!primera) {
			texto(`${esFactura ? 'Factura' : 'Informe'} ${numero} (continuación)`, M, y, { f: negrita, t: 10 });
			y -= 24;
			cabeceraTabla();
		}
	}
	function cabeceraTabla() {
		p.drawRectangle({ x: M, y: y - 6, width: A4.w - 2 * M, height: 20, color: rgb(0.96, 0.96, 0.95) });
		texto('CONCEPTO', M + 8, y, { f: negrita, t: 7.5, c: GRIS });
		// (las cabeceras van en la línea base y; la fila gris ocupa de y-6 a y+14)
		if (conPrecios) {
			texto('CANT.', X.cant + 30, y, { f: negrita, t: 7.5, c: GRIS, derecha: true });
			texto('PRECIO', X.precio, y, { f: negrita, t: 7.5, c: GRIS, derecha: true });
			texto('IMPORTE', X.importe - 8, y, { f: negrita, t: 7.5, c: GRIS, derecha: true });
		} else texto('HORAS', X.importe - 8, y, { f: negrita, t: 7.5, c: GRIS, derecha: true });
		y -= 6; // y = borde inferior de la cabecera: las filas empiezan aquí
	}

	nuevaPagina(true);

	// ─── Cabecera: logo (o nombre) y documento
	let yEmisor: number;
	const imagen = logo
		? await (logo.tipo.includes('jp') || (logo.bytes[0] === 0xff && logo.bytes[1] === 0xd8) ? doc.embedJpg(logo.bytes) : doc.embedPng(logo.bytes)).catch(() => null)
		: null;
	if (imagen) {
		// Cabe en 170×52 pt manteniendo la proporción
		const escala = Math.min(170 / imagen.width, 52 / imagen.height);
		const w = imagen.width * escala;
		const h = imagen.height * escala;
		p.drawImage(imagen, { x: M, y: y - h + 4, width: w, height: h });
		texto(a.fiscal.razonSocial || a.nombreTaller, M, y - h - 10, { f: negrita, t: 10 });
		yEmisor = y - h - 23;
	} else {
		texto((a.fiscal.razonSocial || a.nombreTaller).toUpperCase(), M, y - 6, { f: negrita, t: 20 });
		yEmisor = y - 24;
	}
	for (const l of [a.fiscal.nif && `NIF ${a.fiscal.nif}`, a.fiscal.direccion, [a.fiscal.email, a.fiscal.telefono].filter(Boolean).join(' · ')].filter(Boolean) as string[]) {
		for (const t of partir(l, normal, 8.5, 260)) {
			texto(t, M, yEmisor, { t: 8.5, c: GRIS });
			yEmisor -= 11.5;
		}
	}
	texto(esFactura ? 'FACTURA' : 'INFORME DE TRABAJOS', A4.w - M, y - 6, { f: negrita, t: 15, derecha: true, c: acento });
	texto(`Nº ${numero}`, A4.w - M, y - 24, { f: negrita, t: 10, derecha: true });
	texto(`Fecha: ${fechaLarga(f.fecha)}`, A4.w - M, y - 38, { t: 9, derecha: true, c: GRIS });
	y = Math.min(yEmisor, y - 50) - 14;

	// ─── Cliente y vehículo
	const anchoCaja = (A4.w - 2 * M - 14) / 2;
	const caja = (x: number, titulo: string, lineas: string[]) => {
		const filas = lineas.flatMap((l, i) => partir(l, i ? normal : negrita, i ? 8.5 : 10, anchoCaja - 20).map((t) => ({ t, primera: i === 0 })));
		const alto = 30 + filas.length * 12;
		p.drawRectangle({ x, y: y - alto, width: anchoCaja, height: alto, borderColor: LINEA, borderWidth: 0.8 });
		texto(titulo, x + 10, y - 15, { f: negrita, t: 7, c: GRIS });
		filas.forEach((f2, i) => texto(f2.t, x + 10, y - 30 - i * 12, { f: f2.primera ? negrita : normal, t: f2.primera ? 10 : 8.5, c: f2.primera ? TINTA : GRIS }));
		return alto;
	};
	const cli = f.cliente;
	const veh = f.vehiculo;
	const altoCli = caja(
		M,
		'CLIENTE',
		cli
			? [cli.nombre, cli.nif ? `NIF ${cli.nif}` : '', cli.direccion ?? '', [cli.email, cli.telefono].filter(Boolean).join(' · ')].filter(Boolean)
			: [esFactura ? '—' : 'Vehículo propio', esFactura ? '' : 'Trabajos internos del taller'].filter(Boolean)
	);
	const altoVeh = caja(M + anchoCaja + 14, 'VEHÍCULO', veh
		? [
				[veh.marca, veh.modelo].filter(Boolean).join(' ') || veh.alias,
				[veh.matricula && `Matrícula ${veh.matricula}`, veh.anio && `Año ${veh.anio}`].filter(Boolean).join(' · '),
				veh.bastidor ? `Bastidor ${veh.bastidor}` : '',
				f.km != null ? `Kilómetros: ${f.km.toLocaleString('es-ES')}` : ''
			].filter(Boolean)
		: ['—']);
	y -= Math.max(altoCli, altoVeh) + 24;

	// ─── Líneas
	cabeceraTabla();
	// Cada fila: y = borde superior. Primera línea base 15 pt más abajo; separador al borde inferior.
	for (const l of f.lineas) {
		const titulo = partir(l.concepto, negrita, 9.5, anchoConcepto);
		const detalle = l.detalle ? partir(l.detalle, normal, 8, anchoConcepto) : [];
		const alto = 15 + (titulo.length - 1) * 12 + detalle.length * 10.5 + 9;
		if (y - alto < M + 150) nuevaPagina(false);
		const base = y - 15;
		titulo.forEach((t, i) => texto(t, M + 8, base - i * 12, { f: negrita, t: 9.5 }));
		detalle.forEach((t, i) => texto(t, M + 8, base - titulo.length * 12 - i * 10.5 + 1.5, { t: 8, c: GRIS }));
		const cant = `${l.cantidad.toLocaleString('es-ES', { maximumFractionDigits: 2 })}${l.unidad ? ` ${l.unidad}` : ''}`;
		if (conPrecios) {
			texto(cant, X.cant + 30, base, { derecha: true });
			texto(euros(l.precioCent), X.precio, base, { derecha: true });
			texto(euros(importeLinea(l)), X.importe - 8, base, { f: negrita, derecha: true });
		} else texto(cant, X.importe - 8, base, { derecha: true });
		y -= alto;
		p.drawLine({ start: { x: M, y }, end: { x: A4.w - M, y }, thickness: 0.5, color: LINEA });
	}

	// ─── Totales
	if (y < M + 150) nuevaPagina(false);
	y -= 22;
	if (conPrecios) {
		const xEtq = A4.w - M - 190;
		const fila = (etq: string, valor: string, fuerte = false) => {
			texto(etq, xEtq, y, { f: fuerte ? negrita : normal, t: fuerte ? 11 : 9.5, c: fuerte ? TINTA : GRIS });
			texto(valor, A4.w - M - 8, y, { f: fuerte ? negrita : normal, t: fuerte ? 13 : 9.5, derecha: true });
			y -= fuerte ? 22 : 16;
		};
		fila('Base imponible', euros(f.baseCent));
		fila(f.ivaPct ? `IVA ${f.ivaPct} %` : 'IVA (exento)', euros(f.ivaCent));
		y -= 8;
		p.drawRectangle({ x: xEtq - 10, y: y - 9, width: A4.w - M - xEtq + 10, height: 26, color: rgb(0.96, 0.96, 0.95) });
		p.drawRectangle({ x: xEtq - 10, y: y - 9, width: 3, height: 26, color: acento });
		fila('TOTAL', euros(f.totalCent), true);
	} else {
		const horas = f.lineas.filter((l) => l.unidad === 'h').reduce((t, l) => t + l.cantidad, 0);
		if (horas) texto(`Total horas: ${horas.toLocaleString('es-ES')}`, A4.w - M - 8, y, { f: negrita, t: 11, derecha: true });
		y -= 22;
	}

	// ─── Notas, forma de pago y pie
	y -= 8;
	const bloques = [f.notas, esFactura && a.fiscal.iban ? `Forma de pago: transferencia a ${a.fiscal.iban}` : '', a.pieFactura].filter(Boolean) as string[];
	for (const b of bloques) {
		for (const t of partir(b, normal, 8.5, A4.w - 2 * M)) {
			if (y < M + 20) nuevaPagina(false);
			texto(t, M, y, { t: 8.5, c: GRIS });
			y -= 11.5;
		}
		y -= 6;
	}

	if (f.anulada)
		for (const pg of paginas)
			pg.drawText('ANULADA', { x: 120, y: 330, size: 96, font: negrita, color: rgb(0.85, 0.2, 0.2), opacity: 0.15, rotate: degrees(35) });

	paginas.forEach((pg, i) => {
		const t = `${numero} · Página ${i + 1} de ${paginas.length}`;
		pg.drawText(t, { x: A4.w - M - normal.widthOfTextAtSize(t, 7.5), y: 24, size: 7.5, font: normal, color: GRIS });
	});
	return doc.save();
}
