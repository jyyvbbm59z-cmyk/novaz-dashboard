// Compresión en el navegador antes de subir: ahorra datos móviles y espacio en R2.

async function aBlob(bmp: ImageBitmap, max: number, calidad: number): Promise<Blob> {
	const escala = Math.min(1, max / Math.max(bmp.width, bmp.height));
	const w = Math.round(bmp.width * escala);
	const h = Math.round(bmp.height * escala);
	const canvas = document.createElement('canvas');
	canvas.width = w;
	canvas.height = h;
	canvas.getContext('2d')!.drawImage(bmp, 0, 0, w, h);
	return new Promise((ok, ko) => canvas.toBlob((b) => (b ? ok(b) : ko(new Error('No se pudo comprimir'))), 'image/webp', calidad));
}

export async function prepararArchivo(f: File): Promise<{ archivo: File; mini: File | null }> {
	if (!f.type.startsWith('image/') || f.type === 'image/gif') return { archivo: f, mini: null };
	try {
		const bmp = await createImageBitmap(f, { imageOrientation: 'from-image' });
		const [grande, mini] = await Promise.all([aBlob(bmp, 2000, 0.82), aBlob(bmp, 480, 0.72)]);
		bmp.close();
		const base = f.name.replace(/\.[^.]+$/, '') || 'foto';
		return {
			archivo: grande.size < f.size ? new File([grande], `${base}.webp`, { type: 'image/webp' }) : f,
			mini: new File([mini], `${base}.mini.webp`, { type: 'image/webp' })
		};
	} catch {
		return { archivo: f, mini: null };
	}
}

export async function subirArchivo(
	f: File,
	destino: { entidad: string; entidadId: number; vehiculoId?: number | null; pie?: string }
): Promise<{ id: number; clave: string; url: string }> {
	const { archivo, mini } = await prepararArchivo(f);
	const fd = new FormData();
	fd.set('archivo', archivo);
	if (mini) fd.set('mini', mini);
	fd.set('entidad', destino.entidad);
	fd.set('entidadId', String(destino.entidadId));
	if (destino.vehiculoId) fd.set('vehiculoId', String(destino.vehiculoId));
	if (destino.pie) fd.set('pie', destino.pie);
	const r = await fetch('/api/adjuntos', { method: 'POST', body: fd });
	if (!r.ok) {
		const cuerpo = (await r.json().catch(() => null)) as { message?: string } | null;
		throw new Error(cuerpo?.message ?? `Error ${r.status}`);
	}
	return r.json();
}
