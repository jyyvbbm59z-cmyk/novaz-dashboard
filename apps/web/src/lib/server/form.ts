import { esFechaISO, parsearEuros } from '@novaz/core';
import { fail } from '@sveltejs/kit';

// Lectura tipada de FormData. Vacío → null.
export function leer(fd: FormData) {
	const s = (k: string) => {
		const v = fd.get(k);
		return typeof v === 'string' && v.trim() !== '' ? v.trim() : null;
	};
	return {
		texto: s,
		obligatorio(k: string, nombre = k) {
			const v = s(k);
			if (v == null) throw new ErrorFormulario(`Falta: ${nombre}`);
			return v;
		},
		entero(k: string) {
			const v = s(k);
			if (v == null) return null;
			const n = Number(v.replace(/\./g, '').replace(',', '.'));
			if (!Number.isFinite(n)) throw new ErrorFormulario(`Número no válido: ${k}`);
			return Math.round(n);
		},
		decimal(k: string) {
			const v = s(k);
			if (v == null) return null;
			const n = Number(v.replace(',', '.'));
			if (!Number.isFinite(n)) throw new ErrorFormulario(`Número no válido: ${k}`);
			return n;
		},
		fecha(k: string) {
			const v = s(k);
			if (v == null) return null;
			if (!esFechaISO(v)) throw new ErrorFormulario(`Fecha no válida: ${k}`);
			return v;
		},
		euros(k: string) {
			const v = s(k);
			if (v == null) return null;
			const c = parsearEuros(v);
			if (c == null) throw new ErrorFormulario(`Importe no válido: ${v}`);
			return c;
		},
		bool: (k: string) => ['on', 'true', '1', 'si'].includes(String(fd.get(k) ?? '')),
		id(k: string) {
			const v = s(k);
			const n = v == null ? NaN : Number(v);
			if (!Number.isInteger(n)) throw new ErrorFormulario(`Falta ${k}`);
			return n;
		},
		idOpcional(k: string) {
			const v = s(k);
			if (v == null) return null;
			const n = Number(v);
			return Number.isInteger(n) ? n : null;
		},
		lista: (k: string) => fd.getAll(k).filter((v): v is string => typeof v === 'string' && v !== '')
	};
}

export class ErrorFormulario extends Error {}

/** Envuelve una acción para convertir ErrorFormulario en `fail(400)`. */
export function accion<E, R>(fn: (e: E) => Promise<R>) {
	return async (e: E) => {
		try {
			return await fn(e);
		} catch (err) {
			if (err instanceof ErrorFormulario) return fail(400, { error: err.message });
			throw err;
		}
	};
}
