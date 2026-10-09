<script lang="ts">
	// Comparador antes/después arrastrable.
	let { antes, despues }: { antes: string; despues: string } = $props();
	let pos = $state(50);
</script>

<div class="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-superficie-2 select-none">
	<img src={despues} alt="Después" class="absolute inset-0 h-full w-full object-cover" />
	<img src={antes} alt="Antes" class="absolute inset-0 h-full w-full object-cover" style="clip-path: inset(0 {100 - pos}% 0 0)" />
	<div class="pointer-events-none absolute inset-y-0 w-0.5 bg-white shadow-[0_0_12px_rgb(0_0_0/0.6)]" style="left: {pos}%">
		<span class="absolute top-1/2 left-1/2 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-xs font-bold text-black shadow">⇆</span>
	</div>
	<span class="absolute top-3 left-3 rounded bg-black/60 px-2 py-0.5 text-xs font-semibold tracking-wider text-white uppercase">Antes</span>
	<span class="absolute top-3 right-3 rounded bg-black/60 px-2 py-0.5 text-xs font-semibold tracking-wider text-white uppercase">Después</span>
	<input type="range" min="0" max="100" bind:value={pos} class="absolute inset-0 h-full w-full cursor-ew-resize opacity-0" aria-label="Comparar antes y después" />
</div>
