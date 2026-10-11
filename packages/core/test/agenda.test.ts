import { describe, expect, it } from 'vitest';
import type { Alerta } from '../src/consultas';
import { eventosAgenda, sesionesRecomendadas } from '../src/agenda';
import { analizarMejora, planesCubiertos } from '../src/mejoras';

const HOY = '2026-10-11';
const al = (o: Partial<Alerta>): Alerta => ({ clave: 'x', tipo: 'mantenimiento', vehiculoId: 5, vehiculo: 'Ibiza', matricula: null, titulo: 'x', detalle: '', nivel: 'ok', dias: 100, kmRestantes: null, avisosDias: [30], ciclo: '1', ...o });
const plan = (id: number, o: Partial<{ tareas: string[]; incluye: number[]; cadaDias: number | null; cadaMeses: number | null; cadaKm: number | null }> = {}) => ({ id, tareas: [], incluye: [], cadaDias: null, cadaMeses: 12, cadaKm: 15000, ...o });

describe('agenda', () => {
	it('junta papeles (con lo que costarán), revisiones, el local y lo que se repite', () => {
		const ev = eventosAgenda({
			hoy: HOY,
			alertas: [
				al({ clave: 'venc:3', tipo: 'vencimiento', titulo: 'Seguro', dias: 165 }),
				al({ clave: 'mant:5:2', planId: 2, titulo: 'C2 · Aceite', dias: 93, kmRestantes: 9000 }),
				al({ clave: 'mant:5:1', planId: 1, titulo: 'C1 · Mensual', dias: 20 }),
				al({ clave: 'venc:9', tipo: 'vencimiento', titulo: 'ITV', dias: 500 })
			],
			importesPapel: new Map([[3, 26901]]),
			planes: [plan(2), plan(1, { cadaMeses: 1, cadaKm: null })],
			tareasLocal: [{ id: 1, titulo: 'Pintar', zona: null, fechaLimite: '2026-11-01' }],
			recurrentes: [{ id: 1, dia: 1, desde: '2026-01-01', hasta: null, ultimaGenerada: '2026-10-01', activo: true, concepto: 'Aportación', tipo: 'aportacion', importeCent: 15000 }]
		});
		expect(ev.find((e) => e.titulo === 'Seguro')).toMatchObject({ fecha: '2027-03-25', importeCent: -26901, estimado: true });
		expect(ev.find((e) => e.titulo === 'C2 · Aceite')).toMatchObject({ fecha: '2027-01-12', estimado: true });
		expect(ev.some((e) => e.titulo === 'C1 · Mensual')).toBe(false); // rutinario
		expect(ev.some((e) => e.titulo === 'ITV')).toBe(false); // fuera de los 12 meses
		expect(ev.filter((e) => e.tipo === 'recurrente')).toHaveLength(12);
		expect(ev[0].titulo).toBe('Aportación'); // 1 nov
	});
});

describe('sesiones recomendadas', () => {
	const planes = [plan(2, { tareas: ['Cambiar aceite', 'Cambiar filtro de aceite'] }), plan(3, { tareas: ['Inspección'], incluye: [2] }), plan(4, { tareas: ['Cambiar líquido de frenos'], cadaKm: null, cadaMeses: 24 }), plan(5)];

	it('adelanta lo que vence en 60 días o 1.500 km y junta las piezas', () => {
		const s = sesionesRecomendadas(
			[
				al({ planId: 2, titulo: 'C2 · Aceite', nivel: 'pronto', dias: 10 }),
				al({ planId: 4, titulo: 'C4 · Frenos', dias: 50, detalle: 'toca el 30 nov' }),
				al({ planId: 5, titulo: 'C5 · Filtros', dias: 400, kmRestantes: 1200 }),
				al({ planId: 3, titulo: 'C3', dias: 300 })
			],
			planes,
			HOY
		);
		expect(s).toHaveLength(1);
		expect(s[0].fecha).toBe('2026-10-21');
		expect(s[0].adelantar.map((a) => a.planId)).toEqual([4, 5]);
		expect(s[0].piezas).toContain('Filtro de aceite');
	});

	it('nada que juntar: no hay sesión; ITV cerca: revisión previa aunque no toque nada', () => {
		expect(sesionesRecomendadas([al({ planId: 2, nivel: 'pronto', dias: 10 })], planes, HOY)).toHaveLength(0);
		const s = sesionesRecomendadas([al({ planId: 2, dias: 200 }), al({ clave: 'venc:1', tipo: 'vencimiento', titulo: 'ITV', dias: 10, vehiculo: 'Bandit', vehiculoId: 1 })], planes, HOY);
		expect(s[0]).toMatchObject({ vehiculo: 'Bandit', fecha: '2026-10-14', tocan: [] });
		expect(s[0].antesDeItv).toMatch(/ITV/);
	});
});

describe('mejoras', () => {
	const ibiza = { notas: 'Neumáticos homologados: 185/60 R15 84H (de serie) · 215/45 R16 86H/86V · 215/40 R17 87V XL', campos: { neumaticos: '185/60 R15 84H' } };

	it('ruedas de 17: medida homologada en la ficha, tareas y revisiones nuevas', () => {
		const a = analizarMejora('Ruedas de 17"', ibiza);
		expect(a.avisos[0]).toMatch(/215\/40 R17.*no necesitas reforma/);
		expect(a.medidaNeumatico).toBe('215/40 R17');
		expect(a.tareas).toContain('Alinear la dirección');
		expect(a.revisiones.map((r) => r.nombre)).toContain('Neumáticos: rotación y desgaste');
	});

	it('medida que no está en la ficha', () => {
		expect(analizarMejora('Neumáticos 225/35 R18', ibiza).avisos[0]).toMatch(/no figura en tu ficha/);
	});

	it('amortiguadores deportivos: aviso de reforma si baja, revisión de suspensión', () => {
		const a = analizarMejora('Amortiguadores deportivos Bilstein B6', ibiza);
		expect(a.componentes).toEqual(['Suspensión']);
		expect(a.avisos[0]).toMatch(/no es reforma/);
		expect(a.revisiones[0].cadaKm).toBe(20000);
	});

	it('cubre los planes dedicados a ese componente', () => {
		expect(planesCubiertos('Ruedas de 17', [{ id: 1, nombre: 'Neumáticos: rotación y desgaste' }, { id: 2, nombre: 'Aceite y filtro' }])).toEqual([1]);
	});
});
