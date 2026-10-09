<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { avisar } from '$lib/avisos.svelte';
	import { subirArchivo } from '$lib/imagenes';
	import { Camera, LoaderCircle, Paperclip } from '@lucide/svelte';

	let {
		entidad,
		entidadId,
		vehiculoId = null,
		camara = false,
		texto = camara ? 'Foto' : 'Adjuntar',
		acepta = 'image/*,application/pdf',
		clase = 'btn',
		comprimir = true,
		alSubir
	}: {
		entidad: string;
		entidadId: number;
		vehiculoId?: number | null;
		camara?: boolean;
		texto?: string;
		acepta?: string;
		clase?: string;
		comprimir?: boolean;
		alSubir?: (r: { id: number; url: string }) => void;
	} = $props();

	let subiendo = $state(0);
	let input: HTMLInputElement;

	async function elegir(e: Event) {
		const archivos = [...((e.currentTarget as HTMLInputElement).files ?? [])];
		if (!archivos.length) return;
		subiendo = archivos.length;
		let ok = 0;
		for (const f of archivos) {
			try {
				const r = await subirArchivo(f, { entidad, entidadId, vehiculoId }, comprimir);
				alSubir?.(r);
				ok++;
			} catch (err) {
				avisar(`${f.name}: ${(err as Error).message}`, 'error', 5000);
			}
			subiendo--;
		}
		input.value = '';
		if (ok) {
			avisar(ok === 1 ? 'Archivo subido' : `${ok} archivos subidos`);
			await invalidateAll();
		}
	}
</script>

<label class="{clase} cursor-pointer" aria-busy={subiendo > 0}>
	{#if subiendo}
		<LoaderCircle size={18} class="animate-spin" /> Subiendo {subiendo}…
	{:else if camara}
		<Camera size={18} /> {texto}
	{:else}
		<Paperclip size={18} /> {texto}
	{/if}
	<input
		bind:this={input}
		type="file"
		class="sr-only"
		accept={acepta}
		multiple={!camara}
		capture={camara ? 'environment' : undefined}
		onchange={elegir}
		disabled={subiendo > 0}
	/>
</label>
