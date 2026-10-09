<script lang="ts">
	// Hoja modal: panel inferior en móvil, diálogo centrado en escritorio.
	import { X } from '@lucide/svelte';
	import type { Snippet } from 'svelte';

	let {
		abierta = $bindable(false),
		titulo,
		ancho = 'max-w-lg',
		children
	}: { abierta?: boolean; titulo: string; ancho?: string; children: Snippet } = $props();

	let dlg: HTMLDialogElement;

	$effect(() => {
		if (abierta && !dlg.open) dlg.showModal();
		else if (!abierta && dlg.open) dlg.close();
	});
</script>

<dialog
	bind:this={dlg}
	onclose={() => (abierta = false)}
	onclick={(e) => e.target === dlg && (abierta = false)}
	class="hoja {ancho}"
>
	<div class="flex max-h-[inherit] flex-col">
		<header class="flex items-center justify-between gap-4 border-b border-borde px-5 py-3.5">
			<h2 class="text-xl">{titulo}</h2>
			<button type="button" class="btn btn-fantasma btn-icono -mr-2" onclick={() => (abierta = false)} aria-label="Cerrar">
				<X size={20} />
			</button>
		</header>
		<div class="overflow-y-auto px-5 py-4">
			{#if abierta}{@render children()}{/if}
		</div>
	</div>
</dialog>

<style>
	.hoja {
		margin: auto auto 0;
		width: 100%;
		max-height: 92dvh;
		padding: 0 0 env(safe-area-inset-bottom);
		border: 1px solid var(--borde);
		border-bottom: 0;
		border-radius: 1.1rem 1.1rem 0 0;
		background: var(--superficie);
		color: var(--texto);
		box-shadow: 0 -20px 60px -20px rgb(0 0 0 / 0.6);
	}
	.hoja[open] {
		animation: subir 0.22s cubic-bezier(0.2, 0.9, 0.3, 1);
	}
	.hoja::backdrop {
		background: rgb(0 0 0 / 0.55);
		backdrop-filter: blur(3px);
	}
	@media (min-width: 640px) {
		.hoja {
			margin: auto;
			border-bottom: 1px solid var(--borde);
			border-radius: 1rem;
			max-height: 85dvh;
		}
		.hoja[open] {
			animation: aparecer 0.18s ease-out;
		}
	}
	@keyframes subir {
		from {
			transform: translateY(40px);
			opacity: 0;
		}
	}
	@keyframes aparecer {
		from {
			transform: scale(0.97);
			opacity: 0;
		}
	}
</style>
