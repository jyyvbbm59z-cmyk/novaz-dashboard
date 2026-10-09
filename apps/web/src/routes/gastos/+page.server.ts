import { redirect } from '@sveltejs/kit';

// Los gastos viven ahora en Contabilidad → Movimientos.
export const load = ({ url }) => redirect(308, `/contabilidad/movimientos${url.search}`);
