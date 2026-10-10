<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/state';
	import EntradaForm from '$comp/EntradaForm.svelte';
	import Cifra from '$comp/Cifra.svelte';
	import Galeria from '$comp/Galeria.svelte';
	import GraficoKm from '$comp/GraficoKm.svelte';
	import Hoja from '$comp/Hoja.svelte';
	import Icono from '$comp/Icono.svelte';
	import MovimientoForm from '$comp/MovimientoForm.svelte';
	import Nivel from '$comp/Nivel.svelte';
	import Pestanas from '$comp/Pestanas.svelte';
	import PendienteForm from '$comp/PendienteForm.svelte';
	import Placa from '$comp/Placa.svelte';
	import SubirArchivos from '$comp/SubirArchivos.svelte';
	import VencimientoForm from '$comp/VencimientoForm.svelte';
	import { accion, enviar } from '$lib/enviar';
	import { euros, fechaLarga, kmFactura, lineasDesdeEntradas, mostrarCampo, numeroFactura, textoDias, textoPeriodicidad } from '@novaz/core';
	import FacturaForm from '$comp/FacturaForm.svelte';
	import type { Entrada, Movimiento, Pendiente, Vencimiento } from '@novaz/core/schema';
	import { Check, CircleAlert, Download, FileText, Gauge, ListChecks, NotebookPen, Pencil, Plus, ReceiptText, RefreshCw, Trash2, Wrench, X } from '@lucide/svelte';
	import { Paperclip } from '@lucide/svelte';

	let { data } = $props();
	const v = $derived(data.vehiculo);
	const cat = $derived(data.catalogo);
	const tipo = $derived(cat.tipos.find((t) => t.id === v.tipoId));
	const estado = $derived(cat.estados.find((e) => e.id === v.estadoId));
	const contacto = $derived(cat.contactos.find((c) => c.id === v.contactoId));
	const portada = $derived(data.adjuntos.find((a) => a.id === v.portadaId));
	const activa = $derived(data.restauraciones.find((r) => r.estado !== 'terminada'));
	const planesVeh = $derived(data.mantenimiento.map((m) => ({ id: m.plan.id, nombre: m.plan.nombre, codigo: m.plan.codigo, tareas: m.plan.tareas, incluye: m.plan.incluye })));
	const alertasVeh = $derived(data.alertas.filter((a) => a.vehiculoId === v.id));

	const PESTANAS = [
		['historial', 'Historial'],
		['papeles', 'Papeles'],
		['mantenimiento', 'Mantenimiento'],
		['gastos', 'Gastos'],
		['fotos', 'Fotos'],
		['datos', 'Datos'],
		['obras', 'Restauraciones']
	] as const;
	const pestana = $derived(page.url.searchParams.get('pestana') ?? 'historial');

	// Hojas
	let hEntrada = $state(false);
	let entradaEdit = $state<(typeof data.entradas)[number] | null>(null);
	let planHecho = $state<number | null>(null);
	let hKm = $state(false);
	let hVenc = $state(false);
	let vencEdit = $state<Vencimiento | null>(null);
	let vencRenovar = $state(false);
	let tipoVencInicial = $state<number | null>(null);
	let hGasto = $state(false);
	let gastoEdit = $state<Movimiento | null>(null);
	let hObra = $state(false);
	let hPlantilla = $state(false);
	let plantillaVer = $state('');
	let hPendiente = $state(false);

	// ─── Facturar: selección de operaciones del historial
	let facturando = $state(false);
	let seleccion = $state<number[]>([]);
	let hFactura = $state(false);
	const alternarSel = (id: number) => (seleccion = seleccion.includes(id) ? seleccion.filter((x) => x !== id) : [...seleccion, id]);
	const elegidas = $derived(data.entradas.filter((e) => seleccion.includes(e.id)).sort((a, b) => a.fecha.localeCompare(b.fecha)));
	const kmsElegidos = $derived(elegidas.map((e) => e.km));
	const kmDistintos = $derived(new Set(kmsElegidos.filter((k) => k != null)).size > 1);
	function generar() {
		hFactura = true;
	}
	function salirFacturar() {
		facturando = false;
		seleccion = [];
	}
	let pendEdit = $state<Pendiente | null>(null);
	let pendResolver = $state<Pendiente | null>(null);
	const PRIORIDAD: Record<string, { texto: string; color: string }> = {
		alta: { texto: 'Urgente', color: 'var(--vencido)' },
		media: { texto: 'Pronto', color: 'var(--urgente)' },
		baja: { texto: 'Cuando se pueda', color: 'var(--texto-3)' }
	};
	function resolver(p: Pendiente) {
		entradaEdit = null;
		planHecho = null;
		pendResolver = p;
		hEntrada = true;
	}

	function nuevaEntrada(plan: number | null = null) {
		entradaEdit = null;
		planHecho = plan;
		hEntrada = true;
	}
	function abrirVenc(x: Vencimiento | null, renovar = false, tipoId: number | null = null) {
		vencEdit = x;
		vencRenovar = renovar;
		tipoVencInicial = tipoId;
		hVenc = true;
	}
	async function borrar(ruta: string, id: number, que: string) {
		if (confirm(`¿Borrar ${que}?`)) await accion(ruta, { id });
	}

	const colorClase: Record<string, string> = { diario: 'var(--acento)', mantenimiento: 'var(--ok)', reparacion: 'var(--urgente)', nota: 'var(--texto-3)' };
	const nombreClase: Record<string, string> = { diario: 'Diario', mantenimiento: 'Mantenimiento', reparacion: 'Reparación', nota: 'Nota' };
	const kmMes = $derived(data.ritmo ? Math.round(data.ritmo * 30) : null);
</script>

<svelte:head><title>{v.alias} · {data.ajustes.nombreTaller}</title></svelte:head>

{#snippet listaLecturas()}
	<ul class="tarjeta lista-filas text-sm">
		{#each data.lecturas as l (l.id)}
			{@const sospechosa = l.sospechosa}
			<li class="flex items-center gap-3 py-1.5 pr-1.5 pl-4">
				<span class="flex-1">{fechaLarga(l.fecha)}{#if l.origen === 'entrada'}<span class="ml-1.5 text-xs text-texto-3">· de una entrada</span>{/if}</span>
				{#if sospechosa}<span class="chip h-5 text-[0.65rem] nivel-urgente" title="No cuadra con las demás lecturas">no cuadra</span>{/if}
				<span class="cifra {sospechosa ? 'nivel-urgente' : ''}">{l.km.toLocaleString('es-ES')} km</span>
				<button class="btn btn-fantasma btn-icono btn-peligro h-8 w-8" onclick={() => borrar('?/borrarLectura', l.id, `la lectura de ${l.km.toLocaleString('es-ES')} km del ${fechaLarga(l.fecha)}`)} aria-label="Borrar lectura"><Trash2 size={14} /></button>
			</li>
		{/each}
	</ul>
{/snippet}

<a href="/flota" class="text-sm text-texto-3 hover:text-texto">← Flota</a>

<!-- Cabecera -->
<section class="tarjeta relative mt-3 overflow-hidden">
	{#if portada}
		<div class="relative aspect-[16/9] max-h-[22rem] w-full sm:aspect-[21/9]">
			<img src="/archivos/{portada.clave}" alt={v.alias} class="h-full w-full object-cover" />
			<div class="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent"></div>
		</div>
	{/if}
	<div class="{portada ? 'absolute inset-x-0 bottom-0 text-white' : ''} flex flex-col gap-3 p-4 sm:p-6">
		<div class="flex flex-wrap items-center gap-2">
			<span class="chip {portada ? 'border-white/20 bg-black/40 text-white backdrop-blur' : ''}"><Icono nombre={tipo?.icono} size={14} />{tipo?.nombre}</span>
			<form method="POST" action="?/estado" use:enhance={enviar()}>
				<select
					name="estadoId"
					class="chip cursor-pointer appearance-none pr-2.5 [field-sizing:content] {portada ? 'border-white/20 bg-black/40 text-white backdrop-blur' : ''}"
					onchange={(e) => e.currentTarget.form?.requestSubmit()}
					style="color: {estado?.color}"
				>
					{#each cat.estados as e (e.id)}<option value={e.id} selected={e.id === v.estadoId} style="color: initial">● {e.nombre}</option>{/each}
				</select>
			</form>
			{#if v.propietario === 'tercero'}<span class="chip {portada ? 'border-white/20 bg-black/40 text-white backdrop-blur' : ''}">De: {contacto?.nombre ?? 'tercero'}</span>{/if}
		</div>
		<div class="flex flex-wrap items-end justify-between gap-3">
			<div>
				<h1 class="text-4xl sm:text-6xl">{v.alias}</h1>
				<p class="mt-1 text-sm {portada ? 'text-white/75' : 'text-texto-2'}">{[v.marca, v.modelo, v.anio].filter(Boolean).join(' · ') || ' '}</p>
			</div>
			<Placa matricula={v.matricula} grande />
		</div>
	</div>
</section>

<!-- Cifras -->
<section class="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
	<button class="tarjeta p-4 text-left transition hover:border-texto-3/40" onclick={() => (hKm = true)}>
		<p class="etiqueta flex items-center gap-1.5"><Gauge size={12} /> Km</p>
		<p class="cifra mt-1 text-3xl">{data.km?.toLocaleString('es-ES') ?? '—'}</p>
		<p class="text-xs text-texto-3">{kmMes ? `~${kmMes.toLocaleString('es-ES')} km/mes` : 'Toca para actualizar'}</p>
	</button>
	<div class="tarjeta p-4">
		<p class="etiqueta">Gasto {data.hoy.slice(0, 4)}</p>
		<p class="cifra mt-1 text-3xl">{euros(data.totales.gastoAnio, { redondo: true })}</p>
		<p class="text-xs text-texto-3">Total {euros(data.totales.gasto, { redondo: true })}</p>
	</div>
	<a href="?pestana=papeles" class="tarjeta p-4 transition hover:border-texto-3/40">
		<p class="etiqueta">Avisos</p>
		{#if alertasVeh.length}
			<p class="cifra mt-1 text-3xl nivel-{alertasVeh[0].nivel}">{alertasVeh.length}</p>
			<p class="truncate text-xs text-texto-3">{alertasVeh[0].titulo} · {alertasVeh[0].tipo === 'vencimiento' && alertasVeh[0].dias != null ? textoDias(alertasVeh[0].dias) : alertasVeh[0].detalle}</p>
		{:else}
			<p class="cifra mt-1 text-3xl nivel-ok">0</p>
			<p class="text-xs text-texto-3">Todo al día</p>
		{/if}
	</a>
	<div class="tarjeta p-4">
		<p class="etiqueta">Historial</p>
		<p class="cifra mt-1 text-3xl">{data.entradas.length}</p>
		<p class="text-xs text-texto-3">{data.entradas.reduce((a, e) => a + (e.horas ?? 0), 0).toLocaleString('es-ES')} h registradas</p>
	</div>
</section>

{#if activa}
	<a href="/restauraciones/{activa.id}" class="tarjeta mt-3 flex items-center gap-4 p-4 transition hover:border-acento/50">
		<span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-acento/15 text-acento"><Wrench size={20} /></span>
		<div class="min-w-0 flex-1">
			<p class="etiqueta">Restauración en curso</p>
			<p class="truncate font-semibold">{activa.nombre}</p>
			<div class="mt-2 h-1.5 overflow-hidden rounded-full bg-superficie-3"><div class="h-full rounded-full bg-acento" style="width:{Math.round(activa.avance * 100)}%"></div></div>
		</div>
		<span class="cifra text-2xl">{Math.round(activa.avance * 100)}%</span>
	</a>
{/if}

<!-- Acciones -->
<div class="mt-4 grid grid-cols-5 gap-1.5 sm:flex sm:flex-wrap sm:gap-2">
	<button class="btn btn-acento flex-col gap-1 py-2 sm:h-10 sm:flex-row sm:py-0 h-auto" onclick={() => nuevaEntrada()}><NotebookPen size={18} /><span class="text-xs sm:text-sm">Entrada</span></button>
	<SubirArchivos entidad="vehiculo" entidadId={v.id} vehiculoId={v.id} camara clase="btn flex-col gap-1 py-2 h-auto sm:h-10 sm:flex-row sm:py-0 text-xs sm:text-sm" />
	<button class="btn h-auto flex-col gap-1 py-2 sm:h-10 sm:flex-row sm:py-0" onclick={() => (hKm = true)}><Gauge size={18} /><span class="text-xs sm:text-sm">Km</span></button>
	<button class="btn h-auto flex-col gap-1 py-2 sm:h-10 sm:flex-row sm:py-0" onclick={() => ((gastoEdit = null), (hGasto = true))}><ReceiptText size={18} /><span class="text-xs sm:text-sm">Gasto</span></button>
	<button class="btn h-auto flex-col gap-1 py-2 sm:h-10 sm:flex-row sm:py-0" onclick={() => ((pendEdit = null), (hPendiente = true))}><CircleAlert size={18} /><span class="text-xs sm:text-sm">Avería</span></button>
	<a href="/flota/{v.id}/editar" class="btn hidden sm:inline-flex sm:ml-auto"><Pencil size={16} /> Editar</a>
</div>

<!-- Pestañas -->
<div class="mt-6">
	<Pestanas
		fija
		consulta
		pestanas={PESTANAS.map(([id, t]) => ({
			href: `?pestana=${id}`,
			texto: t,
			activa: pestana === id,
			cuenta: id === 'historial' ? data.entradas.length + data.porReparar.length : id === 'fotos' ? data.adjuntos.length : id === 'papeles' ? alertasVeh.filter((a) => a.tipo === 'vencimiento').length || null : null
		}))}
	/>
</div>

<div class="mt-5 min-h-[70dvh]">
	{#if pestana === 'historial'}
		{#if data.porReparar.length}
			<section class="mb-7">
				<p class="etiqueta mb-2 flex items-center gap-2"><CircleAlert size={13} /> Por reparar · {data.porReparar.length}</p>
				<div class="flex flex-col gap-2">
					{#each data.porReparar as p (p.id)}
						<article class="tarjeta flex items-start gap-3 p-3.5" style="border-left: 3px solid {PRIORIDAD[p.prioridad].color}">
							<div class="min-w-0 flex-1">
								<p class="font-semibold">{p.titulo}</p>
								<p class="text-xs text-texto-3">
									<span style="color: {PRIORIDAD[p.prioridad].color}">{PRIORIDAD[p.prioridad].texto}</span> · visto el {fechaLarga(p.fechaDetectado)}{p.kmDetectado != null ? ` a ${p.kmDetectado.toLocaleString('es-ES')} km` : ''}
								</p>
								{#if p.detalle}<p class="mt-1 text-sm whitespace-pre-line text-texto-2">{p.detalle}</p>{/if}
								{#if data.adjuntosPend[p.id]?.length}<div class="mt-2 max-w-xs"><Galeria adjuntos={data.adjuntosPend[p.id]} columnas="grid-cols-4" /></div>{/if}
								<div class="mt-1.5"><SubirArchivos entidad="pendiente" entidadId={p.id} vehiculoId={v.id} camara texto="Foto" clase="inline-flex items-center gap-1.5 text-xs text-texto-3 hover:text-texto [&_svg]:size-3.5" /></div>
							</div>
							<div class="flex shrink-0 items-center gap-1">
								<button class="btn btn-acento h-9 px-3" onclick={() => resolver(p)}><Check size={16} /> <span class="hidden sm:inline">Reparado</span></button>
								<button class="btn btn-fantasma btn-icono h-9 w-9" onclick={() => ((pendEdit = p), (hPendiente = true))} aria-label="Editar"><Pencil size={14} /></button>
								<button class="btn btn-fantasma btn-icono h-9 w-9" onclick={() => confirm(`¿Descartar «${p.titulo}»? (no se arreglará)`) && accion('?/descartarPendiente', { id: p.id })} aria-label="Descartar"><X size={15} /></button>
							</div>
						</article>
					{/each}
				</div>
			</section>
		{/if}
		{#if data.entradas.length}
			<div class="mb-4 flex items-center justify-between gap-2">
				<p class="etiqueta">{facturando ? 'Marca las operaciones a facturar' : 'Historial'}</p>
				{#if facturando}
					<button class="btn btn-fantasma h-8 text-xs" onclick={salirFacturar}>Cancelar</button>
				{:else}
					<button class="btn h-8 text-xs" onclick={() => (facturando = true)}><FileText size={14} /> Facturar</button>
				{/if}
			</div>
		{/if}
		{#if !data.entradas.length}
			<div class="vacio">Sin entradas todavía. Registra la primera: un mantenimiento, una nota o el diario de obra.</div>
		{:else}
			<ol class="relative ml-2 border-l border-borde">
				{#each data.entradas as e (e.id)}
					<li id="entrada-{e.id}" class="relative mb-6 ml-6 scroll-mt-28">
						{#if facturando}
							<button class="absolute -inset-y-1 -right-1 -left-10 z-10 rounded-lg transition hover:bg-acento/5" onclick={() => alternarSel(e.id)} aria-pressed={seleccion.includes(e.id)} aria-label="Seleccionar {e.titulo}"></button>
							<span class="absolute top-0.5 -left-[2.3rem] flex h-5 w-5 items-center justify-center rounded-md border-2 ring-4 ring-fondo transition {seleccion.includes(e.id) ? 'border-acento bg-acento text-black' : 'border-texto-3 bg-fondo'}">
								{#if seleccion.includes(e.id)}<Check size={13} strokeWidth={3.5} />{/if}
							</span>
						{:else}
							<span class="absolute top-1.5 -left-[1.95rem] h-3 w-3 rounded-full ring-4 ring-fondo" style="background:{colorClase[e.clase]}"></span>
						{/if}
						<div class="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-texto-3">
							<span class="font-semibold text-texto-2">{fechaLarga(e.fecha)}</span>
							<span>· {nombreClase[e.clase]}</span>
							{#if e.km != null}<span>· {e.km.toLocaleString('es-ES')} km</span>{/if}
							{#if e.horas}<span>· {e.horas.toLocaleString('es-ES')} h</span>{/if}
							{#if e.importe}<span>· {euros(e.importe)}</span>{/if}
							{#if e.fase}<span class="chip h-5 text-[0.65rem]">{e.fase}</span>{/if}
							{#each e.planes as pl (pl.id)}<span class="chip h-5 border-ok/40 text-[0.65rem] nivel-ok">↻ {pl.nombre}</span>{/each}
						</div>
						<div class="group mt-1 flex items-start gap-2">
							<h3 class="flex-1 font-sans text-base font-semibold tracking-normal normal-case">{e.titulo}</h3>
							<span class="flex opacity-60 transition group-hover:opacity-100">
								<button class="btn btn-fantasma btn-icono h-8 w-8" aria-label="Editar" onclick={() => ((entradaEdit = e), (hEntrada = true))}><Pencil size={15} /></button>
								<button class="btn btn-fantasma btn-icono btn-peligro h-8 w-8" aria-label="Borrar" onclick={() => borrar('?/borrarEntrada', e.id, 'esta entrada')}><Trash2 size={15} /></button>
							</span>
						</div>
						{#if e.texto}<p class="mt-1 text-sm leading-relaxed whitespace-pre-line text-texto-2">{e.texto}</p>{/if}
						{#if e.checklist?.length}
							{@const hechas = e.checklist.filter((t) => t.hecha).length}
							<details class="mt-2 max-w-lg">
								<summary class="cursor-pointer text-xs text-texto-3 select-none hover:text-texto"><span class={hechas === e.checklist.length ? 'nivel-ok' : ''}>✓ {hechas}/{e.checklist.length} tareas</span>{#if e.checklist.some((t) => t.nota)} · con notas{/if}</summary>
								<ul class="mt-1.5 flex flex-col gap-1 border-l border-borde pl-3 text-xs">
									{#each e.checklist as t, i (i)}
										<li class={t.hecha ? 'text-texto-2' : 'text-texto-3 line-through decoration-texto-3/60'}>
											<span class={t.hecha ? 'nivel-ok' : ''}>{t.hecha ? '✓' : '✗'}</span> {t.tarea}{#if t.nota}<span class="ml-1 text-acento">— {t.nota}</span>{/if}
										</li>
									{/each}
								</ul>
							</details>
						{/if}
						{#if e.adjuntos.length}
							<div class="mt-3 max-w-md"><Galeria adjuntos={e.adjuntos} accionPortada="?/portada" portadaId={v.portadaId} columnas="grid-cols-4" /></div>
						{/if}
						<div class="mt-2"><SubirArchivos entidad="entrada" entidadId={e.id} vehiculoId={v.id} texto="Añadir foto" clase="text-xs text-texto-3 hover:text-texto inline-flex items-center gap-1.5 [&_svg]:size-3.5" /></div>
					</li>
				{/each}
			</ol>
		{/if}
	{:else if pestana === 'papeles'}
		<div class="flex flex-col gap-3">
			{#each data.vencimientos.filter((x) => x.estado === 'vigente') as x (x.id)}
				{@const docs = data.adjuntos.filter((a) => a.entidad === 'vencimiento' && a.entidadId === x.id)}
				<article class="tarjeta p-4">
					<div class="flex items-start gap-3">
						<span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-superficie-3"><Icono nombre={x.tipo.icono} size={20} /></span>
						<div class="min-w-0 flex-1">
							<div class="flex flex-wrap items-center gap-2">
								<h3 class="text-xl">{x.tipo.nombre}</h3>
								{#if x.estadoCalc}<Nivel nivel={x.estadoCalc.nivel} texto={textoDias(x.estadoCalc.dias)} />{/if}
							</div>
							<p class="mt-0.5 text-sm text-texto-2">Vence el <strong class="text-texto">{fechaLarga(x.fechaVence)}</strong>{x.fechaInicio ? ` · desde ${fechaLarga(x.fechaInicio)}` : ''}</p>
							<p class="mt-0.5 text-xs text-texto-3">{[x.proveedor, x.referencia, x.importeCent ? euros(x.importeCent) : null].filter(Boolean).join(' · ')}</p>
						</div>
					</div>
					{#if docs.length}<div class="mt-3"><Galeria adjuntos={docs} columnas="grid-cols-4 sm:grid-cols-6" /></div>{/if}
					<div class="mt-3 flex flex-wrap gap-2">
						<button class="btn btn-acento h-9" onclick={() => abrirVenc(x, true)}><RefreshCw size={16} /> Renovar</button>
						<SubirArchivos entidad="vencimiento" entidadId={x.id} vehiculoId={v.id} texto="Documento" clase="btn h-9" />
						<button class="btn btn-fantasma h-9" onclick={() => abrirVenc(x)}><Pencil size={15} /></button>
						<button class="btn btn-fantasma btn-peligro h-9" onclick={() => borrar('?/borrarVencimiento', x.id, 'este vencimiento')}><Trash2 size={15} /></button>
					</div>
				</article>
			{/each}

			{#if data.sinRegistrar.length}
				<div class="tarjeta border-dashed p-4">
					<p class="etiqueta mb-3">Sin registrar</p>
					<div class="flex flex-wrap gap-2">
						{#each data.sinRegistrar as t (t.id)}
							<button class="btn" onclick={() => abrirVenc(null, false, t.id)}><Plus size={16} /> {t.nombre}</button>
						{/each}
					</div>
				</div>
			{/if}
			<button class="btn w-fit" onclick={() => abrirVenc(null)}><Plus size={16} /> Otro vencimiento</button>

			{#if data.vencimientos.some((x) => x.estado !== 'vigente')}
				<details class="mt-2">
					<summary class="etiqueta cursor-pointer py-2">Histórico</summary>
					<ul class="tarjeta lista-filas mt-2 text-sm">
						{#each data.vencimientos.filter((x) => x.estado !== 'vigente') as x (x.id)}
							<li class="flex items-center gap-3 px-4 py-2.5">
								<span class="flex-1">{x.tipo.nombre} · {fechaLarga(x.fechaInicio)} → {fechaLarga(x.fechaVence)}</span>
								<span class="text-texto-3">{x.proveedor ?? ''} {x.importeCent ? euros(x.importeCent) : ''}</span>
								<button class="btn btn-fantasma btn-icono btn-peligro h-8 w-8" onclick={() => borrar('?/borrarVencimiento', x.id, 'este registro')} aria-label="Borrar"><Trash2 size={14} /></button>
							</li>
						{/each}
					</ul>
				</details>
			{/if}
		</div>
	{:else if pestana === 'mantenimiento'}
		{#if data.plantillas.length}
			{@const sugerida = data.plantillas.find((p) => p.id === data.plantillaSugerida)}
			<div class="tarjeta mb-4 flex flex-wrap items-center gap-3 border-acento/40 p-4">
				<ListChecks size={22} class="shrink-0 text-acento" />
				<div class="min-w-0 flex-1">
					<p class="font-semibold">{sugerida ? `Plan del fabricante: ${sugerida.nombre}` : 'Revisiones por niveles (I1, I2…)'}</p>
					<p class="text-xs text-texto-3">{sugerida ? 'Revisiones I1–I5 con sus tareas, según el manual. Sustituyen a los planes genéricos solo en este vehículo y heredan tu historial.' : 'Agrupa el mantenimiento en revisiones con lista de tareas.'}</p>
				</div>
				<button class="btn btn-acento h-9" onclick={() => ((plantillaVer = data.plantillaSugerida ?? data.plantillas[0].id), (hPlantilla = true))}>Ver y aplicar</button>
			</div>
		{/if}
		{#if !data.mantenimiento.length}
			<div class="vacio">No hay planes de mantenimiento para este tipo de vehículo. Créalos en <a href="/ajustes/mantenimiento" class="text-acento">Ajustes</a>.</div>
		{:else}
			<div class="grid gap-3 sm:grid-cols-2">
				{#each data.mantenimiento as m (m.plan.id)}
					<article class="tarjeta flex flex-col gap-3 p-4">
						<div class="flex items-start justify-between gap-2">
							<div class="flex items-start gap-3">
								{#if m.plan.codigo}<span class="flex h-10 min-w-10 items-center justify-center rounded-lg bg-acento/15 px-2 font-display text-xl font-bold text-acento">{m.plan.codigo}</span>{/if}
								<div>
									<h3 class="text-xl">{m.plan.nombre}</h3>
									<p class="text-xs text-texto-3 first-letter:uppercase">{textoPeriodicidad(m.plan)}{m.plan.incluye.length ? ` · incluye ${data.mantenimiento.filter((x) => m.plan.incluye.includes(x.plan.id)).map((x) => x.plan.codigo ?? x.plan.nombre).join(', ')}` : ''}</p>
								</div>
							</div>
							{#if m.estado.sinHistorial}<span class="chip text-texto-3">Sin registro</span>{:else}<Nivel nivel={m.estado.nivel} />{/if}
						</div>
						{#if !m.estado.sinHistorial}
							<dl class="grid grid-cols-2 gap-2 text-sm">
								<div><dt class="etiqueta">Último</dt><dd>{fechaLarga(m.ultima?.fecha)}{m.ultima?.km != null ? ` · ${m.ultima.km.toLocaleString('es-ES')} km` : ''}</dd></div>
								<div>
									<dt class="etiqueta">Próximo</dt>
									<dd>
										{#if m.estado.kmRestantes != null}{m.estado.kmRestantes < 0 ? `Pasado ${(-m.estado.kmRestantes).toLocaleString('es-ES')} km` : `En ${m.estado.kmRestantes.toLocaleString('es-ES')} km`}{/if}
										{#if m.estado.proximaFecha}<span class="block text-texto-3">{fechaLarga(m.estado.proximaFecha)}</span>{/if}
										{#if m.estado.diasRestantes != null && m.estado.motivo === 'km'}<span class="block text-xs text-texto-3">≈ {textoDias(m.estado.diasRestantes)} a tu ritmo</span>{/if}
									</dd>
								</div>
							</dl>
						{/if}
						{#if m.plan.tareas.length}
							<details class="text-sm">
								<summary class="cursor-pointer text-xs text-texto-3 select-none hover:text-texto">{m.plan.tareas.length} tareas</summary>
								<ul class="mt-1.5 flex list-disc flex-col gap-0.5 pl-5 text-xs text-texto-2">{#each m.plan.tareas as t (t)}<li>{t}</li>{/each}</ul>
							</details>
						{/if}
						<button class="btn mt-auto" onclick={() => nuevaEntrada(m.plan.id)}><Check size={16} /> {m.estado.sinHistorial ? 'Registrar la última' : 'Hecha'}</button>
					</article>
				{/each}
			</div>
		{/if}
		<section class="mt-8">
			<div class="mb-3 flex items-baseline justify-between gap-2">
				<h2 class="seccion-titulo">Kilometraje</h2>
				<button class="btn h-8 text-xs" onclick={() => (hKm = true)}><Gauge size={14} /> Actualizar km</button>
			</div>
			{#if data.metricas.actual != null}
				{@const m = data.metricas}
				<div class="grid grid-cols-2 gap-3 lg:grid-cols-4">
					<Cifra etiqueta="Ritmo" valor={m.kmMes != null ? m.kmMes.toLocaleString('es-ES') : '—'} unidad={m.kmMes != null ? 'km/mes' : ''} detalle={m.kmAnio != null ? `≈ ${m.kmAnio.toLocaleString('es-ES')} km al año` : 'Faltan lecturas'} />
					<Cifra etiqueta="Este año" valor={m.esteAnio != null ? m.esteAnio.toLocaleString('es-ES') : '—'} unidad={m.esteAnio != null ? 'km' : ''} detalle={m.previsionFinAnio != null ? `Fin de año: ~${m.previsionFinAnio.toLocaleString('es-ES')}` : ''} />
					<Cifra etiqueta="Recorridos" valor={m.recorridos != null ? m.recorridos.toLocaleString('es-ES') : '—'} unidad={m.recorridos != null ? 'km' : ''} detalle={m.desde ? `Desde ${fechaLarga(m.desde)}` : ''} />
					<Cifra
						etiqueta="Mes con más uso"
						valor={m.mejorMes ? m.mejorMes.km.toLocaleString('es-ES') : '—'}
						unidad={m.mejorMes ? 'km' : ''}
						detalle={m.mejorMes ? new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(m.mejorMes.mes + '-15T12:00:00Z')) : ''}
					/>
				</div>
				<div class="tarjeta mt-3 p-4 sm:p-5">
					<p class="etiqueta mb-3">Evolución del cuentakilómetros</p>
					<GraficoKm lecturas={data.lecturas} hoy={data.hoy} />
					{#if m.porMes.length >= 2}
						{@const maxMes = Math.max(1, ...m.porMes.map((x) => x.km))}
						<p class="etiqueta mt-6 mb-3">Km por mes</p>
						<div class="flex h-24 items-end gap-1.5 border-b border-borde sm:gap-2.5">
							{#each m.porMes as x (x.mes)}
								<div class="group relative flex h-full flex-1 flex-col justify-end">
									<span class="block w-full rounded-t-[4px] bg-acento transition-opacity group-hover:opacity-100" style="height: {Math.max((x.km / maxMes) * 100, x.km ? 3 : 0)}%; opacity: {x.mes === m.mejorMes?.mes ? 1 : 0.75}"></span>
									<span class="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 rounded border border-borde bg-superficie-3 px-2 py-1 text-[0.7rem] whitespace-nowrap shadow group-hover:block">{x.km.toLocaleString('es-ES')} km</span>
								</div>
							{/each}
						</div>
						<div class="mt-1 flex gap-1.5 text-center text-[0.6rem] text-texto-3 sm:gap-2.5">
							{#each m.porMes as x (x.mes)}<span class="flex-1">{['E', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'][Number(x.mes.slice(5, 7)) - 1]}</span>{/each}
						</div>
					{/if}
				</div>
			{/if}
			{#if data.lecturas.length}
				{@const malas = data.lecturas.filter((l) => l.sospechosa).length}
				{#if malas}
					<p class="mt-3 flex items-start gap-2 rounded-lg border border-urgente/40 bg-urgente/10 p-3 text-sm">
						<CircleAlert size={16} class="mt-0.5 shrink-0 nivel-urgente" />
						<span>{malas === 1 ? 'Hay una lectura que no cuadra' : `Hay ${malas} lecturas que no cuadran`} con las demás (el cuentakilómetros solo sube). No se usa en los cálculos: bórrala si es un error.</span>
					</p>
				{/if}
				<details class="mt-3" open={malas > 0}>
					<summary class="etiqueta cursor-pointer py-2">Lecturas ({data.lecturas.length})</summary>
					<div class="mt-2">{@render listaLecturas()}</div>
				</details>
			{/if}
		</section>
	{:else if pestana === 'gastos'}
		{@const c = data.costes}
		{#if c.inversion || c.valorEstimado}
			<section class="mb-6">
				<p class="etiqueta mb-2">Coste real</p>
				<div class="grid grid-cols-2 gap-3 lg:grid-cols-4">
					<Cifra etiqueta="Por kilómetro" valor={c.costeKm != null ? `${(c.costeKm / 100).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €` : '—'} detalle={c.costeKm != null ? 'Gastos sin la compra ÷ km' : 'Faltan lecturas de km'} />
					<Cifra etiqueta="Al mes" valor={c.costeMes != null ? euros(c.costeMes, { redondo: true }) : '—'} detalle="Media de {c.meses} {c.meses === 1 ? 'mes' : 'meses'}" />
					<Cifra etiqueta="Gastado" valor={euros(c.operativo, { redondo: true })} detalle={c.compra ? `+ ${euros(c.compra, { redondo: true })} de compra` : 'Sin contar la compra'} />
					{#if c.valorEstimado != null}
						<Cifra etiqueta="Si lo vendes hoy" valor={euros(c.margen!, { redondo: true })} detalle="Valor {euros(c.valorEstimado, { redondo: true })} − invertido {euros(c.inversion, { redondo: true })}" tono={c.margen! < 0 ? 'vencido' : 'ok'} />
					{:else}
						<Cifra etiqueta="Tus horas" valor={euros(c.manoObra, { redondo: true })} detalle="A {euros(data.ajustes.tarifaHoraCent)}/h" tono="apagado" />
					{/if}
				</div>
				{#if c.valorEstimado != null && c.manoObra}
					<p class="mt-2 text-xs text-texto-3">Contando tus horas a {euros(data.ajustes.tarifaHoraCent)}/h ({euros(c.manoObra, { redondo: true })}), el resultado sería <strong class={c.margenConHoras! < 0 ? 'nivel-vencido' : 'nivel-ok'}>{euros(c.margenConHoras!, { redondo: true })}</strong>.</p>
				{:else if c.valorEstimado == null}
					<p class="mt-2 text-xs text-texto-3">Pon un <a href="/flota/{v.id}/editar" class="text-acento">valor estimado</a> y verás cuánto ganarías o perderías si lo vendes.</p>
				{/if}
				{#if c.porCategoria.length > 1}
					{@const max = Math.max(...c.porCategoria.map((x) => x.total))}
					<ul class="tarjeta mt-3 flex flex-col gap-2 p-4">
						{#each c.porCategoria as x (x.nombre)}
							<li class="grid grid-cols-[8rem_1fr_auto] items-center gap-3 text-sm">
								<span class="truncate text-texto-2">{x.nombre}</span>
								<span class="h-2 overflow-hidden rounded-full bg-superficie-3"><span class="block h-full rounded-full" style="width: {(x.total / max) * 100}%; background: {x.color}"></span></span>
								<span class="font-mono text-xs">{euros(x.total, { redondo: true })}</span>
							</li>
						{/each}
					</ul>
				{/if}
			</section>
		{/if}
		{#if data.facturas.length}
			<section class="mb-6">
				<p class="etiqueta mb-2">Facturas e informes</p>
				<ul class="tarjeta lista-filas">
					{#each data.facturas as f (f.id)}
						<li class="flex items-center gap-3 px-4 py-2.5 {f.anulada ? 'opacity-50' : ''}">
							<FileText size={16} class="shrink-0 text-texto-3" />
							<div class="min-w-0 flex-1">
								<p class="truncate text-sm font-medium">{numeroFactura(f.serie, f.anio, f.numero)}{f.anulada ? ' · anulada' : ''}</p>
								<p class="text-xs text-texto-3">{fechaLarga(f.fecha)} · {f.tipo === 'factura' ? (f.movimientoId ? 'cobrada' : 'pendiente de cobro') : 'informe'}</p>
							</div>
							{#if f.tipo === 'factura'}<span class="cifra text-lg">{euros(f.totalCent)}</span>{/if}
							<a href="/facturas/{f.id}/pdf?descargar" class="btn btn-fantasma btn-icono h-8 w-8" aria-label="Descargar PDF" download><Download size={15} /></a>
						</li>
					{/each}
				</ul>
			</section>
		{/if}
		<div class="mb-4 flex items-center justify-between">
			<p class="text-sm text-texto-2">Gastado: <strong class="cifra text-lg text-texto">{euros(data.totales.gasto)}</strong>{#if data.totales.ingreso} · Ingresos: <strong class="cifra text-lg nivel-ok">{euros(data.totales.ingreso)}</strong>{/if}</p>
			<button class="btn" onclick={() => ((gastoEdit = null), (hGasto = true))}><Plus size={16} /> Movimiento</button>
		</div>
		{#if !data.movimientos.length}
			<div class="vacio">Sin gastos registrados.</div>
		{:else}
			<ul class="tarjeta lista-filas">
				{#each data.movimientos as m (m.id)}
					<li class="group flex items-center gap-3 px-4 py-3">
						<span class="punto h-2.5 w-2.5" style="background:{m.categoria?.color ?? 'var(--texto-3)'}"></span>
						<div class="min-w-0 flex-1">
							<p class="truncate text-sm font-medium">{m.concepto}</p>
							<p class="text-xs text-texto-3">{fechaLarga(m.fecha)} · {m.categoria?.nombre ?? 'Sin categoría'}{m.proveedor ? ` · ${m.proveedor}` : ''}</p>
						</div>
						{#if data.adjuntosMov[m.id]?.length}<button class="chip h-6 shrink-0 px-2" onclick={() => ((gastoEdit = m), (hGasto = true))} title="Ver factura"><Paperclip size={12} />{data.adjuntosMov[m.id].length}</button>{/if}
						<span class="cifra text-lg {m.tipo === 'ingreso' ? 'nivel-ok' : ''}">{m.tipo === 'ingreso' ? '+' : ''}{euros(m.importeCent)}</span>
						<span class="flex opacity-60 group-hover:opacity-100">
							<button class="btn btn-fantasma btn-icono h-8 w-8" aria-label="Editar" onclick={() => ((gastoEdit = m), (hGasto = true))}><Pencil size={14} /></button>
							<button class="btn btn-fantasma btn-icono btn-peligro h-8 w-8" aria-label="Borrar" onclick={() => borrar('?/borrarGasto', m.id, 'este movimiento')}><Trash2 size={14} /></button>
						</span>
					</li>
				{/each}
			</ul>
		{/if}
	{:else if pestana === 'fotos'}
		<div class="mb-4 flex gap-2">
			<SubirArchivos entidad="vehiculo" entidadId={v.id} vehiculoId={v.id} camara />
			<SubirArchivos entidad="vehiculo" entidadId={v.id} vehiculoId={v.id} texto="Subir archivos" />
		</div>
		{#if data.adjuntos.length}
			<Galeria adjuntos={data.adjuntos} accionPortada="?/portada" portadaId={v.portadaId} />
		{:else}
			<div class="vacio">Sin fotos. La primera que subas será la portada.</div>
		{/if}
	{:else if pestana === 'datos'}
		<div class="tarjeta p-5">
			<dl class="grid gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
				{#each [['Marca', v.marca], ['Modelo', v.modelo], ['Año', v.anio], ['Matrícula', v.matricula], ['Bastidor', v.bastidor], ['Alta', fechaLarga(v.fechaAlta)], ['Propietario', v.propietario === 'novaz' ? data.ajustes.nombreTaller : (contacto?.nombre ?? 'Tercero')]] as [k, val] (k)}
					<div><dt class="etiqueta">{k}</dt><dd class="mt-0.5 {k === 'Bastidor' ? 'font-mono text-sm' : ''}">{val ?? '—'}</dd></div>
				{/each}
				{#each tipo?.campos ?? [] as c (c.clave)}
					<div><dt class="etiqueta">{c.etiqueta}</dt><dd class="mt-0.5">{mostrarCampo(c, v.campos[c.clave])}</dd></div>
				{/each}
			</dl>
			{#if v.notas}<p class="mt-5 border-t border-borde pt-4 text-sm whitespace-pre-line text-texto-2">{v.notas}</p>{/if}
			<a href="/flota/{v.id}/editar" class="btn mt-5"><Pencil size={16} /> Editar datos</a>
		</div>
	{:else if pestana === 'obras'}
		<div class="flex flex-col gap-3">
			{#each data.restauraciones as r (r.id)}
				<a href="/restauraciones/{r.id}" class="tarjeta flex items-center gap-4 p-4 hover:border-texto-3/40">
					<div class="min-w-0 flex-1">
						<p class="font-semibold">{r.nombre}</p>
						<p class="text-xs text-texto-3">{fechaLarga(r.fechaInicio)}{r.fechaFin ? ` → ${fechaLarga(r.fechaFin)}` : ''} · {r.estado.replace('_', ' ')}</p>
					</div>
					<span class="cifra text-xl">{Math.round(r.avance * 100)}%</span>
				</a>
			{/each}
			<button class="btn w-fit" onclick={() => (hObra = true)}><Plus size={16} /> Nueva restauración</button>
		</div>
	{/if}
</div>

{#if facturando}
	<div class="fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+5.25rem)] z-40 mx-auto flex max-w-md items-center gap-3 rounded-2xl border border-borde bg-superficie-3/95 p-2.5 pl-4 shadow-2xl backdrop-blur lg:bottom-6">
		<span class="flex-1 text-sm font-medium">{seleccion.length} {seleccion.length === 1 ? 'operación' : 'operaciones'}</span>
		<button class="btn btn-fantasma h-10" onclick={salirFacturar}>Cancelar</button>
		<button class="btn btn-acento h-10" disabled={!seleccion.length} onclick={generar}><FileText size={16} /> Generar</button>
	</div>
{/if}

<Hoja bind:abierta={hFactura} titulo={v.propietario === 'tercero' ? 'Nueva factura' : 'Nuevo documento'} ancho="max-w-2xl">
	<FacturaForm
		lineasIniciales={lineasDesdeEntradas(
			elegidas,
			[
				...data.movimientos.filter((m) => m.tipo === 'gasto' && m.entradaId != null && seleccion.includes(m.entradaId)).sort((a, b) => a.id - b.id),
				// Lo usado del inventario, a su precio de compra
				...data.usos
					.filter((u) => u.entradaId != null && seleccion.includes(u.entradaId))
					.map((u) => ({ entradaId: u.entradaId, concepto: `${u.nombre} (${u.cantidad.toLocaleString('es-ES')} ${u.unidad})`, importeCent: Math.round((u.valorCent ?? 0) * u.cantidad), ivaPct: 21 }))
			],
			data.ajustes.tarifaHoraCent
		)}
		entradas={elegidas.map((e) => e.id)}
		km={kmFactura(kmsElegidos, data.km)}
		kmAviso={kmDistintos ? 'Las operaciones tienen kilometrajes distintos: se pone el total actual del vehículo.' : null}
		contacto={contacto ?? null}
		tipoInicial={v.propietario === 'tercero' ? 'factura' : 'informe'}
		hoy={data.hoy}
	/>
</Hoja>

<Hoja bind:abierta={hPlantilla} titulo="Revisiones por niveles" ancho="max-w-2xl">
	{@const pl = data.plantillas.find((p) => p.id === plantillaVer)}
	<div class="flex flex-col gap-4">
		{#if data.plantillas.length > 1}
			<select bind:value={plantillaVer} class="input">
				{#each data.plantillas as p (p.id)}<option value={p.id}>{p.nombre}{p.id === data.plantillaSugerida ? ' (recomendada)' : ''}</option>{/each}
			</select>
		{/if}
		{#if pl}
			<p class="text-sm text-texto-2">{pl.descripcion}</p>
			<div class="flex flex-col gap-2">
				{#each pl.niveles as n (n.codigo)}
					<details class="rounded-lg border border-borde bg-superficie-2">
						<summary class="flex cursor-pointer items-center gap-3 px-3 py-2.5 select-none">
							<span class="font-display text-lg font-bold text-acento">{n.codigo}</span>
							<span class="flex-1 text-sm font-semibold">{n.nombre}</span>
							<span class="text-xs text-texto-3">{textoPeriodicidad(n)}</span>
						</summary>
						<ul class="flex list-disc flex-col gap-0.5 px-3 pb-3 pl-8 text-xs text-texto-2">{#each n.tareas as t (t)}<li>{t}</li>{/each}</ul>
						{#if n.notas}<p class="px-3 pb-3 text-xs text-texto-3">{n.notas}</p>{/if}
					</details>
				{/each}
			</div>
			<p class="text-xs text-texto-3">Fuente: {pl.fuente}</p>
			<form method="POST" action="?/aplicarPlantilla" use:enhance={enviar({ alTerminar: () => (hPlantilla = false) })}>
				<input type="hidden" name="plantilla" value={pl.id} />
				<button class="btn btn-acento h-12 w-full">Aplicar a {v.alias}</button>
			</form>
			<p class="text-xs text-texto-3">Podrás cambiar tareas e intervalos en Ajustes → Mantenimiento.</p>
		{/if}
	</div>
</Hoja>

<!-- Hojas -->
<Hoja bind:abierta={hEntrada} titulo={entradaEdit ? 'Editar entrada' : pendResolver ? 'Reparado' : planHecho ? 'Mantenimiento hecho' : 'Nueva entrada'}>
	<EntradaForm
		accion={pendResolver && !entradaEdit ? '?/resolver' : planHecho && !entradaEdit ? '?/hecho' : '?/entrada'}
		tituloInicial={pendResolver?.titulo ?? ''}
		ocultos={pendResolver && !entradaEdit ? { pendienteId: pendResolver.id } : {}}
		vehiculoId={v.id}
		hoy={data.hoy}
		km={data.km}
		categorias={cat.categorias}
		planes={planesVeh}
		fases={data.fasesAbiertas}
		entrada={entradaEdit}
		inventario={data.inventario}
		materialesIniciales={entradaEdit ? data.usos.filter((u) => u.entradaId === entradaEdit!.id).map((u) => ({ articuloId: u.articuloId, cantidad: u.cantidad })) : []}
		checklistInicial={entradaEdit ? (data.entradas.find((x) => x.id === entradaEdit!.id)?.checklist ?? null) : null}
		adjuntosExistentes={entradaEdit ? (data.entradas.find((x) => x.id === entradaEdit!.id)?.adjuntos ?? []) : []}
		gastosExistentes={entradaEdit ? data.movimientos.filter((m) => m.entradaId === entradaEdit!.id && m.tipo === 'gasto').sort((a, b) => a.id - b.id) : []}
		claseInicial={pendResolver ? 'reparacion' : planHecho ? 'mantenimiento' : activa ? 'diario' : 'nota'}
		planInicial={planHecho}
		planesIniciales={entradaEdit?.planes.map((p) => p.id) ?? []}
		alGuardar={() => ((hEntrada = false), (pendResolver = null))}
	/>
</Hoja>

<Hoja bind:abierta={hPendiente} titulo={pendEdit ? 'Editar avería' : 'Apuntar avería o trabajo pendiente'}>
	<PendienteForm vehiculoId={v.id} hoy={data.hoy} km={data.km} pendiente={pendEdit} adjuntos={pendEdit ? (data.adjuntosPend[pendEdit.id] ?? []) : []} alGuardar={() => (hPendiente = false)} />
</Hoja>

<Hoja bind:abierta={hKm} titulo="Actualizar km">
	<form method="POST" action="?/km" use:enhance={enviar({ alTerminar: () => (hKm = false) })} class="flex flex-col gap-4">
		<div class="grid grid-cols-2 gap-3">
			<label class="campo"><span>Km actuales</span><input name="km" class="input cifra text-2xl" inputmode="numeric" required placeholder={data.km?.toString() ?? '0'} /></label>
			<label class="campo"><span>Fecha</span><input type="date" name="fecha" class="input" value={data.hoy} /></label>
		</div>
		<button class="btn btn-acento h-12">Guardar</button>
	</form>
	{#if data.lecturas.length}
		<div class="mt-6">
			<p class="etiqueta mb-2">Lecturas anteriores</p>
			{@render listaLecturas()}
		</div>
	{/if}
</Hoja>

<Hoja bind:abierta={hVenc} titulo={vencRenovar ? 'Renovar' : vencEdit ? 'Editar vencimiento' : 'Nuevo vencimiento'}>
	<VencimientoForm tipos={cat.tiposVencimiento} hoy={data.hoy} vencimiento={vencEdit} renovar={vencRenovar} tipoInicial={tipoVencInicial} alGuardar={() => (hVenc = false)} />
</Hoja>

<Hoja bind:abierta={hGasto} titulo={gastoEdit ? 'Editar movimiento' : 'Nuevo movimiento'}>
	<MovimientoForm pagoPorDefecto={data.ajustes.pagoPorDefecto} categorias={cat.categorias} hoy={data.hoy} movimiento={gastoEdit} adjuntos={gastoEdit ? (data.adjuntosMov[gastoEdit.id] ?? []) : []} alGuardar={() => (hGasto = false)} />
</Hoja>

<Hoja bind:abierta={hObra} titulo="Nueva restauración">
	<form method="POST" action="?/restauracion" use:enhance={enviar()} class="flex flex-col gap-4">
		<label class="campo"><span>Nombre *</span><input name="nombre" class="input" required value="Restauración {v.alias}" /></label>
		<label class="campo">
			<span>Plantilla de fases</span>
			<select name="plantillaId" class="input">
				<option value="">— Empezar en blanco —</option>
				{#each cat.plantillas as p, i (p.id)}<option value={p.id} selected={i === 0}>{p.nombre} ({p.fases.length} fases)</option>{/each}
			</select>
		</label>
		<div class="grid grid-cols-2 gap-3">
			<label class="campo"><span>Inicio</span><input type="date" name="fechaInicio" class="input" value={data.hoy} /></label>
			<label class="campo"><span>Presupuesto (€)</span><input name="presupuesto" class="input" inputmode="decimal" placeholder="0,00" /></label>
		</div>
		<label class="campo">
			<span>Cambiar estado del vehículo a</span>
			<select name="estadoId" class="input">
				<option value="">— No cambiar —</option>
				{#each cat.estados as e (e.id)}<option value={e.id} selected={/restaur/i.test(e.nombre)}>{e.nombre}</option>{/each}
			</select>
		</label>
		<label class="campo"><span>Descripción</span><textarea name="descripcion" class="input" rows="3" placeholder="Objetivo, estado de partida, ideas…"></textarea></label>
		<button class="btn btn-acento h-12">Empezar restauración</button>
	</form>
</Hoja>
