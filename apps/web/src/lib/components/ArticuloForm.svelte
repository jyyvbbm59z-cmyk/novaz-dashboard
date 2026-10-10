<script lang="ts">
	// Alta / edición de un artículo del inventario (herramienta, recambio o consumible).
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import ColaFotos from '$comp/ColaFotos.svelte';
	import { avisar } from '$lib/avisos.svelte';
	import { enviar } from '$lib/enviar';
	import { subirArchivo } from '$lib/imagenes';
	import { eurosInput } from '@novaz/core';
	import type { Articulo, TipoArticulo } from '@novaz/core/schema';

	let {
		articulo = null,
		tipoInicial = 'herramienta',
		categorias = [],
		ubicaciones = [],
		vehiculos = [],
		hoy,
		alGuardar
	}: {
		articulo?: Articulo | null;
		tipoInicial?: TipoArticulo;
		categorias?: string[];
		ubicaciones?: string[];
		vehiculos?: { id: number; alias: string }[];
		hoy: string;
		alGuardar?: () => void;
	} = $props();

	let tipo = $state<TipoArticulo>((() => articulo?.tipo ?? tipoInicial)());
	let estado = $state((() => articulo?.estado ?? 'ok')());
	let fotos = $state<File[]>([]);
	const ESTADOS = [
		['ok', 'Bien'],
		['reparar', 'A reparar'],
		['prestada', 'Prestada'],
		['perdida', 'No la encuentro'],
		['baja', 'De baja']
	];

	const alTerminar = async (d: Record<string, unknown>) => {
		const id = Number(d.articuloId);
		if (fotos.length && id) {
			for (const f of fotos) await subirArchivo(f, { entidad: 'articulo', entidadId: id }).catch((e) => avisar(`${f.name}: ${e.message}`, 'error'));
			await invalidateAll();
		}
		fotos = [];
		alGuardar?.();
	};
</script>

<form method="POST" action="/inventario?/guardar" use:enhance={enviar({ alTerminar })} class="flex flex-col gap-4">
	{#if articulo}<input type="hidden" name="id" value={articulo.id} />{/if}
	<input type="hidden" name="tipo" value={tipo} />
	{#if !articulo}
		<div class="grid grid-cols-3 gap-1 rounded-lg border border-borde bg-superficie-2 p-1">
			{#each [['herramienta', 'Herramienta'], ['recambio', 'Recambio'], ['consumible', 'Consumible']] as [v, t] (v)}
				<button type="button" class="rounded-md py-1.5 text-sm font-semibold {tipo === v ? 'bg-superficie-3 text-texto shadow-sm' : 'text-texto-3'}" onclick={() => (tipo = v as TipoArticulo)}>{t}</button>
			{/each}
		</div>
	{/if}

	<label class="campo"><span>Nombre *</span><input name="nombre" class="input" required value={articulo?.nombre ?? ''} placeholder={tipo === 'herramienta' ? 'Llave dinamométrica 1/2"' : tipo === 'recambio' ? 'Filtro de aceite HF138' : 'Aceite Motul 7100 10W40'} /></label>
	<div class="grid grid-cols-2 gap-3">
		<label class="campo"><span>Marca</span><input name="marca" class="input" value={articulo?.marca ?? ''} /></label>
		<label class="campo"><span>{tipo === 'herramienta' ? 'Modelo' : 'Referencia'}</span><input name="referencia" class="input font-mono" value={articulo?.referencia ?? ''} /></label>
		<label class="campo">
			<span>Categoría</span>
			<input name="categoria" class="input" list="cat-inv" value={articulo?.categoria ?? ''} placeholder={tipo === 'herramienta' ? 'Llaves, Eléctrica, Medición…' : 'Filtros, Aceites…'} />
			<datalist id="cat-inv">{#each categorias as c (c)}<option value={c}></option>{/each}</datalist>
		</label>
		<label class="campo">
			<span>Dónde está</span>
			<input name="ubicacion" class="input" list="ubic-inv" value={articulo?.ubicacion ?? ''} placeholder="Panel A, cajón 2…" />
			<datalist id="ubic-inv">{#each ubicaciones as u (u)}<option value={u}></option>{/each}</datalist>
		</label>
	</div>

	{#if tipo === 'herramienta'}
		<fieldset class="campo">
			<span>Estado</span>
			<div class="flex flex-wrap gap-2">
				{#each ESTADOS as [v, t] (v)}
					<label class="chip h-8 cursor-pointer px-3 has-[:checked]:border-acento has-[:checked]:bg-acento/10 has-[:checked]:text-texto">
						<input type="radio" name="estado" value={v} bind:group={estado} class="sr-only" />{t}
					</label>
				{/each}
			</div>
		</fieldset>
		{#if estado === 'prestada'}
			<label class="campo"><span>¿A quién?</span><input name="prestadaA" class="input" value={articulo?.prestadaA ?? ''} /></label>
		{/if}
		<div class="grid grid-cols-2 gap-3">
			<label class="campo"><span>Nº de serie</span><input name="numeroSerie" class="input font-mono" value={articulo?.numeroSerie ?? ''} /></label>
			{#if !articulo}<label class="campo"><span>Cantidad</span><input name="cantidadInicial" class="input" inputmode="decimal" value="1" /></label>{/if}
		</div>
	{:else}
		<div class="grid grid-cols-3 gap-3">
			{#if !articulo}<label class="campo"><span>Tengo</span><input name="cantidadInicial" class="input" inputmode="decimal" placeholder="0" /></label>{/if}
			<label class="campo">
				<span>Unidad</span>
				<select name="unidad" class="input">{#each ['ud', 'L', 'ml', 'kg', 'g', 'm', 'juego'] as u (u)}<option selected={(articulo?.unidad ?? 'ud') === u}>{u}</option>{/each}</select>
			</label>
			<label class="campo"><span>Mínimo</span><input name="stockMinimo" class="input" inputmode="decimal" value={articulo?.stockMinimo ?? ''} placeholder="Avisar al bajar de…" /></label>
		</div>
		{#if vehiculos.length}
			<fieldset class="campo">
				<span>Sirve para (vacío = cualquiera)</span>
				<div class="flex flex-wrap gap-2">
					{#each vehiculos as v (v.id)}
						<label class="chip h-8 cursor-pointer px-3 has-[:checked]:border-acento has-[:checked]:text-texto">
							<input type="checkbox" name="vehiculoIds" value={v.id} checked={articulo?.vehiculoIds.includes(v.id)} class="accent-[var(--acento)]" />{v.alias}
						</label>
					{/each}
				</div>
			</fieldset>
		{/if}
	{/if}

	<div class="grid grid-cols-3 gap-3">
		<label class="campo"><span>Precio (€)</span><input name="valor" class="input" inputmode="decimal" value={eurosInput(articulo?.valorCent)} /></label>
		<label class="campo"><span>Comprada</span><input type="date" name="fechaCompra" class="input px-2" value={articulo?.fechaCompra ?? (articulo ? '' : hoy)} /></label>
		<label class="campo"><span>Proveedor</span><input name="proveedor" class="input" value={articulo?.proveedor ?? ''} /></label>
	</div>
	<label class="campo"><span>Notas</span><textarea name="notas" class="input" rows="2">{articulo?.notas ?? ''}</textarea></label>
	{#if !articulo}<div class="campo"><span>Fotos</span><ColaFotos bind:fotos /></div>{/if}
	<button class="btn btn-acento h-12">{articulo ? 'Guardar' : 'Añadir al inventario'}</button>
</form>
