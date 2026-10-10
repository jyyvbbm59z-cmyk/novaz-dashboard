<script lang="ts">
	import '../app.css';
	import { onNavigate } from '$app/navigation';
	import { navigating, page } from '$app/state';
	import Avisos from '$comp/Avisos.svelte';
	import Buscador from '$comp/Buscador.svelte';
	import Logo from '$comp/Logo.svelte';
	import { configurarMomentos } from '$lib/momentos';
	import { Boxes, BookOpenText, CarFront, FileText, House, LayoutGrid, Plus, ReceiptText, Search, Settings, ShoppingCart, Users, Warehouse, Wrench } from '@lucide/svelte';
	import Hoja from '$comp/Hoja.svelte';

	let { data, children } = $props();
	let buscando = $state(false);
	let altoCabecera = $state(0);
	let menuMas = $state(false);
	const MAS = [
		{ href: '/local', texto: 'El local', icono: Warehouse },
		{ href: '/inventario', texto: 'Inventario', icono: Boxes },
		{ href: '/inventario/compras', texto: 'Lista de la compra', icono: ShoppingCart },
		{ href: '/contabilidad/facturas', texto: 'Facturas', icono: FileText },
		{ href: '/contactos', texto: 'Contactos', icono: Users },
		{ href: '/ajustes', texto: 'Ajustes', icono: Settings }
	];

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

	const GRUPOS = [
		{
			titulo: 'Taller',
			items: [
				{ href: '/', texto: 'Inicio', icono: House },
				{ href: '/flota', texto: 'Flota', icono: CarFront },
				{ href: '/restauraciones', texto: 'Restauraciones', icono: Wrench },
				{ href: '/local', texto: 'El local', icono: Warehouse },
				{ href: '/inventario', texto: 'Inventario', icono: Boxes },
				{ href: '/contactos', texto: 'Contactos', icono: Users }
			]
		},
		{
			titulo: 'Dinero',
			items: [
				{ href: '/contabilidad/movimientos', texto: 'Movimientos', icono: ReceiptText },
				{ href: '/contabilidad', texto: 'Contabilidad', icono: BookOpenText, exacta: true }
			]
		},
		{ titulo: 'Sistema', items: [{ href: '/ajustes', texto: 'Ajustes', icono: Settings }] }
	];
	const MOVIL = [
		{ href: '/', texto: 'Inicio', icono: House },
		{ href: '/flota', texto: 'Flota', icono: CarFront },
		null,
		{ href: '/restauraciones', texto: 'Obras', icono: Wrench },
		{ href: '/contabilidad', texto: 'Dinero', icono: BookOpenText }
	];

	const ruta = $derived(page.url.pathname);
	function activo(href: string, exacta = false) {
		if (href === '/') return ruta === '/';
		if (exacta) return ruta === href || (ruta.startsWith(href + '/') && !ruta.startsWith('/contabilidad/movimientos'));
		return ruta === href || ruta.startsWith(href + '/');
	}
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
			{#each GRUPOS as g (g.titulo)}
				<div class="flex flex-col gap-0.5">
					<p class="mb-1 px-3 text-[0.62rem] font-semibold tracking-[0.16em] text-texto-3/80 uppercase">{g.titulo}</p>
					{#each g.items as n (n.href)}
						{@const on = activo(n.href, 'exacta' in n && n.exacta)}
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
					{/each}
				</div>
			{/each}
		</nav>

		<a href="/captura" class="btn btn-acento mt-auto h-11 shadow-[0_8px_24px_-10px_var(--acento)]"><Plus size={18} strokeWidth={2.4} /> Registrar</a>
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
			<button class="btn btn-fantasma btn-icono" onclick={() => (menuMas = true)} aria-label="Más secciones"><LayoutGrid size={20} /></button>
		</div>
	</header>

	<main class="mx-auto w-full max-w-6xl px-4 pt-5 pb-seguro sm:px-6 lg:px-10 lg:pt-9 lg:pb-16" style="view-transition-name: contenido">
		{@render children()}
	</main>

	<!-- Barra inferior (móvil) -->
	<nav
		class="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-borde bg-fondo/85 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden"
		style="view-transition-name: barra-inferior"
	>
		{#each MOVIL as n, i (i)}
			{#if n}
				{@const on = activo(n.href)}
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

<Hoja bind:abierta={menuMas} titulo="Secciones">
	<nav class="grid grid-cols-3 gap-2">
		{#each MAS as n (n.href)}
			<a href={n.href} onclick={() => (menuMas = false)} class="tarjeta flex flex-col items-center gap-2 px-2 py-4 text-center text-xs font-medium transition active:scale-95 {activo(n.href) ? 'border-acento/60' : ''}">
				<n.icono size={22} strokeWidth={1.75} class={activo(n.href) ? 'text-acento' : 'text-texto-2'} />{n.texto}
			</a>
		{/each}
	</nav>
</Hoja>

<Buscador bind:abierto={buscando} vehiculos={data.vehiculosMenu} />
<Avisos />
