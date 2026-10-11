<script lang="ts">
	// Alta rápida de una balda: foto (la IA hace la lista) o lista escrita → revisar → guardar → siguiente balda.
	import { avisar } from '$lib/avisos.svelte';
	import { accion } from '$lib/enviar';
	import { fotoParaLeer } from '$lib/imagenes';
	import { registrar } from '$lib/uso';
	import { articuloExistente, parsearLista, type ObjetoDetectado } from '@novaz/core';
	import type { TipoArticulo } from '@novaz/core/schema';
	import { ArrowRight, Camera, Images, ListPlus, LoaderCircle, Plus, Trash2 } from '@lucide/svelte';

	type Existente = { id: number; nombre: string; marca: string | null; muebleId: number | null; nivel: number | null; sitio: { codigo: string | null } };
	interface Fila extends ObjetoDetectado {
		clave: number;
		si: boolean;
		moverId: number | null;
		nota: string | null;
	}

	let {
		modo,
		muebleId,
		nivel = $bindable(),
		niveles,
		codigo,
		nombreNivel,
		articulos,
		alTerminar
	}: {
		modo: 'foto' | 'lista';
		muebleId: number;
		nivel: number | null;
		niveles: number;
		codigo: (n: number | null) => string;
		nombreNivel: (n: number) => string;
		articulos: Existente[];
		alTerminar?: () => void;
	} = $props();

	let filas = $state<Fila[]>([]);
	let leyendo = $state(false);
	let guardando = $state(false);
	let texto = $state('');
	let fotos = $state(0);
	let n = 0;
	let camara = $state<HTMLInputElement>();
	let galeria = $state<HTMLInputElement>();

	function anadir(objs: ObjetoDetectado[]) {
		for (const o of objs) {
			const ex = articuloExistente(o, articulos);
			const aqui = ex && ex.muebleId === muebleId && (ex.nivel ?? null) === nivel;
			filas.push({ ...o, clave: n++, si: !aqui, moverId: ex?.id ?? null, nota: ex ? (aqui ? 'Ya está aquí' : `Ya lo tienes${ex.sitio.codigo ? ` en ${ex.sitio.codigo}` : ''}: se mueve aquí`) : null });
		}
	}

	async function leerFoto(e: Event) {
		const f = (e.currentTarget as HTMLInputElement).files?.[0];
		(e.currentTarget as HTMLInputElement).value = '';
		if (!f) return;
		leyendo = true;
		const desde = performance.now();
		try {
			const fd = new FormData();
			fd.set('imagen', await fotoParaLeer(f));
			const r = await fetch('/api/leer-balda', { method: 'POST', body: fd });
			if (!r.ok) throw new Error(((await r.json().catch(() => null)) as { message?: string } | null)?.message ?? 'No he podido mirar la foto');
			const objs = (await r.json()) as ObjetoDetectado[];
			anadir(objs);
			fotos++;
			registrar({ evento: 'balda_ok', duracionMs: Math.round(performance.now() - desde), datos: { objetos: objs.length } });
		} catch (err) {
			registrar({ evento: 'balda_error', duracionMs: Math.round(performance.now() - desde), datos: { mensaje: (err as Error).message.slice(0, 160) } });
			avisar((err as Error).message, 'error', 5000);
		} finally {
			leyendo = false;
		}
	}

	function leerLista() {
		anadir(parsearLista(texto));
		texto = '';
	}

	const elegidas = $derived(filas.filter((f) => f.si && f.nombre.trim()));
	const siguiente = $derived(nivel != null && nivel < niveles ? nivel + 1 : null);

	async function guardar(pasar: boolean) {
		if (!elegidas.length) return;
		guardando = true;
		const r = await accion('/inventario/plano?/alta', {
			muebleId,
			...(nivel ? { nivel } : {}),
			objetos: JSON.stringify(elegidas.map(({ nombre, marca, cantidad, tipo, categoria, moverId }) => ({ nombre, marca, cantidad, tipo, categoria, moverId })))
		});
		guardando = false;
		if (!r) return;
		filas = [];
		fotos = 0;
		if (pasar && siguiente) nivel = siguiente;
		else alTerminar?.();
	}
	const TIPOS: [TipoArticulo, string][] = [
		['herramienta', 'Herramienta'],
		['consumible', 'Consumible'],
		['recambio', 'Recambio']
	];
</script>

<div class="flex flex-col gap-3">
	<!-- Dónde: la balda (se puede cambiar) -->
	{#if niveles > 1}
		<div class="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1" style="scrollbar-width:none">
			{#each Array.from({ length: niveles }, (_, i) => i + 1) as k (k)}
				<button type="button" class="chip h-8 shrink-0 px-3 font-mono {nivel === k ? 'border-acento bg-acento/10 text-texto' : 'text-texto-3'}" onclick={() => (nivel = k)}>{codigo(k)}</button>
			{/each}
		</div>
	{/if}

	{#if modo === 'foto'}
		<div class="rounded-lg border border-dashed border-borde p-3">
			{#if leyendo}
				<p class="flex h-20 items-center justify-center gap-2 text-sm text-texto-2"><LoaderCircle size={18} class="animate-spin" /> Mirando la foto…</p>
			{:else}
				<p class="mb-2 text-xs text-texto-3">
					{fotos ? 'Si no salía todo, haz otra foto: se añade a la lista.' : `Foto de ${nivel ? `${nombreNivel(nivel).toLowerCase()} (${codigo(nivel)})` : 'todo el mueble'}, de frente y con luz. La IA hace la lista; tú la repasas.`}
				</p>
				<div class="grid grid-cols-2 gap-2">
					<button type="button" class="btn h-14 text-base btn-acento" onclick={() => camara?.click()}><Camera size={20} /> {fotos ? 'Otra foto' : 'Hacer foto'}</button>
					<button type="button" class="btn h-14" onclick={() => galeria?.click()}><Images size={18} /> Galería</button>
				</div>
			{/if}
		</div>
		<input bind:this={camara} type="file" accept="image/*" capture="environment" class="hidden" onchange={leerFoto} aria-label="Hacer foto de la balda" />
		<input bind:this={galeria} type="file" accept="image/*" class="hidden" onchange={leerFoto} aria-label="Elegir foto de la balda" />
	{:else}
		<div class="flex flex-col gap-2">
			<textarea bind:value={texto} class="input min-h-28" placeholder={'Una cosa por línea:\n3x Llave fija 13\nAlicates de punta\nCinta americana (4)'}></textarea>
			<button type="button" class="btn h-10" disabled={!texto.trim()} onclick={leerLista}><ListPlus size={16} /> Pasar a la lista</button>
			<p class="text-xs text-texto-3">Truco: dicta con el micrófono del teclado y separa con comas.</p>
		</div>
	{/if}

	{#if filas.length}
		<div class="flex items-center justify-between">
			<p class="etiqueta">{elegidas.length} de {filas.length} para guardar</p>
			<button type="button" class="text-xs text-texto-3 hover:text-texto" onclick={() => filas.push({ nombre: '', marca: null, cantidad: 1, tipo: 'herramienta', categoria: null, clave: n++, si: true, moverId: null, nota: null })}><Plus size={12} class="inline" /> Añadir fila</button>
		</div>
		<ul class="tarjeta lista-filas">
			{#each filas as f, i (f.clave)}
				<li class="flex gap-2 px-2.5 py-2 {f.si ? '' : 'opacity-50'}">
					<input type="checkbox" bind:checked={f.si} class="mt-2.5 h-5 w-5 shrink-0 accent-[var(--acento)]" aria-label="Guardar {f.nombre}" />
					<div class="flex min-w-0 flex-1 flex-col gap-1.5">
						<div class="flex gap-1.5">
							<input bind:value={f.nombre} class="input h-9 min-w-0 flex-1 text-sm" aria-label="Nombre" />
							<input bind:value={f.cantidad} type="number" min="0" step="any" class="input h-9 w-16 shrink-0 px-2 text-center text-sm" aria-label="Cantidad" />
						</div>
						{#if f.moverId}
							<p class="text-xs text-pronto">{f.nota}</p>
						{:else}
							<div class="flex gap-1.5">
								<input value={f.marca ?? ''} oninput={(e) => (f.marca = e.currentTarget.value || null)} class="input h-8 min-w-0 flex-1 text-xs" placeholder="Marca" aria-label="Marca" />
								<input value={f.categoria ?? ''} oninput={(e) => (f.categoria = e.currentTarget.value || null)} class="input h-8 min-w-0 flex-1 text-xs" placeholder="Categoría" aria-label="Categoría" />
								<select bind:value={f.tipo} class="input h-8 w-auto shrink-0 px-1.5 text-xs" aria-label="Tipo">{#each TIPOS as [v, t] (v)}<option value={v}>{t}</option>{/each}</select>
							</div>
						{/if}
					</div>
					<button type="button" class="mt-1.5 h-7 w-7 shrink-0 text-texto-3 hover:text-vencido" onclick={() => filas.splice(i, 1)} aria-label="Quitar"><Trash2 size={15} /></button>
				</li>
			{/each}
		</ul>
		<div class="flex flex-col gap-2">
			{#if siguiente}
				<button class="btn btn-acento h-12" disabled={!elegidas.length || guardando} onclick={() => guardar(true)}>
					Guardar {elegidas.length} y pasar a {codigo(siguiente)} <ArrowRight size={16} />
				</button>
			{/if}
			<button class="btn {siguiente ? '' : 'btn-acento'} h-11" disabled={!elegidas.length || guardando} onclick={() => guardar(false)}>Guardar {elegidas.length} en {codigo(nivel)}{siguiente ? ' y terminar' : ''}</button>
		</div>
	{/if}
</div>
