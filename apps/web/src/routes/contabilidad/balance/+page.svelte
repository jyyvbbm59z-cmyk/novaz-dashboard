<script lang="ts">
	import Ayuda from '$comp/Ayuda.svelte';
	import { euros, fechaLarga, type LineaInforme } from '@novaz/core';
	import { ChevronRight, CircleAlert, CircleCheck } from '@lucide/svelte';

	let { data } = $props();
	const b = $derived(data.balance);
	let vista = $state<'situacion' | 'sumas'>('situacion');
	let abiertas = $state<Record<string, boolean>>({});
	const totalSumas = $derived(data.sumas.reduce((t, s) => ({ debe: t.debe + s.debe, haber: t.haber + s.haber }), { debe: 0, haber: 0 }));
</script>

{#snippet bloque(titulo: string, lineas: LineaInforme[])}
	{#if lineas.length}
		<tr class="bg-superficie-2"><td colspan="2" class="text-[0.68rem] font-semibold tracking-[0.12em] text-texto-3 uppercase">{titulo}</td></tr>
		{#each lineas as l (l.clave)}
			<tr class="cursor-pointer hover:bg-superficie-2/60" onclick={() => (abiertas[titulo + l.clave] = !abiertas[titulo + l.clave])}>
				<td><span class="flex items-center gap-2"><ChevronRight size={14} class="shrink-0 text-texto-3 transition {abiertas[titulo + l.clave] ? 'rotate-90' : ''}" />{l.etiqueta}</span></td>
				<td class="num">{euros(l.importe)}</td>
			</tr>
			{#if abiertas[titulo + l.clave]}
				{#each l.cuentas as c (c.cuenta)}
					<tr class="text-xs text-texto-2"><td class="pl-11"><a href="/contabilidad/mayor?cuenta={c.cuenta}&ejercicio={data.ejercicio}" class="hover:underline"><span class="font-mono text-texto-3">{c.cuenta}</span> {data.nombres[c.cuenta] ?? ''}</a></td><td class="num">{euros(c.importe)}</td></tr>
				{/each}
			{/if}
		{/each}
	{/if}
{/snippet}

<svelte:head><title>Balance · {data.ajustes.nombreTaller}</title></svelte:head>

<Ayuda titulo="¿Qué es el balance?">{@html `Una foto de la empresa en una fecha. A la izquierda, lo que <strong>tiene</strong> (activo: dinero, máquinas, lo que le deben). A la derecha, de dónde ha salido (lo que has aportado tú, los beneficios acumulados y lo que debe a otros). Los dos lados siempre suman lo mismo.`}</Ayuda>

<div class="mb-4 flex flex-wrap items-center justify-between gap-3">
	<div class="inline-flex rounded-lg border border-borde bg-superficie-2 p-1">
		{#each [['situacion', 'Balance de situación'], ['sumas', 'Sumas y saldos']] as [v, t] (v)}
			<button class="rounded-md px-3 py-1.5 text-sm font-medium transition {vista === v ? 'bg-superficie-3 text-texto' : 'text-texto-3'}" onclick={() => (vista = v as typeof vista)}>{t}</button>
		{/each}
	</div>
	<p class="flex items-center gap-2 text-sm text-texto-3">
		A {fechaLarga(data.fecha)}
		{#if b.cuadra}<span class="chip nivel-ok"><CircleCheck size={13} /> Cuadra</span>{:else}<span class="chip nivel-vencido"><CircleAlert size={13} /> Descuadre</span>{/if}
	</p>
</div>

{#if vista === 'situacion'}
	<div class="grid gap-4 lg:grid-cols-2">
		<section class="tarjeta overflow-hidden">
			<table class="tabla">
				<thead class="border-b border-borde"><tr><th class="w-full">Activo</th><th class="text-right">Importe</th></tr></thead>
				<tbody>
					{@render bloque('A) Activo no corriente', b.activo.noCorriente)}
					{@render bloque('B) Activo corriente', b.activo.corriente)}
				</tbody>
				<tfoot class="border-t-2 border-borde"><tr><td class="font-display text-lg font-bold uppercase">Total activo</td><td class="num text-base font-semibold">{euros(b.activo.total)}</td></tr></tfoot>
			</table>
		</section>
		<section class="tarjeta overflow-hidden">
			<table class="tabla">
				<thead class="border-b border-borde"><tr><th class="w-full">Patrimonio neto y pasivo</th><th class="text-right">Importe</th></tr></thead>
				<tbody>
					{@render bloque('A) Patrimonio neto', b.pnPasivo.patrimonio)}
					{@render bloque('B) Pasivo no corriente', b.pnPasivo.noCorriente)}
					{@render bloque('C) Pasivo corriente', b.pnPasivo.corriente)}
				</tbody>
				<tfoot class="border-t-2 border-borde"><tr><td class="font-display text-lg font-bold uppercase">Total PN y pasivo</td><td class="num text-base font-semibold">{euros(b.pnPasivo.total)}</td></tr></tfoot>
			</table>
		</section>
	</div>
	{#if !b.activo.total && !b.pnPasivo.total}
		<p class="mt-4 text-sm text-texto-3">Aún no hay saldos. Empieza aportando capital desde el <a href="/contabilidad/diario?plantilla=capital" class="text-acento">libro diario</a>.</p>
	{/if}
{:else}
	<div class="tarjeta overflow-x-auto">
		<table class="tabla">
			<thead class="border-b border-borde">
				<tr><th>Cuenta</th><th class="w-full">Nombre</th><th class="text-right">Sumas debe</th><th class="text-right">Sumas haber</th><th class="text-right">Saldo deudor</th><th class="text-right">Saldo acreedor</th></tr>
			</thead>
			<tbody>
				{#each data.sumas as s (s.cuenta)}
					<tr>
						<td class="font-mono text-xs"><a href="/contabilidad/mayor?cuenta={s.cuenta}&ejercicio={data.ejercicio}" class="hover:text-acento">{s.cuenta}</a></td>
						<td class="max-w-0 truncate">{s.nombre}</td>
						<td class="num">{euros(s.debe)}</td>
						<td class="num">{euros(s.haber)}</td>
						<td class="num">{s.saldo > 0 ? euros(s.saldo) : ''}</td>
						<td class="num">{s.saldo < 0 ? euros(-s.saldo) : ''}</td>
					</tr>
				{:else}
					<tr><td colspan="6" class="py-8 text-center text-texto-3">Sin movimientos en {data.ejercicio}</td></tr>
				{/each}
			</tbody>
			<tfoot class="border-t-2 border-borde font-semibold">
				<tr>
					<td colspan="2">Totales</td>
					<td class="num">{euros(totalSumas.debe)}</td>
					<td class="num">{euros(totalSumas.haber)}</td>
					<td class="num">{euros(data.sumas.reduce((t, s) => t + Math.max(s.saldo, 0), 0))}</td>
					<td class="num">{euros(data.sumas.reduce((t, s) => t + Math.max(-s.saldo, 0), 0))}</td>
				</tr>
			</tfoot>
		</table>
	</div>
{/if}
