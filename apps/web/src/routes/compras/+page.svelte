<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import LeerTicket from '$comp/LeerTicket.svelte';
	import { subirArchivo } from '$lib/imagenes';
	import { euros, eurosInput, notasTicket, type TicketLeido } from '@novaz/core';
	import type { ItemCompra } from '@novaz/core/schema';
	import Cabecera from '$comp/Cabecera.svelte';
	import Hoja from '$comp/Hoja.svelte';
	import { avisar } from '$lib/avisos.svelte';
	import { accion, enviar } from '$lib/enviar';
	import { Check, Plus, Share2, ShoppingCart, Trash2, Wrench, Package } from '@lucide/svelte';

	let { data } = $props();
	const revision = $derived(data.automaticos.filter((i) => i.motivo === 'revision'));
	const reponer = $derived(data.automaticos.filter((i) => i.motivo === 'stock'));
	const claveOrigen = (i: { pendienteId: number | null; tareaLocalId: number | null }) => (i.pendienteId ? `p${i.pendienteId}` : i.tareaLocalId ? `t${i.tareaLocalId}` : null);
	const pendientesManual = $derived(data.manual.filter((i) => !i.comprado && !claveOrigen(i)));
	const ligados = $derived(
		data.origenes
			.map((o) => ({ ...o, items: data.manual.filter((i) => !i.comprado && claveOrigen(i) === o.clave) }))
			.filter((o) => o.items.length)
	);
	const compradosManual = $derived(data.manual.filter((i) => i.comprado));
	const total = $derived(revision.length + reponer.length + pendientesManual.length + ligados.reduce((t, o) => t + o.items.length, 0));

	interface Fila {
		texto: string;
		detalle: string;
		precio: number | null;
		href: string | null;
		icono: 'rev' | 'stock' | 'manual';
		compra: Compra;
		borrable?: number;
		editar?: ItemCompra;
	}
	const suma = (xs: { precio: number | null }[]) => xs.reduce((t, x) => t + (x.precio ?? 0), 0);
	const todas = $derived([
		...data.automaticos.map((i) => i.precioEstimadoCent),
		...data.manual.filter((i) => !i.comprado).map((i) => i.precioEstimadoCent)
	]);
	const totalEstimado = $derived(todas.reduce((t: number, p) => t + (p ?? 0), 0));
	const sinPrecio = $derived(todas.filter((p) => !p).length);

	// Editar lo apuntado a mano (nombre, cantidad, precio estimado)
	let hEditar = $state(false);
	let editando = $state<ItemCompra | null>(null);
	function editar(i: ItemCompra) {
		editando = i;
		hEditar = true;
	}

	// Hoja «comprado»
	interface Compra {
		texto: string;
		articuloId: number | null;
		vehiculoId: number | null;
		itemId: number | null;
		unidad: string | null;
		/** Para qué es (avería, tarea del local): el gasto va ahí y no al inventario. */
		destino?: string;
	}
	let hCompra = $state(false);
	let compra = $state<Compra | null>(null);
	let alInventario = $state(true);
	// Lo comprado no va al inventario salvo que lo pidas (herramientas y consumibles que gastas mucho)
	let importeCompra = $state('');
	let tiendaCompra = $state('');
	let fechaCompra = $state('');
	let notasCompra = $state('');
	let fotoTicket = $state<File | null>(null);
	function rellenar(t: TicketLeido, foto: File) {
		if (t.importeCent != null) importeCompra = eurosInput(t.importeCent);
		if (t.proveedor) tiendaCompra = t.proveedor;
		if (t.fecha) fechaCompra = t.fecha;
		notasCompra = notasTicket(t);
		fotoTicket = foto;
	}
	async function comprado(d: Record<string, unknown>) {
		if (fotoTicket && d.movimientoId) {
			await subirArchivo(fotoTicket, { entidad: 'movimiento', entidadId: Number(d.movimientoId), vehiculoId: compra?.vehiculoId ?? null }).catch((e: Error) => avisar(`Foto del ticket: ${e.message}`, 'error'));
			await invalidateAll();
		}
		hCompra = false;
	}
	function abrir(c: Compra) {
		compra = c;
		importeCompra = '';
		tiendaCompra = '';
		fechaCompra = data.hoy;
		notasCompra = '';
		fotoTicket = null;
		alInventario = false;
		hCompra = true;
	}

	async function compartir() {
		const lineas = [
			...revision.map((i) => `• ${i.texto} (${i.detalle})`),
			...reponer.map((i) => `• ${i.texto}`),
			...ligados.flatMap((o) => o.items.map((i) => `• ${i.texto} (${o.titulo})`)),
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

<Cabecera antetitulo="Taller" titulo="Lista de la compra" />

<form method="POST" action="?/anadir" use:enhance={enviar()} class="mb-5 flex gap-2">
	<input name="texto" class="input flex-1" placeholder={data.verDinero ? "Añadir: lija de 400 · 6 €" : "Añadir: lija de 400"} required />
	<input name="cantidad" class="input w-20" inputmode="decimal" placeholder="Cant." />
	<button class="btn btn-acento btn-icono h-11 w-11 shrink-0" aria-label="Añadir"><Plus size={20} /></button>
</form>

{#if !total && !compradosManual.length}
	<div class="vacio flex flex-col items-center gap-2"><ShoppingCart size={28} class="text-texto-3" />Nada que comprar. Aquí aparecerán solas las piezas de las revisiones que se acercan y lo que baje de su mínimo.</div>
{:else}
	<div class="mb-4 flex items-center justify-between gap-2">
		<p class="etiqueta">
			{total} {total === 1 ? 'cosa' : 'cosas'} por comprar{#if totalEstimado}{' · '}≈ <span class="cifra text-sm text-texto">{euros(totalEstimado, { redondo: true })}</span>{/if}{#if sinPrecio && totalEstimado}{' '}<span class="normal-case tracking-normal">({sinPrecio} sin precio)</span>{/if}
		</p>
		{#if total}<button class="btn h-8 text-xs" onclick={compartir}><Share2 size={14} /> Enviar la lista</button>{/if}
	</div>

	{#snippet fila(f: Fila)}
		<li class="flex items-center gap-3 px-3 py-2.5">
			<span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-superficie-3 text-texto-3">
				{#if f.icono === 'rev'}<Wrench size={16} />{:else if f.icono === 'stock'}<Package size={16} />{:else}<ShoppingCart size={16} />{/if}
			</span>
			<!-- Tocar: ir al origen (mejora, avería, tarea, revisión…) o, si lo apuntaste aquí, editarlo -->
			{#if f.href}
				<a href={f.href} class="min-w-0 flex-1 hover:text-acento">
					<span class="block truncate text-sm font-medium">{f.texto}</span>
					{#if f.detalle}<span class="block truncate text-xs text-texto-3">{f.detalle}</span>{/if}
				</a>
			{:else}
				<button class="min-w-0 flex-1 text-left hover:text-acento" onclick={() => f.editar && editar(f.editar)}>
					<span class="block truncate text-sm font-medium">{f.texto}</span>
					<span class="block truncate text-xs text-texto-3">{f.detalle || (data.verDinero ? 'Toca para editar o poner precio' : 'Toca para editar')}</span>
				</button>
			{/if}
			{#if f.precio}<span class="cifra shrink-0 text-sm text-texto-2">≈ {euros(f.precio, { redondo: true })}</span>{/if}
			{#if f.borrable}<button class="btn btn-fantasma btn-icono h-9 w-9" onclick={() => accion('?/borrar', { id: f.borrable! })} aria-label="Quitar"><Trash2 size={15} /></button>{/if}
			<button class="btn h-9 px-3 text-xs" onclick={() => abrir(f.compra)} aria-label="Comprado: {f.texto}"><Check size={15} /> <span class="hidden sm:inline">Comprado</span></button>
		</li>
	{/snippet}
	{#snippet cabecera(titulo: string, items: { precio: number | null }[], href?: string, detalle?: string, presupuesto?: number | null)}
		<div class="mb-2 flex items-baseline justify-between gap-3">
			{#if href}<a {href} class="flex min-w-0 items-baseline gap-2 hover:text-texto"><span class="etiqueta truncate">{titulo}</span><span class="shrink-0 text-xs text-texto-3">{detalle} →</span></a>{:else}<p class="etiqueta">{titulo}</p>{/if}
			<span class="shrink-0 text-xs text-texto-3">
				{#if suma(items)}≈ <span class="cifra text-sm text-texto-2">{euros(suma(items), { redondo: true })}</span>{/if}{#if presupuesto}{' · '}presupuesto {euros(presupuesto, { redondo: true })}{/if}
			</span>
		</div>
	{/snippet}

	<div class="flex flex-col gap-5">
		{#if revision.length}
			<section>
				{@render cabecera('Para las próximas revisiones', revision.map((i) => ({ precio: i.precioEstimadoCent })))}
				<ul class="tarjeta lista-filas">
					{#each revision as i (i.clave)}{@render fila({ texto: i.texto, detalle: i.detalle, precio: i.precioEstimadoCent, href: i.href, icono: 'rev', compra: { texto: i.texto, articuloId: i.articuloId, vehiculoId: i.vehiculoId, itemId: null, unidad: i.unidad } })}{/each}
				</ul>
			</section>
		{/if}
		{#if reponer.length}
			<section>
				{@render cabecera('Por reponer', reponer.map((i) => ({ precio: i.precioEstimadoCent })))}
				<ul class="tarjeta lista-filas">
					{#each reponer as i (i.clave)}{@render fila({ texto: i.texto, detalle: i.detalle, precio: i.precioEstimadoCent, href: i.href, icono: 'stock', compra: { texto: i.texto, articuloId: i.articuloId, vehiculoId: null, itemId: null, unidad: i.unidad } })}{/each}
				</ul>
			</section>
		{/if}
		{#each ligados as o (o.clave)}
			<section>
				{@render cabecera(`Para: ${o.titulo}`, o.items.map((i) => ({ precio: i.precioEstimadoCent })), o.href, o.detalle, o.presupuesto)}
				<ul class="tarjeta lista-filas">
					{#each o.items as i (i.id)}{@render fila({ texto: i.texto, detalle: i.cantidad ? `${i.cantidad.toLocaleString('es-ES')} ${i.unidad ?? ''}` : '', precio: i.precioEstimadoCent, href: o.href, icono: 'manual', borrable: i.id, compra: { texto: i.texto, articuloId: i.articuloId, vehiculoId: i.vehiculoId, itemId: i.id, unidad: i.unidad, destino: o.detalle === 'El local' ? `la tarea «${o.titulo}»` : `${o.detalle.split(' · ')[0]} (${o.titulo})` } })}{/each}
				</ul>
			</section>
		{/each}
		{#if pendientesManual.length}
			<section>
				{@render cabecera('Apuntado a mano', pendientesManual.map((i) => ({ precio: i.precioEstimadoCent })))}
				<ul class="tarjeta lista-filas">
					{#each pendientesManual as i (i.id)}{@render fila({ texto: i.texto, detalle: i.cantidad ? `${i.cantidad.toLocaleString('es-ES')} ${i.unidad ?? ''}` : '', precio: i.precioEstimadoCent, href: null, editar: i, icono: 'manual', borrable: i.id, compra: { texto: i.texto, articuloId: i.articuloId, vehiculoId: i.vehiculoId, itemId: i.id, unidad: i.unidad } })}{/each}
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
		<form method="POST" action="?/comprado" use:enhance={enviar({ alTerminar: comprado })} class="flex flex-col gap-4">
			<LeerTicket alLeer={rellenar} />
			<input type="hidden" name="notas" value={notasCompra} />
			{#if notasCompra}<pre class="max-h-40 overflow-y-auto rounded-lg bg-superficie-2 p-2.5 font-sans text-xs whitespace-pre-wrap text-texto-2">{notasCompra}</pre>{/if}
			<input type="hidden" name="texto" value={compra.texto} />
			{#if compra.articuloId}<input type="hidden" name="articuloId" value={compra.articuloId} />{/if}
			{#if compra.vehiculoId}<input type="hidden" name="vehiculoId" value={compra.vehiculoId} />{/if}
			{#if compra.itemId}<input type="hidden" name="itemId" value={compra.itemId} />{/if}
			<div class="grid grid-cols-2 gap-3">
				<label class="campo"><span>Cantidad</span><input name="cantidad" class="input" inputmode="decimal" value="1" /></label>
				<label class="campo"><span>Unidad</span><select name="unidad" class="input">{#each ['ud', 'L', 'ml', 'kg', 'g', 'm', 'juego'] as u (u)}<option selected={(compra.unidad ?? 'ud') === u}>{u}</option>{/each}</select></label>
				{#if data.verDinero}<label class="campo"><span>Importe total (€)</span><input name="importe" class="input" inputmode="decimal" bind:value={importeCompra} placeholder="Opcional" /></label>{/if}
				<label class="campo"><span>Tienda</span><input name="proveedor" class="input" bind:value={tiendaCompra} /></label>
				<label class="campo"><span>Fecha</span><input type="date" name="fecha" class="input" bind:value={fechaCompra} /></label>
			</div>
			{#if !compra.articuloId}
				<label class="flex items-start gap-3 text-sm">
					<input type="checkbox" name="alInventario" bind:checked={alInventario} class="mt-0.5 h-5 w-5 accent-[var(--acento)]" />
					<span>Añadir al inventario<span class="block text-xs text-texto-3">Solo para herramientas o consumibles que gastas a menudo.</span></span>
				</label>
				{#if alInventario}
					<select name="tipoArticulo" class="input"><option value="recambio">Es un recambio</option><option value="consumible">Es un consumible</option></select>
				{:else if compra.destino && data.verDinero}
					<p class="text-xs text-texto-2">El gasto se apunta a {compra.destino}.</p>
				{/if}
			{:else}
				<p class="text-xs text-texto-3">Se sumará a lo que ya tienes en el inventario.</p>
			{/if}
			{#if data.verDinero}<p class="text-xs text-texto-3">Con importe, el gasto se apunta solo en la contabilidad.</p>{/if}
			<button class="btn btn-acento h-12">Guardar</button>
		</form>
	{/if}
</Hoja>

<Hoja bind:abierta={hEditar} titulo="Editar">
	{#if editando}
		{#key editando.id}
			<form method="POST" action="?/editar" use:enhance={enviar({ alTerminar: () => (hEditar = false) })} class="flex flex-col gap-4">
				<input type="hidden" name="id" value={editando.id} />
				<label class="campo"><span>Qué</span><input name="texto" class="input" required value={editando.texto} /></label>
				<div class="grid {data.verDinero ? 'grid-cols-3' : 'grid-cols-2'} gap-3">
					<label class="campo"><span>Cantidad</span><input name="cantidad" class="input" inputmode="decimal" value={editando.cantidad ?? ''} /></label>
					<label class="campo"><span>Unidad</span><input name="unidad" class="input" value={editando.unidad ?? ''} placeholder="ud" /></label>
					{#if data.verDinero}<label class="campo"><span>Precio (€)</span><input name="precioEstimado" class="input" inputmode="decimal" value={eurosInput(editando.precioEstimadoCent)} placeholder="≈" /></label>{/if}
				</div>
				<button class="btn btn-acento h-11">Guardar</button>
			</form>
		{/key}
	{/if}
</Hoja>
