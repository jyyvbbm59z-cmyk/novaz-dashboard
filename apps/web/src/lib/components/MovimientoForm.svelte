<script lang="ts">
	import { enhance } from '$app/forms';
	import { enviar } from '$lib/enviar';
	import { CUENTAS_INMOVILIZADO, desglosarIva, ETIQUETA_PAGO, euros, eurosInput, parsearEuros, TIPOS_IVA } from '@novaz/core';
	import type { Categoria, Cuenta, FormaPago, Inmovilizado, Movimiento } from '@novaz/core/schema';

	let {
		accion = '?/gasto',
		categorias,
		hoy,
		movimiento = null,
		vehiculos = null,
		vehiculoFijo = null,
		cuentas = [],
		inmovilizado = null,
		pagoPorDefecto = 'banco',
		alGuardar
	}: {
		accion?: string;
		categorias: Categoria[];
		hoy: string;
		movimiento?: Movimiento | null;
		vehiculos?: { id: number; alias: string }[] | null;
		vehiculoFijo?: number | null;
		cuentas?: Cuenta[];
		inmovilizado?: Inmovilizado | null;
		pagoPorDefecto?: FormaPago;
		alGuardar?: () => void;
	} = $props();

	// Valores iniciales (el formulario se monta de nuevo cada vez que se abre la hoja)
	const ini = (() => {
		const tipo = movimiento?.tipo ?? 'gasto';
		const cat = movimiento?.categoriaId ?? categorias.find((c) => c.tipo === tipo)?.id ?? null;
		return {
			tipo,
			cat: cat == null ? '' : String(cat),
			iva: movimiento?.ivaPct ?? categorias.find((c) => c.id === cat)?.ivaPct ?? 21,
			pago: movimiento?.pago ?? pagoPorDefecto,
			importe: eurosInput(movimiento?.importeCent),
			inmov: Boolean(inmovilizado)
		};
	})();
	let tipo = $state<'gasto' | 'ingreso'>(ini.tipo);
	let categoriaId = $state(ini.cat);
	let ivaPct = $state(ini.iva);
	let pago = $state<FormaPago>(ini.pago);
	let importe = $state(ini.importe);
	let esInmov = $state(ini.inmov);

	const cats = $derived(categorias.filter((c) => c.tipo === tipo));
	const desglose = $derived.by(() => {
		const c = parsearEuros(importe);
		return c ? desglosarIva(Math.abs(c), ivaPct) : null;
	});

	function cambiarTipo(t: 'gasto' | 'ingreso') {
		tipo = t;
		const primera = categorias.find((c) => c.tipo === t);
		categoriaId = primera ? String(primera.id) : '';
		ivaPct = primera?.ivaPct ?? 21;
	}
	function cambiarCategoria() {
		ivaPct = categorias.find((c) => c.id === Number(categoriaId))?.ivaPct ?? ivaPct;
	}
</script>

<form method="POST" action={accion} use:enhance={enviar({ alTerminar: alGuardar })} class="flex flex-col gap-4">
	{#if movimiento}<input type="hidden" name="id" value={movimiento.id} />{/if}
	{#if vehiculoFijo}<input type="hidden" name="vehiculoId" value={vehiculoFijo} />{/if}
	<input type="hidden" name="tipo" value={tipo} />

	<div class="grid grid-cols-2 gap-1 rounded-lg border border-borde bg-superficie-2 p-1">
		{#each [['gasto', 'Gasto'], ['ingreso', 'Ingreso']] as [v, t] (v)}
			<button type="button" class="rounded-md py-1.5 text-sm font-semibold transition {tipo === v ? 'bg-superficie-3 text-texto shadow-sm' : 'text-texto-3'}" onclick={() => cambiarTipo(v as 'gasto' | 'ingreso')}>{t}</button>
		{/each}
	</div>

	<div class="grid grid-cols-[1.3fr_1fr] gap-3">
		<label class="campo">
			<span>Importe total (€) *</span>
			<input name="importe" class="input cifra h-12 text-2xl" inputmode="decimal" required bind:value={importe} placeholder="0,00" />
		</label>
		<label class="campo"><span>Fecha</span><input type="date" name="fecha" class="input h-12" value={movimiento?.fecha ?? hoy} /></label>
	</div>

	<label class="campo"><span>Concepto *</span><input name="concepto" class="input" required value={movimiento?.concepto ?? ''} placeholder={tipo === 'gasto' ? 'Pastillas de freno delanteras' : 'Reparación embrague Golf'} /></label>

	<div class="grid grid-cols-2 gap-3">
		<label class="campo">
			<span>Categoría</span>
			<select name="categoriaId" class="input" bind:value={categoriaId} onchange={cambiarCategoria}>
				<option value="">— Sin categoría —</option>
				{#each cats as c (c.id)}<option value={String(c.id)}>{c.nombre}</option>{/each}
			</select>
		</label>
		<label class="campo">
			<span>IVA incluido</span>
			<select name="ivaPct" class="input" bind:value={ivaPct}>
				{#each TIPOS_IVA as t (t)}<option value={t}>{t ? `${t} %` : 'Sin IVA'}</option>{/each}
			</select>
		</label>
	</div>
	{#if desglose && ivaPct}
		<p class="-mt-2 text-xs text-texto-3">Base {euros(desglose.base)} + IVA {euros(desglose.cuota)}</p>
	{/if}

	<fieldset class="campo">
		<span>{tipo === 'gasto' ? 'Pagado con' : 'Cobrado en'}</span>
		<div class="grid grid-cols-3 gap-1 rounded-lg border border-borde bg-superficie-2 p-1">
			{#each Object.entries(ETIQUETA_PAGO) as [v, t] (v)}
				<label class="cursor-pointer rounded-md py-1.5 text-center text-xs font-semibold transition {pago === v ? 'bg-superficie-3 text-texto shadow-sm' : 'text-texto-3'}">
					<input type="radio" name="pago" value={v} bind:group={pago} class="sr-only" />{tipo === 'ingreso' && v === 'socio' ? 'Al socio' : t}
				</label>
			{/each}
		</div>
	</fieldset>

	<div class="grid grid-cols-2 gap-3">
		<label class="campo"><span>{tipo === 'gasto' ? 'Proveedor' : 'Cliente'}</span><input name="proveedor" class="input" value={movimiento?.proveedor ?? ''} /></label>
		{#if vehiculos}
			<label class="campo">
				<span>Vehículo</span>
				<select name="vehiculoId" class="input">
					<option value="">— General —</option>
					{#each vehiculos as v (v.id)}<option value={v.id} selected={movimiento?.vehiculoId === v.id}>{v.alias}</option>{/each}
				</select>
			</label>
		{/if}
	</div>

	<details class="rounded-lg border border-borde" open={esInmov || Boolean(movimiento?.cuentaContable)}>
		<summary class="cursor-pointer px-3 py-2.5 text-sm font-medium text-texto-2 select-none">Contabilidad avanzada</summary>
		<div class="flex flex-col gap-3 px-3 pb-3">
			{#if tipo === 'gasto'}
				<label class="flex items-start gap-3 text-sm">
					<input type="checkbox" name="inmovilizado" bind:checked={esInmov} class="mt-0.5 h-5 w-5 accent-[var(--acento)]" />
					<span>Es inmovilizado (se amortiza en varios años)<span class="block text-xs text-texto-3">Herramienta cara, maquinaria, un vehículo de empresa…</span></span>
				</label>
				{#if esInmov}
					<div class="grid grid-cols-[1.4fr_1fr] gap-3">
						<label class="campo">
							<span>Tipo de bien</span>
							<select name="cuentaInmovilizado" class="input">
								{#each CUENTAS_INMOVILIZADO as [c, n] (c)}<option value={c} selected={(inmovilizado?.cuenta ?? '213') === c}>{c} · {n}</option>{/each}
							</select>
						</label>
						<label class="campo"><span>Vida útil (años)</span><input name="vidaUtilAnios" class="input" inputmode="decimal" value={inmovilizado ? inmovilizado.vidaUtilMeses / 12 : 10} /></label>
					</div>
				{/if}
			{/if}
			{#if !esInmov}
				<label class="campo">
					<span>Cuenta contable propia (opcional)</span>
					<input name="cuentaContable" class="input font-mono" list="plan-cuentas" value={movimiento?.cuentaContable ?? ''} placeholder="La de la categoría" />
					<datalist id="plan-cuentas">{#each cuentas as c (c.codigo)}<option value={c.codigo}>{c.nombre}</option>{/each}</datalist>
				</label>
			{/if}
		</div>
	</details>

	<label class="campo"><span>Notas</span><textarea name="notas" class="input" rows="2">{movimiento?.notas ?? ''}</textarea></label>
	<button class="btn btn-acento h-12">{movimiento ? 'Guardar cambios' : 'Registrar'}</button>
</form>
