<script lang="ts">
	import { enhance } from '$app/forms';
	import { enviar } from '$lib/enviar';
	import { Bell, Palette, Send } from '@lucide/svelte';
	import { onMount } from 'svelte';

	let { data } = $props();
	const p = $derived(data.perfil);
	const t = $derived(data.taller);

	const PRESETS = ['#ebab00', '#f2a33a', '#ff6b35', '#e5534b', '#e8ff59', '#4cc38a', '#2fb8a6', '#4f8cff', '#9b6dff', '#ecebe8'];
	const NOMBRE_TEMA: Record<string, string> = { oscuro: 'oscuro', claro: 'claro', sistema: 'según el sistema' };
	// Vacío = como el taller
	let tema = $state((() => data.preferencias.tema ?? '')());
	let acento = $state((() => data.preferencias.acento ?? '')());
	// Se ve al momento; al guardar se queda
	$effect(() => {
		const h = document.documentElement;
		h.style.setProperty('--acento', acento || t.acento);
		const elegido = tema || t.tema;
		h.dataset.theme = elegido === 'sistema' ? (matchMedia('(prefers-color-scheme: light)').matches ? 'claro' : 'oscuro') : elegido;
	});
	// Si se va sin guardar, vuelve lo guardado
	onMount(() => () => {
		const h = document.documentElement;
		h.style.setProperty('--acento', data.preferencias.acento ?? t.acento);
		const g = data.preferencias.tema ?? t.tema;
		h.dataset.theme = g === 'sistema' ? (matchMedia('(prefers-color-scheme: light)').matches ? 'claro' : 'oscuro') : g;
	});
	const avisos = $derived(data.preferencias.avisos ?? t.avisos);
	const resumen = $derived(data.preferencias.resumenSemanal ?? t.resumenSemanal);
</script>

<svelte:head><title>Mi perfil · {data.ajustes.nombreTaller}</title></svelte:head>

<p class="etiqueta">{p.email}</p>
<h1 class="titulo-pagina mb-5">Mi perfil</h1>

<div class="grid max-w-3xl grid-cols-1 gap-4">
	<form method="POST" action="?/guardar" use:enhance={enviar({ reset: false })} class="tarjeta flex flex-col gap-4 p-5">
		<label class="campo"><span>Nombre</span><input name="nombre" class="input" required value={p.nombre} /></label>
		<label class="campo">
			<span>Tu chat de Telegram</span>
			<input name="telegramChatId" class="input font-mono" inputmode="numeric" value={p.telegramChatId ?? ''} placeholder="123456789" />
			<span class="text-xs text-texto-3">Escribe /start al bot del taller y consulta tu número con @userinfobot. Así el bot te hace caso y te avisa de lo tuyo.</span>
		</label>
		<div class="flex flex-wrap gap-2">
			<button class="btn btn-acento">Guardar</button>
			{#if p.telegramChatId}<button class="btn" formaction="?/probar"><Send size={16} /> Enviarme mi parte de hoy</button>{/if}
		</div>
	</form>

	{#if p.hayUsuarios}
		<form method="POST" action="?/preferencias" use:enhance={enviar({ reset: false })} class="tarjeta flex flex-col gap-5 p-5">
			<h2 class="flex items-center gap-2 text-2xl"><Palette size={20} class="text-texto-3" /> Apariencia</h2>
			<label class="campo">
				<span>Tema</span>
				<select name="tema" class="input" bind:value={tema}>
					<option value="">Como el taller ({NOMBRE_TEMA[t.tema]})</option>
					<option value="oscuro">Oscuro</option>
					<option value="claro">Claro</option>
					<option value="sistema">Según el sistema</option>
				</select>
			</label>
			<div class="campo">
				<span>Color de acento</span>
				<input type="hidden" name="acento" value={acento} />
				<div class="flex flex-wrap items-center gap-2">
					<button type="button" class="chip h-9 px-3 {acento === '' ? 'border-acento text-texto' : 'text-texto-3'}" onclick={() => (acento = '')}>
						<span class="h-4 w-4 rounded-full" style="background:{t.acento}"></span> Como el taller
					</button>
					{#each PRESETS as c (c)}
						<button type="button" class="h-9 w-9 rounded-full border-2 transition {acento === c ? 'scale-110 border-texto' : 'border-transparent'}" style="background:{c}" onclick={() => (acento = c)} aria-label="Color {c}"></button>
					{/each}
					<label class="relative h-9 w-9 cursor-pointer overflow-hidden rounded-full border border-borde" title="Personalizado" style="background: conic-gradient(red, yellow, lime, cyan, blue, magenta, red)">
						<input type="color" value={acento || t.acento} oninput={(e) => (acento = e.currentTarget.value)} class="absolute inset-0 opacity-0" />
					</label>
				</div>
			</div>

			<h2 class="mt-2 flex items-center gap-2 border-t border-borde pt-5 text-2xl"><Bell size={20} class="text-texto-3" /> Notificaciones</h2>
			<fieldset class="flex flex-col gap-2">
				<span class="text-sm font-medium">Qué te manda el bot</span>
				{#each [['parte', 'Un parte cada mañana', 'Lo que vence, el mantenimiento y lo pendiente de tus vehículos y los del taller.'], ['umbrales', 'Solo cuando algo vence', 'Un aviso a 30, 7 y 1 días y el día que vence. Si no pasa nada, silencio.'], ['ninguno', 'Nada', 'El bot no te escribe por su cuenta (pero te sigue contestando).']] as [v, tt, d] (v)}
					<label class="flex cursor-pointer items-start gap-3 rounded-lg border border-borde p-3 text-sm has-[:checked]:border-acento has-[:checked]:bg-acento/5">
						<input type="radio" name="avisos" value={v} checked={avisos === v} class="mt-0.5 h-4 w-4 accent-[var(--acento)]" />
						<span><span class="font-medium">{tt}</span>{#if v === t.avisos && !data.preferencias.avisos}<span class="ml-1.5 text-xs text-texto-3">(lo del taller)</span>{/if}<span class="block text-xs text-texto-3">{d}</span></span>
					</label>
				{/each}
			</fieldset>
			<label class="flex items-center gap-3 text-sm"><input type="checkbox" name="resumenSemanal" checked={resumen} class="h-5 w-5 accent-[var(--acento)]" /> Los lunes, además, un resumen de la semana</label>
			{#if !p.telegramChatId}<p class="text-xs text-texto-3">Para recibir nada, pon arriba tu chat de Telegram.</p>{/if}
			<button class="btn btn-acento w-fit">Guardar</button>
		</form>
	{/if}

	<section class="tarjeta p-5 text-sm">
		<p class="etiqueta mb-2">Lo que puedes ver</p>
		<p class="text-texto-2">{p.permisos.join(' · ') || 'Nada todavía: pide al administrador que te dé acceso.'}</p>
		<p class="mt-2 text-texto-2">
			{p.suyos.length ? `Tus vehículos privados: ${p.suyos.map((v) => v.alias).join(', ')}.` : 'No tienes vehículos privados.'}
			Los del taller los compartís todos; los privados de los demás los ves en solo lectura.
		</p>
	</section>
</div>
