import type { Ajustes, DB } from '@novaz/core';

declare global {
	namespace App {
		interface Locals {
			db: DB;
			usuario: string;
			ajustes: Ajustes;
			hoy: string;
		}
		interface Platform {
			env: {
				DB: D1Database;
				ARCHIVOS: R2Bucket;
				/** Workers AI: lectura de tickets por foto. */
				AI?: Ai;
				ACCESS_TEAM_DOMAIN?: string;
				ACCESS_AUD?: string;
				/** Secreto: token del bot de Telegram (informe de prueba y bot en las dos direcciones). */
				TELEGRAM_TOKEN?: string;
				/** Solo para pruebas: otra URL para la API de Telegram (un simulador). */
				TELEGRAM_API?: string;
				/** Solo para pruebas: 'si' permite servir sin Cloudflare Access. */
				PERMITIR_SIN_ACCESS?: string;
			};
			ctx: ExecutionContext;
			caches: CacheStorage & { default: Cache };
		}
	}
}

export {};
