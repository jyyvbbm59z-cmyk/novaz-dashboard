// Utilidades de maquetación de PDF (pdf-lib) que sirven en el servidor y en el navegador.
import { rgb, type PDFFont } from 'pdf-lib';

// Las fuentes estándar solo codifican WinAnsi: lo demás se sustituye.
const EXTRA = new Set('€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ');
export const limpio = (s: string | null | undefined) =>
	(s ?? '')
		.replace(/ /g, ' ')
		.replace(/[^\n]/g, (c) => (c.charCodeAt(0) <= 0xff || EXTRA.has(c) ? c : '?'))
		.replace(/\t/g, ' ');

export function hexARgb(hex: string) {
	const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
	return m ? rgb(parseInt(m[1], 16) / 255, parseInt(m[2], 16) / 255, parseInt(m[3], 16) / 255) : rgb(0.95, 0.64, 0.23);
}

/** Parte un texto en líneas que caben en `ancho`. */
export function partir(texto: string, fuente: PDFFont, tam: number, ancho: number): string[] {
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
