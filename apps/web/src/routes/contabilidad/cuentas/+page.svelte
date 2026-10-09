<script lang="ts">
	import { enhance } from '$app/forms';
	import Hoja from '$comp/Hoja.svelte';
	import { accion, enviar } from '$lib/enviar';
	import { euros } from '@novaz/core';
	import type { Cuenta } from '@novaz/core/schema';
	import { Pencil, Plus, Search, Trash2 } from '@lucide/svelte';

	let { data } = $props();
	const GRUPOS: Record<string, string> = {
		'1': 'Financiación básica',
		'2': 'Activo no corriente',
		'3': 'Existencias',
		'4': 'Acreedores y deudores',
		'5': 'Cuentas financieras',
		'6': 'Compras y gastos',
		'7': 'Ventas e ingresos'
	};
	let filtro = $state('');
	let hoja = $state(false);
	let edit = $state<Cuenta | null>(null);

	// Subcuentas usadas que no están en el plan también se muestran
	const todas = $derived([
		...data.cuentas,
		...data.usadas.filter((c) => !data.cuentas.some((x) => x.codigo === c)).map((c) => ({ codigo: c, nombre: '', descripcion: null }))
	].sort((a, b) => a.codigo.localeCompare(b.codigo, 'es', { numeric: true })));
	const visibles = $derived(todas.filter((c) => !filtro || `${c.codigo} ${c.nombre}`.toLowerCase().includes(filtro.toLowerCase())));
</script>

<svelte:head><title>Plan de cuentas · {data.ajustes.nombreTaller}</title></svelte:head>

<div class="mb-4 flex flex-wrap items-center gap-2">
	<label class="relative min-w-48 flex-1">
		<Search size={15} class="absolute top-1/2 left-3 -translate-y-1/2 text-texto-3" />
		<input bind:value={filtro} class="input h-9 pl-9 text-sm" placeholder="Buscar cuenta" />
	</label>
	<button class="btn btn-acento h-9" onclick={() => ((edit = null), (hoja = true))}><Plus size={16} /> Cuenta</button>
</div>

<div class="grid gap-5 lg:grid-cols-2">
	{#each Object.entries(GRUPOS) as [g, titulo] (g)}
		{@const delGrupo = visibles.filter((c) => c.codigo[0] === g)}
		{#if delGrupo.length}
			<section>
				<p class="etiqueta mb-2"><span class="font-mono text-acento">{g}</span> · {titulo}</p>
				<ul class="tarjeta lista-filas">
					{#each delGrupo as c (c.codigo)}
						{@const saldo = data.saldos[c.codigo] ?? 0}
						<li class="group flex items-center gap-3 px-3 py-2">
							<a href="/contabilidad/mayor?cuenta={c.codigo}&ejercicio={data.ejercicio}" class="w-16 shrink-0 font-mono text-xs text-texto-2 hover:text-acento">{c.codigo}</a>
							<span class="min-w-0 flex-1 truncate text-sm {c.nombre ? '' : 'text-texto-3 italic'}">{c.nombre || 'Subcuenta sin nombre'}</span>
							{#if saldo}<span class="font-mono text-xs text-texto-2">{euros(Math.abs(saldo))} {saldo > 0 ? 'D' : 'H'}</span>{/if}
							<span class="flex opacity-0 transition group-hover:opacity-100 focus-within:opacity-100">
								<button class="btn btn-fantasma btn-icono h-7 w-7" onclick={() => ((edit = c.nombre ? (c as Cuenta) : { ...c, nombre: '' } as Cuenta), (hoja = true))} aria-label="Editar"><Pencil size={13} /></button>
								{#if c.nombre && !data.usadas.includes(c.codigo)}
									<button class="btn btn-fantasma btn-icono btn-peligro h-7 w-7" onclick={() => confirm(`¿Borrar ${c.codigo}?`) && accion('?/borrar', { codigo: c.codigo })} aria-label="Borrar"><Trash2 size={13} /></button>
								{/if}
							</span>
						</li>
					{/each}
				</ul>
			</section>
		{/if}
	{/each}
</div>

<Hoja bind:abierta={hoja} titulo={edit?.nombre ? `${edit.codigo} · ${edit.nombre}` : 'Nueva cuenta'}>
	<form method="POST" action="?/guardar" use:enhance={enviar({ alTerminar: () => (hoja = false) })} class="flex flex-col gap-4">
		{#if edit?.nombre}<input type="hidden" name="original" value={edit.codigo} />{/if}
		<div class="grid grid-cols-[8rem_1fr] gap-3">
			<label class="campo"><span>Código</span><input name="codigo" class="input font-mono" inputmode="numeric" required value={edit?.codigo ?? ''} readonly={Boolean(edit?.nombre)} placeholder="5720001" /></label>
			<label class="campo"><span>Nombre</span><input name="nombre" class="input" required value={edit?.nombre ?? ''} placeholder="Banco Revolut" /></label>
		</div>
		<label class="campo"><span>Descripción</span><textarea name="descripcion" class="input" rows="2">{edit?.descripcion ?? ''}</textarea></label>
		<p class="text-xs text-texto-3">Las subcuentas (p. ej. 5720001) heredan el comportamiento de su cuenta madre (572) en los informes.</p>
		<button class="btn btn-acento h-12">Guardar</button>
	</form>
</Hoja>
