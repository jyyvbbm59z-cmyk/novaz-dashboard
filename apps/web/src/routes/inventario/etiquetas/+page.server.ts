import { codigoUbicacion, CONTENEDORES, nombreNivel, ordenLetra } from '@novaz/core';
import { encode } from 'uqr';

/** QR en un trazo SVG (un módulo = 1 unidad). */
function qr(texto: string) {
	const { data, size } = encode(texto, { ecc: 'M', border: 0 });
	let d = '';
	for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) if (data[y][x]) d += `M${x} ${y}h1v1h-1z`;
	return { d, size };
}

/** Etiquetas para imprimir: una grande por mueble y una pequeña por balda/cajón, con QR a su ficha. */
export const load = async ({ parent, url }) => {
	const { plano } = await parent();
	const solo = Number(url.searchParams.get('mueble')) || null;
	const muebles = plano.muebles.filter((m) => !solo || m.id === solo);
	return {
		solo,
		etiquetas: muebles
			.map((m) => {
				const zona = plano.zonas.find((z) => z.id === m.zonaId) ?? null;
				const href = `${url.origin}/inventario/mueble/${m.id}`;
				return {
					id: m.id,
					codigo: codigoUbicacion(zona, m)!,
					nombre: m.nombre,
					zona: zona ? `Zona ${zona.codigo} · ${zona.nombre}` : '',
					color: zona?.color ?? '#777777',
					qr: qr(href),
					niveles: Array.from({ length: m.niveles > 1 ? m.niveles : 0 }, (_, i) => ({
						n: i + 1,
						codigo: codigoUbicacion(zona, m, i + 1)!,
						nombre: nombreNivel(m, i + 1),
						qr: qr(`${href}?nivel=${i + 1}`)
					})),
					contenedores: plano.contenedores
						.filter((c) => c.muebleId === m.id)
						.sort((a, b) => (a.nivel ?? 0) - (b.nivel ?? 0) || ordenLetra(a.letra, b.letra))
						.map((c) => ({ id: c.id, codigo: codigoUbicacion(zona, m, c.nivel, c)!, nombre: `${CONTENEDORES[c.tipo]} ${c.letra}${c.nombre ? ` · ${c.nombre}` : ''}`, qr: qr(`${url.origin}/inventario/contenedor/${c.id}`) }))
				};
			})
			.sort((a, b) => a.codigo.localeCompare(b.codigo, 'es'))
	};
};
