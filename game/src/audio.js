// Mothlight — procedural sound: no audio files, everything is synthesized
// with the Web Audio API so the game loads with zero network requests.
// Footsteps, pebble ticks, shard chimes, alarm stings and a low night hum.
let ctx = null;
let humNodes = null;

export function ensureAudio() {
  if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
  try {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
  } catch { ctx = null; }
}

function tone(freq, dur, type, vol, slideTo) {
  if (!ctx) return;
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
  gain.gain.setValueAtTime(vol, t);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(gain).connect(ctx.destination);
  osc.start(t); osc.stop(t + dur + 0.02);
}

export function playStep(loud) {
  tone(loud ? 140 : 90, 0.07, 'triangle', loud ? 0.10 : 0.035);
}

export function playClick() {
  tone(660, 0.06, 'sine', 0.06);
}

export function playPebble() {
  tone(1200, 0.08, 'square', 0.05, 700);
  setTimeout(() => tone(900, 0.1, 'square', 0.04, 500), 90);
}

export function playShard() {
  tone(880, 0.18, 'sine', 0.12);
  setTimeout(() => tone(1318, 0.28, 'sine', 0.10), 90);
}

export function playAlarm() {
  tone(220, 0.5, 'sawtooth', 0.09, 440);
}

export function playCaught() {
  tone(330, 0.4, 'sawtooth', 0.10, 110);
}

export function playWin() {
  [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => tone(f, 0.3, 'sine', 0.11), i * 120));
}

export function startHum() {
  if (!ctx || humNodes) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine'; osc.frequency.value = 55;
  gain.gain.value = 0.025;
  const lfo = ctx.createOscillator();
  const lfoGain = ctx.createGain();
  lfo.frequency.value = 0.1; lfoGain.gain.value = 0.012;
  lfo.connect(lfoGain).connect(gain.gain);
  osc.connect(gain).connect(ctx.destination);
  osc.start(); lfo.start();
  humNodes = { osc, lfo };
}
