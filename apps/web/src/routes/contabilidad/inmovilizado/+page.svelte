<script lang="ts">
	import Ayuda from '$comp/Ayuda.svelte';
	import { enhance } from '$app/forms';
	import Hoja from '$comp/Hoja.svelte';
	import { accion, enviar } from '$lib/enviar';
	import { CUENTAS_INMOVILIZADO, euros, eurosInput, fechaLarga } from '@novaz/core';
	import type { Inmovilizado } from '@novaz/core/schema';
	import { Link2, Pencil, Plus, Trash2 } from '@lucide/svelte';

	let { data } = $props();
	let hoja = $state(false);
	let edit = $state<Inmovilizado | null>(null);
	const nombreCuenta = (c: string) => CUENTAS_INMOVILIZADO.find(([k]) => k === c)?.[1] ?? c;
	const totales = $derived(data.bienes.reduce((t, b) => ({ valor: t.valor + b.valorCent, acumulada: t.acumulada + b.acumulada, ejercicio: t.ejercicio + b.delEjercicio }), { valor: 0, acumulada: 0, ejercicio: 0 }));
</script>

<svelte:head><title>Inmovilizado · {data.ajustes.nombreTaller}</title></svelte:head>

<Ayuda titulo="¿Qué es el inmovilizado?">{@html `Las cosas caras que duran años (elevador, compresor, soldadora). No se cuentan como gasto de golpe: cada año se gasta solo una parte (la <strong>amortización</strong>). Así el resultado de cada año es más justo.`}</Ayuda>

<div class="mb-4 flex flex-wrap items-center justify-between gap-3">
	<p class="max-w-2xl text-sm text-texto-3">Herramientas y equipos que duran años: se amortizan de forma lineal y el gasto se reparte en su vida útil (cuentas 681/281). Al registrar un gasto puedes marcarlo como inmovilizado.</p>
	<button class="btn btn-acento" onclick={() => ((edit = null), (hoja = true))}><Plus size={18} /> Nuevo bien</button>
</div>

{#if data.bienes.length}
	<section class="mb-4 grid grid-cols-3 gap-3">
		<div class="tarjeta p-4"><p class="etiqueta">Valor de adquisición</p><p class="cifra mt-1 text-2xl sm:text-3xl">{euros(totales.valor, { redondo: true })}</p></div>
		<div class="tarjeta p-4"><p class="etiqueta">Amortizado</p><p class="cifra mt-1 text-2xl sm:text-3xl">{euros(totales.acumulada, { redondo: true })}</p><p class="text-xs text-texto-3">{euros(totales.ejercicio, { redondo: true })} en {data.ejercicio}</p></div>
		<div class="tarjeta p-4"><p class="etiqueta">Valor neto</p><p class="cifra mt-1 text-2xl sm:text-3xl">{euros(totales.valor - totales.acumulada, { redondo: true })}</p></div>
	</section>
	<div class="grid gap-3 md:grid-cols-2">
		{#each data.bienes as b (b.id)}
			<article class="tarjeta flex flex-col gap-3 p-4 {b.fechaBaja ? 'opacity-60' : ''}">
				<div class="flex items-start gap-2">
					<div class="min-w-0 flex-1">
						<h3 class="truncate font-semibold">{b.nombre}</h3>
						<p class="text-xs text-texto-3"><span class="font-mono">{b.cuenta}</span> {nombreCuenta(b.cuenta)} · desde {fechaLarga(b.fechaAlta)} · {(b.vidaUtilMeses / 12).toLocaleString('es-ES')} años{b.fechaBaja ? ` · baja ${fechaLarga(b.fechaBaja)}` : ''}</p>
					</div>
					{#if b.movimientoId}<span class="chip h-6" title="Creado desde un movimiento"><Link2 size={12} /></span>{/if}
					<button class="btn btn-fantasma btn-icono h-8 w-8" onclick={() => ((edit = b), (hoja = true))} aria-label="Editar"><Pencil size={14} /></button>
					<button class="btn btn-fantasma btn-icono btn-peligro h-8 w-8" onclick={() => confirm(`¿Borrar ${b.nombre}?`) && accion('?/borrar', { id: b.id })} aria-label="Borrar"><Trash2 size={14} /></button>
				</div>
				<div>
					<div class="h-2 overflow-hidden rounded-full bg-superficie-3"><div class="h-full rounded-full bg-acento" style="width: {Math.min(b.avance, 1) * 100}%"></div></div>
					<div class="mt-2 grid grid-cols-3 text-xs">
						<span><span class="block text-texto-3">Valor</span><span class="font-mono">{euros(b.valorCent)}</span></span>
						<span class="text-center"><span class="block text-texto-3">Amortizado</span><span class="font-mono">{euros(b.acumulada)}</span></span>
						<span class="text-right"><span class="block text-texto-3">Neto</span><span class="font-mono text-texto">{euros(b.neto)}</span></span>
					</div>
				</div>
			</article>
		{/each}
	</div>
{:else}
	<div class="vacio">Sin bienes. El elevador, el compresor o la soldadora son buenos candidatos.</div>
{/if}

<Hoja bind:abierta={hoja} titulo={edit ? edit.nombre : 'Nuevo bien'}>
	<form method="POST" action="?/guardar" use:enhance={enviar({ alTerminar: () => (hoja = false) })} class="flex flex-col gap-4">
		{#if edit}<input type="hidden" name="id" value={edit.id} />{/if}
		<label class="campo"><span>Nombre</span><input name="nombre" class="input" required value={edit?.nombre ?? ''} placeholder="Elevador de tijera" /></label>
		<label class="campo">
			<span>Tipo de bien</span>
			<select name="cuenta" class="input">{#each CUENTAS_INMOVILIZADO as [c, n] (c)}<option value={c} selected={(edit?.cuenta ?? '213') === c}>{c} · {n}</option>{/each}</select>
		</label>
		<div class="grid grid-cols-2 gap-3">
			<label class="campo"><span>Valor sin IVA (€)</span><input name="valor" class="input" inputmode="decimal" required value={eurosInput(edit?.valorCent)} /></label>
			<label class="campo"><span>Valor residual (€)</span><input name="residual" class="input" inputmode="decimal" value={eurosInput(edit?.valorResidualCent) || ''} placeholder="0" /></label>
			<label class="campo"><span>Fecha de alta</span><input type="date" name="fechaAlta" class="input" value={edit?.fechaAlta ?? data.hoy} /></label>
			<label class="campo"><span>Vida útil (años)</span><input name="vidaUtilAnios" class="input" inputmode="decimal" value={edit ? edit.vidaUtilMeses / 12 : 10} /></label>
		</div>
		<label class="campo"><span>Fecha de baja (si lo vendes o se rompe)</span><input type="date" name="fechaBaja" class="input" value={edit?.fechaBaja ?? ''} /></label>
		<label class="campo"><span>Notas</span><textarea name="notas" class="input" rows="2">{edit?.notas ?? ''}</textarea></label>
		<button class="btn btn-acento h-12">Guardar</button>
	</form>
</Hoja>
