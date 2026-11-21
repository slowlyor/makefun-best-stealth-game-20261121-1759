// Mothlight — level definitions: walls, cover, shards, exit, guard patrols.
// One level is a single room of the old manor, seen from above. Walls block
// movement and sight; bushes and crates are cover you can hide inside.
export function buildLevels() {
  const border = [
    { x: 0, y: 0, w: 960, h: 24 }, { x: 0, y: 576, w: 960, h: 24 },
    { x: 0, y: 0, w: 24, h: 600 }, { x: 936, y: 0, w: 24, h: 600 },
  ];
  return [
    {
      name: '1 · The Garden Gate', hint: 'Bushes hide you. Stay out of the yellow cones.',
      start: { x: 70, y: 520 },
      exit: { x: 872, y: 60, w: 56, h: 56 },
      shards: [{ x: 480, y: 110 }, { x: 200, y: 200 }, { x: 760, y: 420 }],
      walls: [...border,
        { x: 300, y: 120, w: 180, h: 26 }, { x: 620, y: 240, w: 26, h: 180 },
        { x: 180, y: 380, w: 200, h: 26 }, { x: 560, y: 420, w: 220, h: 26 }],
      cover: [
        { x: 120, y: 120, w: 90, h: 70, kind: 'bush' },
        { x: 420, y: 300, w: 90, h: 70, kind: 'bush' },
        { x: 700, y: 120, w: 90, h: 70, kind: 'bush' },
        { x: 250, y: 470, w: 70, h: 60, kind: 'crate' },
        { x: 640, y: 500, w: 70, h: 60, kind: 'crate' }],
      lights: [{ x: 480, y: 300, r: 130 }, { x: 820, y: 300, r: 110 }],
      guards: [
        { path: [[300, 300], [700, 300], [700, 180], [300, 180]], speed: 55 },
        { path: [[820, 480], [820, 180], [480, 480]], speed: 48 }],
    },
    {
      name: '2 · The Lantern Hall', hint: 'Lantern light sees you faster. Sneak (hold Shift) to stay quiet.',
      start: { x: 70, y: 80 },
      exit: { x: 872, y: 500, w: 56, h: 56 },
      shards: [{ x: 480, y: 90 }, { x: 150, y: 300 }, { x: 800, y: 150 }, { x: 480, y: 500 }],
      walls: [...border,
        { x: 240, y: 140, w: 26, h: 220 }, { x: 480, y: 220, w: 220, h: 26 },
        { x: 700, y: 140, w: 26, h: 220 }, { x: 240, y: 420, w: 220, h: 26 },
        { x: 620, y: 420, w: 26, h: 120 }],
      cover: [
        { x: 120, y: 420, w: 90, h: 70, kind: 'bush' },
        { x: 360, y: 90, w: 90, h: 70, kind: 'bush' },
        { x: 820, y: 300, w: 70, h: 60, kind: 'crate' },
        { x: 540, y: 300, w: 90, h: 70, kind: 'bush' },
        { x: 120, y: 180, w: 70, h: 60, kind: 'crate' }],
      lights: [{ x: 360, y: 300, r: 140 }, { x: 660, y: 300, r: 140 }, { x: 480, y: 90, r: 100 }],
      guards: [
        { path: [[360, 480], [360, 180], [600, 180], [600, 480]], speed: 60 },
        { path: [[820, 480], [820, 300], [500, 300]], speed: 52 },
        { path: [[150, 520], [480, 520], [820, 520]], speed: 58 }],
    },
    {
      name: '3 · The Moon Vault', hint: 'Four wardens, one vault. Click to toss a pebble and pull a guard away.',
      start: { x: 480, y: 520 },
      exit: { x: 480, y: 40, w: 56, h: 56 },
      shards: [{ x: 120, y: 120 }, { x: 840, y: 120 }, { x: 120, y: 480 }, { x: 840, y: 480 }, { x: 480, y: 300 }],
      walls: [...border,
        { x: 200, y: 160, w: 200, h: 26 }, { x: 560, y: 160, w: 200, h: 26 },
        { x: 200, y: 414, w: 200, h: 26 }, { x: 560, y: 414, w: 200, h: 26 },
        { x: 460, y: 220, w: 40, h: 160 }],
      cover: [
        { x: 300, y: 260, w: 90, h: 70, kind: 'bush' },
        { x: 570, y: 260, w: 90, h: 70, kind: 'bush' },
        { x: 120, y: 280, w: 70, h: 60, kind: 'crate' },
        { x: 770, y: 280, w: 70, h: 60, kind: 'crate' },
        { x: 420, y: 90, w: 120, h: 50, kind: 'bush' }],
      lights: [{ x: 480, y: 300, r: 150 }, { x: 150, y: 300, r: 110 }, { x: 810, y: 300, r: 110 }],
      guards: [
        { path: [[300, 300], [660, 300]], speed: 62 },
        { path: [[150, 150], [150, 450], [480, 450], [480, 150]], speed: 55 },
        { path: [[810, 150], [810, 450], [480, 450], [480, 150]], speed: 55 },
        { path: [[300, 520], [660, 520], [660, 90], [300, 90]], speed: 50 }],
    },
  ];
}

// True when a circle at (x, y) with radius r touches any wall rect.
export function hitsWall(walls, x, y, r) {
  for (const w of walls) {
    const cx = Math.max(w.x, Math.min(x, w.x + w.w));
    const cy = Math.max(w.y, Math.min(y, w.y + w.h));
    if ((x - cx) ** 2 + (y - cy) ** 2 < r * r) return true;
  }
  return false;
}

// True when the segment a->b is blocked by any wall (sight line check).
export function sightBlocked(walls, ax, ay, bx, by) {
  for (const w of walls) {
    if (segmentHitsRect(ax, ay, bx, by, w)) return true;
  }
  return false;
}

function segmentHitsRect(ax, ay, bx, by, r) {
  // Slab test: does the segment enter the rect?
  const dx = bx - ax, dy = by - ay;
  let t0 = 0, t1 = 1;
  for (const [p, q] of [[-dx, ax - r.x], [dx, r.x + r.w - ax], [-dy, ay - r.y], [dy, r.y + r.h - ay]]) {
    if (p === 0) { if (q < 0) return false; continue; }
    const t = q / p;
    if (p < 0) { if (t > t1) return false; if (t > t0) t0 = t; }
    else { if (t < t0) return false; if (t < t1) t1 = t; }
  }
  return true;
}

// True when point (x, y) is inside any cover rect of the level.
export function inCover(cover, x, y) {
  return cover.some(c => x > c.x && x < c.x + c.w && y > c.y && y < c.y + c.h);
}

// True when point (x, y) is inside a lit pool.
export function inLight(lights, x, y) {
  return lights.some(l => (x - l.x) ** 2 + (y - l.y) ** 2 < l.r * l.r);
}
