<script lang="ts">
	import { goto } from '$app/navigation';
	import { enhance } from '$app/forms';
	import Hoja from '$comp/Hoja.svelte';
	import MuebleForm from '$comp/MuebleForm.svelte';
	import PlanoLocal from '$comp/PlanoLocal.svelte';
	import { accion, enviar } from '$lib/enviar';
	import { buscarArticulos, MUEBLES } from '@novaz/core';
	import type { Mueble } from '@novaz/core/schema';
	import { ArrowRight, Check, MapPin, Pencil, Printer, RotateCw, Search, Trash2 } from '@lucide/svelte';

	let { data } = $props();
	let editando = $state(false);
	let busqueda = $state('');
	let zonaSel = $state<number | null>(null);

	// Posición provisional mientras se guarda un arrastre (sin saltos)
	let provisional = $state<Record<number, { x: number; y: number }>>({});
	const muebles = $derived(data.plano.muebles.map((m) => (provisional[m.id] ? { ...m, ...provisional[m.id] } : m)));
	const cuentas = $derived(data.articulos.reduce<Record<number, number>>((c, a) => (a.muebleId ? { ...c, [a.muebleId]: (c[a.muebleId] ?? 0) + 1 } : c), {}));
	const activos = $derived(data.articulos.filter((a) => a.estado !== 'baja'));
	const sinUbicar = $derived(activos.filter((a) => !a.sitio.zonaId));

	const resultados = $derived(busqueda.trim().length > 1 ? buscarArticulos(busqueda, activos, 12) : []);
	const resaltados = $derived([...new Set(resultados.flatMap((a) => (a.muebleId ? [a.muebleId] : [])))]);
	const zona = $derived(data.plano.zonas.find((z) => z.id === zonaSel) ?? null);

	async function mover(id: number, x: number, y: number) {
		provisional[id] = { x, y };
		await accion('/inventario/plano?/mover', { id, x: String(x).replace('.', ','), y: String(y).replace('.', ',') });
		delete provisional[id];
	}
	async function girar(m: Mueble) {
		const fd: Record<string, string | number> = { id: m.id, tipo: m.tipo, codigo: m.codigo, nombre: m.nombre, x: m.x, y: m.y, ancho: m.ancho, fondo: m.fondo, niveles: m.niveles, notas: m.notas ?? '' };
		if (!m.girado) fd.girado = 'on';
		await accion('/inventario/plano?/mueble', Object.fromEntries(Object.entries(fd).map(([k, v]) => [k, typeof v === 'number' ? String(v).replace('.', ',') : v])));
	}
	async function quitar(m: Mueble) {
		if (!confirm(`¿Quitar ${m.codigo} · ${m.nombre} del plano?${cuentas[m.id] ? ` Sus ${cuentas[m.id]} artículos se quedan en la zona, sin mueble.` : ''}`)) return;
		await accion('/inventario/plano?/borrarMueble', { id: m.id });
		hMueble = false;
	}

	// Hojas
	let hMueble = $state(false);
	let editado = $state<Mueble | null>(null);
	let posicion = $state<{ x: number; y: number } | null>(null);
	let hZona = $state(false);
	function tocarMueble(id: number) {
		if (!editando) return goto(`/inventario/mueble/${id}`);
		editado = data.plano.muebles.find((m) => m.id === id) ?? null;
		posicion = null;
		hMueble = true;
	}
	function tocarVacio(x: number, y: number) {
		editado = null;
		posicion = { x, y };
		hMueble = true;
	}
	const sitioTexto = (a: (typeof activos)[number]) => a.sitio.texto ?? (a.ubicacion ? `${a.ubicacion} (sin ubicar en el plano)` : 'Sin ubicar');
</script>

<svelte:head><title>Plano del local · {data.ajustes.nombreTaller}</title></svelte:head>

<div class="mb-4 flex flex-wrap items-center gap-2">
	<label class="relative min-w-48 flex-1">
		<Search size={15} class="absolute top-1/2 left-3 -translate-y-1/2 text-texto-3" />
		<input bind:value={busqueda} class="input h-10 pl-9" placeholder="¿Dónde está…? (dinamométrica, llave de 13, Motul…)" />
	</label>
	<button class="btn h-10 {editando ? 'border-acento bg-acento/10' : ''}" onclick={() => (editando = !editando)}>
		{#if editando}<Check size={16} /> Hecho{:else}<Pencil size={16} /> <span class="hidden sm:inline">Editar plano</span><span class="sm:hidden">Editar</span>{/if}
	</button>
	<a href="/inventario/etiquetas" class="btn btn-icono h-10 w-10 sm:w-auto sm:px-4" aria-label="Etiquetas"><Printer size={16} /> <span class="hidden sm:inline">Etiquetas</span></a>
</div>

<div class="grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
	<section class="tarjeta overflow-hidden p-2 {editando ? 'border-acento/50' : ''}">
		{#if editando}<p class="px-2 pt-1 pb-2 text-xs text-texto-2">Toca un hueco para poner un mueble ahí · arrástralos para moverlos · tócalos para editarlos</p>{/if}
		<PlanoLocal
			zonas={data.plano.zonas}
			{muebles}
			{cuentas}
			{resaltados}
			zonaSeleccionada={zonaSel}
			editable={editando}
			alTocarMueble={tocarMueble}
			alTocarZona={(id) => (zonaSel = zonaSel === id ? null : id)}
			alTocarVacio={tocarVacio}
			alMover={mover}
			clase="max-h-[80dvh]"
		/>
	</section>

	<div class="flex min-w-0 flex-col gap-4 {busqueda.trim().length > 1 ? 'max-lg:order-first' : ''}">
		{#if busqueda.trim().length > 1}
			<section>
				<p class="etiqueta mb-2">{resultados.length ? `${resultados.length} ${resultados.length === 1 ? 'resultado' : 'resultados'}` : 'Nada con ese nombre'}</p>
				{#if resultados.length}
					<ul class="tarjeta lista-filas">
						{#each resultados as a (a.id)}
							<li>
								<a href={a.muebleId ? `/inventario/mueble/${a.muebleId}?articulo=${a.id}` : `/inventario${a.tipo === 'herramienta' ? '' : '/reserva'}`} class="flex items-center gap-3 px-3 py-2.5 hover:bg-superficie-2">
									<span class="w-16 shrink-0 font-mono text-sm font-bold {a.sitio.codigo ? '' : 'text-texto-3'}">{a.sitio.codigo ?? '—'}</span>
									<span class="min-w-0 flex-1">
										<span class="block truncate text-sm font-medium">{a.nombre}</span>
										<span class="block truncate text-xs text-texto-3">{sitioTexto(a)}</span>
									</span>
									<ArrowRight size={14} class="shrink-0 text-texto-3" />
								</a>
							</li>
						{/each}
					</ul>
				{/if}
			</section>
		{:else if zona}
			{@const suyos = data.plano.muebles.filter((m) => m.zonaId === zona.id)}
			{@const sueltos = activos.filter((a) => a.sitio.zonaId === zona.id && !a.muebleId)}
			<section class="tarjeta overflow-hidden">
				<div class="flex items-start gap-3 border-b border-borde p-4" style="border-left: 4px solid {zona.color}">
					<div class="min-w-0 flex-1">
						<p class="etiqueta">Zona {zona.codigo}</p>
						<p class="text-lg font-semibold">{zona.nombre}</p>
						{#if zona.notas}<p class="text-xs text-texto-3">{zona.notas}</p>{/if}
						<p class="mt-1 text-xs text-texto-3">{zona.ancho.toLocaleString('es-ES')} × {zona.alto.toLocaleString('es-ES')} m · {Math.round(zona.ancho * zona.alto)} m²</p>
					</div>
					<button class="btn h-8 px-2 text-xs" onclick={() => (hZona = true)}><Pencil size={13} /> Editar</button>
				</div>
				{#if suyos.length || sueltos.length}
					<ul class="lista-filas">
						{#each suyos as m (m.id)}
							<li>
								<a href="/inventario/mueble/{m.id}" class="flex items-center gap-3 px-4 py-2.5 hover:bg-superficie-2">
									<span class="w-14 shrink-0 font-mono text-sm font-bold">{zona.codigo}·{m.codigo}</span>
									<span class="min-w-0 flex-1 truncate text-sm">{m.nombre}<span class="text-texto-3">{m.niveles > 1 ? ` · ${m.niveles} ${MUEBLES[m.tipo].nivel === 'cajón' ? 'cajones' : MUEBLES[m.tipo].nivel + 's'}` : ''}</span></span>
									<span class="text-xs text-texto-3">{cuentas[m.id] ?? 0}</span>
								</a>
							</li>
						{/each}
						{#if sueltos.length}
							<li class="px-4 py-2.5 text-xs text-texto-3">En la zona, sin mueble: {sueltos.map((a) => a.nombre).join(', ')}</li>
						{/if}
					</ul>
				{:else}
					<p class="p-4 text-sm text-texto-3">Sin muebles todavía. Pulsa «Editar plano» y toca dentro de la zona para poner el primero.</p>
				{/if}
			</section>
			<button class="text-left text-xs text-texto-3 hover:text-texto" onclick={() => (zonaSel = null)}>← Todas las zonas</button>
		{:else}
			{#if sinUbicar.length}
				<div class="tarjeta flex items-start gap-3 border-urgente/40 p-4">
					<MapPin size={18} class="mt-0.5 shrink-0 nivel-urgente" />
					<div class="min-w-0 flex-1 text-sm">
						<p><strong>{sinUbicar.length}</strong> {sinUbicar.length === 1 ? 'cosa sin sitio' : 'cosas sin sitio'} en el plano</p>
						<p class="text-xs text-texto-3">Pon los muebles y, desde cada uno, «Añadir aquí». Así cada herramienta tiene su código.</p>
					</div>
				</div>
			{/if}
			<section>
				<p class="etiqueta mb-2">Zonas</p>
				<ul class="tarjeta lista-filas">
					{#each data.plano.zonas as z (z.id)}
						{@const nM = data.plano.muebles.filter((m) => m.zonaId === z.id).length}
						{@const nA = activos.filter((a) => a.sitio.zonaId === z.id).length}
						<li>
							<button class="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-superficie-2" onclick={() => (zonaSel = z.id)}>
								<span class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-extrabold text-white" style="background: {z.color}">{z.codigo}</span>
								<span class="min-w-0 flex-1">
									<span class="block truncate text-sm font-medium">{z.nombre}</span>
									<span class="block truncate text-xs text-texto-3">{nM ? `${nM} ${nM === 1 ? 'mueble' : 'muebles'}` : 'Sin muebles'}{nA ? ` · ${nA} ${nA === 1 ? 'cosa' : 'cosas'}` : ''}</span>
								</span>
								<ArrowRight size={14} class="shrink-0 text-texto-3" />
							</button>
						</li>
					{/each}
				</ul>
			</section>
			<p class="text-xs text-texto-3">
				Cada sitio tiene un código: <span class="font-mono font-semibold text-texto-2">D·E2·3</span> es la zona D, la estantería E2, la balda 3. Imprime las etiquetas con QR y pégalas: al escanearlas ves qué hay dentro.
			</p>
		{/if}
	</div>
</div>

<Hoja bind:abierta={hMueble} titulo={editado ? `${editado.codigo} · ${editado.nombre}` : 'Nuevo mueble'}>
	{#key editado?.id ?? `${posicion?.x}-${posicion?.y}`}
		<MuebleForm mueble={editado} {posicion} existentes={data.plano.muebles} alGuardar={() => (hMueble = false)} />
	{/key}
	{#if editado}
		{@const m = editado}
		<div class="mt-3 grid grid-cols-2 gap-2">
			<button class="btn" onclick={() => girar(m).then(() => (hMueble = false))}><RotateCw size={16} /> Girar 90°</button>
			<button class="btn text-vencido" onclick={() => quitar(m)}><Trash2 size={16} /> Quitar</button>
		</div>
	{/if}
</Hoja>

<Hoja bind:abierta={hZona} titulo={zona ? `Zona ${zona.codigo}` : 'Zona'}>
	{#if zona}
		{#key zona.id}
			<form method="POST" action="/inventario/plano?/zona" use:enhance={enviar({ alTerminar: () => (hZona = false) })} class="flex flex-col gap-4">
				<input type="hidden" name="id" value={zona.id} />
				<div class="grid grid-cols-[5rem_1fr_4rem] gap-3">
					<label class="campo"><span>Código</span><input name="codigo" class="input font-mono uppercase" value={zona.codigo} maxlength="3" /></label>
					<label class="campo"><span>Nombre</span><input name="nombre" class="input" value={zona.nombre} required /></label>
					<label class="campo"><span>Color</span><input type="color" name="color" class="input h-11 p-1" value={zona.color} /></label>
				</div>
				<label class="campo"><span>Para qué es</span><input name="notas" class="input" value={zona.notas ?? ''} /></label>
				<p class="text-xs text-texto-3">Si cambias el código, cambian los códigos de todo lo que hay dentro (las etiquetas impresas habría que repetirlas).</p>
				<button class="btn btn-acento h-12">Guardar</button>
			</form>
		{/key}
	{/if}
</Hoja>
