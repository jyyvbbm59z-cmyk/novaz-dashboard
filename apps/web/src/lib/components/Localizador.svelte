<script lang="ts">
	// «¿Dónde está?» animado: el local → la zona → el mueble → la balda encendida con el nombre encima.
	import { codigoUbicacion, huella, MUEBLES, PLANO_LOCAL as P } from '@novaz/core';
	import type { Mueble, Zona } from '@novaz/core/schema';
	import { ArrowRight, RotateCcw, X } from '@lucide/svelte';
	import { prefersReducedMotion } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';
	import { fade, scale } from 'svelte/transition';
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

	// marcar: el plano entero con el mueble señalado → acercar: zoom directo a él → entrar: se abre → balda: escáner y fijar
	type Paso = 'marcar' | 'acercar' | 'entrar' | 'balda';
	let paso = $state<Paso>('marcar');
	let barrido = $state<number | null>(null);
	const mueble = $derived(muebles.find((m) => m.id === articulo.muebleId) ?? null);
	const zona = $derived(zonas.find((z) => z.id === (mueble ? mueble.zonaId : articulo.zonaId)) ?? null);
	const enfoque = $derived(paso === 'marcar' ? null : mueble ? huella(mueble) : zona);
	const pasos = $derived(
		[
			zona && { k: 'marcar' as Paso, t: `Zona ${zona.codigo} · ${zona.nombre}` },
			mueble && { k: 'acercar' as Paso, t: `${mueble.nombre} ${mueble.codigo}` },
			mueble && articulo.nivel && { k: 'balda' as Paso, t: `${MUEBLES[mueble.tipo].nivel} ${articulo.nivel}` }
		].filter(Boolean) as { k: Paso; t: string }[]
	);
	const orden: Paso[] = ['marcar', 'acercar', 'entrar', 'balda'];
	const llegado = (k: Paso) => orden.indexOf(paso) >= orden.indexOf(k);
	const final = $derived<Paso>(mueble ? (mueble.niveles > 0 ? 'balda' : 'acercar') : zona ? 'acercar' : 'marcar');
	const dentro = $derived(mueble && (paso === 'entrar' || paso === 'balda'));

	// El camino desde la persiana hasta el mueble (o la zona): baja por la calle y gira hacia él
	const ruta = $derived.by(() => {
		const destino = mueble ? huella(mueble) : zona;
		if (!destino) return null;
		const yF = (x: number) => P.fachada.izq.y + ((P.fachada.der.y - P.fachada.izq.y) * x) / P.ancho;
		const ex = (P.entrada.desde + P.entrada.hasta) / 2;
		const inicio = { x: ex, y: yF(ex) + 0.3 };
		const c = { x: destino.x + destino.ancho / 2, y: destino.y + destino.alto / 2 };
		const puntos = [inicio];
		if (c.y > P.fondo) {
			// Al cuarto trasero, por la puerta del fondo
			const px = (P.puertaFondo.desde + P.puertaFondo.hasta) / 2;
			puntos.push({ x: ex, y: P.fondo - 0.5 }, { x: px, y: P.fondo - 0.5 }, { x: px, y: c.y });
			return puntos;
		}
		const borde = !mueble ? c.x : destino.x > ex ? destino.x - 0.12 : destino.x + destino.ancho + 0.12;
		puntos.push({ x: ex, y: c.y }, { x: borde, y: c.y });
		return puntos;
	});

	let relojes: ReturnType<typeof setTimeout>[] = [];
	const luego = (ms: number, f: () => void) => relojes.push(setTimeout(f, ms));
	function parar() {
		relojes.forEach(clearTimeout);
		relojes = [];
	}
	function animar() {
		parar();
		barrido = null;
		if (prefersReducedMotion.current) return void (paso = final);
		paso = 'marcar';
		if (final === 'marcar') return;
		luego(1150, () => (paso = 'acercar'));
		if (final === 'acercar' || !mueble) return;
		luego(2150, () => (paso = 'entrar'));
		// Escáner: recorre las baldas de arriba a abajo y se clava en la buena
		const n = mueble.niveles;
		const objetivo = articulo.nivel && articulo.nivel <= n ? articulo.nivel : null;
		const vueltas = objetivo ? [...Array.from({ length: n }, (_, i) => i + 1), ...Array.from({ length: n - objetivo }, (_, i) => n - 1 - i)] : Array.from({ length: n }, (_, i) => i + 1);
		const t0 = 2750;
		const paso_ms = Math.max(70, Math.min(130, 900 / vueltas.length));
		vueltas.forEach((k, i) => luego(t0 + i * paso_ms, () => (barrido = k)));
		luego(t0 + vueltas.length * paso_ms + 60, () => {
			barrido = null;
			paso = 'balda';
		});
	}
	$effect(() => {
		void articulo.id;
		animar();
		return parar;
	});
	const saltar = () => {
		parar();
		barrido = null;
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
		<PlanoLocal {zonas} {muebles} {enfoque} {ruta} ping={mueble && paso !== 'balda' ? mueble.id : null} zonaSeleccionada={zona?.id ?? null} resaltados={mueble ? [mueble.id] : []} clase="max-h-[70dvh]" />
		{#if dentro && mueble}
			<div class="absolute inset-0 bg-superficie/85 backdrop-blur-sm" transition:fade={{ duration: prefersReducedMotion.current ? 0 : 350 }}></div>
			<div class="absolute inset-0 flex items-center justify-center p-4" transition:scale={{ start: 0.15, duration: prefersReducedMotion.current ? 0 : 600, easing: cubicOut, opacity: 0 }}>
				<FrenteMueble {mueble} {contenido} resaltar={paso === 'balda' ? articulo.nivel : null} {barrido} destacado={paso === 'balda' ? articulo.nombre : null} color={zona?.color} clase="h-full max-h-full w-auto max-w-full" />
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
