<script lang="ts">
	import Ayuda from '$comp/Ayuda.svelte';
	import { euros, fechaLarga } from '@novaz/core';

	let { data } = $props();
	let libro = $state<'repercutido' | 'soportado'>('soportado');
	const filas = $derived(data.registro.filter((r) => r.tipo === libro));
	const liquidacion = (t: number) => data.liquidaciones.find((l) => l.t === t);
	const destino = (t: number) => {
		const l = liquidacion(t);
		if (!l) return null;
		const pagar = l.apuntes.find((p) => p.cuenta === '4750')?.haber ?? 0;
		const compensar = l.apuntes.find((p) => p.cuenta === '4700')?.debe ?? 0;
		const compensado = l.apuntes.find((p) => p.cuenta === '4700')?.haber ?? 0;
		return { pagar, compensar, compensado };
	};
</script>

<svelte:head><title>IVA · {data.ajustes.nombreTaller}</title></svelte:head>

<Ayuda titulo="¿Cómo funciona el IVA?">{@html `El IVA que cobras a tus clientes no es tuyo: es de Hacienda. El IVA que pagas en tus facturas te lo descuentas. Cada trimestre se resta uno del otro: si sale positivo, pagas la diferencia; si sale negativo, te lo guardas para compensar en los siguientes trimestres.`}</Ayuda>

<p class="mb-4 max-w-3xl text-sm text-texto-3">
	Modelo 303 simulado. Cada trimestre cerrado se liquida solo: el IVA repercutido menos el soportado va a Hacienda (cuenta 4750) o queda a compensar (4700)
	en los siguientes trimestres.
</p>

<div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
	{#each data.trimestres as t (t.t)}
		{@const d = destino(t.t)}
		<article class="tarjeta flex flex-col gap-3 p-4 {t.cerrado ? '' : 'border-dashed'}">
			<div class="flex items-baseline justify-between">
				<h2 class="seccion-titulo">{t.t}T</h2>
				<span class="chip h-5 text-[0.65rem]">{t.cerrado ? (d ? 'Liquidado' : 'Sin IVA') : 'En curso'}</span>
			</div>
			<dl class="grid grid-cols-[1fr_auto] gap-x-3 gap-y-1 text-sm">
				<dt class="text-texto-3">Devengado (ventas)</dt><dd class="text-right font-mono">{euros(t.repercutido.cuota)}</dd>
				<dt class="text-xs text-texto-3">base</dt><dd class="text-right font-mono text-xs text-texto-3">{euros(t.repercutido.base)}</dd>
				<dt class="text-texto-3">Deducible (compras)</dt><dd class="text-right font-mono">−{euros(t.soportado.cuota)}</dd>
				<dt class="text-xs text-texto-3">base</dt><dd class="text-right font-mono text-xs text-texto-3">{euros(t.soportado.base)}</dd>
			</dl>
			<div class="mt-auto border-t border-borde pt-3">
				<p class="etiqueta">{t.resultado >= 0 ? 'Resultado a ingresar' : 'Resultado a compensar'}</p>
				<p class="cifra text-3xl {t.resultado > 0 ? 'nivel-urgente' : t.resultado < 0 ? 'nivel-ok' : ''}">{euros(Math.abs(t.resultado))}</p>
				{#if d?.compensado}<p class="text-xs text-texto-3">Compensado de trimestres anteriores: {euros(d.compensado)}</p>{/if}
			</div>
		</article>
	{/each}
</div>

<section class="mt-6">
	<div class="mb-3 flex flex-wrap items-center justify-between gap-3">
		<h2 class="seccion-titulo">Libros registro</h2>
		<div class="inline-flex rounded-lg border border-borde bg-superficie-2 p-1">
			{#each [['soportado', 'Facturas recibidas'], ['repercutido', 'Facturas emitidas']] as [v, t] (v)}
				<button class="rounded-md px-3 py-1.5 text-sm font-medium transition {libro === v ? 'bg-superficie-3 text-texto' : 'text-texto-3'}" onclick={() => (libro = v as typeof libro)}>{t}</button>
			{/each}
		</div>
	</div>
	<div class="tarjeta overflow-x-auto">
		<table class="tabla">
			<thead class="border-b border-borde"><tr><th>Fecha</th><th>Trim.</th><th class="w-full">Concepto</th><th class="text-right">Base</th><th class="text-right">Tipo</th><th class="text-right">Cuota</th></tr></thead>
			<tbody>
				{#each filas as r (r.numero)}
					<tr><td class="whitespace-nowrap text-texto-2">{fechaLarga(r.fecha)}</td><td class="text-texto-3">{r.t}T</td><td class="max-w-0 truncate">{r.concepto}</td><td class="num">{euros(r.base)}</td><td class="num text-texto-3">{r.pct} %</td><td class="num">{euros(r.cuota)}</td></tr>
				{:else}
					<tr><td colspan="6" class="py-8 text-center text-texto-3">Sin facturas {libro === 'soportado' ? 'recibidas' : 'emitidas'} con IVA en {data.ejercicio}</td></tr>
				{/each}
			</tbody>
			{#if filas.length}
				<tfoot class="border-t-2 border-borde font-semibold">
					<tr><td colspan="3">Total</td><td class="num">{euros(filas.reduce((t, r) => t + r.base, 0))}</td><td></td><td class="num">{euros(filas.reduce((t, r) => t + r.cuota, 0))}</td></tr>
				</tfoot>
			{/if}
		</table>
	</div>
</section>
