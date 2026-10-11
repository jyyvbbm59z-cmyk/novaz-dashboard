<script lang="ts">
	import { page } from '$app/state';
	import ArticuloDetalle from '$comp/ArticuloDetalle.svelte';
	import ArticuloForm from '$comp/ArticuloForm.svelte';
	import Hoja from '$comp/Hoja.svelte';
	import MuebleForm from '$comp/MuebleForm.svelte';
	import PlanoLocal from '$comp/PlanoLocal.svelte';
	import { accion } from '$lib/enviar';
	import { buscarArticulos, codigoUbicacion, MUEBLES } from '@novaz/core';
	import { ArrowLeft, Pencil, Plus, Printer, Search, Wrench } from '@lucide/svelte';
	import { tick } from 'svelte';

	let { data } = $props();
	const m = $derived(data.mueble);
	const zona = $derived(data.plano.zonas.find((z) => z.id === m.zonaId) ?? null);
	const def = $derived(MUEBLES[m.tipo]);
	const aqui = $derived(data.articulos.filter((a) => a.muebleId === m.id));
	const niveles = $derived(Array.from({ length: m.niveles }, (_, i) => i + 1));
	const enNivel = (n: number | null) => aqui.filter((a) => (n == null ? a.nivel == null || a.nivel > m.niveles : a.nivel === n));
	const marcado = $derived(Number(page.url.searchParams.get('nivel')) || null);
	const articuloMarcado = $derived(Number(page.url.searchParams.get('articulo')) || null);
	const nombreNivel = (n: number) => `${def.nivel.charAt(0).toUpperCase()}${def.nivel.slice(1)} ${n}`;

	$effect(() => {
		const id = articuloMarcado ? `a-${articuloMarcado}` : marcado ? `n-${marcado}` : null;
		if (id) tick().then(() => document.getElementById(id)?.scrollIntoView({ block: 'center', behavior: 'smooth' }));
	});

	// Añadir aquí: elegir de lo que ya hay o crear uno nuevo
	let hAnadir = $state(false);
	let destino = $state<number | null>(null);
	let filtro = $state('');
	let elegidos = $state<number[]>([]);
	let crear = $state(false);
	const candidatos = $derived.by(() => {
		const otros = data.articulos.filter((a) => a.estado !== 'baja' && !(a.muebleId === m.id && a.nivel === destino));
		const lista = filtro.trim().length > 1 ? buscarArticulos(filtro, otros, 40) : otros.filter((a) => !a.sitio.zonaId).concat(otros.filter((a) => a.sitio.zonaId));
		return lista.slice(0, 60);
	});
	function abrirAnadir(n: number | null) {
		destino = n;
		filtro = '';
		elegidos = [];
		crear = false;
		hAnadir = true;
	}
	async function meter() {
		await accion('/inventario/plano?/ubicar', { ids: elegidos.join(','), muebleId: m.id, ...(destino ? { nivel: destino } : {}) });
		hAnadir = false;
	}

	let hEditar = $state(false);
	let verId = $state<number | null>(null);
	let hVer = $state(false);
	const viendo = $derived(data.articulos.find((a) => a.id === verId) ?? null);
	$effect(() => {
		if (!hVer) verId = null;
	});
</script>

<svelte:head><title>{codigoUbicacion(zona, m)} · {m.nombre}</title></svelte:head>

<a href="/inventario/plano" class="mb-3 inline-flex items-center gap-1 text-xs text-texto-3 hover:text-texto"><ArrowLeft size={13} /> Plano del local</a>

<div class="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_16rem]">
	<div class="flex min-w-0 flex-col gap-4">
		<header class="flex items-start gap-4">
			<span class="flex h-16 min-w-16 shrink-0 items-center justify-center rounded-xl px-3 font-mono text-2xl font-extrabold text-white" style="background: {zona?.color ?? 'var(--texto-3)'}">{codigoUbicacion(zona, m)}</span>
			<div class="min-w-0 flex-1">
				<p class="etiqueta">{zona ? `Zona ${zona.codigo} · ${zona.nombre}` : 'Fuera de las zonas'}</p>
				<h2 class="text-2xl font-semibold">{m.nombre}</h2>
				<p class="text-xs text-texto-3">{def.nombre} · {m.ancho.toLocaleString('es-ES')} × {m.fondo.toLocaleString('es-ES')} m{m.niveles > 1 ? ` · ${m.niveles} ${def.nivel === 'cajón' ? 'cajones' : `${def.nivel}s`}` : ''}{m.notas ? ` · ${m.notas}` : ''}</p>
			</div>
		</header>
		<div class="flex flex-wrap gap-2">
			<button class="btn btn-acento h-9" onclick={() => abrirAnadir(null)}><Plus size={16} /> Añadir aquí</button>
			<button class="btn h-9" onclick={() => (hEditar = true)}><Pencil size={15} /> Editar</button>
			<a href="/inventario/etiquetas?mueble={m.id}" class="btn h-9"><Printer size={15} /> Etiquetas</a>
		</div>

		{#snippet fila(a: (typeof aqui)[number])}
			<li id="a-{a.id}">
				<button class="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-superficie-2 {articuloMarcado === a.id ? 'bg-acento/10' : ''}" onclick={() => ((verId = a.id), (hVer = true))}>
					<span class="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-superficie-3">
						{#if a.portada}<img src="/archivos/{a.portada}?mini" alt="" class="h-full w-full object-cover" />{:else}<Wrench size={15} class="text-texto-3" />{/if}
					</span>
					<span class="min-w-0 flex-1">
						<span class="block truncate text-sm font-medium">{a.nombre}{a.cantidad > 1 ? ` ×${a.cantidad.toLocaleString('es-ES')}` : ''}</span>
						{#if a.ubicacion || a.estado !== 'ok'}<span class="block truncate text-xs text-texto-3">{[a.ubicacion, a.estado === 'prestada' ? `prestada${a.prestadaA ? ` a ${a.prestadaA}` : ''}` : a.estado === 'perdida' ? 'no la encuentro' : a.estado === 'reparar' ? 'a reparar' : null].filter(Boolean).join(' · ')}</span>{/if}
					</span>
				</button>
			</li>
		{/snippet}

		{#if m.niveles > 0}
			{#each niveles as n (n)}
				{@const lista = enNivel(n)}
				<section id="n-{n}" class="tarjeta overflow-hidden {marcado === n ? 'border-acento' : ''}">
					<div class="flex items-center gap-3 border-b border-borde px-3 py-2">
						<span class="font-mono text-sm font-bold">{codigoUbicacion(zona, m, n)}</span>
						<span class="flex-1 text-xs text-texto-3">{nombreNivel(n)}{n === 1 && def.ayudaNivel ? ` · ${def.ayudaNivel.toLowerCase()}` : ''}</span>
						<button class="text-xs font-semibold text-acento" onclick={() => abrirAnadir(n)}>+ Añadir</button>
					</div>
					{#if lista.length}<ul class="lista-filas">{#each lista as a (a.id)}{@render fila(a)}{/each}</ul>{:else}<p class="px-3 py-2.5 text-xs text-texto-3">Vacío</p>{/if}
				</section>
			{/each}
		{/if}
		{#if enNivel(null).length || m.niveles === 0}
			<section class="tarjeta overflow-hidden">
				<p class="border-b border-borde px-3 py-2 text-xs text-texto-3">{m.niveles ? 'En el mueble, sin balda concreta' : 'Aquí'}</p>
				{#if enNivel(null).length}<ul class="lista-filas">{#each enNivel(null) as a (a.id)}{@render fila(a)}{/each}</ul>{:else}<p class="px-3 py-2.5 text-xs text-texto-3">Vacío</p>{/if}
			</section>
		{/if}
	</div>

	<aside class="tarjeta hidden p-2 lg:block">
		<PlanoLocal zonas={data.plano.zonas} muebles={data.plano.muebles} resaltados={[m.id]} seleccion={m.id} compacto />
	</aside>
</div>

<Hoja bind:abierta={hAnadir} titulo="Añadir a {codigoUbicacion(zona, m, destino)}">
	{#if crear}
		<ArticuloForm tipoInicial="herramienta" sitio={{ muebleId: m.id, nivel: destino, zonaId: m.zonaId }} categorias={data.categoriasInv} ubicaciones={data.ubicaciones} vehiculos={data.vehiculosMenu} hoy={data.hoy} alGuardar={() => (hAnadir = false)} />
	{:else}
		<div class="flex flex-col gap-3">
			<button class="btn h-11" onclick={() => (crear = true)}><Plus size={16} /> Algo nuevo (aún no está en el inventario)</button>
			<label class="relative">
				<Search size={15} class="absolute top-1/2 left-3 -translate-y-1/2 text-texto-3" />
				<input bind:value={filtro} class="input h-10 pl-9" placeholder="Buscar en el inventario…" />
			</label>
			<p class="text-xs text-texto-3">{filtro ? 'Coincidencias' : 'Primero lo que aún no tiene sitio'} · marca lo que guardas aquí</p>
			<ul class="tarjeta lista-filas max-h-[45dvh] overflow-y-auto">
				{#each candidatos as a (a.id)}
					<li>
						<label class="flex cursor-pointer items-center gap-3 px-3 py-2 hover:bg-superficie-2">
							<input type="checkbox" value={a.id} bind:group={elegidos} class="h-5 w-5 shrink-0 accent-[var(--acento)]" />
							<span class="min-w-0 flex-1">
								<span class="block truncate text-sm">{a.nombre}</span>
								<span class="block truncate text-xs text-texto-3">{a.sitio.codigo ? `Ahora en ${a.sitio.codigo}` : a.ubicacion ? `${a.ubicacion} · sin sitio en el plano` : 'Sin sitio'}</span>
							</span>
						</label>
					</li>
				{:else}
					<li class="px-3 py-3 text-sm text-texto-3">Nada por aquí. Crea uno nuevo.</li>
				{/each}
			</ul>
			<button class="btn btn-acento h-12" disabled={!elegidos.length} onclick={meter}>{elegidos.length ? `Guardar ${elegidos.length} en ${codigoUbicacion(zona, m, destino)}` : 'Marca lo que guardas aquí'}</button>
		</div>
	{/if}
</Hoja>

<Hoja bind:abierta={hEditar} titulo="{m.codigo} · {m.nombre}">
	{#key m.id}<MuebleForm mueble={m} existentes={data.plano.muebles} alGuardar={() => (hEditar = false)} />{/key}
</Hoja>

<Hoja bind:abierta={hVer} titulo={viendo?.nombre ?? ''}>
	{#if viendo}
		<ArticuloDetalle articulo={viendo} fotos={data.fotosInv[viendo.id] ?? []} historial={data.historial[viendo.id] ?? []} categorias={data.categoriasInv} ubicaciones={data.ubicaciones} vehiculos={data.vehiculosMenu} hoy={data.hoy} alCerrar={() => (hVer = false)} />
	{/if}
</Hoja>
