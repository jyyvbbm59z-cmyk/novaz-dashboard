<script lang="ts">
	import ArticuloDetalle from '$comp/ArticuloDetalle.svelte';
	import ArticuloForm from '$comp/ArticuloForm.svelte';
	import Cifra from '$comp/Cifra.svelte';
	import Hoja from '$comp/Hoja.svelte';
	import { diasEntre, euros } from '@novaz/core';
	import { ClipboardCheck, Plus, Search, Wrench } from '@lucide/svelte';

	let { data } = $props();
	const herramientas = $derived(data.articulos.filter((a) => a.tipo === 'herramienta'));
	let busqueda = $state('');
	let filtroEstado = $state('');
	let agrupar = $state<'ubicacion' | 'categoria'>('ubicacion');
	const visibles = $derived(
		herramientas.filter(
			(a) =>
				(!filtroEstado || a.estado === filtroEstado) &&
				(!busqueda || `${a.nombre} ${a.marca ?? ''} ${a.referencia ?? ''} ${a.categoria ?? ''} ${a.ubicacion ?? ''} ${a.numeroSerie ?? ''}`.toLowerCase().includes(busqueda.toLowerCase()))
		)
	);
	const grupos = $derived.by(() => {
		const m = new Map<string, typeof visibles>();
		for (const a of visibles) {
			const k = (agrupar === 'ubicacion' ? a.ubicacion : a.categoria) ?? (agrupar === 'ubicacion' ? 'Sin ubicación' : 'Sin categoría');
			m.set(k, [...(m.get(k) ?? []), a]);
		}
		return [...m.entries()].sort((a, b) => a[0].localeCompare(b[0], 'es'));
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

<section class="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
	<Cifra etiqueta="Herramientas" valor={activas.reduce((t, a) => t + Math.max(a.cantidad, 0), 0)} detalle="{activas.length} tipos distintos" icono={Wrench} />
	<Cifra etiqueta="Valor" valor={euros(valor, { redondo: true })} detalle="A precio de compra" />
	<Cifra etiqueta="Fuera de su sitio" valor={cuenta('prestada') + cuenta('perdida')} detalle="{cuenta('prestada')} prestadas · {cuenta('perdida')} sin encontrar" tono={cuenta('perdida') ? 'vencido' : undefined} />
	<Cifra etiqueta="Recuento" valor={sinRecontar ? `${sinRecontar} sin revisar` : 'Al día'} detalle={recuentos.length ? `Último: ${recuentos.at(-1)?.split('-').reverse().join('/')}` : 'Nunca'} tono={sinRecontar ? 'urgente' : 'ok'} href="/inventario/recuento" icono={ClipboardCheck} />
</section>

<div class="mb-4 flex flex-wrap items-center gap-2">
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
</div>

{#if !herramientas.length}
	<div class="vacio">
		<p class="mb-3 text-base text-texto-2">Apunta tus herramientas: dónde están, cuánto costaron y en qué estado.</p>
		<button class="btn btn-acento" onclick={() => (hNueva = true)}><Plus size={16} /> Añadir la primera</button>
	</div>
{:else}
	<div class="flex flex-col gap-5">
		{#each grupos as [grupo, lista] (grupo)}
			<section>
				<p class="etiqueta mb-2">{agrupar === 'ubicacion' ? '📍 ' : ''}{grupo} · {lista.length}</p>
				<ul class="tarjeta lista-filas">
					{#each lista as a (a.id)}
						<li>
							<button class="flex w-full items-center gap-3 px-3 py-2.5 text-left transition hover:bg-superficie-2 {a.estado === 'baja' ? 'opacity-50' : ''}" onclick={() => ((verId = a.id), (hVer = true))}>
								<span class="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-superficie-3">
									{#if a.portada}<img src="/archivos/{a.portada}?mini" alt="" class="h-full w-full object-cover" />{:else}<Wrench size={18} class="text-texto-3" />{/if}
								</span>
								<span class="min-w-0 flex-1">
									<span class="block truncate text-sm font-medium">{a.nombre}{a.cantidad > 1 ? ` ×${a.cantidad}` : ''}</span>
									<span class="block truncate text-xs text-texto-3">{[a.marca, agrupar === 'ubicacion' ? a.categoria : a.ubicacion].filter(Boolean).join(' · ')}</span>
								</span>
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
