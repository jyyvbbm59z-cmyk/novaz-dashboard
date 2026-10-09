<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { avisar } from '$lib/avisos.svelte';
	import { enviar } from '$lib/enviar';
	import { subirArchivo } from '$lib/imagenes';
	import type { Categoria, Entrada } from '@novaz/core/schema';
	import { Camera, ImagePlus, X } from '@lucide/svelte';
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
		faseInicial = null,
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
		faseInicial?: number | null;
		alGuardar?: () => void;
	} = $props();

	const CLASES = [
		['diario', 'Diario'],
		['mantenimiento', 'Mantenimiento'],
		['reparacion', 'Reparación'],
		['nota', 'Nota']
	] as const;

	// Valores iniciales: el formulario se monta de nuevo cada vez que se abre la hoja.
	const ini = (() => ({ clase: entrada?.clase ?? claseInicial, titulo: entrada?.titulo ?? '', texto: entrada?.texto ?? '' }))();
	let clase = $state(ini.clase);
	let titulo = $state(ini.titulo);
	let texto = $state(ini.texto);
	let fotos = $state<File[]>([]);
	let previas = $derived(fotos.map((f) => URL.createObjectURL(f)));
	const claveBorrador = $derived(`borrador:entrada:${vehiculoId}`);

	onMount(() => {
		if (entrada) return;
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
		alGuardar?.();
	};
</script>

<form method="POST" action={accion} use:enhance={enviar({ alTerminar })} class="flex flex-col gap-4">
	{#if entrada}<input type="hidden" name="id" value={entrada.id} />{/if}
	<input type="hidden" name="vehiculoId" value={vehiculoId} />

	<div class="grid grid-cols-4 gap-1 rounded-lg border border-borde bg-superficie-2 p-1">
		{#each CLASES as [v, t] (v)}
			<label class="cursor-pointer rounded-md py-1.5 text-center text-xs font-semibold {clase === v ? 'bg-superficie-3 text-texto' : 'text-texto-3'}">
				<input type="radio" name="clase" value={v} bind:group={clase} class="sr-only" />{t}
			</label>
		{/each}
	</div>

	{#if clase === 'mantenimiento' && planes.length}
		<label class="campo">
			<span>Plan de mantenimiento</span>
			<select name="planId" class="input">
				<option value="">— Ninguno —</option>
				{#each planes as p (p.id)}<option value={p.id} selected={(entrada?.planId ?? planInicial) === p.id}>{p.nombre}</option>{/each}
			</select>
		</label>
	{/if}
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
	<label class="campo"><span>Detalle</span><textarea name="texto" class="input" rows="4" bind:value={texto} placeholder="Qué se hizo, piezas, referencias, sensaciones…"></textarea></label>

	<div class="grid grid-cols-3 gap-3">
		<label class="campo"><span>Fecha</span><input type="date" name="fecha" class="input px-2" value={entrada?.fecha ?? hoy} /></label>
		<label class="campo"><span>Km</span><input name="km" class="input" inputmode="numeric" value={entrada?.km ?? km ?? ''} /></label>
		<label class="campo"><span>Horas</span><input name="horas" class="input" inputmode="decimal" value={entrada?.horas ?? ''} placeholder="0" /></label>
	</div>

	{#if !entrada}
		<details class="group rounded-lg border border-borde">
			<summary class="cursor-pointer px-3 py-2.5 text-sm font-medium text-texto-2 select-none">＋ Gasto asociado</summary>
			<div class="grid grid-cols-2 gap-3 px-3 pb-3">
				<label class="campo"><span>Importe (€)</span><input name="importe" class="input" inputmode="decimal" placeholder="0,00" /></label>
				<label class="campo">
					<span>Categoría</span>
					<select name="categoriaId" class="input">
						{#each categorias.filter((c) => c.tipo === 'gasto') as c (c.id)}<option value={c.id}>{c.nombre}</option>{/each}
					</select>
				</label>
				<label class="campo col-span-2"><span>Proveedor</span><input name="proveedor" class="input" /></label>
			</div>
		</details>

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
