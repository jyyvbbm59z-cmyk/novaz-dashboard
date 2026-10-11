<script lang="ts">
	let { data } = $props();
	const a = $derived(data.analisis);
	const seg = (ms: number | null) => (ms == null ? '—' : ms < 60000 ? `${Math.round(ms / 1000)} s` : `${Math.floor(ms / 60000)} min ${Math.round((ms % 60000) / 1000)} s`);
	const pct = (x: number) => `${Math.round(x * 100)} %`;
	const acierto = $derived(a.ticket.revisados ? 1 - a.ticket.corregidos / a.ticket.revisados : null);
</script>

<svelte:head><title>Uso de la app · {data.ajustes.nombreTaller}</title></svelte:head>

<div class="mb-5 flex flex-wrap items-center justify-between gap-3">
	<p class="max-w-xl text-sm text-texto-2">
		Cómo usas la app, para ver qué da fricción y qué no se usa. Todo se guarda en tu base de datos (nada sale a terceros) y se borra solo a los 180 días.
	</p>
	<div class="flex gap-1.5">
		{#each [7, 30, 90] as d (d)}<a href="?dias={d}" class="chip h-8 px-3 {data.dias === d ? 'border-acento/60 bg-acento/10 text-texto' : 'text-texto-3'}">{d} días</a>{/each}
	</div>
</div>

{#if !a.total}
	<div class="vacio">Aún no hay datos de uso en este periodo. Se irán recogiendo a medida que uses la app.</div>
{:else}
	<p class="mb-5 text-sm text-texto-3">{a.total} eventos en {a.dias} {a.dias === 1 ? 'día' : 'días'} de uso · {pct(a.movil)} desde el móvil</p>

	<div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
		<!-- Fricción en formularios -->
		<section class="tarjeta overflow-hidden lg:col-span-2">
			<p class="etiqueta border-b border-borde px-4 py-3">Formularios: dónde hay fricción</p>
			<div class="overflow-x-auto">
				<table class="tabla">
					<thead><tr><th>Formulario</th><th class="text-right">Abiertos</th><th class="text-right">Guardados</th><th class="text-right">Sin guardar</th><th class="text-right">Errores</th><th class="text-right">Tiempo típico</th></tr></thead>
					<tbody>
						{#each a.formularios as f (f.nombre)}
							<tr>
								<td class="font-medium">{f.nombre}</td>
								<td class="num">{f.abiertas}</td>
								<td class="num">{f.completadas}</td>
								<td class="num {f.abandono >= 0.5 && f.abandonadas >= 2 ? 'nivel-vencido font-semibold' : ''}">{f.abandonadas}{f.abandonadas ? ` (${pct(f.abandono)})` : ''}</td>
								<td class="num {f.errores ? 'nivel-urgente' : ''}">{f.errores || '—'}</td>
								<td class="num">{seg(f.medianaMs)}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
			<p class="border-t border-borde px-4 py-2.5 text-xs text-texto-3">«Sin guardar»: se abrió y se cerró sin guardar. Mucho abandono o mucho tiempo = ese formulario pide demasiado.</p>
		</section>

		<!-- Errores -->
		<section class="tarjeta p-4">
			<p class="etiqueta mb-3">Errores al guardar</p>
			{#if a.errores.length}
				<ul class="flex flex-col gap-1.5 text-sm">{#each a.errores as e (e.nombre)}<li class="flex justify-between gap-3"><span class="text-texto-2">{e.nombre}</span><span class="cifra">{e.n}</span></li>{/each}</ul>
			{:else}<p class="text-sm text-texto-3">Ninguno.</p>{/if}
			{#if a.erroresJs.length}
				<p class="etiqueta mt-4 mb-2">Fallos de la app</p>
				<ul class="flex flex-col gap-1.5 text-xs">{#each a.erroresJs as e (e.nombre)}<li class="flex justify-between gap-3"><span class="truncate font-mono text-texto-3">{e.nombre}</span><span class="cifra">{e.n}</span></li>{/each}</ul>
			{/if}
		</section>

		<!-- IA de tickets -->
		<section class="tarjeta p-4">
			<p class="etiqueta mb-3">Lectura de tickets con IA</p>
			{#if a.ticket.lecturas || a.ticket.fallos}
				<div class="grid grid-cols-3 gap-3 text-sm">
					<div><p class="text-xs text-texto-3">Leídos</p><p class="cifra text-2xl">{a.ticket.lecturas}</p><p class="text-xs text-texto-3">{a.ticket.fallos} sin poder leer</p></div>
					<div><p class="text-xs text-texto-3">Sin corregir</p><p class="cifra text-2xl">{acierto == null ? '—' : pct(acierto)}</p><p class="text-xs text-texto-3">de {a.ticket.revisados} guardados</p></div>
					<div><p class="text-xs text-texto-3">Tarda</p><p class="cifra text-2xl">{seg(a.ticket.medianaMs)}</p></div>
				</div>
				{#if a.ticket.campos.length}<p class="mt-3 text-xs text-texto-3">Lo que más corriges: {a.ticket.campos.map((c) => `${c.nombre} (${c.n})`).join(', ')}</p>{/if}
			{:else}<p class="text-sm text-texto-3">Aún no has leído tickets.</p>{/if}
		</section>

		<!-- Lo más usado -->
		<section class="tarjeta p-4">
			<p class="etiqueta mb-3">Lo que más haces</p>
			<ul class="flex flex-col gap-1.5 text-sm">{#each a.acciones as x (x.nombre)}<li class="flex justify-between gap-3"><span class="truncate font-mono text-xs text-texto-2">{x.nombre}</span><span class="cifra">{x.n}</span></li>{/each}</ul>
		</section>

		<!-- Páginas -->
		<section class="tarjeta p-4">
			<p class="etiqueta mb-3">Páginas más visitadas</p>
			<ul class="flex flex-col gap-1.5 text-sm">{#each a.vistas as x (x.nombre)}<li class="flex justify-between gap-3"><span class="truncate font-mono text-xs text-texto-2">{x.nombre}</span><span class="cifra">{x.n}</span></li>{/each}</ul>
			{#if a.sinUso.length}
				<p class="etiqueta mt-4 mb-2">Sin visitar en {data.dias} días</p>
				<p class="text-xs text-texto-3">{a.sinUso.join(' · ')}</p>
			{/if}
		</section>
	</div>
{/if}
