<script lang="ts">
	import { page } from '$app/state';
	import Pestanas from '$comp/Pestanas.svelte';
	let { data, children } = $props();
	const herramientas = $derived(data.articulos.filter((a) => a.tipo === 'herramienta').length);
	const reserva = $derived(data.articulos.filter((a) => a.tipo !== 'herramienta').length);
	const SECCIONES = $derived([
		['/inventario', 'Herramientas', herramientas],
		['/inventario/reserva', 'Recambios y consumibles', reserva],
		['/inventario/compras', 'Lista de la compra', null],
		['/inventario/recuento', 'Recuento', null]
	] as const);
</script>

<p class="etiqueta mb-1">Taller</p>
<h1 class="titulo-pagina mb-5">Inventario</h1>
<Pestanas fija pestanas={SECCIONES.map(([href, texto, cuenta]) => ({ href, texto, activa: page.url.pathname === href, cuenta }))} />
<div class="mt-6 min-h-[60dvh]">{@render children()}</div>
