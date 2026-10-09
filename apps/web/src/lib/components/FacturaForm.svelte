<script lang="ts">
	import { enhance } from '$app/forms';
	import { enviar } from '$lib/enviar';
	import { euros, eurosInput, importeLinea, parsearEuros, totalesFactura, type LineaFactura } from '@novaz/core';
	import type { Contacto } from '@novaz/core/schema';
	import { Download, ExternalLink, Plus, X } from '@lucide/svelte';

	let {
		lineasIniciales,
		entradas,
		km,
		kmAviso = null,
		contacto = null,
		tipoInicial,
		hoy,
		accion = '?/factura'
	}: {
		lineasIniciales: LineaFactura[];
		entradas: number[];
		km: number | null;
		kmAviso?: string | null;
		contacto?: Contacto | null;
		tipoInicial: 'factura' | 'informe';
		hoy: string;
		accion?: string;
	} = $props();

	interface LineaEd {
		concepto: string;
		detalle: string;
		cantidad: string;
		unidad: string;
		precio: string;
	}
	const ini = (() => ({
		tipo: tipoInicial,
		lineas: lineasIniciales.map((l) => ({
			concepto: l.concepto,
			detalle: l.detalle ?? '',
			cantidad: String(l.cantidad).replace('.', ','),
			unidad: l.unidad ?? '',
			precio: eurosInput(l.precioCent)
		}))
	}))();
	let tipo = $state<'factura' | 'informe'>(ini.tipo);
	let lineas = $state<LineaEd[]>(ini.lineas);
	let ivaPct = $state(21);
	let cobrada = $state(false);
	let hecho = $state<{ id: number; numero: string } | null>(null);

	const reales = $derived<LineaFactura[]>(
		lineas.map((l) => ({
			concepto: l.concepto.trim(),
			detalle: l.detalle.trim() || null,
			cantidad: Number(l.cantidad.replace(',', '.')) || 0,
			unidad: l.unidad.trim() || null,
			precioCent: parsearEuros(l.precio) ?? 0
		}))
	);
	const totales = $derived(totalesFactura(reales, tipo === 'factura' ? ivaPct : 0));
</script>

{#if hecho}
	<div class="flex flex-col items-center gap-4 py-6 text-center">
		<p class="etiqueta">{tipo === 'factura' ? 'Factura' : 'Informe'} generado</p>
		<p class="cifra text-4xl">{hecho.numero}</p>
		<div class="flex flex-wrap justify-center gap-2">
			<a href="/facturas/{hecho.id}/pdf?descargar" class="btn btn-acento h-12" download><Download size={18} /> Descargar PDF</a>
			<a href="/facturas/{hecho.id}/pdf" target="_blank" class="btn h-12"><ExternalLink size={18} /> Ver</a>
		</div>
		<a href="/contabilidad/facturas" class="text-sm text-texto-3 hover:text-texto">Todas las facturas →</a>
	</div>
{:else}
	<form method="POST" action={accion} use:enhance={enviar({ reset: false, alTerminar: (d) => (hecho = { id: Number(d.facturaId), numero: String(d.numero) }) })} class="flex flex-col gap-4">
		<input type="hidden" name="tipo" value={tipo} />
		<input type="hidden" name="entradas" value={entradas.join(',')} />
		<input type="hidden" name="lineas" value={JSON.stringify(reales)} />
		{#if contacto}<input type="hidden" name="contactoId" value={contacto.id} />{/if}

		<div class="grid grid-cols-2 gap-1 rounded-lg border border-borde bg-superficie-2 p-1">
			{#each [['factura', 'Factura'], ['informe', 'Informe de trabajos']] as [v, t] (v)}
				<button type="button" class="rounded-md py-1.5 text-sm font-semibold {tipo === v ? 'bg-superficie-3 text-texto shadow-sm' : 'text-texto-3'}" onclick={() => (tipo = v as typeof tipo)}>{t}</button>
			{/each}
		</div>

		<div class="grid grid-cols-2 gap-3">
			<label class="campo"><span>Fecha</span><input type="date" name="fecha" class="input" value={hoy} /></label>
			<label class="campo"><span>Km</span><input name="km" class="input" inputmode="numeric" value={km ?? ''} /></label>
		</div>
		{#if kmAviso}<p class="-mt-2 text-xs text-texto-3">{kmAviso}</p>{/if}

		<fieldset class="flex flex-col gap-3 rounded-lg border border-borde p-3">
			<legend class="etiqueta px-1">Cliente</legend>
			<label class="campo"><span>Nombre{tipo === 'factura' ? ' *' : ''}</span><input name="clienteNombre" class="input" value={contacto?.nombre ?? ''} required={tipo === 'factura'} /></label>
			<div class="grid grid-cols-2 gap-3">
				<label class="campo"><span>NIF / DNI</span><input name="clienteNif" class="input font-mono uppercase" value={contacto?.nif ?? ''} /></label>
				<label class="campo"><span>Teléfono</span><input name="clienteTelefono" class="input" value={contacto?.telefono ?? ''} /></label>
			</div>
			<label class="campo"><span>Dirección</span><input name="clienteDireccion" class="input" value={contacto?.direccion ?? ''} /></label>
			<input type="hidden" name="clienteEmail" value={contacto?.email ?? ''} />
			{#if contacto}<label class="flex items-center gap-2 text-xs text-texto-2"><input type="checkbox" name="guardarCliente" checked class="accent-[var(--acento)]" /> Guardar estos datos en {contacto.nombre}</label>{/if}
		</fieldset>

		<div class="flex flex-col gap-2">
			<p class="etiqueta">Líneas</p>
			{#each lineas as l, i (i)}
				<div class="rounded-lg border border-borde bg-superficie-2 p-2.5">
					<div class="flex gap-2">
						<input bind:value={l.concepto} class="input h-9 flex-1 text-sm font-medium" placeholder="Concepto" />
						<button type="button" class="btn btn-fantasma btn-icono h-9 w-9" onclick={() => lineas.splice(i, 1)} aria-label="Quitar línea"><X size={15} /></button>
					</div>
					<textarea bind:value={l.detalle} class="input mt-2 min-h-0 py-1.5 text-xs" rows="2" placeholder="Detalle (opcional)"></textarea>
					<div class="mt-2 grid grid-cols-[1fr_4rem_1.3fr_auto] items-center gap-2 text-sm">
						<input bind:value={l.cantidad} class="input h-9 text-right" inputmode="decimal" aria-label="Cantidad" />
						<input bind:value={l.unidad} class="input h-9" placeholder="ud" aria-label="Unidad" />
						<input bind:value={l.precio} class="input h-9 text-right" inputmode="decimal" placeholder="0,00" aria-label="Precio" />
						<span class="w-20 text-right font-mono text-xs">{euros(importeLinea(reales[i]))}</span>
					</div>
				</div>
			{/each}
			<button type="button" class="btn w-fit" onclick={() => lineas.push({ concepto: '', detalle: '', cantidad: '1', unidad: '', precio: '' })}><Plus size={16} /> Línea</button>
		</div>

		<div class="rounded-lg bg-superficie-2 p-3 text-sm">
			{#if tipo === 'factura'}
				<div class="flex items-center justify-between"><span class="text-texto-3">Base</span><span class="font-mono">{euros(totales.base)}</span></div>
				<div class="mt-1 flex items-center justify-between">
					<label class="flex items-center gap-2 text-texto-3">IVA
						<select name="ivaPct" bind:value={ivaPct} class="input h-8 w-auto py-0 text-xs"><option value={21}>21 %</option><option value={10}>10 %</option><option value={0}>Exento</option></select>
					</label>
					<span class="font-mono">{euros(totales.iva)}</span>
				</div>
				<div class="mt-2 flex items-center justify-between border-t border-borde pt-2"><span class="font-semibold">Total</span><span class="cifra text-2xl">{euros(totales.total)}</span></div>
			{:else}
				<p class="text-texto-3">El informe muestra los trabajos y las horas. Si pones precios, también aparecerán.</p>
			{/if}
		</div>

		{#if tipo === 'factura'}
			<label class="flex items-start gap-3 text-sm">
				<input type="checkbox" name="cobrada" bind:checked={cobrada} class="mt-0.5 h-5 w-5 accent-[var(--acento)]" />
				<span>Ya está cobrada: apuntar el ingreso en la contabilidad<span class="block text-xs text-texto-3">Si no, podrás marcarla como cobrada después en Dinero → Facturas.</span></span>
			</label>
			{#if cobrada}
				<select name="pago" class="input"><option value="banco">Cobrada en el banco</option><option value="caja">Cobrada en efectivo</option></select>
			{/if}
		{/if}
		<label class="campo"><span>Notas</span><textarea name="notas" class="input" rows="2" placeholder="Garantía, observaciones…"></textarea></label>
		<button class="btn btn-acento h-12" disabled={!reales.some((l) => l.concepto)}>Generar {tipo === 'factura' ? 'factura' : 'informe'}</button>
	</form>
{/if}
