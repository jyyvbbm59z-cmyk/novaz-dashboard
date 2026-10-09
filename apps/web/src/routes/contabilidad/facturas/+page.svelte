<script lang="ts">
	import Ayuda from '$comp/Ayuda.svelte';
	import { accion } from '$lib/enviar';
	import { euros, fechaLarga, numeroFactura } from '@novaz/core';
	import { CircleCheck, Clock, Download, ExternalLink, Ban } from '@lucide/svelte';

	let { data } = $props();
	const emitidas = $derived(data.facturas.filter((f) => f.tipo === 'factura' && !f.anulada));
	const total = $derived(emitidas.reduce((t, f) => t + f.totalCent, 0));
	const pendiente = $derived(emitidas.filter((f) => !f.movimientoId).reduce((t, f) => t + f.totalCent, 0));

	async function cobrar(id: number) {
		const pago = confirm('¿Cobrada por banco? (Cancelar = en efectivo)') ? 'banco' : 'caja';
		await accion('?/cobrar', { id, pago });
	}
</script>

<svelte:head><title>Facturas · {data.ajustes.nombreTaller}</title></svelte:head>

<Ayuda titulo="¿Cómo funcionan las facturas?">
	Se generan desde el historial de un vehículo: <strong>Facturar</strong>, marcas las operaciones y <strong>Generar</strong>. La numeración es correlativa por año y
	no se reutiliza (una factura anulada conserva su número). Al marcarla como cobrada se apunta el ingreso con su IVA en la contabilidad.
</Ayuda>

<section class="mb-4 grid grid-cols-3 gap-3">
	<div class="tarjeta p-4"><p class="etiqueta">Facturado</p><p class="cifra mt-1 text-2xl sm:text-3xl">{euros(total, { redondo: true })}</p><p class="text-xs text-texto-3">{emitidas.length} facturas</p></div>
	<div class="tarjeta p-4"><p class="etiqueta">Cobrado</p><p class="cifra mt-1 text-2xl sm:text-3xl">{euros(total - pendiente, { redondo: true })}</p></div>
	<div class="tarjeta p-4"><p class="etiqueta">Pendiente</p><p class="cifra mt-1 text-2xl sm:text-3xl {pendiente ? 'nivel-urgente' : ''}">{euros(pendiente, { redondo: true })}</p></div>
</section>

{#if !data.facturas.length}
	<div class="vacio">Sin facturas en {data.ejercicio}. Genera la primera desde el historial de un vehículo.</div>
{:else}
	<ul class="tarjeta lista-filas">
		{#each data.facturas as f (f.id)}
			<li class="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3 {f.anulada ? 'opacity-50' : ''}">
				<div class="min-w-0 flex-1">
					<p class="flex items-center gap-2 text-sm font-semibold">
						<span class="font-mono">{numeroFactura(f.serie, f.anio, f.numero)}</span>
						{#if f.anulada}<span class="chip h-5 text-[0.65rem]">Anulada</span>
						{:else if f.tipo === 'informe'}<span class="chip h-5 text-[0.65rem]">Informe</span>
						{:else if f.movimientoId}<span class="chip h-5 text-[0.65rem] nivel-ok"><CircleCheck size={11} /> Cobrada</span>
						{:else}<span class="chip h-5 text-[0.65rem] nivel-urgente"><Clock size={11} /> Pendiente</span>{/if}
					</p>
					<p class="truncate text-xs text-texto-3">
						{fechaLarga(f.fecha)} · {f.cliente?.nombre ?? '—'}{#if f.vehiculo} · {#if f.vehiculoId}<a href="/flota/{f.vehiculoId}?pestana=gastos" class="hover:text-texto">{f.vehiculo.alias}</a>{:else}{f.vehiculo.alias}{/if}{/if}
					</p>
				</div>
				{#if f.tipo === 'factura'}<span class="cifra text-lg">{euros(f.totalCent)}</span>{/if}
				<span class="flex items-center gap-1">
					{#if f.tipo === 'factura' && !f.anulada && !f.movimientoId}
						<button class="btn h-8 text-xs" onclick={() => cobrar(f.id)}>Cobrada</button>
					{/if}
					<a href="/facturas/{f.id}/pdf" target="_blank" class="btn btn-fantasma btn-icono h-8 w-8" aria-label="Ver"><ExternalLink size={15} /></a>
					<a href="/facturas/{f.id}/pdf?descargar" class="btn btn-fantasma btn-icono h-8 w-8" aria-label="Descargar" download><Download size={15} /></a>
					{#if !f.anulada}
						<button class="btn btn-fantasma btn-icono btn-peligro h-8 w-8" onclick={() => confirm(`¿Anular ${numeroFactura(f.serie, f.anio, f.numero)}? Su cobro se quitará de la contabilidad.`) && accion('?/anular', { id: f.id })} aria-label="Anular"><Ban size={15} /></button>
					{/if}
				</span>
			</li>
		{/each}
	</ul>
{/if}
