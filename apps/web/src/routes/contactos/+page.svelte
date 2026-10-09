<script lang="ts">
	import { enhance } from '$app/forms';
	import Hoja from '$comp/Hoja.svelte';
	import { accion, enviar } from '$lib/enviar';
	import type { Contacto } from '@novaz/core/schema';
	import { Mail, Pencil, Phone, Plus, Trash2 } from '@lucide/svelte';

	let { data } = $props();
	let hoja = $state(false);
	let edit = $state<Contacto | null>(null);
	async function borrar(c: Contacto) {
		if (confirm(`¿Borrar a ${c.nombre}? Sus vehículos quedarán sin contacto.`)) await accion('?/borrar', { id: c.id });
	}
</script>

<svelte:head><title>Contactos · {data.ajustes.nombreTaller}</title></svelte:head>

<div class="mb-5 flex items-end justify-between gap-4">
	<div>
		<p class="etiqueta">{data.catalogo.contactos.length} contactos</p>
		<h1 class="text-4xl sm:text-5xl">Contactos</h1>
	</div>
	<button class="btn btn-acento" onclick={() => ((edit = null), (hoja = true))}><Plus size={18} /> Nuevo</button>
</div>

{#if !data.catalogo.contactos.length}
	<div class="vacio">Propietarios de vehículos de terceros, proveedores… Aquí crecerá el futuro módulo de clientes.</div>
{:else}
	<ul class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
		{#each data.catalogo.contactos as c (c.id)}
			{@const vs = data.vehiculosTerceros.filter((v) => v.contactoId === c.id)}
			<li id="c{c.id}" class="tarjeta group flex flex-col gap-2 p-4">
				<div class="flex items-start justify-between gap-2">
					<h2 class="text-2xl">{c.nombre}</h2>
					<span class="flex opacity-60 group-hover:opacity-100">
						<button class="btn btn-fantasma btn-icono h-8 w-8" onclick={() => ((edit = c), (hoja = true))} aria-label="Editar"><Pencil size={14} /></button>
						<button class="btn btn-fantasma btn-icono btn-peligro h-8 w-8" onclick={() => borrar(c)} aria-label="Borrar"><Trash2 size={14} /></button>
					</span>
				</div>
				{#if c.telefono}<a href="tel:{c.telefono}" class="flex items-center gap-2 text-sm text-texto-2 hover:text-texto"><Phone size={14} />{c.telefono}</a>{/if}
				{#if c.email}<a href="mailto:{c.email}" class="flex items-center gap-2 text-sm text-texto-2 hover:text-texto"><Mail size={14} />{c.email}</a>{/if}
				{#if c.notas}<p class="text-sm whitespace-pre-line text-texto-3">{c.notas}</p>{/if}
				{#if vs.length}
					<div class="mt-1 flex flex-wrap gap-1.5">{#each vs as v (v.id)}<a href="/flota/{v.id}" class="chip hover:border-acento">{v.alias}</a>{/each}</div>
				{/if}
			</li>
		{/each}
	</ul>
{/if}

<Hoja bind:abierta={hoja} titulo={edit ? 'Editar contacto' : 'Nuevo contacto'}>
	<form method="POST" action="?/guardar" use:enhance={enviar({ alTerminar: () => (hoja = false) })} class="flex flex-col gap-4">
		{#if edit}<input type="hidden" name="id" value={edit.id} />{/if}
		<label class="campo"><span>Nombre *</span><input name="nombre" class="input" required value={edit?.nombre ?? ''} /></label>
		<div class="grid grid-cols-2 gap-3">
			<label class="campo"><span>Teléfono</span><input name="telefono" type="tel" class="input" value={edit?.telefono ?? ''} /></label>
			<label class="campo"><span>Email</span><input name="email" type="email" class="input" value={edit?.email ?? ''} /></label>
		</div>
		<label class="campo"><span>Notas</span><textarea name="notas" class="input" rows="3">{edit?.notas ?? ''}</textarea></label>
		<button class="btn btn-acento h-12">Guardar</button>
	</form>
</Hoja>
