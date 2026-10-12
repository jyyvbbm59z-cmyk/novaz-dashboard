<script lang="ts">
	// Plano del local a escala (metros): muros, pilares, entradas, zonas y muebles.
	// En modo edición los muebles se arrastran y tocar un hueco propone un mueble nuevo ahí.
	import { cajaCamara, huella, PLANO_LOCAL as P, VISTA_PLANO, type Rect } from '@novaz/core';
	import { prefersReducedMotion, Tween } from 'svelte/motion';
	import { cubicInOut } from 'svelte/easing';
	import type { Mueble, Zona } from '@novaz/core/schema';

	let {
		zonas,
		muebles,
		cuentas = {},
		resaltados = [],
		seleccion = null,
		zonaSeleccionada = null,
		editable = false,
		compacto = false,
		horizontal = false,
		clase = '',
		enfoque = null,
		ruta = null,
		progresoRuta = null,
		cometa = null,
		camara = null,
		ping = null,
		alTocarMueble,
		alTocarZona,
		alTocarVacio,
		alMover
	}: {
		zonas: Zona[];
		muebles: Mueble[];
		/** Artículos por mueble (se muestra el número). */
		cuentas?: Record<number, number>;
		resaltados?: number[];
		seleccion?: number | null;
		zonaSeleccionada?: number | null;
		editable?: boolean;
		compacto?: boolean;
		/** Girado 90° (la entrada a la izquierda): para pantallas anchas. */
		horizontal?: boolean;
		clase?: string;
		/** Zona o mueble al que acercarse (con zoom animado); null = el local entero. */
		enfoque?: Rect | null;
		/** Camino desde la entrada hasta lo que se busca (se dibuja animado). */
		ruta?: { x: number; y: number }[] | null;
		/** Cuánto camino lleva dibujado (0–1); null = entero. */
		progresoRuta?: number | null;
		/** La luz que recorre el camino. */
		cometa?: { x: number; y: number } | null;
		/** Cámara fijada desde fuera fotograma a fotograma (manda sobre `enfoque`). */
		camara?: { x: number; y: number; w: number; h: number } | null;
		/** Mueble que lanza un pulso de radar. */
		ping?: number | null;
		alTocarMueble?: (id: number) => void;
		alTocarZona?: (id: number) => void;
		alTocarVacio?: (x: number, y: number) => void;
		alMover?: (id: number, x: number, y: number) => void;
	} = $props();

	const yF = (x: number) => P.fachada.izq.y + ((P.fachada.der.y - P.fachada.izq.y) * x) / P.ancho;
	/** Etiqueta de una zona, centrada en ella: el círculo con el código y, debajo, el nombre. */
	function etiquetaZona(z: Rect) {
		return { cx: z.x + z.ancho / 2, cy: z.y + z.alto / 2 };
	}
	const C = P.cuarto;
	const PE = P.puertaElectronica;
	const interior = `M0 ${yF(0)} L${P.ancho} ${yF(P.ancho)} L${P.ancho} ${P.fondo} L0 ${P.fondo} Z M${C.x} ${C.y} h${C.ancho} v${C.alto} h${-C.ancho} Z`;
	const muros = [
		`M${P.entrada.desde} ${yF(P.entrada.desde)} L0 ${yF(0)} L0 ${P.fondo} L${P.puertaFondo.desde} ${P.fondo}`,
		`M${P.entrada.hasta} ${yF(P.entrada.hasta)} L${P.ancho} ${yF(P.ancho)} L${P.ancho} ${C.y + C.alto} L${C.x} ${C.y + C.alto} L${C.x} ${P.fondo}`,
		`M${P.puertaFondo.hasta} ${P.fondo} L${P.ancho} ${P.fondo}`
	];
	const VB = VISTA_PLANO;
	const cajaDe = (r: Rect | null) => cajaCamara(r);
	const vista = new Tween(VB, { easing: cubicInOut });
	$effect(() => {
		// Acercarse es animado; volver al plano entero es instantáneo
		vista.set(cajaDe(enfoque), { duration: prefersReducedMotion.current || !enfoque ? 0 : 900 });
	});
	const zonaDe = (m: Mueble) => zonas.find((z) => z.id === m.zonaId);

	// Arrastre (solo en edición): posición provisional mientras se mueve
	let svg: SVGSVGElement;
	let dibujo: SVGGElement;
	let arrastre = $state<{ id: number; dx: number; dy: number; x: number; y: number; movido: boolean } | null>(null);
	function punto(e: PointerEvent | MouseEvent) {
		// En coordenadas del plano (con el giro, si lo hay)
		const m = dibujo.getScreenCTM();
		if (!m) return { x: 0, y: 0 };
		const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse());
		return { x: p.x, y: p.y };
	}
	const redondear = (v: number) => Math.round(v * 20) / 20;
	function empezar(e: PointerEvent, m: Mueble) {
		e.stopPropagation();
		if (!editable) return alTocarMueble?.(m.id);
		const p = punto(e);
		(e.currentTarget as Element).setPointerCapture(e.pointerId);
		arrastre = { id: m.id, dx: p.x - m.x, dy: p.y - m.y, x: m.x, y: m.y, movido: false };
	}
	function mover(e: PointerEvent) {
		if (!arrastre) return;
		const p = punto(e);
		const x = redondear(p.x - arrastre.dx);
		const y = redondear(p.y - arrastre.dy);
		if (Math.abs(x - arrastre.x) + Math.abs(y - arrastre.y) > 0) arrastre = { ...arrastre, x, y, movido: true };
	}
	function soltar() {
		if (!arrastre) return;
		const a = arrastre;
		arrastre = null;
		if (a.movido) alMover?.(a.id, a.x, a.y);
		else alTocarMueble?.(a.id);
	}
	function tocarFondo(e: MouseEvent, zonaId?: number) {
		if (editable) {
			const p = punto(e);
			alTocarVacio?.(redondear(p.x), redondear(p.y));
		} else if (zonaId) alTocarZona?.(zonaId);
	}
	// En horizontal se gira el dibujo 90° a la izquierda: (x, y) del plano → (y, ancho − x) en pantalla
	const giro = $derived(horizontal ? `translate(0 ${P.ancho}) rotate(-90)` : undefined);
	const caja = (c: { x: number; y: number; w: number; h: number }) => (horizontal ? `${c.y} ${P.ancho - c.x - c.w} ${c.h} ${c.w}` : `${c.x} ${c.y} ${c.w} ${c.h}`);
	/** Los textos se quedan derechos aunque el plano esté girado (vertical: el giro que lleven en vertical). */
	const recto = (x: number, y: number, enVertical = 0) => {
		const a = horizontal ? 90 : enVertical;
		return a ? `rotate(${a} ${x} ${y})` : undefined;
	};
	/** El código de un mueble estrecho (un panel) va a lo largo; el resto, derecho. */
	function codigoGirado(h: Rect) {
		const cx = h.x + h.ancho / 2;
		const cy = h.y + h.alto / 2;
		const estrecho = Math.min(h.ancho, h.alto) < 0.5 && Math.max(h.ancho, h.alto) > 1;
		if (!estrecho) return recto(cx, cy);
		const largoEnY = h.alto > h.ancho;
		const a = horizontal ? (largoEnY ? 90 : 0) : largoEnY ? -90 : 0;
		return a ? `rotate(${a} ${cx} ${cy})` : undefined;
	}
	const pos = (m: Mueble) => (arrastre?.id === m.id ? { ...m, x: arrastre.x, y: arrastre.y } : m);
	const m2 = (x: number) => x.toLocaleString('es-ES', { minimumFractionDigits: 2 });
</script>

<svg
	bind:this={svg}
	viewBox={caja(camara ?? vista.current)}
	class="plano block h-auto w-full touch-none select-none {editable ? 'editando' : ''} {clase}"
	role="img"
	aria-label="Plano del local"
	onpointermove={mover}
	onpointerup={soltar}
	onpointercancel={() => (arrastre = null)}
>
	<defs>
		<clipPath id="clip-local"><path d={interior} /></clipPath>
		<radialGradient id="luz">
			<stop offset="0" stop-color="var(--acento)" stop-opacity="0.95" />
			<stop offset="0.35" stop-color="var(--acento)" stop-opacity="0.35" />
			<stop offset="1" stop-color="var(--acento)" stop-opacity="0" />
		</radialGradient>
		<linearGradient id="rastro" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="7" y2="15">
			<stop offset="0" stop-color="var(--acento)" stop-opacity="0.55" />
			<stop offset="1" stop-color="var(--acento)" />
		</linearGradient>
		<filter id="halo" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="0.08" /></filter>
		<pattern id="rejilla" width="1" height="1" patternUnits="userSpaceOnUse"><path d="M1 0 L0 0 0 1" fill="none" stroke="var(--trama-plano)" stroke-width="0.012" /></pattern>
	</defs>

	<g bind:this={dibujo} transform={giro}>
	<!-- Suelo con rejilla de 1 m -->
	<path d={interior} fill="var(--superficie-2)" />
	<path d={interior} fill="url(#rejilla)" />

	<!-- Zonas -->
	<g clip-path="url(#clip-local)">
		{#each zonas as z (z.id)}
			<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
			<rect
				x={z.x}
				y={z.y}
				width={z.ancho}
				height={z.alto}
				fill={z.color}
				fill-opacity={zonaSeleccionada === z.id ? 0.22 : 0.09}
				stroke={z.color}
				stroke-opacity="0.55"
				stroke-width="0.03"
				stroke-dasharray="0.12 0.08"
				class="cursor-pointer"
				onclick={(e) => tocarFondo(e, z.id)}
			/>
		{/each}
	</g>
	{#each zonas as z (z.id)}
		{@const { cx, cy } = etiquetaZona(z)}
		{@const cc = compacto ? cy : cy - 0.18}
		<g class="pointer-events-none" transform={recto(cx, cy)}>
			<circle cx={cx} cy={cc} r="0.26" fill={z.color} />
			<text x={cx} y={cc + (z.codigo.length > 1 ? 0.08 : 0.11)} text-anchor="middle" class="letra-zona" font-size={z.codigo.length > 1 ? 0.22 : 0.3}>{z.codigo}</text>
			{#if !compacto}<text x={cx} y={cy + 0.42} text-anchor="middle" class="nombre-zona" fill={z.color}>{z.nombre}</text>{/if}
		</g>
	{/each}

	<!-- Estructura: muros, pilares, entradas -->
	<g class="pointer-events-none">
		{#each muros as d (d)}<path {d} fill="none" stroke="var(--texto-2)" stroke-width={P.muro} stroke-linejoin="miter" />{/each}
		<line x1={P.entrada.desde} y1={yF(P.entrada.desde)} x2={P.entrada.hasta} y2={yF(P.entrada.hasta)} stroke="var(--texto-3)" stroke-width="0.05" stroke-dasharray="0.15 0.1" />
		{#each [...P.pilares, ...P.pilastras] as p, i (i)}<rect x={p.x} y={p.y} width={p.ancho} height={p.alto} fill="var(--texto-2)" />{/each}
		<!-- Tabiques del cuarto de electrónica y su puerta -->
		{#each P.tabiques as w, i (i)}<line x1={w.x1} y1={w.y1} x2={w.x2} y2={w.y2} stroke="var(--texto-2)" stroke-width="0.1" stroke-linecap="square" />{/each}
		<!-- Puerta de electrónica: abre hacia dentro a izquierdas (bisagra abajo) -->
		<path d="M{PE.x} {PE.desde} A{PE.hasta - PE.desde} {PE.hasta - PE.desde} 0 0 0 {PE.x - (PE.hasta - PE.desde)} {PE.hasta} L{PE.x} {PE.hasta}" fill="none" stroke="var(--texto-3)" stroke-width="0.025" />
		<!-- Puerta corredera del baño: la hoja va por delante del muro -->
		<line x1={P.puertaFondo.desde - 0.05} y1={P.fondo - 0.16} x2={P.puertaFondo.hasta + 0.05} y2={P.fondo - 0.16} stroke="var(--texto-3)" stroke-width="0.05" />
		<line x1={P.puertaFondo.hasta + 0.05} y1={P.fondo - 0.16} x2={P.puertaFondo.hasta + 0.6} y2={P.fondo - 0.16} stroke="var(--texto-3)" stroke-width="0.02" stroke-dasharray="0.06 0.05" />
		{#if !compacto}
			<text x={(P.entrada.desde + P.entrada.hasta) / 2} y={yF(2) - 0.32} text-anchor="middle" class="cota">ENTRADA · 3,00 m</text>
			<text x={P.ancho + 0.3} y={P.fondo / 2} text-anchor="middle" class="cota" transform={recto(P.ancho + 0.3, P.fondo / 2, 90)}>{m2(P.fondo)} m</text>
			<text x={-0.27} y={P.fondo / 2} text-anchor="middle" class="cota" transform={recto(-0.27, P.fondo / 2, -90)}>{m2(P.fondo - yF(0))} m</text>
			<text x={C.x / 2} y={P.fondo + 0.42} text-anchor="middle" class="cota">← {m2(P.ancho)} m →</text>
		{/if}
	</g>

	<!-- Ruta desde la entrada: un rastro de luz que se va dibujando -->
	{#if ruta && ruta.length > 1}
		{@const d = `M${ruta.map((p) => `${p.x.toFixed(3)} ${p.y.toFixed(3)}`).join(' L')}`}
		{@const hecho = progresoRuta ?? 1}
		<g class="pointer-events-none">
			<path {d} pathLength="1" fill="none" stroke="var(--acento)" stroke-opacity="0.18" stroke-width="0.22" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="1" stroke-dashoffset={1 - hecho} filter="url(#halo)" />
			<path {d} pathLength="1" fill="none" stroke="url(#rastro)" stroke-width="0.055" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="1" stroke-dashoffset={1 - hecho} />
			{#if hecho >= 1}<path {d} fill="none" stroke="var(--acento)" stroke-width="0.03" stroke-dasharray="0.04 0.26" stroke-linecap="round" class="ruta-flujo" />{/if}
			<circle cx={ruta[0].x} cy={ruta[0].y} r="0.07" fill="var(--acento)" opacity="0.7" />
		</g>
	{/if}
	{#if cometa}
		<g class="pointer-events-none">
			<circle cx={cometa.x} cy={cometa.y} r="0.5" fill="url(#luz)" />
			<circle cx={cometa.x} cy={cometa.y} r="0.075" fill="#fff" />
		</g>
	{/if}

	<!-- Muebles -->
	{#each muebles as m (m.id)}
		{@const h = huella(pos(m))}
		{@const z = zonaDe(m)}
		{@const color = z?.color ?? 'var(--texto-3)'}
		{@const res = resaltados.includes(m.id)}
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<g class="mueble {editable ? 'cursor-move' : 'cursor-pointer'} {res ? 'resaltado' : ''}" onpointerdown={(e) => empezar(e, m)}>
			<rect x={h.x - 0.12} y={h.y - 0.12} width={h.ancho + 0.24} height={h.alto + 0.24} fill="transparent" />
			<rect
				x={h.x}
				y={h.y}
				width={h.ancho}
				height={h.alto}
				rx="0.04"
				fill={color}
				fill-opacity={seleccion === m.id || res ? 0.85 : 0.45}
				stroke={res ? 'var(--acento)' : seleccion === m.id ? 'var(--texto)' : color}
				stroke-width={res || seleccion === m.id ? 0.07 : 0.03}
			/>
			{#if res}<rect x={h.x} y={h.y} width={h.ancho} height={h.alto} rx="0.04" fill="none" stroke="var(--acento)" stroke-width="0.05" class="pulso" />{/if}
			{#if ping === m.id}
				<circle cx={h.x + h.ancho / 2} cy={h.y + h.alto / 2} r={Math.max(h.ancho, h.alto) * 0.9} fill="url(#luz)" class="respira" />
				{#each [0, 0.8] as retraso (retraso)}
					<circle cx={h.x + h.ancho / 2} cy={h.y + h.alto / 2} r={Math.max(h.ancho, h.alto) * 0.6} fill="none" stroke="var(--acento)" stroke-width="0.025" class="radar" style="animation-delay: {retraso}s" />
				{/each}
			{/if}
			<text x={h.x + h.ancho / 2} y={h.y + h.alto / 2 + 0.1} transform={codigoGirado(h)} text-anchor="middle" class="codigo-mueble" font-size={Math.min(0.3, Math.max(0.16, Math.min(h.ancho, h.alto) * 0.9))}>{m.codigo}</text>
			{#if !compacto && cuentas[m.id] && Math.min(h.ancho, h.alto) >= 0.4}
				<text x={h.x + h.ancho - 0.05} y={h.y + 0.16} transform={recto(h.x + h.ancho - 0.1, h.y + 0.1)} text-anchor="end" class="cuenta-mueble">{cuentas[m.id]}</text>
			{/if}
		</g>
	{/each}
	</g>
</svg>

<style>
	.plano {
		--trama-plano: color-mix(in oklab, var(--texto) 9%, transparent);
		font-family: var(--font-sans);
	}
	.letra-zona {
		font-weight: 800;
		fill: #fff;
	}
	.nombre-zona {
		font-size: 0.26px;
		font-weight: 600;
	}
	.cota {
		font-size: 0.2px;
		fill: var(--texto-3);
		letter-spacing: 0.01px;
	}
	.codigo-mueble {
		font-weight: 800;
		fill: var(--texto);
		pointer-events: none;
		font-family: var(--font-mono);
	}
	.cuenta-mueble {
		font-size: 0.14px;
		font-weight: 700;
		fill: var(--texto-2);
		pointer-events: none;
	}
	.mueble:hover rect:nth-child(2) {
		fill-opacity: 0.75;
	}
	.editando .mueble rect:nth-child(2) {
		stroke-dasharray: 0.08 0.05;
	}
	.pulso {
		animation: pulso 1.4s ease-out infinite;
		transform-box: fill-box;
		transform-origin: center;
	}
	@keyframes pulso {
		from {
			opacity: 1;
			transform: scale(1);
		}
		to {
			opacity: 0;
			transform: scale(1.8);
		}
	}
	.ruta-flujo {
		opacity: 0.8;
		animation: fluir 1.6s linear infinite;
	}
	@keyframes fluir {
		to {
			stroke-dashoffset: -0.3;
		}
	}
	.respira {
		transform-box: fill-box;
		transform-origin: center;
		animation: respira 2.2s ease-in-out infinite;
	}
	@keyframes respira {
		0%,
		100% {
			opacity: 0.35;
			transform: scale(0.85);
		}
		50% {
			opacity: 0.7;
			transform: scale(1.1);
		}
	}
	.radar {
		transform-box: fill-box;
		transform-origin: center;
		opacity: 0;
		animation: radar 1.6s cubic-bezier(0.2, 0.6, 0.3, 1) infinite;
	}
	@keyframes radar {
		0% {
			opacity: 0.9;
			transform: scale(0.4);
		}
		100% {
			opacity: 0;
			transform: scale(2.6);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.pulso,
		.ruta-flujo,
		.respira,
		.radar {
			animation: none;
		}
	}
</style>
