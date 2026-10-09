<script lang="ts">
	import { enhance } from '$app/forms';
	import { enviar } from '$lib/enviar';
	import { eurosInput } from '@novaz/core';
	import type { Categoria, Movimiento } from '@novaz/core/schema';

	let {
		accion = '?/gasto',
		categorias,
		hoy,
		movimiento = null,
		vehiculos = null,
		vehiculoFijo = null,
		alGuardar
	}: {
		accion?: string;
		categorias: Categoria[];
		hoy: string;
		movimiento?: Movimiento | null;
		vehiculos?: { id: number; alias: string }[] | null;
		vehiculoFijo?: number | null;
		alGuardar?: () => void;
	} = $props();

	let tipo = $state<'gasto' | 'ingreso'>((() => movimiento?.tipo ?? 'gasto')());
	const cats = $derived(categorias.filter((c) => c.tipo === tipo));
</script>

<form method="POST" action={accion} use:enhance={enviar({ alTerminar: alGuardar })} class="flex flex-col gap-4">
	{#if movimiento}<input type="hidden" name="id" value={movimiento.id} />{/if}
	{#if vehiculoFijo}<input type="hidden" name="vehiculoId" value={vehiculoFijo} />{/if}
	<div class="grid grid-cols-2 gap-1 rounded-lg border border-borde bg-superficie-2 p-1">
		{#each [['gasto', 'Gasto'], ['ingreso', 'Ingreso']] as [v, t] (v)}
			<label class="cursor-pointer rounded-md py-1.5 text-center text-sm font-semibold {tipo === v ? 'bg-superficie-3 text-texto' : 'text-texto-3'}">
				<input type="radio" name="tipo" value={v} bind:group={tipo} class="sr-only" />{t}
			</label>
		{/each}
	</div>
	<div class="grid grid-cols-2 gap-3">
		<label class="campo"><span>Importe (€) *</span><input name="importe" class="input cifra text-lg" inputmode="decimal" required value={eurosInput(movimiento?.importeCent)} placeholder="0,00" /></label>
		<label class="campo"><span>Fecha</span><input type="date" name="fecha" class="input" value={movimiento?.fecha ?? hoy} /></label>
	</div>
	<label class="campo"><span>Concepto *</span><input name="concepto" class="input" required value={movimiento?.concepto ?? ''} placeholder="Pastillas de freno delanteras" /></label>
	<div class="grid grid-cols-2 gap-3">
		<label class="campo">
			<span>Categoría</span>
			<select name="categoriaId" class="input">
				{#each cats as c (c.id)}<option value={c.id} selected={movimiento?.categoriaId === c.id}>{c.nombre}</option>{/each}
			</select>
		</label>
		<label class="campo"><span>Proveedor</span><input name="proveedor" class="input" value={movimiento?.proveedor ?? ''} /></label>
	</div>
	{#if vehiculos}
		<label class="campo">
			<span>Vehículo</span>
			<select name="vehiculoId" class="input">
				<option value="">— General del taller —</option>
				{#each vehiculos as v (v.id)}<option value={v.id} selected={movimiento?.vehiculoId === v.id}>{v.alias}</option>{/each}
			</select>
		</label>
	{/if}
	<label class="campo"><span>Notas</span><textarea name="notas" class="input" rows="2">{movimiento?.notas ?? ''}</textarea></label>
	<button class="btn btn-acento h-12">{movimiento ? 'Guardar cambios' : 'Registrar'}</button>
</form>
