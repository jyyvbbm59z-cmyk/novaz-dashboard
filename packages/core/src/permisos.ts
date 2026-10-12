// Usuarios y permisos: cada uno ve y toca solo sus áreas. El login lo hace Cloudflare Access (código al email).

export const PERMISOS = ['vehiculos', 'inventario', 'local', 'dinero', 'ajustes'] as const;
export type Permiso = (typeof PERMISOS)[number];

export const NOMBRE_PERMISO: Record<Permiso, { nombre: string; detalle: string }> = {
	vehiculos: { nombre: 'Vehículos', detalle: 'Flota, papeles, mantenimiento, averías, restauraciones y agenda' },
	inventario: { nombre: 'Inventario y compras', detalle: 'Herramientas, recambios, plano del local y lista de la compra' },
	local: { nombre: 'El local', detalle: 'Tareas y reformas del local' },
	dinero: { nombre: 'Dinero', detalle: 'Banco, gastos, facturas, costes de los vehículos y precios' },
	ajustes: { nombre: 'Ajustes y usuarios', detalle: 'Configuración de la app y quién entra' }
};

/** Lo que tiene un usuario nuevo si no se dice otra cosa. */
export const PERMISOS_POR_DEFECTO: Permiso[] = ['vehiculos', 'inventario'];

export const normalizarPermisos = (xs: unknown): Permiso[] => (Array.isArray(xs) ? PERMISOS.filter((p) => xs.includes(p)) : []);

// Qué permiso hace falta para cada parte de la app (el primer prefijo que encaje)
const RUTAS: [RegExp, Permiso][] = [
	[/^\/(contabilidad|facturas|gastos)(\/|$)/, 'dinero'],
	[/^\/api\/(exportar|leer-ticket)(\/|$)/, 'dinero'],
	[/^\/archivos\/(movimiento|ajuste)\//, 'dinero'],
	[/^\/(flota|restauraciones|contactos|agenda|captura)(\/|$)/, 'vehiculos'],
	[/^\/api\/buscar(\/|$)/, 'vehiculos'],
	[/^\/archivos\/(vehiculo|entrada|vencimiento|pendiente|restauracion)\//, 'vehiculos'],
	[/^\/(inventario|compras)(\/|$)/, 'inventario'],
	[/^\/api\/leer-balda(\/|$)/, 'inventario'],
	[/^\/archivos\/articulo\//, 'inventario'],
	[/^\/local(\/|$)/, 'local'],
	[/^\/archivos\/local\//, 'local'],
	[/^\/ajustes(\/|$)/, 'ajustes']
];

/** El permiso que pide una ruta (null = cualquiera que pueda entrar: el inicio, su perfil, buscar…). */
export function permisoDeRuta(ruta: string): Permiso | null {
	return RUTAS.find(([re]) => re.test(ruta))?.[1] ?? null;
}

/** Qué partes del informe y del bot ve alguien con estos permisos. */
export const puede = (permisos: readonly Permiso[], p: Permiso) => permisos.includes(p);
