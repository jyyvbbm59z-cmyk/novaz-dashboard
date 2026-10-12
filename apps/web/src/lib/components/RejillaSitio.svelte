<script lang="ts">
	// Dónde va un contenedor en la balda: 3 tercios × 3 alturas. Se ve lo que ya hay y se toca la casilla.
	import { CONTENEDORES, encajar, huecoLibre, rejillaBalda, REJILLA, sePisan, type Celda } from '@novaz/core';
	import type { Contenedor } from '@novaz/core/schema';

	let {
		vecinos,
		letra,
		columna = $bindable(null),
		piso = $bindable(0),
		ancho = $bindable(1),
		alto = $bindable(1),
		tamano = true,
		alCambiarAlto
	}: {
		/** Lo que ya hay en esa balda (sin el que se coloca). */
		vecinos: Contenedor[];
		letra: string;
		/** Tercio elegido (null = el primer hueco libre). */
		columna?: number | null;
		piso?: number;
		ancho?: number;
		alto?: number;
		/** Se puede cambiar el alto y el ancho (al moverlo, no: es el que es). */
		tamano?: boolean;
		alCambiarAlto?: () => void;
	} = $props();

	const ocupadas = $derived(rejillaBalda(vecinos, true) ?? new Map<number, Celda>());
	// Elegido un tercio: en la altura tocada o, si no se dice, en la primera libre de ese tercio
	const celda = $derived.by(() => {
		if (columna == null) return huecoLibre([...ocupadas.values()], { ancho, alto });
		return encajar({ columna, piso, ancho, alto });
	});
	const pisada = $derived(celda ? vecinos.find((v) => ocupadas.get(v.id) && sePisan(ocupadas.get(v.id)!, celda)) : null);
	const area = (c: Celda) => `grid-column: ${c.columna} / span ${c.ancho}; grid-row: ${REJILLA.alturas - c.piso - c.alto + 1} / span ${c.alto}`;
</script>

<input type="hidden" name="columna" value={columna ?? ''} />
<input type="hidden" name="piso" value={piso} />
{#if tamano}
	<input type="hidden" name="ancho" value={ancho} />
	<input type="hidden" name="alto" value={alto} />
{/if}
<div class="flex flex-col gap-2">
	{#if tamano}
		<div class="flex flex-wrap gap-1.5">
			{#each [[1, 'Baja'], [2, 'Alta'], [3, 'Toda la altura']] as [v, txt] (v)}
				<button type="button" class="chip h-8 px-3 text-xs {alto === v ? 'border-acento bg-acento/10 text-texto' : 'text-texto-3'}" onclick={() => ((alto = v as number), alCambiarAlto?.())}>{txt}</button>
			{/each}
			<span class="mx-1 w-px bg-borde"></span>
			{#each [[1, '⅓'], [2, '⅔'], [3, 'Todo el ancho']] as [v, txt] (v)}
				<button type="button" class="chip h-8 px-3 text-xs {ancho === v ? 'border-acento bg-acento/10 text-texto' : 'text-texto-3'}" onclick={() => (ancho = v as number)}>{txt}</button>
			{/each}
		</div>
	{/if}
	<div class="grid aspect-[3/1.6] w-full grid-cols-3 grid-rows-3 gap-1 rounded-lg border-b-4 border-texto-3 bg-superficie-2 p-1">
		{#each Array.from({ length: 9 }, (_, i) => i) as i (i)}
			{@const col = (i % 3) + 1}
			{@const p = REJILLA.alturas - 1 - Math.floor(i / 3)}
			<button type="button" class="rounded border border-dashed border-borde transition hover:border-acento/60" style={area({ columna: col, ancho: 1, piso: p, alto: 1 })} onclick={() => ((columna = col), (piso = p))} aria-label="Tercio {col}, altura {p + 1}"></button>
		{/each}
		{#each vecinos as v (v.id)}
			{@const c = ocupadas.get(v.id)}
			{#if c}<div class="pointer-events-none flex items-center justify-center rounded-md bg-superficie-3 font-mono text-sm font-bold text-texto-2 ring-1 ring-borde" style={area(c)} title={v.nombre}>{v.letra}</div>{/if}
		{/each}
		{#if celda}
			<div class="pointer-events-none flex items-center justify-center rounded-md font-mono text-sm font-bold ring-2 {pisada ? 'bg-vencido/20 text-vencido ring-vencido' : 'bg-acento/25 text-texto ring-acento'}" style={area(celda)}>{letra}</div>
		{/if}
	</div>
	<p class="text-xs {pisada || !celda ? 'text-vencido' : 'text-texto-3'}">
		{#if pisada}Pisa {CONTENEDORES[pisada.tipo].toLowerCase()} {pisada.letra}: elige otro sitio.{:else if !celda}No queda un hueco de ese tamaño en la balda.{:else if columna == null}Va al primer hueco libre; toca la rejilla para elegir otro.{:else}Toca otra casilla para cambiarlo.{/if}
	</p>
</div>
