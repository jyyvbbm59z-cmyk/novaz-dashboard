<script lang="ts">
	// Botón «Leer ticket con foto»: la IA rellena importe, fecha, comercio, IVA y litros.
	import { avisar } from '$lib/avisos.svelte';
	import { fotoParaLeer } from '$lib/imagenes';
	import { eurosInput, type TicketLeido } from '@novaz/core';
	import { registrar, ticketLeido } from '$lib/uso';
	import { Camera, Images, LoaderCircle, ScanText } from '@lucide/svelte';

	let { alLeer }: { alLeer: (t: TicketLeido, foto: File) => void } = $props();
	let leyendo = $state(false);
	let camara: HTMLInputElement;
	let galeria: HTMLInputElement;

	async function leer(e: Event) {
		const f = (e.currentTarget as HTMLInputElement).files?.[0];
		if (!f) return;
		leyendo = true;
		const desde = performance.now();
		try {
			const foto = await fotoParaLeer(f);
			const fd = new FormData();
			fd.set('imagen', foto);
			const r = await fetch('/api/leer-ticket', { method: 'POST', body: fd });
			if (!r.ok) throw new Error(((await r.json().catch(() => null)) as { message?: string } | null)?.message ?? 'No he podido leer el ticket');
			const t = (await r.json()) as TicketLeido;
			registrar({ evento: 'ticket_ok', duracionMs: Math.round(performance.now() - desde), datos: { lineas: t.lineas?.length ?? 0, combustible: t.combustible } });
			ticketLeido({ importe: t.importeCent != null ? eurosInput(t.importeCent) : null, fecha: t.fecha, proveedor: t.proveedor });
			alLeer(t, foto);
			avisar('Ticket leído: revisa los datos antes de guardar');
		} catch (err) {
			registrar({ evento: 'ticket_error', duracionMs: Math.round(performance.now() - desde), datos: { mensaje: (err as Error).message.slice(0, 160) } });
			avisar((err as Error).message, 'error', 5000);
		} finally {
			leyendo = false;
			camara.value = '';
			galeria.value = '';
		}
	}
</script>

<!-- Leer un ticket: haciendo la foto ahora o con una que ya tengas en la galería -->
<div class="rounded-lg border border-dashed border-borde p-2">
	{#if leyendo}
		<p class="flex h-9 items-center justify-center gap-2 text-sm text-texto-2"><LoaderCircle size={17} class="animate-spin" /> Leyendo el ticket…</p>
	{:else}
		<p class="mb-1.5 flex items-center gap-1.5 px-1 text-xs text-texto-3"><ScanText size={14} /> Leer un ticket: la IA rellena los datos</p>
		<div class="grid grid-cols-2 gap-2">
			<button type="button" class="btn h-9 text-sm" onclick={() => camara.click()}><Camera size={16} /> Hacer foto</button>
			<button type="button" class="btn h-9 text-sm" onclick={() => galeria.click()}><Images size={16} /> De la galería</button>
		</div>
	{/if}
</div>
<input bind:this={camara} type="file" accept="image/*" capture="environment" class="hidden" onchange={leer} aria-label="Hacer foto del ticket" />
<input bind:this={galeria} type="file" accept="image/*" class="hidden" onchange={leer} aria-label="Elegir foto del ticket de la galería" />
