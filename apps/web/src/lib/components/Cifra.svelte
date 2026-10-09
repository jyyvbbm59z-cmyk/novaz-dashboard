<script lang="ts">
	// Tarjeta de cifra (KPI): etiqueta, valor grande y detalle. Enlace o botón opcional.
	import type { Component, Snippet } from 'svelte';

	let {
		etiqueta,
		valor,
		detalle,
		tono,
		icono,
		href,
		onclick,
		grande = false,
		clase = '',
		children
	}: {
		etiqueta: string;
		valor: string | number;
		detalle?: string;
		tono?: 'vencido' | 'urgente' | 'pronto' | 'ok' | 'acento' | 'apagado';
		icono?: Component;
		href?: string;
		onclick?: () => void;
		grande?: boolean;
		clase?: string;
		children?: Snippet;
	} = $props();

	const color = $derived(tono === 'acento' ? 'var(--acento)' : tono === 'apagado' ? 'var(--texto-2)' : tono ? `var(--${tono})` : undefined);
	const interactiva = $derived(Boolean(href || onclick));
</script>

<svelte:element
	this={href ? 'a' : onclick ? 'button' : 'div'}
	{href}
	{onclick}
	role={onclick ? 'button' : undefined}
	class="tarjeta cifra-tarjeta {interactiva ? 'interactiva' : ''} {clase}"
>
	<p class="etiqueta flex min-w-0 items-center gap-1.5 whitespace-nowrap"><span class="contents">
		{#if icono}{@const I = icono}<I size={12} strokeWidth={2} class="shrink-0" />{/if}</span><span class="truncate">{etiqueta}</span>
	</p>
	<p class="cifra mt-1.5 leading-none {grande ? 'text-4xl sm:text-5xl' : 'text-3xl'}" style:color>{valor}</p>
	{#if detalle}<p class="mt-1.5 truncate text-xs text-texto-3">{detalle}</p>{/if}
	{#if children}{@render children()}{/if}
</svelte:element>

<style>
	.cifra-tarjeta {
		display: block;
		padding: 1rem 1.1rem;
		text-align: left;
		min-width: 0;
	}
	.interactiva {
		transition:
			border-color 0.15s,
			transform 0.15s;
	}
	.interactiva:hover {
		border-color: color-mix(in oklab, var(--texto-3) 45%, var(--borde));
	}
	.interactiva:active {
		transform: scale(0.985);
	}
</style>
