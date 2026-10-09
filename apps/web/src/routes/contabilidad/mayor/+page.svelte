<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { euros, fechaLarga } from '@novaz/core';
	import { Search } from '@lucide/svelte';

	let { data } = $props();
	let filtro = $state('');
	const elegibles = $derived(data.activas.filter((c) => !filtro || `${c.cuenta} ${c.nombre}`.toLowerCase().includes(filtro.toLowerCase())));

	function ir(cuenta: string) {
		const u = new URL(page.url);
		u.searchParams.set('cuenta', cuenta);
		goto(u, { noScroll: true });
	}
	const total = $derived(
		data.cuenta ? data.lineas!.reduce((t, l) => ({ debe: t.debe + l.debe, haber: t.haber + l.haber }), { debe: 0, haber: 0 }) : null
	);
	const saldoFinal = $derived(data.cuenta ? (data.lineas!.at(-1)?.saldo ?? data.saldoInicial!) : 0);
	const signo = (n: number) => (n === 0 ? '' : n > 0 ? 'D' : 'H');
</script>

<svelte:head><title>Mayor · {data.ajustes.nombreTaller}</title></svelte:head>

<div class="grid gap-5 lg:grid-cols-[18rem_1fr]">
	<aside class="lg:sticky lg:top-24 lg:self-start">
		<label class="relative mb-2 block">
			<Search size={15} class="absolute top-1/2 left-3 -translate-y-1/2 text-texto-3" />
			<input bind:value={filtro} class="input h-9 pl-9 text-sm" placeholder="Cuenta o nombre" onkeydown={(e) => e.key === 'Enter' && /^\d{3,10}$/.test(filtro) && ir(filtro)} />
		</label>
		<ul class="tarjeta lista-filas max-h-[22rem] overflow-y-auto lg:max-h-[70dvh]">
			{#each elegibles as c (c.cuenta)}
				<li>
					<button class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition hover:bg-superficie-2 {data.cuenta === c.cuenta ? 'bg-superficie-2' : ''}" onclick={() => ir(c.cuenta)}>
						<span class="w-12 shrink-0 font-mono text-xs {data.cuenta === c.cuenta ? 'text-acento' : 'text-texto-3'}">{c.cuenta}</span>
						<span class="min-w-0 flex-1 truncate">{c.nombre}</span>
						<span class="font-mono text-xs text-texto-2">{euros(Math.abs(c.saldo), { redondo: true })}</span>
					</button>
				</li>
			{:else}
				<li class="px-3 py-6 text-center text-xs text-texto-3">Sin cuentas con movimientos</li>
			{/each}
		</ul>
	</aside>

	<section class="min-w-0">
		{#if !data.cuenta}
			<div class="vacio">Elige una cuenta para ver sus movimientos y su saldo acumulado.</div>
		{:else}
			<div class="mb-4 flex flex-wrap items-end justify-between gap-3">
				<div>
					<p class="font-mono text-sm text-acento">{data.cuenta}</p>
					<h2 class="seccion-titulo">{data.nombre}</h2>
				</div>
				<div class="text-right">
					<p class="etiqueta">Saldo</p>
					<p class="cifra text-3xl">{euros(Math.abs(saldoFinal))} <span class="text-base text-texto-3">{signo(saldoFinal)}</span></p>
				</div>
			</div>
			<div class="tarjeta overflow-x-auto">
				<table class="tabla">
					<thead class="border-b border-borde">
						<tr><th>Fecha</th><th>Nº</th><th class="w-full">Concepto</th><th class="text-right">Debe</th><th class="text-right">Haber</th><th class="text-right">Saldo</th></tr>
					</thead>
					<tbody>
						{#if data.saldoInicial}
							<tr class="text-texto-3"><td colspan="3">Saldo inicial</td><td class="num"></td><td class="num"></td><td class="num">{euros(Math.abs(data.saldoInicial))} {signo(data.saldoInicial)}</td></tr>
						{/if}
						{#each data.lineas ?? [] as l, i (i)}
							<tr>
								<td class="whitespace-nowrap text-texto-2">{fechaLarga(l.fecha)}</td>
								<td class="font-mono text-xs text-texto-3">{l.numero}</td>
								<td class="max-w-0 truncate">{l.concepto}{#if l.cuenta !== data.cuenta}<span class="ml-1 font-mono text-xs text-texto-3">({l.cuenta})</span>{/if}</td>
								<td class="num">{l.debe ? euros(l.debe) : ''}</td>
								<td class="num">{l.haber ? euros(l.haber) : ''}</td>
								<td class="num text-texto-2">{euros(Math.abs(l.saldo))} <span class="text-texto-3">{signo(l.saldo)}</span></td>
							</tr>
						{:else}
							<tr><td colspan="6" class="py-8 text-center text-texto-3">Sin movimientos en este ejercicio</td></tr>
						{/each}
					</tbody>
					{#if total}
						<tfoot class="border-t border-borde font-semibold">
							<tr><td colspan="3">Totales del ejercicio</td><td class="num">{euros(total.debe)}</td><td class="num">{euros(total.haber)}</td><td class="num">{euros(Math.abs(saldoFinal))} {signo(saldoFinal)}</td></tr>
						</tfoot>
					{/if}
				</table>
			</div>
		{/if}
	</section>
</div>
