<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import Icono from '$comp/Icono.svelte';
	import SubirArchivos from '$comp/SubirArchivos.svelte';
	import { enviar } from '$lib/enviar';
	import {
		asientoDeMovimiento,
		euros,
		explicarOperacion,
		GRUPOS_OPERACION,
		nombreCuenta,
		operacion,
		OPERACIONES,
		parsearEuros,
		TIPOS_IVA,
		type Operacion
	} from '@novaz/core';
	import type { FormaPago } from '@novaz/core/schema';
	import { ArrowLeft, CalendarSync, Check, Info, ListPlus, Search } from '@lucide/svelte';

	let { data } = $props();
	const plan = $derived(new Map(data.cuentas.map((c) => [c.codigo, c.nombre])));

	// Paso 1 ↔ 2 por URL (?op=luz) para que el botón Atrás funcione
	const op = $derived(operacion(page.url.searchParams.get('op') ?? ''));
	let busqueda = $state('');
	const visibles = $derived(
		OPERACIONES.filter((o) => !busqueda || `${o.titulo} ${o.ayuda} ${o.ejemplo ?? ''}`.toLowerCase().includes(busqueda.toLowerCase()))
	);

	function elegir(o: Operacion) {
		const u = new URL(page.url);
		u.searchParams.set('op', o.id);
		hecho = null;
		goto(u, { noScroll: false });
	}
	function volver() {
		const u = new URL(page.url);
		u.searchParams.delete('op');
		hecho = null;
		goto(u);
	}

	// Paso 2: formulario
	let importe = $state('');
	let ivaPct = $state(21);
	let pago = $state<FormaPago>('banco');
	let mensual = $state(false);
	let proveedor = $state('');
	let fecha = $state('');
	let hecho = $state<{ movimientoId: number; titulo: string } | null>(null);

	$effect(() => {
		// Al cambiar de operación, valores sugeridos
		if (!op) return;
		ivaPct = op.ivaPct;
		pago = op.pago ?? (op.tipo === 'aportacion' || op.tipo === 'retirada' ? 'banco' : data.ajustes.pagoPorDefecto);
		// Solo se marca sola cuando el importe es fijo; luz o agua cambian cada factura
		mensual = op.id === 'aportacionMensual' || op.id === 'alquiler';
		importe = page.url.searchParams.get('importe') ?? '';
		proveedor = '';
		fecha = data.hoy;
	});

	const financiero = $derived(op?.tipo === 'aportacion' || op?.tipo === 'retirada');
	const centimos = $derived(Math.abs(parsearEuros(importe) ?? 0));
	const cuentaOp = $derived(op?.inmovilizado?.cuenta ?? op?.cuenta ?? '629');
	const vista = $derived(
		op && centimos
			? asientoDeMovimiento({ id: 0, fecha, tipo: op.tipo, importeCent: centimos, ivaPct: financiero ? 0 : ivaPct, pago, concepto: '', cuentaContable: cuentaOp }, null)
			: null
	);
	const frases = $derived(op && centimos ? explicarOperacion({ tipo: op.tipo, cuenta: cuentaOp }, centimos, financiero ? 0 : ivaPct, pago, nombreCuenta(cuentaOp, plan)) : []);
	const concepto = $derived(op ? `${op.titulo}${proveedor ? ` · ${proveedor}` : ''}` : '');

	const PAGOS: [FormaPago, string, string][] = $derived(
		op?.tipo === 'ingreso'
			? [['banco', 'Banco', 'Transferencia, Bizum, tarjeta'], ['caja', 'Efectivo', 'Caja del taller']]
			: financiero
				? [['banco', 'Banco', ''], ['caja', 'Caja', 'Efectivo']]
				: [['banco', 'Banco', 'De la cuenta de Novaz'], ['caja', 'Efectivo', 'De la caja'], ['socio', 'Mi bolsillo', 'La empresa te lo deberá']]
	);
</script>

<svelte:head><title>Apuntar · {data.ajustes.nombreTaller}</title></svelte:head>

{#if !op}
	<!-- Paso 1: ¿qué ha llegado? -->
	<div class="mx-auto max-w-4xl">
		<div class="mb-5 flex flex-wrap items-end justify-between gap-3">
			<div>
				<p class="etiqueta">Asistente</p>
				<h2 class="seccion-titulo text-3xl">¿Qué ha llegado?</h2>
				<p class="mt-1 text-sm text-texto-3">Elige y la app se encarga de la cuenta, el IVA y el asiento.</p>
			</div>
			<label class="relative w-full sm:w-72">
				<Search size={15} class="absolute top-1/2 left-3 -translate-y-1/2 text-texto-3" />
				<!-- svelte-ignore a11y_autofocus -->
				<input bind:value={busqueda} class="input pl-9" placeholder="luz, IBI, aportación…" autofocus />
			</label>
		</div>

		{#each GRUPOS_OPERACION as g (g.id)}
			{@const ops = visibles.filter((o) => o.grupo === g.id)}
			{#if ops.length}
				<section class="mb-6">
					<p class="etiqueta mb-2">{g.titulo} <span class="font-normal tracking-normal normal-case">· {g.descripcion}</span></p>
					<div class="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
						{#each ops as o (o.id)}
							<button class="tarjeta group flex items-center gap-3 p-3 text-left transition hover:border-acento/50 active:scale-[0.98]" onclick={() => elegir(o)}>
								<span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-superficie-3 text-texto-2 transition group-hover:bg-acento/15 group-hover:text-acento">
									<Icono nombre={o.icono} size={19} />
								</span>
								<span class="min-w-0">
									<span class="block truncate text-sm font-semibold">{o.titulo}</span>
									<span class="block truncate text-[0.7rem] text-texto-3">{o.tipo === 'gasto' ? 'Gasto' : o.tipo === 'ingreso' ? 'Ingreso' : o.tipo === 'aportacion' ? 'Entra dinero' : 'Sale dinero'}{o.mensual ? ' · mensual' : ''}</span>
								</span>
							</button>
						{/each}
					</div>
				</section>
			{/if}
		{/each}
		<a href="/contabilidad/movimientos?nuevo" class="flex items-center gap-2 text-sm text-texto-3 hover:text-texto"><ListPlus size={16} /> ¿No está? Usa el formulario completo</a>
	</div>
{:else if hecho}
	<!-- Paso 3: hecho -->
	<div class="mx-auto flex max-w-md flex-col items-center gap-4 py-8 text-center">
		<span class="flex h-16 w-16 items-center justify-center rounded-full bg-ok text-black"><Check size={34} strokeWidth={3} /></span>
		<h2 class="seccion-titulo text-3xl">¡Apuntado!</h2>
		<p class="text-texto-2">{hecho.titulo}{mensual ? '. Se repetirá cada mes automáticamente.' : '.'}</p>
		<SubirArchivos entidad="movimiento" entidadId={hecho.movimientoId} texto="Adjuntar la factura (foto o PDF)" clase="btn" />
		<div class="flex flex-wrap justify-center gap-2">
			<button class="btn btn-acento" onclick={volver}>Apuntar otra cosa</button>
			<a href="/contabilidad/diario" class="btn">Ver el asiento</a>
			<a href="/contabilidad/tesoreria" class="btn">Ver la caja</a>
		</div>
	</div>
{:else}
	<!-- Paso 2: datos -->
	<div class="mx-auto grid max-w-5xl gap-5 lg:grid-cols-[1fr_22rem]">
		<div>
			<button class="mb-3 flex items-center gap-1.5 text-sm text-texto-3 hover:text-texto" onclick={volver}><ArrowLeft size={15} /> Elegir otra cosa</button>
			<div class="mb-4 flex items-center gap-3">
				<span class="flex h-12 w-12 items-center justify-center rounded-xl bg-acento/15 text-acento"><Icono nombre={op.icono} size={24} /></span>
				<h2 class="seccion-titulo text-3xl">{op.titulo}</h2>
			</div>
			<div class="mb-5 flex gap-3 rounded-xl border border-borde bg-superficie-2 p-3.5 text-sm leading-relaxed text-texto-2">
				<Info size={18} class="mt-0.5 shrink-0 text-acento" />
				<p>{op.ayuda}</p>
			</div>

			<form
				method="POST"
				action="?/registrar"
				use:enhance={enviar({ reset: false, alTerminar: (d) => (hecho = { movimientoId: Number(d.movimientoId), titulo: concepto }) })}
				class="flex flex-col gap-4"
			>
				<input type="hidden" name="operacion" value={op.id} />
				<div class="grid grid-cols-[1.4fr_1fr] gap-3">
					<label class="campo">
						<span>{op.tipo === 'aportacion' ? '¿Cuánto metes?' : op.tipo === 'retirada' ? '¿Cuánto sale?' : 'Importe total de la factura'}</span>
						<!-- svelte-ignore a11y_autofocus -->
						<input name="importe" bind:value={importe} class="input cifra h-14 text-3xl" inputmode="decimal" placeholder="0,00" required autofocus />
						{#if !financiero}<span class="text-xs text-texto-3">Con IVA incluido, lo que pagas o cobras</span>{/if}
					</label>
					<label class="campo"><span>Fecha</span><input type="date" name="fecha" bind:value={fecha} class="input h-14" required /></label>
				</div>

				{#if !financiero}
					<div class="grid grid-cols-2 gap-3">
						<label class="campo">
							<span>{op.tipo === 'ingreso' ? 'Cliente' : 'Proveedor'}</span>
							<input name="proveedor" bind:value={proveedor} class="input" placeholder={op.ejemplo ?? ''} />
						</label>
						<label class="campo">
							<span>IVA de la factura</span>
							<select name="ivaPct" bind:value={ivaPct} class="input">
								{#each TIPOS_IVA as t (t)}<option value={t}>{t ? `${t} %` : 'Sin IVA'}</option>{/each}
							</select>
						</label>
					</div>
				{/if}

				<fieldset class="campo">
					<span>{op.tipo === 'ingreso' || op.tipo === 'aportacion' ? '¿Dónde entra el dinero?' : '¿Con qué se paga?'}</span>
					<div class="grid gap-2 {PAGOS.length === 3 ? 'grid-cols-3' : 'grid-cols-2'}">
						{#each PAGOS as [v, t, d] (v)}
							<label class="cursor-pointer rounded-lg border p-2.5 transition {pago === v ? 'border-acento bg-acento/10' : 'border-borde bg-superficie-2'}">
								<input type="radio" name="pago" value={v} bind:group={pago} class="sr-only" />
								<span class="block text-sm font-semibold">{t}</span>
								{#if d}<span class="block text-[0.7rem] leading-tight text-texto-3">{d}</span>{/if}
							</label>
						{/each}
					</div>
				</fieldset>

				{#if op.vehiculo}
					<label class="campo">
						<span>Vehículo (opcional)</span>
						<select name="vehiculoId" class="input">
							<option value="">— Ninguno en concreto —</option>
							{#each data.vehiculosMenu as v (v.id)}<option value={v.id}>{v.alias}</option>{/each}
						</select>
					</label>
				{/if}
				{#if op.inmovilizado}
					<label class="campo"><span>¿Cuántos años te durará?</span><input name="vidaUtilAnios" class="input" inputmode="decimal" value={op.inmovilizado.anios} /></label>
				{/if}

				<label class="flex items-start gap-3 rounded-lg border border-borde bg-superficie-2 p-3 text-sm">
					<input type="checkbox" name="mensual" bind:checked={mensual} class="mt-0.5 h-5 w-5 accent-[var(--acento)]" />
					<span>
						<span class="flex items-center gap-1.5 font-medium"><CalendarSync size={15} /> Se repite cada mes</span>
						<span class="text-xs text-texto-3">
							La app lo apuntará sola el día {fecha ? Number(fecha.slice(8, 10)) : ''} de cada mes, con este mismo importe, y lo usará para prever tu caja.
							{#if op.mensual && !mensual}Si el importe cambia cada vez (como la luz), mejor apúntalo cuando llegue.{/if}
						</span>
					</span>
				</label>
				{#if mensual}
					<label class="campo"><span>Hasta (opcional)</span><input type="date" name="hasta" class="input" /></label>
				{/if}

				<input type="hidden" name="concepto" value={concepto} />
				<label class="campo"><span>Notas</span><textarea name="notas" class="input" rows="2" placeholder="Nº de factura, periodo…"></textarea></label>
				{#if frases.length}
					<!-- En móvil, el resumen va justo antes del botón -->
					<ul class="flex flex-col gap-1 rounded-lg border border-acento/30 bg-acento/5 p-3 text-sm text-texto-2 lg:hidden">
						{#each frases as f, i (i)}<li class="flex gap-2"><span class="text-acento">•</span>{f}</li>{/each}
					</ul>
				{/if}
				<button class="btn btn-acento h-12 text-base" disabled={!centimos}>Apuntar</button>
			</form>
		</div>

		<!-- Así queda -->
		<aside class="hidden lg:sticky lg:top-8 lg:block lg:self-start">
			<div class="tarjeta p-4">
				<p class="etiqueta mb-2">Así queda apuntado</p>
				{#if vista}
					<ul class="mb-4 flex flex-col gap-1.5 text-sm text-texto-2">
						{#each frases as f, i (i)}<li class="flex gap-2"><span class="text-acento">•</span>{f}</li>{/each}
					</ul>
					<table class="tabla text-xs">
						<thead class="border-b border-borde"><tr><th class="px-0">Cuenta</th><th class="px-2 text-right">Debe</th><th class="px-0 text-right">Haber</th></tr></thead>
						<tbody>
							{#each vista.apuntes as p, i (i)}
								<tr>
									<td class="max-w-0 truncate px-0 py-1.5"><span class="font-mono text-texto-3">{p.cuenta}</span> {nombreCuenta(p.cuenta, plan)}</td>
									<td class="num px-2 py-1.5">{p.debe ? euros(p.debe) : ''}</td>
									<td class="num px-0 py-1.5">{p.haber ? euros(p.haber) : ''}</td>
								</tr>
							{/each}
						</tbody>
					</table>
					<p class="mt-3 text-[0.7rem] leading-relaxed text-texto-3">Partida doble: lo que sale de una cuenta entra en otra. El debe y el haber siempre suman lo mismo.</p>
				{:else}
					<p class="text-sm text-texto-3">Escribe el importe y verás aquí, en cristiano, qué va a pasar con tu dinero.</p>
				{/if}
			</div>
		</aside>
	</div>
{/if}
