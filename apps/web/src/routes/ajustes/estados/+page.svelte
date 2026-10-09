<script lang="ts">
	import { enhance } from '$app/forms';
	import Hoja from '$comp/Hoja.svelte';
	import { accion, enviar } from '$lib/enviar';
	import type { Estado } from '@novaz/core/schema';
	import { Pencil, Plus, Trash2 } from '@lucide/svelte';

	let { data } = $props();
	let hoja = $state(false);
	let edit = $state<Estado | null>(null);
</script>

<div class="mb-4 flex items-center justify-between gap-3">
	<p class="text-sm text-texto-3">Los estados «finales» (vendido, entregado…) sacan el vehículo de la flota activa y de los avisos.</p>
	<button class="btn btn-acento shrink-0" onclick={() => ((edit = null), (hoja = true))}><Plus size={18} /> Nuevo</button>
</div>

<ul class="tarjeta lista-filas max-w-xl">
	{#each data.catalogo.estados as e (e.id)}
		<li class="flex items-center gap-3 px-4 py-2.5">
			<span class="punto h-3 w-3" style="background:{e.color}"></span>
			<span class="flex-1 text-sm font-medium">{e.nombre}</span>
			{#if e.final}<span class="chip h-5 text-[0.65rem]">final</span>{/if}
			<button class="btn btn-fantasma btn-icono h-8 w-8" onclick={() => ((edit = e), (hoja = true))} aria-label="Editar"><Pencil size={14} /></button>
			<button class="btn btn-fantasma btn-icono btn-peligro h-8 w-8" onclick={() => confirm(`¿Borrar ${e.nombre}?`) && accion('?/borrar', { id: e.id })} aria-label="Borrar"><Trash2 size={14} /></button>
		</li>
	{/each}
</ul>

<Hoja bind:abierta={hoja} titulo={edit ? edit.nombre : 'Nuevo estado'}>
	<form method="POST" action="?/guardar" use:enhance={enviar({ alTerminar: () => (hoja = false) })} class="flex flex-col gap-4">
		{#if edit}<input type="hidden" name="id" value={edit.id} />{/if}
		<label class="campo"><span>Nombre</span><input name="nombre" class="input" required value={edit?.nombre ?? ''} /></label>
		<div class="grid grid-cols-2 gap-3">
			<label class="campo"><span>Color</span><input type="color" name="color" class="input p-1" value={edit?.color ?? '#8a8f98'} /></label>
			<label class="campo"><span>Orden</span><input name="orden" class="input" inputmode="numeric" value={edit?.orden ?? 0} /></label>
		</div>
		<label class="flex items-center gap-3 text-sm"><input type="checkbox" name="final" checked={edit?.final ?? false} class="h-5 w-5 accent-[var(--acento)]" /> Estado final (fuera de la flota activa)</label>
		<button class="btn btn-acento h-12">Guardar</button>
	</form>
</Hoja>
