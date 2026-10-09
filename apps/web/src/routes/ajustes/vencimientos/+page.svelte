<script lang="ts">
	import { enhance } from '$app/forms';
	import Hoja from '$comp/Hoja.svelte';
	import Icono from '$comp/Icono.svelte';
	import SelectorIcono from '$comp/SelectorIcono.svelte';
	import { accion, enviar } from '$lib/enviar';
	import type { TipoVencimiento } from '@novaz/core/schema';
	import { Pencil, Plus, Trash2 } from '@lucide/svelte';

	let { data } = $props();
	const cat = $derived(data.catalogo);
	let hoja = $state(false);
	let edit = $state<TipoVencimiento | null>(null);
	let icono = $state('calendar-clock');
	function abrir(t: TipoVencimiento | null) {
		edit = t;
		icono = t?.icono ?? 'calendar-clock';
		hoja = true;
	}
</script>

<div class="mb-4 flex items-center justify-between gap-3">
	<p class="text-sm text-texto-3">ITV, seguro, impuestos… y lo que necesites vigilar con fecha de caducidad.</p>
	<button class="btn btn-acento shrink-0" onclick={() => abrir(null)}><Plus size={18} /> Nuevo</button>
</div>

<ul class="tarjeta lista-filas">
	{#each cat.tiposVencimiento as t (t.id)}
		<li class="flex items-center gap-3 px-4 py-3 {t.activo ? '' : 'opacity-50'}">
			<Icono nombre={t.icono} size={20} />
			<div class="min-w-0 flex-1">
				<p class="font-medium">{t.nombre}{t.activo ? '' : ' (inactivo)'}</p>
				<p class="truncate text-xs text-texto-3">
					{t.mesesValidez ? `Cada ${t.mesesValidez} meses` : 'Validez manual'} · avisa a {t.avisosDias.join(', ')} días ·
					{t.tiposVehiculoIds.length ? cat.tipos.filter((x) => t.tiposVehiculoIds.includes(x.id)).map((x) => x.nombre).join(', ') : 'todos los tipos'}
				</p>
			</div>
			<button class="btn btn-fantasma btn-icono h-9 w-9" onclick={() => abrir(t)} aria-label="Editar"><Pencil size={15} /></button>
			<button class="btn btn-fantasma btn-icono btn-peligro h-9 w-9" onclick={() => confirm(`¿Borrar ${t.nombre}?`) && accion('?/borrar', { id: t.id })} aria-label="Borrar"><Trash2 size={15} /></button>
		</li>
	{/each}
</ul>

<Hoja bind:abierta={hoja} titulo={edit ? edit.nombre : 'Nuevo tipo de vencimiento'} ancho="max-w-xl">
	<form method="POST" action="?/guardar" use:enhance={enviar({ alTerminar: () => (hoja = false) })} class="flex flex-col gap-4">
		{#if edit}<input type="hidden" name="id" value={edit.id} />{/if}
		<label class="campo"><span>Nombre</span><input name="nombre" class="input" required value={edit?.nombre ?? ''} placeholder="Revisión del extintor" /></label>
		<div class="grid grid-cols-3 gap-3">
			<label class="campo"><span>Validez (meses)</span><input name="mesesValidez" class="input" inputmode="numeric" value={edit?.mesesValidez ?? ''} /></label>
			<label class="campo"><span>Avisar (días)</span><input name="avisosDias" class="input" value={(edit?.avisosDias ?? [30, 7, 1]).join(', ')} /></label>
			<label class="campo"><span>Orden</span><input name="orden" class="input" inputmode="numeric" value={edit?.orden ?? 0} /></label>
		</div>
		<label class="campo">
			<span>Categoría del gasto al renovar</span>
			<select name="categoriaId" class="input">
				<option value="">— Ninguna —</option>
				{#each cat.categorias.filter((c) => c.tipo === 'gasto') as c (c.id)}<option value={c.id} selected={edit?.categoriaId === c.id}>{c.nombre}</option>{/each}
			</select>
		</label>
		<fieldset class="campo">
			<span>Se aplica a (vacío = todos)</span>
			<div class="flex flex-wrap gap-2">
				{#each cat.tipos as t (t.id)}
					<label class="chip h-9 cursor-pointer px-3 has-[:checked]:border-acento has-[:checked]:text-texto">
						<input type="checkbox" name="tiposVehiculoIds" value={t.id} checked={edit?.tiposVehiculoIds.includes(t.id)} class="accent-[var(--acento)]" />{t.nombre}
					</label>
				{/each}
			</div>
		</fieldset>
		<div class="campo"><span>Icono</span><SelectorIcono bind:valor={icono} /></div>
		<label class="flex items-center gap-3 text-sm"><input type="checkbox" name="activo" checked={edit?.activo ?? true} class="h-5 w-5 accent-[var(--acento)]" /> Activo</label>
		<button class="btn btn-acento h-12">Guardar</button>
	</form>
</Hoja>
