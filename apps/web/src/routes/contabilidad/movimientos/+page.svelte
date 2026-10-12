<script lang="ts">
	import Ayuda from '$comp/Ayuda.svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import Hoja from '$comp/Hoja.svelte';
	import MovimientoForm from '$comp/MovimientoForm.svelte';
	import { accion } from '$lib/enviar';
	import { escalaEje, ETIQUETA_PAGO, euros, fechaLarga } from '@novaz/core';
	import type { Movimiento } from '@novaz/core/schema';
	import { Download, Paperclip, Pencil, Plus, Trash2 } from '@lucide/svelte';

	let { data } = $props();
	const f = $derived(data.filtros);
	const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
	// Gráfico: gasto por mes apilado; la escala se ajusta a lo que se ve (con los filtros)
	const g = $derived(data.grafico);
	const marcas = $derived(escalaEje(Math.max(0, ...g.meses.map((m) => m.total))));
	const tope = $derived(marcas[marcas.length - 1]);
	/** «0», «250 €», «1,5 k€»: corto, para el eje. */
	const eje = (cent: number) => {
		const e = cent / 100;
		return e >= 1000 ? `${(e / 1000).toLocaleString('es-ES', { maximumFractionDigits: 1 })} k€` : e ? `${e.toLocaleString('es-ES')} €` : '0';
	};
	/** Color de la serie: los siete de la paleta y gris para «Otros». */
	const color = (hueco: number) => (hueco ? `var(--serie-${hueco})` : 'var(--serie-otros)');

	let hMov = $state(page.url.searchParams.has('nuevo'));
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

<Ayuda titulo="¿Qué son los movimientos?">{@html `Cada factura, cobro o aportación que apuntas. Es lo único que tienes que registrar: la app genera sola los asientos contables. Para apuntar sin pensar, usa el botón <strong>Apuntar</strong>.`}</Ayuda>

<!-- Filtros -->
<div class="mb-5 flex flex-wrap gap-2">
	<select class="input h-9 w-auto text-sm" value={f.tipo ?? ''} onchange={(e) => filtrar('tipo', e.currentTarget.value)}>
		<option value="">Todo</option><option value="gasto">Gastos</option><option value="ingreso">Ingresos</option><option value="aportacion">Entradas (aportaciones…)</option><option value="retirada">Salidas (reembolsos…)</option>
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
		<button class="btn h-9" onclick={() => ((edit = null), (hMov = true))}>Formulario</button>
		<a href="/contabilidad/nuevo" class="btn btn-acento h-9"><Plus size={16} /> Apuntar</a>
	</span>
</div>

<!-- Resumen -->
<section class="grid grid-cols-3 gap-3">
	<div class="tarjeta p-4"><p class="etiqueta">Gastos</p><p class="cifra mt-1 text-2xl sm:text-4xl">{euros(data.totales.gasto, { redondo: true })}</p></div>
	<div class="tarjeta p-4"><p class="etiqueta">Ingresos</p><p class="cifra mt-1 text-2xl sm:text-4xl">{euros(data.totales.ingreso, { redondo: true })}</p></div>
	<div class="tarjeta p-4"><p class="etiqueta">Balance</p><p class="cifra mt-1 text-2xl sm:text-4xl {balance < 0 ? 'nivel-vencido' : 'nivel-ok'}">{euros(balance, { redondo: true })}</p></div>
</section>

<!-- Gasto por mes, apilado por categoría (colores fijos por lo que gasta cada una en el año); clic = filtrar el mes -->
<section class="tarjeta gasto-mes mt-3 p-4 sm:p-5">
	<div class="mb-3 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
		<p class="etiqueta">Gasto por mes · {f.anio}{f.mes ? '' : ' · toca un mes para filtrar'}</p>
		{#if f.categoria}<button class="text-xs text-texto-3 hover:text-texto" onclick={() => filtrar('categoria', null)}>Ver todas las categorías</button>{/if}
	</div>
	{#if g.series.length > 1 || f.categoria}
		<!-- Leyenda: tocar una categoría filtra por ella -->
		<div class="mb-3 flex flex-wrap gap-x-3 gap-y-1.5">
			{#each g.series as s (s.clave)}
				{@const id = s.clave.startsWith('c') ? s.clave.slice(1) : null}
				<button class="flex items-center gap-1.5 text-xs text-texto-2 {id ? 'hover:text-texto' : 'cursor-default'}" onclick={() => id && filtrar('categoria', String(f.categoria) === id ? null : id)} disabled={!id}>
					<span class="h-2.5 w-2.5 shrink-0 rounded-sm" style="background: {color(s.hueco)}"></span>{s.nombre}
				</button>
			{/each}
		</div>
	{/if}
	<div class="mt-4 grid grid-cols-[auto_minmax(0,1fr)] gap-x-2">
		<!-- Eje Y: euros redondos -->
		<div class="relative h-40 w-11 text-right text-[0.62rem] text-texto-3 tabular-nums">
			{#each marcas as v (v)}<span class="absolute right-0 -translate-y-1/2" style="bottom: calc({(v / tope) * 100}% - 0.5em)">{eje(v)}</span>{/each}
		</div>
		<div class="relative h-40">
			{#each marcas as v (v)}<span class="absolute inset-x-0 border-t {v ? 'border-borde/50' : 'border-borde'}" style="bottom: {(v / tope) * 100}%"></span>{/each}
			<div class="absolute inset-0 grid grid-cols-12 items-end gap-1.5 sm:gap-3">
				{#each g.meses as m, i (m.mes)}
					{@const partes = g.series.filter((s) => m.partes[s.clave])}
					<button
						class="relative flex h-full flex-col justify-end px-0.5 sm:px-2"
						onmouseenter={() => (sobre = i)}
						onmouseleave={() => (sobre = null)}
						onfocus={() => (sobre = i)}
						onblur={() => (sobre = null)}
						onclick={() => filtrar('mes', f.mes === m.mes ? null : m.mes)}
						aria-label="{MESES[i]}: {euros(m.total)}"
					>
						<span
							class="flex w-full flex-col-reverse gap-[2px] transition-opacity"
							style="height: {m.total ? Math.max(1.5, (m.total / tope) * 100) : 0}%; opacity: {f.mes && f.mes !== m.mes ? 0.3 : sobre != null && sobre !== i ? 0.75 : 1}"
						>
							{#each partes as s, k (s.clave)}
								<span class="block w-full {k === partes.length - 1 ? 'rounded-t-[4px]' : ''}" style="flex: {m.partes[s.clave]} 1 0; min-height: 1px; background: {color(s.hueco)}"></span>
							{/each}
						</span>
					</button>
				{/each}
			</div>
			{#if sobre != null && g.meses[sobre].total}
				{@const m = g.meses[sobre]}
				{@const ing = data.meses[sobre].ingreso}
				<div
					class="pointer-events-none absolute top-0 z-10 w-max max-w-56 -translate-y-full rounded-lg border border-borde bg-superficie-3 px-3 py-2 text-xs shadow-lg {sobre < 6 ? '' : '-translate-x-full'}"
					style="left: {((sobre + (sobre < 6 ? 0.5 : 0.5)) / 12) * 100}%"
				>
					<p class="font-semibold text-texto">{MESES[sobre]} {f.anio} · <span class="cifra">{euros(m.total)}</span></p>
					{#each [...g.series].filter((s) => m.partes[s.clave]).sort((a, b) => m.partes[b.clave] - m.partes[a.clave]) as s (s.clave)}
						<p class="flex items-center gap-1.5 text-texto-2"><span class="h-2 w-2 shrink-0 rounded-sm" style="background: {color(s.hueco)}"></span><span class="truncate">{s.nombre}</span><span class="cifra ml-auto pl-2 text-texto">{euros(m.partes[s.clave])}</span></p>
					{/each}
					{#if ing && !f.categoria}<p class="mt-1 border-t border-borde pt-1 text-texto-2">Ingresos <span class="cifra text-texto">{euros(ing)}</span></p>{/if}
				</div>
			{/if}
		</div>
		<span></span>
		<div class="mt-1.5 grid grid-cols-12 gap-1.5 text-center text-[0.65rem] text-texto-3 sm:gap-3">
			{#each MESES as n (n)}<span>{n.slice(0, 1)}<span class="hidden sm:inline">{n.slice(1)}</span></span>{/each}
		</div>
	</div>
	{#if !g.meses.some((m) => m.total)}<p class="mt-3 text-center text-sm text-texto-3">Sin gastos {f.categoria || f.vehiculo ? 'con estos filtros' : 'este año'}.</p>{/if}
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
							{fechaLarga(m.fecha)} · {m.categoria?.nombre ?? (m.tipo === 'aportacion' ? 'Entrada de dinero' : m.tipo === 'retirada' ? 'Salida de dinero' : 'Sin categoría')} · {ETIQUETA_PAGO[m.pago]}{m.recurrenteId ? ' · mensual' : ''}{m.ivaPct ? ` · IVA ${m.ivaPct}%` : ''}{m.vehiculo ? ` · ` : ''}{#if m.vehiculo}<a href="/flota/{m.vehiculoId}?pestana=gastos" class="hover:text-texto">{m.vehiculo}</a>{/if}{m.proveedor ? ` · ${m.proveedor}` : ''}
						</p>
					</div>
					{#if data.adjuntos[m.id]?.length}<button class="chip h-6 shrink-0 px-2" onclick={() => ((edit = m), (hMov = true))} title="Ver factura"><Paperclip size={12} />{data.adjuntos[m.id].length}</button>{/if}
					<span class="cifra text-lg {m.tipo === 'ingreso' ? 'nivel-ok' : m.tipo === 'aportacion' ? 'nivel-pronto' : ''}">{m.tipo === 'ingreso' || m.tipo === 'aportacion' ? '+' : '−'}{euros(m.importeCent)}</span>
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
	<MovimientoForm accion="?/guardar" categorias={data.catalogo.categorias} hoy={data.hoy} movimiento={edit} vehiculos={data.vehiculosMenu} cuentas={data.cuentas} inmovilizado={edit ? data.bienes.find((b) => b.movimientoId === edit!.id) : null} pagoPorDefecto={data.ajustes.pagoPorDefecto} adjuntos={edit ? (data.adjuntos[edit.id] ?? []) : []} alGuardar={() => (hMov = false)} />
</Hoja>

<style>
	/* Paleta categórica comprobada para daltonismo (en este orden, contigua en las pilas); claro y oscuro */
	.gasto-mes {
		--serie-1: #2a78d6;
		--serie-2: #eb6834;
		--serie-3: #1baf7a;
		--serie-4: #eda100;
		--serie-5: #e87ba4;
		--serie-6: #008300;
		--serie-7: #4a3aa7;
		--serie-otros: #9a9893;
	}
	:global(html[data-theme='oscuro']) .gasto-mes {
		--serie-1: #3987e5;
		--serie-2: #d95926;
		--serie-3: #199e70;
		--serie-4: #c98500;
		--serie-5: #d55181;
		--serie-6: #008300;
		--serie-7: #9085e9;
		--serie-otros: #6f6e69;
	}
</style>
