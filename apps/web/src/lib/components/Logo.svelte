<script lang="ts">
	let { nombre, lema, compacto = false }: { nombre: string; lema?: string; compacto?: boolean } = $props();
</script>

<span class="flex items-center gap-2.5">
	<!-- Tuerca hexagonal -->
	<svg viewBox="0 0 32 32" class={compacto ? 'h-7 w-7' : 'h-9 w-9'} aria-hidden="true">
		<path d="M16 2.5 27.7 9.25v13.5L16 29.5 4.3 22.75V9.25Z" fill="var(--acento)" />
		<circle cx="16" cy="16" r="5.6" fill="var(--fondo)" />
		<circle cx="16" cy="16" r="2.4" fill="var(--acento)" opacity=".35" />
	</svg>
	<span class="flex flex-col leading-none">
		<span class="font-display font-bold tracking-[0.14em] uppercase {compacto ? 'text-xl' : 'text-2xl'}">{nombre}</span>
		{#if lema && !compacto}<span class="mt-1 text-[0.6rem] font-semibold tracking-[0.14em] whitespace-nowrap text-texto-3 uppercase">{lema}</span>{/if}
	</span>
</span>
