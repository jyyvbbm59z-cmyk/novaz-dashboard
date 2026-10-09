<script lang="ts">
	// Editor de asientos manuales: líneas debe/haber con cuadre en vivo.
	import { enhance } from '$app/forms';
	import { enviar } from '$lib/enviar';
	import { euros, eurosInput, parsearEuros } from '@novaz/core';
	import { Plus, X } from '@lucide/svelte';

	interface Linea {
		cuenta: string;
		debe: string;
		haber: string;
	}

	let {
		hoy,
		cuentas,
		inicial,
		alGuardar
	}: {
		hoy: string;
		cuentas: { codigo: string; nombre: string }[];
		inicial?: { id?: number; fecha?: string; concepto?: string; apuntes?: { cuenta: string; debe: number; haber: number }[] };
		alGuardar?: () => void;
	} = $props();

	const ini = (() => ({
		lineas: (inicial?.apuntes?.length ? inicial.apuntes : [{ cuenta: '', debe: 0, haber: 0 }, { cuenta: '', debe: 0, haber: 0 }]).map((a) => ({
			cuenta: a.cuenta,
			debe: a.debe ? eurosInput(a.debe) : '',
			haber: a.haber ? eurosInput(a.haber) : ''
		}))
	}))();
	let lineas = $state<Linea[]>(ini.lineas);

	const nombres = $derived(new Map(cuentas.map((c) => [c.codigo, c.nombre])));
	const nombre = (c: string) => {
		for (let n = c.length; n > 0; n--) if (nombres.has(c.slice(0, n))) return nombres.get(c.slice(0, n));
		return c ? 'Cuenta nueva' : '';
	};
	const totales = $derived(
		lineas.reduce((t, l) => ({ debe: t.debe + (parsearEuros(l.debe) ?? 0), haber: t.haber + (parsearEuros(l.haber) ?? 0) }), { debe: 0, haber: 0 })
	);
	const diferencia = $derived(totales.debe - totales.haber);
	const valido = $derived(diferencia === 0 && totales.debe > 0 && lineas.every((l) => !(l.debe || l.haber) || /^\d{3,10}$/.test(l.cuenta)));
	const json = $derived(
		JSON.stringify(lineas.filter((l) => l.cuenta && (l.debe || l.haber)).map((l) => ({ cuenta: l.cuenta, debe: parsearEuros(l.debe) ?? 0, haber: parsearEuros(l.haber) ?? 0 })))
	);

	/** Completa la última línea vacía con lo que falta para cuadrar. */
	function cuadrar() {
		const l = lineas.find((x) => x.cuenta && !x.debe && !x.haber) ?? lineas[lineas.length - 1];
		if (diferencia > 0) l.haber = eurosInput(diferencia);
		else if (diferencia < 0) l.debe = eurosInput(-diferencia);
	}
</script>

<form method="POST" action="/contabilidad/diario?/guardar" use:enhance={enviar({ alTerminar: alGuardar })} class="flex flex-col gap-4">
	{#if inicial?.id}<input type="hidden" name="id" value={inicial.id} />{/if}
	<input type="hidden" name="apuntes" value={json} />
	<div class="grid grid-cols-[1fr_2fr] gap-3">
		<label class="campo"><span>Fecha</span><input type="date" name="fecha" class="input" required value={inicial?.fecha ?? hoy} /></label>
		<label class="campo"><span>Concepto</span><input name="concepto" class="input" required value={inicial?.concepto ?? ''} /></label>
	</div>

	<div class="overflow-hidden rounded-lg border border-borde">
		<div class="grid grid-cols-[1fr_6.5rem_6.5rem_2rem] gap-2 border-b border-borde bg-superficie-2 px-3 py-2 text-[0.65rem] font-semibold tracking-widest text-texto-3 uppercase">
			<span>Cuenta</span><span class="text-right">Debe</span><span class="text-right">Haber</span><span></span>
		</div>
		{#each lineas as l, i (i)}
			<div class="grid grid-cols-[1fr_6.5rem_6.5rem_2rem] items-start gap-2 px-3 py-2 {i ? 'border-t border-borde' : ''}">
				<div class="min-w-0">
					<input bind:value={l.cuenta} list="cuentas-asiento" inputmode="numeric" class="input h-9 font-mono text-sm" placeholder="572" />
					<p class="mt-1 truncate text-[0.7rem] text-texto-3">{nombre(l.cuenta)}</p>
				</div>
				<input bind:value={l.debe} oninput={() => l.debe && (l.haber = '')} inputmode="decimal" class="input h-9 text-right font-mono text-sm" placeholder="0,00" />
				<input bind:value={l.haber} oninput={() => l.haber && (l.debe = '')} inputmode="decimal" class="input h-9 text-right font-mono text-sm" placeholder="0,00" />
				<button type="button" class="btn btn-fantasma btn-icono h-9 w-8" disabled={lineas.length <= 2} onclick={() => lineas.splice(i, 1)} aria-label="Quitar línea"><X size={15} /></button>
			</div>
		{/each}
		<div class="grid grid-cols-[1fr_6.5rem_6.5rem_2rem] gap-2 border-t border-borde bg-superficie-2 px-3 py-2 font-mono text-sm">
			<button type="button" class="flex items-center gap-1.5 text-left font-sans text-xs font-medium text-texto-2 hover:text-texto" onclick={() => lineas.push({ cuenta: '', debe: '', haber: '' })}><Plus size={14} /> Línea</button>
			<span class="text-right">{euros(totales.debe)}</span>
			<span class="text-right">{euros(totales.haber)}</span>
			<span></span>
		</div>
	</div>
	<datalist id="cuentas-asiento">{#each cuentas as c (c.codigo)}<option value={c.codigo}>{c.nombre}</option>{/each}</datalist>

	<div class="flex items-center justify-between gap-3 text-sm">
		{#if diferencia === 0 && totales.debe > 0}
			<span class="nivel-ok font-medium">✓ Cuadrado</span>
		{:else if totales.debe || totales.haber}
			<span class="nivel-urgente">Descuadre de {euros(Math.abs(diferencia))}</span>
			<button type="button" class="btn h-8 text-xs" onclick={cuadrar}>Cuadrar</button>
		{:else}
			<span class="text-texto-3">Partida doble: el debe y el haber deben sumar lo mismo.</span>
		{/if}
	</div>

	<label class="campo"><span>Notas</span><textarea name="notas" class="input" rows="2"></textarea></label>
	<button class="btn btn-acento h-12" disabled={!valido}>{inicial?.id ? 'Guardar asiento' : 'Contabilizar'}</button>
</form>
