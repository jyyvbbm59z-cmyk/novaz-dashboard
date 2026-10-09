import { error } from '@sveltejs/kit';
import { logoFactura } from '$lib/server/logo';

// Vista previa del logo que se usará en las facturas.
export const GET = async ({ locals, platform }) => {
	const logo = await logoFactura(locals, platform!.env.ARCHIVOS);
	if (!logo) error(404, 'Sin logo');
	const cuerpo = logo.bytes.buffer.slice(logo.bytes.byteOffset, logo.bytes.byteOffset + logo.bytes.byteLength) as ArrayBuffer;
	return new Response(cuerpo, { headers: { 'content-type': logo.tipo, 'cache-control': 'private, no-store' } });
};
