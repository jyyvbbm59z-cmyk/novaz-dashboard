// Worker programado: avisos diarios por Telegram y copia de seguridad semanal en R2.
import { avisosDelDia, copiaDeSeguridad, CRON_COPIA, type Env } from './tareas';

export default {
	async scheduled(evento: ScheduledController, env: Env, ctx: ExecutionContext) {
		ctx.waitUntil(evento.cron === CRON_COPIA ? copiaDeSeguridad(env) : avisosDelDia(env));
	}
} satisfies ExportedHandler<Env>;
