<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import Cabecera from '$comp/Cabecera.svelte';
	import ColaFotos from '$comp/ColaFotos.svelte';
	import Galeria from '$comp/Galeria.svelte';
	import Hoja from '$comp/Hoja.svelte';
	import ComprasLigadas from '$comp/ComprasLigadas.svelte';
	import MovimientoForm from '$comp/MovimientoForm.svelte';
	import SubirArchivos from '$comp/SubirArchivos.svelte';
	import { avisar } from '$lib/avisos.svelte';
	import { accion, enviar } from '$lib/enviar';
	import { subirArchivo } from '$lib/imagenes';
	import { euros, fechaLarga, textoDias, diasEntre } from '@novaz/core';
	import type { TareaLocal } from '@novaz/core/schema';
	import { CalendarSync, Check, Pencil, Play, Plus, ReceiptText, Trash2, Undo2 } from '@lucide/svelte';

	let { data } = $props();
	const PRIORIDAD: Record<string, { t: string; c: string }> = {
		alta: { t: 'Urgente', c: 'var(--vencido)' },
		media: { t: 'Pronto', c: 'var(--urgente)' },
		baja: { t: 'Sin prisa', c: 'var(--texto-3)' }
	};
	let zona = $state('');
	const abiertas = $derived(data.abiertas.filter((t) => !zona || t.zona === zona));

	let hTarea = $state(false);
	onMount(() => {
		if (page.url.searchParams.has('nueva')) hTarea = true;
	});
	let edit = $state<TareaLocal | null>(null);
	let fotos = $state<File[]>([]);
	let hGasto = $state(false);
	let tareaGasto = $state<TareaLocal | null>(null);
	const catLocal = $derived(data.catalogo.categorias.find((c) => /local/i.test(c.nombre))?.id ?? null);

	const totalGastos = (id: number) => (data.gastosDe[id] ?? []).reduce((t, g) => t + g.importeCent, 0);
	const alGuardar = async (d: Record<string, unknown>) => {
		const id = Number(d.tareaId);
		if (fotos.length && id) {
			for (const f of fotos) await subirArchivo(f, { entidad: 'local', entidadId: id }).catch((e) => avisar(`${f.name}: ${e.message}`, 'error'));
			await invalidateAll();
		}
		fotos = [];
		hTarea = false;
	};
</script>

<svelte:head><title>Local · {data.ajustes.nombreTaller}</title></svelte:head>

<Cabecera antetitulo="Taller" titulo="El local">
	<button class="btn btn-acento" onclick={() => ((edit = null), (hTarea = true))}><Plus size={18} /> Tarea</button>
</Cabecera>

<section class="mb-4 grid grid-cols-3 gap-3">
	<div class="tarjeta p-4"><p class="etiqueta">Pendientes</p><p class="cifra mt-1 text-3xl">{data.abiertas.length}</p></div>
	<div class="tarjeta p-4"><p class="etiqueta">Urgentes o vencidas</p><p class="cifra mt-1 text-3xl {data.abiertas.some((t) => t.prioridad === 'alta' || (t.fechaLimite && t.fechaLimite < data.hoy)) ? 'nivel-vencido' : ''}">{data.abiertas.filter((t) => t.prioridad === 'alta' || (t.fechaLimite && t.fechaLimite < data.hoy)).length}</p></div>
	<div class="tarjeta p-4"><p class="etiqueta">Gastado {data.hoy.slice(0, 4)}</p><p class="cifra mt-1 text-3xl">{euros(data.gastoAnio, { redondo: true })}</p></div>
</section>

{#if data.zonas.length > 1}
	<div class="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0" style="scrollbar-width:none">
		<button class="chip h-8 px-3 {!zona ? 'border-acento text-texto' : 'text-texto-2'}" onclick={() => (zona = '')}>Todo</button>
		{#each data.zonas as z (z)}<button class="chip h-8 px-3 {zona === z ? 'border-acento text-texto' : 'text-texto-2'}" onclick={() => (zona = zona === z ? '' : z)}>{z}</button>{/each}
	</div>
{/if}

{#if !data.abiertas.length}
	<div class="vacio">Pintar una pared, la humedad del rincón, revisar el extintor… Apunta aquí lo que necesita el local y no se te olvidará.</div>
{:else}
	<div class="flex flex-col gap-3">
		{#each abiertas as t (t.id)}
			{@const vencida = t.fechaLimite != null && t.fechaLimite < data.hoy}
			{@const hechos = t.pasos.filter((p) => p.hecho).length}
			<article class="tarjeta p-4" style="border-left: 3px solid {PRIORIDAD[t.prioridad].c}">
				<div class="flex items-start gap-3">
					<div class="min-w-0 flex-1">
						<div class="flex flex-wrap items-center gap-1.5">
							<h2 class="font-sans text-base font-semibold tracking-normal normal-case">{t.titulo}</h2>
							{#if t.estado === 'en_curso'}<span class="chip h-5 text-[0.65rem] nivel-pronto">En curso</span>{/if}
						</div>
						<p class="mt-0.5 text-xs text-texto-3">
							<span style="color: {PRIORIDAD[t.prioridad].c}">{PRIORIDAD[t.prioridad].t}</span>
							{#if t.zona} · {t.zona}{/if}
							{#if t.fechaLimite} · <span class={vencida ? 'nivel-vencido' : ''}>{vencida ? 'venció' : 'antes del'} {fechaLarga(t.fechaLimite)} ({textoDias(diasEntre(data.hoy, t.fechaLimite))})</span>{/if}
							{#if t.cadaMeses} · <CalendarSync size={11} class="inline" /> {t.cadaMeses === 1 ? "cada mes" : `cada ${t.cadaMeses} meses`}{/if}
						</p>
					</div>
					<button class="btn btn-fantasma btn-icono h-8 w-8" onclick={() => ((edit = t), (hTarea = true))} aria-label="Editar"><Pencil size={14} /></button>
				</div>
				{#if t.detalle}<p class="mt-2 text-sm whitespace-pre-line text-texto-2">{t.detalle}</p>{/if}

				{#if t.pasos.length}
					<div class="mt-3">
						<div class="mb-1.5 h-1 overflow-hidden rounded-full bg-superficie-3"><div class="h-full rounded-full bg-acento" style="width: {(hechos / t.pasos.length) * 100}%"></div></div>
						<ul class="flex flex-col">
							{#each t.pasos as p, i (i)}
								<li>
									<button class="flex w-full items-center gap-2.5 rounded-md px-1 py-1.5 text-left hover:bg-superficie-2" onclick={(e) => accion('?/paso', { id: t.id, indice: i, hecho: !p.hecho }, e.currentTarget)}>
										<span class="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 {p.hecho ? 'border-acento bg-acento text-black' : 'border-texto-3'}">{#if p.hecho}<Check size={13} strokeWidth={3.5} />{/if}</span>
										<span class="text-sm {p.hecho ? 'text-texto-3 line-through' : ''}">{p.texto}</span>
									</button>
								</li>
							{/each}
						</ul>
					</div>
				{/if}

				{#if data.fotos[t.id]?.length}<div class="mt-3 max-w-sm"><Galeria adjuntos={data.fotos[t.id]} columnas="grid-cols-4" /></div>{/if}

				<ComprasLigadas items={data.compras.filter((c) => c.tareaLocalId === t.id)} />
				{#if data.gastosDe[t.id]?.length}
					<ul class="mt-3 flex flex-col gap-1 border-t border-borde pt-2 text-xs">
						{#each data.gastosDe[t.id] as g (g.id)}
							<li class="group flex items-center gap-2"><span class="flex-1 text-texto-2">{g.concepto}</span><span class="font-mono">{euros(g.importeCent)}</span><button class="text-texto-3 opacity-60 hover:text-vencido group-hover:opacity-100" onclick={() => confirm('¿Borrar este gasto?') && accion('?/borrarGasto', { id: g.id })} aria-label="Borrar gasto"><Trash2 size={12} /></button></li>
						{/each}
						<li class="flex justify-between font-semibold"><span>Total</span><span class="font-mono">{euros(totalGastos(t.id))}</span></li>
					</ul>
				{/if}

				<div class="mt-3 flex flex-wrap gap-2">
					<button class="btn btn-acento h-9" onclick={(e) => accion('?/estado', { id: t.id, estado: 'hecha' }, e.currentTarget)}><Check size={16} /> Hecha</button>
					{#if t.estado === 'pendiente'}<button class="btn h-9" onclick={() => accion('?/estado', { id: t.id, estado: 'en_curso' })}><Play size={14} /> Empezar</button>{/if}
					<button class="btn h-9" onclick={() => ((tareaGasto = t), (hGasto = true))}><ReceiptText size={15} /> Gasto</button>
					<SubirArchivos entidad="local" entidadId={t.id} camara texto="Foto" clase="btn h-9" />
				</div>
			</article>
		{/each}
	</div>
{/if}

{#if data.cerradas.length}
	<details class="mt-8">
		<summary class="etiqueta cursor-pointer py-2">Hechas ({data.cerradas.length})</summary>
		<ul class="tarjeta lista-filas mt-2">
			{#each data.cerradas as t (t.id)}
				<li class="flex items-center gap-3 px-4 py-2.5 text-sm">
					<span class="min-w-0 flex-1"><span class="block truncate {t.estado === 'descartada' ? 'text-texto-3 line-through' : ''}">{t.titulo}</span><span class="text-xs text-texto-3">{t.zona ? `${t.zona} · ` : ''}{fechaLarga(t.fechaHecha)}{totalGastos(t.id) ? ` · ${euros(totalGastos(t.id))}` : ''}</span></span>
					<button class="btn btn-fantasma btn-icono h-8 w-8" onclick={() => accion('?/estado', { id: t.id, estado: 'pendiente' })} aria-label="Reabrir" title="Reabrir"><Undo2 size={14} /></button>
					<button class="btn btn-fantasma btn-icono btn-peligro h-8 w-8" onclick={() => confirm(`¿Borrar «${t.titulo}»?`) && accion('?/borrar', { id: t.id })} aria-label="Borrar"><Trash2 size={14} /></button>
				</li>
			{/each}
		</ul>
	</details>
{/if}

<Hoja bind:abierta={hTarea} titulo={edit ? 'Editar tarea' : 'Nueva tarea del local'}>
	<form method="POST" action="?/guardar" use:enhance={enviar({ alTerminar: alGuardar })} class="flex flex-col gap-4">
		{#if edit}<input type="hidden" name="id" value={edit.id} />{/if}
		<label class="campo"><span>¿Qué hay que hacer? *</span><input name="titulo" class="input h-12" required value={edit?.titulo ?? ''} placeholder="Reparar la humedad de la pared del fondo" /></label>
		<div class="grid grid-cols-2 gap-3">
			<label class="campo">
				<span>Zona</span>
				<input name="zona" class="input" list="zonas" value={edit?.zona ?? ''} placeholder="Pared del fondo, baño…" />
				<datalist id="zonas">{#each data.zonas as z (z)}<option value={z}></option>{/each}</datalist>
			</label>
			<label class="campo"><span>Antes del</span><input type="date" name="fechaLimite" class="input" value={edit?.fechaLimite ?? ''} /></label>
		</div>
		<fieldset class="grid grid-cols-3 gap-2">
			{#each Object.entries(PRIORIDAD) as [v, p] (v)}
				<label class="cursor-pointer rounded-lg border border-borde bg-superficie-2 p-2.5 text-center text-sm font-semibold has-[:checked]:border-acento has-[:checked]:bg-acento/10">
					<input type="radio" name="prioridad" value={v} checked={(edit?.prioridad ?? 'media') === v} class="sr-only" /><span class="mr-1 inline-block h-2 w-2 rounded-full" style="background:{p.c}"></span>{p.t}
				</label>
			{/each}
		</fieldset>
		<label class="campo"><span>Detalles</span><textarea name="detalle" class="input" rows="3" placeholder="Qué pasa, medidas, materiales…">{edit?.detalle ?? ''}</textarea></label>
		<label class="campo">
			<span>Pasos (uno por línea, opcional)</span>
			<textarea name="pasos" class="input text-sm" rows="4" placeholder={'Rascar la pintura suelta\nTratamiento antihumedad\nImprimación\nPintar'}>{(edit?.pasos ?? []).map((p) => p.texto).join('\n')}</textarea>
		</label>
		<label class="campo">
			<span>Para comprar <span class="font-normal text-texto-3">· una cosa por línea, va a la lista de la compra</span></span>
			<textarea name="compras" class="input text-sm" rows="2" placeholder={'Pintura antihumedad 4 L\nRodillo'}>{edit ? data.compras.filter((c) => c.tareaLocalId === edit!.id).map((c) => c.texto).join('\n') : ''}</textarea>
		</label>
		<label class="campo">
			<span>¿Se repite? Cada… meses (opcional)</span>
			<input name="cadaMeses" class="input" inputmode="numeric" value={edit?.cadaMeses ?? ''} placeholder="12 = cada año (p. ej. revisar el extintor)" />
		</label>
		{#if !edit}<div class="campo"><span>Fotos</span><ColaFotos bind:fotos /></div>{/if}
		<button class="btn btn-acento h-12">{edit ? 'Guardar' : 'Apuntar'}</button>
	</form>
	{#if edit}
		<button class="btn btn-fantasma mt-3 w-full text-texto-3" onclick={async () => { await accion('?/estado', { id: edit!.id, estado: 'descartada' }); hTarea = false; }}>Descartar (no se hará)</button>
	{/if}
</Hoja>

<Hoja bind:abierta={hGasto} titulo={tareaGasto ? `Gasto: ${tareaGasto.titulo}` : 'Gasto'}>
	{#if tareaGasto}
		{#key tareaGasto.id}
			<MovimientoForm accion="?/gasto" categorias={data.catalogo.categorias} categoriaInicial={catLocal} ocultos={{ tareaId: tareaGasto.id }} hoy={data.hoy} pagoPorDefecto={data.ajustes.pagoPorDefecto} alGuardar={() => (hGasto = false)} />
		{/key}
	{/if}
</Hoja>
