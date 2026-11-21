// Mothlight — all drawing: floor, light pools, cover, cones, actors, HUD.
// The night palette keeps the thief and the guards readable against the
// floor, and the lit pools show exactly where it is unsafe to be seen.
import { CONE_RANGE, CONE_HALF_ANGLE } from './guards.js';

const NIGHT = '#12172a';
const FLOOR_A = '#1b2138';
const FLOOR_B = '#181d31';

export function drawWorld(ctx, world) {
  const { level, player, guards, pebbles, shardsLeft, time } = world;
  ctx.clearRect(0, 0, 960, 600);

  drawFloor(ctx, time);
  drawLights(ctx, level.lights, time);
  drawExit(ctx, level.exit, shardsLeft === 0, time);
  drawCover(ctx, level.cover, time);
  drawWalls(ctx, level.walls);
  drawShards(ctx, world.shards, time);
  drawPebbles(ctx, pebbles);
  for (const g of guards) drawGuard(ctx, g);
  drawPlayer(ctx, player, time);
  drawNoise(ctx, world.noiseRings);
}

function drawFloor(ctx, time) {
  ctx.fillStyle = NIGHT;
  ctx.fillRect(0, 0, 960, 600);
  for (let y = 0; y < 600; y += 48) {
    for (let x = 0; x < 960; x += 48) {
      ctx.fillStyle = ((x + y) / 48) % 2 === 0 ? FLOOR_A : FLOOR_B;
      ctx.fillRect(x, y, 48, 48);
    }
  }
  // faint moonlit tiles
  ctx.strokeStyle = 'rgba(140,160,220,0.07)';
  ctx.lineWidth = 1;
  for (let x = 0; x <= 960; x += 48) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 600); ctx.stroke(); }
  for (let y = 0; y <= 600; y += 48) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(960, y); ctx.stroke(); }
}

function drawLights(ctx, lights, time) {
  for (const l of lights) {
    const flicker = 0.9 + Math.sin(time * 2.1 + l.x) * 0.06;
    const grad = ctx.createRadialGradient(l.x, l.y, 8, l.x, l.y, l.r * flicker);
    grad.addColorStop(0, 'rgba(255, 214, 130, 0.20)');
    grad.addColorStop(1, 'rgba(255, 214, 130, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.arc(l.x, l.y, l.r * flicker, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffd682';
    ctx.beginPath(); ctx.arc(l.x, l.y, 5, 0, Math.PI * 2); ctx.fill();
  }
}

function drawWalls(ctx, walls) {
  for (const w of walls) {
    ctx.fillStyle = '#3a4266';
    ctx.fillRect(w.x, w.y, w.w, w.h);
    ctx.fillStyle = '#4d5878';
    ctx.fillRect(w.x, w.y, w.w, 5);
    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.strokeRect(w.x + 0.5, w.y + 0.5, w.w - 1, w.h - 1);
  }
}

function drawCover(ctx, cover, time) {
  for (const c of cover) {
    if (c.kind === 'bush') {
      ctx.fillStyle = '#1e4d2e';
      ctx.fillRect(c.x, c.y, c.w, c.h);
      ctx.fillStyle = '#2c6b3f';
      for (let i = 0; i < 7; i++) {
        const bx = c.x + 10 + ((i * 37) % (c.w - 16));
        const by = c.y + 10 + ((i * 23) % (c.h - 16));
        ctx.beginPath(); ctx.arc(bx, by, 9 + Math.sin(time + i) * 1.5, 0, Math.PI * 2); ctx.fill();
      }
    } else {
      ctx.fillStyle = '#6b4a26';
      ctx.fillRect(c.x, c.y, c.w, c.h);
      ctx.strokeStyle = '#8a6238'; ctx.lineWidth = 3;
      ctx.strokeRect(c.x + 4, c.y + 4, c.w - 8, c.h - 8);
      ctx.beginPath(); ctx.moveTo(c.x, c.y); ctx.lineTo(c.x + c.w, c.y + c.h); ctx.stroke();
    }
  }
}

function drawExit(ctx, exit, open, time) {
  const pulse = open ? 0.75 + Math.sin(time * 4) * 0.25 : 0.25;
  ctx.fillStyle = open ? `rgba(120, 220, 160, ${pulse})` : 'rgba(120, 140, 160, 0.25)';
  ctx.fillRect(exit.x, exit.y, exit.w, exit.h);
  ctx.strokeStyle = open ? '#7fe0a8' : '#5a6a80'; ctx.lineWidth = 3;
  ctx.strokeRect(exit.x, exit.y, exit.w, exit.h);
  ctx.fillStyle = open ? '#0d2b1a' : '#c8d4e4';
  ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText(open ? 'EXIT' : 'LOCKED', exit.x + exit.w / 2, exit.y + exit.h / 2 + 5);
}

function drawShards(ctx, shards, time) {
  for (const s of shards) {
    const bob = Math.sin(time * 3 + s.x) * 3;
    const grad = ctx.createRadialGradient(s.x, s.y + bob, 2, s.x, s.y + bob, 26);
    grad.addColorStop(0, 'rgba(180, 230, 255, 0.8)');
    grad.addColorStop(1, 'rgba(180, 230, 255, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.arc(s.x, s.y + bob, 26, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#bfe9ff';
    ctx.beginPath();
    ctx.moveTo(s.x, s.y - 12 + bob); ctx.lineTo(s.x + 8, s.y + bob);
    ctx.lineTo(s.x, s.y + 12 + bob); ctx.lineTo(s.x - 8, s.y + bob);
    ctx.closePath(); ctx.fill();
  }
}

function drawPebbles(ctx, pebbles) {
  for (const p of pebbles) {
    ctx.fillStyle = '#c9c9c9';
    ctx.beginPath(); ctx.arc(p.x, p.y, 4, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = `rgba(255,255,255,${0.7 * (1 - p.t / p.life)})`;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(p.x, p.y, 6 + p.t * 26, 0, Math.PI * 2); ctx.stroke();
  }
}

function drawGuard(ctx, g) {
  // Vision cone: yellow while calm, orange while suspicious, red in chase.
  const color = g.state === 'chase' ? '255, 70, 60'
    : g.state === 'suspicious' || g.state === 'search' ? '255, 165, 60' : '255, 214, 90';
  const alpha = g.state === 'patrol' ? 0.16 : 0.26;
  ctx.fillStyle = `rgba(${color}, ${alpha})`;
  ctx.beginPath();
  ctx.moveTo(g.x, g.y);
  ctx.arc(g.x, g.y, CONE_RANGE, g.dir - CONE_HALF_ANGLE, g.dir + CONE_HALF_ANGLE);
  ctx.closePath(); ctx.fill();
  // Body: a warden in a deep-red coat with a lantern.
  const bobY = Math.sin(g.bob) * 1.5;
  ctx.fillStyle = '#8c2f2f';
  ctx.beginPath(); ctx.arc(g.x, g.y + bobY, 13, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#d8b25a';
  ctx.beginPath(); ctx.arc(g.x, g.y + bobY, 13, -0.6, 0.6); ctx.lineTo(g.x, g.y + bobY); ctx.fill();
  ctx.fillStyle = '#ffd682';
  ctx.beginPath(); ctx.arc(g.x + Math.cos(g.dir) * 16, g.y + Math.sin(g.dir) * 16 + bobY, 4, 0, Math.PI * 2); ctx.fill();
  // Detection arc above the head.
  if (g.detect > 2) {
    ctx.strokeStyle = g.detect > 70 ? '#ff463c' : '#ffc93c';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(g.x, g.y + bobY, 19, -Math.PI / 2, -Math.PI / 2 + (g.detect / 100) * Math.PI * 2);
    ctx.stroke();
    if (g.detect > 70) {
      ctx.fillStyle = '#ff463c'; ctx.font = 'bold 16px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('!', g.x, g.y - 26 + bobY);
    }
  }
}

function drawPlayer(ctx, p, time) {
  const bobY = p.moving ? Math.sin(time * 10) * 1.5 : 0;
  // soft shadow
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath(); ctx.ellipse(p.x, p.y + 9, 12, 5, 0, 0, Math.PI * 2); ctx.fill();
  // Pip the moth-thief: pale cloak, wide wings.
  ctx.fillStyle = p.hidden ? 'rgba(190, 220, 255, 0.55)' : '#dfe9ff';
  ctx.beginPath();
  ctx.ellipse(p.x - 9, p.y + bobY - 2, 9, 13, -0.5, 0, Math.PI * 2);
  ctx.ellipse(p.x + 9, p.y + bobY - 2, 9, 13, 0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#2b3350';
  ctx.beginPath(); ctx.arc(p.x, p.y + bobY, p.r, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#ffd682';
  ctx.beginPath(); ctx.arc(p.x + Math.cos(p.dir) * 5, p.y + Math.sin(p.dir) * 5 + bobY, 3.5, 0, Math.PI * 2); ctx.fill();
  if (p.hidden) {
    ctx.fillStyle = '#7fe0a8'; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('HIDDEN', p.x, p.y - 20 + bobY);
  }
}

function drawNoise(ctx, rings) {
  for (const r of rings) {
    ctx.strokeStyle = `rgba(255, 220, 120, ${0.8 * (1 - r.t / r.life)})`;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(r.x, r.y, 8 + r.t * 60, 0, Math.PI * 2); ctx.stroke();
  }
}

// ---- HUD and screens (drawn over the world) ----

export function drawHUD(ctx, world) {
  const { levelIndex, shardsLeft, totalShards, player, hearts, time } = world;
  ctx.fillStyle = 'rgba(6, 8, 16, 0.72)';
  ctx.fillRect(0, 0, 960, 44);
  ctx.fillStyle = '#e8ecf7'; ctx.font = 'bold 16px sans-serif'; ctx.textAlign = 'left';
  ctx.fillText(world.level.name, 16, 20);
  ctx.font = '12px sans-serif'; ctx.fillStyle = '#9fb0d8';
  ctx.fillText(`Level ${levelIndex + 1}/3`, 16, 38);
  // shards: diamonds centred on 460, label to their right
  ctx.textAlign = 'center';
  for (let i = 0; i < totalShards; i++) {
    ctx.fillStyle = i < totalShards - shardsLeft ? '#bfe9ff' : 'rgba(120,140,170,0.35)';
    ctx.beginPath();
    const sx = 440 + (i - (totalShards - 1) / 2) * 24;
    ctx.moveTo(sx, 14); ctx.lineTo(sx + 7, 24); ctx.lineTo(sx, 34); ctx.lineTo(sx - 7, 24);
    ctx.closePath(); ctx.fill();
  }
  ctx.fillStyle = '#9fb0d8'; ctx.font = '13px sans-serif'; ctx.textAlign = 'left';
  ctx.fillText(`Moon shards ${totalShards - shardsLeft}/${totalShards}`, 510, 28);
  // hearts
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = i < hearts ? '#ff5d73' : 'rgba(120,140,170,0.3)';
    ctx.font = '18px sans-serif'; ctx.fillText('♥', 640 + i * 24, 29);
  }
  // pebbles
  ctx.fillStyle = '#c9c9c9'; ctx.font = '13px sans-serif'; ctx.textAlign = 'left';
  ctx.fillText(`● ${player.pebbles} pebbles`, 730, 28);
  // alarm eye
  const alarm = world.alarm;
  ctx.textAlign = 'right';
  ctx.fillStyle = alarm > 70 ? '#ff463c' : alarm > 30 ? '#ffc93c' : '#7fe0a8';
  ctx.font = 'bold 15px sans-serif';
  ctx.fillText(alarm > 70 ? '◉ SEEN!' : alarm > 30 ? '◉ SUSPICIOUS' : '◉ UNSEEN', 948, 28);
  // hint line
  ctx.fillStyle = 'rgba(159,176,216,0.85)'; ctx.font = '12px sans-serif'; ctx.textAlign = 'left';
  ctx.fillText(world.level.hint, 16, 590);
}

export function drawTitle(ctx, time) {
  ctx.fillStyle = 'rgba(6, 8, 16, 0.88)';
  ctx.fillRect(0, 0, 960, 600);
  const glow = 0.6 + Math.sin(time * 1.5) * 0.25;
  ctx.fillStyle = `rgba(191, 233, 255, ${glow})`;
  ctx.font = 'bold 64px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('MOTHLIGHT', 480, 190);
  ctx.fillStyle = '#ffd682'; ctx.font = '20px sans-serif';
  ctx.fillText('a quiet heist · steal the moon shards · slip out unseen', 480, 230);
  ctx.fillStyle = '#c8d4e4'; ctx.font = '16px sans-serif';
  ctx.fillText('WASD / arrows — move      Shift — sneak      Click — toss a pebble', 480, 300);
  ctx.fillText('Hide in bushes and behind crates. Lantern light sees you faster.', 480, 330);
  ctx.fillText('If a guard fills the ring above its head, run — or break line of sight.', 480, 360);
  ctx.fillStyle = '#7fe0a8'; ctx.font = 'bold 18px sans-serif';
  ctx.fillText('Press ENTER or click to begin', 480, 430);
  ctx.fillStyle = '#9fb0d8'; ctx.font = '13px sans-serif';
  ctx.fillText('3 rooms · 12 moon shards · 1 very quiet moth', 480, 480);
}

export function drawBanner(ctx, title, sub) {
  ctx.fillStyle = 'rgba(6, 8, 16, 0.78)';
  ctx.fillRect(0, 220, 960, 150);
  ctx.fillStyle = '#ffd682'; ctx.font = 'bold 44px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText(title, 480, 285);
  ctx.fillStyle = '#e8ecf7'; ctx.font = '18px sans-serif';
  ctx.fillText(sub, 480, 325);
}
