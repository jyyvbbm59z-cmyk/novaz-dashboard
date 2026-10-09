<script lang="ts">
	// Matrícula estilo europeo. Si no hay matrícula, no pinta nada.
	let { matricula, grande = false }: { matricula: string | null | undefined; grande?: boolean } = $props();
</script>

{#if matricula}
	<span
		class="inline-flex shrink-0 items-stretch overflow-hidden rounded-[4px] border border-black/70 bg-[#f4f4f0] font-mono font-semibold tracking-wider text-[#111] uppercase shadow-sm {grande
			? 'h-8 text-base'
			: 'h-5 text-[0.7rem]'}"
	>
		<span class="flex items-end bg-[#1f47b8] px-[3px] pb-[1px] text-[0.55em] leading-none font-bold text-white">E</span>
		<span class="flex items-center px-1.5 leading-none">{matricula}</span>
	</span>
{/if}
