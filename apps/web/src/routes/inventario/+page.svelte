<script lang="ts">
	import ArticuloDetalle from '$comp/ArticuloDetalle.svelte';
	import ArticuloForm from '$comp/ArticuloForm.svelte';
	import Hoja from '$comp/Hoja.svelte';
	import { diasEntre, euros } from '@novaz/core';
	import { Plus, Search, Wrench } from '@lucide/svelte';

	let { data } = $props();
	const herramientas = $derived(data.articulos.filter((a) => a.tipo === 'herramienta'));
	let busqueda = $state('');
	let filtroEstado = $state('');
	let agrupar = $state<'ubicacion' | 'categoria'>('ubicacion');
	const visibles = $derived(
		herramientas.filter(
			(a) =>
				(!filtroEstado || a.estado === filtroEstado) &&
				(!busqueda || `${a.nombre} ${a.marca ?? ''} ${a.referencia ?? ''} ${a.categoria ?? ''} ${a.ubicacion ?? ''} ${a.sitio.codigo ?? ''} ${a.sitio.texto ?? ''} ${a.numeroSerie ?? ''}`.toLowerCase().includes(busqueda.toLowerCase()))
		)
	);
	const grupos = $derived.by(() => {
		const m = new Map<string, typeof visibles>();
		for (const a of visibles) {
			const k = agrupar === 'ubicacion' ? (a.sitio.codigo ? `${a.sitio.codigo.split('·').slice(0, 2).join('·')}|${a.sitio.texto?.split(' · ').slice(0, a.sitio.muebleId ? 2 : 1).join(' · ')}` : '~|Sin ubicar en el plano') : (a.categoria ?? 'Sin categoría');
			m.set(k, [...(m.get(k) ?? []), a]);
		}
		return [...m.entries()].sort((a, b) => Number(a[0].startsWith('~')) - Number(b[0].startsWith('~')) || a[0].localeCompare(b[0], 'es'));
	});
	const activas = $derived(herramientas.filter((a) => a.estado !== 'baja'));
	const valor = $derived(activas.reduce((t, a) => t + (a.valorCent ?? 0) * Math.max(a.cantidad, 0), 0));
	const cuenta = (e: string) => herramientas.filter((a) => a.estado === e).length;
	const recuentos = $derived(activas.map((a) => a.ultimoRecuento).filter(Boolean).sort() as string[]);
	const sinRecontar = $derived(activas.filter((a) => !a.ultimoRecuento || diasEntre(a.ultimoRecuento, data.hoy) > 180).length);

	const ESTADO: Record<string, { t: string; c: string }> = {
		ok: { t: 'Bien', c: 'var(--ok)' },
		reparar: { t: 'A reparar', c: 'var(--urgente)' },
		prestada: { t: 'Prestada', c: 'var(--pronto)' },
		perdida: { t: 'No la encuentro', c: 'var(--vencido)' },
		baja: { t: 'De baja', c: 'var(--texto-3)' }
	};
	let hNueva = $state(false);
	let verId = $state<number | null>(null);
	const viendo = $derived(data.articulos.find((a) => a.id === verId) ?? null);
	let hVer = $state(false);
	$effect(() => {
		if (!hVer) verId = null;
	});
</script>

<svelte:head><title>Herramientas · {data.ajustes.nombreTaller}</title></svelte:head>

{#if herramientas.length}
	<!-- Resumen en una línea: solo lo que tiene valor -->
	<p class="mb-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-texto-2">
		<span><strong class="cifra text-base text-texto">{activas.reduce((t, a) => t + Math.max(a.cantidad, 0), 0)}</strong> herramientas</span>
		{#if valor}<span>· valen <strong class="cifra text-base text-texto">{euros(valor, { redondo: true })}</strong></span>{/if}
		{#if cuenta('prestada') + cuenta('perdida')}<span class="nivel-urgente">· {cuenta('prestada') + cuenta('perdida')} fuera de su sitio</span>{/if}
		<a href="/inventario/recuento" class="ml-auto text-xs {sinRecontar ? 'nivel-urgente' : 'text-texto-3'} hover:text-texto"
			>{sinRecontar ? `${sinRecontar} sin recontar →` : `Recontado ${recuentos.length ? `el ${recuentos.at(-1)?.split('-').reverse().join('/')}` : ''} →`}</a
		>
	</p>
{/if}

{#if herramientas.length}<div class="mb-4 flex flex-wrap items-center gap-2">
	<label class="relative min-w-48 flex-1">
		<Search size={15} class="absolute top-1/2 left-3 -translate-y-1/2 text-texto-3" />
		<input bind:value={busqueda} class="input h-9 pl-9 text-sm" placeholder="Buscar herramienta, marca, nº de serie…" />
	</label>
	<select bind:value={filtroEstado} class="input h-9 w-auto text-sm">
		<option value="">Todos los estados</option>
		{#each Object.entries(ESTADO) as [k, v] (k)}<option value={k}>{v.t} ({cuenta(k)})</option>{/each}
	</select>
	<select bind:value={agrupar} class="input h-9 w-auto text-sm"><option value="ubicacion">Por ubicación</option><option value="categoria">Por categoría</option></select>
	<button class="btn btn-acento h-9" onclick={() => (hNueva = true)}><Plus size={16} /> Herramienta</button>
</div>{/if}

{#if !herramientas.length}
	<div class="vacio">
		<p class="mb-3 text-base text-texto-2">Apunta tus herramientas: dónde están, cuánto costaron y en qué estado.</p>
		<button class="btn btn-acento" onclick={() => (hNueva = true)}><Plus size={16} /> Añadir la primera</button>
	</div>
{:else}
	<div class="flex flex-col gap-5">
		{#each grupos as [grupo, lista] (grupo)}
			<section>
				<p class="etiqueta mb-2">{agrupar === 'ubicacion' ? `📍 ${grupo.split('|')[0] === '~' ? '' : `${grupo.split('|')[0]} · `}${grupo.split('|')[1]}` : grupo} · {lista.length}</p>
				<ul class="tarjeta lista-filas">
					{#each lista as a (a.id)}
						<li>
							<button class="flex w-full items-center gap-3 px-3 py-2.5 text-left transition hover:bg-superficie-2 {a.estado === 'baja' ? 'opacity-50' : ''}" onclick={() => ((verId = a.id), (hVer = true))}>
								<span class="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-superficie-3">
									{#if a.portada}<img src="/archivos/{a.portada}?mini" alt="" class="h-full w-full object-cover" />{:else}<Wrench size={18} class="text-texto-3" />{/if}
								</span>
								<span class="min-w-0 flex-1">
									<span class="block truncate text-sm font-medium">{a.nombre}{a.cantidad > 1 ? ` ×${a.cantidad}` : ''}</span>
									<span class="block truncate text-xs text-texto-3">{[a.marca, agrupar === 'ubicacion' ? a.categoria : a.sitio.texto, a.ubicacion && agrupar === 'ubicacion' ? a.ubicacion : null].filter(Boolean).join(' · ')}</span>
								</span>
								{#if a.sitio.codigo}<span class="shrink-0 font-mono text-xs font-semibold text-texto-2">{a.sitio.codigo}</span>{/if}
								{#if a.estado !== 'ok'}<span class="chip h-6 text-[0.68rem]" style="color: {ESTADO[a.estado].c}"><span class="punto" style="background: {ESTADO[a.estado].c}"></span>{a.estado === 'prestada' && a.prestadaA ? a.prestadaA : ESTADO[a.estado].t}</span>{/if}
							</button>
						</li>
					{/each}
				</ul>
			</section>
		{/each}
	</div>
{/if}

<Hoja bind:abierta={hNueva} titulo="Nueva herramienta">
	<ArticuloForm tipoInicial="herramienta" categorias={data.categoriasInv} ubicaciones={data.ubicaciones} vehiculos={data.vehiculosMenu} hoy={data.hoy} alGuardar={() => (hNueva = false)} />
</Hoja>
<Hoja bind:abierta={hVer} titulo={viendo?.nombre ?? ''}>
	{#if viendo}
		<ArticuloDetalle articulo={viendo} fotos={data.fotosInv[viendo.id] ?? []} historial={data.historial[viendo.id] ?? []} categorias={data.categoriasInv} ubicaciones={data.ubicaciones} vehiculos={data.vehiculosMenu} hoy={data.hoy} alCerrar={() => (hVer = false)} />
	{/if}
</Hoja>
