// Mothlight — the thief: movement, sneaking, noise and pebble throws.
import { hitsWall, inCover } from './level.js';

export function makePlayer(start) {
  return {
    x: start.x, y: start.y, r: 12, dir: -Math.PI / 2,
    sneaking: false, running: false, moving: false,
    pebbles: 6, stepT: 0, hidden: false,
  };
}

// Move the thief with the held keys. Returns how loud the step was (0..1).
export function updatePlayer(p, dt, keys, walls, cover) {
  let dx = 0, dy = 0;
  if (keys.has('arrowup') || keys.has('w')) dy -= 1;
  if (keys.has('arrowdown') || keys.has('s')) dy += 1;
  if (keys.has('arrowleft') || keys.has('a')) dx -= 1;
  if (keys.has('arrowright') || keys.has('d')) dx += 1;
  p.sneaking = keys.has('shift');
  p.moving = dx !== 0 || dy !== 0;
  p.running = p.moving && !p.sneaking;
  const speed = p.sneaking ? 78 : 168;
  if (p.moving) {
    const len = Math.hypot(dx, dy);
    dx /= len; dy /= len;
    p.dir = Math.atan2(dy, dx);
    const nx = p.x + dx * speed * dt, ny = p.y + dy * speed * dt;
    if (!hitsWall(walls, nx, p.y, p.r)) p.x = nx;
    if (!hitsWall(walls, p.x, ny, p.r)) p.y = ny;
    // Footstep timing: slow soft steps while sneaking, quick loud ones running.
    p.stepT -= dt;
    if (p.stepT <= 0) {
      p.stepT = p.sneaking ? 0.55 : 0.3;
      return p.sneaking ? 0.15 : 1;
    }
  }
  p.hidden = inCover(cover, p.x, p.y) && !p.running;
  // Standing still in cover is the safest spot in the manor: no noise at all.
  if (!p.moving) p.stepT = 0;
  return 0;
}

// Throw a pebble toward (tx, ty): it lands, rings, and lures nearby guards.
export function throwPebble(p, tx, ty, pebbles) {
  if (p.pebbles <= 0) return null;
  const dx = tx - p.x, dy = ty - p.y;
  const d = Math.hypot(dx, dy);
  const range = Math.min(d, 260);
  const peb = {
    x: p.x + (d ? dx / d : 0) * range,
    y: p.y + (d ? dy / d : 0) * range,
    t: 0, life: 2.2, claimed: false,
  };
  p.pebbles -= 1;
  pebbles.push(peb);
  return peb;
}
