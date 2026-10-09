<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import Hoja from '$comp/Hoja.svelte';
	import MovimientoForm from '$comp/MovimientoForm.svelte';
	import { accion } from '$lib/enviar';
	import { ETIQUETA_PAGO, euros, fechaLarga } from '@novaz/core';
	import type { Movimiento } from '@novaz/core/schema';
	import { Download, Pencil, Plus, Trash2 } from '@lucide/svelte';

	let { data } = $props();
	const f = $derived(data.filtros);
	const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
	const maxMes = $derived(Math.max(1, ...data.meses.map((m) => m.gasto)));

	let hMov = $state(false);
	let edit = $state<Movimiento | null>(null);
	let sobre = $state<number | null>(null);

	function filtrar(clave: string, valor: string | null) {
		const u = new URL(page.url);
		if (valor) u.searchParams.set(clave, valor);
		else u.searchParams.delete(clave);
		goto(u, { keepFocus: true, noScroll: true, replaceState: true });
	}
	async function borrar(id: number) {
		if (confirm('¿Borrar este movimiento?')) await accion('?/borrar', { id });
	}
	const csv = $derived(`/contabilidad/movimientos/csv${page.url.search}`);
	const balance = $derived(data.totales.ingreso - data.totales.gasto);
</script>

<svelte:head><title>Movimientos · {data.ajustes.nombreTaller}</title></svelte:head>

<!-- Filtros -->
<div class="mb-5 flex flex-wrap gap-2">
	<select class="input h-9 w-auto text-sm" value={f.tipo ?? ''} onchange={(e) => filtrar('tipo', e.currentTarget.value)}>
		<option value="">Gastos e ingresos</option><option value="gasto">Solo gastos</option><option value="ingreso">Solo ingresos</option>
	</select>
	<select class="input h-9 w-auto text-sm" value={String(f.categoria ?? '')} onchange={(e) => filtrar('categoria', e.currentTarget.value)}>
		<option value="">Todas las categorías</option>
		{#each data.catalogo.categorias as c (c.id)}<option value={String(c.id)}>{c.nombre}</option>{/each}
	</select>
	<select class="input h-9 w-auto text-sm" value={f.vehiculo ?? ''} onchange={(e) => filtrar('vehiculo', e.currentTarget.value)}>
		<option value="">Todos los vehículos</option>
		<option value="general">General del taller</option>
		{#each data.vehiculosMenu as v (v.id)}<option value={String(v.id)}>{v.alias}</option>{/each}
	</select>
	{#if f.mes}<button class="chip h-9 border-acento px-3" onclick={() => filtrar('mes', null)}>{MESES[Number(f.mes) - 1]} ✕</button>{/if}
	<span class="ml-auto flex gap-2">
		<a href={csv} class="btn btn-icono h-9 sm:w-auto sm:px-3" aria-label="Exportar CSV" download><Download size={16} /><span class="hidden sm:inline">CSV</span></a>
		<button class="btn btn-acento h-9" onclick={() => ((edit = null), (hMov = true))}><Plus size={16} /> Nuevo</button>
	</span>
</div>

<!-- Resumen -->
<section class="grid grid-cols-3 gap-3">
	<div class="tarjeta p-4"><p class="etiqueta">Gastos</p><p class="cifra mt-1 text-2xl sm:text-4xl">{euros(data.totales.gasto, { redondo: true })}</p></div>
	<div class="tarjeta p-4"><p class="etiqueta">Ingresos</p><p class="cifra mt-1 text-2xl sm:text-4xl">{euros(data.totales.ingreso, { redondo: true })}</p></div>
	<div class="tarjeta p-4"><p class="etiqueta">Balance</p><p class="cifra mt-1 text-2xl sm:text-4xl {balance < 0 ? 'nivel-vencido' : 'nivel-ok'}">{euros(balance, { redondo: true })}</p></div>
</section>

<!-- Gasto por mes: una serie, barras finas; clic = filtrar el mes -->
<section class="tarjeta mt-3 p-4 sm:p-5">
	<p class="etiqueta mb-4">Gasto por mes · {f.anio}{f.mes ? '' : ' · toca un mes para filtrar'}</p>
	<div class="relative">
		<div class="grid h-36 grid-cols-12 items-end gap-1.5 border-b border-borde sm:gap-3">
			{#each data.meses as m, i (m.mes)}
				<button
					class="group relative flex h-full flex-col justify-end px-0.5 sm:px-2"
					onmouseenter={() => (sobre = i)}
					onmouseleave={() => (sobre = null)}
					onfocus={() => (sobre = i)}
					onblur={() => (sobre = null)}
					onclick={() => filtrar('mes', f.mes === m.mes ? null : m.mes)}
					aria-label="{MESES[i]}: {euros(m.gasto)}"
				>
					<span
						class="block w-full rounded-t-[4px] transition-opacity"
						style="height: {m.gasto ? Math.max(2, (m.gasto / maxMes) * 100) : 0}%; background: var(--acento); opacity: {f.mes && f.mes !== m.mes ? 0.3 : sobre === i || f.mes === m.mes ? 1 : 0.8}"
					></span>
				</button>
			{/each}
		</div>
		{#if sobre != null}
			{@const m = data.meses[sobre]}
			<div
				class="pointer-events-none absolute -top-2 z-10 -translate-x-1/2 -translate-y-full rounded-lg border border-borde bg-superficie-3 px-3 py-2 text-xs shadow-lg"
				style="left: {((sobre + 0.5) / 12) * 100}%"
			>
				<p class="font-semibold text-texto">{MESES[sobre]} {f.anio}</p>
				<p class="text-texto-2">Gasto <span class="cifra text-texto">{euros(m.gasto)}</span></p>
				{#if m.ingreso}<p class="text-texto-2">Ingreso <span class="cifra text-texto">{euros(m.ingreso)}</span></p>{/if}
			</div>
		{/if}
		<div class="mt-1.5 grid grid-cols-12 gap-1.5 text-center text-[0.65rem] text-texto-3 sm:gap-3">
			{#each MESES as n (n)}<span>{n.slice(0, 1)}<span class="hidden sm:inline">{n.slice(1)}</span></span>{/each}
		</div>
	</div>
</section>

<!-- Lista -->
<section class="mt-5">
	{#if !data.movimientos.length}
		<div class="vacio">Sin movimientos con estos filtros.</div>
	{:else}
		<ul class="tarjeta lista-filas">
			{#each data.movimientos as m (m.id)}
				<li class="group flex items-center gap-3 px-4 py-3">
					<span class="punto h-2.5 w-2.5" style="background:{m.categoria?.color ?? 'var(--texto-3)'}"></span>
					<div class="min-w-0 flex-1">
						<p class="truncate text-sm font-medium">{m.concepto}</p>
						<p class="truncate text-xs text-texto-3">
							{fechaLarga(m.fecha)} · {m.categoria?.nombre ?? 'Sin categoría'} · {ETIQUETA_PAGO[m.pago]}{m.ivaPct ? ` · IVA ${m.ivaPct}%` : ''}{m.vehiculo ? ` · ` : ''}{#if m.vehiculo}<a href="/flota/{m.vehiculoId}?pestana=gastos" class="hover:text-texto">{m.vehiculo}</a>{/if}{m.proveedor ? ` · ${m.proveedor}` : ''}
						</p>
					</div>
					<span class="cifra text-lg {m.tipo === 'ingreso' ? 'nivel-ok' : ''}">{m.tipo === 'ingreso' ? '+' : '−'}{euros(m.importeCent)}</span>
					<span class="flex opacity-60 group-hover:opacity-100">
						<button class="btn btn-fantasma btn-icono h-8 w-8" onclick={() => ((edit = m), (hMov = true))} aria-label="Editar"><Pencil size={14} /></button>
						<button class="btn btn-fantasma btn-icono btn-peligro h-8 w-8" onclick={() => borrar(m.id)} aria-label="Borrar"><Trash2 size={14} /></button>
					</span>
				</li>
			{/each}
		</ul>
	{/if}
</section>

<Hoja bind:abierta={hMov} titulo={edit ? 'Editar movimiento' : 'Nuevo movimiento'}>
	<MovimientoForm accion="?/guardar" categorias={data.catalogo.categorias} hoy={data.hoy} movimiento={edit} vehiculos={data.vehiculosMenu} cuentas={data.cuentas} inmovilizado={edit ? data.bienes.find((b) => b.movimientoId === edit!.id) : null} pagoPorDefecto={data.ajustes.pagoPorDefecto} alGuardar={() => (hMov = false)} />
</Hoja>
