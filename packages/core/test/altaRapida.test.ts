import { describe, expect, it } from 'vitest';
import { articuloExistente, normalizarObjetos, parsearLista } from '../src/altaRapida';

describe('alta rápida', () => {
	it('lista escrita con cantidades', () => {
		const l = parsearLista('3x Llave fija 13\nAlicates de punta x2\n- Polímetro\nCinta americana (4)\n2 destornilladores planos');
		expect(l.map((o) => [o.nombre, o.cantidad])).toEqual([
			['Llave fija 13', 3],
			['Alicates de punta', 2],
			['Polímetro', 1],
			['Cinta americana', 4],
			['Destornilladores planos', 2]
		]);
		expect(parsearLista('lija 400, lija 800, guantes').length).toBe(3);
		expect(parsearLista('Cinta americana\nFiltro de aceite HF138\nLlave fija 13').map((o) => o.tipo)).toEqual(['consumible', 'recambio', 'herramienta']);
	});
	it('la IA: limpia, tipos válidos y suma repetidos', () => {
		const o = normalizarObjetos({ objetos: [{ nombre: 'taladro percutor', marca: 'DeWalt', cantidad: 1, tipo: 'herramienta' }, { nombre: 'Taladro percutor', marca: 'dewalt', cantidad: 1 }, { nombre: ' ', cantidad: 3 }, { nombre: 'Spray', marca: 'Desconocida', tipo: 'raro' }] });
		expect(o).toEqual([
			{ nombre: 'Taladro percutor', marca: 'DeWalt', cantidad: 2, tipo: 'herramienta', categoria: null },
			{ nombre: 'Spray', marca: null, cantidad: 1, tipo: 'consumible', categoria: null }
		]);
	});
	it('reconoce lo que ya está en el inventario', () => {
		const arts = [{ id: 4, nombre: 'Atornillador de impacto DeWalt', marca: 'DeWalt' }];
		expect(articuloExistente({ nombre: 'atornillador de impacto dewalt', marca: null }, arts)?.id).toBe(4);
		expect(articuloExistente({ nombre: 'Atornillador de impacto DeWalt', marca: 'Makita' }, arts)).toBeNull();
	});
});
