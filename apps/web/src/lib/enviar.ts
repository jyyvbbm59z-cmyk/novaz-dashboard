// `use:enhance` con avisos y momentos: las acciones devuelven { mensaje?, momento? }.
import { applyAction, deserialize } from '$app/forms';
import { invalidateAll } from '$app/navigation';
import type { SubmitFunction } from '@sveltejs/kit';
import type { EventoMomento } from '@novaz/core';
import { avisar } from './avisos.svelte';
import { dispararMomento } from './momentos';

export function enviar(opts: { alTerminar?: (datos: Record<string, unknown>) => void; reset?: boolean } = {}): SubmitFunction {
	return ({ formElement, submitter }) => {
		const botones = formElement.querySelectorAll<HTMLButtonElement>('button[type=submit], button:not([type])');
		botones.forEach((b) => (b.disabled = true));
		return async ({ result, update }) => {
			botones.forEach((b) => (b.disabled = false));
			if (result.type === 'success') {
				const datos = (result.data ?? {}) as Record<string, unknown>;
				await update({ reset: opts.reset ?? true });
				if (typeof datos.mensaje === 'string') avisar(datos.mensaje);
				if (typeof datos.momento === 'string') dispararMomento(datos.momento as EventoMomento, submitter ?? formElement);
				opts.alTerminar?.(datos);
			} else if (result.type === 'failure') {
				const datos = (result.data ?? {}) as Record<string, unknown>;
				avisar(typeof datos.error === 'string' ? datos.error : 'Revisa los datos', 'error', 4500);
				await update({ reset: false });
			} else if (result.type === 'error') {
				avisar(result.error?.message ?? 'Algo ha fallado', 'error', 5000);
			} else {
				await applyAction(result);
			}
		};
	};
}

/** Envío programático de una acción (por ejemplo al marcar un checkbox). */
export async function accion(ruta: string, campos: Record<string, string | number | boolean>, el?: Element | null) {
	const fd = new FormData();
	for (const [k, v] of Object.entries(campos)) fd.set(k, String(v));
	const res = await fetch(ruta, { method: 'POST', body: fd, headers: { 'x-sveltekit-action': 'true' } });
	const result = deserialize(await res.text());
	if (result.type === 'success') {
		const datos = (result.data ?? {}) as Record<string, unknown>;
		if (typeof datos.mensaje === 'string') avisar(datos.mensaje);
		if (typeof datos.momento === 'string') dispararMomento(datos.momento as EventoMomento, el);
		await invalidateAll();
		return datos;
	}
	if (result.type === 'failure') avisar(String((result.data as Record<string, unknown>)?.error ?? 'Error'), 'error');
	else if (result.type === 'error') avisar('Algo ha fallado', 'error');
	return null;
}
