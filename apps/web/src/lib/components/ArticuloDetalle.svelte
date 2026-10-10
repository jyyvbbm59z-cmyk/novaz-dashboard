<script lang="ts">
	// Detalle de un artículo: fotos, cantidad, movimientos de stock y acciones.
	import { enhance } from '$app/forms';
	import ArticuloForm from '$comp/ArticuloForm.svelte';
	import Galeria from '$comp/Galeria.svelte';
	import SubirArchivos from '$comp/SubirArchivos.svelte';
	import { accion, enviar } from '$lib/enviar';
	import { euros, fechaLarga } from '@novaz/core';
	import type { Adjunto } from '@novaz/core/schema';
	import { Minus, Pencil, Plus, Scale, Trash2 } from '@lucide/svelte';
	import type { ArticuloInventario } from '$lib/server/inventario';

	let {
		articulo,
		fotos = [],
		historial = [],
		categorias = [],
		ubicaciones = [],
		vehiculos = [],
		hoy,
		alCerrar
	}: {
		articulo: ArticuloInventario;
		fotos?: Adjunto[];
		historial?: { id: number; fecha: string; cantidad: number; motivo: string; notas: string | null; detalle: string | null }[];
		categorias?: string[];
		ubicaciones?: string[];
		vehiculos?: { id: number; alias: string }[];
		hoy: string;
		alCerrar?: () => void;
	} = $props();

	let editando = $state(false);
	let modo = $state<'compra' | 'uso' | 'ajuste' | null>(null);
	const ESTADO: Record<string, string> = { ok: 'Bien', reparar: 'A reparar', prestada: 'Prestada', perdida: 'No la encuentro', baja: 'De baja' };
	const MOTIVO: Record<string, string> = { alta: 'Alta', compra: 'Compra', uso: 'Uso', ajuste: 'Ajuste' };
	const herramienta = $derived(articulo.tipo === 'herramienta');
	const n = (x: number) => x.toLocaleString('es-ES', { maximumFractionDigits: 3 });
	async function borrar() {
		if (confirm(`¿Borrar «${articulo.nombre}» del inventario?`)) {
			await accion('/inventario?/borrar', { id: articulo.id });
			alCerrar?.();
		}
	}
</script>

{#if editando}
	<ArticuloForm {articulo} {categorias} {ubicaciones} {vehiculos} {hoy} alGuardar={() => (editando = false)} />
{:else}
	<div class="flex flex-col gap-4">
		<div class="flex items-start gap-3">
			<div class="min-w-0 flex-1">
				<p class="text-xs text-texto-3">{[articulo.marca, articulo.referencia].filter(Boolean).join(' · ') || (herramienta ? 'Herramienta' : articulo.tipo === 'recambio' ? 'Recambio' : 'Consumible')}</p>
				<p class="mt-1 flex flex-wrap gap-1.5">
					{#if articulo.ubicacion}<span class="chip">📍 {articulo.ubicacion}</span>{/if}
					{#if articulo.categoria}<span class="chip">{articulo.categoria}</span>{/if}
					{#if herramienta}<span class="chip {articulo.estado === 'ok' ? 'nivel-ok' : articulo.estado === 'perdida' ? 'nivel-vencido' : 'nivel-urgente'}">{ESTADO[articulo.estado]}{articulo.prestadaA ? `: ${articulo.prestadaA}` : ''}</span>{/if}
				</p>
			</div>
			<div class="text-right">
				<p class="cifra text-3xl">{n(articulo.cantidad)}<span class="ml-1 text-base text-texto-3">{articulo.unidad}</span></p>
				{#if articulo.valorCent}<p class="text-xs text-texto-3">{euros(articulo.valorCent)} / {articulo.unidad}</p>{/if}
			</div>
		</div>

		<div>
			{#if fotos.length}<Galeria adjuntos={fotos} accionBorrar="/inventario?/borrarAdjunto" columnas="grid-cols-4" />{/if}
			<div class="mt-2 flex gap-2">
				<SubirArchivos entidad="articulo" entidadId={articulo.id} camara texto="Foto" clase="btn h-9" />
				<SubirArchivos entidad="articulo" entidadId={articulo.id} texto="Factura / manual" acepta="image/*,application/pdf" clase="btn h-9" />
			</div>
		</div>

		<div class="grid grid-cols-3 gap-2">
			<button class="btn {modo === 'compra' ? 'border-acento' : ''}" onclick={() => (modo = modo === 'compra' ? null : 'compra')}><Plus size={16} /> Compra</button>
			<button class="btn {modo === 'uso' ? 'border-acento' : ''}" onclick={() => (modo = modo === 'uso' ? null : 'uso')}><Minus size={16} /> Uso</button>
			<button class="btn {modo === 'ajuste' ? 'border-acento' : ''}" onclick={() => (modo = modo === 'ajuste' ? null : 'ajuste')}><Scale size={16} /> Recontar</button>
		</div>
		{#if modo}
			<form method="POST" action="/inventario?/stock" use:enhance={enviar({ alTerminar: () => (modo = null) })} class="flex flex-col gap-3 rounded-lg border border-borde bg-superficie-2 p-3">
				<input type="hidden" name="articuloId" value={articulo.id} />
				<input type="hidden" name="motivo" value={modo} />
				<div class="grid grid-cols-2 gap-3">
					<label class="campo"><span>{modo === 'ajuste' ? `Tengo exactamente (${articulo.unidad})` : `Cantidad (${articulo.unidad})`}</span><input name="cantidad" class="input" inputmode="decimal" required value={modo === 'ajuste' ? n(articulo.cantidad) : '1'} /></label>
					<label class="campo"><span>Fecha</span><input type="date" name="fecha" class="input" value={hoy} /></label>
				</div>
				{#if modo === 'compra'}
					<div class="grid grid-cols-2 gap-3">
						<label class="campo"><span>Importe total (€)</span><input name="importe" class="input" inputmode="decimal" placeholder="Para apuntar el gasto" /></label>
						<label class="campo"><span>Proveedor</span><input name="proveedor" class="input" value={articulo.proveedor ?? ''} /></label>
					</div>
					<p class="text-xs text-texto-3">Si pones importe, se apunta también el gasto en la contabilidad.</p>
				{/if}
				<label class="campo"><span>Nota</span><input name="notas" class="input" /></label>
				<button class="btn btn-acento">Guardar</button>
			</form>
		{/if}

		{#if articulo.notas}<p class="text-sm whitespace-pre-line text-texto-2">{articulo.notas}</p>{/if}
		<dl class="grid grid-cols-2 gap-2 text-xs">
			{#if articulo.numeroSerie}<div><dt class="etiqueta">Nº de serie</dt><dd class="font-mono">{articulo.numeroSerie}</dd></div>{/if}
			{#if articulo.fechaCompra}<div><dt class="etiqueta">Comprada</dt><dd>{fechaLarga(articulo.fechaCompra)}{articulo.proveedor ? ` · ${articulo.proveedor}` : ''}</dd></div>{/if}
			{#if articulo.stockMinimo != null}<div><dt class="etiqueta">Mínimo</dt><dd>{n(articulo.stockMinimo)} {articulo.unidad}</dd></div>{/if}
			{#if articulo.ultimoRecuento}<div><dt class="etiqueta">Último recuento</dt><dd>{fechaLarga(articulo.ultimoRecuento)}</dd></div>{/if}
		</dl>

		{#if historial.length}
			<details>
				<summary class="etiqueta cursor-pointer py-1">Movimientos ({historial.length})</summary>
				<ul class="mt-2 flex flex-col gap-1 text-xs">
					{#each historial as h (h.id)}
						<li class="flex gap-2">
							<span class="w-20 shrink-0 text-texto-3">{fechaLarga(h.fecha)}</span>
							<span class="flex-1 text-texto-2">{MOTIVO[h.motivo]}{h.detalle ? ` · ${h.detalle}` : ''}{h.notas ? ` · ${h.notas}` : ''}</span>
							<span class="font-mono {h.cantidad > 0 ? 'nivel-ok' : ''}">{h.cantidad > 0 ? '+' : ''}{n(h.cantidad)}</span>
						</li>
					{/each}
				</ul>
			</details>
		{/if}

		<div class="flex gap-2 border-t border-borde pt-3">
			<button class="btn flex-1" onclick={() => (editando = true)}><Pencil size={16} /> Editar</button>
			<button class="btn btn-peligro" onclick={borrar} aria-label="Borrar"><Trash2 size={16} /></button>
		</div>
	</div>
{/if}
