<script lang="ts">
	import { enhance } from '$app/forms';
	import Hoja from '$comp/Hoja.svelte';
	import { avisar } from '$lib/avisos.svelte';
	import { accion, enviar } from '$lib/enviar';
	import { Check, Plus, Share2, ShoppingCart, Trash2, Wrench, Package } from '@lucide/svelte';

	let { data } = $props();
	const revision = $derived(data.automaticos.filter((i) => i.motivo === 'revision'));
	const reponer = $derived(data.automaticos.filter((i) => i.motivo === 'stock'));
	const pendientesManual = $derived(data.manual.filter((i) => !i.comprado));
	const compradosManual = $derived(data.manual.filter((i) => i.comprado));
	const total = $derived(revision.length + reponer.length + pendientesManual.length);

	// Hoja «comprado»
	interface Compra {
		texto: string;
		articuloId: number | null;
		vehiculoId: number | null;
		itemId: number | null;
		unidad: string | null;
	}
	let hCompra = $state(false);
	let compra = $state<Compra | null>(null);
	function abrir(c: Compra) {
		compra = c;
		hCompra = true;
	}

	async function compartir() {
		const lineas = [
			...revision.map((i) => `• ${i.texto} (${i.detalle})`),
			...reponer.map((i) => `• ${i.texto}`),
			...pendientesManual.map((i) => `• ${i.texto}${i.cantidad ? ` × ${i.cantidad} ${i.unidad ?? ''}` : ''}`)
		];
		const texto = `Lista de la compra · ${data.ajustes.nombreTaller}\n${lineas.join('\n')}`;
		try {
			if (navigator.share) await navigator.share({ text: texto });
			else {
				await navigator.clipboard.writeText(texto);
				avisar('Lista copiada');
			}
		} catch {}
	}
</script>

<svelte:head><title>Lista de la compra · {data.ajustes.nombreTaller}</title></svelte:head>

<form method="POST" action="?/anadir" use:enhance={enviar()} class="mb-5 flex gap-2">
	<input name="texto" class="input flex-1" placeholder="Añadir: lija de 400, pintura…" required />
	<input name="cantidad" class="input w-20" inputmode="decimal" placeholder="Cant." />
	<button class="btn btn-acento btn-icono h-11 w-11 shrink-0" aria-label="Añadir"><Plus size={20} /></button>
</form>

{#if !total && !compradosManual.length}
	<div class="vacio flex flex-col items-center gap-2"><ShoppingCart size={28} class="text-texto-3" />Nada que comprar. Aquí aparecerán solas las piezas de las revisiones que se acercan y lo que baje de su mínimo.</div>
{:else}
	<div class="mb-4 flex items-center justify-between gap-2">
		<p class="etiqueta">{total} {total === 1 ? 'cosa' : 'cosas'} por comprar</p>
		{#if total}<button class="btn h-8 text-xs" onclick={compartir}><Share2 size={14} /> Enviar la lista</button>{/if}
	</div>

	{#snippet fila(texto: string, detalle: string, c: Compra, icono: 'rev' | 'stock' | 'manual', borrable?: number)}
		<li class="flex items-center gap-3 px-3 py-2.5">
			<span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-superficie-3 text-texto-3">
				{#if icono === 'rev'}<Wrench size={16} />{:else if icono === 'stock'}<Package size={16} />{:else}<ShoppingCart size={16} />{/if}
			</span>
			<span class="min-w-0 flex-1">
				<span class="block truncate text-sm font-medium">{texto}</span>
				{#if detalle}<span class="block truncate text-xs text-texto-3">{detalle}</span>{/if}
			</span>
			{#if borrable}<button class="btn btn-fantasma btn-icono h-9 w-9" onclick={() => accion('?/borrar', { id: borrable })} aria-label="Quitar"><Trash2 size={15} /></button>{/if}
			<button class="btn h-9 px-3 text-xs" onclick={() => abrir(c)}><Check size={15} /> Comprado</button>
		</li>
	{/snippet}

	<div class="flex flex-col gap-5">
		{#if revision.length}
			<section>
				<p class="etiqueta mb-2">Para las próximas revisiones</p>
				<ul class="tarjeta lista-filas">
					{#each revision as i (i.clave)}{@render fila(i.texto, i.detalle, { texto: i.texto, articuloId: i.articuloId, vehiculoId: i.vehiculoId, itemId: null, unidad: i.unidad }, 'rev')}{/each}
				</ul>
			</section>
		{/if}
		{#if reponer.length}
			<section>
				<p class="etiqueta mb-2">Por reponer</p>
				<ul class="tarjeta lista-filas">
					{#each reponer as i (i.clave)}{@render fila(i.texto, i.detalle, { texto: i.texto, articuloId: i.articuloId, vehiculoId: null, itemId: null, unidad: i.unidad }, 'stock')}{/each}
				</ul>
			</section>
		{/if}
		{#if pendientesManual.length}
			<section>
				<p class="etiqueta mb-2">Apuntado a mano</p>
				<ul class="tarjeta lista-filas">
					{#each pendientesManual as i (i.id)}{@render fila(i.texto, i.cantidad ? `${i.cantidad.toLocaleString('es-ES')} ${i.unidad ?? ''}` : '', { texto: i.texto, articuloId: i.articuloId, vehiculoId: i.vehiculoId, itemId: i.id, unidad: i.unidad }, 'manual', i.id)}{/each}
				</ul>
			</section>
		{/if}
		{#if compradosManual.length}
			<section>
				<div class="mb-2 flex items-center justify-between">
					<p class="etiqueta">Comprado</p>
					<button class="text-xs text-texto-3 hover:text-texto" onclick={() => accion('?/limpiar', {})}>Limpiar</button>
				</div>
				<ul class="flex flex-col gap-1 text-sm text-texto-3">{#each compradosManual as i (i.id)}<li class="line-through">✓ {i.texto}</li>{/each}</ul>
			</section>
		{/if}
	</div>
{/if}

<Hoja bind:abierta={hCompra} titulo={compra ? `Comprado: ${compra.texto}` : 'Comprado'}>
	{#if compra}
		<form method="POST" action="?/comprado" use:enhance={enviar({ alTerminar: () => (hCompra = false) })} class="flex flex-col gap-4">
			<input type="hidden" name="texto" value={compra.texto} />
			{#if compra.articuloId}<input type="hidden" name="articuloId" value={compra.articuloId} />{/if}
			{#if compra.vehiculoId}<input type="hidden" name="vehiculoId" value={compra.vehiculoId} />{/if}
			{#if compra.itemId}<input type="hidden" name="itemId" value={compra.itemId} />{/if}
			<div class="grid grid-cols-2 gap-3">
				<label class="campo"><span>Cantidad</span><input name="cantidad" class="input" inputmode="decimal" value="1" /></label>
				<label class="campo"><span>Unidad</span><select name="unidad" class="input">{#each ['ud', 'L', 'ml', 'kg', 'g', 'm', 'juego'] as u (u)}<option selected={(compra.unidad ?? 'ud') === u}>{u}</option>{/each}</select></label>
				<label class="campo"><span>Importe total (€)</span><input name="importe" class="input" inputmode="decimal" placeholder="Opcional" /></label>
				<label class="campo"><span>Tienda</span><input name="proveedor" class="input" /></label>
			</div>
			{#if !compra.articuloId}
				<label class="flex items-start gap-3 text-sm">
					<input type="checkbox" name="alInventario" checked class="mt-0.5 h-5 w-5 accent-[var(--acento)]" />
					<span>Añadir al inventario<span class="block text-xs text-texto-3">Así sabrás que lo tienes y no volverá a salir en la lista.</span></span>
				</label>
				<select name="tipoArticulo" class="input"><option value="recambio">Es un recambio</option><option value="consumible">Es un consumible</option></select>
			{:else}
				<p class="text-xs text-texto-3">Se sumará a lo que ya tienes en el inventario.</p>
			{/if}
			<p class="text-xs text-texto-3">Con importe, el gasto se apunta solo en la contabilidad.</p>
			<button class="btn btn-acento h-12">Guardar</button>
		</form>
	{/if}
</Hoja>
