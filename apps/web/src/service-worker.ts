/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />
// Cachea el "esqueleto" de la app (JS/CSS/fuentes) para que abra al instante.
// Los datos siempre van a la red: sin conexión se muestra un aviso, y los borradores
// de entradas quedan guardados en el móvil.
import { build, files, version } from '$service-worker';

const sw = self as unknown as ServiceWorkerGlobalScope;
const CACHE = `novaz-${version}`;
const ESTATICOS = [...build, ...files.filter((f) => !f.endsWith('.webmanifest'))];

sw.addEventListener('install', (e) => {
	e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ESTATICOS)).then(() => sw.skipWaiting()));
});

sw.addEventListener('activate', (e) => {
	e.waitUntil(
		caches
			.keys()
			.then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
			.then(() => sw.clients.claim())
	);
});

const SIN_CONEXION = `<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Sin conexión</title><body style="margin:0;min-height:100dvh;display:grid;place-items:center;background:#0d0e10;color:#ecebe8;font-family:system-ui;text-align:center;padding:2rem">
<div><p style="font-size:3rem;margin:0">🔧</p><h1 style="font-weight:700;letter-spacing:.05em;text-transform:uppercase">Sin conexión</h1>
<p style="color:#a3a8b0">Lo que estabas escribiendo sigue guardado como borrador.<br>Vuelve a intentarlo cuando haya cobertura.</p>
<button onclick="location.reload()" style="margin-top:1rem;padding:.8rem 1.4rem;border:0;border-radius:.6rem;background:#f2a33a;font-weight:700">Reintentar</button></div></body></html>`;

sw.addEventListener('fetch', (e) => {
	const req = e.request;
	if (req.method !== 'GET') return;
	const url = new URL(req.url);
	if (url.origin !== sw.location.origin) return;

	if (ESTATICOS.includes(url.pathname)) {
		e.respondWith(caches.match(url.pathname).then((r) => r ?? fetch(req)));
		return;
	}
	if (req.mode === 'navigate') {
		e.respondWith(fetch(req).catch(() => new Response(SIN_CONEXION, { headers: { 'content-type': 'text/html; charset=utf-8' } })));
	}
});
