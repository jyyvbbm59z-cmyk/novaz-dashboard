<script lang="ts">
	import type { Nivel } from '@novaz/core';

	let { nivel, texto }: { nivel: Nivel; texto?: string } = $props();
	const nombres: Record<Nivel, string> = { vencido: 'Vencido', urgente: 'Urgente', pronto: 'Pronto', ok: 'Al día' };
</script>

<span class="chip nivel-{nivel}" style="border-color: color-mix(in oklab, var(--{nivel}) 35%, transparent); background: color-mix(in oklab, var(--{nivel}) 10%, transparent)">
	<span class="punto" style="background: var(--{nivel})"></span>
	{texto ?? nombres[nivel]}
</span>
