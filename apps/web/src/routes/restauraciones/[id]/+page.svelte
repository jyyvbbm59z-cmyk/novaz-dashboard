<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/state';
	import AntesDespues from '$comp/AntesDespues.svelte';
	import EntradaForm from '$comp/EntradaForm.svelte';
	import Galeria from '$comp/Galeria.svelte';
	import Hoja from '$comp/Hoja.svelte';
	import MovimientoForm from '$comp/MovimientoForm.svelte';
	import Pestanas from '$comp/Pestanas.svelte';
	import Placa from '$comp/Placa.svelte';
	import SubirArchivos from '$comp/SubirArchivos.svelte';
	import { accion, enviar } from '$lib/enviar';
	import { euros, eurosInput, fechaLarga } from '@novaz/core';
	import type { Entrada, Movimiento } from '@novaz/core/schema';
	import { ArrowDown, ArrowUp, Check, ChevronDown, Flag, NotebookPen, Pencil, Plus, ReceiptText, Settings2, Trash2 } from '@lucide/svelte';
	import { Paperclip } from '@lucide/svelte';

	let { data } = $props();
	const r = $derived(data.restauracion);
	const res = $derived(data.resumen);
	const v = $derived(data.vehiculo);

	const PESTANAS = [
		['fases', 'Fases'],
		['diario', 'Diario'],
		['gastos', 'Gastos'],
		['fotos', 'Fotos']
	] as const;
	const pestana = $derived(page.url.searchParams.get('pestana') ?? 'fases');

	// Estado optimista de las casillas
	let marcadas = $state<Record<number, boolean>>({});
	const hecha = (t: { id: number; hecha: boolean }) => marcadas[t.id] ?? t.hecha;
	async function alternar(t: { id: number; hecha: boolean }, el: Element) {
		const nueva = !hecha(t);
		marcadas[t.id] = nueva;
		await accion('?/tarea', { id: t.id, hecha: nueva }, el);
		delete marcadas[t.id];
	}

	// Fase actual: la primera sin completar. En móvil, solo esa abierta por defecto.
	const actual = $derived(data.fases.find((f) => f.tareas.length === 0 || f.hechas < f.tareas.length)?.id);
	let abiertas = $state<Record<number, boolean>>({});
	const abierta = (id: number) => abiertas[id] ?? id === actual;

	let hEntrada = $state(false);
	let entradaEdit = $state<Entrada | null>(null);
	let faseEntrada = $state<number | null>(null);
	let hGasto = $state(false);
	let gastoEdit = $state<Movimiento | null>(null);
	let hDatos = $state(false);
	let hTerminar = $state(false);
	let editandoFase = $state<number | null>(null);

	async function borrar(ruta: string, id: number, que: string) {
		if (confirm(`¿Borrar ${que}?`)) await accion(ruta, { id });
	}
	async function renombrarTarea(id: number, actualTitulo: string) {
		const t = prompt('Tarea', actualTitulo);
		if (t && t.trim() && t !== actualTitulo) await accion('?/editarTarea', { id, titulo: t.trim() });
	}

	const ESTADOS = [
		['planificada', 'Planificada'],
		['en_curso', 'En curso'],
		['pausada', 'Pausada'],
		['terminada', 'Terminada']
	] as const;
	const gastoPct = $derived(r.presupuestoCent ? Math.min(res.gasto / r.presupuestoCent, 1.5) : null);
</script>

<svelte:head><title>{r.nombre} · {data.ajustes.nombreTaller}</title></svelte:head>

<a href="/flota/{v.id}?pestana=obras" class="text-sm text-texto-3 hover:text-texto">← {v.alias}</a>

<header class="mt-2 flex flex-wrap items-end justify-between gap-4">
	<div class="min-w-0">
		<div class="mb-2 flex flex-wrap items-center gap-2">
			<form method="POST" action="?/estado" use:enhance={enviar()}>
				<select name="estado" class="chip cursor-pointer appearance-none pr-2.5 [field-sizing:content]" onchange={(e) => (e.currentTarget.value === 'terminada' ? ((e.currentTarget.value = r.estado), (hTerminar = true)) : e.currentTarget.form?.requestSubmit())}>
					{#each ESTADOS as [val, t] (val)}<option value={val} selected={r.estado === val}>{t}</option>{/each}
				</select>
			</form>
			<Placa matricula={v.matricula} />
			<span class="text-sm text-texto-3">{v.alias}</span>
		</div>
		<h1 class="titulo-pagina">{r.nombre}</h1>
		{#if r.descripcion}<p class="mt-2 max-w-2xl text-sm whitespace-pre-line text-texto-2">{r.descripcion}</p>{/if}
	</div>
	<div class="flex gap-2">
		<button class="btn btn-icono" onclick={() => (hDatos = true)} aria-label="Ajustes de la restauración"><Settings2 size={18} /></button>
		{#if r.estado !== 'terminada'}<button class="btn" onclick={() => (hTerminar = true)}><Flag size={16} /> Terminar</button>{/if}
	</div>
</header>

<!-- Cifras -->
<section class="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
	<div class="tarjeta col-span-2 p-4 lg:col-span-1">
		<p class="etiqueta">Avance</p>
		<div class="mt-1 flex items-baseline gap-2"><span class="cifra text-4xl">{Math.round(res.avance * 100)}%</span><span class="text-xs text-texto-3">{res.hechas}/{res.total} tareas</span></div>
		<div class="mt-2 h-2 overflow-hidden rounded-full bg-superficie-3"><div class="h-full rounded-full bg-acento transition-all duration-500" style="width:{res.avance * 100}%"></div></div>
	</div>
	<div class="tarjeta p-4">
		<p class="etiqueta">Horas</p>
		<p class="cifra mt-1 text-3xl">{res.horas.toLocaleString('es-ES')}</p>
		<p class="text-xs text-texto-3">{data.entradas.length} entradas</p>
	</div>
	<div class="tarjeta p-4">
		<p class="etiqueta">Días</p>
		<p class="cifra mt-1 text-3xl">{res.dias ?? '—'}</p>
		<p class="text-xs text-texto-3">{fechaLarga(r.fechaInicio)}{r.fechaFin ? ` → ${fechaLarga(r.fechaFin)}` : ''}</p>
	</div>
	<div class="tarjeta col-span-2 p-4 lg:col-span-1">
		<p class="etiqueta">Gasto{r.presupuestoCent ? ' / presupuesto' : ''}</p>
		<p class="cifra mt-1 text-3xl {gastoPct != null && gastoPct > 1 ? 'nivel-vencido' : ''}">
			{euros(res.gasto, { redondo: true })}{#if r.presupuestoCent}<span class="text-lg text-texto-3"> / {euros(r.presupuestoCent, { redondo: true })}</span>{/if}
		</p>
		{#if gastoPct != null}
			<div class="mt-2 h-2 overflow-hidden rounded-full bg-superficie-3">
				<div class="h-full rounded-full" style="width:{Math.min(gastoPct, 1) * 100}%; background: {gastoPct > 1 ? 'var(--vencido)' : gastoPct > 0.85 ? 'var(--urgente)' : 'var(--ok)'}"></div>
			</div>
		{/if}
	</div>
</section>

<div class="mt-4 grid grid-cols-3 gap-2 sm:flex">
	<button class="btn btn-acento h-auto flex-col gap-1 py-2 sm:h-10 sm:flex-row sm:py-0" onclick={() => ((entradaEdit = null), (faseEntrada = actual ?? null), (hEntrada = true))}><NotebookPen size={18} /><span class="text-xs sm:text-sm">Diario</span></button>
	<SubirArchivos entidad="restauracion" entidadId={r.id} vehiculoId={v.id} camara clase="btn h-auto flex-col gap-1 py-2 text-xs sm:h-10 sm:flex-row sm:py-0 sm:text-sm" />
	<button class="btn h-auto flex-col gap-1 py-2 sm:h-10 sm:flex-row sm:py-0" onclick={() => ((gastoEdit = null), (hGasto = true))}><ReceiptText size={18} /><span class="text-xs sm:text-sm">Gasto</span></button>
</div>

<div class="mt-6">
	<Pestanas
		fija
		consulta
		pestanas={PESTANAS.map(([id, t]) => ({
			href: `?pestana=${id}`,
			texto: t,
			activa: pestana === id,
			cuenta: id === 'diario' ? data.entradas.length : id === 'gastos' ? data.movimientos.length : id === 'fotos' ? data.adjuntos.length : null
		}))}
	/>
</div>

<div class="mt-5 min-h-[70dvh]">
	{#if pestana === 'fases'}
		<div class="flex flex-col gap-3 lg:grid lg:auto-cols-[19rem] lg:grid-flow-col lg:items-start lg:overflow-x-auto lg:pb-4">
			{#each data.fases as f, i (f.id)}
				{@const completa = f.tareas.length > 0 && f.hechas === f.tareas.length}
				<section class="tarjeta flex flex-col {f.id === actual ? 'border-acento/50' : ''}">
					<header class="flex items-center gap-2 px-4 py-3">
						<button class="flex min-w-0 flex-1 items-center gap-2.5 text-left lg:pointer-events-none" onclick={() => (abiertas[f.id] = !abierta(f.id))}>
							<span
								class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-bold {completa
									? 'border-transparent bg-ok text-black'
									: f.id === actual
										? 'border-acento text-acento'
										: 'border-borde text-texto-3'}"
							>
								{#if completa}<Check size={15} strokeWidth={3} />{:else}{i + 1}{/if}
							</span>
							{#if editandoFase === f.id}
								<form method="POST" action="?/editarFase" use:enhance={enviar({ alTerminar: () => (editandoFase = null) })} class="flex-1">
									<input type="hidden" name="id" value={f.id} />
									<!-- svelte-ignore a11y_autofocus -->
									<input name="nombre" value={f.nombre} class="input h-8" autofocus onblur={(e) => e.currentTarget.form?.requestSubmit()} />
								</form>
							{:else}
								<span class="min-w-0 flex-1">
									<span class="block truncate font-display text-lg font-semibold tracking-wide uppercase">{f.nombre}</span>
									<span class="text-xs text-texto-3">{f.hechas}/{f.tareas.length}{f.fechaFin ? ` · ${fechaLarga(f.fechaFin)}` : ''}</span>
								</span>
							{/if}
							<ChevronDown size={18} class="text-texto-3 transition lg:hidden {abierta(f.id) ? 'rotate-180' : ''}" />
						</button>
					</header>
					{#if f.tareas.length}
						<div class="mx-4 mb-1 h-1 overflow-hidden rounded-full bg-superficie-3">
							<div class="h-full rounded-full {completa ? 'bg-ok' : 'bg-acento'}" style="width:{(f.hechas / f.tareas.length) * 100}%"></div>
						</div>
					{/if}
					<div class="{abierta(f.id) ? 'block' : 'hidden'} lg:block">
						<ul class="flex flex-col px-2 py-1">
							{#each f.tareas as t (t.id)}
								<li class="group flex items-center gap-1 rounded-lg hover:bg-superficie-2">
									<button class="flex min-w-0 flex-1 items-center gap-3 px-2 py-2 text-left" onclick={(e) => alternar(t, e.currentTarget.firstElementChild!)}>
										<span class="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition {hecha(t) ? 'border-acento bg-acento text-black' : 'border-texto-3'}">
											{#if hecha(t)}<Check size={13} strokeWidth={3.5} />{/if}
										</span>
										<span class="text-sm {hecha(t) ? 'text-texto-3 line-through' : ''}">{t.titulo}</span>
									</button>
									<span class="flex opacity-0 transition group-hover:opacity-100 focus-within:opacity-100">
										<button class="btn btn-fantasma btn-icono h-7 w-7" onclick={() => renombrarTarea(t.id, t.titulo)} aria-label="Renombrar"><Pencil size={13} /></button>
										<button class="btn btn-fantasma btn-icono btn-peligro h-7 w-7" onclick={() => borrar('?/borrarTarea', t.id, 'la tarea')} aria-label="Borrar"><Trash2 size={13} /></button>
									</span>
								</li>
							{/each}
						</ul>
						<form method="POST" action="?/nuevaTarea" use:enhance={enviar()} class="flex gap-2 px-4 pt-1 pb-3">
							<input type="hidden" name="faseId" value={f.id} />
							<input name="titulo" class="input h-9 text-sm" placeholder="＋ Nueva tarea" required />
						</form>
						<div class="flex items-center gap-1 border-t border-borde px-2 py-1.5">
							<button class="btn btn-fantasma h-8 px-2 text-xs" onclick={() => ((entradaEdit = null), (faseEntrada = f.id), (hEntrada = true))}><NotebookPen size={14} /> Diario</button>
							<span class="ml-auto flex">
								<button class="btn btn-fantasma btn-icono h-8 w-8" disabled={i === 0} onclick={() => accion('?/moverFase', { id: f.id, dir: 'arriba' })} aria-label="Mover antes"><ArrowUp size={14} class="lg:-rotate-90" /></button>
								<button class="btn btn-fantasma btn-icono h-8 w-8" disabled={i === data.fases.length - 1} onclick={() => accion('?/moverFase', { id: f.id, dir: 'abajo' })} aria-label="Mover después"><ArrowDown size={14} class="lg:-rotate-90" /></button>
								<button class="btn btn-fantasma btn-icono h-8 w-8" onclick={() => (editandoFase = f.id)} aria-label="Renombrar fase"><Pencil size={14} /></button>
								<button class="btn btn-fantasma btn-icono btn-peligro h-8 w-8" onclick={() => borrar('?/borrarFase', f.id, `la fase «${f.nombre}» y sus tareas`)} aria-label="Borrar fase"><Trash2 size={14} /></button>
							</span>
						</div>
					</div>
				</section>
			{/each}
			<form method="POST" action="?/nuevaFase" use:enhance={enviar()} class="tarjeta flex gap-2 border-dashed p-3">
				<input name="nombre" class="input h-10" placeholder="Nueva fase" required />
				<button class="btn btn-icono shrink-0" aria-label="Añadir fase"><Plus size={18} /></button>
			</form>
		</div>
	{:else if pestana === 'diario'}
		{#if !data.entradas.length}
			<div class="vacio">El diario de obra está vacío. Cuenta qué has hecho hoy: será oro para los vídeos.</div>
		{:else}
			<ol class="relative ml-2 border-l border-borde">
				{#each data.entradas as e (e.id)}
					<li class="relative mb-7 ml-6">
						<span class="absolute top-1.5 -left-[1.95rem] h-3 w-3 rounded-full bg-acento ring-4 ring-fondo"></span>
						<div class="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-texto-3">
							<span class="font-semibold text-texto-2">{fechaLarga(e.fecha)}</span>
							{#if e.horas}<span>· {e.horas.toLocaleString('es-ES')} h</span>{/if}
							{#if e.fase}<span class="chip h-5 text-[0.65rem]">{e.fase}</span>{/if}
						</div>
						<div class="group mt-1 flex items-start gap-2">
							<h3 class="flex-1 font-sans text-base font-semibold tracking-normal normal-case">{e.titulo}</h3>
							<span class="flex opacity-60 group-hover:opacity-100">
								<button class="btn btn-fantasma btn-icono h-8 w-8" onclick={() => ((entradaEdit = e), (hEntrada = true))} aria-label="Editar"><Pencil size={15} /></button>
								<button class="btn btn-fantasma btn-icono btn-peligro h-8 w-8" onclick={() => borrar('?/borrarEntrada', e.id, 'esta entrada')} aria-label="Borrar"><Trash2 size={15} /></button>
							</span>
						</div>
						{#if e.texto}<p class="mt-1 text-sm leading-relaxed whitespace-pre-line text-texto-2">{e.texto}</p>{/if}
						{#if e.adjuntos.length}<div class="mt-3 max-w-lg"><Galeria adjuntos={e.adjuntos} accionPortada="?/portada" portadaId={v.portadaId} columnas="grid-cols-3 sm:grid-cols-4" /></div>{/if}
						<div class="mt-2"><SubirArchivos entidad="entrada" entidadId={e.id} vehiculoId={v.id} texto="Añadir foto" clase="text-xs text-texto-3 hover:text-texto inline-flex items-center gap-1.5 [&_svg]:size-3.5" /></div>
					</li>
				{/each}
			</ol>
		{/if}
	{:else if pestana === 'gastos'}
		<div class="mb-4 flex items-center justify-between">
			<p class="text-sm text-texto-2">Total: <strong class="cifra text-lg text-texto">{euros(res.gasto)}</strong></p>
			<button class="btn" onclick={() => ((gastoEdit = null), (hGasto = true))}><Plus size={16} /> Gasto</button>
		</div>
		{#if data.movimientos.length}
			<ul class="tarjeta lista-filas">
				{#each data.movimientos as m (m.id)}
					<li class="group flex items-center gap-3 px-4 py-3">
						<span class="punto h-2.5 w-2.5" style="background:{m.categoria?.color ?? 'var(--texto-3)'}"></span>
						<div class="min-w-0 flex-1">
							<p class="truncate text-sm font-medium">{m.concepto}</p>
							<p class="text-xs text-texto-3">{fechaLarga(m.fecha)} · {m.categoria?.nombre ?? 'Sin categoría'}{m.proveedor ? ` · ${m.proveedor}` : ''}</p>
						</div>
						{#if data.adjuntosMov[m.id]?.length}<button class="chip h-6 shrink-0 px-2" onclick={() => ((gastoEdit = m), (hGasto = true))} title="Ver factura"><Paperclip size={12} />{data.adjuntosMov[m.id].length}</button>{/if}
						<span class="cifra text-lg {m.tipo === 'ingreso' ? 'nivel-ok' : ''}">{euros(m.importeCent)}</span>
						<span class="flex opacity-60 group-hover:opacity-100">
							<button class="btn btn-fantasma btn-icono h-8 w-8" onclick={() => ((gastoEdit = m), (hGasto = true))} aria-label="Editar"><Pencil size={14} /></button>
							<button class="btn btn-fantasma btn-icono btn-peligro h-8 w-8" onclick={() => borrar('?/borrarGasto', m.id, 'este gasto')} aria-label="Borrar"><Trash2 size={14} /></button>
						</span>
					</li>
				{/each}
			</ul>
		{:else}
			<div class="vacio">Sin gastos todavía.</div>
		{/if}
	{:else if pestana === 'fotos'}
		{#if data.antesDespues}
			<div class="mb-6 max-w-3xl">
				<p class="etiqueta mb-2">Antes / después</p>
				<AntesDespues antes="/archivos/{data.antesDespues.antes.clave}" despues="/archivos/{data.antesDespues.despues.clave}" />
			</div>
		{/if}
		<div class="mb-4 flex gap-2">
			<SubirArchivos entidad="restauracion" entidadId={r.id} vehiculoId={v.id} camara />
			<SubirArchivos entidad="restauracion" entidadId={r.id} vehiculoId={v.id} texto="Subir archivos" />
		</div>
		{#if data.adjuntos.length}
			<Galeria adjuntos={data.adjuntos} accionPortada="?/portada" portadaId={v.portadaId} />
		{:else}
			<div class="vacio">Sin fotos. Haz la del estado original antes de tocar nada.</div>
		{/if}
	{/if}
</div>

<Hoja bind:abierta={hEntrada} titulo={entradaEdit ? 'Editar entrada' : 'Diario de obra'}>
	<EntradaForm
		vehiculoId={v.id}
		hoy={data.hoy}
		categorias={data.catalogo.categorias}
		fases={data.fases}
		entrada={entradaEdit}
		gastosExistentes={entradaEdit ? data.movimientos.filter((m) => m.entradaId === entradaEdit!.id && m.tipo === 'gasto').sort((a, b) => a.id - b.id) : []}
		claseInicial="diario"
		faseInicial={faseEntrada}
		alGuardar={() => (hEntrada = false)}
	/>
</Hoja>

<Hoja bind:abierta={hGasto} titulo={gastoEdit ? 'Editar gasto' : 'Nuevo gasto'}>
	<MovimientoForm pagoPorDefecto={data.ajustes.pagoPorDefecto} categorias={data.catalogo.categorias} hoy={data.hoy} movimiento={gastoEdit} adjuntos={gastoEdit ? (data.adjuntosMov[gastoEdit.id] ?? []) : []} alGuardar={() => (hGasto = false)} />
</Hoja>

<Hoja bind:abierta={hDatos} titulo="Restauración">
	<form method="POST" action="?/datos" use:enhance={enviar({ alTerminar: () => (hDatos = false) })} class="flex flex-col gap-4">
		<label class="campo"><span>Nombre</span><input name="nombre" class="input" required value={r.nombre} /></label>
		<label class="campo"><span>Descripción</span><textarea name="descripcion" class="input" rows="3">{r.descripcion ?? ''}</textarea></label>
		<div class="grid grid-cols-2 gap-3">
			<label class="campo"><span>Inicio</span><input type="date" name="fechaInicio" class="input" value={r.fechaInicio ?? ''} /></label>
			<label class="campo"><span>Fin</span><input type="date" name="fechaFin" class="input" value={r.fechaFin ?? ''} /></label>
		</div>
		<label class="campo"><span>Presupuesto (€)</span><input name="presupuesto" class="input" inputmode="decimal" value={eurosInput(r.presupuestoCent)} /></label>
		<button class="btn btn-acento h-12">Guardar</button>
	</form>
	<form
		method="POST"
		action="?/borrar"
		use:enhance={({ cancel }) => {
			if (!confirm('¿Borrar la restauración? Las entradas del diario y los gastos se conservan en el vehículo.')) cancel();
		}}
		class="mt-6 border-t border-borde pt-4"
	>
		<button class="btn btn-peligro"><Trash2 size={16} /> Borrar restauración</button>
	</form>
</Hoja>

<Hoja bind:abierta={hTerminar} titulo="Terminar restauración">
	<form method="POST" action="?/estado" use:enhance={enviar({ alTerminar: () => (hTerminar = false) })} class="flex flex-col gap-4">
		<input type="hidden" name="estado" value="terminada" />
		<p class="text-sm text-texto-2">{res.hechas}/{res.total} tareas hechas · {res.horas.toLocaleString('es-ES')} h · {euros(res.gasto)}</p>
		<label class="campo"><span>Fecha de fin</span><input type="date" name="fechaFin" class="input" value={data.hoy} /></label>
		<label class="campo">
			<span>Nuevo estado del vehículo</span>
			<select name="estadoVehiculoId" class="input">
				<option value="">— No cambiar —</option>
				{#each data.catalogo.estados as e (e.id)}<option value={e.id} selected={e.orden === 1}>{e.nombre}</option>{/each}
			</select>
		</label>
		<button class="btn btn-acento h-12"><Flag size={18} /> ¡Terminada!</button>
	</form>
</Hoja>
