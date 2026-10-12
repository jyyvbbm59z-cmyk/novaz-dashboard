// Dossier del vehículo en PDF, generado en el navegador (así las fotos WebP se pueden pasar a JPEG).
import { euros, fechaLarga } from '@novaz/core';
import { hexARgb, limpio, partir } from './pdfComun';

export interface Dossier {
	alias: string;
	marca: string | null;
	modelo: string | null;
	anio: number | null;
	matricula: string | null;
	bastidor: string | null;
	tipo: string;
	km: number | null;
	kmFecha: string | null;
	portada: string | null;
	papeles: { tipo: string; vence: string }[];
	historial: { fecha: string; km: number | null; clase: string; titulo: string; revisiones: string[] }[];
	restauraciones: { nombre: string; estado: string; desde: string | null; hasta: string | null; horas: number; fases: string[] }[];
	ficha: { seccion: string; datos: { nombre: string; valor: string; detalle: string | null }[] }[];
	fotos: { clave: string; pie: string | null }[];
	costes: { total: number; porCategoria: [string, number][] } | null;
}

/** Una foto de la app (WebP) → JPEG para el PDF, a 1400 px como mucho. */
async function aJpeg(clave: string): Promise<{ bytes: Uint8Array; w: number; h: number } | null> {
	try {
		const r = await fetch(`/archivos/${clave}`);
		if (!r.ok) return null;
		const bmp = await createImageBitmap(await r.blob(), { imageOrientation: 'from-image' });
		const k = Math.min(1, 1400 / Math.max(bmp.width, bmp.height));
		const canvas = document.createElement('canvas');
		canvas.width = Math.round(bmp.width * k);
		canvas.height = Math.round(bmp.height * k);
		canvas.getContext('2d')!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
		bmp.close();
		const blob = await new Promise<Blob | null>((ok) => canvas.toBlob(ok, 'image/jpeg', 0.82));
		return blob ? { bytes: new Uint8Array(await blob.arrayBuffer()), w: canvas.width, h: canvas.height } : null;
	} catch {
		return null;
	}
}

const CLASE: Record<string, string> = { mantenimiento: 'Mantenimiento', reparacion: 'Reparación', mejora: 'Mejora' };

export async function pdfDossier(d: Dossier, taller: string, acentoHex: string, hoy: string): Promise<Blob> {
	const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib');
	const doc = await PDFDocument.create();
	const normal = await doc.embedFont(StandardFonts.Helvetica);
	const negrita = await doc.embedFont(StandardFonts.HelveticaBold);
	const acento = hexARgb(acentoHex);
	const TINTA = rgb(0.09, 0.09, 0.1);
	const GRIS = rgb(0.42, 0.44, 0.47);
	const LINEA = rgb(0.86, 0.86, 0.84);
	const W = 595.28;
	const H = 841.89;
	const M = 48;
	doc.setTitle(`Dossier · ${d.alias}`);
	doc.setAuthor(taller);
	doc.setCreator('Novaz Dashboard');

	let p = doc.addPage([W, H]);
	let y = H - M;
	const texto = (t: string, x: number, yy: number, o: { f?: typeof normal; t?: number; c?: ReturnType<typeof rgb>; derecha?: boolean } = {}) => {
		const f = o.f ?? normal;
		const tam = o.t ?? 9.5;
		const s = limpio(t);
		p.drawText(s, { x: o.derecha ? x - f.widthOfTextAtSize(s, tam) : x, y: yy, size: tam, font: f, color: o.c ?? TINTA });
	};
	const pie = () => texto(`${taller} · Dossier de ${d.alias} · ${fechaLarga(hoy)}`, W / 2 - normal.widthOfTextAtSize(limpio(`${taller} · Dossier de ${d.alias} · ${fechaLarga(hoy)}`), 7.5) / 2, 24, { t: 7.5, c: GRIS });
	const nueva = () => {
		pie();
		p = doc.addPage([W, H]);
		p.drawRectangle({ x: 0, y: H - 5, width: W, height: 5, color: acento });
		y = H - M;
	};
	const sitio = (alto: number) => {
		if (y - alto < M + 10) nueva();
	};
	const titulo = (t: string) => {
		sitio(60);
		y -= 8;
		texto(t.toUpperCase(), M, y, { f: negrita, t: 11, c: acento });
		y -= 6;
		p.drawLine({ start: { x: M, y }, end: { x: W - M, y }, thickness: 0.8, color: LINEA });
		y -= 16;
	};
	const parrafo = (t: string, o: { f?: typeof normal; t?: number; c?: ReturnType<typeof rgb>; x?: number; ancho?: number } = {}) => {
		const tam = o.t ?? 9.5;
		for (const l of partir(t, o.f ?? normal, tam, o.ancho ?? W - 2 * M - (o.x ?? 0))) {
			sitio(tam + 4);
			texto(l, M + (o.x ?? 0), y, { f: o.f, t: tam, c: o.c });
			y -= tam + 3.5;
		}
	};

	// ─── Portada
	p.drawRectangle({ x: 0, y: H - 5, width: W, height: 5, color: acento });
	texto(taller.toUpperCase(), M, y, { f: negrita, t: 9, c: GRIS });
	texto('DOSSIER DEL VEHÍCULO', W - M, y, { f: negrita, t: 9, c: acento, derecha: true });
	y -= 48;
	texto(d.alias, M, y, { f: negrita, t: 34 });
	y -= 24;
	texto([d.marca, d.modelo, d.anio].filter(Boolean).join(' · ') || d.tipo, M, y, { t: 13, c: GRIS });
	y -= 26;
	const ficha = [
		d.matricula && ['Matrícula', d.matricula],
		d.bastidor && ['Bastidor', d.bastidor],
		d.km != null && ['Kilómetros', `${d.km.toLocaleString('es-ES')} km${d.kmFecha ? ` (${fechaLarga(d.kmFecha)})` : ''}`],
		['Intervenciones registradas', String(d.historial.length)],
		d.historial.length && ['Historial desde', fechaLarga(d.historial[d.historial.length - 1].fecha)]
	].filter(Boolean) as [string, string][];
	for (const [k, v] of ficha) {
		texto(k, M, y, { t: 9, c: GRIS });
		texto(v, M + 150, y, { f: negrita, t: 10 });
		y -= 16;
	}
	y -= 10;
	if (d.portada) {
		const img = await aJpeg(d.portada);
		if (img) {
			const jpg = await doc.embedJpg(img.bytes);
			const maxW = W - 2 * M;
			const maxH = y - M - 40;
			const k = Math.min(maxW / img.w, maxH / img.h);
			p.drawImage(jpg, { x: M + (maxW - img.w * k) / 2, y: y - img.h * k, width: img.w * k, height: img.h * k });
			y -= img.h * k + 10;
		}
	}

	// ─── Papeles al día
	if (d.papeles.length) {
		nueva();
		titulo('Papeles en vigor');
		for (const x of d.papeles) {
			sitio(16);
			texto(x.tipo, M, y, { t: 10 });
			texto(`hasta el ${fechaLarga(x.vence)}`, W - M, y, { t: 10, derecha: true, c: GRIS });
			y -= 16;
		}
	} else nueva();

	// ─── Ficha técnica (solo lo verificado)
	if (d.ficha.length) {
		titulo('Ficha técnica');
		for (const sec of d.ficha) {
			sitio(30);
			texto(sec.seccion, M, y, { f: negrita, t: 9.5, c: GRIS });
			y -= 14;
			for (const x of sec.datos) {
				sitio(14);
				texto(x.nombre, M + 8, y, { t: 9.5 });
				texto(x.valor, W - M, y, { f: negrita, t: 9.5, derecha: true });
				y -= 13;
				if (x.detalle) parrafo(x.detalle, { t: 8, c: GRIS, x: 8 });
			}
			y -= 6;
		}
	}

	// ─── Historial de mantenimiento
	if (d.historial.length) {
		titulo('Historial de mantenimiento y reparaciones');
		for (const e of d.historial) {
			const lineas = partir(e.titulo, negrita, 9.5, W - 2 * M - 160);
			const rev = e.revisiones.length ? partir(e.revisiones.join(' · '), normal, 8, W - 2 * M - 160) : [];
			sitio(lineas.length * 13 + rev.length * 11 + 10);
			texto(e.fecha.split('-').reverse().join('/'), M, y, { t: 9, c: GRIS });
			texto(e.km != null ? `${e.km.toLocaleString('es-ES')} km` : '', M + 62, y, { t: 9, c: GRIS });
			texto(CLASE[e.clase] ?? e.clase, W - M, y, { t: 8, c: GRIS, derecha: true });
			lineas.forEach((l, i) => texto(l, M + 140, y - i * 13, { f: negrita, t: 9.5 }));
			y -= lineas.length * 13;
			rev.forEach((l) => {
				texto(l, M + 140, y, { t: 8, c: GRIS });
				y -= 11;
			});
			p.drawLine({ start: { x: M, y: y + 3 }, end: { x: W - M, y: y + 3 }, thickness: 0.4, color: LINEA });
			y -= 9;
		}
	}

	// ─── Restauraciones
	if (d.restauraciones.length) {
		titulo('Restauración');
		for (const r of d.restauraciones) {
			sitio(40);
			texto(r.nombre, M, y, { f: negrita, t: 11 });
			y -= 14;
			parrafo([r.desde ? `Desde ${fechaLarga(r.desde)}` : null, r.hasta ? `hasta ${fechaLarga(r.hasta)}` : r.estado === 'terminada' ? null : '(en curso)', r.horas ? `${r.horas.toLocaleString('es-ES')} horas de trabajo` : null].filter(Boolean).join(' · '), { t: 9, c: GRIS });
			if (r.fases.length) parrafo(`Fases: ${r.fases.join(' · ')}`, { t: 9 });
			y -= 8;
		}
	}

	// ─── Costes (solo si se pide)
	if (d.costes && d.costes.total) {
		titulo('Inversión');
		for (const [cat, imp] of d.costes.porCategoria) {
			sitio(14);
			texto(cat, M, y, { t: 9.5 });
			texto(euros(imp), W - M, y, { t: 9.5, derecha: true });
			y -= 13;
		}
		sitio(18);
		y -= 4;
		texto('Total', M, y, { f: negrita, t: 10.5 });
		texto(euros(d.costes.total), W - M, y, { f: negrita, t: 10.5, derecha: true });
		y -= 18;
	}

	// ─── Fotos (dos por fila)
	if (d.fotos.length) {
		titulo('Fotos');
		const ancho = (W - 2 * M - 12) / 2;
		let col = 0;
		let filaAlto = 0;
		for (const f of d.fotos) {
			const img = await aJpeg(f.clave);
			if (!img) continue;
			const k = Math.min(ancho / img.w, 230 / img.h);
			const w = img.w * k;
			const h = img.h * k;
			if (col === 0) {
				sitio(h + 24);
				filaAlto = 0;
			}
			const jpg = await doc.embedJpg(img.bytes);
			const x = M + col * (ancho + 12);
			p.drawImage(jpg, { x: x + (ancho - w) / 2, y: y - h, width: w, height: h });
			if (f.pie) texto(partir(f.pie, normal, 7.5, ancho)[0], x, y - h - 10, { t: 7.5, c: GRIS });
			filaAlto = Math.max(filaAlto, h + (f.pie ? 16 : 6));
			col = (col + 1) % 2;
			if (col === 0) y -= filaAlto + 10;
		}
		if (col === 1) y -= filaAlto + 10;
	}

	pie();
	const bytes = await doc.save();
	return new Blob([bytes as BlobPart], { type: 'application/pdf' });
}
