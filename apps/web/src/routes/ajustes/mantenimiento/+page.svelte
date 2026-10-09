<script lang="ts">
	import { enhance } from '$app/forms';
	import Hoja from '$comp/Hoja.svelte';
	import { accion, enviar } from '$lib/enviar';
	import type { PlanMantenimiento } from '@novaz/core/schema';
	import { Pencil, Plus, Trash2 } from '@lucide/svelte';

	let { data } = $props();
	const cat = $derived(data.catalogo);
	let hoja = $state(false);
	let edit = $state<PlanMantenimiento | null>(null);

	const ambito = (p: PlanMantenimiento | null) => (p?.vehiculoId ? `vehiculo:${p.vehiculoId}` : p?.tipoVehiculoId ? `tipo:${p.tipoVehiculoId}` : 'todos');
	const textoAmbito = (p: PlanMantenimiento) =>
		p.vehiculoId ? `Solo ${data.vehiculosMenu.find((v) => v.id === p.vehiculoId)?.alias ?? 'un vehículo'}` : p.tipoVehiculoId ? (cat.tipos.find((t) => t.id === p.tipoVehiculoId)?.nombre ?? '?') : 'Todos';
</script>

<div class="mb-4 flex items-center justify-between gap-3">
	<p class="text-sm text-texto-3">Cada X km y/o cada Y meses, lo que llegue antes. Por tipo o para un vehículo concreto.</p>
	<button class="btn btn-acento shrink-0" onclick={() => ((edit = null), (hoja = true))}><Plus size={18} /> Nuevo plan</button>
</div>

<ul class="tarjeta lista-filas">
	{#each data.planes as p (p.id)}
		<li class="flex items-center gap-3 px-4 py-3 {p.activo ? '' : 'opacity-50'}">
			<div class="min-w-0 flex-1">
				<p class="font-medium">{p.nombre} <span class="chip ml-1 h-5 text-[0.65rem]">{textoAmbito(p)}</span></p>
				<p class="text-xs text-texto-3">
					Cada {[p.cadaKm ? `${p.cadaKm.toLocaleString('es-ES')} km` : null, p.cadaMeses ? `${p.cadaMeses} meses` : null].filter(Boolean).join(' o ')} · avisa {p.cadaKm ? `${p.avisoKm} km / ` : ''}{p.avisoDias} días antes
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
		<label class="campo"><span>Nombre</span><input name="nombre" class="input" required value={edit?.nombre ?? ''} placeholder="Correa de distribución" /></label>
		<label class="campo">
			<span>Se aplica a</span>
			<select name="ambito" class="input" value={ambito(edit)}>
				<option value="todos">Todos los vehículos</option>
				<optgroup label="Tipo">{#each cat.tipos as t (t.id)}<option value="tipo:{t.id}">{t.nombre}</option>{/each}</optgroup>
				<optgroup label="Vehículo concreto">{#each data.vehiculosMenu as v (v.id)}<option value="vehiculo:{v.id}">{v.alias}</option>{/each}</optgroup>
			</select>
		</label>
		<div class="grid grid-cols-2 gap-3">
			<label class="campo"><span>Cada (km)</span><input name="cadaKm" class="input" inputmode="numeric" value={edit?.cadaKm ?? ''} /></label>
			<label class="campo"><span>Cada (meses)</span><input name="cadaMeses" class="input" inputmode="numeric" value={edit?.cadaMeses ?? ''} /></label>
			<label class="campo"><span>Avisar con (km)</span><input name="avisoKm" class="input" inputmode="numeric" value={edit?.avisoKm ?? 500} /></label>
			<label class="campo"><span>Avisar con (días)</span><input name="avisoDias" class="input" inputmode="numeric" value={edit?.avisoDias ?? 30} /></label>
		</div>
		<label class="campo"><span>Notas (referencias, cantidades…)</span><textarea name="notas" class="input" rows="2">{edit?.notas ?? ''}</textarea></label>
		<label class="flex items-center gap-3 text-sm"><input type="checkbox" name="activo" checked={edit?.activo ?? true} class="h-5 w-5 accent-[var(--acento)]" /> Activo</label>
		<button class="btn btn-acento h-12">Guardar</button>
	</form>
</Hoja>
