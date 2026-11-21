// Mothlight — game loop and state machine: title, playing, caught,
// level complete, game won, game over. Also serves the screenshot staging
// (?shot=start|mid|alert|win) used to photograph the real game.
import { buildLevels, inLight } from './level.js';
import { makeGuard, updateGuard, maxDetect } from './guards.js';
import { makePlayer, updatePlayer, throwPebble } from './player.js';
import { drawWorld, drawHUD, drawTitle, drawBanner } from './render.js';
import { makeInput } from './input.js';
import * as audio from './audio.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const statusEl = document.getElementById('status');

const levels = buildLevels();
const params = new URLSearchParams(location.search);
const shot = params.get('shot');

let state = 'title'; // title | playing | caught | levelDone | won | over
let levelIndex = 0;
let level, player, guards, shards, pebbles, noiseRings;
let hearts = 3;
let time = 0;
let bannerT = 0;
let banner = null;
let alarmed = false;

function loadLevel(i) {
  levelIndex = i;
  level = levels[i];
  player = makePlayer(level.start);
  guards = level.guards.map(makeGuard);
  shards = level.shards.map(s => ({ ...s }));
  pebbles = [];
  noiseRings = [];
  alarmed = false;
}

function resetRun() {
  hearts = 3;
  loadLevel(0);
  state = 'playing';
}

function announce(msg) { statusEl.textContent = msg; }

const keys = makeInput(canvas, (x, y) => {
  audio.ensureAudio(); audio.startHum();
  if (state === 'title') { resetRun(); return; }
  if (state === 'won' || state === 'over') { state = 'title'; return; }
  if (state !== 'playing') return;
  const peb = throwPebble(player, x, y, pebbles);
  if (peb) { audio.playPebble(); noiseRings.push({ x: peb.x, y: peb.y, t: 0, life: 0.6 }); }
}, () => {
  audio.ensureAudio(); audio.startHum();
  if (state === 'title') resetRun();
  else if (state === 'won' || state === 'over') state = 'title';
});

loadLevel(0);

function update(dt) {
  time += dt;
  if (state !== 'playing') {
    if (banner) { bannerT -= dt; if (bannerT <= 0) banner = null; }
    return;
  }
  const world = {
    walls: level.walls, cover: level.cover, player, pebbles,
    inLight: (x, y) => inLight(level.lights, x, y),
  };
  const loud = updatePlayer(player, dt, keys, level.walls, level.cover);
  if (loud > 0) {
    audio.playStep(loud);
    if (loud >= 1) noiseRings.push({ x: player.x, y: player.y, t: 0, life: 0.5 });
  }
  for (const g of guards) updateGuard(g, dt, world);
  for (const p of pebbles) p.t += dt;
  for (let i = pebbles.length - 1; i >= 0; i--) if (pebbles[i].t > pebbles[i].life) pebbles.splice(i, 1);
  for (const r of noiseRings) r.t += dt;
  for (let i = noiseRings.length - 1; i >= 0; i--) if (noiseRings[i].t > noiseRings[i].life) noiseRings.splice(i, 1);

  // Shard pickup.
  for (let i = shards.length - 1; i >= 0; i--) {
    if (Math.hypot(shards[i].x - player.x, shards[i].y - player.y) < 26) {
      shards.splice(i, 1);
      player.pebbles += 1;
      audio.playShard();
      announce(`Moon shard taken. ${shards.length} left.`);
    }
  }

  // Alarm sound the first time any guard gets hot.
  const alarm = maxDetect(guards);
  if (alarm > 70 && !alarmed) { alarmed = true; audio.playAlarm(); announce('Spotted! Break line of sight!'); }
  if (alarm < 30) alarmed = false;

  // Caught: a chasing guard touches the thief.
  const chaser = guards.find(g => g.state === 'chase' && Math.hypot(g.x - player.x, g.y - player.y) < 24);
  if (chaser) {
    hearts -= 1;
    audio.playCaught();
    if (hearts <= 0) { state = 'over'; announce('Caught for the last time. Game over.'); }
    else { state = 'caught'; banner = ['CAUGHT!', `The wardens found you — ${hearts} ${hearts === 1 ? 'heart' : 'hearts'} left`]; bannerT = 1.8; }
    return;
  }

  // Exit: only opens once every shard is stolen.
  const ex = level.exit;
  if (shards.length === 0 && player.x > ex.x && player.x < ex.x + ex.w && player.y > ex.y && player.y < ex.y + ex.h) {
    audio.playWin();
    if (levelIndex + 1 >= levels.length) { state = 'won'; announce('Every shard stolen. You vanish into the night.'); }
    else { state = 'levelDone'; banner = ['ROOM CLEARED', 'You slipped out with every shard']; bannerT = 2.2; }
  }
}

function render() {
  const world = {
    level, player, guards, shards, pebbles, noiseRings, time,
    shardsLeft: shards.length, totalShards: level.shards.length,
    levelIndex, hearts, alarm: guards.length ? maxDetect(guards) : 0,
  };
  if (state === 'title') { drawWorld(ctx, world); drawTitle(ctx, time); return; }
  drawWorld(ctx, world);
  if (state === 'playing' || state === 'caught' || state === 'levelDone') drawHUD(ctx, world);
  if (state === 'caught' && banner) drawBanner(ctx, banner[0], banner[1]);
  if (state === 'levelDone' && banner) drawBanner(ctx, banner[0], banner[1]);
  if (state === 'levelDone' && !banner) { loadLevel(levelIndex + 1); state = 'playing'; }
  if (state === 'caught' && !banner) { loadLevel(levelIndex); state = 'playing'; }
  if (state === 'won') drawBanner(ctx, 'THE NIGHT IS YOURS', 'All 12 moon shards stolen — press Enter to play again');
  if (state === 'over') drawBanner(ctx, 'CAUGHT IN THE DARK', 'The wardens win this time — press Enter to try again');
}

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  update(dt);
  render();
  requestAnimationFrame(frame);
}

// ---- Screenshot staging: real game states, driven by the same code ----
function stageShot() {
  if (shot === 'start') { state = 'title'; return; }
  state = 'playing';
  if (shot === 'mid') {
    // Level 1, mid-heist: thief hidden in a bush, a guard's cone sweeping past.
    player.x = 465; player.y = 335;
    guards[0].x = 560; guards[0].y = 300; guards[0].dir = Math.PI;
    guards[1].x = 820; guards[1].y = 300; guards[1].dir = -Math.PI / 2;
    shards.splice(2, 1); // one shard already stolen
  } else if (shot === 'alert') {
    // Level 2, nearly caught: alarm high, a guard charging at the thief.
    loadLevel(1);
    player.x = 480; player.y = 300;
    guards[0].x = 270; guards[0].y = 300; guards[0].dir = 0;
    guards[0].state = 'chase'; guards[0].detect = 92;
    guards[0].lastSeen = { x: player.x, y: player.y };
    guards[1].x = 700; guards[1].y = 200; guards[1].dir = Math.PI;
    guards[1].detect = 48; guards[1].state = 'suspicious';
    shards.splice(0, 2);
  } else if (shot === 'win') {
    loadLevel(2);
    shards.length = 0;
    player.x = 480; player.y = 90;
    guards[0].x = 300; guards[0].y = 300; guards[0].dir = 0;
    guards[3].x = 660; guards[3].y = 520; guards[3].dir = Math.PI / 2;
    state = 'won';
  }
}

if (shot) {
  stageShot();
  // Let a few frames run so cones, glow and HUD settle before the photo.
  for (let i = 0; i < 5; i++) update(1 / 60);
  render();
}
requestAnimationFrame(frame);
