<script lang="ts">
	import { enhance } from '$app/forms';
	import { enviar } from '$lib/enviar';
	import { eurosInput, sumarMeses } from '@novaz/core';
	import type { TipoVencimiento, Vencimiento } from '@novaz/core/schema';

	let {
		accion = '?/vencimiento',
		tipos,
		hoy,
		vencimiento = null,
		tipoInicial = null,
		renovar = false,
		alGuardar
	}: {
		accion?: string;
		tipos: TipoVencimiento[];
		hoy: string;
		vencimiento?: Vencimiento | null;
		tipoInicial?: number | null;
		renovar?: boolean;
		alGuardar?: () => void;
	} = $props();

	// Al renovar, se parte del vencimiento anterior: empieza cuando acaba el actual.
	const editando = $derived(!!vencimiento && !renovar);
	const ini = (() => ({
		tipoId: String(vencimiento?.tipoId ?? tipoInicial ?? tipos[0]?.id),
		inicio: renovar && vencimiento ? (vencimiento.fechaVence < hoy ? hoy : vencimiento.fechaVence) : (vencimiento?.fechaInicio ?? hoy),
		vence: vencimiento && !renovar ? vencimiento.fechaVence : ''
	}))();
	let tipoId = $state(ini.tipoId);
	let inicio = $state(ini.inicio);
	const tipo = $derived(tipos.find((t) => t.id === Number(tipoId)));
	let vence = $state(ini.vence);
	const sugerida = $derived(tipo?.mesesValidez && inicio ? sumarMeses(inicio, tipo.mesesValidez) : '');
</script>

<form method="POST" action={accion} use:enhance={enviar({ alTerminar: alGuardar })} class="flex flex-col gap-4">
	{#if editando}<input type="hidden" name="id" value={vencimiento!.id} />{/if}
	<label class="campo">
		<span>Tipo</span>
		<select name="tipoId" class="input" bind:value={tipoId} disabled={!!vencimiento}>
			{#each tipos as t (t.id)}<option value={String(t.id)}>{t.nombre}</option>{/each}
		</select>
		{#if vencimiento}<input type="hidden" name="tipoId" value={tipoId} />{/if}
	</label>
	<div class="grid grid-cols-2 gap-3">
		<label class="campo"><span>Desde</span><input type="date" name="fechaInicio" class="input" bind:value={inicio} /></label>
		<label class="campo">
			<span>Vence *</span>
			<input type="date" name="fechaVence" class="input" bind:value={vence} placeholder={sugerida} />
			{#if !vence && sugerida}<button type="button" class="text-left text-xs text-acento" onclick={() => (vence = sugerida)}>Usar {sugerida.split('-').reverse().join('/')} ({tipo?.mesesValidez} meses)</button>{/if}
		</label>
	</div>
	<div class="grid grid-cols-2 gap-3">
		<label class="campo"><span>Proveedor / estación</span><input name="proveedor" class="input" value={renovar || editando ? (vencimiento?.proveedor ?? '') : ''} /></label>
		<label class="campo"><span>Nº póliza / referencia</span><input name="referencia" class="input font-mono" value={editando ? (vencimiento?.referencia ?? '') : renovar ? (vencimiento?.referencia ?? '') : ''} /></label>
	</div>
	<label class="campo"><span>Importe (€)</span><input name="importe" class="input" inputmode="decimal" value={editando ? eurosInput(vencimiento?.importeCent) : ''} placeholder="0,00" /></label>
	{#if !editando}
		<label class="flex items-center gap-3 text-sm text-texto-2">
			<input type="checkbox" name="registrarGasto" checked class="h-5 w-5 accent-[var(--acento)]" /> Registrar el importe como gasto
		</label>
	{/if}
	<label class="campo"><span>Notas</span><textarea name="notas" class="input" rows="2">{editando ? (vencimiento?.notas ?? '') : ''}</textarea></label>
	<button class="btn btn-acento h-12">{editando ? 'Guardar cambios' : renovar ? 'Renovar' : 'Guardar'}</button>
</form>
