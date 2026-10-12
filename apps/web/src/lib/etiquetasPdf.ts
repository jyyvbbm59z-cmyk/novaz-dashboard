// Etiquetas del inventario en PDF (A4): una grande por mueble y pequeñas por balda, cajón y contenedor, con su QR.
// Se genera en el navegador: en el móvil se abre y se imprime o comparte desde ahí (window.print no va en la app instalada).
import { hexARgb, limpio, partir } from './pdfComun';

type Qr = { d: string; size: number };
export interface EtiquetaPdf {
	codigo: string;
	nombre?: string;
	zona: string;
	color: string;
	qr: Qr;
	grande: boolean;
}

const MM = 72 / 25.4;

export async function pdfEtiquetas(etiquetas: EtiquetaPdf[]): Promise<Blob> {
	const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib');
	const doc = await PDFDocument.create();
	const sans = await doc.embedFont(StandardFonts.Helvetica);
	const negrita = await doc.embedFont(StandardFonts.HelveticaBold);
	const mono = await doc.embedFont(StandardFonts.CourierBold);
	const [W, H] = [210 * MM, 297 * MM];
	const margen = 8 * MM;
	const hueco = 3 * MM;
	let pagina = doc.addPage([W, H]);
	let x = margen;
	let y = margen; // desde arriba
	let altoFila = 0;

	for (const e of etiquetas) {
		const [ew, eh] = e.grande ? [90 * MM, 45 * MM] : [58 * MM, 22 * MM];
		// Como en la web: de izquierda a derecha y, si no cabe, a la fila siguiente (o a otra página)
		if (x + ew > W - margen) ((x = margen), (y += altoFila + hueco), (altoFila = 0));
		if (y + eh > H - margen) ((pagina = doc.addPage([W, H])), (x = margen), (y = margen), (altoFila = 0));
		const top = H - y;
		pagina.drawRectangle({ x, y: top - eh, width: ew, height: eh, color: rgb(1, 1, 1), borderColor: rgb(0.73, 0.73, 0.73), borderWidth: 0.8 });
		pagina.drawRectangle({ x, y: top - eh, width: 4 * MM, height: eh, color: hexARgb(e.color) });
		// QR a la derecha, con su margen blanco
		const qrTam = (e.grande ? 32 : 17) * MM;
		const qx = x + ew - qrTam - (e.grande ? 3 : 2) * MM;
		const qy = top - (eh - qrTam) / 2;
		pagina.drawSvgPath(e.qr.d, { x: qx, y: qy, scale: qrTam / e.qr.size, color: rgb(0, 0, 0) });
		// Textos entre la banda y el QR
		const tx = x + 4 * MM + 3 * MM;
		const ancho = qx - tx - 2 * MM;
		let tc = (e.grande ? 13 : 7) * MM * 0.82;
		while (tc > 6 && mono.widthOfTextAtSize(limpio(e.codigo), tc) > ancho) tc -= 0.5;
		const lineasNombre = e.nombre ? partir(e.nombre, negrita, 4 * MM, ancho).slice(0, 2) : [];
		const lineasZona = partir(e.zona, sans, 2.8 * MM, ancho).slice(0, e.grande ? 2 : 2);
		const altoTexto = tc + lineasNombre.length * 4.6 * MM + (lineasNombre.length ? 2 * MM : 0) + lineasZona.length * 3.3 * MM + 1 * MM;
		let ty = top - (eh - altoTexto) / 2 - tc;
		pagina.drawText(limpio(e.codigo), { x: tx, y: ty, size: tc, font: mono, color: rgb(0.07, 0.07, 0.07) });
		ty -= 2 * MM;
		for (const l of lineasNombre) {
			ty -= 4 * MM;
			pagina.drawText(l, { x: tx, y: ty, size: 4 * MM, font: negrita, color: rgb(0.07, 0.07, 0.07) });
			ty -= 0.6 * MM;
		}
		for (const l of lineasZona) {
			ty -= 3.3 * MM;
			pagina.drawText(l, { x: tx, y: ty, size: 2.8 * MM, font: sans, color: rgb(0.33, 0.33, 0.33) });
		}
		x += ew + hueco;
		altoFila = Math.max(altoFila, eh);
	}
	return new Blob([(await doc.save()) as Uint8Array<ArrayBuffer>], { type: 'application/pdf' });
}
