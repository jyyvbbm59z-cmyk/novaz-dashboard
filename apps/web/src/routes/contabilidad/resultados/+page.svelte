<script lang="ts">
	import { euros } from '@novaz/core';
	import { ChevronRight } from '@lucide/svelte';

	let { data } = $props();
	const a = $derived(data.actual);
	const p = $derived(data.anterior);
	let abiertas = $state<Record<string, boolean>>({});

	type Fila = { tipo: 'linea'; clave: string; n: string } | { tipo: 'total'; etiqueta: string; actual: number; anterior: number; fuerte?: boolean };
	const filas = $derived<Fila[]>([
		{ tipo: 'linea', clave: 'cifra', n: '1' },
		{ tipo: 'linea', clave: 'aprov', n: '4' },
		{ tipo: 'linea', clave: 'otrosIngExp', n: '5' },
		{ tipo: 'linea', clave: 'personal', n: '6' },
		{ tipo: 'linea', clave: 'otrosGasExp', n: '7' },
		{ tipo: 'linea', clave: 'amort', n: '8' },
		{ tipo: 'linea', clave: 'otros', n: '11' },
		{ tipo: 'total', etiqueta: 'A.1) Resultado de explotación', actual: a.explotacion, anterior: p.explotacion },
		{ tipo: 'linea', clave: 'ingFin', n: '12' },
		{ tipo: 'linea', clave: 'gasFin', n: '13' },
		{ tipo: 'total', etiqueta: 'A.2) Resultado financiero', actual: a.financiero, anterior: p.financiero },
		{ tipo: 'total', etiqueta: 'A.3) Resultado antes de impuestos', actual: a.antesImpuestos, anterior: p.antesImpuestos },
		{ tipo: 'linea', clave: 'impuesto', n: '17' },
		{ tipo: 'total', etiqueta: 'A.4) Resultado del ejercicio', actual: a.resultado, anterior: p.resultado, fuerte: true }
	]);
	const importe = (n: number) => (n === 0 ? '—' : euros(n));
</script>

<svelte:head><title>Pérdidas y ganancias · {data.ajustes.nombreTaller}</title></svelte:head>

<div class="tarjeta overflow-x-auto">
	<table class="tabla">
		<thead class="border-b border-borde">
			<tr><th class="w-full">Cuenta de pérdidas y ganancias (modelo abreviado)</th><th class="text-right">{data.ejercicio}</th><th class="text-right">{data.ejercicio - 1}</th></tr>
		</thead>
		<tbody>
			{#each filas as f, i (i)}
				{#if f.tipo === 'linea'}
					{@const la = a.lineas[f.clave]}
					{@const lp = p.lineas[f.clave]}
					{#if la.importe || lp.importe}
						<tr class="cursor-pointer hover:bg-superficie-2" onclick={() => (abiertas[f.clave] = !abiertas[f.clave])}>
							<td>
								<span class="flex items-center gap-2">
									<ChevronRight size={14} class="shrink-0 text-texto-3 transition {abiertas[f.clave] ? 'rotate-90' : ''}" />
									<span class="w-6 shrink-0 font-mono text-xs text-texto-3">{f.n}.</span>{la.etiqueta}
								</span>
							</td>
							<td class="num">{importe(la.importe)}</td>
							<td class="num text-texto-3">{importe(lp.importe)}</td>
						</tr>
						{#if abiertas[f.clave]}
							{#each la.cuentas as c (c.cuenta)}
								<tr class="bg-superficie-2/50 text-texto-2">
									<td class="pl-14 text-xs"><a href="/contabilidad/mayor?cuenta={c.cuenta}&ejercicio={data.ejercicio}" class="hover:underline"><span class="font-mono text-texto-3">{c.cuenta}</span> {data.nombres[c.cuenta]}</a></td>
									<td class="num text-xs">{euros(c.importe)}</td>
									<td class="num text-xs text-texto-3">{euros(lp.cuentas.find((x) => x.cuenta === c.cuenta)?.importe ?? 0)}</td>
								</tr>
							{/each}
						{/if}
					{/if}
				{:else}
					<tr class="{f.fuerte ? 'text-base' : ''} bg-superficie-2">
						<td class="font-semibold">{f.etiqueta}</td>
						<td class="num font-semibold {f.fuerte ? (f.actual < 0 ? 'nivel-vencido' : 'nivel-ok') : ''}">{euros(f.actual)}</td>
						<td class="num text-texto-3">{euros(f.anterior)}</td>
					</tr>
				{/if}
			{/each}
		</tbody>
	</table>
</div>

<p class="mt-4 text-sm text-texto-3">
	Impuesto de sociedades estimado ({data.ajustes.tipoImpuestoSociedades} % sobre el resultado positivo): <span class="cifra text-base text-texto-2">{euros(data.impuestoEstimado)}</span>.
	Es informativo: no se contabiliza salvo que lo registres en la cuenta 630.
</p>
