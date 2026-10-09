<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { avisar } from '$lib/avisos.svelte';
	import { enviar } from '$lib/enviar';
	import { subirArchivo } from '$lib/imagenes';
	import type { Adjunto, Categoria, Entrada, TareaHecha } from '@novaz/core/schema';
	import { expandirIncluidos } from '@novaz/core';
	import { euros, eurosInput, parsearEuros } from '@novaz/core';
	import { Plus, X } from '@lucide/svelte';
	import ColaFotos from '$comp/ColaFotos.svelte';
	import Galeria from '$comp/Galeria.svelte';
	import SubirArchivos from '$comp/SubirArchivos.svelte';
	import { onMount } from 'svelte';

	let {
		accion = '?/entrada',
		vehiculoId,
		hoy,
		km = null,
		categorias,
		planes = [],
		fases = [],
		entrada = null,
		claseInicial = 'nota',
		planInicial = null,
		planesIniciales = [],
		gastosExistentes = [],
		adjuntosExistentes = [],
		checklistInicial = null,
		faseInicial = null,
		tituloInicial = '',
		ocultos = {},
		alGuardar
	}: {
		accion?: string;
		vehiculoId: number;
		hoy: string;
		km?: number | null;
		categorias: Categoria[];
		planes?: { id: number; nombre: string; codigo?: string | null; tareas?: string[]; incluye?: number[] }[];
		fases?: { id: number; nombre: string }[];
		entrada?: Entrada | null;
		claseInicial?: string;
		planInicial?: number | null;
		planesIniciales?: number[];
		gastosExistentes?: { id: number; concepto: string; importeCent: number; categoriaId: number | null; proveedor: string | null }[];
		adjuntosExistentes?: Adjunto[];
		checklistInicial?: TareaHecha[] | null;
		faseInicial?: number | null;
		tituloInicial?: string;
		ocultos?: Record<string, string | number>;
		alGuardar?: () => void;
	} = $props();

	const CLASES = [
		['diario', 'Diario'],
		['mantenimiento', 'Mantenimiento'],
		['reparacion', 'Reparación'],
		['nota', 'Nota']
	] as const;

	// Valores iniciales: el formulario se monta de nuevo cada vez que se abre la hoja.
	const ini = (() => ({ clase: entrada?.clase ?? claseInicial, titulo: entrada?.titulo ?? tituloInicial, texto: entrada?.texto ?? '' }))();
	let clase = $state(ini.clase);
	let titulo = $state(ini.titulo);
	let texto = $state(ini.texto);
	let fotos = $state<File[]>([]);

	// ─── Mantenimientos que renueva: casillas que se marcan solas según el título
	let planesSel = $state<number[]>((() => [...new Set([...planesIniciales, ...(planInicial ? [planInicial] : [])])])());
	let planesTocados = $state((() => planesIniciales.length > 0 || planInicial != null)());
	const normalizar = (t: string) => t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
	$effect(() => {
		if (planesTocados || clase !== 'mantenimiento') return;
		const t = normalizar(titulo);
		planesSel = planes.filter((p) => normalizar(p.nombre).split(/\W+/).some((w) => w.length >= 4 && t.includes(w))).map((p) => p.id);
	});
	// ─── Tareas de las revisiones elegidas (y de las que incluyen)
	const etiqueta = (p: { codigo?: string | null; nombre: string }) => (p.codigo ? `${p.codigo} · ${p.nombre}` : p.nombre);
	const grupos = $derived.by(() => {
		const todos = expandirIncluidos(planesSel, planes.map((p) => ({ id: p.id, incluye: p.incluye ?? [] })));
		return todos
			.map((id) => planes.find((p) => p.id === id))
			.filter((p): p is (typeof planes)[number] => Boolean(p?.tareas?.length))
			.map((p) => ({ plan: p, incluida: !planesSel.includes(p.id) }));
	});
	// Estado de cada tarea: clave "plan|tarea"
	let marcas = $state<Record<string, { hecha: boolean; nota: string }>>(
		(() => Object.fromEntries((checklistInicial ?? []).map((t) => [`${t.plan}|${t.tarea}`, { hecha: t.hecha, nota: t.nota ?? '' }])))()
	);
	// El estado de una tarea solo se crea al tocarla (nunca durante el pintado)
	function fijarMarca(clave: string, cambio: Partial<{ hecha: boolean; nota: string }>) {
		const previa = marcas[clave] ?? { hecha: false, nota: '' };
		marcas[clave] = { ...previa, ...cambio };
	}
	let notaAbierta = $state<string | null>(null);
	// Abierto/cerrado de cada grupo: lo decide quien lo toca (si no, al recontar se vuelve a plegar)
	let gruposAbiertos = $state<Record<number, boolean>>({});
	// Se guardan las revisiones elegidas y, de las incluidas, solo las que se han tocado
	const tocado = (g: (typeof grupos)[number]) => (g.plan.tareas ?? []).some((t) => marcas[`${etiqueta(g.plan)}|${t}`]);
	const checklistJson = $derived(
		JSON.stringify(
			grupos.filter((g) => !g.incluida || tocado(g)).flatMap((g) =>
				(g.plan.tareas ?? []).map((t) => {
					const m = marcas[`${etiqueta(g.plan)}|${t}`];
					return { plan: etiqueta(g.plan), tarea: t, hecha: m?.hecha ?? false, nota: m?.nota || null };
				})
			)
		)
	);
	function marcarTodas(p: (typeof planes)[number], valor: boolean) {
		for (const t of p.tareas ?? []) fijarMarca(`${etiqueta(p)}|${t}`, { hecha: valor });
	}

	function alternarPlan(id: number) {
		planesTocados = true;
		planesSel = planesSel.includes(id) ? planesSel.filter((x) => x !== id) : [...planesSel, id];
	}

	// ─── Gastos y materiales desglosados
	const categoriasGasto = $derived(categorias.filter((c) => c.tipo === 'gasto'));
	const catDefecto = $derived((categoriasGasto.find((c) => /recambio/i.test(c.nombre)) ?? categoriasGasto[0])?.id ?? '');
	let gastos = $state<{ id: number | null; concepto: string; importe: string; categoriaId: string }[]>(
		(() => gastosExistentes.map((g) => ({ id: g.id, concepto: g.concepto, importe: eurosInput(g.importeCent), categoriaId: g.categoriaId ? String(g.categoriaId) : '' })))()
	);
	const proveedorInicial = (() => gastosExistentes.find((g) => g.proveedor)?.proveedor ?? '')();
	const gastosJson = $derived(
		JSON.stringify(
			gastos
				.map((g) => ({ id: g.id, concepto: g.concepto.trim(), importeCent: parsearEuros(g.importe) ?? 0, categoriaId: Number(g.categoriaId) || null }))
				.filter((g) => g.importeCent > 0)
		)
	);
	const totalGastos = $derived(gastos.reduce((t, g) => t + (parsearEuros(g.importe) ?? 0), 0));
	const nuevoGasto = () => gastos.push({ id: null, concepto: '', importe: '', categoriaId: String(catDefecto) });
	let gastosAbierto = $state((() => gastosExistentes.length > 0)());
	const claveBorrador = $derived(`borrador:entrada:${vehiculoId}`);

	onMount(() => {
		if (entrada || tituloInicial) return;
		try {
			const b = JSON.parse(localStorage.getItem(claveBorrador) ?? 'null');
			if (b && (b.titulo || b.texto)) {
				titulo = b.titulo ?? '';
				texto = b.texto ?? '';
				avisar('Borrador recuperado', 'info');
			}
		} catch {}
	});
	$effect(() => {
		if (entrada) return;
		const datos = JSON.stringify({ titulo, texto });
		try {
			if (titulo || texto) localStorage.setItem(claveBorrador, datos);
		} catch {}
	});


	const alTerminar = async (datos: Record<string, unknown>) => {
		try {
			localStorage.removeItem(claveBorrador);
		} catch {}
		const entradaId = Number(datos.entradaId);
		if (fotos.length && entradaId) {
			let n = 0;
			for (const f of fotos) {
				try {
					await subirArchivo(f, { entidad: 'entrada', entidadId: entradaId, vehiculoId });
					n++;
				} catch (err) {
					avisar(`${f.name}: ${(err as Error).message}`, 'error');
				}
			}
			if (n) await invalidateAll();
		}
		titulo = '';
		texto = '';
		fotos = [];
		gastos = [];
		gastosAbierto = false;
		planesSel = [];
		planesTocados = false;
		marcas = {};
		alGuardar?.();
	};
</script>

<form method="POST" action={accion} use:enhance={enviar({ alTerminar })} class="flex flex-col gap-4">
	{#if entrada}<input type="hidden" name="id" value={entrada.id} />{/if}
	<input type="hidden" name="vehiculoId" value={vehiculoId} />
	{#each Object.entries(ocultos) as [k, v] (k)}<input type="hidden" name={k} value={v} />{/each}

	<div class="grid grid-cols-4 gap-1 rounded-lg border border-borde bg-superficie-2 p-1">
		{#each CLASES as [v, t] (v)}
			<label class="cursor-pointer rounded-md py-1.5 text-center text-xs font-semibold {clase === v ? 'bg-superficie-3 text-texto' : 'text-texto-3'}">
				<input type="radio" name="clase" value={v} bind:group={clase} class="sr-only" />{t}
			</label>
		{/each}
	</div>

	{#if fases.length}
		<label class="campo">
			<span>Fase de restauración</span>
			<select name="faseId" class="input">
				<option value="">— Ninguna —</option>
				{#each fases as f (f.id)}<option value={f.id} selected={(entrada?.faseId ?? faseInicial) === f.id}>{f.nombre}</option>{/each}
			</select>
		</label>
	{/if}

	<label class="campo"><span>Título</span><input name="titulo" class="input" bind:value={titulo} placeholder={clase === 'diario' ? 'Hoy: desmontaje del basculante' : 'Cambio de aceite'} /></label>
	{#if clase === 'mantenimiento' && planes.length}
		<fieldset class="campo">
			<span>¿Renueva algún mantenimiento programado? <span class="text-texto-3">(opcional)</span></span>
			<div class="flex flex-wrap gap-2">
				{#each planes as p (p.id)}
					<button
						type="button"
						class="chip h-8 px-3 transition {planesSel.includes(p.id) ? 'border-acento bg-acento/15 text-texto' : 'text-texto-3'}"
						onclick={() => alternarPlan(p.id)}
						aria-pressed={planesSel.includes(p.id)}
					>
						{planesSel.includes(p.id) ? '✓ ' : ''}{#if p.codigo}<strong class="font-mono">{p.codigo}</strong> {/if}{p.nombre}
					</button>
				{/each}
			</div>
			{#each planesSel as id (id)}<input type="hidden" name="planIds" value={id} />{/each}
			<span class="text-xs text-texto-3">Así su aviso vuelve a contar desde esta fecha y estos km{planes.some((p) => p.incluye?.length) ? '. Las revisiones grandes cuentan también como las pequeñas que incluyen.' : '.'}</span>
		</fieldset>

		{#if grupos.length}
			<input type="hidden" name="checklist" value={checklistJson} />
			<div class="flex flex-col gap-2">
				{#each grupos as g (g.plan.id)}
					{@const hechas = (g.plan.tareas ?? []).filter((t) => marcas[`${etiqueta(g.plan)}|${t}`]?.hecha).length}
					<details
						class="rounded-lg border border-borde bg-superficie-2"
						open={gruposAbiertos[g.plan.id] ?? !g.incluida}
						ontoggle={(e) => (gruposAbiertos[g.plan.id] = e.currentTarget.open)}
					>
						<summary class="flex cursor-pointer items-center gap-2 px-3 py-2.5 text-sm select-none">
							<span class="flex-1 font-semibold">{etiqueta(g.plan)}{#if g.incluida}<span class="ml-1 font-normal text-texto-3">(incluida)</span>{/if}</span>
							<span class="font-mono text-xs {hechas === g.plan.tareas?.length ? 'nivel-ok' : 'text-texto-3'}">{hechas}/{g.plan.tareas?.length}</span>
						</summary>
						<ul class="flex flex-col px-2 pb-2">
							{#each g.plan.tareas ?? [] as t (t)}
								{@const clave = `${etiqueta(g.plan)}|${t}`}
								{@const m = marcas[clave] ?? { hecha: false, nota: '' }}
								<li class="rounded-md px-1 py-1 hover:bg-superficie-3/60">
									<div class="flex items-start gap-2.5">
										<input type="checkbox" checked={m.hecha} onchange={(e) => fijarMarca(clave, { hecha: e.currentTarget.checked })} class="mt-0.5 h-5 w-5 shrink-0 accent-[var(--acento)]" aria-label={t} />
										<span class="flex-1 text-sm {m.hecha ? 'text-texto-3 line-through' : ''}">{t}</span>
										<button type="button" class="shrink-0 text-xs {m.nota ? 'text-acento' : 'text-texto-3'} hover:text-texto" onclick={() => (notaAbierta = notaAbierta === clave ? null : clave)}>{m.nota ? 'nota ✎' : '+ nota'}</button>
									</div>
									{#if notaAbierta === clave || m.nota}
										<input value={m.nota} oninput={(e) => fijarMarca(clave, { nota: e.currentTarget.value })} class="input mt-1.5 ml-7 h-8 w-[calc(100%-1.75rem)] text-xs" placeholder="Resultado u observación (p. ej. 2,2 / 2,4 bar)" />
									{/if}
								</li>
							{/each}
						</ul>
						<div class="flex justify-end gap-3 px-3 pb-2.5 text-xs">
							<button type="button" class="text-texto-3 hover:text-texto" onclick={() => marcarTodas(g.plan, false)}>Desmarcar</button>
							<button type="button" class="font-semibold text-acento" onclick={() => marcarTodas(g.plan, true)}>Marcar todas</button>
						</div>
					</details>
				{/each}
			</div>
		{/if}
	{/if}
	<label class="campo"><span>Detalle</span><textarea name="texto" class="input" rows="4" bind:value={texto} placeholder="Qué se hizo, piezas, referencias, sensaciones…"></textarea></label>

	<div class="campo">
		<span>Fotos</span>
		{#if entrada}
			{#if adjuntosExistentes.length}<Galeria adjuntos={adjuntosExistentes} columnas="grid-cols-5" />{/if}
			<div class="flex flex-wrap gap-2">
				<SubirArchivos entidad="entrada" entidadId={entrada.id} {vehiculoId} camara texto="Cámara" />
				<SubirArchivos entidad="entrada" entidadId={entrada.id} {vehiculoId} texto="Galería" />
			</div>
		{:else}
			<ColaFotos bind:fotos />
		{/if}
	</div>

	<div class="grid grid-cols-3 gap-3">
		<label class="campo"><span>Fecha</span><input type="date" name="fecha" class="input px-2" value={entrada?.fecha ?? hoy} /></label>
		<label class="campo"><span>Km</span><input name="km" class="input" inputmode="numeric" value={entrada?.km ?? km ?? ''} /></label>
		<label class="campo"><span>Horas</span><input name="horas" class="input" inputmode="decimal" value={entrada?.horas ?? ''} placeholder="0" /></label>
	</div>

	<details class="rounded-lg border border-borde" open={gastosAbierto}>
		<summary
			class="cursor-pointer px-3 py-2.5 text-sm font-medium text-texto-2 select-none"
			onclick={(e) => {
				// Abrir/cerrar lo controla la app (si no, el navegador y Svelte lo alternan dos veces)
				e.preventDefault();
				gastosAbierto = !gastosAbierto;
				if (gastosAbierto && !gastos.length) nuevoGasto();
			}}
		>
			＋ Gastos y materiales{#if totalGastos} · <span class="font-mono">{euros(totalGastos)}</span>{/if}
		</summary>
		<div class="flex flex-col gap-2 px-3 pb-3">
			<input type="hidden" name="gastos" value={gastosJson} />
			{#if entrada}<input type="hidden" name="sincronizarGastos" value="1" />{/if}
			{#each gastos as g, i (i)}
				<div class="grid grid-cols-[1fr_5.5rem_auto] gap-2">
					<input bind:value={g.concepto} class="input h-10 text-sm" placeholder={i === 0 ? 'Filtro de aceite' : 'Aceite 10W40 4 L'} aria-label="Concepto" />
					<input bind:value={g.importe} class="input h-10 text-right text-sm" inputmode="decimal" placeholder="0,00" aria-label="Importe" />
					<button type="button" class="btn btn-fantasma btn-icono h-10 w-9" onclick={() => gastos.splice(i, 1)} aria-label="Quitar"><X size={15} /></button>
					<select bind:value={g.categoriaId} class="input col-span-3 -mt-1 h-8 py-0 text-xs" aria-label="Categoría">
						{#each categoriasGasto as c (c.id)}<option value={String(c.id)}>{c.nombre}</option>{/each}
					</select>
				</div>
			{/each}
			<button type="button" class="btn h-9 w-fit text-xs" onclick={nuevoGasto}><Plus size={14} /> Añadir línea</button>
			{#if gastos.length}
				<div class="grid grid-cols-2 gap-2">
					<label class="campo"><span>Proveedor</span><input name="proveedor" class="input h-10" placeholder="Tienda o taller" value={proveedorInicial} /></label>
					<label class="campo">
						<span>Pagado con</span>
						<select name="pago" class="input h-10">
							<option value="">Lo habitual</option><option value="banco">Banco</option><option value="caja">Efectivo</option><option value="socio">Mi bolsillo</option>
						</select>
					</label>
				</div>
				<p class="text-xs text-texto-3">Cada línea es un gasto con su IVA. En la factura saldrá como «Material: …» bajo esta operación.</p>
			{/if}
			{#if entrada && gastosExistentes.length}<p class="text-xs text-texto-3">Cambia o quita (✕) las líneas aquí: se actualiza el gasto en la contabilidad, sin duplicar.</p>{/if}
		</div>
	</details>


	<button class="btn btn-acento h-12">{entrada ? 'Guardar cambios' : 'Registrar'}</button>
</form>
