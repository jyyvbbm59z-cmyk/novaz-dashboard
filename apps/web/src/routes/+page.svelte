<script lang="ts">
	import { euros, fechaLarga, textoDias } from '@novaz/core';
	import { ArrowRight, Boxes, CircleCheck, ShoppingCart, Warehouse, Wrench } from '@lucide/svelte';

	let { data } = $props();

	const fecha = $derived(
		new Intl.DateTimeFormat('es-ES', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' }).format(new Date(data.hoy + 'T12:00:00Z'))
	);
	const saludo = $derived.by(() => {
		const h = Number(new Intl.DateTimeFormat('es-ES', { hour: 'numeric', hour12: false, timeZone: data.ajustes.zonaHoraria }).format(new Date()));
		return h < 6 ? 'Trasnochando' : h < 14 ? 'Buenos días' : h < 21 ? 'Buenas tardes' : 'Buenas noches';
	});
	const pendientes = $derived(data.alertas);
	const maxCat = $derived(Math.max(1, ...data.gasto.categorias.map((c) => c.total)));
	const nombreClase: Record<string, string> = { diario: 'Diario', mantenimiento: 'Mantenimiento', reparacion: 'Reparación', nota: 'Nota' };
</script>

<svelte:head><title>{data.ajustes.nombreTaller}</title></svelte:head>

<header class="mb-6">
	<p class="etiqueta first-letter:uppercase">{fecha}</p>
	<h1 class="titulo-pagina">{saludo}</h1>
</header>

<div class="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
	<!-- Lo que viene -->
	<section>
		<div class="mb-3 flex items-baseline justify-between">
			<h2 class="text-2xl">Lo que viene</h2>
			<span class="text-xs text-texto-3">{pendientes.length ? `${pendientes.length} pendientes` : ''}</span>
		</div>
		{#if !pendientes.length}
			<div class="tarjeta flex items-center gap-3 p-5 text-texto-2">
				<CircleCheck class="nivel-ok" size={22} /> Todo al día. Papeles y mantenimientos en regla.
			</div>
		{:else}
			<ul class="tarjeta lista-filas overflow-hidden">
				{#each pendientes as a (a.clave)}
					<li>
						<a href="/flota/{a.vehiculoId}?pestana={a.tipo === 'vencimiento' ? 'papeles' : a.tipo === 'pendiente' ? 'historial' : 'mantenimiento'}" class="flex items-center gap-3 px-4 py-3 transition hover:bg-superficie-2">
							<span class="h-9 w-1 shrink-0 rounded-full" style="background: var(--{a.nivel})"></span>
							<div class="min-w-0 flex-1">
								<p class="truncate font-medium">{a.titulo} <span class="font-normal text-texto-3">· {a.vehiculo}</span></p>
								<p class="truncate text-xs text-texto-3">{a.detalle}</p>
							</div>
							<span class="cifra shrink-0 text-right text-base nivel-{a.nivel}">
								{#if a.tipo === 'pendiente'}<span class="font-sans text-xs font-semibold tracking-wide uppercase">{a.nivel === 'urgente' ? 'Urgente' : 'Reparar'}</span>{:else if a.tipo === 'vencimiento' && a.dias != null}{textoDias(a.dias)}{:else if a.kmRestantes != null}{a.kmRestantes < 0 ? `+${(-a.kmRestantes).toLocaleString('es-ES')}` : a.kmRestantes.toLocaleString('es-ES')} km{:else if a.dias != null}{textoDias(a.dias)}{/if}
							</span>
						</a>
					</li>
				{/each}
			</ul>
		{/if}
	</section>

	<!-- Dinero -->
	<section>
		<div class="mb-3 flex items-baseline justify-between">
			<h2 class="text-2xl">Gasto</h2>
			<span class="flex gap-3"><a href="/contabilidad/nuevo" class="text-xs font-semibold text-acento">＋ Apuntar factura</a><a href="/contabilidad" class="text-xs text-texto-3 hover:text-texto">Ver todo →</a></span>
		</div>
		<div class="tarjeta p-5">
			<div class="grid grid-cols-2 gap-4">
				<div><p class="etiqueta">Este mes</p><p class="cifra mt-1 text-4xl">{euros(data.gasto.mes, { redondo: true })}</p></div>
				<div><p class="etiqueta">{data.hoy.slice(0, 4)}</p><p class="cifra mt-1 text-4xl text-texto-2">{euros(data.gasto.anio, { redondo: true })}</p></div>
			</div>
			{#if data.gasto.categorias.length}
				<ul class="mt-5 flex flex-col gap-2.5">
					{#each data.gasto.categorias as c (c.nombre)}
						<li class="grid grid-cols-[7rem_1fr_auto] items-center gap-3 text-sm">
							<span class="truncate text-texto-2">{c.nombre}</span>
							<span class="h-2 overflow-hidden rounded-full bg-superficie-3"><span class="block h-full rounded-full" style="width:{(c.total / maxCat) * 100}%; background:{c.color}"></span></span>
							<span class="cifra text-texto-2">{euros(c.total, { redondo: true })}</span>
						</li>
					{/each}
				</ul>
			{/if}
		</div>
	</section>

	<!-- El local, compras e inventario -->
	{#if data.taller.localTotal || data.taller.compras || data.taller.fueraDeSitio}
		<section class="lg:col-span-2">
			<div class="grid grid-cols-2 gap-3 sm:grid-cols-[2fr_1fr_1fr]">
				<a href="/local" class="tarjeta col-span-2 flex flex-col gap-2 p-4 sm:col-span-1 transition hover:border-texto-3/40">
					<p class="etiqueta flex items-center gap-1.5"><Warehouse size={13} /> El local · {data.taller.localTotal} {data.taller.localTotal === 1 ? "pendiente" : "pendientes"}</p>
					{#each data.taller.local as t (t.id)}
						<p class="flex items-center gap-2 text-sm">
							<span class="punto" style="background: {t.prioridad === 'alta' || (t.fechaLimite && t.fechaLimite < data.hoy) ? 'var(--vencido)' : t.prioridad === 'media' ? 'var(--urgente)' : 'var(--texto-3)'}"></span>
							<span class="truncate">{t.titulo}</span>{#if t.zona}<span class="shrink-0 text-xs text-texto-3">· {t.zona}</span>{/if}
						</p>
					{:else}
						<p class="text-sm text-texto-3">Nada pendiente.</p>
					{/each}
				</a>
				<a href="/inventario/compras" class="tarjeta p-4 transition hover:border-texto-3/40">
					<p class="etiqueta flex items-center gap-1.5"><ShoppingCart size={13} /> Por comprar</p>
					<p class="cifra mt-1 text-3xl {data.taller.compras ? '' : 'text-texto-3'}">{data.taller.compras}</p>
				</a>
				<a href="/inventario" class="tarjeta p-4 transition hover:border-texto-3/40">
					<p class="etiqueta flex items-center gap-1.5"><Boxes size={13} /> Sin localizar</p>
					<p class="cifra mt-1 text-3xl {data.taller.fueraDeSitio ? 'nivel-urgente' : 'text-texto-3'}">{data.taller.fueraDeSitio}</p>
				</a>
			</div>
		</section>
	{/if}

	<!-- Restauraciones -->
	<section class="lg:col-span-2">
		<div class="mb-3 flex items-baseline justify-between">
			<h2 class="text-2xl">En el taller</h2>
			<a href="/restauraciones" class="text-xs text-texto-3 hover:text-texto">Restauraciones →</a>
		</div>
		{#if !data.restauraciones.length}
			<a href="/restauraciones" class="vacio flex items-center justify-center gap-2 hover:text-texto"><Wrench size={16} /> Ninguna obra en marcha. ¿Empezamos una?</a>
		{:else}
			<div class="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:px-0 xl:grid-cols-3" style="scrollbar-width:none">
				{#each data.restauraciones as r (r.id)}
					<a href="/restauraciones/{r.id}" class="tarjeta group relative w-72 shrink-0 snap-start overflow-hidden sm:w-auto">
						<div class="aspect-[2/1] bg-superficie-2">
							{#if r.portada}<img src="/archivos/{r.portada}?mini" alt="" class="h-full w-full object-cover opacity-80 transition group-hover:opacity-100" />{/if}
						</div>
						<div class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-4 pt-10 text-white">
							<p class="text-xs text-white/70">{r.vehiculo}</p>
							<p class="truncate font-display text-2xl font-bold uppercase">{r.nombre}</p>
							<div class="mt-2 flex items-center gap-2.5">
								<div class="h-1.5 flex-1 overflow-hidden rounded-full bg-white/20"><div class="h-full rounded-full bg-acento" style="width:{r.avance * 100}%"></div></div>
								<span class="cifra text-sm">{Math.round(r.avance * 100)}%</span>
							</div>
						</div>
					</a>
				{/each}
			</div>
		{/if}
	</section>

	<!-- Últimas entradas -->
	<section class="lg:col-span-2">
		<h2 class="mb-3 text-2xl">Últimos movimientos en el taller</h2>
		{#if !data.entradas.length}
			<div class="vacio">Aquí verás lo último que registres.</div>
		{:else}
			<ul class="tarjeta lista-filas">
				{#each data.entradas as e (e.id)}
					<li>
						<a href="/flota/{e.vehiculoId}#entrada-{e.id}" class="flex items-center gap-3 px-4 py-3 hover:bg-superficie-2">
							<div class="min-w-0 flex-1">
								<p class="truncate text-sm font-medium">{e.titulo}</p>
								<p class="text-xs text-texto-3">{e.vehiculo} · {nombreClase[e.clase]} · {fechaLarga(e.fecha)}</p>
							</div>
							<ArrowRight size={16} class="text-texto-3" />
						</a>
					</li>
				{/each}
			</ul>
		{/if}
	</section>
</div>
