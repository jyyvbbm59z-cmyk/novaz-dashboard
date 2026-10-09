<script lang="ts">
	// Evolución del cuentakilómetros. Las lecturas sospechosas se dibujan aparte (no deforman la escala).
	import { diasEntre, fechaLarga } from '@novaz/core';

	interface L {
		id: number;
		fecha: string;
		km: number;
		sospechosa: boolean;
	}
	let { lecturas, hoy }: { lecturas: L[]; hoy: string } = $props();

	const W = 600;
	const H = 200;
	const orden = $derived([...lecturas].sort((a, b) => a.fecha.localeCompare(b.fecha) || a.km - b.km));
	const validas = $derived(orden.filter((l) => !l.sospechosa));
	const desde = $derived(orden[0]?.fecha ?? hoy);
	const hasta = $derived(orden.at(-1)?.fecha && orden.at(-1)!.fecha > hoy ? orden.at(-1)!.fecha : hoy);
	const totalDias = $derived(Math.max(diasEntre(desde, hasta), 1));
	const rango = $derived.by(() => {
		const kms = validas.map((l) => l.km);
		if (!kms.length) return { min: 0, max: 1 };
		const min = Math.min(...kms);
		const max = Math.max(...kms);
		const pad = Math.max((max - min) * 0.12, 50);
		return { min: Math.max(min - pad, 0), max: max + pad };
	});
	const x = (f: string) => (diasEntre(desde, f) / totalDias) * W;
	const yRaw = (km: number) => H - ((km - rango.min) / (rango.max - rango.min)) * H;
	const y = (km: number) => Math.min(Math.max(yRaw(km), 2), H - 2);
	const linea = $derived(validas.map((l, i) => `${i ? 'L' : 'M'}${x(l.fecha).toFixed(1)},${y(l.km).toFixed(1)}`).join(' '));
	const area = $derived(validas.length ? `${linea} L${x(validas.at(-1)!.fecha).toFixed(1)},${H} L${x(validas[0].fecha).toFixed(1)},${H} Z` : '');

	let caja = $state<HTMLDivElement>();
	let sobre = $state<L | null>(null);
	function mover(e: PointerEvent) {
		if (!caja) return;
		const r = caja.getBoundingClientRect();
		const fx = ((e.clientX - r.left) / r.width) * W;
		sobre = orden.reduce<L | null>((m, l) => (!m || Math.abs(x(l.fecha) - fx) < Math.abs(x(m.fecha) - fx) ? l : m), null);
	}
	const n = (k: number) => k.toLocaleString('es-ES');
	const etiquetaFecha = (f: string) => fechaLarga(f).replace(/^\d+ /, '');
</script>

{#if validas.length >= 2}
	<div class="flex gap-2">
		<div class="flex h-48 w-12 shrink-0 flex-col justify-between text-right font-mono text-[0.62rem] leading-none text-texto-3">
			<span>{n(Math.round(rango.max / 100) * 100)}</span>
			<span>{n(Math.round((rango.max + rango.min) / 200) * 100)}</span>
			<span>{n(Math.round(rango.min / 100) * 100)}</span>
		</div>
		<div
			bind:this={caja}
			class="relative h-48 flex-1 touch-pan-y"
			onpointermove={mover}
			onpointerdown={mover}
			onpointerleave={() => (sobre = null)}
			role="img"
			aria-label="Evolución de los kilómetros desde {fechaLarga(desde)}"
		>
			<svg viewBox="0 0 {W} {H}" preserveAspectRatio="none" class="absolute inset-0 h-full w-full overflow-visible">
				<defs>
					<linearGradient id="relleno-km" x1="0" x2="0" y1="0" y2="1">
						<stop offset="0" stop-color="var(--acento)" stop-opacity="0.22" />
						<stop offset="1" stop-color="var(--acento)" stop-opacity="0" />
					</linearGradient>
				</defs>
				{#each [0, 0.5, 1] as t (t)}
					<line x1="0" x2={W} y1={H * t} y2={H * t} stroke="var(--borde)" stroke-width="1" stroke-dasharray="2 4" vector-effect="non-scaling-stroke" />
				{/each}
				<path d={area} fill="url(#relleno-km)" />
				<path d={linea} fill="none" stroke="var(--acento)" stroke-width="2" stroke-linejoin="round" vector-effect="non-scaling-stroke" />
				{#if sobre}
					<line x1={x(sobre.fecha)} x2={x(sobre.fecha)} y1="0" y2={H} stroke="var(--texto-3)" stroke-width="1" vector-effect="non-scaling-stroke" />
				{/if}
			</svg>
			<!-- Puntos en HTML para que no se deformen -->
			{#each orden as l (l.id)}
				<span
					class="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-superficie {l.sospechosa ? 'h-3 w-3' : sobre?.id === l.id ? 'h-3 w-3' : 'h-2 w-2'}"
					style="left: {(x(l.fecha) / W) * 100}%; top: {(y(l.km) / H) * 100}%; background: {l.sospechosa ? 'var(--urgente)' : 'var(--acento)'}"
				></span>
			{/each}
			{#if sobre}
				<div
					class="pointer-events-none absolute z-10 -translate-y-full rounded-lg border border-borde bg-superficie-3 px-3 py-2 text-xs whitespace-nowrap shadow-lg {x(sobre.fecha) > W * 0.6 ? '-translate-x-full' : ''}"
					style="left: {(x(sobre.fecha) / W) * 100}%; top: calc({(y(sobre.km) / H) * 100}% - 10px)"
				>
					<p class="text-texto-3">{fechaLarga(sobre.fecha)}</p>
					<p class="cifra text-base">{n(sobre.km)} km</p>
					{#if sobre.sospechosa}<p class="nivel-urgente">No cuadra: no se usa en los cálculos</p>{/if}
				</div>
			{/if}
		</div>
	</div>
	<div class="mt-1.5 ml-14 flex justify-between text-[0.65rem] text-texto-3"><span>{etiquetaFecha(desde)}</span><span>{etiquetaFecha(hasta)}</span></div>
{:else}
	<p class="py-6 text-center text-sm text-texto-3">Con dos lecturas de km o más verás aquí la evolución.</p>
{/if}
