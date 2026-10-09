<script lang="ts">
	import { enhance } from '$app/forms';
	import VehiculoForm from '$comp/VehiculoForm.svelte';
	import { Trash2 } from '@lucide/svelte';
	let { data } = $props();
</script>

<svelte:head><title>Editar {data.vehiculo.alias} · {data.ajustes.nombreTaller}</title></svelte:head>

<div class="mx-auto max-w-2xl">
	<a href="/flota/{data.vehiculo.id}" class="text-sm text-texto-3 hover:text-texto">← {data.vehiculo.alias}</a>
	<h1 class="mt-2 mb-6 text-4xl">Editar vehículo</h1>
	<VehiculoForm catalogo={data.catalogo} vehiculo={data.vehiculo} hoy={data.hoy} accion="?/guardar" />

	<form
		method="POST"
		action="?/borrar"
		use:enhance={({ cancel }) => {
			if (!confirm(`¿Borrar ${data.vehiculo.alias} con todo su historial, papeles y fotos? No se puede deshacer.`)) cancel();
		}}
		class="mt-12 border-t border-borde pt-6"
	>
		<p class="etiqueta mb-2">Zona peligrosa</p>
		<p class="mb-3 text-sm text-texto-3">Si lo has vendido o entregado, mejor cambia su estado: así conservas el historial.</p>
		<button class="btn btn-peligro"><Trash2 size={16} /> Borrar vehículo</button>
	</form>
</div>
