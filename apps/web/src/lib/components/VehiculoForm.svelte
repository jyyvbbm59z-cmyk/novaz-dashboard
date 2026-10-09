<script lang="ts">
	import { enhance } from '$app/forms';
	import CamposPersonalizados from '$comp/CamposPersonalizados.svelte';
	import Icono from '$comp/Icono.svelte';
	import type { Catalogos } from '$lib/server/datos';
	import { enviar } from '$lib/enviar';
	import type { Vehiculo } from '@novaz/core/schema';

	let {
		catalogo,
		vehiculo = null,
		hoy,
		accion = '',
		textoBoton = 'Guardar'
	}: { catalogo: Catalogos; vehiculo?: Vehiculo | null; hoy: string; accion?: string; textoBoton?: string } = $props();

	const ini = (() => ({
		tipoId: vehiculo?.tipoId ?? catalogo.tipos[0]?.id,
		propietario: vehiculo?.propietario ?? ('novaz' as const),
		contactoId: vehiculo?.contactoId ? String(vehiculo.contactoId) : ''
	}))();
	let tipoId = $state(ini.tipoId);
	let propietario = $state<'novaz' | 'tercero'>(ini.propietario);
	let contactoId = $state(ini.contactoId);
	const tipo = $derived(catalogo.tipos.find((t) => t.id === Number(tipoId)));
</script>

<form method="POST" action={accion} use:enhance={enviar({ reset: false })} class="flex flex-col gap-6">
	<fieldset class="flex flex-col gap-2">
		<legend class="etiqueta mb-2">Tipo</legend>
		<div class="flex flex-wrap gap-2">
			{#each catalogo.tipos as t (t.id)}
				<label
					class="flex h-11 cursor-pointer items-center gap-2 rounded-lg border px-3.5 text-sm font-medium transition {Number(tipoId) === t.id
						? 'border-acento bg-acento/10 text-texto'
						: 'border-borde bg-superficie-2 text-texto-2'}"
				>
					<input type="radio" name="tipoId" value={t.id} bind:group={tipoId} class="sr-only" />
					<Icono nombre={t.icono} />
					{t.nombre}
				</label>
			{/each}
		</div>
	</fieldset>

	<div class="grid gap-4 sm:grid-cols-2">
		<label class="campo sm:col-span-2">
			<span>Nombre / alias *</span>
			<input name="alias" class="input" required value={vehiculo?.alias ?? ''} placeholder="SV650 negra, Golf de Paco…" />
		</label>
		<label class="campo"><span>Marca</span><input name="marca" class="input" value={vehiculo?.marca ?? ''} /></label>
		<label class="campo"><span>Modelo</span><input name="modelo" class="input" value={vehiculo?.modelo ?? ''} /></label>
		<label class="campo"><span>Año</span><input name="anio" class="input" inputmode="numeric" value={vehiculo?.anio ?? ''} /></label>
		<label class="campo"><span>Matrícula</span><input name="matricula" class="input font-mono uppercase" value={vehiculo?.matricula ?? ''} /></label>
		<label class="campo sm:col-span-2"><span>Bastidor (VIN)</span><input name="bastidor" class="input font-mono uppercase" value={vehiculo?.bastidor ?? ''} /></label>
		<label class="campo">
			<span>Estado</span>
			<select name="estadoId" class="input">
				{#each catalogo.estados as e (e.id)}<option value={e.id} selected={vehiculo ? vehiculo.estadoId === e.id : e.orden === 1}>{e.nombre}</option>{/each}
			</select>
		</label>
		<label class="campo"><span>Fecha de alta</span><input type="date" name="fechaAlta" class="input" value={vehiculo?.fechaAlta ?? hoy} /></label>
		{#if !vehiculo}
			<label class="campo"><span>Km actuales</span><input name="km" class="input" inputmode="numeric" placeholder="0" /></label>
		{/if}
	</div>

	<fieldset class="flex flex-col gap-3">
		<legend class="etiqueta mb-2">Propietario</legend>
		<div class="inline-flex w-fit rounded-lg border border-borde bg-superficie-2 p-1">
			{#each [['novaz', 'Novaz'], ['tercero', 'Otra persona']] as [v, t] (v)}
				<label class="cursor-pointer rounded-md px-4 py-1.5 text-sm font-medium {propietario === v ? 'bg-superficie-3 text-texto' : 'text-texto-3'}">
					<input type="radio" name="propietario" value={v} bind:group={propietario} class="sr-only" />{t}
				</label>
			{/each}
		</div>
		{#if propietario === 'tercero'}
			<div class="grid gap-4 sm:grid-cols-2">
				<label class="campo">
					<span>Contacto</span>
					<select name="contactoId" class="input" bind:value={contactoId}>
						<option value="">— Nuevo contacto —</option>
						{#each catalogo.contactos as c (c.id)}<option value={String(c.id)}>{c.nombre}</option>{/each}
					</select>
				</label>
				{#if !contactoId}
					<label class="campo"><span>Nombre del nuevo contacto</span><input name="contactoNuevo" class="input" /></label>
				{/if}
			</div>
		{/if}
	</fieldset>

	{#if tipo?.campos.length}
		<fieldset class="flex flex-col gap-3">
			<legend class="etiqueta mb-2">Datos de {tipo.nombre.toLowerCase()}</legend>
			<div class="grid gap-4 sm:grid-cols-2">
				{#key tipo.id}<CamposPersonalizados defs={tipo.campos} valores={vehiculo?.campos ?? {}} />{/key}
			</div>
		</fieldset>
	{/if}

	<label class="campo"><span>Notas</span><textarea name="notas" class="input">{vehiculo?.notas ?? ''}</textarea></label>

	<div class="flex gap-3">
		<button class="btn btn-acento flex-1 sm:flex-none">{textoBoton}</button>
		<a href={vehiculo ? `/flota/${vehiculo.id}` : '/flota'} class="btn">Cancelar</a>
	</div>
</form>
