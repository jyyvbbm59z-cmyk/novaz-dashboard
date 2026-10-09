<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { avisar } from '$lib/avisos.svelte';
	import { enviar } from '$lib/enviar';
	import { subirArchivo } from '$lib/imagenes';
	import type { Categoria, Entrada } from '@novaz/core/schema';
	import { euros, parsearEuros } from '@novaz/core';
	import { Camera, ImagePlus, Plus, X } from '@lucide/svelte';
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
		planes?: { id: number; nombre: string }[];
		fases?: { id: number; nombre: string }[];
		entrada?: Entrada | null;
		claseInicial?: string;
		planInicial?: number | null;
		planesIniciales?: number[];
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
	function alternarPlan(id: number) {
		planesTocados = true;
		planesSel = planesSel.includes(id) ? planesSel.filter((x) => x !== id) : [...planesSel, id];
	}

	// ─── Gastos y materiales desglosados
	const categoriasGasto = $derived(categorias.filter((c) => c.tipo === 'gasto'));
	const catDefecto = $derived((categoriasGasto.find((c) => /recambio/i.test(c.nombre)) ?? categoriasGasto[0])?.id ?? '');
	let gastos = $state<{ concepto: string; importe: string; categoriaId: string }[]>([]);
	const gastosJson = $derived(
		JSON.stringify(
			gastos
				.map((g) => ({ concepto: g.concepto.trim(), importeCent: parsearEuros(g.importe) ?? 0, categoriaId: Number(g.categoriaId) || null }))
				.filter((g) => g.importeCent > 0)
		)
	);
	const totalGastos = $derived(gastos.reduce((t, g) => t + (parsearEuros(g.importe) ?? 0), 0));
	const nuevoGasto = () => gastos.push({ concepto: '', importe: '', categoriaId: String(catDefecto) });
	let gastosAbierto = $state(false);
	let previas = $derived(fotos.map((f) => URL.createObjectURL(f)));
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

	function anadirFotos(e: Event) {
		const input = e.currentTarget as HTMLInputElement;
		fotos = [...fotos, ...(input.files ?? [])];
		input.value = '';
	}

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
						{planesSel.includes(p.id) ? '✓ ' : ''}{p.nombre}
					</button>
				{/each}
			</div>
			{#each planesSel as id (id)}<input type="hidden" name="planIds" value={id} />{/each}
			<span class="text-xs text-texto-3">Así su aviso vuelve a contar desde esta fecha y estos km.</span>
		</fieldset>
	{/if}
	<label class="campo"><span>Detalle</span><textarea name="texto" class="input" rows="4" bind:value={texto} placeholder="Qué se hizo, piezas, referencias, sensaciones…"></textarea></label>

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
					<label class="campo"><span>Proveedor</span><input name="proveedor" class="input h-10" placeholder="Tienda o taller" /></label>
					<label class="campo">
						<span>Pagado con</span>
						<select name="pago" class="input h-10">
							<option value="">Lo habitual</option><option value="banco">Banco</option><option value="caja">Efectivo</option><option value="socio">Mi bolsillo</option>
						</select>
					</label>
				</div>
				<p class="text-xs text-texto-3">Cada línea es un gasto con su IVA. En la factura saldrá como «Material: …» bajo esta operación.</p>
			{/if}
			{#if entrada}<p class="text-xs text-texto-3">Los gastos ya apuntados de esta entrada se editan en la pestaña Gastos.</p>{/if}
		</div>
	</details>

	{#if !entrada}
		<div class="flex flex-wrap items-center gap-2">
			<label class="btn cursor-pointer"><Camera size={18} /> Cámara<input type="file" accept="image/*" capture="environment" class="sr-only" onchange={anadirFotos} /></label>
			<label class="btn cursor-pointer"><ImagePlus size={18} /> Galería<input type="file" accept="image/*,application/pdf" multiple class="sr-only" onchange={anadirFotos} /></label>
			{#each previas as src, i (src)}
				<span class="relative h-10 w-10 overflow-hidden rounded-md bg-superficie-3">
					{#if fotos[i]?.type.startsWith('image/')}<img {src} alt="" class="h-full w-full object-cover" />{:else}<span class="flex h-full items-center justify-center text-[0.6rem]">PDF</span>{/if}
					<button type="button" class="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100" onclick={() => (fotos = fotos.filter((_, j) => j !== i))} aria-label="Quitar"><X size={14} class="text-white" /></button>
				</span>
			{/each}
		</div>
	{/if}

	<button class="btn btn-acento h-12">{entrada ? 'Guardar cambios' : 'Registrar'}</button>
</form>
