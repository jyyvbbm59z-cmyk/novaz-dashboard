<script lang="ts">
	import { enhance } from '$app/forms';
	import Hoja from '$comp/Hoja.svelte';
	import Icono from '$comp/Icono.svelte';
	import SelectorIcono from '$comp/SelectorIcono.svelte';
	import { accion, enviar } from '$lib/enviar';
	import { ETIQUETAS_TIPO_CAMPO, TIPOS_CAMPO, type CampoDef, type TipoCampo } from '@novaz/core';
	import type { TipoVehiculo } from '@novaz/core/schema';
	import { ArrowDown, ArrowUp, Pencil, Plus, Trash2, X } from '@lucide/svelte';

	let { data } = $props();
	let hoja = $state(false);
	let edit = $state<TipoVehiculo | null>(null);
	let icono = $state('cog');
	type CampoEd = CampoDef & { opcionesTexto: string };
	let campos = $state<CampoEd[]>([]);

	function abrir(t: TipoVehiculo | null) {
		edit = t;
		icono = t?.icono ?? 'car-front';
		campos = (t?.campos ?? []).map((c) => ({ ...c, opcionesTexto: (c.opciones ?? []).join(', ') }));
		hoja = true;
	}
	function mover(i: number, d: number) {
		const j = i + d;
		if (j < 0 || j >= campos.length) return;
		[campos[i], campos[j]] = [campos[j], campos[i]];
	}
	const json = $derived(
		JSON.stringify(
			campos.map(({ opcionesTexto, ...c }) => ({ ...c, opciones: c.tipo === 'lista' ? opcionesTexto.split(',').map((o) => o.trim()).filter(Boolean) : undefined }))
		)
	);
	async function borrar(t: TipoVehiculo) {
		if (confirm(`¿Borrar el tipo «${t.nombre}»?`)) await accion('?/borrar', { id: t.id });
	}
</script>

<div class="mb-4 flex items-center justify-between gap-3">
	<p class="text-sm text-texto-3">Cada tipo tiene sus propios campos. Coche, moto… o lo que te dé la gana.</p>
	<button class="btn btn-acento shrink-0" onclick={() => abrir(null)}><Plus size={18} /> Nuevo tipo</button>
</div>

<ul class="grid grid-cols-1 gap-3 sm:grid-cols-2">
	{#each data.catalogo.tipos as t (t.id)}
		<li class="tarjeta flex items-start gap-3 p-4">
			<span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-superficie-3"><Icono nombre={t.icono} size={22} /></span>
			<div class="min-w-0 flex-1">
				<p class="font-display text-xl font-bold uppercase">{t.nombre}</p>
				<p class="text-xs text-texto-3">{data.usos[t.id] ?? 0} vehículos · {t.campos.length} campos</p>
				{#if t.campos.length}<p class="mt-1.5 truncate text-xs text-texto-2">{t.campos.map((c) => c.etiqueta).join(' · ')}</p>{/if}
			</div>
			<button class="btn btn-fantasma btn-icono h-9 w-9" onclick={() => abrir(t)} aria-label="Editar"><Pencil size={15} /></button>
			<button class="btn btn-fantasma btn-icono btn-peligro h-9 w-9" onclick={() => borrar(t)} aria-label="Borrar"><Trash2 size={15} /></button>
		</li>
	{/each}
</ul>

<Hoja bind:abierta={hoja} titulo={edit ? `Tipo: ${edit.nombre}` : 'Nuevo tipo'} ancho="max-w-2xl">
	<form method="POST" action="?/guardar" use:enhance={enviar({ alTerminar: () => (hoja = false) })} class="flex flex-col gap-5">
		{#if edit}<input type="hidden" name="id" value={edit.id} />{/if}
		<input type="hidden" name="campos" value={json} />
		<div class="grid grid-cols-[1fr_6rem] gap-3">
			<label class="campo"><span>Nombre</span><input name="nombre" class="input" required value={edit?.nombre ?? ''} placeholder="Quad, Furgo camper, Barca a pedales…" /></label>
			<label class="campo"><span>Orden</span><input name="orden" class="input" inputmode="numeric" value={edit?.orden ?? data.catalogo.tipos.length + 1} /></label>
		</div>
		<div class="campo"><span>Icono</span><SelectorIcono bind:valor={icono} /></div>

		<div class="flex flex-col gap-2">
			<p class="etiqueta">Campos personalizados</p>
			{#each campos as c, i (i)}
				<div class="rounded-lg border border-borde bg-superficie-2 p-3">
					<div class="grid grid-cols-[1fr_9.5rem_auto] gap-2">
						<input class="input h-10" bind:value={c.etiqueta} placeholder="Nombre del campo" />
						<select class="input h-10" bind:value={c.tipo}>
							{#each TIPOS_CAMPO as tc (tc)}<option value={tc}>{ETIQUETAS_TIPO_CAMPO[tc as TipoCampo]}</option>{/each}
						</select>
						<span class="flex">
							<button type="button" class="btn btn-fantasma btn-icono h-10 w-8" onclick={() => mover(i, -1)} aria-label="Subir"><ArrowUp size={14} /></button>
							<button type="button" class="btn btn-fantasma btn-icono h-10 w-8" onclick={() => mover(i, 1)} aria-label="Bajar"><ArrowDown size={14} /></button>
							<button type="button" class="btn btn-fantasma btn-icono btn-peligro h-10 w-8" onclick={() => campos.splice(i, 1)} aria-label="Quitar"><X size={16} /></button>
						</span>
					</div>
					<div class="mt-2 flex flex-wrap items-center gap-3">
						{#if c.tipo === 'lista'}<input class="input h-9 flex-1 text-sm" bind:value={c.opcionesTexto} placeholder="Opciones separadas por comas" />{/if}
						{#if c.tipo === 'numero'}<input class="input h-9 w-28 text-sm" bind:value={c.unidad} placeholder="Unidad (cc, kg…)" />{/if}
						{#if c.tipo !== 'booleano'}<label class="flex items-center gap-2 text-xs text-texto-2"><input type="checkbox" bind:checked={c.obligatorio} class="accent-[var(--acento)]" /> Obligatorio</label>{/if}
						{#if c.clave}<span class="ml-auto font-mono text-[0.65rem] text-texto-3">{c.clave}</span>{/if}
					</div>
				</div>
			{/each}
			<button type="button" class="btn w-fit" onclick={() => campos.push({ clave: '', etiqueta: '', tipo: 'texto', opcionesTexto: '' })}><Plus size={16} /> Añadir campo</button>
			<p class="text-xs text-texto-3">Renombrar un campo conserva sus datos; borrarlo los oculta (no se pierden de la base de datos).</p>
		</div>
		<button class="btn btn-acento h-12">Guardar tipo</button>
	</form>
</Hoja>
