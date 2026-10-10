<script lang="ts">
	// Lo que hay que comprar para una avería o una tarea del local (enlaza a la lista de la compra).
	import type { ItemCompra } from '@novaz/core/schema';
	import { Check, ShoppingCart } from '@lucide/svelte';

	let { items }: { items: ItemCompra[] } = $props();
	const faltan = $derived(items.filter((i) => !i.comprado).length);
</script>

{#if items.length}
	<a href="/compras" class="mt-2 flex flex-wrap items-center gap-1.5 text-xs" title="Ir a la lista de la compra">
		<span class="flex items-center gap-1 font-semibold {faltan ? 'nivel-urgente' : 'nivel-ok'}">
			<ShoppingCart size={13} />{faltan ? `Comprar ${faltan}` : 'Todo comprado'}
		</span>
		{#each items as i (i.id)}
			<span class="chip h-6 px-2 {i.comprado ? 'text-texto-3 line-through' : ''}">{#if i.comprado}<Check size={11} />{/if}{i.texto}</span>
		{/each}
	</a>
{/if}
