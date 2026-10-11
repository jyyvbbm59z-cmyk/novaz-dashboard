<script lang="ts">
	// Plano del local a escala (metros): muros, pilares, entradas, zonas y muebles.
	// En modo edición los muebles se arrastran y tocar un hueco propone un mueble nuevo ahí.
	import { huella, PLANO_LOCAL as P } from '@novaz/core';
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
		clase = '',
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
		clase?: string;
		alTocarMueble?: (id: number) => void;
		alTocarZona?: (id: number) => void;
		alTocarVacio?: (x: number, y: number) => void;
		alMover?: (id: number, x: number, y: number) => void;
	} = $props();

	const yF = (x: number) => P.fachada.izq.y + ((P.fachada.der.y - P.fachada.izq.y) * x) / P.ancho;
	const C = P.cuarto;
	const interior = `M0 ${yF(0)} L${P.ancho} ${yF(P.ancho)} L${P.ancho} ${P.fondo} L0 ${P.fondo} Z M${C.x} ${C.y} h${C.ancho} v${C.alto} h${-C.ancho} Z`;
	const muros = [
		`M${P.entrada.desde} ${yF(P.entrada.desde)} L0 ${yF(0)} L0 ${P.fondo} L${P.puertaFondo.desde} ${P.fondo}`,
		`M${P.entrada.hasta} ${yF(P.entrada.hasta)} L${P.ancho} ${yF(P.ancho)} L${P.ancho} ${C.y + C.alto} L${C.x} ${C.y + C.alto} L${C.x} ${P.fondo}`,
		`M${P.puertaFondo.hasta} ${P.fondo} L${P.ancho} ${P.fondo}`
	];
	const VB = { x: -0.45, y: -0.75, w: P.ancho + 0.9, h: C.y + C.alto + 1.0 };
	const zonaDe = (m: Mueble) => zonas.find((z) => z.id === m.zonaId);

	// Arrastre (solo en edición): posición provisional mientras se mueve
	let svg: SVGSVGElement;
	let arrastre = $state<{ id: number; dx: number; dy: number; x: number; y: number; movido: boolean } | null>(null);
	function punto(e: PointerEvent | MouseEvent) {
		const m = svg.getScreenCTM();
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
	const pos = (m: Mueble) => (arrastre?.id === m.id ? { ...m, x: arrastre.x, y: arrastre.y } : m);
	const m2 = (x: number) => x.toLocaleString('es-ES', { minimumFractionDigits: 2 });
</script>

<svg
	bind:this={svg}
	viewBox="{VB.x} {VB.y} {VB.w} {VB.h}"
	class="plano block h-auto w-full touch-none select-none {editable ? 'editando' : ''} {clase}"
	role="img"
	aria-label="Plano del local"
	onpointermove={mover}
	onpointerup={soltar}
	onpointercancel={() => (arrastre = null)}
>
	<defs>
		<clipPath id="clip-local"><path d={interior} /></clipPath>
		<pattern id="rejilla" width="1" height="1" patternUnits="userSpaceOnUse"><path d="M1 0 L0 0 0 1" fill="none" stroke="var(--trama-plano)" stroke-width="0.012" /></pattern>
	</defs>

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
		{@const lx = z.x + 0.62}
		{@const ly = Math.max(z.y, yF(z.x + 0.3)) + 0.78}
		<g class="pointer-events-none">
			<circle cx={lx} cy={ly} r="0.26" fill={z.color} />
			<text x={lx} y={ly + 0.11} text-anchor="middle" class="letra-zona">{z.codigo}</text>
			{#if !compacto}<text x={lx + 0.38} y={ly + 0.09} class="nombre-zona" fill={z.color}>{z.nombre}</text>{/if}
		</g>
	{/each}

	<!-- Estructura: muros, pilares, entradas -->
	<g class="pointer-events-none">
		{#each muros as d (d)}<path {d} fill="none" stroke="var(--texto-2)" stroke-width={P.muro} stroke-linejoin="miter" />{/each}
		<line x1={P.entrada.desde} y1={yF(P.entrada.desde)} x2={P.entrada.hasta} y2={yF(P.entrada.hasta)} stroke="var(--texto-3)" stroke-width="0.05" stroke-dasharray="0.15 0.1" />
		{#each [...P.pilares, ...P.pilastras] as p, i (i)}<rect x={p.x} y={p.y} width={p.ancho} height={p.alto} fill="var(--texto-2)" />{/each}
		<path d="M{P.puertaFondo.desde} {P.fondo} A{P.puertaFondo.hasta - P.puertaFondo.desde} {P.puertaFondo.hasta - P.puertaFondo.desde} 0 0 0 {P.puertaFondo.hasta} {P.fondo - (P.puertaFondo.hasta - P.puertaFondo.desde)}" fill="none" stroke="var(--texto-3)" stroke-width="0.025" />
		{#if !compacto}
			<text x={(P.entrada.desde + P.entrada.hasta) / 2} y={yF(2) - 0.32} text-anchor="middle" class="cota">ENTRADA · 3,00 m</text>
			<text x={P.ancho + 0.3} y={P.fondo / 2} text-anchor="middle" class="cota" transform="rotate(90 {P.ancho + 0.3} {P.fondo / 2})">{m2(P.fondo)} m</text>
			<text x={-0.27} y={P.fondo / 2} text-anchor="middle" class="cota" transform="rotate(-90 -0.27 {P.fondo / 2})">{m2(P.fondo - yF(0))} m</text>
			<text x={C.x / 2} y={P.fondo + 0.42} text-anchor="middle" class="cota">← {m2(P.ancho)} m →</text>
		{/if}
	</g>

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
			<text x={h.x + h.ancho / 2} y={h.y + h.alto / 2 + 0.1} text-anchor="middle" class="codigo-mueble" font-size={Math.min(0.3, Math.max(0.16, Math.min(h.ancho, h.alto) * 0.9))}>{m.codigo}</text>
			{#if !compacto && cuentas[m.id] && Math.min(h.ancho, h.alto) >= 0.4}
				<text x={h.x + h.ancho - 0.05} y={h.y + 0.16} text-anchor="end" class="cuenta-mueble">{cuentas[m.id]}</text>
			{/if}
		</g>
	{/each}

</svg>

<style>
	.plano {
		--trama-plano: color-mix(in oklab, var(--texto) 9%, transparent);
		font-family: var(--font-sans);
	}
	.letra-zona {
		font-size: 0.3px;
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
	@media (prefers-reduced-motion: reduce) {
		.pulso {
			animation: none;
		}
	}
</style>
