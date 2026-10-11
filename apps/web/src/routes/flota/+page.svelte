<script lang="ts">
	import { goto } from '$app/navigation';
	import Icono from '$comp/Icono.svelte';
	import Placa from '$comp/Placa.svelte';
	import { compararNivel } from '@novaz/core';
	import { LayoutGrid, List, Plus } from '@lucide/svelte';

	let { data } = $props();
	const cat = $derived(data.catalogo);

	let tipo = $state<number | null>(null);
	let propietario = $state<'todos' | 'novaz' | 'tercero'>('todos');
	let verFinales = $state(false);
	let vista = $state<'tarjetas' | 'tabla'>('tarjetas');
	let orden = $state<'nombre' | 'alertas'>('alertas');

	const estado = (id: number | null) => cat.estados.find((e) => e.id === id);
	const tipoDe = (id: number) => cat.tipos.find((t) => t.id === id);

	const lista = $derived(
		data.vehiculos
			.filter((v) => (tipo == null || v.tipoId === tipo) && (propietario === 'todos' || v.propietario === propietario))
			.filter((v) => verFinales || !estado(v.estadoId)?.final)
			.sort((a, b) => (orden === 'alertas' ? compararNivel(a.nivel, b.nivel) : 0) || a.alias.localeCompare(b.alias, 'es'))
	);
	const finales = $derived(data.vehiculos.filter((v) => estado(v.estadoId)?.final).length);
</script>

<svelte:head><title>Flota · {data.ajustes.nombreTaller}</title></svelte:head>

<div class="mb-5 flex items-end justify-between gap-4">
	<div>
		<p class="etiqueta">{lista.length} vehículos</p>
		<h1 class="titulo-pagina">Flota</h1>
	</div>
	<a href="/flota/nuevo" class="btn btn-acento"><Plus size={18} /> <span class="hidden sm:inline">Nuevo vehículo</span><span class="sm:hidden">Nuevo</span></a>
</div>

<!-- Filtros -->
<div class="-mx-4 mb-5 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0" style="scrollbar-width:none">
	<button class="chip h-8 px-3 {tipo == null ? 'border-acento text-texto' : 'text-texto-2'}" onclick={() => (tipo = null)}>Todos</button>
	{#each cat.tipos as t (t.id)}
		<button class="chip h-8 px-3 {tipo === t.id ? 'border-acento text-texto' : 'text-texto-2'}" onclick={() => (tipo = tipo === t.id ? null : t.id)}>
			<Icono nombre={t.icono} size={14} />{t.nombre}
		</button>
	{/each}
	<span class="mx-1 w-px shrink-0 bg-borde"></span>
	{#each [['todos', 'Todos'], ['novaz', 'Novaz'], ['tercero', 'Terceros']] as [v, t] (v)}
		<button class="chip h-8 px-3 {propietario === v ? 'border-acento text-texto' : 'text-texto-2'}" onclick={() => (propietario = v as typeof propietario)}>{t}</button>
	{/each}
	{#if finales}
		<button class="chip h-8 px-3 {verFinales ? 'border-acento text-texto' : 'text-texto-2'}" onclick={() => (verFinales = !verFinales)}>
			Histórico ({finales})
		</button>
	{/if}
	<span class="ml-auto hidden items-center gap-1 sm:flex">
		<select bind:value={orden} class="input h-8 w-auto py-0 text-xs">
			<option value="alertas">Por urgencia</option>
			<option value="nombre">Por nombre</option>
		</select>
		<button class="btn btn-fantasma btn-icono h-8 w-8 {vista === 'tarjetas' ? 'text-acento' : ''}" onclick={() => (vista = 'tarjetas')} aria-label="Tarjetas"><LayoutGrid size={16} /></button>
		<button class="btn btn-fantasma btn-icono h-8 w-8 {vista === 'tabla' ? 'text-acento' : ''}" onclick={() => (vista = 'tabla')} aria-label="Tabla"><List size={16} /></button>
	</span>
</div>

{#if !data.vehiculos.length}
	<div class="vacio">
		<p class="mb-4 text-base text-texto-2">Aún no hay vehículos en la flota.</p>
		<a href="/flota/nuevo" class="btn btn-acento"><Plus size={18} /> Dar de alta el primero</a>
	</div>
{:else if vista === 'tarjetas'}
	<div class="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
		{#each lista as v (v.id)}
			{@const e = estado(v.estadoId)}
			{@const av = data.aviso[v.id]}
			<a href="/flota/{v.id}" class="tarjeta group flex overflow-hidden transition hover:border-texto-3/40 {v.portada ? 'flex-col' : ''}">
				{#if v.portada}
					<!-- Con foto: la foto manda -->
					<div class="relative aspect-[2/1] overflow-hidden bg-superficie-2">
						<img src="/archivos/{v.portada}?mini" alt="" loading="lazy" class="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" />
						<div class="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/70 to-transparent"></div>
						<div class="absolute bottom-2.5 left-3"><Placa matricula={v.matricula} /></div>
						{#if v.propietario === 'tercero'}<span class="absolute top-2.5 left-2.5 chip border-transparent bg-black/60 text-white backdrop-blur">{v.contacto ?? 'Tercero'}</span>{/if}
					</div>
				{:else}
					<!-- Sin foto: fila compacta con el icono del tipo -->
					<div class="flex w-16 shrink-0 items-center justify-center border-r border-borde bg-superficie-2 text-texto-3"><Icono nombre={tipoDe(v.tipoId)?.icono} size={26} /></div>
				{/if}
				<div class="flex min-w-0 flex-1 flex-col gap-1 p-3.5">
					<div class="flex items-baseline justify-between gap-2">
						<h2 class="truncate text-lg">{v.alias}</h2>
						{#if v.km != null}<span class="cifra shrink-0 text-sm text-texto-2">{v.km.toLocaleString('es-ES')} km</span>{/if}
					</div>
					<div class="flex min-w-0 items-center gap-2 text-xs text-texto-3">
						{#if !v.portada && v.matricula}<span class="shrink-0 font-mono text-texto-2">{v.matricula}</span>·{/if}
						{#if e}<span class="punto" style="background:{e.color}"></span><span class="shrink-0">{e.nombre}</span>{/if}
						{#if v.propietario === 'tercero' && !v.portada}<span class="truncate">· de {v.contacto ?? 'un tercero'}</span>{:else}<span class="truncate">· {[v.marca, v.modelo, v.anio].filter(Boolean).join(' ')}</span>{/if}
					</div>
					{#if v.restauracion}
						<div class="mt-1 flex items-center gap-2.5">
							<div class="h-1.5 flex-1 overflow-hidden rounded-full bg-superficie-3">
								<div class="h-full rounded-full" style="width:{Math.round(v.restauracion.avance * 100)}%; background: var(--acento)"></div>
							</div>
							<span class="cifra text-xs text-texto-2">{Math.round(v.restauracion.avance * 100)}%</span>
						</div>
					{:else if av}
						<p class="mt-0.5 flex items-center gap-1.5 truncate text-xs font-medium nivel-{av.nivel}"><span class="punto" style="background: var(--{av.nivel})"></span><span class="truncate">{av.texto}</span></p>
					{:else}
						<p class="mt-0.5 text-xs text-texto-3">Todo al día</p>
					{/if}
				</div>
			</a>
		{/each}
	</div>
{:else}
	<div class="tarjeta overflow-x-auto">
		<table class="w-full text-sm">
			<thead class="text-left">
				<tr class="border-b border-borde">
					{#each ['Vehículo', 'Matrícula', 'Tipo', 'Estado', 'Km', 'Alertas'] as h (h)}<th class="etiqueta px-4 py-3 font-semibold">{h}</th>{/each}
				</tr>
			</thead>
			<tbody class="lista-filas">
				{#each lista as v (v.id)}
					{@const e = estado(v.estadoId)}
					<tr class="cursor-pointer hover:bg-superficie-2" onclick={() => goto(`/flota/${v.id}`)}>
						<td class="px-4 py-3">
							<a href="/flota/{v.id}" class="font-semibold">{v.alias}</a>
							<div class="text-xs text-texto-3">{[v.marca, v.modelo, v.anio].filter(Boolean).join(' ')}{v.propietario === 'tercero' ? ` · ${v.contacto ?? 'Tercero'}` : ''}</div>
						</td>
						<td class="px-4 py-3"><Placa matricula={v.matricula} /></td>
						<td class="px-4 py-3 text-texto-2">{tipoDe(v.tipoId)?.nombre}</td>
						<td class="px-4 py-3">{#if e}<span class="chip"><span class="punto" style="background:{e.color}"></span>{e.nombre}</span>{/if}</td>
						<td class="cifra px-4 py-3">{v.km?.toLocaleString('es-ES') ?? '—'}</td>
						<td class="px-4 py-3">{#if v.alertas}<span class="chip nivel-{v.nivel}"><span class="punto" style="background: var(--{v.nivel})"></span>{v.alertas}</span>{:else}<span class="text-texto-3">—</span>{/if}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
{/if}
