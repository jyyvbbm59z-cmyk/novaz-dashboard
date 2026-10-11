import { describe, expect, it } from 'vitest';
import { analizarUso, nombreHoja, normalizarRuta, type EventoUso } from '../src/uso';

const ev = (evento: string, o: Partial<EventoUso> = {}): EventoUso => ({ momento: '2026-10-11 10:00:00', ruta: '/', evento, nombre: null, duracionMs: null, datos: null, movil: true, ...o });

describe('uso de la app', () => {
	it('normaliza rutas y nombres de hoja', () => {
		expect(normalizarRuta('/flota/12', '?pestana=papeles&x=1')).toBe('/flota/[id]?pestana=papeles');
		expect(normalizarRuta('/restauraciones/3/fases/7')).toBe('/restauraciones/[id]/fases/[id]');
		expect(nombreHoja('Repostaje · Ibiza')).toBe('Repostaje');
		expect(nombreHoja('Gasto: Aislar la puerta')).toBe('Gasto');
	});

	it('mide la fricción de los formularios y la IA de tickets', () => {
		const a = analizarUso(
			[
				ev('hoja_abierta', { nombre: 'Repostaje · Ibiza' }),
				ev('hoja_completada', { nombre: 'Repostaje · Ibiza', duracionMs: 20000 }),
				ev('hoja_abierta', { nombre: 'Repostaje · Bandit' }),
				ev('hoja_abandonada', { nombre: 'Repostaje · Bandit' }),
				ev('hoja_abierta', { nombre: 'Nueva entrada' }),
				ev('hoja_completada', { nombre: 'Nueva entrada', duracionMs: 60000 }),
				ev('envio_error', { nombre: '?/repostaje', datos: { mensaje: 'Indica los litros', hoja: 'Repostaje · Ibiza' } }),
				ev('ticket_ok', { duracionMs: 4000 }),
				ev('ticket_error', { datos: { mensaje: 'No he podido leer el ticket' } }),
				ev('ticket_revisado', { datos: { corregidos: ['proveedor'] } }),
				ev('ticket_revisado', { datos: { corregidos: [] } }),
				ev('vista', { ruta: '/flota/[id]?pestana=papeles' }),
				ev('vista', { ruta: '/' })
			],
			['/', '/flota/[id]', '/agenda']
		);
		expect(a.formularios[0]).toMatchObject({ nombre: 'Repostaje', abiertas: 2, completadas: 1, abandonadas: 1, abandono: 0.5, errores: 1, medianaMs: 20000 });
		expect(a.errores[0]).toEqual({ nombre: 'Repostaje: Indica los litros', n: 1 });
		expect(a.ticket).toMatchObject({ lecturas: 1, fallos: 1, revisados: 2, corregidos: 1, campos: [{ nombre: 'proveedor', n: 1 }] });
		expect(a.sinUso).toEqual(['/agenda']);
	});
});
