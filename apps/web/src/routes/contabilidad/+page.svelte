<script lang="ts">
	import Cifra from '$comp/Cifra.svelte';
	import { euros, fechaLarga } from '@novaz/core';
	import { ArrowDownLeft, ArrowUpRight, Banknote, HandCoins, Landmark, Package, PiggyBank } from '@lucide/svelte';

	let { data } = $props();
	const MESES = ['E', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
	const NOMBRES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
	const maxAbs = $derived(Math.max(1, ...data.meses.map((m) => Math.abs(m.resultado))));
	const beneficio = $derived(data.resultado >= 0);
	let sobre = $state<number | null>(null);
	const sufijo = $derived(`ejercicio=${data.ejercicio}`);
	const margen = $derived(data.ingresos ? Math.round((data.resultado / data.ingresos) * 100) : null);
</script>

<svelte:head><title>Contabilidad · {data.ajustes.nombreTaller}</title></svelte:head>

<!-- Resultado del ejercicio -->
<section class="tarjeta relative overflow-hidden p-5 sm:p-7">
	<div class="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full opacity-30 blur-3xl" style="background: {beneficio ? 'var(--acento)' : 'var(--vencido)'}"></div>
	<div class="relative grid gap-6 lg:grid-cols-[1fr_1.3fr] lg:items-end">
		<div>
			<p class="etiqueta">Resultado {data.ejercicio} · a {fechaLarga(data.fechaCorte)}</p>
			<p class="cifra mt-2 text-6xl sm:text-7xl" style="color: {beneficio ? 'var(--texto)' : 'var(--vencido)'}">{euros(data.resultado, { redondo: true })}</p>
			<p class="mt-2 text-sm text-texto-2">
				{beneficio ? 'Beneficio' : 'Pérdida'}{margen != null ? ` · margen ${margen} %` : ''} · {data.asientos} asientos
			</p>
			<div class="mt-4 flex gap-5 text-sm">
				<span class="flex items-center gap-1.5"><ArrowDownLeft size={16} class="nivel-ok" /> <span class="cifra text-lg">{euros(data.ingresos, { redondo: true })}</span> <span class="text-texto-3">ingresos</span></span>
				<span class="flex items-center gap-1.5"><ArrowUpRight size={16} class="text-texto-3" /> <span class="cifra text-lg">{euros(data.gastos, { redondo: true })}</span> <span class="text-texto-3">gastos</span></span>
			</div>
		</div>

		<!-- Resultado mensual: barras divergentes sobre el cero -->
		<div>
			<div class="relative grid h-40 grid-cols-12 gap-1.5 sm:gap-2.5">
				<span class="absolute inset-x-0 top-1/2 h-px bg-borde"></span>
				{#each data.meses as m, i (i)}
					{@const h = (Math.abs(m.resultado) / maxAbs) * 50}
					<button
						class="relative h-full"
						onmouseenter={() => (sobre = i)}
						onmouseleave={() => (sobre = null)}
						onfocus={() => (sobre = i)}
						onblur={() => (sobre = null)}
						aria-label="{NOMBRES[i]}: {euros(m.resultado)}"
					>
						{#if m.resultado}
							<span
								class="absolute inset-x-0.5 sm:inset-x-1 {m.resultado > 0 ? 'rounded-t-[4px]' : 'rounded-b-[4px]'}"
								style="{m.resultado > 0 ? `bottom: 50%` : `top: 50%`}; height: {Math.max(h, 1.5)}%; background: {m.resultado > 0 ? 'var(--acento)' : 'var(--texto-3)'}; opacity: {sobre == null || sobre === i ? 1 : 0.45}"
							></span>
						{/if}
					</button>
				{/each}
				{#if sobre != null}
					{@const m = data.meses[sobre]}
					<div class="pointer-events-none absolute -top-3 z-10 -translate-x-1/2 -translate-y-full rounded-lg border border-borde bg-superficie-3 px-3 py-2 text-xs whitespace-nowrap shadow-lg" style="left: {((sobre + 0.5) / 12) * 100}%">
						<p class="font-semibold">{NOMBRES[sobre]}</p>
						<p class="text-texto-2">Ingresos <span class="cifra text-texto">{euros(m.ingresos)}</span></p>
						<p class="text-texto-2">Gastos <span class="cifra text-texto">{euros(m.gastos)}</span></p>
						<p class="text-texto-2">Resultado <span class="cifra text-texto">{euros(m.resultado)}</span></p>
					</div>
				{/if}
			</div>
			<div class="mt-1.5 grid grid-cols-12 gap-1.5 text-center text-[0.65rem] text-texto-3 sm:gap-2.5">{#each MESES as m, i (i)}<span>{m}</span>{/each}</div>
			<p class="mt-2 flex gap-4 text-[0.7rem] text-texto-3">
				<span class="flex items-center gap-1.5"><span class="h-2 w-2 rounded-sm bg-acento"></span>Beneficio del mes</span>
				<span class="flex items-center gap-1.5"><span class="h-2 w-2 rounded-sm bg-texto-3"></span>Pérdida del mes</span>
			</p>
		</div>
	</div>
</section>

<!-- Situación -->
<section class="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
	<Cifra etiqueta="Tesorería" icono={Banknote} valor={euros(data.tesoreria.banco + data.tesoreria.caja, { redondo: true })} detalle="Banco {euros(data.tesoreria.banco, { redondo: true })} · Caja {euros(data.tesoreria.caja, { redondo: true })}" tono={data.tesoreria.banco + data.tesoreria.caja < 0 ? 'vencido' : undefined} href="/contabilidad/mayor?cuenta=572&{sufijo}" />
	<Cifra etiqueta="Te debe la empresa" icono={HandCoins} valor={euros(Math.max(data.socio, 0), { redondo: true })} detalle={data.socio > 0 ? 'Lo pagado de tu bolsillo' : 'Estáis en paz'} href="/contabilidad/mayor?cuenta=551&{sufijo}" />
	<Cifra
		etiqueta="IVA {data.ivaTrimestre.t}T"
		icono={Landmark}
		valor={euros(Math.abs(data.ivaTrimestre.resultado), { redondo: true })}
		detalle="{data.ivaTrimestre.resultado >= 0 ? 'A ingresar' : 'A compensar'}{data.ivaTrimestre.cerrado ? '' : ' · en curso'}"
		href="/contabilidad/iva?{sufijo}"
	/>
	<Cifra etiqueta="Impuesto sociedades" icono={PiggyBank} valor={euros(data.impuestoEstimado, { redondo: true })} detalle="Estimado al {data.ajustes.tipoImpuestoSociedades} %" tono="apagado" href="/contabilidad/resultados?{sufijo}" />
</section>

<section class="mt-3 grid gap-3 sm:grid-cols-2">
	{#if data.hacienda.ivaPagar > 0 || data.socio > 0}
		<div class="tarjeta flex flex-col gap-3 p-4">
			<p class="etiqueta">Pendiente</p>
			{#if data.hacienda.ivaPagar > 0}
				<a href="/contabilidad/diario?plantilla=iva&{sufijo}" class="flex items-center justify-between gap-3 rounded-lg bg-superficie-2 px-3 py-2.5 hover:bg-superficie-3">
					<span class="text-sm">IVA liquidado sin pagar a Hacienda</span><span class="cifra text-lg nivel-urgente">{euros(data.hacienda.ivaPagar)}</span>
				</a>
			{/if}
			{#if data.socio > 0}
				<a href="/contabilidad/diario?plantilla=socio&{sufijo}" class="flex items-center justify-between gap-3 rounded-lg bg-superficie-2 px-3 py-2.5 hover:bg-superficie-3">
					<span class="text-sm">Devolverte lo que adelantaste</span><span class="cifra text-lg">{euros(data.socio)}</span>
				</a>
			{/if}
		</div>
	{/if}
	<a href="/contabilidad/inmovilizado?{sufijo}" class="tarjeta flex items-center gap-4 p-4 transition hover:border-texto-3/40">
		<span class="flex h-11 w-11 items-center justify-center rounded-lg bg-superficie-3"><Package size={20} /></span>
		<div class="flex-1">
			<p class="etiqueta">Inmovilizado</p>
			<p class="text-sm text-texto-2">{data.inmovilizado.bienes} {data.inmovilizado.bienes === 1 ? 'bien' : 'bienes'} · valor neto <span class="cifra text-base text-texto">{euros(data.inmovilizado.neto, { redondo: true })}</span></p>
		</div>
	</a>
</section>
