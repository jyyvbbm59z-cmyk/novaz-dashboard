// Logo de las facturas: el que subas en Ajustes (R2) o, si no, el de Novaz incluido en la app.
import logoNovaz from './recursos/logo-factura.png?inline';

function desdeDataUrl(url: string): Uint8Array {
	const b64 = url.slice(url.indexOf(',') + 1);
	const bin = atob(b64);
	const bytes = new Uint8Array(bin.length);
	for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
	return bytes;
}

export async function logoFactura(locals: App.Locals, bucket: R2Bucket): Promise<{ bytes: Uint8Array; tipo: string } | null> {
	const { logoFactura: conf } = locals.ajustes;
	if (conf === 'ninguno') return null;
	if (conf && conf !== 'novaz') {
		const obj = await bucket.get(conf);
		if (obj) return { bytes: new Uint8Array(await obj.arrayBuffer()), tipo: obj.httpMetadata?.contentType ?? 'image/png' };
	}
	return { bytes: desdeDataUrl(logoNovaz), tipo: 'image/png' };
}
