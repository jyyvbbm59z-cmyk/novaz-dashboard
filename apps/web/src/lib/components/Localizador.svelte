<script lang="ts">
	// «¿Dónde está?» animado: el local → la zona → el mueble → la balda encendida con el nombre encima.
	import { codigoUbicacion, huella, MUEBLES } from '@novaz/core';
	import type { Mueble, Zona } from '@novaz/core/schema';
	import { ArrowRight, RotateCcw, X } from '@lucide/svelte';
	import { prefersReducedMotion } from 'svelte/motion';
	import { fade } from 'svelte/transition';
	import FrenteMueble from './FrenteMueble.svelte';
	import PlanoLocal from './PlanoLocal.svelte';

	let {
		articulo,
		zonas,
		muebles,
		contenido,
		alCerrar
	}: {
		articulo: { id: number; nombre: string; muebleId: number | null; nivel: number | null; zonaId: number | null; ubicacion: string | null };
		zonas: Zona[];
		muebles: Mueble[];
		/** Lo que hay en cada nivel del mueble (para dibujarlo). */
		contenido: Record<number, string[]>;
		alCerrar?: () => void;
	} = $props();

	type Paso = 'local' | 'zona' | 'mueble' | 'balda';
	let paso = $state<Paso>('local');
	const mueble = $derived(muebles.find((m) => m.id === articulo.muebleId) ?? null);
	const zona = $derived(zonas.find((z) => z.id === (mueble ? mueble.zonaId : articulo.zonaId)) ?? null);
	const enfoque = $derived(paso === 'local' ? null : paso === 'zona' || !mueble ? zona : huella(mueble));
	const pasos = $derived(
		[
			zona && { k: 'zona' as Paso, t: `Zona ${zona.codigo} · ${zona.nombre}` },
			mueble && { k: 'mueble' as Paso, t: `${mueble.nombre} ${mueble.codigo}` },
			mueble && articulo.nivel && { k: 'balda' as Paso, t: `${MUEBLES[mueble.tipo].nivel} ${articulo.nivel}` }
		].filter(Boolean) as { k: Paso; t: string }[]
	);
	const orden: Paso[] = ['local', 'zona', 'mueble', 'balda'];
	const llegado = (k: Paso) => orden.indexOf(paso) >= orden.indexOf(k);
	const final = $derived<Paso>(mueble ? (articulo.nivel || mueble.niveles > 0 ? 'balda' : 'mueble') : zona ? 'zona' : 'local');

	let relojes: ReturnType<typeof setTimeout>[] = [];
	function animar() {
		relojes.forEach(clearTimeout);
		relojes = [];
		if (prefersReducedMotion.current) return void (paso = final);
		paso = 'local';
		const secuencia = orden.slice(1, orden.indexOf(final) + 1);
		secuencia.forEach((p, i) => relojes.push(setTimeout(() => (paso = p), 350 + i * 1050)));
	}
	$effect(() => {
		void articulo.id;
		animar();
		return () => relojes.forEach(clearTimeout);
	});
	const saltar = () => {
		relojes.forEach(clearTimeout);
		paso = final;
	};
</script>

<div class="flex flex-col gap-2">
	<!-- Lo que se busca y el código -->
	<div class="flex items-center gap-3 px-1">
		<span class="rounded-lg px-2.5 py-1 font-mono text-lg font-extrabold text-white transition-opacity duration-500 {llegado(final) ? 'opacity-100' : 'opacity-40'}" style="background: {zona?.color ?? 'var(--texto-3)'}">
			{codigoUbicacion(zona, mueble, articulo.nivel) ?? '¿?'}
		</span>
		<p class="min-w-0 flex-1 truncate text-sm font-semibold">{articulo.nombre}</p>
		<button class="btn btn-fantasma btn-icono h-8 w-8" onclick={animar} aria-label="Repetir" title="Repetir"><RotateCcw size={15} /></button>
		{#if alCerrar}<button class="btn btn-fantasma btn-icono h-8 w-8" onclick={alCerrar} aria-label="Cerrar" title="Cerrar"><X size={16} /></button>{/if}
	</div>

	<!-- Escenario: el plano con zoom y, al final, el mueble de frente -->
	<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
	<div class="relative overflow-hidden rounded-lg" onclick={saltar}>
		<PlanoLocal {zonas} {muebles} {enfoque} zonaSeleccionada={paso !== 'local' ? (zona?.id ?? null) : null} resaltados={mueble && llegado('mueble') ? [mueble.id] : []} clase="max-h-[70dvh]" />
		{#if paso === 'balda' && mueble}
			<div class="absolute inset-0 flex items-center justify-center bg-superficie/85 p-4 backdrop-blur-sm" transition:fade={{ duration: prefersReducedMotion.current ? 0 : 450 }}>
				<FrenteMueble {mueble} {contenido} resaltar={articulo.nivel} destacado={articulo.nombre} color={zona?.color} clase="h-full max-h-full w-auto max-w-full" />
			</div>
		{/if}
		{#if paso !== final}<p class="pointer-events-none absolute right-2 bottom-2 rounded bg-superficie/80 px-2 py-0.5 text-[0.65rem] text-texto-3">Toca para saltar</p>{/if}
	</div>

	<!-- Migas: se encienden según llega -->
	<ol class="flex flex-wrap items-center gap-1.5 px-1 text-xs">
		{#each pasos as p, i (p.k)}
			{#if i}<ArrowRight size={12} class="text-texto-3" />{/if}
			<li class="chip h-7 px-2.5 transition-all duration-500 {llegado(p.k) ? 'border-acento/60 bg-acento/10 font-semibold text-texto' : 'text-texto-3 opacity-50'}">{p.t}</li>
		{:else}
			<li class="text-texto-3">Aún no tiene sitio en el plano{articulo.ubicacion ? ` (apuntado: ${articulo.ubicacion})` : ''}.</li>
		{/each}
	</ol>
	{#if mueble}
		<a href="/inventario/mueble/{mueble.id}?articulo={articulo.id}" class="btn h-10 text-sm">Abrir {mueble.codigo} · {mueble.nombre} <ArrowRight size={15} /></a>
	{/if}
</div>
