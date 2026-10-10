import { redirect } from '@sveltejs/kit';

// La lista de la compra ahora vive en /compras
export const load = () => redirect(308, '/compras');
