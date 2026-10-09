<script lang="ts">
	import { accion } from '$lib/enviar';
	import { ChevronLeft, ChevronRight, Download, FileText, Star, Trash2, X } from '@lucide/svelte';

	interface Adj {
		id: number;
		clave: string;
		nombre: string;
		mime: string;
		pie: string | null;
		creado: string;
	}

	let {
		adjuntos,
		accionBorrar = '?/borrarAdjunto',
		accionPortada,
		portadaId = null,
		columnas = 'grid-cols-3 sm:grid-cols-4 lg:grid-cols-6'
	}: { adjuntos: Adj[]; accionBorrar?: string; accionPortada?: string; portadaId?: number | null; columnas?: string } = $props();

	const fotos = $derived(adjuntos.filter((a) => a.mime.startsWith('image/')));
	const docs = $derived(adjuntos.filter((a) => !a.mime.startsWith('image/')));

	let dlg: HTMLDialogElement;
	let actual = $state(0);

	function abrir(i: number) {
		actual = i;
		dlg.showModal();
	}
	function mover(d: number) {
		actual = (actual + d + fotos.length) % fotos.length;
	}
	async function borrar(id: number) {
		if (!confirm('¿Borrar este archivo?')) return;
		await accion(accionBorrar, { id });
		if (dlg.open) {
			if (fotos.length <= 1) dlg.close();
			else actual = Math.min(actual, fotos.length - 2);
		}
	}
	function teclas(e: KeyboardEvent) {
		if (!dlg?.open) return;
		if (e.key === 'ArrowRight') mover(1);
		if (e.key === 'ArrowLeft') mover(-1);
	}
</script>

<svelte:window onkeydown={teclas} />

{#if fotos.length}
	<div class="grid gap-1.5 {columnas}">
		{#each fotos as f, i (f.id)}
			<button class="group relative aspect-square overflow-hidden rounded-lg bg-superficie-2" onclick={() => abrir(i)}>
				<img src="/archivos/{f.clave}?mini" alt={f.pie ?? f.nombre} loading="lazy" class="h-full w-full object-cover transition group-hover:scale-[1.03]" />
				{#if f.id === portadaId}<Star size={14} class="absolute top-1.5 left-1.5 fill-acento text-acento drop-shadow" />{/if}
			</button>
		{/each}
	</div>
{/if}

{#if docs.length}
	<ul class="mt-3 flex flex-col gap-1.5">
		{#each docs as d (d.id)}
			<li class="flex items-center gap-3 rounded-lg border border-borde bg-superficie-2 px-3 py-2 text-sm">
				<FileText size={18} class="text-texto-3" />
				<a href="/archivos/{d.clave}" target="_blank" class="flex-1 truncate hover:underline">{d.pie ?? d.nombre}</a>
				<a href="/archivos/{d.clave}?descargar" class="btn btn-fantasma btn-icono h-8 w-8" aria-label="Descargar"><Download size={16} /></a>
				<button class="btn btn-fantasma btn-icono btn-peligro h-8 w-8" onclick={() => borrar(d.id)} aria-label="Borrar"><Trash2 size={16} /></button>
			</li>
		{/each}
	</ul>
{/if}

<dialog bind:this={dlg} class="visor" onclick={(e) => e.target === dlg && dlg.close()}>
	{#if fotos[actual]}
		{@const f = fotos[actual]}
		<div class="flex h-full flex-col">
			<div class="flex items-center justify-between gap-2 p-3 text-white">
				<span class="truncate text-sm opacity-80">{actual + 1} / {fotos.length} · {f.pie ?? f.nombre}</span>
				<div class="flex gap-1">
					{#if accionPortada}
						<button class="btn btn-fantasma btn-icono text-white" title="Usar como portada" onclick={() => accion(accionPortada!, { id: f.id })}>
							<Star size={18} class={f.id === portadaId ? 'fill-current' : ''} />
						</button>
					{/if}
					<a href="/archivos/{f.clave}?descargar" class="btn btn-fantasma btn-icono text-white" aria-label="Descargar"><Download size={18} /></a>
					<button class="btn btn-fantasma btn-icono text-white" onclick={() => borrar(f.id)} aria-label="Borrar"><Trash2 size={18} /></button>
					<button class="btn btn-fantasma btn-icono text-white" onclick={() => dlg.close()} aria-label="Cerrar"><X size={20} /></button>
				</div>
			</div>
			<div class="relative flex min-h-0 flex-1 items-center justify-center px-2 pb-4">
				<img src="/archivos/{f.clave}" alt={f.pie ?? f.nombre} class="max-h-full max-w-full rounded object-contain" />
				{#if fotos.length > 1}
					<button class="btn btn-icono absolute left-3 border-white/10 bg-black/50 text-white" onclick={() => mover(-1)} aria-label="Anterior"><ChevronLeft /></button>
					<button class="btn btn-icono absolute right-3 border-white/10 bg-black/50 text-white" onclick={() => mover(1)} aria-label="Siguiente"><ChevronRight /></button>
				{/if}
			</div>
		</div>
	{/if}
</dialog>

<style>
	.visor {
		width: 100vw;
		height: 100dvh;
		max-width: none;
		max-height: none;
		margin: 0;
		padding: env(safe-area-inset-top) 0 env(safe-area-inset-bottom);
		background: rgb(5 5 6 / 0.94);
		border: 0;
	}
	.visor::backdrop {
		background: transparent;
	}
</style>
