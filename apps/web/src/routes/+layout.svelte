<script lang="ts">
	import '../app.css';
	import { page } from '$app/state';
	import Avisos from '$comp/Avisos.svelte';
	import Buscador from '$comp/Buscador.svelte';
	import Logo from '$comp/Logo.svelte';
	import { configurarMomentos } from '$lib/momentos';
	import { CarFront, House, Plus, ReceiptText, Search, Settings, Users, Wrench } from '@lucide/svelte';

	let { data, children } = $props();
	let buscando = $state(false);

	$effect(() => configurarMomentos(data.ajustes));

	const nav = [
		{ href: '/', texto: 'Inicio', icono: House },
		{ href: '/flota', texto: 'Flota', icono: CarFront },
		{ href: '/restauraciones', texto: 'Restauraciones', icono: Wrench },
		{ href: '/gastos', texto: 'Gastos', icono: ReceiptText },
		{ href: '/contactos', texto: 'Contactos', icono: Users },
		{ href: '/ajustes', texto: 'Ajustes', icono: Settings }
	];
	const navMovil = [nav[0], nav[1], null, nav[2], nav[3]];

	const activo = (href: string) => (href === '/' ? page.url.pathname === '/' : page.url.pathname.startsWith(href));
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

<div class="lg:grid lg:min-h-dvh lg:grid-cols-[15rem_1fr]">
	<!-- Barra lateral (escritorio) -->
	<aside class="sticky top-0 hidden h-dvh flex-col border-r border-borde bg-superficie/60 px-3 py-5 lg:flex">
		<a href="/" class="mb-7 px-3"><Logo nombre={data.ajustes.nombreTaller} lema={data.ajustes.lema} /></a>

		<button class="btn mb-4 justify-start text-texto-3" onclick={() => (buscando = true)}>
			<Search size={16} /> Buscar <kbd class="ml-auto rounded border border-borde px-1.5 font-mono text-[0.65rem]">Ctrl K</kbd>
		</button>

		<nav class="flex flex-col gap-0.5">
			{#each nav as n (n.href)}
				<a
					href={n.href}
					aria-current={activo(n.href) ? 'page' : undefined}
					class="group flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium text-texto-2 transition hover:bg-superficie-2 hover:text-texto aria-[current=page]:bg-superficie-2 aria-[current=page]:text-texto"
				>
					<n.icono size={18} strokeWidth={1.75} class="group-aria-[current=page]:text-acento" />
					{n.texto}
					{#if n.href === '/' && urgentes}
						<span class="ml-auto rounded-full bg-vencido px-1.5 text-[0.7rem] font-bold text-white">{urgentes}</span>
					{/if}
				</a>
			{/each}
		</nav>

		<a href="/captura" class="btn btn-acento mt-auto"><Plus size={18} /> Registrar</a>
	</aside>

	<!-- Cabecera (móvil) -->
	<header
		class="sticky top-0 z-30 flex items-center justify-between border-b border-borde bg-fondo/85 px-4 pt-[env(safe-area-inset-top)] backdrop-blur-lg lg:hidden"
	>
		<a href="/" class="py-3"><Logo nombre={data.ajustes.nombreTaller} compacto /></a>
		<div class="flex items-center">
			<button class="btn btn-fantasma btn-icono" onclick={() => (buscando = true)} aria-label="Buscar"><Search size={20} /></button>
			<a href="/contactos" class="btn btn-fantasma btn-icono" aria-label="Contactos"><Users size={20} /></a>
			<a href="/ajustes" class="btn btn-fantasma btn-icono" aria-label="Ajustes"><Settings size={20} /></a>
		</div>
	</header>

	<main class="mx-auto w-full max-w-6xl px-4 pt-5 pb-seguro sm:px-6 lg:px-10 lg:pt-8 lg:pb-16">
		{@render children()}
	</main>

	<!-- Barra inferior (móvil) -->
	<nav
		class="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-borde bg-fondo/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-lg lg:hidden"
	>
		{#each navMovil as n, i (i)}
			{#if n}
				<a
					href={n.href}
					aria-current={activo(n.href) ? 'page' : undefined}
					class="relative flex h-16 flex-col items-center justify-center gap-1 text-[0.68rem] font-medium text-texto-3 aria-[current=page]:text-texto"
				>
					<n.icono size={22} strokeWidth={activo(n.href) ? 2.1 : 1.6} class={activo(n.href) ? 'text-acento' : ''} />
					{n.texto === 'Restauraciones' ? 'Obras' : n.texto}
					{#if n.href === '/' && urgentes}
						<span class="absolute top-2 left-1/2 ml-2 h-2 w-2 rounded-full bg-vencido"></span>
					{/if}
				</a>
			{:else}
				<div class="flex items-center justify-center">
					<a
						href="/captura"
						aria-label="Registrar"
						class="-mt-6 flex h-14 w-14 items-center justify-center rounded-2xl text-[#111] shadow-lg ring-4 ring-fondo transition active:scale-95"
						style="background: var(--acento)"
					>
						<Plus size={28} strokeWidth={2.4} />
					</a>
				</div>
			{/if}
		{/each}
	</nav>
</div>

<Buscador bind:abierto={buscando} vehiculos={data.vehiculosMenu} />
<Avisos />
