<script lang="ts">
	import { enhance } from '$app/forms';
	import Hoja from '$comp/Hoja.svelte';
	import { accion, enviar } from '$lib/enviar';
	import type { PlantillaFases } from '@novaz/core/schema';
	import { Pencil, Plus, Trash2 } from '@lucide/svelte';

	let { data } = $props();
	let hoja = $state(false);
	let edit = $state<PlantillaFases | null>(null);
	const aTexto = (p: PlantillaFases | null) => (p?.fases ?? []).map((f) => [f.nombre, ...f.tareas.map((t) => `- ${t}`)].join('\n')).join('\n\n');
</script>

<div class="mb-4 flex items-center justify-between gap-3">
	<p class="text-sm text-texto-3">Fases y tareas de partida al empezar una restauración. Luego cada obra se adapta sola.</p>
	<button class="btn btn-acento shrink-0" onclick={() => ((edit = null), (hoja = true))}><Plus size={18} /> Nueva</button>
</div>

<div class="grid gap-3 md:grid-cols-2">
	{#each data.catalogo.plantillas as p (p.id)}
		<article class="tarjeta p-4">
			<div class="flex items-center gap-2">
				<h2 class="flex-1 text-2xl">{p.nombre}</h2>
				<button class="btn btn-fantasma btn-icono h-9 w-9" onclick={() => ((edit = p), (hoja = true))} aria-label="Editar"><Pencil size={15} /></button>
				<button class="btn btn-fantasma btn-icono btn-peligro h-9 w-9" onclick={() => confirm(`¿Borrar ${p.nombre}?`) && accion('?/borrar', { id: p.id })} aria-label="Borrar"><Trash2 size={15} /></button>
			</div>
			<ol class="mt-2 flex flex-wrap gap-1.5">
				{#each p.fases as f, i (i)}<li class="chip">{i + 1}. {f.nombre} <span class="text-texto-3">{f.tareas.length}</span></li>{/each}
			</ol>
		</article>
	{/each}
</div>

<Hoja bind:abierta={hoja} titulo={edit ? edit.nombre : 'Nueva plantilla'} ancho="max-w-xl">
	<form method="POST" action="?/guardar" use:enhance={enviar({ alTerminar: () => (hoja = false) })} class="flex flex-col gap-4">
		{#if edit}<input type="hidden" name="id" value={edit.id} />{/if}
		<label class="campo"><span>Nombre</span><input name="nombre" class="input" required value={edit?.nombre ?? ''} /></label>
		<label class="campo">
			<span>Fases y tareas</span>
			<textarea name="fases" class="input font-mono text-sm" rows="16" placeholder={'Desmontaje\n- Desmontar y etiquetar\n- Fotos de referencia\n\nPintura\n- Preparación\n- Color'}>{aTexto(edit)}</textarea>
			<span class="text-xs text-texto-3">Una fase por línea. Las tareas debajo, empezando por «-».</span>
		</label>
		<button class="btn btn-acento h-12">Guardar</button>
	</form>
</Hoja>
