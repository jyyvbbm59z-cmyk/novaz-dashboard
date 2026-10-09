<script lang="ts">
	import { page } from '$app/state';
	import Pestanas from '$comp/Pestanas.svelte';
	let { children } = $props();
	const SECCIONES = [
		['/ajustes', 'General'],
		['/ajustes/tipos', 'Tipos de vehículo'],
		['/ajustes/vencimientos', 'Vencimientos'],
		['/ajustes/mantenimiento', 'Mantenimiento'],
		['/ajustes/plantillas', 'Plantillas de obra'],
		['/ajustes/categorias', 'Categorías'],
		['/ajustes/estados', 'Estados']
	];
</script>

<p class="etiqueta">Configuración</p>
<h1 class="titulo-pagina mb-5">Ajustes</h1>
<Pestanas fija pestanas={SECCIONES.map(([href, texto]) => ({ href, texto, activa: page.url.pathname === href }))} />
<div class="mt-6 min-h-[60dvh]">
	{@render children()}
</div>
