<script lang="ts">
	// «¿Dónde está?» animado, en un solo movimiento continuo:
	// el plano entero con el mueble señalado → una luz sale de la persiana y recorre el camino mientras la cámara la sigue
	// y se acerca → el mueble se despliega desde su sitio en el plano → una luz cae flotando hasta la balda y se posa
	// (con física de muelle) → el nombre aparece letra a letra.
	import { caminoEnLocal, nombreNivel, cajaCamara, codigoUbicacion, CONTENEDORES, huella, MUEBLES, VISTA_PLANO, type Camara } from '@novaz/core';
	import type { Contenedor, Mueble, Zona } from '@novaz/core/schema';
	import { ArrowRight, RotateCcw, X } from '@lucide/svelte';
	import { prefersReducedMotion, Spring } from 'svelte/motion';
	import { fade } from 'svelte/transition';
	import { tick } from 'svelte';
	import FrenteMueble from './FrenteMueble.svelte';
	import PlanoLocal from './PlanoLocal.svelte';

	let {
		articulo,
		zonas,
		muebles,
		contenido,
		contenedores = [],
		cuentaContenedor = {},
		horizontal = false,
		alCerrar
	}: {
		articulo: { id: number; nombre: string; muebleId: number | null; nivel: number | null; zonaId: number | null; contenedorId: number | null; ubicacion: string | null };
		/** Contenedores del mueble (cubos, maletines…). */
		contenedores?: Contenedor[];
		cuentaContenedor?: Record<number, number>;
		zonas: Zona[];
		muebles: Mueble[];
		/** Lo que hay en cada nivel del mueble (para dibujarlo). */
		contenido: Record<number, string[]>;
		alCerrar?: () => void;
		/** Plano girado (pantallas anchas). */
		horizontal?: boolean;
	} = $props();

	type Pt = { x: number; y: number };
	type Fase = 'mirar' | 'viaje' | 'llegada' | 'dentro' | 'balda';

	const mueble = $derived(muebles.find((m) => m.id === articulo.muebleId) ?? null);
	const zona = $derived(zonas.find((z) => z.id === (mueble ? mueble.zonaId : articulo.zonaId)) ?? null);
	const destino = $derived(mueble ? huella(mueble) : zona);
	const nivel = $derived(mueble && articulo.nivel && articulo.nivel <= mueble.niveles ? articulo.nivel : null);
	const contenedor = $derived(contenedores.find((c) => c.id === articulo.contenedorId) ?? null);

	// ─── El camino: de la persiana al mueble por los pasillos, con las esquinas redondeadas ─────
	const esquinas = (): Pt[] => (destino ? caminoEnLocal(destino, { mueble: !!mueble, zona }) : []);
	/** Polilínea → curva muestreada (arcos suaves en cada giro). */
	function suavizar(pts: Pt[], radio = 0.8): Pt[] {
		if (pts.length < 3) return pts;
		const out: Pt[] = [pts[0]];
		for (let i = 1; i < pts.length - 1; i++) {
			const [a, b, c] = [pts[i - 1], pts[i], pts[i + 1]];
			const d1 = Math.hypot(b.x - a.x, b.y - a.y);
			const d2 = Math.hypot(c.x - b.x, c.y - b.y);
			const r = Math.min(radio, d1 / 2, d2 / 2);
			if (!r) continue;
			const p1 = { x: b.x + ((a.x - b.x) * r) / d1, y: b.y + ((a.y - b.y) * r) / d1 };
			const p2 = { x: b.x + ((c.x - b.x) * r) / d2, y: b.y + ((c.y - b.y) * r) / d2 };
			for (let k = 0; k <= 12; k++) {
				const t = k / 12;
				out.push({ x: (1 - t) ** 2 * p1.x + 2 * (1 - t) * t * b.x + t ** 2 * p2.x, y: (1 - t) ** 2 * p1.y + 2 * (1 - t) * t * b.y + t ** 2 * p2.y });
			}
		}
		out.push(pts[pts.length - 1]);
		return out;
	}
	const ruta = $derived(suavizar(esquinas()));
	const tramos = $derived.by(() => {
		const acum = [0];
		for (let i = 1; i < ruta.length; i++) acum.push(acum[i - 1] + Math.hypot(ruta[i].x - ruta[i - 1].x, ruta[i].y - ruta[i - 1].y));
		return acum;
	});
	function puntoEn(p: number): Pt {
		const total = tramos[tramos.length - 1] || 1;
		const objetivo = p * total;
		const i = tramos.findIndex((l) => l >= objetivo);
		if (i <= 0) return ruta[0];
		const k = (objetivo - tramos[i - 1]) / (tramos[i] - tramos[i - 1] || 1);
		return { x: ruta[i - 1].x + (ruta[i].x - ruta[i - 1].x) * k, y: ruta[i - 1].y + (ruta[i].y - ruta[i - 1].y) * k };
	}

	// ─── Estado de la animación ──────────────────────────────────────────────
	let fase = $state<Fase>('mirar');
	let progreso = $state(0);
	let cometa = $state<Pt | null>(null);
	let camara = $state<Camara>(VISTA_PLANO);
	const foco = new Spring(0.3, { stiffness: 0.07, damping: 0.3 });
	let verFoco = $state(false);
	let escenario = $state<HTMLElement>();
	let capa = $state<HTMLElement>();

	const final = $derived<Fase>(mueble ? (mueble.niveles > 0 ? 'balda' : 'llegada') : zona ? 'llegada' : 'mirar');
	const camaraFinal = $derived(cajaCamara(destino));
	const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
	const suave = (k: number) => -(Math.cos(Math.PI * k) - 1) / 2;
	const entradaSalida = (k: number) => (k < 0.5 ? 4 * k ** 3 : 1 - (-2 * k + 2) ** 3 / 2);

	let marco = 0;
	let relojes: ReturnType<typeof setTimeout>[] = [];
	function parar() {
		cancelAnimationFrame(marco);
		relojes.forEach(clearTimeout);
		relojes = [];
	}
	const luego = (ms: number, f: () => void) => relojes.push(setTimeout(f, ms));

	function irAlFinal() {
		parar();
		progreso = 1;
		cometa = null;
		camara = camaraFinal;
		verFoco = false;
		if (nivel) foco.set(nivel, { instant: true });
		fase = final;
	}

	function viajar(duracion: number) {
		const t0 = performance.now();
		const VB = VISTA_PLANO;
		const fin = camaraFinal;
		const paso = (ahora: number) => {
			const u = Math.min((ahora - t0) / duracion, 1);
			const s = suave(u);
			progreso = s;
			const c = puntoEn(s);
			cometa = c;
			// La cámara se acerca poco a poco siguiendo a la luz y al final se centra en el destino
			const z = entradaSalida(u);
			const w = lerp(VB.w, fin.w, z);
			const h = lerp(VB.h, fin.h, z);
			const sigue = Math.min(u / 0.55, 1);
			const cx0 = lerp(VB.x + VB.w / 2, c.x, sigue * 0.75);
			const cy0 = lerp(VB.y + VB.h / 2, c.y, sigue * 0.75);
			const cx = lerp(cx0, fin.x + fin.w / 2, z ** 2);
			const cy = lerp(cy0, fin.y + fin.h / 2, z ** 2);
			camara = { x: cx - w / 2, y: cy - h / 2, w, h };
			if (u < 1) marco = requestAnimationFrame(paso);
			else llegar();
		};
		marco = requestAnimationFrame(paso);
	}

	function llegar() {
		fase = 'llegada';
		luego(250, () => (cometa = null));
		if (final !== 'balda' || !mueble) return;
		luego(650, entrar);
	}

	/** El mueble se despliega desde donde está en el plano hasta ocupar el escenario. */
	async function entrar() {
		fase = 'dentro';
		verFoco = false;
		foco.set(0.2, { instant: true });
		await tick();
		const svgPlano = escenario?.querySelector<SVGSVGElement>('svg.plano');
		const dibujo = capa?.querySelector<SVGSVGElement>('svg');
		const ctm = svgPlano?.getScreenCTM();
		if (svgPlano && dibujo && ctm && destino) {
			const a = new DOMPoint(destino.x, destino.y).matrixTransform(ctm);
			const b = new DOMPoint(destino.x + destino.ancho, destino.y + destino.alto).matrixTransform(ctm);
			const r = dibujo.getBoundingClientRect();
			const desde = `translate(${a.x - r.left}px, ${a.y - r.top}px) scale(${Math.max((b.x - a.x) / r.width, 0.02)}, ${Math.max((b.y - a.y) / r.height, 0.02)})`;
			dibujo.animate(
				[
					{ transform: desde, opacity: 0.4 },
					{ transform: 'none', opacity: 1 }
				],
				{ duration: 780, easing: 'cubic-bezier(0.2, 0.85, 0.25, 1)', fill: 'both' }
			);
		}
		if (!nivel) return void luego(800, () => (fase = 'balda'));
		// La luz cae desde arriba y se posa en la balda (con su rebote natural)
		luego(700, () => {
			verFoco = true;
			foco.target = nivel;
		});
		luego(1900, () => {
			verFoco = false;
			fase = 'balda';
		});
	}

	function animar() {
		parar();
		if (prefersReducedMotion.current || !destino) return irAlFinal();
		fase = 'mirar';
		progreso = 0;
		cometa = ruta[0] ?? null;
		camara = VISTA_PLANO;
		verFoco = false;
		luego(550, () => {
			fase = 'viaje';
			viajar(Math.min(2600, 1500 + (tramos[tramos.length - 1] ?? 0) * 60));
		});
	}
	$effect(() => {
		void articulo.id;
		animar();
		return parar;
	});

	const pasos = $derived(
		[
			zona && { k: 'mirar' as Fase, t: `Zona ${zona.codigo} · ${zona.nombre}` },
			mueble && { k: 'llegada' as Fase, t: `${mueble.nombre} ${mueble.codigo}` },
			mueble && nivel && { k: 'balda' as Fase, t: nombreNivel(mueble, nivel) },
			contenedor && { k: 'balda' as Fase, t: `${CONTENEDORES[contenedor.tipo]} ${contenedor.letra}${contenedor.nombre ? ` · ${contenedor.nombre}` : ''}` }
		].filter(Boolean) as { k: Fase; t: string }[]
	);
	const orden: Fase[] = ['mirar', 'viaje', 'llegada', 'dentro', 'balda'];
	const llegado = (k: Fase) => orden.indexOf(fase) >= orden.indexOf(k);
	const dentro = $derived(mueble && (fase === 'dentro' || fase === 'balda'));
</script>

<div class="flex flex-col gap-2">
	<!-- Lo que se busca y el código -->
	<div class="flex items-center gap-3 px-1">
		<span class="rounded-lg px-2.5 py-1 font-mono text-lg font-extrabold text-white transition-opacity duration-700 {fase === final ? 'opacity-100' : 'opacity-40'}" style="background: {zona?.color ?? 'var(--texto-3)'}">
			{codigoUbicacion(zona, mueble, articulo.nivel, contenedor) ?? '¿?'}
		</span>
		<p class="min-w-0 flex-1 truncate text-sm font-semibold">{articulo.nombre}</p>
		<button class="btn btn-fantasma btn-icono h-8 w-8" onclick={animar} aria-label="Repetir" title="Repetir"><RotateCcw size={15} /></button>
		{#if alCerrar}<button class="btn btn-fantasma btn-icono h-8 w-8" onclick={alCerrar} aria-label="Cerrar" title="Cerrar"><X size={16} /></button>{/if}
	</div>

	<!-- Escenario -->
	<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
	<div bind:this={escenario} class="relative overflow-hidden rounded-lg" onclick={() => fase !== final && irAlFinal()}>
		<PlanoLocal
			{zonas}
			{muebles}
			{camara}
			{ruta}
			progresoRuta={progreso}
			{cometa}
			ping={mueble && fase !== 'balda' && fase !== 'dentro' ? mueble.id : null}
			zonaSeleccionada={zona?.id ?? null}
			resaltados={mueble ? [mueble.id] : []}
			{horizontal}
			clase="max-h-[70dvh]"
		/>
		{#if dentro && mueble}
			<div class="absolute inset-0 bg-superficie/85 backdrop-blur-sm" transition:fade={{ duration: prefersReducedMotion.current ? 0 : 500 }}></div>
			<div bind:this={capa} class="absolute inset-0 flex items-center justify-center p-4" transition:fade={{ duration: 200 }}>
				<FrenteMueble
					{mueble}
					{contenido}
					{contenedores}
					{cuentaContenedor}
					contenedorResaltado={fase === 'balda' ? (contenedor?.id ?? null) : null}
					resaltar={fase === 'balda' ? nivel : null}
					foco={verFoco ? foco.current : null}
					destacado={fase === 'balda' ? articulo.nombre : null}
					color={zona?.color}
					clase="h-full max-h-full w-auto max-w-full origin-top-left"
				/>
			</div>
		{/if}
		{#if fase !== final}<p class="pointer-events-none absolute right-2 bottom-2 rounded bg-superficie/80 px-2 py-0.5 text-[0.65rem] text-texto-3">Toca para saltar</p>{/if}
	</div>

	<!-- Migas: se encienden según llega -->
	<ol class="flex flex-wrap items-center gap-1.5 px-1 text-xs">
		{#each pasos as p, i (`${p.k}${i}`)}
			{#if i}<ArrowRight size={12} class="text-texto-3" />{/if}
			<li class="chip h-7 px-2.5 transition-all duration-700 {llegado(p.k) ? 'border-acento/60 bg-acento/10 font-semibold text-texto' : 'text-texto-3 opacity-50'}">{p.t}</li>
		{:else}
			<li class="text-texto-3">Aún no tiene sitio en el plano{articulo.ubicacion ? ` (apuntado: ${articulo.ubicacion})` : ''}.</li>
		{/each}
	</ol>
	{#if mueble}
		<a href="/inventario/mueble/{mueble.id}?articulo={articulo.id}" class="btn h-10 text-sm">Abrir {mueble.codigo} · {mueble.nombre} <ArrowRight size={15} /></a>
	{/if}
</div>
