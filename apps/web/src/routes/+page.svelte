<script lang="ts">
	import { accion } from '$lib/enviar';
	import { euros } from '@novaz/core';
	import { ArrowRight, CalendarDays, Check, CircleCheck, Landmark } from '@lucide/svelte';

	let { data } = $props();

	const fecha = $derived(
		new Intl.DateTimeFormat('es-ES', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' }).format(new Date(data.hoy + 'T12:00:00Z'))
	);
	const mes = $derived(new Intl.DateTimeFormat('es-ES', { month: 'long', timeZone: 'UTC' }).format(new Date(data.hoy + 'T12:00:00Z')));
	const atencion = $derived(data.asuntos.filter((a) => a.nivel === 'vencido' || a.nivel === 'urgente').length);
	const COLOR: Record<string, string> = { vencido: 'var(--vencido)', urgente: 'var(--urgente)', pronto: 'var(--pronto)', normal: 'var(--borde)' };
	const MAX = 8;
	let todos = $state(false);
	const visibles = $derived(todos ? data.asuntos : data.asuntos.slice(0, MAX));
</script>

<svelte:head><title>{data.ajustes.nombreTaller}</title></svelte:head>

<header class="mb-5">
	<p class="etiqueta first-letter:uppercase">{fecha}</p>
	<div class="flex items-end justify-between gap-3">
		<h1 class="titulo-pagina">Hoy</h1>
		<a href="/agenda" class="btn h-9 text-sm"><CalendarDays size={16} /> Agenda</a>
	</div>
	<p class="mt-1 text-sm text-texto-2">
		{#if atencion}<strong class="text-texto">{atencion} {atencion === 1 ? 'asunto requiere' : 'asuntos requieren'} atención</strong> · {/if}{data.asuntos.length
			? `${data.asuntos.length} ${data.asuntos.length === 1 ? 'cosa pendiente' : 'cosas pendientes'}`
			: 'Nada pendiente'}
	</p>
</header>

<div class="grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
	<!-- Lo que hay que hacer -->
	<section class="tarjeta overflow-hidden">
		{#if data.asuntos.length}
			<ul class="lista-filas">
				{#each visibles as a (a.clave)}
					<li class="flex items-stretch">
						<span class="w-1 shrink-0" style="background: {COLOR[a.nivel]}"></span>
						<a href={a.href} class="flex min-w-0 flex-1 items-center gap-3 px-4 py-3 transition hover:bg-superficie-2">
							<div class="min-w-0 flex-1">
								<p class="truncate text-sm font-medium">{a.titulo}</p>
								<p class="truncate text-xs text-texto-3">{a.contexto}</p>
							</div>
							{#if a.cuando}<span class="shrink-0 text-right text-xs font-semibold {a.nivel === 'vencido' ? 'nivel-vencido' : a.nivel === 'urgente' ? 'nivel-urgente' : 'text-texto-2'}">{a.cuando}</span>{/if}
						</a>
						{#if a.tareaLocalId}
							<button
								class="flex w-12 shrink-0 items-center justify-center border-l border-borde text-texto-3 transition hover:bg-superficie-2 hover:text-ok"
								onclick={(e) => accion('/local?/estado', { id: a.tareaLocalId!, estado: 'hecha' }, e.currentTarget)}
								aria-label="Marcar «{a.titulo}» como hecha"
								title="Hecha"><Check size={18} /></button
							>
						{/if}
					</li>
				{/each}
			</ul>
			{#if data.asuntos.length > MAX}
				<button class="w-full border-t border-borde py-2.5 text-xs font-medium text-texto-3 hover:text-texto" onclick={() => (todos = !todos)}>
					{todos ? 'Ver menos' : `Ver las ${data.asuntos.length - MAX} restantes`}
				</button>
			{/if}
		{:else}
			<p class="flex items-center gap-3 px-4 py-4 text-sm text-texto-2"><CircleCheck size={18} class="nivel-ok" /> Todo al día: papeles, revisiones, averías y el local.</p>
		{/if}
		{#if data.proximoTramite}
			{@const p = data.proximoTramite}
			<a href={p.href} class="flex items-center gap-3 border-t border-borde bg-superficie-2/50 px-4 py-2.5 text-xs text-texto-3 hover:text-texto">
				<span class="flex-1">Próximo trámite: <strong class="font-semibold text-texto-2">{p.titulo} de {p.vehiculo}</strong>, {p.cuando} ({p.detalle})</span>
				<ArrowRight size={13} class="shrink-0" />
			</a>
		{/if}
	</section>

	<div class="flex flex-col gap-4">
		<!-- Dinero en una línea -->
		<a href="/contabilidad" class="tarjeta block p-4 transition hover:border-texto-3/40">
			<p class="etiqueta flex items-center gap-1.5"><Landmark size={13} /> En el banco</p>
			<p class="cifra mt-1 text-4xl {data.dinero.disponible < 0 ? 'nivel-vencido' : ''}">{euros(data.dinero.disponible)}</p>
			<p class="mt-1 text-xs text-texto-3">
				Gastado en {mes}: <span class="text-texto-2">{euros(data.dinero.gastoMes, { redondo: true })}</span> · en {data.hoy.slice(0, 4)}: <span class="text-texto-2">{euros(data.dinero.gastoAnio, { redondo: true })}</span>
			</p>
			{#if data.dinero.disponible < 0 || data.dinero.diasCuadre == null || data.dinero.diasCuadre > 30}
				<p class="mt-2 text-xs nivel-urgente">{data.dinero.disponible < 0 ? '¿En el banco pone otra cifra? Cuádralo en Tesorería.' : 'Hace tiempo que no cuadras con el banco.'}</p>
			{/if}
		</a>

		<!-- Obras -->
		{#if data.obras.length}
			<section class="tarjeta p-4">
				<a href="/restauraciones" class="etiqueta mb-3 flex items-center justify-between hover:text-texto">En el taller <ArrowRight size={12} /></a>
				<ul class="flex flex-col gap-3">
					{#each data.obras as o (o.id)}
						<li>
							<a href="/restauraciones/{o.id}" class="block">
								<div class="flex items-baseline justify-between gap-3 text-sm">
									<span class="min-w-0 truncate font-medium">{o.nombre}</span>
									<span class="cifra shrink-0 text-texto-2">{Math.round(o.avance * 100)} %</span>
								</div>
								<div class="mt-1.5 h-1.5 overflow-hidden rounded-full bg-superficie-3"><div class="h-full rounded-full bg-acento" style="width: {o.avance * 100}%"></div></div>
								<p class="mt-1 text-xs text-texto-3">{o.vehiculo}{o.estado === 'pausada' ? ' · pausada' : o.estado === 'planificada' ? ' · planificada' : ''}</p>
							</a>
						</li>
					{/each}
				</ul>
			</section>
		{/if}
	</div>
</div>
