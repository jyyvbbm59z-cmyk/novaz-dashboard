<script lang="ts">
	import { enhance } from '$app/forms';
	import { enviar } from '$lib/enviar';
	import { diasEntre, fechaLarga } from '@novaz/core';
	import { Check, X } from '@lucide/svelte';

	let { data } = $props();
	const herramientas = $derived(data.articulos.filter((a) => a.tipo === 'herramienta' && a.estado !== 'baja'));
	let marcas = $state<Record<number, 'esta' | 'falta'>>({});
	const grupos = $derived.by(() => {
		const m = new Map<string, typeof herramientas>();
		for (const a of herramientas) m.set(a.ubicacion ?? 'Sin ubicación', [...(m.get(a.ubicacion ?? 'Sin ubicación') ?? []), a]);
		return [...m.entries()].sort((a, b) => a[0].localeCompare(b[0], 'es'));
	});
	const hechas = $derived(Object.keys(marcas).length);
	const presentes = $derived(Object.entries(marcas).filter(([, v]) => v === 'esta').map(([k]) => k).join(','));
	const faltan = $derived(Object.entries(marcas).filter(([, v]) => v === 'falta').map(([k]) => k).join(','));
	const marcarGrupo = (lista: typeof herramientas) => {
		for (const a of lista) if (!marcas[a.id]) marcas[a.id] = 'esta';
	};
</script>

<svelte:head><title>Recuento · {data.ajustes.nombreTaller}</title></svelte:head>

<p class="mb-4 max-w-2xl text-sm text-texto-3">
	Recorre el taller ubicación por ubicación y marca lo que está en su sitio (✓) y lo que no encuentras (✗). Lo que falte quedará como «No la encuentro» hasta que aparezca.
</p>

{#if !herramientas.length}
	<div class="vacio">Primero añade tus herramientas en la pestaña Herramientas.</div>
{:else}
	<div class="flex flex-col gap-5 pb-24">
		{#each grupos as [ubic, lista] (ubic)}
			<section>
				<div class="mb-2 flex items-center justify-between gap-2">
					<p class="etiqueta">📍 {ubic} · {lista.length}</p>
					<button class="text-xs font-semibold text-acento" onclick={() => marcarGrupo(lista)}>Todo está aquí</button>
				</div>
				<ul class="tarjeta lista-filas">
					{#each lista as a (a.id)}
						<li class="flex items-center gap-3 px-3 py-2">
							<span class="min-w-0 flex-1">
								<span class="block truncate text-sm font-medium">{a.nombre}{a.cantidad > 1 ? ` ×${a.cantidad}` : ''}</span>
								<span class="text-xs text-texto-3">{a.ultimoRecuento ? `Visto el ${fechaLarga(a.ultimoRecuento)}${diasEntre(a.ultimoRecuento, data.hoy) > 180 ? ' · hace mucho' : ''}` : 'Nunca recontada'}{a.estado === 'prestada' ? ` · prestada a ${a.prestadaA ?? '¿?'}` : a.estado === 'perdida' ? ' · no la encontrabas' : ''}</span>
							</span>
							<button class="btn btn-icono h-10 w-10 {marcas[a.id] === 'esta' ? 'border-transparent bg-ok text-black' : ''}" onclick={() => (marcas[a.id] = 'esta')} aria-label="Está" aria-pressed={marcas[a.id] === 'esta'}><Check size={18} strokeWidth={3} /></button>
							<button class="btn btn-icono h-10 w-10 {marcas[a.id] === 'falta' ? 'border-transparent bg-vencido text-white' : ''}" onclick={() => (marcas[a.id] = 'falta')} aria-label="Falta" aria-pressed={marcas[a.id] === 'falta'}><X size={18} strokeWidth={3} /></button>
						</li>
					{/each}
				</ul>
			</section>
		{/each}
	</div>
	<form method="POST" action="/inventario?/recuento" use:enhance={enviar({ alTerminar: () => (marcas = {}) })} class="fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+5.25rem)] z-40 mx-auto flex max-w-md items-center gap-3 rounded-2xl border border-borde bg-superficie-3/95 p-2.5 pl-4 shadow-2xl backdrop-blur lg:bottom-6">
		<input type="hidden" name="presentes" value={presentes} />
		<input type="hidden" name="faltan" value={faltan} />
		<span class="flex-1 text-sm"><strong>{hechas}</strong> de {herramientas.length} revisadas{faltan ? ` · ${faltan.split(',').length} faltan` : ''}</span>
		<button class="btn btn-acento h-10" disabled={!hechas}>Guardar</button>
	</form>
{/if}
