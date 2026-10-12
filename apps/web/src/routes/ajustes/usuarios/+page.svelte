<script lang="ts">
	import { enhance } from '$app/forms';
	import Hoja from '$comp/Hoja.svelte';
	import { accion, enviar } from '$lib/enviar';
	import { NOMBRE_PERMISO, PERMISOS, PERMISOS_POR_DEFECTO } from '@novaz/core';
	import { Pencil, Plus, Send, Trash2, UserRound } from '@lucide/svelte';

	let { data } = $props();
	type U = (typeof data.usuarios)[number];
	let hoja = $state(false);
	let editado = $state<U | null>(null);
	function abrir(u: U | null) {
		editado = u;
		hoja = true;
	}
	const nombreDe = (id: number | null) => data.usuarios.find((u) => u.id === id)?.nombre;
	const suyos = (id: number) => data.vehiculosTodos.filter((v) => v.usuarioId === id);
	async function borrar(u: U) {
		if (!confirm(`¿Borrar a ${u.nombre}? Sus vehículos se quedan en la app, sin dueño, y su libreta de gastos se borra.`)) return;
		await accion('?/borrar', { id: u.id });
		hoja = false;
	}
</script>

<svelte:head><title>Usuarios · Ajustes</title></svelte:head>

<div class="mb-4 flex flex-wrap items-center justify-between gap-3">
	<p class="max-w-2xl text-sm text-texto-3">Cada persona entra con su email (Cloudflare Access le manda un código, sin contraseñas) y ve solo sus áreas. Los vehículos son del taller (comunes) o privados de alguien: los privados de otros se ven en solo lectura y no salen en su inicio, agenda ni avisos.</p>
	<button class="btn btn-acento h-10" onclick={() => abrir(null)}><Plus size={16} /> Añadir usuario</button>
</div>

<ul class="tarjeta lista-filas">
	{#each data.usuarios as u (u.id)}
		<li class="flex items-start gap-3 px-4 py-3 {u.activo ? '' : 'opacity-50'}">
			<span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-superficie-3"><UserRound size={18} class="text-texto-3" /></span>
			<div class="min-w-0 flex-1">
				<p class="font-semibold">{u.nombre}{u.id === data.yoId ? ' (tú)' : ''}{u.activo ? '' : ' · desactivado'}</p>
				<p class="truncate text-xs text-texto-3">{u.email}{u.telegramChatId ? ' · Telegram ✓' : ''}</p>
				<div class="mt-1.5 flex flex-wrap gap-1">
					{#each u.permisos as p (p)}<span class="chip h-6 px-2 text-[0.68rem]">{NOMBRE_PERMISO[p].nombre}</span>{/each}
					{#if suyos(u.id).length}<span class="chip h-6 px-2 text-[0.68rem] border-pronto/50 text-pronto">Privados: {suyos(u.id).map((v) => v.alias).join(', ')}</span>{/if}
				</div>
			</div>
			<button class="btn btn-fantasma btn-icono h-9 w-9" onclick={() => abrir(u)} aria-label="Editar {u.nombre}"><Pencil size={15} /></button>
		</li>
	{/each}
</ul>

<p class="mt-4 max-w-2xl text-xs text-texto-3">
	<strong class="text-texto-2">Para que alguien nuevo pueda entrar</strong>, además de darlo de alta aquí, añade su email en Cloudflare Zero Trust → Access → Aplicaciones → la de Novaz → su política «Allow» (Include → Emails). Si entra sin estar dado de alta aquí, verá «Aún no tienes acceso».
</p>

<Hoja bind:abierta={hoja} titulo={editado ? editado.nombre : 'Nuevo usuario'}>
	{#key editado?.id ?? 'nuevo'}
		<form method="POST" action="?/guardar" use:enhance={enviar({ alTerminar: () => (hoja = false) })} class="flex flex-col gap-4">
			{#if editado}<input type="hidden" name="id" value={editado.id} />{/if}
			<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
				<label class="campo"><span>Nombre *</span><input name="nombre" class="input" required value={editado?.nombre ?? ''} placeholder="Paco" /></label>
				<label class="campo"><span>Email (con el que entra) *</span><input name="email" type="email" class="input" required value={editado?.email ?? ''} placeholder="paco@gmail.com" /></label>
			</div>

			<fieldset class="flex flex-col gap-2">
				<span class="text-sm font-medium">Qué puede ver y tocar</span>
				{#each PERMISOS as p (p)}
					<label class="flex cursor-pointer items-start gap-3 rounded-lg border border-borde p-3 text-sm has-[:checked]:border-acento has-[:checked]:bg-acento/5">
						<input type="checkbox" name="permisos" value={p} checked={editado ? editado.permisos.includes(p) : PERMISOS_POR_DEFECTO.includes(p)} class="mt-0.5 h-4 w-4 accent-[var(--acento)]" />
						<span><span class="font-medium">{NOMBRE_PERMISO[p].nombre}</span><span class="block text-xs text-texto-3">{NOMBRE_PERMISO[p].detalle}</span></span>
					</label>
				{/each}
			</fieldset>

			<fieldset class="flex flex-col gap-2">
				<span class="text-sm font-medium">Sus vehículos privados</span>
				<span class="text-xs text-texto-3">Los marcados son suyos: solo él los edita, solo a él le salen sus avisos y lleva su libreta de gastos. Los demás los ven en solo lectura. Los no marcados de nadie son del taller (comunes).</span>
				<div class="flex flex-wrap gap-2">
					{#each data.vehiculosTodos as v (v.id)}
						<label class="chip h-8 cursor-pointer px-3 has-[:checked]:border-acento has-[:checked]:bg-acento/10 has-[:checked]:text-texto">
							<input type="checkbox" name="vehiculoIds" value={v.id} checked={editado ? v.usuarioId === editado.id : false} class="accent-[var(--acento)]" />{v.alias}{#if v.usuarioId != null && v.usuarioId !== editado?.id}<span class="text-[0.68rem] text-texto-3">· de {nombreDe(v.usuarioId)}</span>{/if}
						</label>
					{/each}
				</div>
			</fieldset>

			<label class="campo">
				<span>Su chat de Telegram</span>
				<input name="telegramChatId" class="input font-mono" inputmode="numeric" value={editado?.telegramChatId ?? ''} placeholder="Que escriba a @userinfobot y te pase el número" />
				<span class="text-xs text-texto-3">Antes tiene que escribir /start a tu bot. El parte de la mañana le llegará con solo lo suyo.</span>
			</label>
			{#if editado && editado.id !== data.yoId}
				<label class="flex items-center gap-3 text-sm"><input type="checkbox" name="activo" value="no" checked={!editado.activo} class="h-5 w-5 accent-[var(--acento)]" /> Desactivado (no puede entrar ni usar el bot)</label>
			{/if}
			<button class="btn btn-acento h-12">{editado ? 'Guardar' : 'Añadir usuario'}</button>
		</form>
		{#if editado && editado.id !== data.yoId}
			{@const u = editado}
			<button class="btn mt-3 w-full text-vencido" onclick={() => borrar(u)}><Trash2 size={16} /> Borrar usuario</button>
		{/if}
	{/key}
</Hoja>
