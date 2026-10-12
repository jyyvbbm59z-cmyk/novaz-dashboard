<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/state';
	import ArticuloDetalle from '$comp/ArticuloDetalle.svelte';
	import AltaRapida, { type Destino } from '$comp/AltaRapida.svelte';
	import ArticuloForm from '$comp/ArticuloForm.svelte';
	import Hoja from '$comp/Hoja.svelte';
	import FrenteMueble from '$comp/FrenteMueble.svelte';
	import MuebleForm from '$comp/MuebleForm.svelte';
	import PlanoLocal from '$comp/PlanoLocal.svelte';
	import { accion, enviar } from '$lib/enviar';
	import { buscarArticulos, codigoUbicacion, CONTENEDORES, MUEBLES, nombreDeNivel, nombreNivel as nombreDe, pluralNivel, siguienteLetra } from '@novaz/core';
	import { TIPOS_CONTENEDOR, type Contenedor, type TipoContenedor } from '@novaz/core/schema';
	import { ArrowLeft, Box, Camera, ChevronDown, Pencil, Plus, Printer, Search, Trash2, Wrench } from '@lucide/svelte';
	import { tick } from 'svelte';

	let { data } = $props();
	const m = $derived(data.mueble);
	const zona = $derived(data.plano.zonas.find((z) => z.id === m.zonaId) ?? null);
	const def = $derived(MUEBLES[m.tipo]);
	const aqui = $derived(data.articulos.filter((a) => a.muebleId === m.id));
	const conts = $derived(data.plano.contenedores.filter((c) => c.muebleId === m.id));
	const niveles = $derived(Array.from({ length: m.niveles }, (_, i) => i + 1));
	const enNivel = (n: number | null) => aqui.filter((a) => !a.contenedorId && (n == null ? a.nivel == null || a.nivel > m.niveles : a.nivel === n));
	const contsDe = (n: number | null) => conts.filter((c) => c.nivel === n);
	const enCont = (id: number) => aqui.filter((a) => a.contenedorId === id);
	const cuentaContenedor = $derived(aqui.reduce<Record<number, number>>((c, a) => (a.contenedorId ? { ...c, [a.contenedorId]: (c[a.contenedorId] ?? 0) + 1 } : c), {}));
	const marcado = $derived(Number(page.url.searchParams.get('nivel')) || null);
	const contMarcado = $derived(Number(page.url.searchParams.get('cont')) || null);
	const articuloMarcado = $derived(Number(page.url.searchParams.get('articulo')) || null);
	// Para el dibujo: solo lo suelto en cada balda (lo de los contenedores va dentro de su caja)
	const contenido = $derived(aqui.filter((a) => !a.contenedorId).reduce<Record<number, string[]>>((c, a) => ((c[a.nivel ?? 0] ??= []).push(a.nombre), c), {}));
	const irA = (id: string) => document.getElementById(id)?.scrollIntoView({ block: 'center', behavior: 'smooth' });
	const nombreNivel = (n: number) => { const t = nombreDe(m, n); return t.charAt(0).toUpperCase() + t.slice(1); };
	const codigo = (n: number | null, c?: Contenedor | null) => codigoUbicacion(zona, m, n, c) ?? m.codigo;
	const nombreCont = (c: Contenedor) => `${CONTENEDORES[c.tipo]} ${c.letra}${c.nombre ? ` · ${c.nombre}` : ''}`;

	$effect(() => {
		const id = articuloMarcado ? `a-${articuloMarcado}` : contMarcado ? `c-${contMarcado}` : marcado ? `n-${marcado}` : null;
		if (id) tick().then(() => irA(id));
	});

	// Todos los sitios del mueble en orden (balda 1, 1·A, 1·B, balda 2…): para inventariar seguido
	const destinos = $derived.by((): Destino[] => {
		const lista: Destino[] = [];
		const nivelesOSin = m.niveles > 0 ? niveles : [null];
		for (const n of nivelesOSin) {
			lista.push({ clave: `n${n}`, codigo: codigo(n), etiqueta: n ? nombreNivel(n).toLowerCase() : 'el mueble', nivel: n, contenedorId: null });
			for (const c of contsDe(n)) lista.push({ clave: `c${c.id}`, codigo: codigo(n, c), etiqueta: `el ${CONTENEDORES[c.tipo].toLowerCase()} ${c.letra}`, nivel: n, contenedorId: c.id });
		}
		return lista;
	});

	// Añadir: foto, lista, mover lo que ya está inventariado o uno a uno
	let hAnadir = $state(false);
	let indice = $state(0);
	const destino = $derived(destinos[indice] ?? destinos[0]);
	let filtro = $state('');
	let elegidos = $state<number[]>([]);
	let modoAlta = $state<'foto' | 'lista' | 'inventario' | 'nuevo'>('foto');
	const MODOS = [
		['foto', 'Foto'],
		['lista', 'Lista'],
		['inventario', 'Mover'],
		['nuevo', 'Uno a uno']
	] as const;
	const candidatos = $derived.by(() => {
		const otros = data.articulos.filter((a) => a.estado !== 'baja' && !(a.muebleId === m.id && a.nivel === destino?.nivel && (a.contenedorId ?? null) === destino?.contenedorId));
		const lista = filtro.trim().length > 1 ? buscarArticulos(filtro, otros, 40) : otros.filter((a) => !a.sitio.zonaId).concat(otros.filter((a) => a.sitio.zonaId));
		return lista.slice(0, 60);
	});
	function abrirAnadir(nivel: number | null, contenedorId: number | null = null) {
		const k = destinos.findIndex((d) => d.nivel === nivel && d.contenedorId === contenedorId);
		indice = Math.max(k, 0);
		filtro = '';
		elegidos = [];
		modoAlta = 'foto';
		hAnadir = true;
	}
	async function meter() {
		await accion('/inventario/plano?/ubicar', {
			ids: elegidos.join(','),
			muebleId: m.id,
			...(destino.nivel ? { nivel: destino.nivel } : {}),
			...(destino.contenedorId ? { contenedorId: destino.contenedorId } : {})
		});
		hAnadir = false;
	}

	// Contenedores: alta y edición
	let hCont = $state(false);
	let contEditado = $state<Contenedor | null>(null);
	let contNivel = $state<number | null>(null);
	let contTipo = $state<TipoContenedor>('cubo');
	function abrirContenedor(nivel: number | null, c: Contenedor | null = null) {
		contEditado = c;
		contNivel = c ? c.nivel : nivel;
		contTipo = c?.tipo ?? 'cubo';
		hCont = true;
	}
	const letraSugerida = $derived(contEditado?.letra ?? siguienteLetra(contsDe(contNivel).map((c) => c.letra)));
	async function quitarContenedor(c: Contenedor) {
		if (!confirm(`¿Quitar ${nombreCont(c)}?${enCont(c.id).length ? ` Sus ${enCont(c.id).length} cosas se quedan sueltas en la balda.` : ''}`)) return;
		await accion('/inventario/plano?/borrarContenedor', { id: c.id });
		hCont = false;
	}

	// Plegado: los contenedores se abren al tocarlos; las baldas con muchas cosas enseñan las primeras
	const MAX_SUELTOS = 6;
	let abiertos = $state<string[]>([]);
	const abierto = (clave: string) => abiertos.includes(clave);
	const alternar = (clave: string) => (abiertos = abierto(clave) ? abiertos.filter((x) => x !== clave) : [...abiertos, clave]);
	$effect(() => {
		// Lo que se viene a buscar (QR del contenedor o enlace a un artículo) sale abierto
		const a = data.articulos.find((x) => x.id === articuloMarcado);
		const claves = [contMarcado ? `c${contMarcado}` : null, a?.contenedorId ? `c${a.contenedorId}` : null, a && !a.contenedorId ? `n${a.nivel}` : null].filter((x): x is string => Boolean(x));
		if (claves.length) abiertos = [...new Set([...abiertos, ...claves])];
	});

	let hEditar = $state(false);
	let verId = $state<number | null>(null);
	let hVer = $state(false);
	const viendo = $derived(data.articulos.find((a) => a.id === verId) ?? null);
	$effect(() => {
		if (!hVer) verId = null;
	});
</script>

<svelte:head><title>{codigoUbicacion(zona, m)} · {m.nombre}</title></svelte:head>

<a href="/inventario/plano" class="mb-3 inline-flex items-center gap-1 text-xs text-texto-3 hover:text-texto"><ArrowLeft size={13} /> Plano del local</a>

<div class="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_18rem]">
	<div class="flex min-w-0 flex-col gap-4">
		<header class="flex items-start gap-4">
			<span class="flex h-16 min-w-16 shrink-0 items-center justify-center rounded-xl px-3 font-mono text-2xl font-extrabold text-white" style="background: {zona?.color ?? 'var(--texto-3)'}">{codigoUbicacion(zona, m)}</span>
			<div class="min-w-0 flex-1">
				<p class="etiqueta">{zona ? `Zona ${zona.codigo} · ${zona.nombre}` : 'Fuera de las zonas'}</p>
				<h2 class="text-2xl font-semibold">{m.nombre}</h2>
				<p class="text-xs text-texto-3">
					{def.nombre} · {m.ancho.toLocaleString('es-ES')} × {m.fondo.toLocaleString('es-ES')} m{m.niveles > 1 ? ` · ${m.niveles} ${pluralNivel(nombreDeNivel(m))}` : ''}{conts.length ? ` · ${conts.length} contenedores` : ''} · {aqui.length} cosas{m.notas ? ` · ${m.notas}` : ''}
				</p>
			</div>
		</header>
		<div class="flex flex-wrap gap-2">
			<button class="btn btn-acento h-9" onclick={() => abrirAnadir(m.niveles > 0 ? 1 : null)}><Camera size={16} /> {aqui.length ? 'Añadir aquí' : 'Inventariar balda a balda'}</button>
			<button class="btn h-9" onclick={() => (hEditar = true)}><Pencil size={15} /> Editar</button>
			<a href="/inventario/etiquetas?mueble={m.id}" class="btn h-9"><Printer size={15} /> Etiquetas</a>
		</div>

		{#if m.niveles > 0}
			<div class="tarjeta p-3 lg:hidden">
				<FrenteMueble
					mueble={m}
					{contenido}
					contenedores={conts}
					{cuentaContenedor}
					resaltar={marcado}
					contenedorResaltado={contMarcado}
					color={zona?.color}
					alTocarNivel={(k) => irA(`n-${k}`)}
					alTocarContenedor={(id) => irA(`c-${id}`)}
					clase="mx-auto h-auto max-h-72 w-full"
				/>
			</div>
		{/if}

		{#snippet fila(a: (typeof aqui)[number])}
			<li id="a-{a.id}">
				<button class="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-superficie-2 {articuloMarcado === a.id ? 'bg-acento/10' : ''}" onclick={() => ((verId = a.id), (hVer = true))}>
					<span class="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-superficie-3">
						{#if a.portada}<img src="/archivos/{a.portada}?mini" alt="" class="h-full w-full object-cover" />{:else}<Wrench size={15} class="text-texto-3" />{/if}
					</span>
					<span class="min-w-0 flex-1">
						<span class="block truncate text-sm font-medium">{a.nombre}{a.cantidad > 1 ? ` ×${a.cantidad.toLocaleString('es-ES')}` : ''}</span>
						{#if a.ubicacion || a.estado !== 'ok'}<span class="block truncate text-xs text-texto-3">{[a.ubicacion, a.estado === 'prestada' ? `prestada${a.prestadaA ? ` a ${a.prestadaA}` : ''}` : a.estado === 'perdida' ? 'no la encuentro' : a.estado === 'reparar' ? 'a reparar' : null].filter(Boolean).join(' · ')}</span>{/if}
					</span>
				</button>
			</li>
		{/snippet}

		{#snippet balda(n: number | null)}
			{@const sueltos = enNivel(n)}
			{@const cs = contsDe(n)}
			<section id="n-{n}" class="tarjeta overflow-hidden {marcado === n && n ? 'border-acento' : ''}">
				<div class="flex items-center gap-3 border-b border-borde px-3 py-2">
					<span class="font-mono text-sm font-bold">{n ? codigo(n) : m.codigo}</span>
					<span class="min-w-0 flex-1 truncate text-xs text-texto-3">{n ? nombreNivel(n) : m.niveles ? 'Sin balda concreta' : 'En el mueble'}{n === 1 && def.ayudaNivel ? ` · ${def.ayudaNivel.toLowerCase()}` : ''}</span>
					<button class="text-xs font-semibold text-texto-3 hover:text-texto" onclick={() => abrirContenedor(n)}><Box size={12} class="inline" /> Contenedor</button>
					<button class="text-xs font-semibold text-acento" onclick={() => abrirAnadir(n)}>+ Añadir</button>
				</div>
				{#if sueltos.length}
					{@const todos = abierto(`n${n}`) || sueltos.length <= MAX_SUELTOS + 2}
					<ul class="lista-filas">{#each todos ? sueltos : sueltos.slice(0, MAX_SUELTOS) as a (a.id)}{@render fila(a)}{/each}</ul>
					{#if sueltos.length > MAX_SUELTOS + 2}
						<button class="w-full border-t border-borde py-2 text-xs font-medium text-texto-3 hover:text-texto" onclick={() => alternar(`n${n}`)}>{todos ? 'Ver menos' : `Ver las ${sueltos.length - MAX_SUELTOS} restantes`}</button>
					{/if}
				{:else if !cs.length}<p class="px-3 py-2.5 text-xs text-texto-3">Vacío</p>{/if}
				{#each cs as c (c.id)}
					{@const dentro = enCont(c.id)}
					<div id="c-{c.id}" class="border-t border-borde bg-superficie-2/40 {contMarcado === c.id ? 'ring-2 ring-acento ring-inset' : ''}">
						<div class="flex items-center gap-2.5 px-3 py-2">
							<button class="flex min-w-0 flex-1 items-center gap-2.5 text-left" onclick={() => alternar(`c${c.id}`)} aria-expanded={abierto(`c${c.id}`)}>
							<span class="flex h-7 min-w-7 items-center justify-center rounded-md px-1.5 font-mono text-xs font-extrabold text-white" style="background: {zona?.color ?? 'var(--texto-3)'}">{c.letra}</span>
							<span class="min-w-0 flex-1">
								<span class="block truncate text-sm font-medium">{CONTENEDORES[c.tipo]} {c.letra}{c.nombre ? ` · ${c.nombre}` : ''}</span>
								<span class="block font-mono text-[0.68rem] text-texto-3">{codigo(n, c)} · {dentro.length} {dentro.length === 1 ? 'cosa' : 'cosas'}</span>
							</span>
							{#if dentro.length}<ChevronDown size={16} class="shrink-0 text-texto-3 transition-transform {abierto(`c${c.id}`) ? 'rotate-180' : ''}" />{/if}
							</button>
							<button class="btn btn-fantasma btn-icono h-8 w-8" onclick={() => abrirContenedor(n, c)} aria-label="Editar {nombreCont(c)}"><Pencil size={14} /></button>
							<button class="text-xs font-semibold text-acento" onclick={() => abrirAnadir(n, c.id)}>+ Añadir</button>
						</div>
						{#if dentro.length && abierto(`c${c.id}`)}<ul class="lista-filas border-t border-borde/60 pl-3">{#each dentro as a (a.id)}{@render fila(a)}{/each}</ul>{/if}
					</div>
				{/each}
			</section>
		{/snippet}

		{#if m.niveles > 0}
			{#each niveles as n (n)}{@render balda(n)}{/each}
		{/if}
		{#if enNivel(null).length || contsDe(null).length || m.niveles === 0}{@render balda(null)}{/if}
	</div>

	<aside class="hidden flex-col gap-3 lg:flex">
		{#if m.niveles > 0}
			<div class="tarjeta p-3">
				<FrenteMueble
					mueble={m}
					{contenido}
					contenedores={conts}
					{cuentaContenedor}
					resaltar={marcado}
					contenedorResaltado={contMarcado}
					color={zona?.color}
					alTocarNivel={(k) => irA(`n-${k}`)}
					alTocarContenedor={(id) => irA(`c-${id}`)}
					clase="mx-auto h-auto max-h-[26rem] w-full"
				/>
			</div>
		{/if}
		<div class="tarjeta p-2"><PlanoLocal zonas={data.plano.zonas} muebles={data.plano.muebles} resaltados={[m.id]} seleccion={m.id} compacto /></div>
	</aside>
</div>

<Hoja bind:abierta={hAnadir} titulo="Añadir a {destino?.codigo ?? m.codigo}">
	<div class="mb-3 grid grid-cols-4 gap-1 rounded-lg border border-borde bg-superficie-2 p-1">
		{#each MODOS as [v, txt] (v)}
			<button type="button" class="rounded-md py-1.5 text-xs font-semibold sm:text-sm {modoAlta === v ? 'bg-superficie-3 text-texto shadow-sm' : 'text-texto-3'}" onclick={() => (modoAlta = v)}>{txt}</button>
		{/each}
	</div>
	{#if modoAlta === 'foto' || modoAlta === 'lista'}
		{#key modoAlta}
			<AltaRapida modo={modoAlta} muebleId={m.id} {destinos} bind:indice articulos={data.articulos} alTerminar={() => (hAnadir = false)} />
		{/key}
	{:else if modoAlta === 'nuevo'}
		{#key destino?.clave}
			<ArticuloForm
				tipoInicial="herramienta"
				sitio={{ muebleId: m.id, nivel: destino?.nivel ?? null, zonaId: m.zonaId, contenedorId: destino?.contenedorId ?? null }}
				categorias={data.categoriasInv}
				ubicaciones={data.ubicaciones}
				vehiculos={data.vehiculosMenu}
				hoy={data.hoy}
				alGuardar={() => (hAnadir = false)}
			/>
		{/key}
	{:else}
		<div class="flex flex-col gap-3">
			<label class="relative">
				<Search size={15} class="absolute top-1/2 left-3 -translate-y-1/2 text-texto-3" />
				<input bind:value={filtro} class="input h-10 pl-9" placeholder="Buscar en el inventario…" />
			</label>
			<p class="text-xs text-texto-3">{filtro ? 'Coincidencias' : 'Primero lo que aún no tiene sitio'} · marca lo que guardas aquí</p>
			<ul class="tarjeta lista-filas max-h-[45dvh] overflow-y-auto">
				{#each candidatos as a (a.id)}
					<li>
						<label class="flex cursor-pointer items-center gap-3 px-3 py-2 hover:bg-superficie-2">
							<input type="checkbox" value={a.id} bind:group={elegidos} class="h-5 w-5 shrink-0 accent-[var(--acento)]" />
							<span class="min-w-0 flex-1">
								<span class="block truncate text-sm">{a.nombre}</span>
								<span class="block truncate text-xs text-texto-3">{a.sitio.codigo ? `Ahora en ${a.sitio.codigo}` : a.ubicacion ? `${a.ubicacion} · sin sitio en el plano` : 'Sin sitio'}</span>
							</span>
						</label>
					</li>
				{:else}
					<li class="px-3 py-3 text-sm text-texto-3">Nada por aquí.</li>
				{/each}
			</ul>
			<button class="btn btn-acento h-12" disabled={!elegidos.length} onclick={meter}>{elegidos.length ? `Guardar ${elegidos.length} en ${destino.codigo}` : 'Marca lo que guardas aquí'}</button>
		</div>
	{/if}
</Hoja>

<Hoja bind:abierta={hCont} titulo={contEditado ? nombreCont(contEditado) : `Nuevo contenedor en ${contNivel ? codigo(contNivel) : m.codigo}`}>
	{#key contEditado?.id ?? `n${contNivel}`}
		<form method="POST" action="/inventario/plano?/contenedor" use:enhance={enviar({ alTerminar: () => (hCont = false) })} class="flex flex-col gap-4">
			{#if contEditado}<input type="hidden" name="id" value={contEditado.id} />{/if}
			<input type="hidden" name="muebleId" value={m.id} />
			<input type="hidden" name="nivel" value={contNivel ?? ''} />
			<input type="hidden" name="tipo" value={contTipo} />
			<div class="grid grid-cols-3 gap-1.5">
				{#each TIPOS_CONTENEDOR as t (t)}
					<button type="button" class="chip h-9 justify-center {contTipo === t ? 'border-acento bg-acento/10 text-texto' : 'text-texto-3'}" onclick={() => (contTipo = t)}>{CONTENEDORES[t]}</button>
				{/each}
			</div>
			<div class="grid grid-cols-[5rem_1fr] gap-3">
				<label class="campo"><span>Letra</span><input name="letra" class="input font-mono uppercase" maxlength="2" value={contEditado?.letra ?? ''} placeholder={letraSugerida} /></label>
				<label class="campo"><span>Qué hay dentro</span><input name="nombre" class="input" value={contEditado?.nombre ?? ''} placeholder="Electricidad, sujeción, frenos…" /></label>
			</div>
			<p class="-mt-2 text-xs text-texto-3">Letras de izquierda a derecha en la balda: A es el de la izquierda. El código queda {codigo(contNivel, { letra: contEditado?.letra ?? letraSugerida } as Contenedor)}.</p>
			<button class="btn btn-acento h-12">{contEditado ? 'Guardar' : 'Añadir contenedor'}</button>
		</form>
		{#if contEditado}
			{@const c = contEditado}
			<button class="btn mt-3 w-full text-vencido" onclick={() => quitarContenedor(c)}><Trash2 size={16} /> Quitar contenedor</button>
		{/if}
	{/key}
</Hoja>

<Hoja bind:abierta={hEditar} titulo="{m.codigo} · {m.nombre}">
	{#key m.id}<MuebleForm mueble={m} existentes={data.plano.muebles} alGuardar={() => (hEditar = false)} />{/key}
</Hoja>

<Hoja bind:abierta={hVer} titulo={viendo?.nombre ?? ''}>
	{#if viendo}
		<ArticuloDetalle articulo={viendo} fotos={data.fotosInv[viendo.id] ?? []} historial={data.historial[viendo.id] ?? []} categorias={data.categoriasInv} ubicaciones={data.ubicaciones} vehiculos={data.vehiculosMenu} hoy={data.hoy} alCerrar={() => (hVer = false)} />
	{/if}
</Hoja>
