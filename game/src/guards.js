// Mothlight — guard AI: patrols, vision cones, suspicion, chase and search.
// A guard walks its patrol route. When it can see the thief it fills its
// detection meter; a full meter means the thief is caught. A pebble's noise
// pulls a guard to investigate, which is how a patient thief slips past.
import { hitsWall, sightBlocked, inCover } from './level.js';

export const CONE_RANGE = 175;
export const CONE_HALF_ANGLE = Math.PI / 5; // 36 degrees each side

export function makeGuard(def) {
  const [sx, sy] = def.path[0];
  return {
    x: sx, y: sy, dir: 0, speed: def.speed, path: def.path,
    waypoint: 1, state: 'patrol', // patrol | suspicious | chase | search
    detect: 0, // 0..100, shared alarm level for this guard
    target: null, lastSeen: null, pause: 0, searchT: 0, heard: null,
    bob: Math.random() * Math.PI * 2,
  };
}

// Can this guard see the point (px, py)? Walls block sight; cover hides.
export function canSeeGuard(g, px, py, walls, cover, hidden) {
  const dx = px - g.x, dy = py - g.y;
  const dist = Math.hypot(dx, dy);
  if (dist > CONE_RANGE) return false;
  if (hidden) return dist < 34; // almost on top of a hidden thief
  let ang = Math.atan2(dy, dx) - g.dir;
  while (ang > Math.PI) ang -= Math.PI * 2;
  while (ang < -Math.PI) ang += Math.PI * 2;
  if (Math.abs(ang) > CONE_HALF_ANGLE) return false;
  return !sightBlocked(walls, g.x, g.y, px, py);
}

function moveToward(g, tx, ty, speed, dt, walls) {
  const dx = tx - g.x, dy = ty - g.y;
  const d = Math.hypot(dx, dy);
  if (d < 2) return true;
  g.dir = Math.atan2(dy, dx);
  const step = Math.min(d, speed * dt);
  const nx = g.x + (dx / d) * step, ny = g.y + (dy / d) * step;
  if (!hitsWall(walls, nx, g.y, 12)) g.x = nx;
  if (!hitsWall(walls, g.x, ny, 12)) g.y = ny;
  g.bob += dt * speed * 0.12;
  return d <= step + 1;
}

export function updateGuard(g, dt, world) {
  const { walls, cover, player, pebbles } = world;
  const hidden = inCover(cover, player.x, player.y) && !player.running;
  const seen = canSeeGuard(g, player.x, player.y, walls, cover, hidden);

  // Detection: rises fast up close or when the thief runs in the light,
  // slower at range and in the dark — always a chance to break away.
  if (seen) {
    const dist = Math.hypot(player.x - g.x, player.y - g.y);
    let rate = 34 + (1 - dist / CONE_RANGE) * 55;
    if (player.running) rate *= 1.5;
    if (world.inLight(player.x, player.y)) rate *= 1.4;
    else rate *= 0.75;
    g.detect = Math.min(100, g.detect + rate * dt);
    g.lastSeen = { x: player.x, y: player.y };
    if (g.detect >= 100) g.state = 'chase';
    else if (g.detect > 35 && g.state === 'patrol') g.state = 'suspicious';
  } else {
    g.detect = Math.max(0, g.detect - 16 * dt);
    if (g.detect < 25 && g.state === 'suspicious') g.state = 'patrol';
  }

  // A pebble landing nearby pulls the guard to investigate it.
  for (const p of pebbles) {
    if (!p.claimed && Math.hypot(p.x - g.x, p.y - g.y) < 190) {
      p.claimed = true;
      g.heard = { x: p.x, y: p.y };
      if (g.state === 'patrol') g.state = 'suspicious';
    }
  }

  switch (g.state) {
    case 'patrol': {
      if (g.pause > 0) { g.pause -= dt; break; }
      const wp = g.path[g.waypoint];
      if (moveToward(g, wp[0], wp[1], g.speed, dt, walls)) {
        g.waypoint = (g.waypoint + 1) % g.path.length;
        g.pause = 0.7; // a beat at each corner: patrols you can learn
      }
      break;
    }
    case 'suspicious': {
      const dest = g.heard || g.lastSeen;
      if (dest && moveToward(g, dest.x, dest.y, g.speed * 1.25, dt, walls)) {
        g.heard = null;
        g.state = 'search'; g.searchT = 2.6;
      } else if (!dest) g.state = 'patrol';
      break;
    }
    case 'chase': {
      if (seen) g.lastSeen = { x: player.x, y: player.y };
      if (g.lastSeen) moveToward(g, g.lastSeen.x, g.lastSeen.y, g.speed * 2.05, dt, walls);
      if (!seen) {
        // Lost the thief: the chase cools off into a search of the last spot.
        g.detect = Math.max(0, g.detect - 8 * dt);
        if (g.detect < 55) { g.state = 'search'; g.searchT = 3.5; }
      }
      break;
    }
    case 'search': {
      g.searchT -= dt;
      g.dir += dt * 1.6; // looks around, then gives up and goes back
      if (g.searchT <= 0) {
        g.state = 'patrol';
        // walk back to the nearest patrol point
        let best = 0, bd = Infinity;
        g.path.forEach((p, i) => {
          const d = Math.hypot(p[0] - g.x, p[1] - g.y);
          if (d < bd) { bd = d; best = i; }
        });
        g.waypoint = best;
      }
      break;
    }
  }
}

// Loudest current alarm across all guards — drives the HUD eye and music.
export function maxDetect(guards) {
  return guards.reduce((m, g) => Math.max(m, g.detect), 0);
}
