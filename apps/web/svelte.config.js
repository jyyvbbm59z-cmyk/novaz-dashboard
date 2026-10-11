import adapter from '@sveltejs/adapter-cloudflare';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		// En local se usa el entorno «local» de wrangler.jsonc (sin Workers AI)
		adapter: adapter({ platformProxy: { environment: 'local' } }),
		alias: { $comp: 'src/lib/components' }
	}
};

export default config;
