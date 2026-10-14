<script lang="ts">
	import ArticuloDetalle from '$comp/ArticuloDetalle.svelte';
	import LocalizarHoja from '$comp/LocalizarHoja.svelte';
	import ArticuloForm from '$comp/ArticuloForm.svelte';
	import Hoja from '$comp/Hoja.svelte';
	import { bajoMinimo, euros, encaja } from '@novaz/core';
	import { Droplets, Package, Pencil, Plus, Search } from '@lucide/svelte';

	let { data } = $props();
	const reserva = $derived(data.articulos.filter((a) => a.tipo !== 'herramienta'));
	let busqueda = $state('');
	let soloBajos = $state(false);
	const visibles = $derived(
		reserva
			.filter((a) => (!soloBajos || bajoMinimo(a, a.cantidad)) && encaja(busqueda, `${a.nombre} ${a.marca ?? ''} ${a.referencia ?? ''} ${a.categoria ?? ''} ${a.sitio.codigo ?? ''} ${a.notas ?? ''}`))
			.sort((a, b) => Number(bajoMinimo(b, b.cantidad)) - Number(bajoMinimo(a, a.cantidad)) || a.nombre.localeCompare(b.nombre, 'es'))
	);
	const bajos = $derived(reserva.filter((a) => bajoMinimo(a, a.cantidad)).length);
	const valor = $derived(reserva.reduce((t, a) => t + (a.valorCent ?? 0) * Math.max(a.cantidad, 0), 0));
	const n = (x: number) => x.toLocaleString('es-ES', { maximumFractionDigits: 2 });

	let hNueva = $state(false);
	let tipoNuevo = $state<'recambio' | 'consumible'>('consumible');
	let verId = $state<number | null>(null);
	let hVer = $state(false);
	const viendo = $derived(data.articulos.find((a) => a.id === verId) ?? null);
	// Tocar algo de la lista lo localiza en el plano; si aún no tiene sitio, se abre su ficha para ponérselo
	let locId = $state<number | null>(null);
	let hLoc = $state(false);
	let editarAlAbrir = $state(false);
	const localizado = $derived(data.articulos.find((a) => a.id === locId) ?? null);
	function localizar(id: number) {
		hVer = false;
		locId = id;
		hLoc = true;
	}
	function abrirFicha(id: number, editar = false) {
		hLoc = false;
		editarAlAbrir = editar;
		verId = id;
		hVer = true;
	}
	const tocar = (a: (typeof data.articulos)[number]) => (a.sitio.codigo ? localizar(a.id) : abrirFicha(a.id));
	/** Intro con un solo resultado: localizarlo directamente (al soltar la tecla, para que no cierre la hoja que abre). */
	function intro(e: KeyboardEvent) {
		if (e.key === 'Enter' && visibles.length === 1) tocar(visibles[0]);
	}
	const vehiculosDe = (ids: number[]) => data.vehiculosMenu.filter((v) => ids.includes(v.id)).map((v) => v.alias).join(', ');
</script>

<svelte:head><title>Recambios y consumibles · {data.ajustes.nombreTaller}</title></svelte:head>

<div class="mb-4 flex flex-wrap items-center gap-2">
	<label class="relative min-w-48 flex-1">
		<Search size={15} class="absolute top-1/2 left-3 -translate-y-1/2 text-texto-3" />
		<input bind:value={busqueda} onkeyup={intro} class="input h-9 pl-9 text-sm" placeholder="Buscar recambio o consumible…" />
	</label>
	{#if bajos}<button class="chip h-9 px-3 {soloBajos ? 'border-acento text-texto' : 'nivel-urgente'}" onclick={() => (soloBajos = !soloBajos)}>{bajos} por reponer</button>{/if}
	<button class="btn h-9" onclick={() => ((tipoNuevo = 'recambio'), (hNueva = true))}><Plus size={16} /> Recambio</button>
	<button class="btn btn-acento h-9" onclick={() => ((tipoNuevo = 'consumible'), (hNueva = true))}><Plus size={16} /> Consumible</button>
</div>
<p class="mb-4 text-xs text-texto-3">Valor en reserva: <span class="font-mono">{euros(valor, { redondo: true })}</span>. Lo que baja del mínimo aparece solo en la lista de la compra.</p>

{#if !reserva.length}
	<div class="vacio">Aceites, filtros, bujías, lija, guantes… Apunta lo que tienes y cuánto, y la app te avisa cuando toque reponer.</div>
{:else}
	<ul class="tarjeta lista-filas">
		{#each visibles as a (a.id)}
			{@const bajo = bajoMinimo(a, a.cantidad)}
			<li class="flex items-center">
				<button class="flex min-w-0 flex-1 items-center gap-3 px-3 py-2.5 text-left transition hover:bg-superficie-2" onclick={() => tocar(a)}>
					<span class="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-superficie-3">
						{#if a.portada}<img src="/archivos/{a.portada}?mini" alt="" class="h-full w-full object-cover" />{:else if a.tipo === 'consumible'}<Droplets size={18} class="text-texto-3" />{:else}<Package size={18} class="text-texto-3" />{/if}
					</span>
					<span class="min-w-0 flex-1">
						<span class="block truncate text-sm font-medium">{a.nombre}</span>
						<span class="block truncate text-xs text-texto-3">{[a.tipo === 'recambio' ? 'Recambio' : 'Consumible', a.sitio.codigo ?? a.ubicacion, a.vehiculoIds.length ? `para ${vehiculosDe(a.vehiculoIds)}` : null].filter(Boolean).join(' · ')}</span>
						{#if a.stockMinimo}
							<span class="mt-1 block h-1 w-24 overflow-hidden rounded-full bg-superficie-3"><span class="block h-full rounded-full" style="width: {Math.min((a.cantidad / (a.stockMinimo * 2)) * 100, 100)}%; background: {bajo ? 'var(--urgente)' : 'var(--ok)'}"></span></span>
						{/if}
					</span>
					<span class="text-right">
						<span class="cifra block text-xl {bajo ? 'nivel-urgente' : a.cantidad <= 0 ? 'text-texto-3' : ''}">{n(a.cantidad)}</span>
						<span class="text-xs text-texto-3">{a.unidad}</span>
					</span>
				</button>
				<button class="btn btn-fantasma btn-icono mr-1.5 h-9 w-9 shrink-0 text-texto-3" onclick={() => abrirFicha(a.id, true)} aria-label="Editar {a.nombre}"><Pencil size={15} /></button>
			</li>
		{/each}
	</ul>
{/if}

<Hoja bind:abierta={hNueva} titulo={tipoNuevo === 'recambio' ? 'Nuevo recambio' : 'Nuevo consumible'}>
	{#key tipoNuevo}<ArticuloForm tipoInicial={tipoNuevo} categorias={data.categoriasInv} ubicaciones={data.ubicaciones} vehiculos={data.vehiculosMenu} hoy={data.hoy} alGuardar={() => (hNueva = false)} />{/key}
</Hoja>
<Hoja bind:abierta={hVer} titulo={viendo?.nombre ?? ''}>
	{#if viendo}
		{#key `${viendo.id}-${editarAlAbrir}`}<ArticuloDetalle articulo={viendo} fotos={data.fotosInv[viendo.id] ?? []} historial={data.historial[viendo.id] ?? []} categorias={data.categoriasInv} ubicaciones={data.ubicaciones} vehiculos={data.vehiculosMenu} hoy={data.hoy} editar={editarAlAbrir} alLocalizar={() => localizar(viendo.id)} alCerrar={() => (hVer = false)} />{/key}
	{/if}
</Hoja>
<LocalizarHoja bind:abierta={hLoc} articulo={localizado} articulos={data.articulos} plano={data.plano} alVerFicha={(id) => abrirFicha(id)} />
