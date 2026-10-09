<script lang="ts">
	import { ICONOS } from '$lib/iconos';
	let { name = 'icono', valor = $bindable('cog') }: { name?: string; valor?: string } = $props();
</script>

<input type="hidden" {name} value={valor} />
<div class="grid grid-cols-8 gap-1.5 sm:grid-cols-11">
	{#each Object.entries(ICONOS) as [n, C] (n)}
		<button
			type="button"
			class="flex aspect-square items-center justify-center rounded-lg border transition {valor === n ? 'border-acento bg-acento/15 text-acento' : 'border-borde bg-superficie-2 text-texto-2 hover:text-texto'}"
			onclick={() => (valor = n)}
			aria-label={n}
			title={n}
		>
			<C size={18} strokeWidth={1.75} />
		</button>
	{/each}
</div>
