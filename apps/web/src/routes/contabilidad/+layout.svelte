<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import Pestanas from '$comp/Pestanas.svelte';
	import { CalendarRange, Plus } from '@lucide/svelte';

	let { data, children } = $props();

	// Lo del día a día delante; los libros contables, juntos en una sola pestaña
	const SECCIONES = [
		['/contabilidad', 'Resumen'],
		['/contabilidad/tesoreria', 'Tesorería'],
		['/contabilidad/movimientos', 'Movimientos'],
		['/contabilidad/facturas', 'Facturas']
	] as const;
	const LIBROS = [
		['/contabilidad/diario', 'Libro diario'],
		['/contabilidad/mayor', 'Mayor'],
		['/contabilidad/resultados', 'Pérdidas y ganancias'],
		['/contabilidad/balance', 'Balance'],
		['/contabilidad/iva', 'IVA'],
		['/contabilidad/inmovilizado', 'Inmovilizado'],
		['/contabilidad/cuentas', 'Plan de cuentas']
	] as const;

	const sufijo = $derived(page.url.searchParams.has('ejercicio') ? `?ejercicio=${data.ejercicio}` : '');
	const enLibros = $derived(LIBROS.some(([href]) => page.url.pathname === href));
	const pestanas = $derived([
		...SECCIONES.map(([href, texto]) => ({ href: href + sufijo, texto, activa: page.url.pathname === href })),
		{ href: LIBROS[0][0] + sufijo, texto: 'Libros', activa: enLibros }
	]);

	function cambiarEjercicio(e: Event) {
		const u = new URL(page.url);
		u.searchParams.set('ejercicio', (e.currentTarget as HTMLSelectElement).value);
		u.searchParams.delete('mes');
		goto(u, { noScroll: true, keepFocus: true });
	}
</script>

<div class="mb-5 flex flex-wrap items-end justify-between gap-3">
	<div>
		<p class="etiqueta mb-1">Contabilidad · Plan General Contable</p>
		<h1 class="titulo-pagina">Dinero</h1>
	</div>
	<div class="flex items-center gap-2">
	<a href="/contabilidad/nuevo" class="btn btn-acento h-10"><Plus size={18} strokeWidth={2.4} /> Apuntar</a>
	<label class="chip h-10 cursor-pointer gap-2 px-3 text-sm">
		<CalendarRange size={16} class="text-texto-3" />
		<span class="text-texto-3">Ejercicio</span>
		<select value={data.ejercicio} onchange={cambiarEjercicio} class="cifra cursor-pointer appearance-none bg-transparent text-lg outline-none">
			{#each data.ejercicios as e (e)}<option value={e}>{e}</option>{/each}
		</select>
	</label>
	</div>
</div>

<Pestanas {pestanas} fija />
{#if enLibros}
	<nav class="-mx-4 mt-3 flex gap-1.5 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0" style="scrollbar-width:none" aria-label="Libros contables">
		{#each LIBROS as [href, texto] (href)}
			<a href={href + sufijo} class="chip h-8 shrink-0 px-3 text-xs font-semibold {page.url.pathname === href ? 'border-acento/60 bg-acento/10 text-texto' : 'text-texto-3'}" aria-current={page.url.pathname === href ? 'page' : undefined}>{texto}</a>
		{/each}
	</nav>
{/if}

<div class="mt-6 min-h-[60dvh]">
	{@render children()}
</div>
