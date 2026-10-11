import { accion, ErrorFormulario, leer } from '$lib/server/form';
import { borrarMueble, guardarMueble, guardarZona, moverMueble, ubicarArticulos } from '$lib/server/ubicaciones';

export const actions = {
	mueble: accion(async ({ request, locals }) => {
		const fd = await request.formData();
		const nuevo = !leer(fd).idOpcional('id');
		const muebleId = await guardarMueble(locals, fd);
		return { mensaje: nuevo ? 'Mueble colocado' : 'Mueble guardado', muebleId };
	}),
	mover: accion(async ({ request, locals }) => {
		const f = leer(await request.formData());
		const x = f.decimal('x');
		const y = f.decimal('y');
		if (x == null || y == null) throw new ErrorFormulario('Posición no válida');
		await moverMueble(locals, f.id('id'), x, y);
		return {};
	}),
	borrarMueble: accion(async ({ request, locals }) => {
		await borrarMueble(locals, leer(await request.formData()).id('id'));
		return { mensaje: 'Mueble quitado. Lo que tenía se queda en su zona, sin ubicar' };
	}),
	zona: accion(async ({ request, locals }) => {
		await guardarZona(locals, await request.formData());
		return { mensaje: 'Zona guardada' };
	}),
	ubicar: accion(async ({ request, locals }) => {
		const f = leer(await request.formData());
		const ids = (f.texto('ids') ?? '').split(',').map(Number).filter(Number.isInteger);
		await ubicarArticulos(locals, ids, { muebleId: f.idOpcional('muebleId'), nivel: f.entero('nivel'), zonaId: f.idOpcional('zonaId') });
		return { mensaje: ids.length === 1 ? 'Ubicado' : `${ids.length} ubicados` };
	})
};
