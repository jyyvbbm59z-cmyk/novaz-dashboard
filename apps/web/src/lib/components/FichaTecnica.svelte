<script lang="ts">
	// Ficha técnica del vehículo (nuestro manual): datos por secciones, sugerencias de lo que has usado,
	// borrador con IA, importar/exportar «novaz-ficha» y procedimientos paso a paso.
	import { enhance } from '$app/forms';
	import Hoja from '$comp/Hoja.svelte';
	import { accion, enviar } from '$lib/enviar';
	import { SECCIONES_FICHA, type DatoPlantilla, type Sugerencia } from '@novaz/core';
	import type { DatoTecnico, Procedimiento } from '@novaz/core/schema';
	import { BadgeCheck, BookOpen, Clock, Download, FileDown, FileUp, ListOrdered, MapPin, Pencil, Plus, Sparkles, Trash2, Wrench } from '@lucide/svelte';

	let {
		ficha,
		entradas,
		verDinero,
		base,
		editable = true
	}: {
		ficha: { plantilla: DatoPlantilla[]; datos: DatoTecnico[]; procedimientos: Procedimiento[]; sugerencias: Sugerencia[] };
		entradas: { id: number; titulo: string; texto: string | null; fecha: string; clase: string }[];
		verDinero: boolean;
		/** Ruta del vehículo («/flota/5») para los enlaces de exportar y dossier. */
		base: string;
		/** false = solo lectura (vehículo privado de otro). */
		editable?: boolean;
	} = $props();

	type Fila = { clave: string; nombre: string; seccion: string; unidad: string | null; ayuda: string | null; dato: DatoTecnico | null };
	const filas = $derived.by(() => {
		const porClave = new Map(ficha.datos.map((d) => [d.clave, d]));
		const desdePlantilla: Fila[] = ficha.plantilla.map((p) => ({ clave: p.clave, nombre: p.nombre, seccion: p.seccion, unidad: p.unidad ?? null, ayuda: p.ayuda ?? null, dato: porClave.get(p.clave) ?? null }));
		const extra: Fila[] = ficha.datos.filter((d) => !ficha.plantilla.some((p) => p.clave === d.clave)).map((d) => ({ clave: d.clave, nombre: d.nombre, seccion: d.seccion, unidad: d.unidad, ayuda: null, dato: d }));
		return [...desdePlantilla, ...extra];
	});
	const rellenos = $derived(ficha.datos.length);
	const sinVerificar = $derived(ficha.datos.filter((d) => !d.verificado).length);
	let verVacios = $state(false);

	// Editar un dato
	let hDato = $state(false);
	let fila = $state<Fila | null>(null);
	function editar(f: Fila | null) {
		fila = f ?? { clave: '', nombre: '', seccion: 'otros', unidad: null, ayuda: null, dato: null };
		hDato = true;
	}

	// Importar
	let hImportar = $state(false);
	let json = $state('');
	async function leerArchivo(e: Event) {
		const f = (e.currentTarget as HTMLInputElement).files?.[0];
		if (f) json = await f.text();
	}

	// Procedimientos
	let hProc = $state(false);
	let proc = $state<Procedimiento | null>(null);
	let editandoProc = $state(false);
	let borrador = $state({ titulo: '', pasos: '', herramientas: '', tiempoMin: '', entradaId: '' });
	function nuevoProc() {
		proc = null;
		editandoProc = true;
		borrador = { titulo: '', pasos: '', herramientas: '', tiempoMin: '', entradaId: '' };
		hProc = true;
	}
	function verProc(p: Procedimiento) {
		proc = p;
		editandoProc = false;
		hProc = true;
	}
	function editarProc(p: Procedimiento) {
		borrador = {
			titulo: p.titulo,
			pasos: p.pasos.map((x) => (x.par ? `${x.texto} | ${x.par}` : x.texto)).join('\n'),
			herramientas: p.herramientas.join(', '),
			tiempoMin: p.tiempoMin ? String(p.tiempoMin) : '',
			entradaId: p.entradaId ? String(p.entradaId) : ''
		};
		editandoProc = true;
	}
	function desdeEntrada(id: string) {
		const e = entradas.find((x) => String(x.id) === id);
		borrador.entradaId = id;
		if (!e) return;
		borrador.titulo ||= e.titulo;
		if (!borrador.pasos.trim() && e.texto) borrador.pasos = e.texto.split(/\n+|(?<=\.)\s+(?=[A-ZÁÉÍÓÚ])/).map((l) => l.trim()).filter(Boolean).join('\n');
	}
	const conTexto = $derived(entradas.filter((e) => e.texto && (e.clase === 'mantenimiento' || e.clase === 'reparacion' || e.clase === 'mejora')));
</script>

<!-- Acciones -->
<div class="mb-4 flex flex-wrap items-center gap-2">
	<p class="mr-auto text-sm text-texto-2">{rellenos} {rellenos === 1 ? 'dato' : 'datos'}{sinVerificar ? ` · ${sinVerificar} sin verificar` : ''}</p>
	{#if editable}
		<form method="POST" action="?/borradorIA" use:enhance={enviar()}><button class="btn h-9 text-sm" title="Propone valores típicos para los huecos vacíos (sin verificar)"><Sparkles size={15} /> Borrador con IA</button></form>
		<button class="btn h-9 text-sm" onclick={() => ((json = ''), (hImportar = true))}><FileUp size={15} /> Importar</button>
	{/if}
	<a href="{base}/ficha.json" download class="btn h-9 text-sm" data-sveltekit-reload><Download size={15} /> Exportar</a>
	<a href="{base}/dossier" class="btn h-9 text-sm"><FileDown size={15} /> Dossier PDF</a>
	{#if verDinero}<a href="{base}/dossier?costes=1" class="text-xs text-texto-3 hover:text-texto">(con costes)</a>{/if}
</div>

<!-- Lo aprendido de tus mantenimientos -->
{#if editable && ficha.sugerencias.length}
	<section class="tarjeta mb-5 border-acento/40 p-4">
		<p class="etiqueta mb-2 flex items-center gap-1.5"><Sparkles size={13} /> Aprendido de tus mantenimientos</p>
		<ul class="flex flex-col gap-2">
			{#each ficha.sugerencias as sg (sg.clave)}
				<li class="flex items-center gap-3 text-sm">
					<span class="min-w-0 flex-1"><strong>{sg.nombre}:</strong> {sg.valor}{sg.unidad ? ` ${sg.unidad}` : ''}<span class="block truncate text-xs text-texto-3">{sg.fuente}</span></span>
					<button class="btn h-8 shrink-0 text-xs" onclick={() => accion('?/sugerencia', { clave: sg.clave, nombre: sg.nombre, seccion: sg.seccion, valor: sg.valor, unidad: sg.unidad ?? '', fuente: sg.fuente })}>Guardar</button>
				</li>
			{/each}
		</ul>
	</section>
{/if}

<!-- Datos por secciones -->
<div class="flex flex-col gap-4">
	{#each SECCIONES_FICHA as sec (sec.clave)}
		{@const todas = filas.filter((f) => f.seccion === sec.clave)}
		{@const visibles = verVacios ? todas : todas.filter((f) => f.dato)}
		{#if visibles.length || (verVacios && todas.length)}
			<section>
				<p class="etiqueta mb-2">{sec.nombre}</p>
				<ul class="tarjeta lista-filas">
					{#each visibles as f (f.clave)}
						{@const d = f.dato}
						{@const pista = d && !d.verificado && sec.clave === 'pares'}
						<li>
							<button class="flex w-full items-center gap-3 px-3.5 py-2.5 text-left {editable ? 'hover:bg-superficie-2' : 'cursor-default'}" onclick={() => editable && editar(f)}>
								<span class="min-w-0 flex-1">
									<span class="block text-sm {d ? 'font-medium' : 'text-texto-3'}">{f.nombre}</span>
									{#if d?.detalle || d?.fuente}<span class="line-clamp-2 block text-xs text-texto-3">{[d.detalle, d.fuente].filter(Boolean).join(' · ')}</span>{:else if !d && f.ayuda}<span class="block truncate text-xs text-texto-3/70">{f.ayuda}</span>{/if}
								</span>
								{#if d}
									<span class="max-w-[55%] min-w-0 shrink-0 text-right break-words">
										<span class="cifra block text-base {pista ? 'text-texto-3 line-through decoration-dotted' : ''}">{d.valor}{d.unidad ? ` ${d.unidad}` : ''}</span>
										{#if d.verificado}<span class="flex items-center justify-end gap-1 text-[0.68rem] nivel-ok"><BadgeCheck size={11} /> verificado</span>{:else}<span class="text-[0.68rem] nivel-urgente">{pista ? 'pista: compruébalo' : 'sin verificar'}</span>{/if}
									</span>
								{:else}
									<span class="text-sm text-texto-3">—</span>
								{/if}
							</button>
						</li>
					{/each}
				</ul>
			</section>
		{/if}
	{/each}
	<div class="flex flex-wrap gap-2">
		<button class="btn h-9 text-sm" onclick={() => (verVacios = !verVacios)}>{verVacios ? 'Ocultar huecos vacíos' : `Ver huecos vacíos (${filas.filter((f) => !f.dato).length})`}</button>
		{#if editable}<button class="btn h-9 text-sm" onclick={() => editar(null)}><Plus size={15} /> Otro dato</button>{/if}
	</div>
	{#if !rellenos && !ficha.sugerencias.length}
		<div class="vacio">
			Tu manual de este vehículo: aceite, presiones, pares, referencias… Rellénalo a mano, pide un borrador a la IA (lo marca «sin verificar») o importa un manual en formato <span class="font-mono">novaz-ficha</span>. Lo que uses en los mantenimientos se propone solo.
		</div>
	{/if}
</div>

<!-- Procedimientos -->
<section class="mt-7">
	<div class="mb-2 flex items-center justify-between gap-2">
		<p class="etiqueta flex items-center gap-1.5"><BookOpen size={13} /> Procedimientos{ficha.procedimientos.length ? ` · ${ficha.procedimientos.length}` : ''}</p>
		{#if editable}<button class="text-xs font-semibold text-acento hover:underline" onclick={nuevoProc}>＋ Nuevo</button>{/if}
	</div>
	{#if ficha.procedimientos.length}
		<ul class="tarjeta lista-filas">
			{#each ficha.procedimientos as p (p.id)}
				<li>
					<button class="flex w-full items-center gap-3 px-3.5 py-2.5 text-left hover:bg-superficie-2" onclick={() => verProc(p)}>
						<ListOrdered size={16} class="shrink-0 text-texto-3" />
						<span class="min-w-0 flex-1"><span class="block truncate text-sm font-medium">{p.titulo}</span><span class="text-xs text-texto-3">{p.pasos.length} pasos{p.tiempoMin ? ` · ${p.tiempoMin} min` : ''}{p.herramientas.length ? ` · ${p.herramientas.length} herramientas` : ''}</span></span>
					</button>
				</li>
			{/each}
		</ul>
	{:else}
		<p class="text-sm text-texto-3">Tus procedimientos paso a paso (cambio de aceite, purgar frenos…), con pares y herramientas. Puedes sacarlos de una entrada del historial.</p>
	{/if}
</section>

<!-- Editar dato -->
<Hoja bind:abierta={hDato} titulo={fila?.nombre || 'Nuevo dato'}>
	{#if fila}
		{#key `${fila.clave}-${hDato}`}
			<form method="POST" action="?/dato" use:enhance={enviar({ alTerminar: () => (hDato = false) })} class="flex flex-col gap-4">
				{#if fila.clave}<input type="hidden" name="clave" value={fila.clave} />{/if}
				{#if fila.clave}
					<input type="hidden" name="nombre" value={fila.nombre} /><input type="hidden" name="seccion" value={fila.seccion} />
				{:else}
					<div class="grid grid-cols-[1fr_10rem] gap-3">
						<label class="campo"><span>Qué dato *</span><input name="nombre" class="input" required placeholder="Par de la culata" /></label>
						<label class="campo"><span>Sección</span><select name="seccion" class="input">{#each SECCIONES_FICHA as s (s.clave)}<option value={s.clave} selected={s.clave === 'otros'}>{s.nombre}</option>{/each}</select></label>
					</div>
				{/if}
				{#if fila.ayuda}<p class="-mb-2 text-xs text-texto-3">{fila.ayuda}</p>{/if}
				<div class="grid grid-cols-[1fr_6rem] gap-3">
					<label class="campo"><span>Valor</span><input name="valor" class="input" value={fila.dato?.valor ?? ''} placeholder="Vacío = borrar" /></label>
					<label class="campo"><span>Unidad</span><input name="unidad" class="input" value={fila.dato?.unidad ?? fila.unidad ?? ''} /></label>
				</div>
				<label class="campo"><span>Detalle</span><input name="detalle" class="input" value={fila.dato?.detalle ?? ''} placeholder="Con filtro, en frío, en cruz y en dos pasadas…" /></label>
				<label class="campo"><span>De dónde sale</span><input name="fuente" class="input" value={fila.dato?.fuente ?? ''} placeholder="Manual pág. 34, pegatina del vano, la caja…" /></label>
				<label class="flex items-center gap-3 rounded-lg border border-borde p-3 text-sm has-[:checked]:border-ok/60">
					<input type="checkbox" name="verificado" checked={fila.dato?.verificado ?? true} class="h-5 w-5 accent-[var(--ok)]" />
					<span>Verificado <span class="block text-xs text-texto-3">Lo has comprobado (manual, pegatina, lo que pone la pieza). Si no, queda como «sin verificar».</span></span>
				</label>
				<button class="btn btn-acento h-12">Guardar</button>
			</form>
		{/key}
	{/if}
</Hoja>

<!-- Importar -->
<Hoja bind:abierta={hImportar} titulo="Importar manual">
	<form method="POST" action="?/importarFicha" use:enhance={enviar({ alTerminar: () => (hImportar = false) })} class="flex flex-col gap-3">
		<p class="text-sm text-texto-2">Un archivo en formato <span class="font-mono">novaz-ficha</span> (el que exporta la app, o el que genere una IA siguiendo el mismo formato). Lo que ya tengas verificado no se pisa con datos sin verificar.</p>
		<input type="file" accept=".json,application/json,text/plain" class="input py-2" onchange={leerArchivo} />
		<textarea name="json" bind:value={json} class="input min-h-40 font-mono text-xs" placeholder={'O pega aquí el JSON:\n{ "formato": "novaz-ficha", "version": 1, "datos": [...], "procedimientos": [...] }'}></textarea>
		<button class="btn btn-acento h-12" disabled={!json.trim()}>Importar</button>
	</form>
</Hoja>

<!-- Procedimiento -->
<Hoja bind:abierta={hProc} titulo={editandoProc ? (proc ? 'Editar procedimiento' : 'Nuevo procedimiento') : (proc?.titulo ?? '')}>
	{#if editandoProc}
		{#key `${proc?.id ?? 'n'}-${hProc}`}
			<form method="POST" action="?/procedimiento" use:enhance={enviar({ alTerminar: () => (hProc = false) })} class="flex flex-col gap-4">
				{#if proc}<input type="hidden" name="id" value={proc.id} />{/if}
				<input type="hidden" name="entradaId" value={borrador.entradaId} />
				{#if !proc && conTexto.length}
					<label class="campo">
						<span>Sacarlo de una entrada del historial</span>
						<select class="input" onchange={(e) => desdeEntrada(e.currentTarget.value)}>
							<option value="">— Escribirlo desde cero —</option>
							{#each conTexto as e (e.id)}<option value={e.id}>{e.fecha.split('-').reverse().join('/')} · {e.titulo}</option>{/each}
						</select>
					</label>
				{/if}
				<div class="grid grid-cols-[1fr_6rem] gap-3">
					<label class="campo"><span>Título *</span><input name="titulo" class="input" required bind:value={borrador.titulo} placeholder="Cambio de aceite y filtro" /></label>
					<label class="campo"><span>Minutos</span><input name="tiempoMin" class="input" inputmode="numeric" bind:value={borrador.tiempoMin} /></label>
				</div>
				<label class="campo">
					<span>Pasos (uno por línea) *</span>
					<textarea name="pasos" class="input min-h-48" bind:value={borrador.pasos} placeholder={'Calentar el motor 5 minutos\nQuitar el tapón del cárter y vaciar | 23 Nm al montarlo\nCambiar el filtro (junta untada en aceite)'}></textarea>
					<span class="text-xs text-texto-3">Con «| 25 Nm» al final de un paso apuntas su par de apriete.</span>
				</label>
				<label class="campo"><span>Herramientas</span><input name="herramientas" class="input" bind:value={borrador.herramientas} placeholder="Llave de vaso 17, llave de filtro, bandeja" /></label>
				<button class="btn btn-acento h-12">Guardar</button>
			</form>
		{/key}
	{:else if proc}
		{@const p = proc}
		<div class="flex flex-col gap-4">
			<p class="flex flex-wrap gap-x-4 gap-y-1 text-sm text-texto-2">
				{#if p.tiempoMin}<span class="flex items-center gap-1"><Clock size={14} /> {p.tiempoMin} min</span>{/if}
				<span>{p.pasos.length} pasos</span>
			</p>
			{#if p.herramientas.length}
				<div>
					<p class="etiqueta mb-1.5 flex items-center gap-1.5"><Wrench size={12} /> Herramientas</p>
					<div class="flex flex-wrap gap-1.5">
						{#each p.herramientas as h (h)}<a href="/inventario/plano?q={encodeURIComponent(h)}" class="chip h-8 px-3 text-sm hover:border-acento" title="¿Dónde está?"><MapPin size={12} /> {h}</a>{/each}
					</div>
				</div>
			{/if}
			<ol class="flex flex-col gap-2.5">
				{#each p.pasos as paso, i (i)}
					<li class="flex gap-3">
						<span class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-acento/15 font-mono text-sm font-bold text-acento">{i + 1}</span>
						<span class="min-w-0 flex-1 pt-0.5 text-sm">{paso.texto}{#if paso.par}<span class="chip ml-1.5 h-6 px-2 font-mono text-xs nivel-urgente">{paso.par}</span>{/if}</span>
					</li>
				{/each}
			</ol>
			{#if p.notas}<p class="text-sm text-texto-3">{p.notas}</p>{/if}
			<div class="grid grid-cols-2 gap-2 {editable ? '' : 'hidden'}">
				<button class="btn" onclick={() => editarProc(p)}><Pencil size={15} /> Editar</button>
				<button class="btn text-vencido" onclick={() => confirm(`¿Borrar «${p.titulo}»?`) && accion('?/borrarProcedimiento', { id: p.id }).then(() => (hProc = false))}><Trash2 size={15} /> Borrar</button>
			</div>
		</div>
	{/if}
</Hoja>
