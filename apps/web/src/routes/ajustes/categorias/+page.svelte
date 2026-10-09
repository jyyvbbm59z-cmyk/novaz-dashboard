<script lang="ts">
	import { enhance } from '$app/forms';
	import Hoja from '$comp/Hoja.svelte';
	import { accion, enviar } from '$lib/enviar';
	import { TIPOS_IVA } from '@novaz/core';
	import type { Categoria } from '@novaz/core/schema';
	import { Pencil, Plus, Trash2 } from '@lucide/svelte';

	let { data } = $props();
	let hoja = $state(false);
	let edit = $state<Categoria | null>(null);
</script>

<div class="mb-4 flex items-center justify-between gap-3">
	<p class="text-sm text-texto-3">Clasifican gastos e ingresos y deciden su cuenta contable e IVA por defecto.</p>
	<button class="btn btn-acento shrink-0" onclick={() => ((edit = null), (hoja = true))}><Plus size={18} /> Nueva</button>
</div>

<div class="grid gap-6 md:grid-cols-2">
	{#each ['gasto', 'ingreso'] as tipo (tipo)}
		<section>
			<p class="etiqueta mb-2">{tipo === 'gasto' ? 'Gastos' : 'Ingresos'}</p>
			<ul class="tarjeta lista-filas">
				{#each data.catalogo.categorias.filter((c) => c.tipo === tipo) as c (c.id)}
					<li class="flex items-center gap-3 px-4 py-2.5">
						<span class="punto h-3 w-3" style="background:{c.color}"></span>
						<span class="flex-1 text-sm font-medium">{c.nombre}</span>
						<span class="text-xs text-texto-3">{c.ivaPct ? `${c.ivaPct} %` : 'sin IVA'}</span>
						{#if c.cuentaContable}<span class="font-mono text-xs text-texto-3">{c.cuentaContable}</span>{/if}
						<button class="btn btn-fantasma btn-icono h-8 w-8" onclick={() => ((edit = c), (hoja = true))} aria-label="Editar"><Pencil size={14} /></button>
						<button class="btn btn-fantasma btn-icono btn-peligro h-8 w-8" onclick={() => confirm(`¿Borrar ${c.nombre}?`) && accion('?/borrar', { id: c.id })} aria-label="Borrar"><Trash2 size={14} /></button>
					</li>
				{/each}
			</ul>
		</section>
	{/each}
</div>

<Hoja bind:abierta={hoja} titulo={edit ? edit.nombre : 'Nueva categoría'}>
	<form method="POST" action="?/guardar" use:enhance={enviar({ alTerminar: () => (hoja = false) })} class="flex flex-col gap-4">
		{#if edit}<input type="hidden" name="id" value={edit.id} />{/if}
		<label class="campo"><span>Nombre</span><input name="nombre" class="input" required value={edit?.nombre ?? ''} /></label>
		<div class="grid grid-cols-3 gap-3">
			<label class="campo"><span>Tipo</span><select name="tipo" class="input" value={edit?.tipo ?? 'gasto'}><option value="gasto">Gasto</option><option value="ingreso">Ingreso</option></select></label>
			<label class="campo"><span>Color</span><input type="color" name="color" class="input p-1" value={edit?.color ?? '#8a8f98'} /></label>
			<label class="campo"><span>Orden</span><input name="orden" class="input" inputmode="numeric" value={edit?.orden ?? 0} /></label>
		</div>
		<div class="grid grid-cols-2 gap-3">
			<label class="campo">
				<span>Cuenta contable</span>
				<input name="cuentaContable" class="input font-mono" list="plan" value={edit?.cuentaContable ?? ''} placeholder="602, 625, 705…" />
				<datalist id="plan">{#each data.cuentas as c (c.codigo)}<option value={c.codigo}>{c.nombre}</option>{/each}</datalist>
			</label>
			<label class="campo">
				<span>IVA por defecto</span>
				<select name="ivaPct" class="input">{#each TIPOS_IVA as t (t)}<option value={t} selected={(edit?.ivaPct ?? 21) === t}>{t ? `${t} %` : 'Sin IVA'}</option>{/each}</select>
			</label>
		</div>
		<button class="btn btn-acento h-12">Guardar</button>
	</form>
</Hoja>
