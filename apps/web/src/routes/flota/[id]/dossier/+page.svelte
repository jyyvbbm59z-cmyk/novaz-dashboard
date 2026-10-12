<script lang="ts">
	import { page } from '$app/state';
	import { pdfDossier } from '$lib/dossierPdf';
	import { euros, fechaLarga } from '@novaz/core';
	import { ArrowLeft, FileDown, LoaderCircle } from '@lucide/svelte';

	let { data } = $props();
	const d = $derived(data.dossier);
	let estado = $state<'listo' | 'preparando' | 'hecho'>('listo');
	let url = $state<string | null>(null);
	let error = $state<string | null>(null);
	const nombre = $derived(`dossier-${d.alias.normalize('NFD').replace(/[^\w]+/g, '-').toLowerCase()}.pdf`);

	async function preparar() {
		estado = 'preparando';
		error = null;
		try {
			const blob = await pdfDossier(d, data.ajustes.nombreTaller, data.ajustes.acento, data.hoy);
			if (url) URL.revokeObjectURL(url);
			url = URL.createObjectURL(blob);
			estado = 'hecho';
		} catch (e) {
			error = (e as Error).message;
			estado = 'listo';
		}
	}
	const conCostes = $derived(page.url.searchParams.has('costes'));
</script>

<svelte:head><title>Dossier · {d.alias}</title></svelte:head>

<a href="/flota/{page.params.id}?pestana=ficha" class="mb-3 inline-flex items-center gap-1 text-xs text-texto-3 hover:text-texto"><ArrowLeft size={13} /> {d.alias}</a>
<p class="etiqueta">Dossier del vehículo{conCostes ? ' · con costes' : ''}</p>
<h1 class="titulo-pagina mb-2">{d.alias}</h1>
<p class="mb-5 text-sm text-texto-2">{[d.marca, d.modelo, d.anio].filter(Boolean).join(' · ')}{d.matricula ? ` · ${d.matricula}` : ''}{d.km != null ? ` · ${d.km.toLocaleString('es-ES')} km` : ''}</p>

<section class="tarjeta mb-5 flex flex-wrap items-center gap-3 p-4">
	<p class="min-w-0 flex-1 text-sm text-texto-2">
		Un PDF con la historia completa: portada con foto, papeles en vigor, ficha técnica verificada, {d.historial.length} intervenciones{d.restauraciones.length ? ', la restauración' : ''}{d.costes ? ', la inversión' : ''} y {d.fotos.length} fotos. Ideal para vender el vehículo o archivarlo.
	</p>
	{#if estado === 'hecho' && url}
		<a href={url} download={nombre} target="_blank" class="btn btn-acento h-11"><FileDown size={17} /> Abrir el PDF</a>
		<button class="text-xs text-texto-3 hover:text-texto" onclick={preparar}>Rehacer</button>
	{:else}
		<button class="btn btn-acento h-11" disabled={estado === 'preparando'} onclick={preparar}>
			{#if estado === 'preparando'}<LoaderCircle size={17} class="animate-spin" /> Preparando fotos…{:else}<FileDown size={17} /> Generar el PDF{/if}
		</button>
	{/if}
	{#if error}<p class="w-full text-xs nivel-vencido">No se ha podido generar: {error}</p>{/if}
</section>

<!-- Vista previa -->
<div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
	<section class="tarjeta p-4">
		<p class="etiqueta mb-2">Historial ({d.historial.length})</p>
		<ul class="flex flex-col gap-2 text-sm">
			{#each d.historial.slice(0, 12) as e, i (i)}
				<li class="flex gap-3"><span class="w-20 shrink-0 text-xs text-texto-3">{e.fecha.split('-').reverse().join('/')}</span><span class="min-w-0 flex-1">{e.titulo}{e.km != null ? ` · ${e.km.toLocaleString('es-ES')} km` : ''}</span></li>
			{:else}
				<li class="text-texto-3">Sin mantenimientos registrados todavía.</li>
			{/each}
			{#if d.historial.length > 12}<li class="text-xs text-texto-3">…y {d.historial.length - 12} más en el PDF</li>{/if}
		</ul>
	</section>
	<section class="tarjeta p-4">
		<p class="etiqueta mb-2">Ficha técnica verificada</p>
		{#each d.ficha as sec (sec.seccion)}
			<p class="mt-2 text-xs font-semibold text-texto-3">{sec.seccion}</p>
			{#each sec.datos as x (x.nombre)}<p class="flex justify-between gap-3 text-sm"><span>{x.nombre}</span><span class="cifra">{x.valor}</span></p>{/each}
		{:else}
			<p class="text-sm text-texto-3">Nada verificado aún: solo entra en el dossier lo que has comprobado.</p>
		{/each}
	</section>
	{#if d.papeles.length}
		<section class="tarjeta p-4">
			<p class="etiqueta mb-2">Papeles en vigor</p>
			{#each d.papeles as x (x.tipo)}<p class="flex justify-between text-sm"><span>{x.tipo}</span><span class="text-texto-2">hasta el {fechaLarga(x.vence)}</span></p>{/each}
		</section>
	{/if}
	{#if d.costes}
		<section class="tarjeta p-4">
			<p class="etiqueta mb-2">Inversión</p>
			<p class="cifra text-3xl">{euros(d.costes.total, { redondo: true })}</p>
		</section>
	{/if}
	{#if d.fotos.length}
		<section class="tarjeta p-4 lg:col-span-2">
			<p class="etiqueta mb-2">Fotos</p>
			<div class="grid grid-cols-4 gap-2">{#each d.fotos as f (f.clave)}<img src="/archivos/{f.clave}?mini" alt={f.pie ?? ''} class="aspect-square w-full rounded-lg object-cover" />{/each}</div>
		</section>
	{/if}
</div>
