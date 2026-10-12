<script lang="ts">
	// Un mueble visto de frente con sus baldas, cajones o filas, y lo que hay en cada una.
	// Puede encender una balda (la de lo que buscas) y poner encima el nombre.
	import { conRejilla, CONTENEDORES, nivelesMueble, nombreDeNivel, nombreNivel as nombreDe, ordenLetra, rejillaBalda, REJILLA } from '@novaz/core';
	import type { Mueble, TipoContenedor } from '@novaz/core/schema';

	let {
		mueble,
		contenido = {},
		resaltar = null,
		foco = null,
		contenedores = [],
		cuentaContenedor = {},
		contenedorResaltado = null,
		alTocarContenedor,
		destacado = null,
		color = 'var(--texto-3)',
		alTocarNivel,
		clase = ''
	}: {
		mueble: Mueble;
		/** Nombres de lo que hay en cada nivel (0 = sin nivel concreto). */
		contenido?: Record<number, string[]>;
		resaltar?: number | null;
		/** Cubos, maletines o cajas de cada balda (se dibujan de izquierda a derecha por su letra). */
		contenedores?: { id: number; nivel: number | null; letra: string; nombre: string; tipo: TipoContenedor; columna?: number | null; ancho?: number | null; piso?: number | null; alto?: number | null }[];
		cuentaContenedor?: Record<number, number>;
		contenedorResaltado?: number | null;
		alTocarContenedor?: (id: number) => void;
		/** Luz que flota entre niveles (número con decimales: 2,4 = entre la 2 y la 3). */
		foco?: number | null;
		/** Nombre de lo que se busca (se escribe en la balda resaltada). */
		destacado?: string | null;
		color?: string;
		alTocarNivel?: (n: number) => void;
		clase?: string;
	} = $props();

	const ALTO: Record<string, number> = { estanteria: 1.8, armario: 1.9, cajonera: 0.95, panel: 1.0, banco: 0.9, carro: 0.9, equipo: 1.0, otro: 1.0 };
	const W = $derived(Math.max(mueble.ancho, 0.5));
	// Un carro o cajonera a medida crece con sus filas (un cofre sobre un carro es más alto)
	const unidades = $derived(mueble.disposicion?.filas.reduce((s, f) => s + f.alto, 0) ?? 0);
	/** Carro de cestas (tipo Råskog de Ikea): cestas hondas, tubos a los lados, bastidor y ruedas. */
	const raskog = $derived(mueble.tipo === 'carro' && nombreDeNivel(mueble) === 'cesta');
	const H = $derived(raskog ? 0.78 : Math.max(ALTO[mueble.tipo] ?? 1, ['carro', 'cajonera'].includes(mueble.tipo) ? unidades * 0.085 + 0.16 : 0));
	const n = $derived(Math.max(mueble.niveles, 0));
	const fs = $derived(Math.max(W, H) / 20);
	const g = 0.04; // grosor de tableros

	interface Hueco {
		nivel: number;
		x: number;
		y: number;
		w: number;
		h: number;
		/** Hueco abierto (sin cajón). */
		abierto?: boolean;
		/** Empieza otra pieza: se dibuja la separación encima. */
		aparte?: boolean;
	}
	const SEP = 0.05;
	/** Dónde cae cada nivel en el frente, según el tipo de mueble y cómo se numera. */
	const huecos = $derived.by((): Hueco[] => {
		if (!n) return [];
		const t = mueble.tipo;
		if (t === 'banco' && !mueble.disposicion) {
			// Cajones bajo el tablero, de izquierda a derecha
			const w = (W - g * 2) / n;
			return Array.from({ length: n }, (_, i) => ({ nivel: i + 1, x: g + i * w, y: 0.08, w, h: 0.22 }));
		}
		const niv = nivelesMueble(mueble);
		if (raskog) {
			// Cada cesta: 12 cm de honda, repartidas entre arriba y el bastidor
			const hc = 0.12;
			const ultima = H - 0.1 - hc - 0.02;
			const paso = niv.length > 1 ? (ultima - 0.02) / (niv.length - 1) : 0;
			return niv.map((x, i) => ({ nivel: x.numero, x: 0, y: 0.02 + i * paso, w: W, h: hc }));
		}
		// Todo lo demás, de arriba a abajo (la 1 es la de arriba); a medida: filas de distinto alto, partidas, huecos
		const total = Math.max(...niv.map((x) => x.desde + x.alto), 1);
		const filasAparte = [...new Set(niv.filter((x) => x.aparte).map((x) => x.fila))];
		const u = (H - g * 2 - (t === 'carro' ? 0.12 : 0) - filasAparte.length * SEP) / total;
		return niv.map((x) => {
			const w = (W - g * 2) / x.cols;
			const sep = filasAparte.filter((f) => f <= x.fila).length * SEP;
			return { nivel: x.numero, x: g + x.col * w, y: g + x.desde * u + sep, w, h: x.alto * u, abierto: x.hueco, aparte: x.aparte && x.col === 0 };
		});
	});
	// Rectángulo de la luz: interpolado entre el nivel de antes y el de después
	const focoRect = $derived.by(() => {
		if (foco == null || !huecos.length) return null;
		const f = Math.min(Math.max(foco, 1), huecos.length);
		const a = huecos[Math.floor(f) - 1];
		const b = huecos[Math.min(Math.ceil(f), huecos.length) - 1];
		const k = f - Math.floor(f);
		const mezcla = (p: number, q: number) => p + (q - p) * k;
		return { x: mezcla(a.x, b.x), y: mezcla(a.y, b.y), w: mezcla(a.w, b.w), h: mezcla(a.h, b.h) };
	});
	// Cestas y bandejas son abiertas: se dibujan como baldas
	const cajon = $derived(['cajonera', 'carro', 'banco'].includes(mueble.tipo) && !['cesta', 'bandeja'].includes(nombreDeNivel(mueble)));
	const recortar = (t: string, ancho: number, tam: number) => {
		const max = Math.max(4, Math.floor(ancho / (tam * 0.56)));
		return t.length > max ? `${t.slice(0, max - 1)}…` : t;
	};
	const nombreNivel = (k: number) => nombreDe(mueble, k);
	/** Estanterías y armarios: cada balda en 3 tercios × 3 alturas para colocar cajas. */
	const rejilla = $derived(conRejilla(mueble.tipo));
</script>

{#snippet caja(c: (typeof contenedores)[number], bx: number, y0: number, bw: number, hb: number, encendida: boolean)}
	{@const fl = Math.min(bw * 0.5, hb * 0.38, 0.1)}
	{@const asa = c.tipo === 'maletin' || c.tipo === 'mochila' ? Math.min(hb * 0.12, 0.03) : 0}
	<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
	<g class="contenedor {encendida ? 'cont-on' : ''} {alTocarContenedor ? 'cursor-pointer' : ''}" onclick={(e) => { if (alTocarContenedor) { e.stopPropagation(); alTocarContenedor(c.id); } }}>
		<rect x={bx} y={y0 + asa} width={bw} height={hb - asa} rx={c.tipo === 'mochila' ? Math.min(bw, hb) * 0.28 : c.tipo === 'cubo' || c.tipo === 'bolsa' ? 0.025 : 0.01} class="caja" />
		{#if asa}<rect x={bx + bw * 0.32} y={y0} width={bw * 0.36} height={asa * 1.4} rx={asa * 0.7} fill="none" class="asa" />{/if}
		{#if c.tipo === 'mochila'}<rect x={bx + bw * 0.22} y={y0 + hb * 0.55} width={bw * 0.56} height={hb * 0.3} rx="0.012" fill="none" class="asa" />{/if}
		<text x={bx + bw / 2} y={y0 + hb * 0.5 + fl * 0.35} text-anchor="middle" class="letra-caja" font-size={fl}>{c.letra}</text>
		{#if bw > 0.18 && hb > 0.07 && c.nombre}
			{@const fn = Math.min(fl * 0.42, 0.042)}
			<text x={bx + bw / 2} y={y0 + hb * 0.88} text-anchor="middle" class="cuenta-caja" font-size={fn}>{recortar(`${c.nombre}${cuentaContenedor[c.id] ? ` · ${cuentaContenedor[c.id]}` : ''}`, bw - 0.03, fn)}</text>
		{:else if bw > 0.07 && cuentaContenedor[c.id]}
			<text x={bx + bw / 2} y={y0 + hb * 0.88} text-anchor="middle" class="cuenta-caja" font-size={Math.min(fl * 0.45, 0.04)}>{cuentaContenedor[c.id]}</text>
		{/if}
		{#if encendida}
			<rect x={bx} y={y0} width={bw} height={hb} rx="0.02" class="aro" />
			<rect x={bx} y={y0} width={bw} height={hb} rx="0.02" class="destello" />
		{/if}
		<title>{CONTENEDORES[c.tipo] ?? 'Contenedor'} {c.letra}{c.nombre ? ` · ${c.nombre}` : ''}{cuentaContenedor[c.id] ? ` (${cuentaContenedor[c.id]})` : ''}</title>
	</g>
{/snippet}

<svg viewBox="-0.12 -0.12 {W + 0.24} {H + 0.24}" class="frente block {clase || 'h-auto w-full'}" role="img" aria-label="{mueble.nombre} {mueble.codigo} visto de frente">
	<defs>
		<radialGradient id="foco-luz" cx="0.5" cy="0.5" r="0.7">
			<stop offset="0" stop-color="var(--acento)" stop-opacity="0.45" />
			<stop offset="0.6" stop-color="var(--acento)" stop-opacity="0.18" />
			<stop offset="1" stop-color="var(--acento)" stop-opacity="0" />
		</radialGradient>
	</defs>

	<!-- Estructura -->
	{#if mueble.tipo === 'banco'}
		<rect x="0" y="0" width={W} height="0.07" rx="0.01" class="tablero" />
		<rect x="0.03" y="0.07" width="0.06" height={H - 0.07} class="pata" />
		<rect x={W - 0.09} y="0.07" width="0.06" height={H - 0.07} class="pata" />
		<rect x="0.03" y={H - 0.12} width={W - 0.06} height="0.04" class="pata" />
	{:else if mueble.tipo === 'estanteria'}
		<!-- Estantería metálica de ángulo ranurado (tipo Simonrack): montantes con agujeros y pies -->
		{#each [0, W - g] as px (px)}
			<rect x={px} y="0" width={g} height={H} class="pata" />
			{#each Array.from({ length: Math.floor(H / 0.05) }, (_, i) => i) as i (i)}
				<rect x={px + g * 0.3} y={0.02 + i * 0.05} width={g * 0.4} height="0.022" rx="0.005" class="ranura" />
			{/each}
			<rect x={px - 0.012} y={H - 0.012} width={g + 0.024} height="0.012" class="pata" />
		{/each}
	{:else if raskog}
		<!-- Råskog: dos tubos a los lados, bastidor en U y cuatro ruedas -->
		<rect x="0.035" y="0.04" width="0.022" height={H - 0.12} rx="0.011" class="tubo" />
		<rect x={W - 0.057} y="0.04" width="0.022" height={H - 0.12} rx="0.011" class="tubo" />
		<path d="M0.046 {H - 0.09} Q0.046 {H - 0.065} 0.075 {H - 0.065} L{W - 0.075} {H - 0.065} Q{W - 0.046} {H - 0.065} {W - 0.046} {H - 0.09}" fill="none" stroke-width="0.02" stroke-linecap="round" class="tubo-trazo" />
		{#each [0.11, W - 0.11] as rx (rx)}<circle cx={rx} cy={H - 0.03} r="0.022" class="rueda-atras" />{/each}
		{#each [0.05, W - 0.05] as rx (rx)}
			<rect x={rx - 0.006} y={H - 0.068} width="0.012" height="0.02" class="pata" />
			<circle cx={rx} cy={H - 0.028} r="0.026" class="rueda" /><circle cx={rx} cy={H - 0.028} r="0.008" class="pata" />
		{/each}
	{:else}
		<rect x="0" y="0" width={W} height={H - (mueble.tipo === 'carro' ? 0.1 : 0)} rx="0.02" class="cuerpo" />
		{#if mueble.tipo === 'carro'}
			<circle cx="0.1" cy={H - 0.05} r="0.05" class="pata" /><circle cx={W - 0.1} cy={H - 0.05} r="0.05" class="pata" />
		{/if}
	{/if}

	<!-- Niveles -->
	{#each huecos as h (h.nivel)}
		{@const cs = contenedores.filter((c) => c.nivel === h.nivel).sort((a, b) => ordenLetra(a.letra, b.letra))}
		{@const contOn = cs.find((c) => c.id === contenedorResaltado)}
		{@const on = resaltar === h.nivel}
		{@const cosas = contenido[h.nivel] ?? []}
		{@const tam = Math.min(fs, h.h * (cs.length ? 0.22 : 0.32))}
		{@const yTexto = cs.length ? h.y + h.h * 0.2 : h.y + (cajon ? h.h * 0.66 : h.h / 2)}
		<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
		<g class="hueco {alTocarNivel ? 'cursor-pointer' : ''} {on ? 'encendido' : ''} {foco != null && Math.abs(foco - h.nivel) < 0.5 ? 'escaneando' : ''}" onclick={() => alTocarNivel?.(h.nivel)} style="--zona: {color}">
			{#if h.aparte}<rect x={-0.01} y={h.y - SEP + 0.005} width={W + 0.02} height={SEP - 0.01} rx="0.01" class="tablero" />{/if}
			{#if raskog}
				<!-- La cesta: honda, con las esquinas de abajo redondeadas y un borde arriba -->
				<path d="M{h.x} {h.y} L{h.x + h.w} {h.y} L{h.x + h.w} {h.y + h.h - 0.035} Q{h.x + h.w} {h.y + h.h} {h.x + h.w - 0.035} {h.y + h.h} L{h.x + 0.035} {h.y + h.h} Q{h.x} {h.y + h.h} {h.x} {h.y + h.h - 0.035} Z" class="cesta" />
				<rect x={h.x - 0.004} y={h.y - 0.004} width={h.w + 0.008} height="0.014" rx="0.007" class="borde-cesta" />
			{:else}
			<rect x={h.x + 0.01} y={h.y + 0.01} width={h.w - 0.02} height={h.h - 0.02} rx="0.015" class={h.abierto ? 'abierto' : cajon ? 'cajon' : 'balda-fondo'} />
			{/if}
			{#if !cajon && !raskog && mueble.tipo !== 'panel'}<rect x={h.x - g} y={h.y + h.h - 0.005} width={h.w + g * 2} height={g} class="tablero" />{/if}
			{#if cajon && !h.abierto && !cs.length}<rect x={h.x + h.w / 2 - Math.min(0.12, h.w / 4)} y={h.y + Math.min(0.05, h.h * 0.2)} width={Math.min(0.24, h.w / 2)} height="0.02" rx="0.01" class="tirador" />{/if}
			<text x={h.x + 0.04} y={h.y + tam * 1.15 + (cajon && !cs.length ? Math.min(0.05, h.h * 0.2) : 0.01)} class="num" font-size={tam * 0.85}>{h.nivel}</text>
			{#if on && destacado}
				{@const ancho = h.w - 0.3}
				{@const td = Math.min(tam * 1.05, ancho / Math.max(destacado.length * 0.57, 6))}
				<text x={h.x + h.w / 2 + 0.03} y={yTexto + td * 0.4} text-anchor="middle" class="destacado" font-size={td}>{#each [...recortar(destacado, ancho, td)] as letra, i (i)}<tspan class="letra" style="animation-delay: {0.12 + i * 0.035}s">{letra}</tspan>{/each}</text>
			{:else if cosas.length > 2 && !cs.length}
				<!-- Muchas cosas sueltas: cuántas y las primeras -->
				<text x={h.x + h.w / 2} y={yTexto - tam * 0.25} text-anchor="middle" class="cuantas" font-size={tam * 0.95}>{cosas.length} cosas</text>
				<text x={h.x + h.w / 2} y={yTexto + tam * 0.85} text-anchor="middle" class="cosas" font-size={tam * 0.62}>{recortar(cosas.slice(0, 3).join(' · ') + '…', h.w - 0.14, tam * 0.62)}</text>
			{:else if cosas.length}
				<text x={h.x + h.w / 2} y={yTexto + tam * 0.4} text-anchor="middle" class="cosas" font-size={tam * 0.8}>{recortar((cs.length ? `Suelto (${cosas.length}): ` : '') + cosas.slice(0, 2).join(' · ') + (cosas.length > 2 && !cs.length ? ` +${cosas.length - 2}` : ''), h.w - 0.1, tam * 0.8)}</text>
			{/if}

			<!-- Baldas en tercios: guías suaves para colocar cajas -->
			{#if rejilla && !h.abierto}
				{#each [1, 2] as k (k)}<line x1={h.x + 0.03 + ((h.w - 0.06) * k) / REJILLA.columnas} y1={h.y + h.h * 0.14} x2={h.x + 0.03 + ((h.w - 0.06) * k) / REJILLA.columnas} y2={h.y + h.h - 0.015} class="guia" />{/each}
			{/if}
			<!-- Contenedores de la balda: en su sitio de la rejilla o, si no lo tienen, de izquierda a derecha -->
			{#if cs.length}
				{@const rej = rejilla ? rejillaBalda(cs) : null}
				{#if rej}
					{@const x0 = h.x + 0.03}
					{@const cw = (h.w - 0.06) / REJILLA.columnas}
					{@const ybot = h.y + h.h - 0.012}
					{@const uh = (ybot - (h.y + h.h * 0.14)) / REJILLA.alturas}
					{#each cs as c (c.id)}
						{@const p = rej.get(c.id)!}
						{@render caja(c, x0 + (p.columna - 1) * cw + 0.006, ybot - (p.piso + p.alto) * uh + 0.006, p.ancho * cw - 0.012, p.alto * uh - 0.012, contOn?.id === c.id)}
					{/each}
				{:else}
					{@const gap = Math.min(0.02, h.w * 0.012)}
					{@const y0 = h.y + h.h * 0.36}
					{@const hb = h.h * 0.56}
					{@const bw = (h.w - 0.06 - gap * (cs.length - 1)) / cs.length}
					{#each cs as c, k (c.id)}{@render caja(c, h.x + 0.03 + k * (bw + gap), y0, bw, hb, contOn?.id === c.id)}{/each}
				{/if}
			{/if}
			{#if on && !contOn}
				<rect x={h.x + 0.01} y={h.y + 0.01} width={h.w - 0.02} height={h.h - 0.02} rx="0.015" class="aro" />
				<rect x={h.x + 0.01} y={h.y + 0.01} width={h.w - 0.02} height={h.h - 0.02} rx="0.015" class="destello" />
			{/if}
			<title>{nombreNivel(h.nivel)}{cosas.length ? `: ${cosas.join(', ')}` : ''}{cs.length ? ` · ${cs.length} contenedores` : ''}</title>
		</g>
	{/each}
	<!-- La luz que busca: flota entre baldas -->
	{#if focoRect}
		<rect x={focoRect.x - 0.03} y={focoRect.y - 0.03} width={focoRect.w + 0.06} height={focoRect.h + 0.06} rx="0.04" fill="url(#foco-luz)" class="pointer-events-none" />
		<rect x={focoRect.x + 0.01} y={focoRect.y + 0.01} width={focoRect.w - 0.02} height={focoRect.h - 0.02} rx="0.015" fill="none" stroke="var(--acento)" stroke-opacity="0.8" stroke-width="0.012" class="pointer-events-none" />
	{/if}
	{#if !n}
		<text x={W / 2} y={H / 2} text-anchor="middle" class="destacado" font-size={fs * 1.4}>{mueble.codigo}</text>
	{/if}
</svg>

<style>
	.frente {
		font-family: var(--font-sans);
	}
	.cuerpo {
		fill: var(--superficie-3);
		stroke: var(--texto-3);
		stroke-width: 0.012;
	}
	.pata,
	.tablero {
		fill: var(--texto-3);
	}
	.balda-fondo {
		fill: var(--superficie-2);
	}
	.guia {
		stroke: var(--borde);
		stroke-width: 0.006;
		stroke-dasharray: 0.02 0.02;
	}
	.ranura {
		fill: var(--superficie);
		opacity: 0.8;
	}
	.tubo {
		fill: var(--texto-3);
	}
	.tubo-trazo {
		stroke: var(--texto-3);
	}
	.rueda {
		fill: var(--superficie-3);
		stroke: var(--texto-3);
		stroke-width: 0.008;
	}
	.rueda-atras {
		fill: var(--superficie-3);
		opacity: 0.6;
	}
	.cesta {
		fill: var(--superficie-3);
		stroke: var(--texto-3);
		stroke-width: 0.008;
	}
	.borde-cesta {
		fill: var(--texto-3);
	}
	.hueco:hover .cesta {
		fill: color-mix(in oklab, var(--texto) 14%, var(--superficie-3));
	}
	.encendido .cesta {
		fill: color-mix(in oklab, var(--acento) 30%, var(--superficie-3));
	}
	.abierto {
		fill: var(--fondo);
		stroke: var(--borde);
		stroke-width: 0.01;
		stroke-dasharray: 0.03 0.02;
	}
	.cajon {
		fill: var(--superficie-2);
		stroke: var(--borde);
		stroke-width: 0.01;
	}
	.tirador {
		fill: var(--texto-3);
	}
	.num {
		fill: var(--texto-3);
		font-family: var(--font-mono);
		font-weight: 700;
	}
	.cosas {
		fill: var(--texto-2);
	}
	.cuantas {
		fill: var(--texto);
		font-weight: 700;
	}
	.destacado {
		fill: var(--texto);
		font-weight: 800;
	}
	.hueco:hover .balda-fondo,
	.hueco:hover .cajon {
		fill: var(--superficie-3);
	}
	.encendido .balda-fondo,
	.encendido .cajon {
		fill: color-mix(in oklab, var(--acento) 26%, var(--superficie-2));
	}
	.encendido .num {
		fill: var(--acento);
	}
	.aro {
		fill: none;
		stroke: var(--acento);
		stroke-width: 0.025;
		filter: drop-shadow(0 0 0.04px var(--acento));
		animation: latido 1.3s 0.6s ease-in-out infinite;
	}
	/* El «clac» al fijarse en la balda: un fogonazo que se expande */
	.destello {
		fill: var(--acento);
		stroke: var(--acento);
		stroke-width: 0.02;
		transform-box: fill-box;
		transform-origin: center;
		opacity: 0;
		animation: destello 0.7s cubic-bezier(0.2, 0.7, 0.3, 1);
	}
	@keyframes destello {
		0% {
			opacity: 0.75;
			transform: scale(1);
		}
		100% {
			opacity: 0;
			transform: scale(1.12, 1.6);
		}
	}
	.encendido .balda-fondo,
	.encendido .cajon {
		animation: fijar 0.45s cubic-bezier(0.3, 1.6, 0.5, 1);
		transform-box: fill-box;
		transform-origin: center;
	}
	@keyframes fijar {
		0% {
			transform: scale(0.94);
		}
		100% {
			transform: scale(1);
		}
	}
	.caja {
		fill: color-mix(in oklab, var(--zona) 30%, var(--superficie-3));
		stroke: color-mix(in oklab, var(--zona) 60%, var(--texto-3));
		stroke-width: 0.008;
	}
	.asa {
		stroke: color-mix(in oklab, var(--zona) 60%, var(--texto-3));
		stroke-width: 0.012;
	}
	.letra-caja {
		fill: var(--texto);
		font-family: var(--font-mono);
		font-weight: 800;
		pointer-events: none;
	}
	.cuenta-caja {
		fill: var(--texto-2);
		pointer-events: none;
	}
	.contenedor:hover .caja {
		fill: color-mix(in oklab, var(--zona) 45%, var(--superficie-3));
	}
	.cont-on .caja {
		fill: color-mix(in oklab, var(--acento) 45%, var(--superficie-3));
		stroke: var(--acento);
	}
	.escaneando .num {
		fill: var(--acento);
	}
	/* El nombre aparece letra a letra, desenfocado → nítido */
	.letra {
		opacity: 0;
		filter: blur(0.02px);
		animation: letra 0.45s cubic-bezier(0.2, 0.8, 0.3, 1) forwards;
	}
	@keyframes letra {
		to {
			opacity: 1;
			filter: none;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.aro,
		.destello,
		.encendido .balda-fondo,
		.encendido .cajon {
			animation: none;
		}
		.letra {
			animation: none;
			opacity: 1;
		}
	}
</style>
