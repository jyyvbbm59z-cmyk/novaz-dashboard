<script lang="ts">
	import { avisos } from '$lib/avisos.svelte';
	import { CircleAlert, CircleCheck, Info } from '@lucide/svelte';
	import { fly } from 'svelte/transition';

	const iconos = { ok: CircleCheck, error: CircleAlert, info: Info };
</script>

<div class="pointer-events-none fixed inset-x-0 top-3 z-[100] flex flex-col items-center gap-2 px-4" aria-live="polite">
	{#each avisos as a (a.id)}
		{@const I = iconos[a.tipo]}
		<div
			transition:fly={{ y: -12, duration: 180 }}
			class="tarjeta pointer-events-auto flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium"
		>
			<I size={18} class={a.tipo === 'error' ? 'nivel-vencido' : a.tipo === 'ok' ? 'nivel-ok' : 'nivel-pronto'} />
			{a.texto}
		</div>
	{/each}
</div>
