// Retours sonores (Web Audio, sans fichier) et haptiques. Tout est silencieux si le navigateur refuse.
const MUTE_KEY = 'adventuregame:muted';

let context = null;
let noiseBuffer = null;

export function isMuted() {
  try {
    return localStorage.getItem(MUTE_KEY) === '1';
  } catch {
    return false;
  }
}

export function toggleMuted() {
  const muted = !isMuted();
  try {
    localStorage.setItem(MUTE_KEY, muted ? '1' : '0');
  } catch {
    // Préférence non persistée : elle vaut pour la session.
  }
  return muted;
}

export function vibrate(pattern) {
  try {
    navigator.vibrate?.(pattern);
  } catch {
    // Pas de vibreur : rien à faire.
  }
}

export function playDiceRattle() {
  const ctx = audio();
  if (!ctx) return;
  const now = ctx.currentTime;
  for (let i = 0; i < 6; i++) {
    noiseBurst(ctx, now + i * 0.085 + Math.random() * 0.03, 0.045, 0.5 - i * 0.06, 1800 + Math.random() * 800);
  }
}

export function playHit() {
  const ctx = audio();
  if (!ctx) return;
  thump(ctx, ctx.currentTime, 180, 70, 0.18, 0.5);
}

export function playWounded() {
  const ctx = audio();
  if (!ctx) return;
  const now = ctx.currentTime;
  thump(ctx, now, 110, 40, 0.3, 0.7);
  noiseBurst(ctx, now, 0.12, 0.35, 600);
}

export function playSuccess() {
  const ctx = audio();
  if (!ctx) return;
  const now = ctx.currentTime;
  tone(ctx, now, 523, 0.14, 0.25);
  tone(ctx, now + 0.13, 784, 0.25, 0.25);
}

export function playFailure() {
  const ctx = audio();
  if (!ctx) return;
  const now = ctx.currentTime;
  tone(ctx, now, 330, 0.18, 0.25);
  tone(ctx, now + 0.17, 196, 0.35, 0.25);
}

function audio() {
  if (isMuted()) return null;
  try {
    context ??= new (window.AudioContext || window.webkitAudioContext)();
    if (context.state === 'suspended') {
      context.resume();
    }
    return context;
  } catch {
    return null;
  }
}

function noiseBurst(ctx, at, duration, gain, frequency) {
  const source = ctx.createBufferSource();
  source.buffer = noise(ctx);
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = frequency;
  filter.Q.value = 1.2;
  const envelope = ctx.createGain();
  envelope.gain.setValueAtTime(gain, at);
  envelope.gain.exponentialRampToValueAtTime(0.001, at + duration);
  source.connect(filter).connect(envelope).connect(ctx.destination);
  source.start(at);
  source.stop(at + duration);
}

function thump(ctx, at, fromHz, toHz, duration, gain) {
  const oscillator = ctx.createOscillator();
  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(fromHz, at);
  oscillator.frequency.exponentialRampToValueAtTime(toHz, at + duration);
  const envelope = ctx.createGain();
  envelope.gain.setValueAtTime(gain, at);
  envelope.gain.exponentialRampToValueAtTime(0.001, at + duration);
  oscillator.connect(envelope).connect(ctx.destination);
  oscillator.start(at);
  oscillator.stop(at + duration);
}

function tone(ctx, at, frequency, duration, gain) {
  const oscillator = ctx.createOscillator();
  oscillator.type = 'triangle';
  oscillator.frequency.value = frequency;
  const envelope = ctx.createGain();
  envelope.gain.setValueAtTime(0.0001, at);
  envelope.gain.exponentialRampToValueAtTime(gain, at + 0.02);
  envelope.gain.exponentialRampToValueAtTime(0.001, at + duration);
  oscillator.connect(envelope).connect(ctx.destination);
  oscillator.start(at);
  oscillator.stop(at + duration);
}

function noise(ctx) {
  if (!noiseBuffer) {
    noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.2, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = Math.random() * 2 - 1;
    }
  }
  return noiseBuffer;
}
