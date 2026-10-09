<script lang="ts">
	import Ayuda from '$comp/Ayuda.svelte';
	import { page } from '$app/state';
	import AsientoForm from '$comp/AsientoForm.svelte';
	import Hoja from '$comp/Hoja.svelte';
	import { accion } from '$lib/enviar';
	import { plantillas } from '$lib/plantillasAsiento';
	import { euros, fechaLarga, nombreCuenta, type Asiento } from '@novaz/core';
	import { Pencil, Plus, Search, Trash2 } from '@lucide/svelte';
	import { onMount } from 'svelte';

	let { data } = $props();
	const plan = $derived(new Map(data.cuentas.map((c) => [c.codigo, c.nombre])));

	const ORIGEN: Record<string, { texto: string; color: string }> = {
		manual: { texto: 'Manual', color: 'var(--acento)' },
		movimiento: { texto: 'Movimiento', color: 'var(--texto-3)' },
		amortizacion: { texto: 'Amortización', color: 'var(--pronto)' },
		iva: { texto: 'IVA', color: 'var(--ok)' }
	};

	let filtroOrigen = $state('');
	let busqueda = $state('');
	let limite = $state(60);
	const lista = $derived(
		data.asientos.filter(
			(a) =>
				(!filtroOrigen || a.origen === filtroOrigen) &&
				(!busqueda || `${a.concepto} ${a.apuntes.map((p) => p.cuenta).join(' ')}`.toLowerCase().includes(busqueda.toLowerCase()))
		)
	);

	let hoja = $state(false);
	let inicial = $state<{ id?: number; fecha?: string; concepto?: string; apuntes?: { cuenta: string; debe: number; haber: number }[] } | undefined>();
	const PLANTILLAS = $derived(plantillas({ ivaPendiente: data.pendiente.iva, debeSocio: data.pendiente.socio }));

	function nuevo(plantilla?: string) {
		const p = PLANTILLAS.find((x) => x.clave === plantilla);
		inicial = p ? { concepto: p.concepto, apuntes: p.apuntes } : undefined;
		hoja = true;
	}
	function editar(a: Asiento) {
		inicial = { id: a.refId!, fecha: a.fecha, concepto: a.concepto, apuntes: a.apuntes };
		hoja = true;
	}
	async function borrar(a: Asiento) {
		if (confirm(`¿Borrar el asiento «${a.concepto}»?`)) await accion('?/borrar', { id: a.refId! });
	}
	onMount(() => {
		const p = page.url.searchParams.get('plantilla');
		if (p) nuevo(p);
	});
</script>

<svelte:head><title>Libro diario · {data.ajustes.nombreTaller}</title></svelte:head>

<Ayuda titulo="¿Qué es el libro diario?">{@html `Todas las operaciones en orden de fecha, en formato contable (partida doble): cada asiento dice de qué cuenta sale el valor (<strong>haber</strong>) y a cuál va (<strong>debe</strong>), y ambos lados suman siempre lo mismo. Casi todos se crean solos; aquí solo harías a mano operaciones raras.`}</Ayuda>

<div class="mb-4 flex flex-wrap items-center gap-2">
	<label class="relative min-w-48 flex-1">
		<Search size={15} class="absolute top-1/2 left-3 -translate-y-1/2 text-texto-3" />
		<input bind:value={busqueda} class="input h-9 pl-9 text-sm" placeholder="Buscar concepto o cuenta" />
	</label>
	<select bind:value={filtroOrigen} class="input h-9 w-auto text-sm">
		<option value="">Todos los orígenes</option>
		{#each Object.entries(ORIGEN) as [k, v] (k)}<option value={k}>{v.texto}</option>{/each}
	</select>
	<button class="btn btn-acento h-9" onclick={() => nuevo()}><Plus size={16} /> Asiento</button>
</div>

<div class="-mx-4 mb-5 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0" style="scrollbar-width:none">
	{#each PLANTILLAS as p (p.clave)}
		<button class="tarjeta shrink-0 px-3.5 py-2.5 text-left transition hover:border-acento/50" onclick={() => nuevo(p.clave)}>
			<span class="block text-sm font-semibold">{p.titulo}</span>
			<span class="block max-w-52 truncate text-xs text-texto-3">{p.descripcion}</span>
		</button>
	{/each}
</div>

{#if !lista.length}
	<div class="vacio">No hay asientos en este ejercicio. Cada gasto o ingreso que registres genera el suyo automáticamente.</div>
{:else}
	<p class="etiqueta mb-2">{lista.length} asientos</p>
	<div class="flex flex-col gap-2.5">
		{#each lista.slice(0, limite) as a (a.clave)}
			<article class="tarjeta overflow-hidden">
				<header class="flex items-center gap-3 border-b border-borde px-4 py-2.5">
					<span class="cifra w-9 shrink-0 text-lg text-texto-3">{a.numero}</span>
					<div class="min-w-0 flex-1">
						<p class="truncate text-sm font-semibold">{a.concepto}</p>
						<p class="text-xs text-texto-3">{fechaLarga(a.fecha)}</p>
					</div>
					<span class="chip h-5 text-[0.65rem]"><span class="punto" style="background:{ORIGEN[a.origen].color}"></span>{ORIGEN[a.origen].texto}</span>
					{#if a.origen === 'manual'}
						<button class="btn btn-fantasma btn-icono h-8 w-8" onclick={() => editar(a)} aria-label="Editar"><Pencil size={14} /></button>
						<button class="btn btn-fantasma btn-icono btn-peligro h-8 w-8" onclick={() => borrar(a)} aria-label="Borrar"><Trash2 size={14} /></button>
					{:else if a.origen === 'movimiento'}
						<a href="/contabilidad/movimientos?ejercicio={a.fecha.slice(0, 4)}&mes={a.fecha.slice(5, 7)}" class="hidden text-xs text-texto-3 hover:text-texto sm:inline">Ver movimiento →</a>
					{/if}
				</header>
				<table class="tabla">
					<tbody>
						{#each a.apuntes as p, i (i)}
							<tr>
								<td class="w-full max-w-0 py-2"><a href="/contabilidad/mayor?cuenta={p.cuenta}&ejercicio={a.fecha.slice(0, 4)}" class="flex items-baseline gap-2 hover:underline"><span class="w-14 shrink-0 font-mono text-xs text-texto-3">{p.cuenta}</span><span class="truncate {p.haber ? 'pl-5 text-texto-2' : ''}">{p.haber ? 'a ' : ''}{nombreCuenta(p.cuenta, plan)}</span></a></td>
								<td class="num py-2">{p.debe ? euros(p.debe) : ''}</td>
								<td class="num py-2 text-texto-2">{p.haber ? euros(p.haber) : ''}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</article>
		{/each}
	</div>
	{#if lista.length > limite}
		<button class="btn mx-auto mt-4 flex" onclick={() => (limite += 100)}>Ver más ({lista.length - limite})</button>
	{/if}
{/if}

<Hoja bind:abierta={hoja} titulo={inicial?.id ? 'Editar asiento' : 'Nuevo asiento'} ancho="max-w-2xl">
	<AsientoForm hoy={data.hoy} cuentas={data.cuentas} {inicial} alGuardar={() => (hoja = false)} />
</Hoja>
