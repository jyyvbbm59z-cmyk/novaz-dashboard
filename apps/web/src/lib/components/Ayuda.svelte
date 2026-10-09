<script lang="ts">
	// Explicación plegable en lenguaje llano ("¿Qué es esto?"). Recuerda si la cerraste.
	import { CircleHelp } from '@lucide/svelte';
	import type { Snippet } from 'svelte';
	import { onMount } from 'svelte';

	let { titulo, children }: { titulo: string; children: Snippet } = $props();
	let abierta = $state(true);
	const clave = $derived(`ayuda:${titulo}`);

	onMount(() => {
		try {
			abierta = localStorage.getItem(clave) !== 'cerrada';
		} catch {}
	});
	function alternar(e: Event) {
		abierta = (e.currentTarget as HTMLDetailsElement).open;
		try {
			localStorage.setItem(clave, abierta ? 'abierta' : 'cerrada');
		} catch {}
	}
</script>

<details open={abierta} ontoggle={alternar} class="group mb-4 rounded-xl border border-borde bg-superficie-2/60 text-sm">
	<summary class="flex cursor-pointer items-center gap-2 px-4 py-2.5 font-medium text-texto-2 select-none">
		<CircleHelp size={16} class="text-acento" />{titulo}
		<span class="ml-auto text-xs text-texto-3 group-open:hidden">Ver</span>
	</summary>
	<div class="px-4 pb-3.5 leading-relaxed text-texto-2">{@render children()}</div>
</details>
