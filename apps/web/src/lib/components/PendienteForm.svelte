<script lang="ts">
	// Apuntar o editar una avería / trabajo pendiente, con fotos.
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import ColaFotos from '$comp/ColaFotos.svelte';
	import Galeria from '$comp/Galeria.svelte';
	import SubirArchivos from '$comp/SubirArchivos.svelte';
	import { avisar } from '$lib/avisos.svelte';
	import { enviar } from '$lib/enviar';
	import { subirArchivo } from '$lib/imagenes';
	import type { Adjunto, Pendiente } from '@novaz/core/schema';

	let {
		accion = '?/pendiente',
		vehiculoId,
		hoy,
		km = null,
		pendiente = null,
		adjuntos = [],
		compras = [],
		alGuardar
	}: {
		accion?: string;
		vehiculoId: number;
		hoy: string;
		km?: number | null;
		pendiente?: Pendiente | null;
		adjuntos?: Adjunto[];
		/** Lo que ya está apuntado para comprar. */
		compras?: string[];
		alGuardar?: () => void;
	} = $props();

	const PRIORIDAD = [
		['alta', 'Urgente', 'var(--vencido)'],
		['media', 'Pronto', 'var(--urgente)'],
		['baja', 'Sin prisa', 'var(--texto-3)']
	];
	let fotos = $state<File[]>([]);

	const alTerminar = async (datos: Record<string, unknown>) => {
		const id = Number(datos.pendienteId);
		if (fotos.length && id) {
			let n = 0;
			for (const f of fotos) {
				try {
					await subirArchivo(f, { entidad: 'pendiente', entidadId: id, vehiculoId });
					n++;
				} catch (err) {
					avisar(`${f.name}: ${(err as Error).message}`, 'error');
				}
			}
			if (n) await invalidateAll();
		}
		fotos = [];
		alGuardar?.();
	};
</script>

<form method="POST" action={accion} use:enhance={enviar({ alTerminar })} class="flex flex-col gap-4">
	{#if pendiente}<input type="hidden" name="id" value={pendiente.id} />{/if}
	<input type="hidden" name="vehiculoId" value={vehiculoId} />
	<label class="campo"><span>¿Qué hay que reparar? *</span><input name="titulo" class="input h-12" required value={pendiente?.titulo ?? ''} placeholder="Fuga de aceite en el motor de arranque" /></label>
	<fieldset class="grid grid-cols-3 gap-2">
		{#each PRIORIDAD as [v, t, c] (v)}
			<label class="cursor-pointer rounded-lg border border-borde bg-superficie-2 p-2.5 text-center text-sm font-semibold has-[:checked]:border-acento has-[:checked]:bg-acento/10">
				<input type="radio" name="prioridad" value={v} checked={(pendiente?.prioridad ?? 'media') === v} class="sr-only" /><span class="mr-1 inline-block h-2 w-2 rounded-full" style="background:{c}"></span>{t}
			</label>
		{/each}
	</fieldset>
	<div class="grid grid-cols-2 gap-3">
		<label class="campo"><span>Visto el</span><input type="date" name="fechaDetectado" class="input" value={pendiente?.fechaDetectado ?? hoy} /></label>
		<label class="campo"><span>Km</span><input name="km" class="input" inputmode="numeric" value={pendiente?.kmDetectado ?? km ?? ''} /></label>
	</div>
	<label class="campo"><span>Detalles</span><textarea name="detalle" class="input" rows="3" placeholder="Dónde está, qué pieza hace falta, referencias…">{pendiente?.detalle ?? ''}</textarea></label>
	<label class="campo">
		<span>Para comprar <span class="font-normal text-texto-3">· una cosa por línea, va a la lista de la compra</span></span>
		<textarea name="compras" class="input text-sm" rows="2" placeholder={'Retén motor de arranque\nJunta tórica'}>{compras.join('\n')}</textarea>
	</label>
	<div class="campo">
		<span>Fotos</span>
		{#if pendiente}
			{#if adjuntos.length}<Galeria {adjuntos} columnas="grid-cols-5" />{/if}
			<div class="flex flex-wrap gap-2">
				<SubirArchivos entidad="pendiente" entidadId={pendiente.id} {vehiculoId} camara texto="Cámara" />
				<SubirArchivos entidad="pendiente" entidadId={pendiente.id} {vehiculoId} texto="Galería" />
			</div>
		{:else}
			<ColaFotos bind:fotos />
		{/if}
	</div>
	<button class="btn btn-acento h-12">{pendiente ? 'Guardar' : 'Apuntar'}</button>
</form>
