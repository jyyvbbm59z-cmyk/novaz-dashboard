<script lang="ts">
	// Fotos elegidas antes de guardar: se suben al terminar (cuando ya existe el registro).
	import { Camera, ImagePlus, X } from '@lucide/svelte';

	let { fotos = $bindable([]) }: { fotos?: File[] } = $props();
	const previas = $derived(fotos.map((f) => ({ url: f.type.startsWith('image/') ? URL.createObjectURL(f) : null, nombre: f.name })));

	function anadir(e: Event) {
		const input = e.currentTarget as HTMLInputElement;
		fotos = [...fotos, ...(input.files ?? [])];
		input.value = '';
	}
</script>

<div class="flex flex-wrap items-center gap-2">
	<label class="btn cursor-pointer"><Camera size={18} /> Cámara<input type="file" accept="image/*" capture="environment" class="sr-only" onchange={anadir} /></label>
	<label class="btn cursor-pointer"><ImagePlus size={18} /> Galería<input type="file" accept="image/*,application/pdf" multiple class="sr-only" onchange={anadir} /></label>
	{#each previas as p, i (i)}
		<span class="relative h-11 w-11 overflow-hidden rounded-md bg-superficie-3">
			{#if p.url}<img src={p.url} alt="" class="h-full w-full object-cover" />{:else}<span class="flex h-full items-center justify-center text-[0.6rem]">PDF</span>{/if}
			<button type="button" class="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition hover:opacity-100 focus:opacity-100" onclick={() => (fotos = fotos.filter((_, j) => j !== i))} aria-label="Quitar {p.nombre}"><X size={14} class="text-white" /></button>
		</span>
	{/each}
</div>
