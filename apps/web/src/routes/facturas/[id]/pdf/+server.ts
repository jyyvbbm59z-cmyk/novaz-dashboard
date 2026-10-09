import { numeroFactura } from '@novaz/core';
import * as s from '@novaz/core/schema';
import { error } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { logoFactura } from '$lib/server/logo';
import { pdfFactura } from '$lib/server/pdf';

export const GET = async ({ params, locals, url, platform }) => {
	const f = await locals.db.select().from(s.facturas).where(eq(s.facturas.id, Number(params.id))).get();
	if (!f) error(404, 'Factura no encontrada');
	const bytes = await pdfFactura(f, locals.ajustes, await logoFactura(locals, platform!.env.ARCHIVOS));
	const nombre = `${f.tipo === 'factura' ? 'Factura' : 'Informe'} ${numeroFactura(f.serie, f.anio, f.numero)}${f.anulada ? ' (ANULADA)' : ''}.pdf`;
	const cuerpo = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
	return new Response(cuerpo, {
		headers: {
			'content-type': 'application/pdf',
			'content-disposition': `${url.searchParams.has('descargar') ? 'attachment' : 'inline'}; filename*=UTF-8''${encodeURIComponent(nombre)}`,
			'cache-control': 'private, no-store'
		}
	});
};
