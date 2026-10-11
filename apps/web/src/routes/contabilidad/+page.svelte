<script lang="ts">
	import { euros, fechaLarga } from '@novaz/core';
	import { ArrowRight, Landmark, Scale } from '@lucide/svelte';

	let { data } = $props();
	const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
	const disponible = $derived(data.banco + data.caja);
	const maxCat = $derived(Math.max(1, ...data.categoriasGasto.map((c) => c.total)));
	const maxMes = $derived(Math.max(1, ...data.meses));
	const totalEntradas = $derived(data.entradas.reduce((t, e) => t + e.total, 0));
	const enCurso = $derived(data.ejercicio === Number(data.hoy.slice(0, 4)));
	const pct = (x: number, total: number) => (total ? Math.round((x / total) * 100) : 0);
</script>

<svelte:head><title>Dinero · {data.ajustes.nombreTaller}</title></svelte:head>

<!-- Móvil: banco → gastos → de dónde sale. Escritorio: banco y entradas a la izquierda, gastos a la derecha -->
<div class="grid grid-cols-1 items-start gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:grid-rows-[auto_1fr]">
	<!-- Lo que hay -->
		<a href="/contabilidad/tesoreria" class="tarjeta block p-5 transition hover:border-texto-3/40 lg:col-start-1 lg:row-start-1">
			<p class="etiqueta flex items-center gap-1.5"><Landmark size={13} /> En el banco</p>
			<p class="cifra mt-2 text-5xl {disponible < 0 ? 'nivel-vencido' : ''}">{euros(disponible)}</p>
			<p class="mt-1 text-xs text-texto-3">
				{#if data.caja}Banco {euros(data.banco)} · efectivo {euros(data.caja)} ·{' '}{/if}{data.diasCuadre == null ? 'sin cuadrar nunca' : data.diasCuadre === 0 ? 'cuadrado hoy' : `cuadrado hace ${data.diasCuadre} ${data.diasCuadre === 1 ? 'día' : 'días'}`}
			</p>
			{#if disponible < 0 || data.diasCuadre == null || data.diasCuadre > 30}
				<p class="mt-3 flex items-center gap-2 rounded-lg bg-urgente/10 px-3 py-2 text-xs text-texto-2">
					<Scale size={14} class="shrink-0" />
					{disponible < 0 ? '¿En tu banco pone otra cifra? Cuádralo y la app se ajusta.' : 'Hace tiempo que no cuadras con el banco.'}
					<ArrowRight size={13} class="ml-auto shrink-0" />
				</p>
			{/if}
		</a>

		<!-- De dónde sale -->
		{#if data.entradas.length}
			<div class="tarjeta order-last p-5 lg:order-none lg:col-start-1 lg:row-start-2">
				<p class="etiqueta mb-3">De dónde sale el dinero · {data.ejercicio}</p>
				<ul class="flex flex-col gap-2 text-sm">
					{#each data.entradas as e (e.nombre)}
						<li class="flex items-baseline justify-between gap-3"><span class="text-texto-2">{e.nombre}</span><span class="cifra">{euros(e.total, { redondo: true })}</span></li>
					{/each}
				</ul>
				<p class="mt-3 flex items-baseline justify-between gap-3 border-t border-borde pt-3 text-sm">
					<span class="text-texto-3">Entra {euros(totalEntradas, { redondo: true })} · sale {euros(data.totalGasto, { redondo: true })}</span>
					<span class="cifra {totalEntradas - data.totalGasto < 0 ? 'nivel-vencido' : 'nivel-ok'}">{totalEntradas - data.totalGasto >= 0 ? '+' : ''}{euros(totalEntradas - data.totalGasto, { redondo: true })}</span>
				</p>
			</div>
		{/if}

	<!-- En qué se va -->
	<section class="tarjeta p-5 lg:col-start-2 lg:row-span-2 lg:row-start-1">
		<div class="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
			<div>
				<p class="etiqueta">Gastado en {data.ejercicio}{enCurso ? ` · hasta el ${fechaLarga(data.fechaCorte)}` : ''}</p>
				<p class="cifra mt-2 text-5xl">{euros(data.totalGasto, { redondo: true })}</p>
			</div>
			<div class="text-sm text-texto-2 sm:text-right">
				<p><span class="cifra text-base text-texto">{euros(data.mediaMensual, { redondo: true })}</span> de media al mes</p>
				{#if data.totalAnterior}<p class="text-xs text-texto-3">En {data.ejercicio - 1}, por estas fechas: {euros(data.totalAnterior, { redondo: true })}</p>{/if}
			</div>
		</div>

		{#if data.categoriasGasto.length}
			<ul class="mt-5 flex flex-col">
				{#each data.categoriasGasto as c (c.id)}
					<li>
						<a href="/contabilidad/movimientos?tipo=gasto&ejercicio={data.ejercicio}{c.id ? `&categoria=${c.id}` : ''}" class="group -mx-2 block rounded-lg px-2 py-2.5 transition hover:bg-superficie-2">
							<div class="flex items-baseline justify-between gap-3">
								<span class="flex min-w-0 items-center gap-2 text-sm font-medium"><span class="h-2.5 w-2.5 shrink-0 rounded-sm" style="background: {c.color}"></span><span class="truncate">{c.nombre}</span></span>
								<span class="cifra shrink-0 text-base">{euros(c.total, { redondo: true })}</span>
							</div>
							<div class="mt-1.5 h-1.5 overflow-hidden rounded-full bg-superficie-3"><div class="h-full rounded-full" style="width: {(c.total / maxCat) * 100}%; background: {c.color}"></div></div>
							<p class="mt-1 flex justify-between gap-3 text-xs text-texto-3">
								<span>{pct(c.total, data.totalGasto)} % del total · {c.n} {c.n === 1 ? 'movimiento' : 'movimientos'}</span>
								{#if c.anterior}<span>{data.ejercicio - 1}: {euros(c.anterior, { redondo: true })}</span>{/if}
							</p>
						</a>
					</li>
				{/each}
			</ul>
		{:else}
			<p class="mt-5 text-sm text-texto-3">Aún no hay gastos este año.</p>
		{/if}

		<!-- Mes a mes -->
		{#if data.totalGasto}
			<p class="etiqueta mt-6 mb-2">Mes a mes</p>
			<div class="grid h-20 grid-cols-12 items-end gap-1.5">
				{#each data.meses as m, i (i)}
					<a href="/contabilidad/movimientos?tipo=gasto&ejercicio={data.ejercicio}&mes={i + 1}" class="group flex h-full flex-col justify-end" title="{MESES[i]}: {euros(m, { redondo: true })}" aria-label="{MESES[i]}: {euros(m, { redondo: true })}">
						<span class="block rounded-t-sm transition group-hover:opacity-80 {i < data.mesesTranscurridos ? 'bg-acento' : 'bg-superficie-3'}" style="height: {m ? Math.max((m / maxMes) * 100, 3) : 0}%"></span>
					</a>
				{/each}
			</div>
			<div class="mt-1 grid grid-cols-12 gap-1.5 text-center text-[0.62rem] text-texto-3">{#each MESES as m (m)}<span>{m.slice(0, 1)}<span class="hidden sm:inline">{m.slice(1)}</span></span>{/each}</div>
		{/if}
	</section>
</div>
