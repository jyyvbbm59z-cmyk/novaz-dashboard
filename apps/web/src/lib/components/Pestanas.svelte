<script lang="ts">
	// Barra de pestañas: indicador que se desliza, pestaña activa siempre a la vista
	// y degradado en los bordes cuando hay más contenido a los lados.
	import { tick } from 'svelte';

	interface Pestana {
		href: string;
		texto: string;
		activa: boolean;
		cuenta?: number | null;
	}

	let { pestanas, fija = false, consulta = false }: { pestanas: Pestana[]; fija?: boolean; consulta?: boolean } = $props();

	let carril: HTMLElement;
	let indicador = $state({ x: 0, w: 0, listo: false });
	let bordes = $state({ izq: false, der: false });

	function medirBordes() {
		if (!carril) return;
		bordes = { izq: carril.scrollLeft > 4, der: carril.scrollLeft + carril.clientWidth < carril.scrollWidth - 4 };
	}

	async function colocar(suave: boolean) {
		await tick();
		const activa = carril?.querySelector<HTMLElement>('[aria-current="page"]');
		if (!activa) return;
		indicador = { x: activa.offsetLeft, w: activa.offsetWidth, listo: suave || indicador.listo };
		const destino = activa.offsetLeft - (carril.clientWidth - activa.offsetWidth) / 2;
		carril.scrollTo({ left: Math.max(0, destino), behavior: suave ? 'smooth' : 'instant' });
		medirBordes();
	}

	let primera = true;
	$effect(() => {
		pestanas.findIndex((p) => p.activa); // dependencia
		colocar(!primera);
		primera = false;
	});
</script>

<svelte:window onresize={() => colocar(false)} />

<div class="pestanas-envoltura {fija ? 'fija' : ''}" class:borde-izq={bordes.izq} class:borde-der={bordes.der}>
	<nav bind:this={carril} class="carril" onscroll={medirBordes}>
		{#each pestanas as p (p.href)}
			<a
				href={p.href}
				aria-current={p.activa ? 'page' : undefined}
				data-sveltekit-noscroll={consulta || undefined}
				data-sveltekit-replacestate={consulta || undefined}
				class="pestana-item"
			>
				{p.texto}
				{#if p.cuenta}<span class="cuenta">{p.cuenta}</span>{/if}
			</a>
		{/each}
		<span class="indicador" class:animado={indicador.listo} style="transform: translateX({indicador.x}px); width: {indicador.w}px"></span>
	</nav>
</div>

<style>
	.pestanas-envoltura {
		position: relative;
		margin-inline: -1rem;
		border-bottom: 1px solid var(--borde);
	}
	.fija {
		position: sticky;
		top: var(--alto-cabecera, 0px);
		z-index: 20;
		background: color-mix(in oklab, var(--fondo) 88%, transparent);
		backdrop-filter: blur(14px) saturate(1.4);
	}
	@media (min-width: 640px) {
		.pestanas-envoltura {
			margin-inline: 0;
		}
	}
	.carril {
		position: relative;
		display: flex;
		gap: 0.25rem;
		overflow-x: auto;
		padding-inline: 1rem;
		scrollbar-width: none;
		overscroll-behavior-x: contain;
	}
	.carril::-webkit-scrollbar {
		display: none;
	}
	@media (min-width: 640px) {
		.carril {
			padding-inline: 0;
		}
	}
	/* Degradados que insinúan que hay más pestañas */
	.pestanas-envoltura::before,
	.pestanas-envoltura::after {
		content: '';
		position: absolute;
		top: 0;
		bottom: 1px;
		width: 2.5rem;
		pointer-events: none;
		z-index: 1;
		opacity: 0;
		transition: opacity 0.2s;
	}
	.pestanas-envoltura::before {
		left: 0;
		background: linear-gradient(to right, var(--fondo), transparent);
	}
	.pestanas-envoltura::after {
		right: 0;
		background: linear-gradient(to left, var(--fondo), transparent);
	}
	.borde-izq::before,
	.borde-der::after {
		opacity: 1;
	}
	.pestana-item {
		position: relative;
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		flex-shrink: 0;
		padding: 0.8rem 0.75rem;
		font-size: 0.875rem;
		font-weight: 500;
		white-space: nowrap;
		color: var(--texto-3);
		transition: color 0.15s;
		-webkit-tap-highlight-color: transparent;
	}
	.pestana-item:hover {
		color: var(--texto-2);
	}
	.pestana-item[aria-current='page'] {
		color: var(--texto);
	}
	.cuenta {
		min-width: 1.15rem;
		padding: 0 0.3rem;
		border-radius: 999px;
		background: var(--superficie-3);
		font-size: 0.68rem;
		line-height: 1.15rem;
		text-align: center;
		color: var(--texto-2);
	}
	.indicador {
		position: absolute;
		left: 0;
		bottom: 0;
		height: 2px;
		border-radius: 2px 2px 0 0;
		background: var(--acento);
		box-shadow: 0 0 12px color-mix(in oklab, var(--acento) 60%, transparent);
	}
	.indicador.animado {
		transition:
			transform 0.32s cubic-bezier(0.3, 0.9, 0.3, 1),
			width 0.32s cubic-bezier(0.3, 0.9, 0.3, 1);
	}
</style>
