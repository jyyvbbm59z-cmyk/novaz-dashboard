import { createRemoteJWKSet, jwtVerify } from 'jose';

// Cloudflare Access firma un JWT en la cabecera `Cf-Access-Jwt-Assertion`.
// Lo verificamos aquí para que la app nunca quede abierta aunque alguien llegue al Worker directamente.
const jwks = new Map<string, ReturnType<typeof createRemoteJWKSet>>();

export async function verificarAccess(request: Request, equipo: string, aud: string): Promise<string | null> {
	const token = request.headers.get('cf-access-jwt-assertion');
	if (!token) return null;
	const emisor = `https://${equipo.replace(/^https?:\/\//, '').replace(/\/$/, '')}`;
	let claves = jwks.get(emisor);
	if (!claves) {
		claves = createRemoteJWKSet(new URL(`${emisor}/cdn-cgi/access/certs`));
		jwks.set(emisor, claves);
	}
	try {
		const { payload } = await jwtVerify(token, claves, { issuer: emisor, audience: aud });
		return typeof payload.email === 'string' ? payload.email : (payload.sub ?? 'desconocido');
	} catch {
		return null;
	}
}

/** Lee el `aud` de un token SIN verificarlo. Solo para mostrarlo durante la instalación. */
export function audSinVerificar(token: string | null): string | null {
	if (!token) return null;
	try {
		const carga = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
		const aud = Array.isArray(carga.aud) ? carga.aud[0] : carga.aud;
		return typeof aud === 'string' && /^[0-9a-f]{32,128}$/i.test(aud) ? aud : null;
	} catch {
		return null;
	}
}
