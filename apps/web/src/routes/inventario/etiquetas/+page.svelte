<script lang="ts">
	import { pdfEtiquetas, type EtiquetaPdf } from '$lib/etiquetasPdf';
	import { Printer } from '@lucide/svelte';

	let { data } = $props();
	let conNiveles = $state(true);
	// El PDF se prepara al entrar (y al cambiar la casilla): el botón es un enlace normal, que en el móvil abre a la primera
	let url = $state<string | null>(null);
	$effect(() => {
		const lista: EtiquetaPdf[] = data.etiquetas.flatMap((e) => [
			{ codigo: e.codigo, nombre: e.nombre, zona: e.zona, color: e.color, qr: e.qr, grande: true },
			...(conNiveles ? [...e.niveles.map((n) => ({ codigo: n.codigo, zona: n.nombre, color: e.color, qr: n.qr, grande: false })), ...e.contenedores.map((c) => ({ codigo: c.codigo, zona: c.nombre, color: e.color, qr: c.qr, grande: false }))] : [])
		]);
		let vivo = true;
		let hecho: string | null = null;
		url = null;
		if (lista.length)
			pdfEtiquetas(lista).then((b) => {
				hecho = URL.createObjectURL(b);
				if (vivo) url = hecho;
			});
		return () => {
			vivo = false;
			if (hecho) URL.revokeObjectURL(hecho);
		};
	});
</script>

<svelte:head><title>Etiquetas · {data.ajustes.nombreTaller}</title></svelte:head>

{#snippet codigoQr(q: { d: string; size: number }, clase: string)}
	<svg viewBox="-1 -1 {q.size + 2} {q.size + 2}" class={clase} shape-rendering="crispEdges" aria-hidden="true"><rect x="-1" y="-1" width={q.size + 2} height={q.size + 2} fill="#fff" /><path d={q.d} fill="#000" /></svg>
{/snippet}

<div class="mb-4 flex flex-wrap items-center gap-3">
	<p class="min-w-0 flex-1 text-sm text-texto-2">
		{data.etiquetas.length ? `Una etiqueta grande por mueble${conNiveles ? ' y una pequeña por balda, cajón y contenedor' : ''}. El QR abre la ficha con lo que hay dentro.` : 'Aún no hay muebles en el plano.'}
		{#if data.solo}<a href="/inventario/etiquetas" class="text-acento">Ver todas</a>{/if}
	</p>
	<label class="flex items-center gap-2 text-sm"><input type="checkbox" bind:checked={conNiveles} class="h-4 w-4 accent-[var(--acento)]" /> Baldas, cajones y contenedores</label>
	{#if url}
		<a href={url} target="_blank" download="etiquetas{data.solo ? `-${data.etiquetas[0]?.codigo ?? ''}` : ''}.pdf" class="btn btn-acento h-10"><Printer size={16} /> Imprimir (PDF)</a>
	{:else}
		<button class="btn btn-acento h-10" disabled><Printer size={16} /> {data.etiquetas.length ? 'Preparando el PDF…' : 'Imprimir'}</button>
	{/if}
</div>

{#if !data.etiquetas.length}
	<div class="vacio"><a href="/inventario/plano" class="text-acento">Pon los muebles en el plano</a> y aquí salen sus etiquetas.</div>
{:else}
	<div class="hoja-etiquetas">
		{#each data.etiquetas as e (e.id)}
			<div class="etiqueta-grande" style="--zona: {e.color}">
				<div class="banda"></div>
				<div class="texto">
					<p class="codigo">{e.codigo}</p>
					<p class="nombre">{e.nombre}</p>
					<p class="zona">{e.zona}</p>
				</div>
				{@render codigoQr(e.qr, 'qr-grande')}
			</div>
			{#if conNiveles}
				{#each e.niveles as n (n.n)}
					<div class="etiqueta-peq" style="--zona: {e.color}">
						<div class="banda"></div>
						<div class="texto">
							<p class="codigo">{n.codigo}</p>
							<p class="zona">{n.nombre}</p>
						</div>
						{@render codigoQr(n.qr, 'qr-peq')}
					</div>
				{/each}
				{#each e.contenedores as c (c.id)}
					<div class="etiqueta-peq" style="--zona: {e.color}">
						<div class="banda"></div>
						<div class="texto">
							<p class="codigo">{c.codigo}</p>
							<p class="zona">{c.nombre}</p>
						</div>
						{@render codigoQr(c.qr, 'qr-peq')}
					</div>
				{/each}
			{/if}
		{/each}
	</div>
{/if}

<style>
	.hoja-etiquetas {
		display: flex;
		flex-wrap: wrap;
		gap: 3mm;
		align-items: flex-start;
		color: #111;
		print-color-adjust: exact;
		-webkit-print-color-adjust: exact;
	}
	.etiqueta-grande,
	.etiqueta-peq {
		display: flex;
		align-items: center;
		gap: 3mm;
		background: #fff;
		border: 0.3mm solid #bbb;
		border-radius: 2mm;
		overflow: hidden;
		break-inside: avoid;
		font-family: var(--font-sans);
	}
	.etiqueta-grande {
		width: 90mm;
		height: 45mm;
		padding-right: 3mm;
	}
	.etiqueta-peq {
		width: 58mm;
		height: 22mm;
		padding-right: 2mm;
	}
	.banda {
		align-self: stretch;
		width: 4mm;
		background: var(--zona);
		flex-shrink: 0;
	}
	.texto {
		min-width: 0;
		flex: 1;
	}
	.codigo {
		font-family: var(--font-mono);
		font-weight: 800;
		line-height: 1;
		letter-spacing: -0.02em;
	}
	.etiqueta-grande .codigo {
		font-size: 13mm;
	}
	.etiqueta-peq .codigo {
		font-size: 7mm;
	}
	.nombre {
		margin-top: 2mm;
		font-size: 4mm;
		font-weight: 600;
		line-height: 1.15;
	}
	.zona {
		margin-top: 1mm;
		font-size: 2.8mm;
		color: #555;
		text-transform: capitalize;
	}
	:global(.qr-grande) {
		width: 32mm;
		height: 32mm;
		flex-shrink: 0;
	}
	:global(.qr-peq) {
		width: 17mm;
		height: 17mm;
		flex-shrink: 0;
	}
	@media print {
		@page {
			size: A4;
			margin: 8mm;
		}
		:global(body *) {
			visibility: hidden;
		}
		:global(body) {
			background: #fff !important;
		}
		.hoja-etiquetas,
		.hoja-etiquetas :global(*) {
			visibility: visible;
		}
		.hoja-etiquetas {
			position: absolute;
			inset: 0 auto auto 0;
			width: 100%;
		}
	}
</style>
