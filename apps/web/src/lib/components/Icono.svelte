<script lang="ts">
	import { icono } from '$lib/iconos';

	let { nombre, size = 18, class: clase = '' }: { nombre: string | null | undefined; size?: number; class?: string } = $props();
	const C = $derived(icono(nombre));
</script>

<C {size} class={clase} strokeWidth={1.75} />
