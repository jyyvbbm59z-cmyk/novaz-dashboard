<script lang="ts">
	import '../app.css';
	import { onNavigate } from '$app/navigation';
	import { navigating, page } from '$app/state';
	import Avisos from '$comp/Avisos.svelte';
	import Buscador from '$comp/Buscador.svelte';
	import Logo from '$comp/Logo.svelte';
	import { configurarMomentos } from '$lib/momentos';
	import { Boxes, BookOpenText, CarFront, House, Plus, Search, Settings, ShoppingCart, Users, Warehouse, Wrench } from '@lucide/svelte';

	let { data, children } = $props();
	let buscando = $state(false);
	let altoCabecera = $state(0);

	$effect(() => configurarMomentos(data.ajustes));

	// Transición suave solo al cambiar de sección (Flota → Dinero…). Dentro de una sección
	// (pestañas, subpáginas) no se anima nada: la barra de pestañas no debe moverse.
	let transicion: ViewTransition | null = null;
	const seccion = (u?: URL) => u?.pathname.split('/')[1] ?? '';
	onNavigate((nav) => {
		if (!document.startViewTransition || transicion) return;
		if (seccion(nav.from?.url) === seccion(nav.to?.url)) return;
		if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
		return new Promise((resolve) => {
			const t = document.startViewTransition(async () => {
				resolve();
				await nav.complete;
			});
			transicion = t;
			t.ready.catch(() => {});
			t.updateCallbackDone.catch(() => {});
			t.finished.catch(() => {}).finally(() => (transicion = null));
		});
	});

	// Cuatro áreas, con los mismos nombres en escritorio y móvil
	interface Pagina {
		href: string;
		texto: string;
		icono: typeof House;
		/** Otras rutas que cuentan como esta página. */
		tambien?: string[];
	}
	interface Area {
		titulo: string;
		icono: typeof House;
		paginas: Pagina[];
	}
	const AREAS: Area[] = [
		{
			titulo: 'Vehículos',
			icono: CarFront,
			paginas: [
				{ href: '/flota', texto: 'Flota', icono: CarFront },
				{ href: '/restauraciones', texto: 'Restauraciones', icono: Wrench },
				{ href: '/contactos', texto: 'Contactos', icono: Users }
			]
		},
		{
			titulo: 'Taller',
			icono: Warehouse,
			paginas: [
				{ href: '/local', texto: 'El local', icono: Warehouse },
				{ href: '/inventario', texto: 'Inventario', icono: Boxes },
				{ href: '/compras', texto: 'Compras', icono: ShoppingCart }
			]
		},
		{
			titulo: 'Dinero',
			icono: BookOpenText,
			paginas: [{ href: '/contabilidad', texto: 'Dinero', icono: BookOpenText, tambien: ['/facturas'] }]
		}
	];

	const ruta = $derived(page.url.pathname);
	const dentro = (href: string) => ruta === href || ruta.startsWith(href + '/');
	const paginaActiva = (p: Pagina) => dentro(p.href) || (p.tambien ?? []).some(dentro);
	const areaActiva = $derived(AREAS.find((a) => a.paginas.some(paginaActiva)) ?? null);
	// En el móvil, las páginas principales de un área llevan arriba un selector para saltar entre ellas
	const selectorArea = $derived(
		areaActiva && areaActiva.paginas.length > 1 && areaActiva.paginas.some((p) => ruta === p.href || (p.href === '/inventario' && dentro(p.href))) ? areaActiva : null
	);
	const barraMovil = $derived([
		{ href: '/', texto: 'Inicio', icono: House, on: ruta === '/' },
		{ href: '/flota', texto: 'Vehículos', icono: CarFront, on: areaActiva === AREAS[0] },
		null,
		{ href: '/local', texto: 'Taller', icono: Warehouse, on: areaActiva === AREAS[1] },
		{ href: '/contabilidad', texto: 'Dinero', icono: BookOpenText, on: areaActiva === AREAS[2] }
	]);
	const urgentes = $derived(data.alertas.filter((a) => a.nivel === 'vencido' || a.nivel === 'urgente').length);

	function teclas(e: KeyboardEvent) {
		if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
			e.preventDefault();
			buscando = true;
		}
	}
</script>

<svelte:window onkeydown={teclas} />
<svelte:head><title>{data.ajustes.nombreTaller}</title></svelte:head>

<!-- Progreso de navegación -->
{#if navigating.to}
	<div class="pointer-events-none fixed inset-x-0 top-0 z-[60] h-0.5 overflow-hidden">
		<div class="barra-progreso h-full w-full origin-left" style="background: var(--acento)"></div>
	</div>
{/if}

<div class="lg:grid lg:min-h-dvh lg:grid-cols-[15.5rem_1fr]" style="--alto-cabecera: {altoCabecera}px">
	<!-- Barra lateral (escritorio) -->
	<aside class="sticky top-0 hidden h-dvh flex-col border-r border-borde bg-superficie/50 px-3 py-5 backdrop-blur-xl lg:flex" style="view-transition-name: lateral">
		<a href="/" class="mb-6 px-2.5"><Logo nombre={data.ajustes.nombreTaller} lema={data.ajustes.lema} marca={data.ajustes.logoApp} /></a>

		<button class="btn mb-5 justify-start bg-superficie-2/60 text-texto-3" onclick={() => (buscando = true)}>
			<Search size={16} /> Buscar <kbd class="ml-auto rounded border border-borde px-1.5 font-mono text-[0.62rem]">Ctrl K</kbd>
		</button>

		<nav class="flex flex-col gap-5">
			{#snippet enlace(n: Pagina, on: boolean)}
				<a
					href={n.href}
					aria-current={on ? 'page' : undefined}
					class="group relative flex h-9 items-center gap-3 rounded-lg px-3 text-sm font-medium text-texto-2 transition hover:bg-superficie-2 hover:text-texto aria-[current=page]:bg-superficie-2 aria-[current=page]:text-texto"
				>
					{#if on}<span class="absolute top-2 bottom-2 -left-3 w-[3px] rounded-r-full" style="background: var(--acento)"></span>{/if}
					<n.icono size={17} strokeWidth={1.75} class={on ? 'text-acento' : 'text-texto-3 group-hover:text-texto-2'} />
					{n.texto}
					{#if n.href === '/' && urgentes}
						<span class="ml-auto rounded-full bg-vencido px-1.5 text-[0.68rem] leading-[1.15rem] font-bold text-white">{urgentes}</span>
					{/if}
				</a>
			{/snippet}
			<div class="flex flex-col gap-0.5">{@render enlace({ href: '/', texto: 'Inicio', icono: House }, ruta === '/')}</div>
			{#each AREAS as a (a.titulo)}
				<div class="flex flex-col gap-0.5">
					{#if a.paginas.length > 1}<p class="mb-1 px-3 text-[0.62rem] font-semibold tracking-[0.16em] text-texto-3/80 uppercase">{a.titulo}</p>{/if}
					{#each a.paginas as n (n.href)}{@render enlace(n, paginaActiva(n))}{/each}
				</div>
			{/each}
		</nav>

		<div class="mt-auto flex gap-2">
			<a href="/captura" class="btn btn-acento h-11 flex-1 shadow-[0_8px_24px_-10px_var(--acento)]"><Plus size={18} strokeWidth={2.4} /> Registrar</a>
			<a href="/ajustes" class="btn btn-icono h-11 w-11 {dentro('/ajustes') ? 'border-acento/60 text-acento' : 'text-texto-3'}" aria-label="Ajustes" title="Ajustes"><Settings size={18} /></a>
		</div>
	</aside>

	<!-- Cabecera (móvil) -->
	<header
		bind:clientHeight={altoCabecera}
		class="sticky top-0 z-30 flex items-center justify-between border-b border-borde bg-fondo/80 px-4 pt-[env(safe-area-inset-top)] backdrop-blur-xl lg:hidden"
		style="view-transition-name: cabecera"
	>
		<a href="/" class="py-2.5"><Logo nombre={data.ajustes.nombreTaller} compacto marca={data.ajustes.logoApp} /></a>
		<div class="-mr-2 flex items-center">
			<button class="btn btn-fantasma btn-icono" onclick={() => (buscando = true)} aria-label="Buscar"><Search size={20} /></button>
			<a href="/ajustes" class="btn btn-fantasma btn-icono {dentro('/ajustes') ? 'text-acento' : ''}" aria-label="Ajustes"><Settings size={20} /></a>
		</div>
	</header>

	<main class="mx-auto w-full max-w-6xl px-4 pt-5 pb-seguro sm:px-6 lg:px-10 lg:pt-9 lg:pb-16" style="view-transition-name: contenido">
		{#if selectorArea}
			<nav class="-mx-4 mb-4 flex gap-1.5 overflow-x-auto px-4 lg:hidden" style="scrollbar-width:none" aria-label={selectorArea.titulo}>
				{#each selectorArea.paginas as p (p.href)}
					{@const on = paginaActiva(p)}
					<a href={p.href} aria-current={on ? 'page' : undefined} class="chip h-9 shrink-0 gap-1.5 px-3.5 text-sm font-semibold {on ? 'border-acento/60 bg-acento/10 text-texto' : 'text-texto-3'}">
						<p.icono size={15} class={on ? 'text-acento' : ''} />{p.texto}
					</a>
				{/each}
			</nav>
		{/if}
		{@render children()}
	</main>

	<!-- Barra inferior (móvil) -->
	<nav
		class="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-borde bg-fondo/85 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden"
		style="view-transition-name: barra-inferior"
	>
		{#each barraMovil as n, i (i)}
			{#if n}
				{@const on = n.on}
				<a href={n.href} aria-current={on ? 'page' : undefined} class="relative flex h-16 flex-col items-center justify-center gap-1 text-[0.66rem] font-semibold tracking-wide {on ? 'text-texto' : 'text-texto-3'}">
					<span class="flex h-7 w-12 items-center justify-center rounded-full transition {on ? 'bg-acento/15' : ''}">
						<n.icono size={21} strokeWidth={on ? 2.1 : 1.7} class={on ? 'text-acento' : ''} />
					</span>
					{n.texto}
					{#if n.href === '/' && urgentes}<span class="absolute top-2.5 left-1/2 ml-2.5 h-2 w-2 rounded-full bg-vencido ring-2 ring-fondo"></span>{/if}
				</a>
			{:else}
				<div class="flex items-center justify-center">
					<a
						href="/captura"
						aria-label="Registrar"
						class="-mt-7 flex h-[3.6rem] w-[3.6rem] items-center justify-center rounded-2xl text-[#111] shadow-[0_10px_28px_-8px_var(--acento)] ring-4 ring-fondo transition active:scale-90"
						style="background: var(--acento)"
					>
						<Plus size={28} strokeWidth={2.5} />
					</a>
				</div>
			{/if}
		{/each}
	</nav>
</div>


<Buscador bind:abierto={buscando} vehiculos={data.vehiculosMenu} />
<Avisos />
