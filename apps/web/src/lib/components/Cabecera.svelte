<script lang="ts">
	// Cabecera de página: migas/volver, antetítulo, título y acciones.
	import { ArrowLeft } from '@lucide/svelte';
	import type { Snippet } from 'svelte';

	let {
		titulo,
		antetitulo,
		volver,
		children,
		pie
	}: { titulo: string; antetitulo?: string; volver?: { href: string; texto: string }; children?: Snippet; pie?: Snippet } = $props();
</script>

<header class="mb-6 flex flex-col gap-1">
	{#if volver}
		<a href={volver.href} class="group mb-1 inline-flex w-fit items-center gap-1.5 text-sm text-texto-3 transition hover:text-texto">
			<ArrowLeft size={15} class="transition group-hover:-translate-x-0.5" />{volver.texto}
		</a>
	{/if}
	<div class="flex flex-wrap items-end justify-between gap-x-4 gap-y-3">
		<div class="min-w-0">
			{#if antetitulo}<p class="etiqueta mb-1 first-letter:uppercase">{antetitulo}</p>{/if}
			<h1 class="titulo-pagina">{titulo}</h1>
		</div>
		{#if children}<div class="flex shrink-0 flex-wrap items-center gap-2">{@render children()}</div>{/if}
	</div>
	{#if pie}<div class="mt-2">{@render pie()}</div>{/if}
</header>
