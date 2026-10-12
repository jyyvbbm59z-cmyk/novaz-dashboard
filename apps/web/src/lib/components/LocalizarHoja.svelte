<script lang="ts">
	// Tocar algo del inventario: hoja con la animación que lo localiza en el plano (zona → mueble → balda → caja).
	// Al cerrarla se vuelve a la lista tal cual; «Ver ficha» abre su detalle.
	import Hoja from '$comp/Hoja.svelte';
	import Localizador from '$comp/Localizador.svelte';
	import type { Contenedor, Mueble, Zona } from '@novaz/core/schema';
	import { FileText } from '@lucide/svelte';
	import { MediaQuery } from 'svelte/reactivity';

	type Art = { id: number; nombre: string; muebleId: number | null; nivel: number | null; zonaId: number | null; contenedorId: number | null; ubicacion: string | null };
	let {
		abierta = $bindable(false),
		articulo,
		articulos,
		plano,
		alVerFicha
	}: {
		abierta?: boolean;
		articulo: Art | null;
		/** Todo el inventario: para dibujar lo que hay en cada balda del mueble. */
		articulos: Art[];
		plano: { zonas: Zona[]; muebles: Mueble[]; contenedores: Contenedor[] };
		alVerFicha?: (id: number) => void;
	} = $props();

	const ancha = new MediaQuery('min-width: 1024px');
	const contenido = $derived.by(() => {
		const c: Record<number, string[]> = {};
		if (articulo?.muebleId) for (const a of articulos) if (a.muebleId === articulo.muebleId && !a.contenedorId) (c[a.nivel ?? 0] ??= []).push(a.nombre);
		return c;
	});
	const contenedores = $derived(articulo?.muebleId ? plano.contenedores.filter((c) => c.muebleId === articulo.muebleId) : []);
	const cuentaContenedor = $derived(articulos.reduce<Record<number, number>>((c, a) => (a.contenedorId ? { ...c, [a.contenedorId]: (c[a.contenedorId] ?? 0) + 1 } : c), {}));
</script>

<Hoja bind:abierta titulo="¿Dónde está?" ancho="max-w-3xl">
	{#if articulo}
		{#key articulo.id}
			<Localizador horizontal={ancha.current} {articulo} zonas={plano.zonas} muebles={plano.muebles} {contenido} {contenedores} {cuentaContenedor} />
		{/key}
		{#if alVerFicha}
			{@const id = articulo.id}
			<button class="btn mt-3 h-11 w-full" onclick={() => alVerFicha(id)}><FileText size={16} /> Ver ficha</button>
		{/if}
	{/if}
</Hoja>
