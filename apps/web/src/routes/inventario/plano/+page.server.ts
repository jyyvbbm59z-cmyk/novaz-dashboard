import { accion, ErrorFormulario, leer } from '$lib/server/form';
import { altaEnSitio, borrarContenedor, borrarMueble, guardarContenedor, guardarMueble, guardarZona, moverMueble, ubicarArticulos } from '$lib/server/ubicaciones';

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
		await ubicarArticulos(locals, ids, { muebleId: f.idOpcional('muebleId'), nivel: f.entero('nivel'), zonaId: f.idOpcional('zonaId'), contenedorId: f.idOpcional('contenedorId') });
		return { mensaje: ids.length === 1 ? 'Ubicado' : `${ids.length} ubicados` };
	}),
	/** Alta rápida: lo que hay en una balda (foto o lista) de una vez. */
	alta: accion(async ({ request, locals }) => {
		const f = leer(await request.formData());
		let objetos: Parameters<typeof altaEnSitio>[1] = [];
		try {
			const crudo = JSON.parse(f.texto('objetos') ?? '[]');
			if (Array.isArray(crudo))
				objetos = crudo.slice(0, 100).map((o) => ({
					nombre: String(o?.nombre ?? ''),
					marca: o?.marca ? String(o.marca) : null,
					cantidad: Number(o?.cantidad) || 1,
					tipo: String(o?.tipo ?? 'herramienta'),
					categoria: o?.categoria ? String(o.categoria) : null,
					moverId: Number.isInteger(Number(o?.moverId)) && Number(o?.moverId) > 0 ? Number(o.moverId) : null
				}));
		} catch {
			throw new ErrorFormulario('Lista mal formada');
		}
		if (!objetos.length) throw new ErrorFormulario('No hay nada que guardar');
		const r = await altaEnSitio(locals, objetos, { muebleId: f.idOpcional('muebleId'), nivel: f.entero('nivel'), zonaId: f.idOpcional('zonaId'), contenedorId: f.idOpcional('contenedorId') });
		return { mensaje: [r.creados ? `${r.creados} ${r.creados === 1 ? 'nuevo' : 'nuevos'}` : '', r.movidos ? `${r.movidos} ${r.movidos === 1 ? 'movido' : 'movidos'}` : ''].filter(Boolean).join(' y ') + ' en su sitio', ...r };
	}),
	contenedor: accion(async ({ request, locals }) => {
		const fd = await request.formData();
		const nuevo = !leer(fd).idOpcional('id');
		const contenedorId = await guardarContenedor(locals, fd);
		return { mensaje: nuevo ? 'Contenedor añadido' : 'Contenedor guardado', contenedorId };
	}),
	borrarContenedor: accion(async ({ request, locals }) => {
		await borrarContenedor(locals, leer(await request.formData()).id('id'));
		return { mensaje: 'Contenedor quitado. Lo que tenía se queda suelto en la balda' };
	})
};
