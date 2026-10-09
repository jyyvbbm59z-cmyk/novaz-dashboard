<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/state';
	import EntradaForm from '$comp/EntradaForm.svelte';
	import Galeria from '$comp/Galeria.svelte';
	import Hoja from '$comp/Hoja.svelte';
	import Icono from '$comp/Icono.svelte';
	import MovimientoForm from '$comp/MovimientoForm.svelte';
	import Nivel from '$comp/Nivel.svelte';
	import Pestanas from '$comp/Pestanas.svelte';
	import Placa from '$comp/Placa.svelte';
	import SubirArchivos from '$comp/SubirArchivos.svelte';
	import VencimientoForm from '$comp/VencimientoForm.svelte';
	import { accion, enviar } from '$lib/enviar';
	import { euros, fechaLarga, mostrarCampo, textoDias } from '@novaz/core';
	import type { Entrada, Movimiento, Vencimiento } from '@novaz/core/schema';
	import { Check, Gauge, NotebookPen, Pencil, Plus, ReceiptText, RefreshCw, Trash2, Wrench } from '@lucide/svelte';

	let { data } = $props();
	const v = $derived(data.vehiculo);
	const cat = $derived(data.catalogo);
	const tipo = $derived(cat.tipos.find((t) => t.id === v.tipoId));
	const estado = $derived(cat.estados.find((e) => e.id === v.estadoId));
	const contacto = $derived(cat.contactos.find((c) => c.id === v.contactoId));
	const portada = $derived(data.adjuntos.find((a) => a.id === v.portadaId));
	const activa = $derived(data.restauraciones.find((r) => r.estado !== 'terminada'));
	const planesVeh = $derived(data.mantenimiento.map((m) => ({ id: m.plan.id, nombre: m.plan.nombre })));
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
	let entradaEdit = $state<Entrada | null>(null);
	let planHecho = $state<number | null>(null);
	let hKm = $state(false);
	let hVenc = $state(false);
	let vencEdit = $state<Vencimiento | null>(null);
	let vencRenovar = $state(false);
	let tipoVencInicial = $state<number | null>(null);
	let hGasto = $state(false);
	let gastoEdit = $state<Movimiento | null>(null);
	let hObra = $state(false);

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
<div class="mt-4 grid grid-cols-4 gap-2 sm:flex sm:flex-wrap">
	<button class="btn btn-acento flex-col gap-1 py-2 sm:h-10 sm:flex-row sm:py-0 h-auto" onclick={() => nuevaEntrada()}><NotebookPen size={18} /><span class="text-xs sm:text-sm">Entrada</span></button>
	<SubirArchivos entidad="vehiculo" entidadId={v.id} vehiculoId={v.id} camara clase="btn flex-col gap-1 py-2 h-auto sm:h-10 sm:flex-row sm:py-0 text-xs sm:text-sm" />
	<button class="btn h-auto flex-col gap-1 py-2 sm:h-10 sm:flex-row sm:py-0" onclick={() => (hKm = true)}><Gauge size={18} /><span class="text-xs sm:text-sm">Km</span></button>
	<button class="btn h-auto flex-col gap-1 py-2 sm:h-10 sm:flex-row sm:py-0" onclick={() => ((gastoEdit = null), (hGasto = true))}><ReceiptText size={18} /><span class="text-xs sm:text-sm">Gasto</span></button>
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
			cuenta: id === 'historial' ? data.entradas.length : id === 'fotos' ? data.adjuntos.length : id === 'papeles' ? alertasVeh.filter((a) => a.tipo === 'vencimiento').length || null : null
		}))}
	/>
</div>

<div class="mt-5 min-h-[70dvh]">
	{#if pestana === 'historial'}
		{#if !data.entradas.length}
			<div class="vacio">Sin entradas todavía. Registra la primera: un mantenimiento, una nota o el diario de obra.</div>
		{:else}
			<ol class="relative ml-2 border-l border-borde">
				{#each data.entradas as e (e.id)}
					<li id="entrada-{e.id}" class="relative mb-6 ml-6 scroll-mt-28">
						<span class="absolute top-1.5 -left-[1.95rem] h-3 w-3 rounded-full ring-4 ring-fondo" style="background:{colorClase[e.clase]}"></span>
						<div class="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-texto-3">
							<span class="font-semibold text-texto-2">{fechaLarga(e.fecha)}</span>
							<span>· {nombreClase[e.clase]}</span>
							{#if e.km != null}<span>· {e.km.toLocaleString('es-ES')} km</span>{/if}
							{#if e.horas}<span>· {e.horas.toLocaleString('es-ES')} h</span>{/if}
							{#if e.importe}<span>· {euros(e.importe)}</span>{/if}
							{#if e.fase}<span class="chip h-5 text-[0.65rem]">{e.fase}</span>{/if}
						</div>
						<div class="group mt-1 flex items-start gap-2">
							<h3 class="flex-1 font-sans text-base font-semibold tracking-normal normal-case">{e.titulo}</h3>
							<span class="flex opacity-60 transition group-hover:opacity-100">
								<button class="btn btn-fantasma btn-icono h-8 w-8" aria-label="Editar" onclick={() => ((entradaEdit = e), (hEntrada = true))}><Pencil size={15} /></button>
								<button class="btn btn-fantasma btn-icono btn-peligro h-8 w-8" aria-label="Borrar" onclick={() => borrar('?/borrarEntrada', e.id, 'esta entrada')}><Trash2 size={15} /></button>
							</span>
						</div>
						{#if e.texto}<p class="mt-1 text-sm leading-relaxed whitespace-pre-line text-texto-2">{e.texto}</p>{/if}
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
		{#if !data.mantenimiento.length}
			<div class="vacio">No hay planes de mantenimiento para este tipo de vehículo. Créalos en <a href="/ajustes/mantenimiento" class="text-acento">Ajustes</a>.</div>
		{:else}
			<div class="grid gap-3 sm:grid-cols-2">
				{#each data.mantenimiento as m (m.plan.id)}
					<article class="tarjeta flex flex-col gap-3 p-4">
						<div class="flex items-start justify-between gap-2">
							<div>
								<h3 class="text-xl">{m.plan.nombre}</h3>
								<p class="text-xs text-texto-3">
									Cada {[m.plan.cadaKm ? `${m.plan.cadaKm.toLocaleString('es-ES')} km` : null, m.plan.cadaMeses ? `${m.plan.cadaMeses} meses` : null].filter(Boolean).join(' o ')}
								</p>
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
						<button class="btn mt-auto" onclick={() => nuevaEntrada(m.plan.id)}><Check size={16} /> {m.estado.sinHistorial ? 'Registrar el último' : 'Hecho'}</button>
					</article>
				{/each}
			</div>
		{/if}
		{#if data.lecturas.length}
			<details class="mt-6">
				<summary class="etiqueta cursor-pointer py-2">Lecturas de km</summary>
				<ul class="tarjeta lista-filas mt-2 text-sm">
					{#each data.lecturas as l (l.id)}
						<li class="flex justify-between px-4 py-2"><span>{fechaLarga(l.fecha)}</span><span class="cifra">{l.km.toLocaleString('es-ES')} km</span></li>
					{/each}
				</ul>
			</details>
		{/if}
	{:else if pestana === 'gastos'}
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

<!-- Hojas -->
<Hoja bind:abierta={hEntrada} titulo={entradaEdit ? 'Editar entrada' : planHecho ? 'Mantenimiento hecho' : 'Nueva entrada'}>
	<EntradaForm
		accion={planHecho && !entradaEdit ? '?/hecho' : '?/entrada'}
		vehiculoId={v.id}
		hoy={data.hoy}
		km={data.km}
		categorias={cat.categorias}
		planes={planesVeh}
		fases={data.fasesAbiertas}
		entrada={entradaEdit}
		claseInicial={planHecho ? 'mantenimiento' : activa ? 'diario' : 'nota'}
		planInicial={planHecho}
		alGuardar={() => (hEntrada = false)}
	/>
</Hoja>

<Hoja bind:abierta={hKm} titulo="Actualizar km">
	<form method="POST" action="?/km" use:enhance={enviar({ alTerminar: () => (hKm = false) })} class="flex flex-col gap-4">
		<div class="grid grid-cols-2 gap-3">
			<label class="campo"><span>Km actuales</span><input name="km" class="input cifra text-2xl" inputmode="numeric" required placeholder={data.km?.toString() ?? '0'} /></label>
			<label class="campo"><span>Fecha</span><input type="date" name="fecha" class="input" value={data.hoy} /></label>
		</div>
		<button class="btn btn-acento h-12">Guardar</button>
	</form>
</Hoja>

<Hoja bind:abierta={hVenc} titulo={vencRenovar ? 'Renovar' : vencEdit ? 'Editar vencimiento' : 'Nuevo vencimiento'}>
	<VencimientoForm tipos={cat.tiposVencimiento} hoy={data.hoy} vencimiento={vencEdit} renovar={vencRenovar} tipoInicial={tipoVencInicial} alGuardar={() => (hVenc = false)} />
</Hoja>

<Hoja bind:abierta={hGasto} titulo={gastoEdit ? 'Editar movimiento' : 'Nuevo movimiento'}>
	<MovimientoForm pagoPorDefecto={data.ajustes.pagoPorDefecto} categorias={cat.categorias} hoy={data.hoy} movimiento={gastoEdit} alGuardar={() => (hGasto = false)} />
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
