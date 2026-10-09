<script lang="ts">
	import { page } from '$app/state';
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
<h1 class="mb-5 text-4xl sm:text-5xl">Ajustes</h1>
<nav class="pestanas -mx-4 mb-6 px-4 sm:mx-0 sm:px-0">
	{#each SECCIONES as [href, t] (href)}
		<a {href} class="pestana" aria-current={page.url.pathname === href ? 'page' : undefined}>{t}</a>
	{/each}
</nav>
{@render children()}
