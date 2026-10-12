<script lang="ts">
	import { enhance } from '$app/forms';
	import { enviar } from '$lib/enviar';
	import { Send } from '@lucide/svelte';

	let { data } = $props();
	const p = $derived(data.perfil);
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
			<span class="text-xs text-texto-3">Escribe /start al bot del taller y consulta tu número con @userinfobot. Así el bot te hace caso y te manda tu parte cada mañana.</span>
		</label>
		<div class="flex flex-wrap gap-2">
			<button class="btn btn-acento">Guardar</button>
			{#if p.telegramChatId}<button class="btn" formaction="?/probar"><Send size={16} /> Enviarme mi parte de hoy</button>{/if}
		</div>
	</form>

	<section class="tarjeta p-5 text-sm">
		<p class="etiqueta mb-2">Lo que puedes ver</p>
		<p class="text-texto-2">{p.permisos.join(' · ') || 'Nada todavía: pide al administrador que te dé acceso.'}</p>
		<p class="mt-2 text-texto-2">{p.todos ? 'Todos los vehículos.' : p.vehiculos.length ? `Tus vehículos: ${p.vehiculos.map((v) => v.alias).join(', ')}.` : 'Aún no tienes vehículos: da de alta el tuyo en Vehículos.'}</p>
	</section>
</div>
