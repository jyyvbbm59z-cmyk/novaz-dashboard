<script lang="ts">
	import { enhance } from '$app/forms';
	import Hoja from '$comp/Hoja.svelte';
	import { accion, enviar } from '$lib/enviar';
	import type { PlanMantenimiento } from '@novaz/core/schema';
	import { textoPeriodicidad } from '@novaz/core';
	import { Pencil, Plus, Trash2 } from '@lucide/svelte';

	let { data } = $props();
	const cat = $derived(data.catalogo);
	let hoja = $state(false);
	let edit = $state<PlanMantenimiento | null>(null);
	function periodo(p: PlanMantenimiento | null): { cada: string; unidad: string } {
		if (!p) return { cada: '', unidad: 'meses' };
		if (p.cadaDias) return p.cadaDias % 7 === 0 ? { cada: String(p.cadaDias / 7), unidad: 'semanas' } : { cada: String(p.cadaDias), unidad: 'dias' };
		if (p.cadaMeses) return p.cadaMeses % 12 === 0 ? { cada: String(p.cadaMeses / 12), unidad: 'anios' } : { cada: String(p.cadaMeses), unidad: 'meses' };
		return { cada: '', unidad: 'meses' };
	}

	const ambito = (p: PlanMantenimiento | null) => (p?.vehiculoId ? `vehiculo:${p.vehiculoId}` : p?.tipoVehiculoId ? `tipo:${p.tipoVehiculoId}` : 'todos');
	const textoAmbito = (p: PlanMantenimiento) =>
		p.vehiculoId ? `Solo ${data.vehiculosMenu.find((v) => v.id === p.vehiculoId)?.alias ?? 'un vehículo'}` : p.tipoVehiculoId ? (cat.tipos.find((t) => t.id === p.tipoVehiculoId)?.nombre ?? '?') : 'Todos';
</script>

<div class="mb-4 flex items-center justify-between gap-3">
	<p class="text-sm text-texto-3">Revisiones con su lista de tareas, cada X tiempo o km (lo que llegue antes). Las de un vehículo concreto sustituyen a las de su tipo.</p>
	<button class="btn btn-acento shrink-0" onclick={() => ((edit = null), (hoja = true))}><Plus size={18} /> Nuevo plan</button>
</div>

<ul class="tarjeta lista-filas">
	{#each data.planes as p (p.id)}
		<li class="flex items-center gap-3 px-4 py-3 {p.activo ? '' : 'opacity-50'}">
			<div class="min-w-0 flex-1">
				<p class="font-medium">{#if p.codigo}<span class="mr-1 font-mono text-acento">{p.codigo}</span>{/if}{p.nombre} <span class="chip ml-1 h-5 text-[0.65rem]">{textoAmbito(p)}</span></p>
				<p class="text-xs text-texto-3 first-letter:uppercase">
					{textoPeriodicidad(p)} · avisa {p.cadaKm ? `${p.avisoKm} km / ` : ''}{p.avisoDias} días antes{p.tareas.length ? ` · ${p.tareas.length} tareas` : ''}{p.incluye.length ? ` · incluye ${data.planes.filter((x) => p.incluye.includes(x.id)).map((x) => x.codigo ?? x.nombre).join(', ')}` : ''}
				</p>
			</div>
			<button class="btn btn-fantasma btn-icono h-9 w-9" onclick={() => ((edit = p), (hoja = true))} aria-label="Editar"><Pencil size={15} /></button>
			<button class="btn btn-fantasma btn-icono btn-peligro h-9 w-9" onclick={() => confirm(`¿Borrar ${p.nombre}?`) && accion('?/borrar', { id: p.id })} aria-label="Borrar"><Trash2 size={15} /></button>
		</li>
	{:else}
		<li class="px-4 py-8 text-center text-sm text-texto-3">Sin planes.</li>
	{/each}
</ul>

<Hoja bind:abierta={hoja} titulo={edit ? edit.nombre : 'Nuevo plan'}>
	<form method="POST" action="?/guardar" use:enhance={enviar({ alTerminar: () => (hoja = false) })} class="flex flex-col gap-4">
		{#if edit}<input type="hidden" name="id" value={edit.id} />{/if}
		<div class="grid grid-cols-[6rem_1fr] gap-3">
			<label class="campo"><span>Código</span><input name="codigo" class="input font-mono uppercase" value={edit?.codigo ?? ''} placeholder="I2" /></label>
			<label class="campo"><span>Nombre</span><input name="nombre" class="input" required value={edit?.nombre ?? ''} placeholder="Servicio" /></label>
		</div>
		<label class="campo">
			<span>Se aplica a</span>
			<select name="ambito" class="input" value={ambito(edit)}>
				<option value="todos">Todos los vehículos</option>
				<optgroup label="Tipo">{#each cat.tipos as t (t.id)}<option value="tipo:{t.id}">{t.nombre}</option>{/each}</optgroup>
				<optgroup label="Vehículo concreto">{#each data.vehiculosMenu as v (v.id)}<option value="vehiculo:{v.id}">{v.alias}</option>{/each}</optgroup>
			</select>
		</label>
		<div class="grid grid-cols-2 gap-3">
			<div class="campo col-span-2">
				<span>Cada</span>
				<div class="grid grid-cols-[5rem_1fr_auto_6rem] items-center gap-2">
					<input name="cada" class="input" inputmode="numeric" value={periodo(edit).cada} />
					<select name="unidad" class="input">
						{#each [['dias', 'días'], ['semanas', 'semanas'], ['meses', 'meses'], ['anios', 'años']] as [u, t] (u)}<option value={u} selected={periodo(edit).unidad === u}>{t}</option>{/each}
					</select>
					<span class="text-sm text-texto-3">o</span>
					<input name="cadaKm" class="input" inputmode="numeric" value={edit?.cadaKm ?? ''} placeholder="km" />
				</div>
			</div>
			<label class="campo"><span>Avisar con (km)</span><input name="avisoKm" class="input" inputmode="numeric" value={edit?.avisoKm ?? 500} /></label>
			<label class="campo"><span>Avisar con (días)</span><input name="avisoDias" class="input" inputmode="numeric" value={edit?.avisoDias ?? 30} /></label>
		</div>
		<label class="campo">
			<span>Tareas (una por línea)</span>
			<textarea name="tareas" class="input font-mono text-xs" rows="7" placeholder={'Cambiar aceite\nCambiar filtro de aceite\nRevisar pastillas'}>{(edit?.tareas ?? []).join('\n')}</textarea>
			<span class="text-xs text-texto-3">Saldrán como lista para tachar al registrar la revisión.</span>
		</label>
		{#if data.planes.filter((x) => x.id !== edit?.id).length}
			<fieldset class="campo">
				<span>Al hacerla, cuenta también como…</span>
				<div class="flex flex-wrap gap-2">
					{#each data.planes.filter((x) => x.id !== edit?.id && x.activo) as x (x.id)}
						<label class="chip h-8 cursor-pointer px-3 has-[:checked]:border-acento has-[:checked]:text-texto">
							<input type="checkbox" name="incluye" value={x.id} checked={edit?.incluye.includes(x.id)} class="accent-[var(--acento)]" />{x.codigo ? `${x.codigo} · ` : ''}{x.nombre}
						</label>
					{/each}
				</div>
			</fieldset>
		{/if}
		<label class="campo"><span>Notas (referencias, cantidades…)</span><textarea name="notas" class="input" rows="2">{edit?.notas ?? ''}</textarea></label>
		<label class="flex items-center gap-3 text-sm"><input type="checkbox" name="activo" checked={edit?.activo ?? true} class="h-5 w-5 accent-[var(--acento)]" /> Activo</label>
		<button class="btn btn-acento h-12">Guardar</button>
	</form>
</Hoja>
