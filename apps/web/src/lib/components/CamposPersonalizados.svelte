<script lang="ts">
	import type { CampoDef } from '@novaz/core';

	let { defs, valores = {} }: { defs: CampoDef[]; valores?: Record<string, unknown> } = $props();
	const v = (k: string) => (valores[k] == null ? '' : String(valores[k]));
</script>

{#each defs as d (d.clave)}
	{#if d.tipo === 'booleano'}
		<label class="flex h-11 items-center gap-3 self-end text-sm">
			<input type="checkbox" name="campo_{d.clave}" checked={Boolean(valores[d.clave])} class="h-5 w-5 accent-[var(--acento)]" />
			{d.etiqueta}
		</label>
	{:else}
		<label class="campo {d.tipo === 'textoLargo' ? 'sm:col-span-2' : ''}">
			<span>{d.etiqueta}{d.unidad ? ` (${d.unidad})` : ''}{d.obligatorio ? ' *' : ''}</span>
			{#if d.tipo === 'lista'}
				<select name="campo_{d.clave}" class="input" required={d.obligatorio}>
					<option value="">—</option>
					{#each d.opciones ?? [] as o (o)}<option selected={v(d.clave) === o}>{o}</option>{/each}
				</select>
			{:else if d.tipo === 'textoLargo'}
				<textarea name="campo_{d.clave}" class="input" required={d.obligatorio}>{v(d.clave)}</textarea>
			{:else}
				<input
					name="campo_{d.clave}"
					class="input"
					type={d.tipo === 'fecha' ? 'date' : 'text'}
					inputmode={d.tipo === 'numero' ? 'decimal' : undefined}
					value={v(d.clave)}
					required={d.obligatorio}
				/>
			{/if}
		</label>
	{/if}
{/each}
