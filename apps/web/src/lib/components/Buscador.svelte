<script lang="ts">
	import { goto } from '$app/navigation';
	import Placa from '$comp/Placa.svelte';
	import { Search } from '@lucide/svelte';

	interface Resultado {
		grupo: string;
		titulo: string;
		sub: string;
		matricula?: string | null;
		href: string;
	}

	let {
		abierto = $bindable(false),
		vehiculos
	}: { abierto?: boolean; vehiculos: { id: number; alias: string; matricula: string | null }[] } = $props();

	let dlg: HTMLDialogElement;
	let q = $state('');
	let resultados = $state<Resultado[]>([]);
	let sel = $state(0);
	let temporizador: ReturnType<typeof setTimeout>;

	$effect(() => {
		if (abierto && !dlg.open) {
			dlg.showModal();
			q = '';
			resultados = [];
			sel = 0;
		} else if (!abierto && dlg.open) dlg.close();
	});

	const sugerencias = $derived<Resultado[]>(
		vehiculos.slice(0, 8).map((v) => ({ grupo: 'Vehículos', titulo: v.alias, sub: '', matricula: v.matricula, href: `/flota/${v.id}` }))
	);
	const lista = $derived(q.trim().length >= 2 ? resultados : sugerencias);

	function buscar() {
		clearTimeout(temporizador);
		sel = 0;
		if (q.trim().length < 2) return;
		temporizador = setTimeout(async () => {
			const r = await fetch(`/api/buscar?q=${encodeURIComponent(q.trim())}`);
			if (r.ok) resultados = await r.json();
		}, 160);
	}

	function ir(r: Resultado) {
		abierto = false;
		goto(r.href);
	}

	function teclas(e: KeyboardEvent) {
		if (e.key === 'ArrowDown') {
			e.preventDefault();
			sel = Math.min(sel + 1, lista.length - 1);
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			sel = Math.max(sel - 1, 0);
		} else if (e.key === 'Enter' && lista[sel]) {
			e.preventDefault();
			ir(lista[sel]);
		}
	}
</script>

<dialog
	bind:this={dlg}
	onclose={() => (abierto = false)}
	onclick={(e) => e.target === dlg && (abierto = false)}
	class="buscador m-0 mx-auto mt-[8vh] w-[min(36rem,calc(100%-1.5rem))] rounded-xl border border-borde bg-superficie p-0 text-texto shadow-2xl"
>
	<div class="flex items-center gap-3 border-b border-borde px-4">
		<Search size={18} class="text-texto-3" />
		<!-- svelte-ignore a11y_autofocus -->
		<input
			bind:value={q}
			oninput={buscar}
			onkeydown={teclas}
			autofocus
			placeholder="Vehículo, matrícula, póliza, entrada…"
			class="h-14 flex-1 bg-transparent text-base outline-none placeholder:text-texto-3"
		/>
	</div>
	<ul class="max-h-[60vh] overflow-y-auto p-2">
		{#each lista as r, i (r.href + i)}
			{#if i === 0 || lista[i - 1].grupo !== r.grupo}
				<li class="etiqueta px-3 pt-3 pb-1.5">{r.grupo}</li>
			{/if}
			<li>
				<button
					class="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left {i === sel ? 'bg-superficie-3' : ''}"
					onmouseenter={() => (sel = i)}
					onclick={() => ir(r)}
				>
					<span class="flex-1 truncate font-medium">{r.titulo}</span>
					{#if r.sub}<span class="hidden truncate text-xs text-texto-3 sm:inline">{r.sub}</span>{/if}
					{#if r.matricula}<Placa matricula={r.matricula} />{/if}
				</button>
			</li>
		{:else}
			<li class="px-3 py-6 text-center text-sm text-texto-3">{q.trim().length >= 2 ? 'Sin resultados' : 'Escribe para buscar'}</li>
		{/each}
	</ul>
</dialog>

<style>
	.buscador::backdrop {
		background: rgb(0 0 0 / 0.55);
		backdrop-filter: blur(3px);
	}
</style>
