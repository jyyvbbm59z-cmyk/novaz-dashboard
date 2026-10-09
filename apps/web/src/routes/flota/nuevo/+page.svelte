<script lang="ts">
	import VehiculoForm from '$comp/VehiculoForm.svelte';
	let { data } = $props();
</script>

<svelte:head><title>Nuevo vehículo · {data.ajustes.nombreTaller}</title></svelte:head>

<div class="mx-auto max-w-2xl">
	<a href="/flota" class="text-sm text-texto-3 hover:text-texto">← Flota</a>
	<h1 class="mt-2 mb-6 text-4xl">Nuevo vehículo</h1>
	<VehiculoForm catalogo={data.catalogo} hoy={data.hoy} textoBoton="Dar de alta" />
</div>
