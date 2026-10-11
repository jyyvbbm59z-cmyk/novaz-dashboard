<script lang="ts">
	// Repostaje: litros, euros y km. El gasto, la lectura de km y el consumo real salen solos.
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import LeerTicket from '$comp/LeerTicket.svelte';
	import { avisar } from '$lib/avisos.svelte';
	import { enviar } from '$lib/enviar';
	import { subirArchivo } from '$lib/imagenes';
	import { eurosInput, notasTicket, parsearEuros, type TicketLeido } from '@novaz/core';

	let {
		accion = '?/repostaje',
		vehiculoId,
		hoy,
		km = null,
		gasolineras = [],
		precioHoy = null,
		alGuardar
	}: {
		accion?: string;
		vehiculoId: number;
		hoy: string;
		km?: number | null;
		gasolineras?: string[];
		/** Precio medio de hoy en tu municipio, como referencia. */
		precioHoy?: number | null;
		alGuardar?: () => void;
	} = $props();

	let litros = $state('');
	let importe = $state('');
	let fecha = $state((() => hoy)());
	let gasolinera = $state('');
	let notas = $state('');
	let fotoTicket = $state<File | null>(null);

	// Ticket de la gasolinera leído con la IA
	function rellenar(t: TicketLeido, foto: File) {
		if (t.litros != null) litros = String(t.litros).replace('.', ',');
		if (t.importeCent != null) importe = eurosInput(t.importeCent);
		else if (t.litros && t.precioLitro) importe = (t.litros * t.precioLitro).toFixed(2).replace('.', ',');
		if (t.fecha) fecha = t.fecha;
		if (t.proveedor) gasolinera = t.proveedor;
		notas = notasTicket(t);
		fotoTicket = foto;
	}
	async function guardado(d: Record<string, unknown>) {
		if (fotoTicket && d.movimientoId) {
			await subirArchivo(fotoTicket, { entidad: 'movimiento', entidadId: Number(d.movimientoId), vehiculoId }).catch((e: Error) => avisar(`Foto del ticket: ${e.message}`, 'error'));
			await invalidateAll();
		}
		litros = '';
		importe = '';
		gasolinera = '';
		notas = '';
		fotoTicket = null;
		alGuardar?.();
	}
	const nLitros = $derived(Number(litros.replace(',', '.')) || 0);
	const nImporte = $derived((parsearEuros(importe) ?? 0) / 100);
	const precio = $derived(nLitros && nImporte ? nImporte / nLitros : null);
	const fmt = (n: number, d = 3) => n.toLocaleString('es-ES', { minimumFractionDigits: d, maximumFractionDigits: d });
</script>

<form method="POST" action={accion} use:enhance={enviar({ alTerminar: guardado })} class="flex flex-col gap-4">
	<input type="hidden" name="vehiculoId" value={vehiculoId} />
	<input type="hidden" name="notas" value={notas} />
	<LeerTicket alLeer={rellenar} />
	{#if notas}<pre class="max-h-32 overflow-y-auto rounded-lg bg-superficie-2 p-2.5 font-sans text-xs whitespace-pre-wrap text-texto-2">{notas}</pre>{/if}
	<div class="grid grid-cols-2 gap-3">
		<label class="campo"><span>Litros *</span><input name="litros" bind:value={litros} class="input cifra h-12 text-2xl" inputmode="decimal" required placeholder="0,00" /></label>
		<label class="campo"><span>Importe (€) *</span><input name="importe" bind:value={importe} class="input cifra h-12 text-2xl" inputmode="decimal" required placeholder="0,00" /></label>
	</div>
	<p class="-mt-2 text-xs text-texto-3">
		{#if precio}A <strong class="text-texto-2">{fmt(precio)} €/L</strong>{#if precioHoy}{' · '}la media de hoy en tu zona es {fmt(precioHoy)} €/L{/if}{:else if precioHoy}Media de hoy en tu zona: {fmt(precioHoy)} €/L{/if}
	</p>
	<div class="grid grid-cols-2 gap-3">
		<label class="campo"><span>Km del marcador</span><input name="km" class="input" inputmode="numeric" value={km ?? ''} placeholder={km ? String(km) : 'Opcional'} /></label>
		<label class="campo"><span>Fecha</span><input type="date" name="fecha" class="input" bind:value={fecha} /></label>
	</div>
	<label class="campo">
		<span>Gasolinera</span>
		<input name="gasolinera" class="input" list="gasolineras-{vehiculoId}" bind:value={gasolinera} placeholder="Opcional" />
		<datalist id="gasolineras-{vehiculoId}">{#each gasolineras as g (g)}<option value={g}></option>{/each}</datalist>
	</label>
	<label class="flex items-start gap-3 text-sm">
		<input type="checkbox" name="lleno" checked class="mt-0.5 h-5 w-5 accent-[var(--acento)]" />
		<span>He llenado el depósito<span class="block text-xs text-texto-3">Con dos llenados seguidos la app calcula tu consumo real.</span></span>
	</label>
	<button class="btn btn-acento h-12">Guardar repostaje</button>
</form>
