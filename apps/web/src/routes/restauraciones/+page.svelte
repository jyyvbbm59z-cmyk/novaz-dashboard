<script lang="ts">
	import { enhance } from '$app/forms';
	import Hoja from '$comp/Hoja.svelte';
	import Placa from '$comp/Placa.svelte';
	import { enviar } from '$lib/enviar';
	import { diasEntre, euros, fechaLarga } from '@novaz/core';
	import { Clock, Plus, Wrench } from '@lucide/svelte';

	let { data } = $props();
	let verTerminadas = $state(false);
	let hNueva = $state(false);

	const ESTADOS: Record<string, string> = { planificada: 'Planificada', en_curso: 'En curso', pausada: 'Pausada', terminada: 'Terminada' };
	const lista = $derived(data.restauraciones.filter((r) => (verTerminadas ? r.estado === 'terminada' : r.estado !== 'terminada')));
	const terminadas = $derived(data.restauraciones.filter((r) => r.estado === 'terminada').length);
</script>

<svelte:head><title>Restauraciones · {data.ajustes.nombreTaller}</title></svelte:head>

<div class="mb-5 flex items-end justify-between gap-4">
	<div>
		<p class="etiqueta">{data.restauraciones.length - terminadas} en marcha · {terminadas} terminadas</p>
		<h1 class="text-4xl sm:text-5xl">Restauraciones</h1>
	</div>
	<button class="btn btn-acento" onclick={() => (hNueva = true)}><Plus size={18} /> Nueva</button>
</div>

<div class="mb-5 flex gap-2">
	<button class="chip h-8 px-3 {!verTerminadas ? 'border-acento text-texto' : 'text-texto-2'}" onclick={() => (verTerminadas = false)}>En marcha</button>
	<button class="chip h-8 px-3 {verTerminadas ? 'border-acento text-texto' : 'text-texto-2'}" onclick={() => (verTerminadas = true)}>Terminadas ({terminadas})</button>
</div>

{#if !lista.length}
	<div class="vacio">
		{verTerminadas ? 'Aún no has terminado ninguna. Todo llegará.' : 'No hay restauraciones en marcha.'}
		{#if !verTerminadas}<div class="mt-4"><button class="btn btn-acento" onclick={() => (hNueva = true)}><Wrench size={16} /> Empezar una</button></div>{/if}
	</div>
{:else}
	<div class="grid gap-3 md:grid-cols-2">
		{#each lista as r (r.id)}
			{@const sobre = r.presupuestoCent ? r.gasto / r.presupuestoCent : null}
			<a href="/restauraciones/{r.id}" class="tarjeta group flex overflow-hidden transition hover:border-texto-3/40">
				<div class="w-28 shrink-0 bg-superficie-2 sm:w-36">
					{#if r.portada}<img src="/archivos/{r.portada}?mini" alt="" class="h-full w-full object-cover" />{:else}<div class="flex h-full items-center justify-center text-texto-3/40"><Wrench size={32} /></div>{/if}
				</div>
				<div class="flex min-w-0 flex-1 flex-col gap-2 p-4">
					<div class="flex items-center gap-2 text-xs text-texto-3">
						<span>{ESTADOS[r.estado]}</span>·<span>{r.vehiculo}</span>
						<span class="ml-auto"><Placa matricula={r.matricula} /></span>
					</div>
					<h2 class="truncate text-2xl">{r.nombre}</h2>
					<div class="flex items-center gap-2.5">
						<div class="h-2 flex-1 overflow-hidden rounded-full bg-superficie-3"><div class="h-full rounded-full bg-acento" style="width:{Math.round(r.avance * 100)}%"></div></div>
						<span class="cifra text-lg">{Math.round(r.avance * 100)}%</span>
					</div>
					<div class="flex flex-wrap gap-x-4 gap-y-1 text-xs text-texto-2">
						<span class="flex items-center gap-1"><Clock size={12} /> {r.horas.toLocaleString('es-ES')} h</span>
						<span class={sobre != null && sobre > 1 ? 'nivel-vencido' : ''}>{euros(r.gasto, { redondo: true })}{r.presupuestoCent ? ` / ${euros(r.presupuestoCent, { redondo: true })}` : ''}</span>
						{#if r.fechaInicio}<span>{r.estado === 'terminada' && r.fechaFin ? `${diasEntre(r.fechaInicio, r.fechaFin)} días` : `Desde ${fechaLarga(r.fechaInicio)}`}</span>{/if}
					</div>
				</div>
			</a>
		{/each}
	</div>
{/if}

<Hoja bind:abierta={hNueva} titulo="Nueva restauración">
	<form method="POST" use:enhance={enviar()} class="flex flex-col gap-4">
		<label class="campo">
			<span>Vehículo *</span>
			<select name="vehiculoId" class="input" required>
				{#each data.vehiculosMenu as v (v.id)}<option value={v.id}>{v.alias}{v.matricula ? ` · ${v.matricula}` : ''}</option>{/each}
			</select>
			<a href="/flota/nuevo" class="text-xs text-acento">¿No está? Dar de alta un vehículo</a>
		</label>
		<label class="campo"><span>Nombre *</span><input name="nombre" class="input" required placeholder="Restauración integral" /></label>
		<label class="campo">
			<span>Plantilla de fases</span>
			<select name="plantillaId" class="input">
				<option value="">— Empezar en blanco —</option>
				{#each data.catalogo.plantillas as p, i (p.id)}<option value={p.id} selected={i === 0}>{p.nombre} ({p.fases.length} fases)</option>{/each}
			</select>
		</label>
		<div class="grid grid-cols-2 gap-3">
			<label class="campo"><span>Inicio</span><input type="date" name="fechaInicio" class="input" value={data.hoy} /></label>
			<label class="campo"><span>Presupuesto (€)</span><input name="presupuesto" class="input" inputmode="decimal" /></label>
		</div>
		<label class="campo">
			<span>Cambiar estado del vehículo a</span>
			<select name="estadoId" class="input">
				<option value="">— No cambiar —</option>
				{#each data.catalogo.estados as e (e.id)}<option value={e.id} selected={/restaur/i.test(e.nombre)}>{e.nombre}</option>{/each}
			</select>
		</label>
		<button class="btn btn-acento h-12">Empezar</button>
	</form>
</Hoja>
