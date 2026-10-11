<script lang="ts">
	// Dónde está un artículo: zona → mueble → balda/cajón, con su código («D·E2·3»). Envía muebleId, nivel y zonaId.
	import { codigoUbicacion, CONTENEDORES, MUEBLES, ordenLetra } from '@novaz/core';
	import type { Contenedor, Mueble, Zona } from '@novaz/core/schema';

	let {
		zonas,
		muebles,
		contenedores = [],
		contenedorId = $bindable(null),
		muebleId = $bindable(null),
		nivel = $bindable(null),
		zonaId = $bindable(null)
	}: {
		zonas: Zona[];
		muebles: Mueble[];
		contenedores?: Contenedor[];
		contenedorId?: number | null;
		muebleId?: number | null;
		nivel?: number | null;
		zonaId?: number | null;
	} = $props();

	const valor = $derived(muebleId ? `m:${muebleId}` : zonaId ? `z:${zonaId}` : '');
	const mueble = $derived(muebles.find((m) => m.id === muebleId) ?? null);
	const zona = $derived(zonas.find((z) => z.id === (mueble ? mueble.zonaId : zonaId)) ?? null);
	const contenedor = $derived(contenedores.find((c) => c.id === contenedorId) ?? null);
	const codigo = $derived(codigoUbicacion(zona, mueble, nivel, contenedor));
	// Contenedores de la balda elegida (si hay)
	const contsAqui = $derived(mueble ? contenedores.filter((c) => c.muebleId === mueble.id && c.nivel === (nivel ?? null)).sort((a, b) => ordenLetra(a.letra, b.letra)) : []);
	$effect(() => {
		if (contenedorId && !contsAqui.some((c) => c.id === contenedorId)) contenedorId = null;
	});
	function elegir(v: string) {
		const [t, id] = v.split(':');
		muebleId = t === 'm' ? Number(id) : null;
		zonaId = t === 'z' ? Number(id) : t === 'm' ? (muebles.find((m) => m.id === Number(id))?.zonaId ?? null) : null;
		const m = muebles.find((x) => x.id === muebleId);
		if (!m || !nivel || nivel > m.niveles) nivel = m && m.niveles === 1 ? 1 : null;
	}
	const sinZona = $derived(muebles.filter((m) => !m.zonaId));
</script>

<input type="hidden" name="muebleId" value={muebleId ?? ''} />
<input type="hidden" name="zonaId" value={zonaId ?? ''} />
<input type="hidden" name="nivel" value={nivel ?? ''} />
<input type="hidden" name="contenedorId" value={contenedorId ?? ''} />
<div class="flex flex-col gap-2">
	<div class="flex gap-2">
		<select class="input min-w-0 flex-1" value={valor} onchange={(e) => elegir(e.currentTarget.value)} aria-label="Sitio">
			<option value="">Sin ubicar</option>
			{#each zonas as z (z.id)}
				<optgroup label="{z.codigo} · {z.nombre}">
					<option value="z:{z.id}">{z.codigo} · En la zona, sin mueble</option>
					{#each muebles.filter((m) => m.zonaId === z.id) as m (m.id)}<option value="m:{m.id}">{z.codigo}·{m.codigo} · {m.nombre}</option>{/each}
				</optgroup>
			{/each}
			{#if sinZona.length}
				<optgroup label="Fuera de las zonas">{#each sinZona as m (m.id)}<option value="m:{m.id}">{m.codigo} · {m.nombre}</option>{/each}</optgroup>
			{/if}
		</select>
		{#if codigo}<span class="chip h-11 shrink-0 px-3 font-mono text-sm font-bold" style="border-color: {zona?.color}; color: var(--texto)">{codigo}</span>{/if}
	</div>
	{#if mueble && mueble.niveles > 1}
		<div class="flex flex-wrap items-center gap-1.5">
			<span class="text-xs text-texto-3 first-letter:uppercase">{MUEBLES[mueble.tipo].nivel}:</span>
			{#each Array.from({ length: mueble.niveles }, (_, i) => i + 1) as n (n)}
				<button type="button" class="chip h-8 min-w-8 justify-center px-2 font-mono {nivel === n ? 'border-acento bg-acento/10 text-texto' : 'text-texto-3'}" onclick={() => (nivel = nivel === n ? null : n)}>{n}</button>
			{/each}
			{#if MUEBLES[mueble.tipo].ayudaNivel}<span class="text-[0.68rem] text-texto-3">{MUEBLES[mueble.tipo].ayudaNivel}</span>{/if}
		</div>
	{/if}
	{#if contsAqui.length}
		<div class="flex flex-wrap items-center gap-1.5">
			<span class="text-xs text-texto-3">Dentro de:</span>
			<button type="button" class="chip h-8 px-2.5 text-xs {!contenedorId ? 'border-acento bg-acento/10 text-texto' : 'text-texto-3'}" onclick={() => (contenedorId = null)}>Suelto</button>
			{#each contsAqui as c (c.id)}
				<button type="button" class="chip h-8 px-2.5 text-xs {contenedorId === c.id ? 'border-acento bg-acento/10 text-texto' : 'text-texto-3'}" onclick={() => (contenedorId = contenedorId === c.id ? null : c.id)}>
					<span class="font-mono font-bold">{c.letra}</span>{CONTENEDORES[c.tipo]}{c.nombre ? ` · ${c.nombre}` : ''}
				</button>
			{/each}
		</div>
	{/if}
</div>
