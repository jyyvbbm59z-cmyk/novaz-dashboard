<script lang="ts">
	import { enhance } from '$app/forms';
	import Ayuda from '$comp/Ayuda.svelte';
	import Cifra from '$comp/Cifra.svelte';
	import Hoja from '$comp/Hoja.svelte';
	import { accion, enviar } from '$lib/enviar';
	import { diasEntre, ETIQUETA_FLUJO, euros, eurosInput, parsearEuros, type ClaseFlujo } from '@novaz/core';
	import type { Recurrente } from '@novaz/core/schema';
	import { Banknote, CalendarSync, CircleCheck, Landmark, Pencil, Plus, Scale, Trash2, TriangleAlert, Wallet } from '@lucide/svelte';

	let { data } = $props();
	const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
	const nombreMes = (ym: string) => `${MESES[Number(ym.slice(5, 7)) - 1]} ${ym.slice(2, 4)}`;
	const total = $derived(data.banco + data.caja);
	const diasCuadre = $derived(data.ajustes.ultimoCuadre ? diasEntre(data.ajustes.ultimoCuadre, data.hoy) : null);

	// ─── Cuadre con el banco
	let cuentaCuadre = $state<'572' | '570'>('572');
	let saldoReal = $state('');
	const libro = $derived(cuentaCuadre === '572' ? data.banco : data.caja);
	const diferencia = $derived(parsearEuros(saldoReal) == null ? null : parsearEuros(saldoReal)! - libro);

	// ─── Gráfico: saldo real del ejercicio + previsión
	const mesActual = $derived(data.hoy.slice(0, 7));
	const puntos = $derived.by(() => {
		const reales = data.flujo.meses
			.map((m) => ({ ym: `${data.ejercicio}-${String(m.mes).padStart(2, '0')}`, saldo: m.saldoFinal, previsto: false }))
			.filter((p) => p.ym < mesActual);
		const futuros = data.prevision.map((p) => ({ ym: p.mes, saldo: p.saldo, previsto: true }));
		return [...reales, ...futuros].slice(-12);
	});
	const W = 640;
	const H = 180;
	const escala = $derived.by(() => {
		const vals = [0, ...puntos.map((p) => p.saldo)];
		const min = Math.min(...vals);
		const max = Math.max(...vals);
		const pad = (max - min || 1) * 0.12;
		return { min: min - pad, max: max + pad };
	});
	const x = (i: number) => (puntos.length <= 1 ? W / 2 : (i / (puntos.length - 1)) * (W - 24) + 12);
	const y = (v: number) => H - ((v - escala.min) / (escala.max - escala.min)) * H;
	const ruta = (ps: { saldo: number }[], desde: number) => ps.map((p, i) => `${i ? 'L' : 'M'}${x(i + desde).toFixed(1)},${y(p.saldo).toFixed(1)}`).join(' ');
	const corte = $derived(puntos.findIndex((p) => p.previsto));
	let sobre = $state<number | null>(null);

	// ─── Recurrentes
	let hojaRec = $state(false);
	let rec = $state<Recurrente | null>(null);
	const textoTipo: Record<string, string> = { gasto: 'Gasto', ingreso: 'Ingreso', aportacion: 'Aportación', retirada: 'Salida' };
	const signo = (t: string) => (t === 'ingreso' || t === 'aportacion' ? '+' : '−');
	const CLASES: ClaseFlujo[] = ['cobros', 'pagos', 'financiacion', 'impuestos', 'socio'];
</script>

<svelte:head><title>Tesorería · {data.ajustes.nombreTaller}</title></svelte:head>

<Ayuda titulo="¿Qué es la tesorería?">
	El dinero que la empresa tiene de verdad: banco (cuenta 572) y caja en efectivo (570). No es lo mismo que el beneficio: puedes ganar dinero y tener la caja
	vacía (si te deben facturas) o tener caja sin beneficio (si has aportado tú). Aquí ves cuánto hay, cuánto entra y sale cada mes, y si te va a faltar.
</Ayuda>

<section class="grid grid-cols-2 gap-3 lg:grid-cols-4">
	<Cifra etiqueta="Total disponible" icono={Wallet} valor={euros(total, { redondo: true })} tono={total < 0 ? 'vencido' : undefined} grande clase="col-span-2 lg:col-span-1" />
	<Cifra etiqueta="Banco" icono={Landmark} valor={euros(data.banco, { redondo: true })} tono={data.banco < 0 ? 'vencido' : undefined} href="/contabilidad/mayor?cuenta=572" />
	<Cifra etiqueta="Caja (efectivo)" icono={Banknote} valor={euros(data.caja, { redondo: true })} tono={data.caja < 0 ? 'vencido' : undefined} href="/contabilidad/mayor?cuenta=570" />
	<Cifra
		etiqueta="Último cuadre"
		icono={Scale}
		valor={diasCuadre == null ? 'Nunca' : diasCuadre === 0 ? 'Hoy' : `${diasCuadre} d`}
		detalle={diasCuadre == null || diasCuadre > 30 ? 'Cuadra con tu banco abajo' : 'Al día'}
		tono={diasCuadre == null || diasCuadre > 30 ? 'urgente' : 'ok'}
	/>
</section>

<!-- Previsión -->
<section class="tarjeta mt-3 p-4 sm:p-5">
	<div class="mb-3 flex flex-wrap items-baseline justify-between gap-2">
		<h2 class="seccion-titulo">Previsión de caja</h2>
		<p class="flex gap-4 text-[0.7rem] text-texto-3">
			<span class="flex items-center gap-1.5"><span class="h-0.5 w-4 rounded bg-acento"></span>Real</span>
			<span class="flex items-center gap-1.5"><span class="h-0.5 w-4 rounded border-t-2 border-dashed border-acento"></span>Previsto</span>
		</p>
	</div>

	{#if data.sugerencia}
		<div class="mb-4 flex flex-wrap items-center gap-3 rounded-lg border border-vencido/40 bg-vencido/10 p-3 text-sm">
			<TriangleAlert size={18} class="shrink-0 nivel-vencido" />
			<p class="flex-1">En <strong>{nombreMes(data.sugerencia.mes)}</strong> te quedarías en negativo. Con una aportación de <strong>{euros(data.sugerencia.mensual, { redondo: true })} al mes</strong> lo cubres.</p>
			<a href="/contabilidad/nuevo?op=aportacionMensual&importe={eurosInput(data.sugerencia.mensual)}" class="btn btn-acento h-9">Programar aportación</a>
		</div>
	{:else if data.prevision.length}
		<p class="mb-3 flex items-center gap-2 text-sm text-texto-2"><CircleCheck size={16} class="nivel-ok" /> La caja aguanta los próximos 6 meses con lo previsto.</p>
	{/if}

	<div class="relative">
		<svg viewBox="0 0 {W} {H + 4}" class="h-48 w-full overflow-visible" preserveAspectRatio="none" role="img" aria-label="Saldo de tesorería real y previsto">
			<line x1="0" x2={W} y1={y(0)} y2={y(0)} stroke="var(--borde)" stroke-width="1" vector-effect="non-scaling-stroke" />
			{#if corte !== 0}
				<path d={ruta(puntos.slice(0, corte === -1 ? undefined : corte + 1), 0)} fill="none" stroke="var(--acento)" stroke-width="2" vector-effect="non-scaling-stroke" stroke-linejoin="round" />
			{/if}
			{#if corte >= 0}
				<path d={ruta(puntos.slice(Math.max(corte - 1, 0)), Math.max(corte - 1, 0))} fill="none" stroke="var(--acento)" stroke-width="2" stroke-dasharray="5 5" vector-effect="non-scaling-stroke" />
			{/if}
		</svg>
		<!-- Zonas de hover (HTML: el SVG se estira y deformaría los puntos) -->
		<div class="absolute inset-0 grid" style="grid-template-columns: repeat({puntos.length}, 1fr)">
			{#each puntos as p, i (p.ym)}
				<button onmouseenter={() => (sobre = i)} onmouseleave={() => (sobre = null)} onfocus={() => (sobre = i)} onblur={() => (sobre = null)} aria-label="{nombreMes(p.ym)}: {euros(p.saldo)}"></button>
			{/each}
		</div>
		{#if sobre != null}
			<span
				class="pointer-events-none absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-superficie"
				style="left: {(x(sobre) / W) * 100}%; top: {(y(puntos[sobre].saldo) / (H + 4)) * 100}%; background: {puntos[sobre].saldo < 0 ? 'var(--vencido)' : 'var(--acento)'}"
			></span>
		{/if}
		{#if sobre != null}
			{@const p = puntos[sobre]}
			<div class="pointer-events-none absolute -top-2 z-10 -translate-x-1/2 -translate-y-full rounded-lg border border-borde bg-superficie-3 px-3 py-2 text-xs whitespace-nowrap shadow-lg" style="left: {(x(sobre) / W) * 100}%">
				<p class="font-semibold">{nombreMes(p.ym)} · {p.previsto ? 'previsto' : 'real'}</p>
				<p class="cifra text-base {p.saldo < 0 ? 'nivel-vencido' : ''}">{euros(p.saldo)}</p>
			</div>
		{/if}
	</div>
	<div class="mt-1 grid text-center text-[0.65rem] text-texto-3" style="grid-template-columns: repeat({puntos.length}, 1fr)">
		{#each puntos as p (p.ym)}<span class={p.ym === mesActual ? 'font-semibold text-texto' : ''}>{MESES[Number(p.ym.slice(5, 7)) - 1].slice(0, 1)}<span class="hidden sm:inline">{MESES[Number(p.ym.slice(5, 7)) - 1].slice(1)}</span></span>{/each}
	</div>

	<details class="mt-4">
		<summary class="cursor-pointer text-sm text-texto-2">Cómo se calcula</summary>
		<div class="mt-2 overflow-x-auto">
			<table class="tabla text-xs">
				<thead class="border-b border-borde"><tr><th>Mes</th><th class="text-right">Recurrentes</th><th class="text-right">Habitual</th><th class="text-right">Saldo</th></tr></thead>
				<tbody>
					{#each data.prevision as p (p.mes)}
						<tr title={p.detalle.map((d) => `${d.concepto}: ${euros(d.importe)}`).join('\n')}>
							<td>{nombreMes(p.mes)}</td><td class="num">{euros(p.recurrente)}</td><td class="num">{euros(p.habitual)}</td><td class="num {p.saldo < 0 ? 'nivel-vencido' : ''}">{euros(p.saldo)}</td>
						</tr>
					{/each}
				</tbody>
			</table>
			<p class="mt-2 text-xs text-texto-3">
				Recurrentes: lo que se repite cada mes (aportaciones, alquiler…). Habitual: la media de cobros y pagos sueltos de los últimos 3 meses ({euros(data.habitual)}/mes).
			</p>
		</div>
	</details>
</section>

<div class="mt-3 grid gap-3 lg:grid-cols-2">
	<!-- Cuadrar con el banco -->
	<section class="tarjeta p-4 sm:p-5">
		<h2 class="seccion-titulo mb-1">Cuadrar con el banco</h2>
		<p class="mb-4 text-sm text-texto-3">Abre la app del banco (o cuenta la caja) y escribe el saldo real. Si no coincide, te ayudo a cuadrarlo.</p>
		<form method="POST" action="?/cuadrar" use:enhance={enviar({ reset: false, alTerminar: (d) => d.diferencia === 0 && (saldoReal = '') })} class="flex flex-col gap-3">
			<div class="grid grid-cols-2 gap-1 rounded-lg border border-borde bg-superficie-2 p-1">
				{#each [['572', 'Banco'], ['570', 'Caja']] as [v, t] (v)}
					<label class="cursor-pointer rounded-md py-1.5 text-center text-sm font-semibold {cuentaCuadre === v ? 'bg-superficie-3 text-texto' : 'text-texto-3'}">
						<input type="radio" name="cuenta" value={v} bind:group={cuentaCuadre} class="sr-only" />{t}
					</label>
				{/each}
			</div>
			<div class="grid grid-cols-2 gap-3">
				<div class="campo"><span>Según la app</span><p class="cifra flex h-11 items-center text-2xl text-texto-2">{euros(libro)}</p></div>
				<label class="campo"><span>Saldo real</span><input name="saldoReal" bind:value={saldoReal} class="input cifra h-11 text-xl" inputmode="decimal" placeholder="0,00" /></label>
			</div>
			{#if diferencia === 0}
				<button class="btn btn-acento"><CircleCheck size={17} /> Coincide: marcar como cuadrado</button>
			{:else if diferencia != null}
				<div class="rounded-lg bg-superficie-2 p-3 text-sm">
					<p class="mb-2">
						{diferencia < 0 ? 'En el banco hay' : 'En el banco hay'} <strong class="cifra text-base">{euros(Math.abs(diferencia))}</strong> {diferencia < 0 ? 'menos' : 'más'} de lo apuntado.
						Lo ideal es buscar qué falta por apuntar. Si no lo encuentras:
					</p>
					<div class="flex flex-wrap gap-2">
						{#if diferencia < 0}
							<button name="como" value="comision" class="btn h-9 text-xs">Son comisiones o cargos</button>
							<button name="como" value="otros" class="btn h-9 text-xs">No sé qué es: descuadre</button>
						{:else}
							<button name="como" value="aportacion" class="btn h-9 text-xs">Metí dinero y no lo apunté</button>
							<button name="como" value="ingreso" class="btn h-9 text-xs">Es un cobro sin apuntar</button>
						{/if}
					</div>
				</div>
			{/if}
		</form>
	</section>

	<!-- Recurrentes -->
	<section class="tarjeta p-4 sm:p-5">
		<div class="mb-3 flex items-center justify-between gap-2">
			<h2 class="seccion-titulo">Cada mes</h2>
			<a href="/contabilidad/nuevo" class="btn h-8 text-xs"><Plus size={14} /> Añadir</a>
		</div>
		{#if data.recurrentes.length}
			<ul class="lista-filas">
				{#each data.recurrentes as r (r.id)}
					<li class="flex items-center gap-3 py-2.5 {r.activo ? '' : 'opacity-50'}">
						<CalendarSync size={16} class="shrink-0 text-texto-3" />
						<div class="min-w-0 flex-1">
							<p class="truncate text-sm font-medium">{r.concepto}</p>
							<p class="text-xs text-texto-3">{textoTipo[r.tipo]} · día {r.dia}{r.hasta ? ` · hasta ${r.hasta}` : ''}{r.activo ? '' : ' · en pausa'}</p>
						</div>
						<span class="cifra text-lg {r.tipo === 'ingreso' || r.tipo === 'aportacion' ? 'nivel-ok' : ''}">{signo(r.tipo)}{euros(r.importeCent, { redondo: r.importeCent % 100 === 0 })}</span>
						<button class="btn btn-fantasma btn-icono h-8 w-8" onclick={() => ((rec = r), (hojaRec = true))} aria-label="Editar"><Pencil size={14} /></button>
					</li>
				{/each}
			</ul>
		{:else}
			<p class="text-sm text-texto-3">Nada programado. Una <a href="/contabilidad/nuevo?op=aportacionMensual" class="text-acento">aportación mensual</a> o el alquiler son buenos candidatos.</p>
		{/if}
	</section>
</div>

<!-- Flujo del ejercicio -->
<section class="mt-3">
	<h2 class="seccion-titulo mb-3">Flujo de caja {data.ejercicio}</h2>
	<div class="tarjeta overflow-x-auto">
		<table class="tabla">
			<thead class="border-b border-borde">
				<tr><th>Mes</th>{#each CLASES as c (c)}<th class="text-right">{ETIQUETA_FLUJO[c].split(' ')[0]}</th>{/each}<th class="text-right">Neto</th><th class="text-right">Saldo</th></tr>
			</thead>
			<tbody>
				<tr class="text-texto-3"><td colspan={CLASES.length + 2}>Saldo inicial</td><td class="num">{euros(data.flujo.saldoInicial)}</td></tr>
				{#each data.flujo.meses as m (m.mes)}
					{@const futuro = `${data.ejercicio}-${String(m.mes).padStart(2, '0')}` > mesActual}
					{#if !futuro}
						<tr>
							<td class="font-medium">{MESES[m.mes - 1]}</td>
							{#each CLASES as c (c)}<td class="num {m.porClase[c] ? '' : 'text-texto-3'}">{m.porClase[c] ? euros(m.porClase[c]!, { redondo: true }) : '·'}</td>{/each}
							<td class="num font-semibold {m.neto < 0 ? 'nivel-vencido' : m.neto > 0 ? 'nivel-ok' : 'text-texto-3'}">{m.neto ? euros(m.neto, { redondo: true }) : '·'}</td>
							<td class="num {m.saldoFinal < 0 ? 'nivel-vencido' : ''}">{euros(m.saldoFinal, { redondo: true })}</td>
						</tr>
					{/if}
				{/each}
			</tbody>
		</table>
	</div>
	<p class="mt-2 text-xs text-texto-3">Cobros: clientes y ventas · Pagos: proveedores y gastos · Financiación: aportaciones y préstamos · Hacienda: IVA y tributos liquidados · Socio: reembolsos de lo adelantado.</p>
</section>

<Hoja bind:abierta={hojaRec} titulo="Operación mensual">
	{#if rec}
		<form method="POST" action="?/recurrente" use:enhance={enviar({ alTerminar: () => (hojaRec = false) })} class="flex flex-col gap-4">
			<input type="hidden" name="id" value={rec.id} />
			<label class="campo"><span>Concepto</span><input name="concepto" class="input" value={rec.concepto} required /></label>
			<div class="grid grid-cols-2 gap-3">
				<label class="campo"><span>Importe (€)</span><input name="importe" class="input" inputmode="decimal" value={eurosInput(rec.importeCent)} required /></label>
				<label class="campo"><span>Día del mes</span><input name="dia" class="input" inputmode="numeric" value={rec.dia} /></label>
			</div>
			<label class="campo"><span>Hasta (opcional)</span><input type="date" name="hasta" class="input" value={rec.hasta ?? ''} /></label>
			<label class="flex items-center gap-3 text-sm"><input type="checkbox" name="activo" checked={rec.activo} class="h-5 w-5 accent-[var(--acento)]" /> Activa (desmarca para pausarla)</label>
			<p class="text-xs text-texto-3">Los cambios afectan a los meses que vienen; lo ya apuntado se queda como está.</p>
			<div class="flex gap-2">
				<button class="btn btn-acento h-12 flex-1">Guardar</button>
				<button type="button" class="btn btn-peligro h-12" onclick={async () => { if (confirm('¿Dejar de repetirla? Lo ya apuntado se conserva.')) { await accion('?/borrarRecurrente', { id: rec!.id }); hojaRec = false; } }}><Trash2 size={16} /></button>
			</div>
		</form>
	{/if}
</Hoja>
