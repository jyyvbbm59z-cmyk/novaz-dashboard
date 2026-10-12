<script lang="ts">
	import Cabecera from '$comp/Cabecera.svelte';
	import { euros, fechaLarga, type EventoAgenda } from '@novaz/core';
	import { ArrowRight, CalendarClock, FileCheck, Repeat, Warehouse, Wrench } from '@lucide/svelte';

	let { data } = $props();
	const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
	const DIAS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
	const TODOS_FILTROS = [
		['todo', 'Todo'],
		['papel', 'Papeles'],
		['revision', 'Revisiones'],
		['local', 'El local'],
		['recurrente', 'Fijos']
	] as const;
	const FILTROS = $derived(TODOS_FILTROS.filter(([v]) => (v !== 'local' || data.permisos.includes('local')) && (v !== 'recurrente' || data.permisos.includes('dinero'))));
	const ICONO = { papel: FileCheck, revision: Wrench, local: Warehouse, recurrente: Repeat };
	let filtro = $state<(typeof TODOS_FILTROS)[number][0]>('todo');

	const visibles = $derived(data.eventos.filter((e) => filtro === 'todo' || e.tipo === filtro));
	const atrasados = $derived(visibles.filter((e) => e.fecha < data.hoy));
	const meses = $derived.by(() => {
		const m = new Map<string, EventoAgenda[]>();
		for (const e of visibles) if (e.fecha >= data.hoy) m.set(e.fecha.slice(0, 7), [...(m.get(e.fecha.slice(0, 7)) ?? []), e]);
		return [...m.entries()];
	});
	const sale = (es: EventoAgenda[]) => es.reduce((t, e) => t + Math.min(e.importeCent ?? 0, 0), 0);
	const entra = (es: EventoAgenda[]) => es.reduce((t, e) => t + Math.max(e.importeCent ?? 0, 0), 0);
	const futuros = $derived(data.eventos.filter((e) => e.fecha >= data.hoy));
	const color = (e: EventoAgenda) => (e.nivel === 'vencido' ? 'var(--vencido)' : e.nivel === 'urgente' ? 'var(--urgente)' : e.nivel === 'pronto' ? 'var(--pronto)' : 'var(--borde)');
	const dia = (f: string) => DIAS[new Date(`${f}T12:00:00Z`).getUTCDay()];
</script>

<svelte:head><title>Agenda · {data.ajustes.nombreTaller}</title></svelte:head>

<Cabecera antetitulo="Próximos 12 meses" titulo="Agenda" />

<!-- Sesiones de taller recomendadas -->
{#if data.sesiones.length}
	<section class="mb-5 flex flex-col gap-2">
		<p class="etiqueta">Sesiones de taller recomendadas</p>
		{#each data.sesiones as s (s.vehiculoId)}
			<a href="/flota/{s.vehiculoId}?pestana=mantenimiento#sesion" class="tarjeta flex items-center gap-3 border-acento/30 p-3.5 transition hover:border-acento/60">
				<CalendarClock size={20} class="shrink-0 text-acento" />
				<div class="min-w-0 flex-1">
					<p class="text-sm font-semibold">{s.vehiculo} · {fechaLarga(s.fecha)}</p>
					<p class="truncate text-xs text-texto-3">
						{[...s.tocan.map((t) => t.titulo), ...s.adelantar.map((t) => `${t.titulo} (se adelanta)`)].join(' · ') || s.antesDeItv}
					</p>
				</div>
				<ArrowRight size={15} class="shrink-0 text-texto-3" />
			</a>
		{/each}
	</section>
{/if}

<!-- Resumen del año y filtros -->
{#if data.permisos.includes('dinero')}<p class="mb-3 text-sm text-texto-2">
	En los próximos 12 meses: salen <strong class="cifra text-base text-texto">{euros(-sale(futuros), { redondo: true })}</strong> en papeles y gastos fijos{#if entra(futuros)}{' · '}entran <strong class="cifra text-base text-texto">{euros(entra(futuros), { redondo: true })}</strong>{/if}.
</p>{/if}
<div class="-mx-4 mb-5 flex gap-1.5 overflow-x-auto px-4 sm:mx-0 sm:px-0" style="scrollbar-width:none">
	{#each FILTROS as [v, t] (v)}
		<button class="chip h-8 shrink-0 px-3 {filtro === v ? 'border-acento/60 bg-acento/10 text-texto' : 'text-texto-3'}" onclick={() => (filtro = v)}>{t}</button>
	{/each}
</div>

{#snippet fila(e: EventoAgenda)}
	{@const I = ICONO[e.tipo]}
	<li class="flex items-stretch">
		<span class="w-1 shrink-0" style="background: {color(e)}"></span>
		<a href={e.href} class="flex min-w-0 flex-1 items-center gap-3 px-3.5 py-2.5 transition hover:bg-superficie-2">
			<span class="w-9 shrink-0 text-center leading-tight">
				<span class="cifra block text-lg">{Number(e.fecha.slice(8, 10))}</span>
				<span class="block text-[0.62rem] text-texto-3 uppercase">{dia(e.fecha)}</span>
			</span>
			<I size={15} class="shrink-0 text-texto-3" />
			<span class="min-w-0 flex-1">
				<span class="block truncate text-sm font-medium">{e.titulo}</span>
				<span class="block truncate text-xs text-texto-3">{e.contexto}{e.tipo === 'revision' && e.estimado ? ' · fecha estimada por tu ritmo de km' : ''}</span>
			</span>
			{#if e.importeCent != null}
				<span class="cifra shrink-0 text-sm {e.importeCent > 0 ? 'nivel-ok' : ''}">{e.estimado ? '≈ ' : ''}{e.importeCent > 0 ? '+' : '−'}{euros(Math.abs(e.importeCent), { redondo: true })}</span>
			{/if}
		</a>
	</li>
{/snippet}

{#if atrasados.length}
	<section class="mb-5">
		<p class="etiqueta mb-2 nivel-vencido">Atrasado</p>
		<ul class="tarjeta lista-filas overflow-hidden">{#each atrasados as e (e.clave)}{@render fila(e)}{/each}</ul>
	</section>
{/if}

{#each meses as [ym, es] (ym)}
	<section class="mb-5">
		<div class="mb-2 flex items-baseline justify-between gap-3">
			<p class="text-base font-semibold">{MESES[Number(ym.slice(5, 7)) - 1]} <span class="font-normal text-texto-3">{ym.slice(0, 4)}</span></p>
			<p class="text-xs text-texto-3">
				{#if sale(es)}<span class="cifra text-sm text-texto-2">−{euros(-sale(es), { redondo: true })}</span>{/if}
				{#if entra(es)}<span class="cifra ml-2 text-sm nivel-ok">+{euros(entra(es), { redondo: true })}</span>{/if}
			</p>
		</div>
		<ul class="tarjeta lista-filas overflow-hidden">{#each es as e (e.clave)}{@render fila(e)}{/each}</ul>
	</section>
{:else}
	{#if !atrasados.length}<div class="vacio">Nada con fecha en los próximos 12 meses.</div>{/if}
{/each}
