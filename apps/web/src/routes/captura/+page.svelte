<script lang="ts">
	import { enhance } from '$app/forms';
	import EntradaForm from '$comp/EntradaForm.svelte';
	import Icono from '$comp/Icono.svelte';
	import MovimientoForm from '$comp/MovimientoForm.svelte';
	import PendienteForm from '$comp/PendienteForm.svelte';
	import Placa from '$comp/Placa.svelte';
	import SubirArchivos from '$comp/SubirArchivos.svelte';
	import { accion, enviar } from '$lib/enviar';
	import { ArrowLeft, Check, CircleAlert, Gauge, ListChecks, NotebookPen, ReceiptText, Warehouse } from '@lucide/svelte';
	import { onMount } from 'svelte';

	let { data } = $props();
	const cat = $derived(data.catalogo);

	let vehiculoId = $state<number | null>(null);
	let que = $state<'entrada' | 'foto' | 'gasto' | 'km' | 'tarea' | 'pendiente' | null>(null);
	let hecho = $state(false);

	onMount(() => {
		const p = new URLSearchParams(location.search).get('vehiculo');
		if (p) vehiculoId = Number(p);
	});

	const finales = $derived(new Set(cat.estados.filter((e) => e.final).map((e) => e.id)));
	const vehiculos = $derived(
		data.vehiculosMenu
			.filter((v) => !finales.has(v.estadoId ?? -1))
			.sort((a, b) => (data.actividad[b.id] ?? '').localeCompare(data.actividad[a.id] ?? '') || a.alias.localeCompare(b.alias))
	);
	const vehiculo = $derived(data.vehiculosMenu.find((v) => v.id === vehiculoId));
	const obra = $derived(data.obras.find((o) => o.vehiculoId === vehiculoId));
	const tipoDe = (id: number) => cat.tipos.find((t) => t.id === id);

	function listo() {
		hecho = true;
		que = null;
	}
	function elegir(id: number) {
		vehiculoId = id;
		que = null;
		hecho = false;
	}
</script>

<svelte:head><title>Registrar · {data.ajustes.nombreTaller}</title></svelte:head>

<div class="mx-auto max-w-xl">
	{#if !vehiculo}
		<a href="/contabilidad/nuevo" class="tarjeta mb-6 flex items-center gap-4 p-4 transition hover:border-acento/50 active:scale-[0.99]">
			<span class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-acento/15 text-acento"><ReceiptText size={24} /></span>
			<span class="flex-1">
				<span class="block font-semibold">Una factura o dinero</span>
				<span class="block text-xs text-texto-3">Luz, agua, IBI, un cobro, tu aportación… te guío paso a paso</span>
			</span>
		</a>
		<a href="/local?nueva" class="tarjeta mb-6 -mt-3 flex items-center gap-4 p-4 transition hover:border-acento/50 active:scale-[0.99]">
			<span class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-superficie-3 text-texto-2"><Warehouse size={24} /></span>
			<span class="flex-1">
				<span class="block font-semibold">Algo del local</span>
				<span class="block text-xs text-texto-3">Una pared que pintar, una humedad, el extintor…</span>
			</span>
		</a>
		<h1 class="mb-5 text-4xl">¿O de un vehículo?</h1>
		{#if !vehiculos.length}
			<div class="vacio">No hay vehículos. <a href="/flota/nuevo" class="text-acento">Da de alta el primero</a>.</div>
		{/if}
		<div class="grid grid-cols-2 gap-2.5">
			{#each vehiculos as v (v.id)}
				<button class="tarjeta flex flex-col items-start gap-2 p-4 text-left transition active:scale-[0.98]" onclick={() => elegir(v.id)}>
					<Icono nombre={tipoDe(v.tipoId)?.icono} size={22} class="text-texto-3" />
					<span class="w-full truncate font-display text-xl font-bold uppercase">{v.alias}</span>
					<Placa matricula={v.matricula} />
				</button>
			{/each}
		</div>
	{:else}
		<button class="mb-4 flex items-center gap-2 text-sm text-texto-3" onclick={() => (que ? (que = null) : (vehiculoId = null))}><ArrowLeft size={16} /> {que ? 'Atrás' : 'Cambiar vehículo'}</button>
		<div class="mb-5 flex items-center gap-3">
			<h1 class="truncate text-4xl">{vehiculo.alias}</h1>
			<Placa matricula={vehiculo.matricula} />
		</div>

		{#if hecho && !que}
			<div class="tarjeta mb-5 flex items-center gap-3 border-ok/40 p-4">
				<span class="flex h-9 w-9 items-center justify-center rounded-full bg-ok text-black"><Check size={20} strokeWidth={3} /></span>
				<span class="flex-1 font-medium">Hecho. ¿Algo más?</span>
				<a href="/flota/{vehiculo.id}" class="btn h-9">Ver ficha</a>
			</div>
		{/if}

		{#if !que}
			<div class="grid grid-cols-2 gap-2.5">
				{#each [['entrada', obra ? 'Diario de obra' : 'Entrada', NotebookPen], ['pendiente', 'Avería / por reparar', CircleAlert], ['gasto', 'Gasto', ReceiptText], ['km', 'Kilómetros', Gauge], ...(obra?.tareas.length ? [['tarea', 'Tarea hecha', ListChecks]] : [])] as [id, t, I] (id)}
					{@const C = I as typeof NotebookPen}
					<button class="tarjeta flex h-28 flex-col items-start justify-between p-4 text-left transition active:scale-[0.98] {id === 'entrada' ? 'border-acento/50' : ''}" onclick={() => (que = id as typeof que)}>
						<C size={26} class={id === 'entrada' ? 'text-acento' : 'text-texto-2'} />
						<span class="font-semibold">{t}</span>
					</button>
				{/each}
				<SubirArchivos
					entidad={obra ? 'restauracion' : 'vehiculo'}
					entidadId={obra ? obra.id : vehiculo.id}
					vehiculoId={vehiculo.id}
					camara
					texto="Foto"
					clase="tarjeta flex h-28 flex-col items-start justify-between p-4 font-semibold [&_svg]:size-[26px] [&_svg]:text-texto-2"
					alSubir={() => (hecho = true)}
				/>
			</div>
		{:else if que === 'entrada'}
			<EntradaForm
				accion="?/entrada"
				vehiculoId={vehiculo.id}
				hoy={data.hoy}
				km={data.km[vehiculo.id] ?? null}
				categorias={cat.categorias}
				fases={obra?.fases ?? []}
				claseInicial={obra ? 'diario' : 'nota'}
				faseInicial={obra?.tareas[0]?.faseId ?? null}
				alGuardar={listo}
			/>
		{:else if que === 'gasto'}
			<MovimientoForm pagoPorDefecto={data.ajustes.pagoPorDefecto} accion="?/gasto" categorias={cat.categorias} hoy={data.hoy} vehiculoFijo={vehiculo.id} alGuardar={listo} />
		{:else if que === 'pendiente'}
			<PendienteForm vehiculoId={vehiculo.id} hoy={data.hoy} km={data.km[vehiculo.id] ?? null} alGuardar={listo} />
		{:else if que === 'km'}
			<form method="POST" action="?/km" use:enhance={enviar({ alTerminar: listo })} class="flex flex-col gap-4">
				<input type="hidden" name="vehiculoId" value={vehiculo.id} />
				<label class="campo">
					<span>Km actuales {data.km[vehiculo.id] != null ? `(último: ${data.km[vehiculo.id]?.toLocaleString('es-ES')})` : ''}</span>
					<!-- svelte-ignore a11y_autofocus -->
					<input name="km" class="input cifra h-16 text-4xl" inputmode="numeric" required autofocus />
				</label>
				<input type="hidden" name="fecha" value={data.hoy} />
				<button class="btn btn-acento h-12">Guardar</button>
			</form>
		{:else if que === 'tarea' && obra}
			<p class="etiqueta mb-3">{obra.nombre}</p>
			<ul class="tarjeta lista-filas">
				{#each obra.tareas as t (t.id)}
					<li>
						<button class="flex w-full items-center gap-3 px-4 py-3.5 text-left" onclick={async (e) => { if (await accion('?/tarea', { id: t.id }, e.currentTarget)) listo(); }}>
							<span class="h-5 w-5 shrink-0 rounded-md border-2 border-texto-3"></span>
							<span class="flex-1"><span class="block text-sm font-medium">{t.titulo}</span><span class="text-xs text-texto-3">{t.fase}</span></span>
						</button>
					</li>
				{/each}
			</ul>
		{/if}
	{/if}
</div>
