<script lang="ts">
	// Alta / edición de un mueble del plano: tipo, código, medidas y baldas o cajones.
	import { enhance } from '$app/forms';
	import { enviar } from '$lib/enviar';
	import { MUEBLES, PLANO_LOCAL, siguienteCodigoMueble } from '@novaz/core';
	import { TIPOS_MUEBLE, type Mueble, type TipoMueble } from '@novaz/core/schema';

	let {
		mueble = null,
		posicion = null,
		existentes,
		alGuardar
	}: {
		mueble?: Mueble | null;
		/** Donde se tocó el plano (para uno nuevo). */
		posicion?: { x: number; y: number } | null;
		existentes: { codigo: string }[];
		alGuardar?: (id: number | null) => void;
	} = $props();

	let tipo = $state<TipoMueble>((() => mueble?.tipo ?? 'estanteria')());
	const def = $derived(MUEBLES[tipo]);
	let ancho = $state((() => mueble?.ancho ?? MUEBLES.estanteria.ancho)());
	let fondo = $state((() => mueble?.fondo ?? MUEBLES.estanteria.fondo)());
	let niveles = $state((() => mueble?.niveles ?? MUEBLES.estanteria.niveles)());
	function cambiarTipo(t: TipoMueble) {
		tipo = t;
		if (!mueble) ({ ancho, fondo, niveles } = MUEBLES[t]);
	}
	const codigoSugerido = $derived(mueble && mueble.tipo === tipo ? mueble.codigo : siguienteCodigoMueble(tipo, existentes));
	const num = (v: number) => String(Math.round(v * 100) / 100).replace('.', ',');
	// Uno nuevo se centra donde tocaste y, si está cerca de una pared lateral, se pega a ella
	const PARED = 0.35;
	function inicial(eje: 'x' | 'y') {
		if (mueble) return mueble[eje];
		const tam = eje === 'x' ? ancho : fondo;
		let v = (posicion?.[eje] ?? 1) - (posicion ? tam / 2 : 0);
		if (eje === 'x') {
			if (v < PARED) v = 0;
			else if (v + tam > PLANO_LOCAL.ancho - PARED) v = PLANO_LOCAL.ancho - tam;
		} else if (v + tam > PLANO_LOCAL.fondo - PARED && v < PLANO_LOCAL.fondo) v = PLANO_LOCAL.fondo - tam;
		return Math.max(0, v);
	}
</script>

<form
	method="POST"
	action="/inventario/plano?/mueble"
	use:enhance={enviar({ alTerminar: (d) => alGuardar?.(Number(d.muebleId) || null) })}
	class="flex flex-col gap-4"
>
	{#if mueble}<input type="hidden" name="id" value={mueble.id} />{/if}
	<input type="hidden" name="tipo" value={tipo} />
	<input type="hidden" name="x" value={num(inicial('x'))} />
	<input type="hidden" name="y" value={num(inicial('y'))} />

	<div class="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
		{#each TIPOS_MUEBLE as t (t)}
			<button type="button" class="chip h-9 justify-center {tipo === t ? 'border-acento bg-acento/10 text-texto' : 'text-texto-3'}" onclick={() => cambiarTipo(t)}>
				<span class="font-mono text-[0.7rem] font-bold opacity-60">{MUEBLES[t].prefijo}</span>{MUEBLES[t].nombre}
			</button>
		{/each}
	</div>

	<div class="grid grid-cols-[1fr_7rem] gap-3">
		<label class="campo"><span>Nombre</span><input name="nombre" class="input" value={mueble?.nombre ?? ''} placeholder={def.nombre} /></label>
		<label class="campo"><span>Código</span><input name="codigo" class="input font-mono uppercase" value={mueble?.codigo ?? ''} placeholder={codigoSugerido} /></label>
	</div>
	<div class="grid grid-cols-3 gap-3">
		<label class="campo"><span>Ancho (m)</span><input name="ancho" class="input" inputmode="decimal" value={num(ancho)} onchange={(e) => (ancho = Number(e.currentTarget.value.replace(',', '.')) || ancho)} /></label>
		<label class="campo"><span>Fondo (m)</span><input name="fondo" class="input" inputmode="decimal" value={num(fondo)} onchange={(e) => (fondo = Number(e.currentTarget.value.replace(',', '.')) || fondo)} /></label>
		<label class="campo">
			<span class="first-letter:uppercase">{tipo === 'equipo' ? 'Niveles' : `${def.nivel === 'cajón' ? 'Cajones' : def.nivel === 'fila' ? 'Filas' : def.nivel === 'bandeja' ? 'Bandejas' : 'Baldas'}`}</span>
			<input name="niveles" class="input" inputmode="numeric" bind:value={niveles} />
		</label>
	</div>
	{#if def.ayudaNivel}<p class="-mt-2 text-xs text-texto-3">{def.ayudaNivel}.</p>{/if}
	<label class="flex items-center gap-3 text-sm"><input type="checkbox" name="girado" checked={mueble?.girado ?? false} class="h-5 w-5 accent-[var(--acento)]" /> Girado 90° en el plano (contra una pared lateral)</label>
	<label class="campo"><span>Notas</span><input name="notas" class="input" value={mueble?.notas ?? ''} placeholder="Llave del candado en…" /></label>
	<button class="btn btn-acento h-12">{mueble ? 'Guardar' : 'Colocar en el plano'}</button>
</form>
