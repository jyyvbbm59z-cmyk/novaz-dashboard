// Notificaciones efímeras (toasts).
export type TipoAviso = 'ok' | 'error' | 'info';
interface Aviso {
	id: number;
	texto: string;
	tipo: TipoAviso;
}

let siguiente = 0;
export const avisos = $state<Aviso[]>([]);

export function avisar(texto: string, tipo: TipoAviso = 'ok', ms = 3200) {
	const id = ++siguiente;
	avisos.push({ id, texto, tipo });
	setTimeout(() => {
		const i = avisos.findIndex((a) => a.id === id);
		if (i >= 0) avisos.splice(i, 1);
	}, ms);
}
