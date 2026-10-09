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
				ACCESS_TEAM_DOMAIN?: string;
				ACCESS_AUD?: string;
				/** Secreto: token del bot de Telegram (para el botón de prueba). */
				TELEGRAM_TOKEN?: string;
				/** Solo para pruebas: 'si' permite servir sin Cloudflare Access. */
				PERMITIR_SIN_ACCESS?: string;
			};
			ctx: ExecutionContext;
			caches: CacheStorage & { default: Cache };
		}
	}
}

export {};
