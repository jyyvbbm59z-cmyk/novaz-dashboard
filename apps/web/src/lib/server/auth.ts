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
