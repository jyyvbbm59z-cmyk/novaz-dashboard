<script lang="ts">
	// Alta / edición de un mueble del plano: tipo, código, medidas y baldas o cajones.
	import { enhance } from '$app/forms';
	import { enviar } from '$lib/enviar';
	import { MUEBLES, nivelesMueble, PLANO_LOCAL, pluralNivel, siguienteCodigoMueble, type FilaMueble } from '@novaz/core';
	import { TIPOS_MUEBLE, type Mueble, type TipoMueble } from '@novaz/core/schema';
	import { Minus, Plus, Trash2 } from '@lucide/svelte';
	import FrenteMueble from './FrenteMueble.svelte';

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
	// A medida: filas de arriba a abajo, cada una con su alto, partida en cajones o hueco abierto
	let aMedida = $state((() => !!mueble?.disposicion)());
	let filas = $state<FilaMueble[]>((() => JSON.parse(JSON.stringify(mueble?.disposicion?.filas ?? Array.from({ length: mueble?.niveles || 3 }, () => ({ alto: 1, cajones: 1 })))))());
	let nombreNivelPropio = $state((() => mueble?.disposicion?.nivel ?? '')());
	const disposicion = $derived(aMedida && filas.length ? { filas, ...(nombreNivelPropio.trim() ? { nivel: nombreNivelPropio.trim().toLowerCase() } : {}) } : null);
	const vista = $derived({ ...(mueble ?? {}), id: mueble?.id ?? 0, codigo: mueble?.codigo ?? '', nombre: mueble?.nombre ?? '', tipo, ancho, fondo, niveles: disposicion ? nivelesMueble({ tipo, disposicion }).length : niveles, disposicion } as Mueble);
	const cambiar = (i: number, k: 'alto' | 'cajones', d: number) => {
		const f = filas[i];
		f[k] = Math.min(k === 'alto' ? 10 : 8, Math.max(k === 'alto' ? 0.5 : 1, f[k] + d));
	};
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
		<label class="campo" class:opacity-40={aMedida}>
			<span class="first-letter:uppercase">{tipo === 'equipo' ? 'Niveles' : pluralNivel((aMedida && nombreNivelPropio.trim()) || (aMedida && mueble?.disposicion?.nivel) || def.nivel)}</span>
			<input name="niveles" class="input" inputmode="numeric" bind:value={niveles} disabled={aMedida} />
		</label>
	</div>
	{#if def.ayudaNivel && !aMedida}<p class="-mt-2 text-xs text-texto-3">{def.ayudaNivel}.</p>{/if}

	<!-- Cajones a medida -->
	<input type="hidden" name="disposicion" value={disposicion ? JSON.stringify(disposicion) : ''} />
	{#if tipo !== 'equipo' && tipo !== 'panel'}
		<label class="flex items-center gap-3 text-sm"><input type="checkbox" bind:checked={aMedida} class="h-5 w-5 accent-[var(--acento)]" /> A medida: filas de distinto alto, partidas en varios cajones o huecos</label>
		{#if aMedida}
			<div class="grid gap-3 sm:grid-cols-[1fr_9rem]">
				<div class="flex flex-col gap-1.5">
					<p class="text-xs text-texto-3">De arriba a abajo. El alto, en «alturas de cajón». Se numeran de arriba a abajo y de izquierda a derecha.</p>
					{#each filas as f, i (i)}
						<div class="flex flex-wrap items-center gap-1.5 rounded-lg border border-borde bg-superficie-2 px-2 py-1.5 text-xs">
							<span class="w-5 font-mono text-texto-3">{i + 1}</span>
							<span class="text-texto-3">Alto</span>
							<button type="button" class="btn btn-icono h-7 w-7" onclick={() => cambiar(i, 'alto', -0.5)} aria-label="Más bajo"><Minus size={13} /></button>
							<span class="w-6 text-center font-mono">{String(f.alto).replace('.', ',')}</span>
							<button type="button" class="btn btn-icono h-7 w-7" onclick={() => cambiar(i, 'alto', 0.5)} aria-label="Más alto"><Plus size={13} /></button>
							{#if !f.hueco}
								<span class="ml-1 text-texto-3">Partida en</span>
								<button type="button" class="btn btn-icono h-7 w-7" onclick={() => cambiar(i, 'cajones', -1)} aria-label="Menos"><Minus size={13} /></button>
								<span class="w-4 text-center font-mono">{f.cajones}</span>
								<button type="button" class="btn btn-icono h-7 w-7" onclick={() => cambiar(i, 'cajones', 1)} aria-label="Más"><Plus size={13} /></button>
							{/if}
							<label class="ml-1 flex items-center gap-1"><input type="checkbox" bind:checked={f.hueco} class="accent-[var(--acento)]" /> Hueco</label>
							{#if i > 0}<label class="flex items-center gap-1" title="Empieza otra pieza (el carro bajo el cofre)"><input type="checkbox" bind:checked={f.aparte} class="accent-[var(--acento)]" /> Pieza aparte</label>{/if}
							<button type="button" class="btn btn-fantasma btn-icono btn-peligro ml-auto h-7 w-7" onclick={() => filas.splice(i, 1)} aria-label="Quitar fila"><Trash2 size={13} /></button>
						</div>
					{/each}
					<div class="flex flex-wrap items-center gap-2">
						<button type="button" class="btn h-8 text-xs" onclick={() => filas.push({ alto: 1, cajones: 1 })}><Plus size={13} /> Fila</button>
						<label class="flex items-center gap-2 text-xs text-texto-3">Cada nivel se llama <input class="input h-8 w-24 text-xs" bind:value={nombreNivelPropio} placeholder={def.nivel} /></label>
					</div>
					<p class="text-xs text-texto-3">{vista.niveles} {pluralNivel(nombreNivelPropio.trim() || def.nivel)}{filas.some((f) => f.hueco) ? ' (con los huecos)' : ''}.</p>
				</div>
				<div class="mx-auto w-36 sm:w-full"><FrenteMueble mueble={vista} /></div>
			</div>
		{/if}
	{/if}
	<label class="flex items-center gap-3 text-sm"><input type="checkbox" name="girado" checked={mueble?.girado ?? false} class="h-5 w-5 accent-[var(--acento)]" /> Girado 90° en el plano (contra una pared lateral)</label>
	<label class="campo"><span>Notas</span><input name="notas" class="input" value={mueble?.notas ?? ''} placeholder="Llave del candado en…" /></label>
	<button class="btn btn-acento h-12">{mueble ? 'Guardar' : 'Colocar en el plano'}</button>
</form>
