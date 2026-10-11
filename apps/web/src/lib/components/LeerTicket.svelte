<script lang="ts">
	// Botón «Leer ticket con foto»: la IA rellena importe, fecha, comercio, IVA y litros.
	import { avisar } from '$lib/avisos.svelte';
	import { fotoParaLeer } from '$lib/imagenes';
	import type { TicketLeido } from '@novaz/core';
	import { LoaderCircle, ScanText } from '@lucide/svelte';

	let { alLeer }: { alLeer: (t: TicketLeido, foto: File) => void } = $props();
	let leyendo = $state(false);
	let entrada: HTMLInputElement;

	async function leer(e: Event) {
		const f = (e.currentTarget as HTMLInputElement).files?.[0];
		if (!f) return;
		leyendo = true;
		try {
			const foto = await fotoParaLeer(f);
			const fd = new FormData();
			fd.set('imagen', foto);
			const r = await fetch('/api/leer-ticket', { method: 'POST', body: fd });
			if (!r.ok) throw new Error(((await r.json().catch(() => null)) as { message?: string } | null)?.message ?? 'No he podido leer el ticket');
			const t = (await r.json()) as TicketLeido;
			alLeer(t, foto);
			avisar('Ticket leído: revisa los datos antes de guardar');
		} catch (err) {
			avisar((err as Error).message, 'error', 5000);
		} finally {
			leyendo = false;
			entrada.value = '';
		}
	}
</script>

<button type="button" class="btn w-full border-dashed" disabled={leyendo} onclick={() => entrada.click()}>
	{#if leyendo}<LoaderCircle size={17} class="animate-spin" /> Leyendo el ticket…{:else}<ScanText size={17} /> Leer ticket con foto{/if}
</button>
<input bind:this={entrada} type="file" accept="image/*" capture="environment" class="hidden" onchange={leer} />
