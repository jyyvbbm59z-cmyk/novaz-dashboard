// Copia de seguridad: volcado de todas las tablas a un objeto JSON.
import { getTableName, type Table } from 'drizzle-orm';
import type { DB } from './consultas';
import * as schema from './schema';

export const TABLAS = (Object.values(schema) as unknown[]).filter(
	(v): v is Table => typeof v === 'object' && v !== null && Symbol.for('drizzle:IsDrizzleTable') in v
);

export async function volcado(db: DB) {
	const tablas: Record<string, unknown[]> = {};
	for (const t of TABLAS) tablas[getTableName(t)] = await db.select().from(t as never);
	return { app: 'novaz-dashboard', version: 1, fecha: new Date().toISOString(), tablas };
}
