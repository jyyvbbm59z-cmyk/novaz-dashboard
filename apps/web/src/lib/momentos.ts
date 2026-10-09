// Momentos: efectos visuales y sonidos al completar cosas. Sonidos sintetizados (sin archivos).
import type { Ajustes, Efecto, EventoMomento, Sonido } from '@novaz/core';

let ajustes: Ajustes | null = null;
export function configurarMomentos(a: Ajustes) {
	ajustes = a;
}

let audio: AudioContext | null = null;
function ctx() {
	audio ??= new AudioContext();
	if (audio.state === 'suspended') audio.resume();
	return audio;
}

function ruido(c: AudioContext, t: number, dur: number, frec: number, vol: number, q = 1) {
	const buf = c.createBuffer(1, Math.ceil(c.sampleRate * dur), c.sampleRate);
	const d = buf.getChannelData(0);
	for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 3);
	const src = c.createBufferSource();
	src.buffer = buf;
	const f = c.createBiquadFilter();
	f.type = 'bandpass';
	f.frequency.value = frec;
	f.Q.value = q;
	const g = c.createGain();
	g.gain.value = vol;
	src.connect(f).connect(g).connect(c.destination);
	src.start(t);
}

function tono(c: AudioContext, t: number, frec: number, dur: number, vol: number) {
	const o = c.createOscillator();
	const g = c.createGain();
	o.type = 'sine';
	o.frequency.value = frec;
	g.gain.setValueAtTime(vol, t);
	g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
	o.connect(g).connect(c.destination);
	o.start(t);
	o.stop(t + dur);
}

export function sonar(sonido: Sonido, url?: string) {
	if (sonido === 'ninguno') return;
	if (sonido === 'personalizado') {
		if (url) new Audio(url).play().catch(() => {});
		return;
	}
	const c = ctx();
	const t = c.currentTime + 0.01;
	switch (sonido) {
		case 'clic':
			ruido(c, t, 0.05, 2400, 0.5, 2);
			break;
		case 'campana':
			tono(c, t, 1318.5, 1.6, 0.18);
			tono(c, t, 1975.5, 1.1, 0.07);
			tono(c, t + 0.005, 659.25, 1.8, 0.09);
			break;
		case 'llave': // carraca
			for (let i = 0; i < 7; i++) ruido(c, t + i * 0.045, 0.03, 3200 - i * 120, 0.55, 6);
			break;
		case 'aplausos':
			for (let i = 0; i < 70; i++) {
				const dt = Math.random() * 1.9 * Math.pow(Math.random(), 0.4);
				ruido(c, t + dt, 0.06, 1100 + Math.random() * 1400, 0.22 + Math.random() * 0.25, 1.4);
			}
			break;
	}
}

async function efecto(efecto: Efecto, el?: Element | null) {
	if (efecto === 'ninguno') return;
	if (efecto === 'pulso') {
		if (!el) return;
		el.classList.remove('anim-pulso');
		void (el as HTMLElement).offsetWidth;
		el.classList.add('anim-pulso');
		return;
	}
	const { default: confetti } = await import('canvas-confetti');
	const acento = getComputedStyle(document.documentElement).getPropertyValue('--acento').trim() || '#f2a33a';
	const colores = [acento, '#ffffff', '#ecebe8', '#8a8f98'];
	if (efecto === 'confeti') {
		confetti({ particleCount: 110, spread: 75, origin: { y: 0.7 }, colors: colores, disableForReducedMotion: true });
	} else {
		const fin = Date.now() + 1600;
		(function rafaga() {
			confetti({ particleCount: 6, angle: 60, spread: 60, origin: { x: 0, y: 0.75 }, colors: colores, disableForReducedMotion: true });
			confetti({ particleCount: 6, angle: 120, spread: 60, origin: { x: 1, y: 0.75 }, colors: colores, disableForReducedMotion: true });
			if (Date.now() < fin) requestAnimationFrame(rafaga);
		})();
	}
}

export function dispararMomento(evento: EventoMomento, el?: Element | null) {
	if (!ajustes?.momentosActivos) return;
	const m = ajustes.momentos[evento];
	if (!m) return;
	efecto(m.efecto, el);
	sonar(m.sonido, m.sonidoUrl);
}

/** Para la vista previa en Ajustes. */
export function probarMomento(m: { efecto: Efecto; sonido: Sonido; sonidoUrl?: string }, el?: Element | null) {
	efecto(m.efecto, el);
	sonar(m.sonido, m.sonidoUrl);
}
