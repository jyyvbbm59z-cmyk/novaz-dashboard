<script lang="ts">
	import { enhance } from '$app/forms';
	import SubirArchivos from '$comp/SubirArchivos.svelte';
	import { enviar } from '$lib/enviar';
	import { probarMomento } from '$lib/momentos';
	import { EFECTOS, ETIQUETAS_EVENTO, EVENTOS_MOMENTO, SONIDOS, type Efecto, type Sonido } from '@novaz/core';
	import { Download, Play, Send } from '@lucide/svelte';

	let { data } = $props();
	const a = $derived(data.ajustes);

	const PRESETS = ['#f2a33a', '#ff6b35', '#e5534b', '#e8ff59', '#4cc38a', '#2fb8a6', '#4f8cff', '#9b6dff', '#ecebe8'];
	let acento = $state((() => data.ajustes.acento)());
	$effect(() => {
		document.documentElement.style.setProperty('--acento', acento);
	});

	const ETQ_EFECTO: Record<Efecto, string> = { ninguno: 'Ninguno', pulso: 'Pulso', confeti: 'Confeti', fuegos: 'Fuegos artificiales' };
	const ETQ_SONIDO: Record<Sonido, string> = { ninguno: 'Silencio', clic: 'Clic', campana: 'Campana', llave: 'Carraca', aplausos: 'Aplausos', personalizado: 'Mi sonido…' };

	let momentos = $state(structuredClone((() => $state.snapshot(data.ajustes.momentos))()));
</script>

<svelte:head><title>Ajustes · {a.nombreTaller}</title></svelte:head>

<div class="grid gap-6 lg:grid-cols-2">
	<!-- Identidad -->
	<form method="POST" action="?/general" use:enhance={enviar({ reset: false })} class="tarjeta flex flex-col gap-4 p-5">
		<h2 class="text-2xl">Identidad</h2>
		<div class="grid grid-cols-2 gap-3">
			<label class="campo"><span>Nombre</span><input name="nombreTaller" class="input" value={a.nombreTaller} required /></label>
			<label class="campo"><span>Lema</span><input name="lema" class="input" value={a.lema} /></label>
		</div>
		<div class="campo">
			<span>Color de acento</span>
			<div class="flex flex-wrap items-center gap-2">
				{#each PRESETS as c (c)}
					<button type="button" class="h-9 w-9 rounded-full border-2 transition {acento === c ? 'scale-110 border-texto' : 'border-transparent'}" style="background:{c}" onclick={() => (acento = c)} aria-label="Color {c}"></button>
				{/each}
				<label class="relative h-9 w-9 cursor-pointer overflow-hidden rounded-full border border-borde" title="Personalizado" style="background: conic-gradient(red, yellow, lime, cyan, blue, magenta, red)">
					<input type="color" bind:value={acento} class="absolute inset-0 opacity-0" />
				</label>
				<input name="acento" bind:value={acento} class="input h-9 w-28 font-mono text-sm" />
			</div>
		</div>
		<label class="campo">
			<span>Tema</span>
			<select name="tema" class="input" value={a.tema}>
				<option value="oscuro">Oscuro</option><option value="claro">Claro</option><option value="sistema">Según el sistema</option>
			</select>
		</label>
		<button class="btn btn-acento w-fit">Guardar</button>
	</form>

	<!-- Avisos -->
	<form method="POST" action="?/avisos" use:enhance={enviar({ reset: false })} class="tarjeta flex flex-col gap-4 p-5">
		<h2 class="text-2xl">Avisos</h2>
		<div class="grid grid-cols-2 gap-3">
			<label class="campo"><span>Urgente a partir de (días)</span><input name="urgenteDias" class="input" inputmode="numeric" value={a.urgenteDias} /></label>
			<label class="campo"><span>Zona horaria</span><input name="zonaHoraria" class="input" value={a.zonaHoraria} /></label>
		</div>
		<label class="campo">
			<span>Chat ID de Telegram</span>
			<input name="telegramChatId" class="input font-mono" value={a.telegramChatId ?? ''} placeholder="123456789" />
			<span class="text-xs text-texto-3">Escribe a tu bot y consulta el ID con @userinfobot. El token del bot va como secreto en Cloudflare.</span>
		</label>
		<label class="flex items-center gap-3 text-sm"><input type="checkbox" name="resumenSemanal" checked={a.resumenSemanal} class="h-5 w-5 accent-[var(--acento)]" /> Resumen semanal los lunes</label>
		<div class="flex flex-wrap gap-2">
			<button class="btn btn-acento">Guardar</button>
			<button class="btn" formaction="?/probarTelegram" disabled={!data.telegramConfigurado}><Send size={16} /> Probar</button>
		</div>
		{#if !data.telegramConfigurado}<p class="text-xs text-texto-3">El bot aún no está configurado en este entorno.</p>{/if}
	</form>

	<!-- Momentos -->
	<form method="POST" action="?/momentos" use:enhance={enviar({ reset: false })} class="tarjeta flex flex-col gap-4 p-5 lg:col-span-2">
		<div class="flex flex-wrap items-center justify-between gap-3">
			<div>
				<h2 class="text-2xl">Momentos</h2>
				<p class="text-sm text-texto-3">Efectos y sonidos para celebrar lo que se termina. Sí, puede dar palmas.</p>
			</div>
			<label class="flex items-center gap-3 text-sm"><input type="checkbox" name="momentosActivos" checked={a.momentosActivos} class="h-5 w-5 accent-[var(--acento)]" /> Activados</label>
		</div>
		<ul class="lista-filas">
			{#each EVENTOS_MOMENTO as ev (ev)}
				<li class="grid grid-cols-2 items-center gap-2 py-3 sm:grid-cols-[1fr_11rem_11rem_auto]">
					<span class="col-span-2 text-sm font-medium sm:col-span-1">{ETIQUETAS_EVENTO[ev]}</span>
					<select name="{ev}_efecto" class="input h-9 text-sm" bind:value={momentos[ev].efecto}>
						{#each EFECTOS as e (e)}<option value={e}>{ETQ_EFECTO[e]}</option>{/each}
					</select>
					<select name="{ev}_sonido" class="input h-9 text-sm" bind:value={momentos[ev].sonido}>
						{#each SONIDOS as so (so)}<option value={so}>{ETQ_SONIDO[so]}</option>{/each}
					</select>
					<input type="hidden" name="{ev}_url" value={momentos[ev].sonidoUrl ?? ''} />
					<span class="col-span-2 flex items-center gap-2 sm:col-span-1">
						{#if momentos[ev].sonido === 'personalizado'}
							<SubirArchivos entidad="ajuste" entidadId={0} acepta="audio/*" texto={momentos[ev].sonidoUrl ? 'Cambiar' : 'Subir audio'} clase="btn h-9 text-xs" alSubir={(r) => (momentos[ev].sonidoUrl = r.url)} />
						{/if}
						<button type="button" class="btn btn-icono h-9 w-9" onclick={(e) => probarMomento(momentos[ev], e.currentTarget)} aria-label="Probar"><Play size={15} /></button>
					</span>
				</li>
			{/each}
		</ul>
		<button class="btn btn-acento w-fit">Guardar momentos</button>
	</form>

	<!-- Datos -->
	<section class="tarjeta flex flex-col gap-3 p-5 lg:col-span-2">
		<h2 class="text-2xl">Tus datos</h2>
		<p class="text-sm text-texto-3">Copia completa de la base de datos en JSON. Además, el worker de avisos guarda una copia semanal en R2.</p>
		<a href="/api/exportar" class="btn w-fit" download><Download size={16} /> Exportar todo (JSON)</a>
	</section>
</div>
