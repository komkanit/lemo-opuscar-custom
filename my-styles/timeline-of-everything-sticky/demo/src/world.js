// The stage in depth: one depth factor k drives size, height on the ground and scroll speed.
import { INK, PAPER, shape, stroke, circle, ellipse, rrect, shade, rand } from './ink.js';
import { drawFigure, skeleton, OUTFITS } from './figure.js';

export const ERAS = {
  anatolia: { sky: '#cfe7ef', sky2: '#e4f1f2', far: '#d8c08c', farLine: '#b39a63', ground: '#d8b66e', ground2: '#cfaa5f', road: '#f1e5c6', roadLine: '#c4a96d', tuft: '#a98436', stone: '#eadbb6', stoneShade: '#d3c096', tree: '#8fa65a', cloudLine: '#a8c6d2' },
  britain: { sky: '#d3e5ee', sky2: '#e7f0f1', far: '#a9c38c', farLine: '#84a168', ground: '#8fb866', ground2: '#82ab5b', road: '#e9e2c9', roadLine: '#b3a77f', tuft: '#5e8a3b', stone: '#bdb8ae', stoneShade: '#a29d92', tree: '#5f9a4c', cloudLine: '#a6becb' },
  egypt: { sky: '#d6ecf3', sky2: '#ecf3ee', far: '#e9cf96', farLine: '#c7a963', ground: '#e2c27f', ground2: '#d8b46d', road: '#f5ead0', roadLine: '#cdb27a', tuft: '#b8954a', stone: '#ecd8a8', stoneShade: '#d4bd88', tree: '#6f9a4a', cloudLine: '#a9c9d4' },
};

// Layout anchors per frame (STYLE.md §2)
export function layout(W, H) {
  if (W >= H) { const u = H / 1080; return { W, H, u, wide: true, hor: 560 * u, G: 830 * u, Hf: 430 * u, ax: 0.36 * W }; }
  const u = W / 1080; return { W, H, u, wide: false, hor: 1010 * u, G: 1290 * u, Hf: 520 * u, ax: 0.5 * W };
}

// world metres -> screen. cam = road position (m) under the walker's hip.
export function makeView(L, cam) {
  const m = L.Hf / 1.7; // px per metre on the stage
  return {
    ...L, cam, m,
    sx: (X, k) => L.ax + (X - cam) * m * k,
    gy: (k) => L.hor + (L.G - L.hor) * k,
    s: (k) => m * k,
  };
}

// ---------- layers ----------
function sky(ctx, V, E) {
  ctx.fillStyle = E.sky; ctx.fillRect(0, 0, V.W, V.hor);
  ctx.fillStyle = E.sky2; ctx.fillRect(0, V.hor - (V.wide ? 150 : 260) * V.u, V.W, (V.wide ? 150 : 260) * V.u);
}

export function cloud(ctx, x, y, s, E, u) {
  const pts = [];
  const bumps = [[-1, 0.15, .42], [-0.55, -0.25, .55], [0.05, -0.42, .62], [0.6, -0.2, .5], [1.0, 0.12, .38]];
  ctx.save();
  ctx.beginPath();
  for (const [bx, by, r] of bumps) { ctx.moveTo(x + bx * s + r * s, y + by * s); ctx.arc(x + bx * s, y + by * s, r * s, 0, Math.PI * 2); }
  ctx.rect(x - 1.38 * s, y + 0.0 * s, 2.76 * s, 0.5 * s);
  ctx.restore();
  // union outline: stroke under, fill over
  ctx.save();
  ctx.lineWidth = 3.4 * u * 2; ctx.strokeStyle = E.cloudLine; ctx.lineJoin = 'round';
  const path = () => { ctx.beginPath(); for (const [bx, by, r] of bumps) { ctx.moveTo(x + bx * s + r * s, y + by * s); ctx.arc(x + bx * s, y + by * s, r * s, 0, Math.PI * 2); } ctx.roundRect(x - 1.4 * s, y - 0.02 * s, 2.8 * s, 0.52 * s, 0.26 * s); };
  path(); ctx.stroke(); ctx.fillStyle = '#ffffff'; path(); ctx.fill();
  ctx.restore();
  return pts;
}

function hills(ctx, V, E, k, seed, amp) {
  const R = rand(seed);
  const ph = [R() * 9, R() * 9, R() * 9];
  const base = V.gy(k);
  const pts = [];
  const step = 24 * V.u;
  for (let x = -step; x <= V.W + step; x += step) {
    const X = (x - V.ax) / (V.m * k) + V.cam; // world metres at this depth
    const y = base - amp * V.u * (V.z ?? 1) * (0.55 + 0.25 * Math.sin(X * 0.045 + ph[0]) + 0.15 * Math.sin(X * 0.11 + ph[1]) + 0.05 * Math.sin(X * 0.27 + ph[2]));
    pts.push([x, y]);
  }
  pts.push([V.W + step, base + 4 * V.u], [-step, base + 4 * V.u]);
  shape(ctx, pts, { fill: E.far, line: E.farLine, w: 3.2 * V.u, smooth: true });
}

function ground(ctx, V, E) {
  ctx.fillStyle = E.ground; ctx.fillRect(0, V.hor, V.W, V.H - V.hor);
  // road band under the walker
  const rz = Math.max(V.z ?? 1, 0.2);
  const top = V.G - 26 * V.u * rz, bot = V.G + 34 * V.u * rz;
  ctx.fillStyle = E.ground2; ctx.fillRect(0, bot, V.W, V.H - bot);
  ctx.fillStyle = E.road; ctx.fillRect(0, top, V.W, bot - top);
  stroke(ctx, [[-10, top], [V.W + 10, top]], 3 * V.u, E.roadLine);
  stroke(ctx, [[-10, bot], [V.W + 10, bot]], 3 * V.u, E.roadLine);
  stroke(ctx, [[-10, V.hor], [V.W + 10, V.hor]], 3.6 * V.u, INK);
}

function tufts(ctx, V, E, k, yOff, spacing, seed, size, col, w) {
  const m = V.m * k;
  const X0 = V.cam - V.ax / m - 2, X1 = V.cam + (V.W - V.ax) / m + 2;
  const R = rand(seed);
  const jit = Array.from({ length: 64 }, () => R());
  for (let i = Math.floor(X0 / spacing); i <= Math.ceil(X1 / spacing); i++) {
    const r = jit[((i % 64) + 64) % 64], r2 = jit[((i * 7 + 3) % 64 + 64) % 64];
    if (r < 0.35) continue;
    const X = i * spacing + r2 * spacing * 0.6;
    const x = V.ax + (X - V.cam) * m, y = V.gy(k) + yOff * V.u;
    const s = size * V.u * (V.z ?? 1) * (0.7 + r * 0.6);
    if (s < 2.5) continue;
    const blades = r2 > 0.5 ? [[-0.42, 0.7], [-0.08, 1.05], [0.3, 0.8]] : [[-0.3, 0.75], [0.22, 0.95]];
    ctx.lineWidth = w * V.u; ctx.strokeStyle = col; ctx.lineCap = 'round';
    for (const [bx, bh] of blades) { ctx.beginPath(); ctx.moveTo(x + bx * s * 0.25, y); ctx.quadraticCurveTo(x + bx * s * 0.45, y - bh * s * 0.6, x + bx * s, y - bh * s); ctx.stroke(); }
  }
}

// ---------- landmarks & props (true size in metres, at depth k) ----------
export function stoneBlock(ctx, pts, E, w, side = -1) {
  shape(ctx, pts, { fill: E.stone, w });
  // one flat side plane: the left (or right) third
  const xs = pts.map(p => p[0]), x0 = Math.min(...xs), x1 = Math.max(...xs);
  ctx.save(); shape(ctx, pts, { fill: null, line: null }); ctx.clip();
  ctx.fillStyle = E.stoneShade;
  if (side < 0) ctx.fillRect(x0 - 2, -1e4, (x1 - x0) * 0.28 + 2, 2e4); else ctx.fillRect(x1 - (x1 - x0) * 0.28, -1e4, (x1 - x0) * 0.3, 2e4);
  ctx.restore();
  shape(ctx, pts, { fill: null, w });
}

export function stonehenge(ctx, V, E, X, k) {
  const s = V.s(k), x0 = V.sx(X, k), gy = V.gy(k), w = 3.8 * V.u;
  const R = rand(42);
  const jit = (v) => v + (R() - 0.5) * 0.12;
  const block = (cx, bw, bh, base = 0, tilt = 0) => {
    const l = x0 + (cx - bw / 2) * s, r = x0 + (cx + bw / 2) * s, b = gy - base * s, t = gy - (base + bh) * s;
    const tl = tilt * s;
    return [[l + jit(0) * s, b], [l + tl + jit(0.05) * s, t + 0.1 * s], [l + tl + 0.25 * s, t], [r + tl - 0.2 * s, t + jit(0) * s * 0.4], [r + tl + jit(0) * s, t + 0.15 * s], [r + jit(0) * s, b]];
  };
  // back ring (smaller, paler) suggests the circle
  ctx.save(); ctx.globalAlpha = 1;
  const backE = { ...E, stone: shade(E.stone, 0.18), stoneShade: shade(E.stoneShade, 0.15) };
  const ring = [-7.4, -5.6, -3.8, -2.0, -0.2, 1.6, 3.4, 5.2];
  for (const cx of ring) if (cx !== 3.4) stoneBlock(ctx, block(cx, 1.0, 3.0, 0), backE, w * 0.85);
  for (const [a, b] of [[-7.4, -5.6], [-3.8, -2.0], [-0.2, 1.6]]) stoneBlock(ctx, [[x0 + (a - 0.5) * s, gy - 2.95 * s], [x0 + (b + 0.5) * s, gy - 2.95 * s], [x0 + (b + 0.45) * s, gy - 3.6 * s], [x0 + (a - 0.45) * s, gy - 3.6 * s]], backE, w * 0.85, 1);
  ctx.restore();
  // big trilithons in front
  const tri = (cx, gap) => {
    stoneBlock(ctx, block(cx - gap, 1.35, 4.1), E, w);
    stoneBlock(ctx, block(cx + gap, 1.35, 4.1), E, w);
    const l = x0 + (cx - gap - 0.85) * s, r = x0 + (cx + gap + 0.85) * s;
    stoneBlock(ctx, [[l, gy - 4.05 * s], [r, gy - 4.05 * s], [r - 0.1 * s, gy - 4.95 * s], [l + 0.1 * s, gy - 4.95 * s]], E, w, 1);
  };
  tri(-5.2, 1.0); tri(1.4, 1.05);
  stoneBlock(ctx, block(6.6, 1.3, 3.6, 0, 0.6), E, w);   // a leaning sarsen
  // a fallen lintel
  stoneBlock(ctx, [[x0 + 8.0 * s, gy], [x0 + 11.2 * s, gy], [x0 + 11.0 * s, gy - 0.85 * s], [x0 + 8.2 * s, gy - 0.9 * s]], E, w, 1);
}

export function gobekli(ctx, V, E, X, k) {
  const s = V.s(k), x0 = V.sx(X, k), gy = V.gy(k), w = 3.6 * V.u;
  // low mound
  const mound = [[x0 - 13 * s, gy + 0.05 * s], [x0 - 9 * s, gy - 1.5 * s], [x0 - 2 * s, gy - 2.4 * s], [x0 + 6 * s, gy - 2.2 * s], [x0 + 12 * s, gy - 1.0 * s], [x0 + 15 * s, gy + 0.05 * s]];
  shape(ctx, [...mound, [x0 + 15 * s, gy + 0.3 * s], [x0 - 13 * s, gy + 0.3 * s]], { fill: shade(E.ground, -0.06), line: null });
  shape(ctx, mound, { fill: null, line: INK, w, closed: false, smooth: true });
  const top = gy - 1.9 * s;
  // stone ring wall
  const R = rand(9);
  for (let i = 0; i < 12; i++) {
    const cx = -8 + i * 1.45, bh = 0.9 + R() * 0.3;
    shape(ctx, [[x0 + (cx - 0.68) * s, top + 0.2 * s], [x0 + (cx - 0.6) * s, top - bh * s], [x0 + (cx + 0.6) * s, top - bh * s - 0.1 * s], [x0 + (cx + 0.68) * s, top + 0.2 * s]], { fill: shade(E.stone, -0.08), w: w * 0.8 });
  }
  // T-pillars (up to 5.5 m)
  const T = (cx, hgt, carve) => {
    const st = 0.55, hw = 1.2, hh = 0.85;
    stoneBlock(ctx, [[x0 + (cx - st) * s, top], [x0 + (cx - st) * s, top - (hgt - hh) * s], [x0 + (cx + st) * s, top - (hgt - hh) * s], [x0 + (cx + st) * s, top]], E, w);
    stoneBlock(ctx, [[x0 + (cx - hw) * s, top - (hgt - hh) * s], [x0 + (cx - hw) * s, top - hgt * s], [x0 + (cx + hw * 0.8) * s, top - hgt * s], [x0 + (cx + hw) * s, top - (hgt - hh) * s]], E, w, 1);
    if (carve) { // a relief fox, a few lines
      const fx = x0 + cx * s, fy = top - (hgt - hh - 1.4) * s;
      stroke(ctx, [[fx - 0.35 * s, fy], [fx + 0.25 * s, fy - 0.1 * s], [fx + 0.4 * s, fy - 0.35 * s], [fx + 0.3 * s, fy - 0.05 * s]], w * 0.6, shade(E.stoneShade, -0.25));
      stroke(ctx, [[fx - 0.25 * s, fy], [fx - 0.3 * s, fy + 0.35 * s]], w * 0.6, shade(E.stoneShade, -0.25));
      stroke(ctx, [[fx + 0.15 * s, fy - 0.05 * s], [fx + 0.18 * s, fy + 0.35 * s]], w * 0.6, shade(E.stoneShade, -0.25));
    }
  };
  T(-4.5, 4.2, false); T(4.2, 4.0, false); T(-0.6, 5.5, true); T(2.0, 5.3, false);
}

export function tree(ctx, V, E, X, k, kind = 'round', seed = 1) {
  const s = V.s(k), x = V.sx(X, k), gy = V.gy(k), w = 3.4 * V.u;
  const R = rand(seed);
  const hgt = (kind === 'flat' ? 5.5 : 7) * (0.8 + R() * 0.4);
  stroke(ctx, [[x, gy], [x + 0.1 * s, gy - hgt * 0.55 * s], [x - 0.05 * s, gy - hgt * 0.8 * s]], 0.45 * s + w, INK, 'butt');
  stroke(ctx, [[x, gy], [x + 0.1 * s, gy - hgt * 0.55 * s], [x - 0.05 * s, gy - hgt * 0.8 * s]], 0.45 * s, '#7b5a3a', 'butt');
  if (kind === 'flat') {
    shape(ctx, [[x - 3.2 * s, gy - hgt * 0.92 * s], [x - 2.2 * s, gy - hgt * 1.08 * s], [x - 0.4 * s, gy - hgt * 1.12 * s], [x + 1.6 * s, gy - hgt * 1.1 * s], [x + 3.0 * s, gy - hgt * 0.98 * s], [x + 2.4 * s, gy - hgt * 0.86 * s], [x - 2.4 * s, gy - hgt * 0.84 * s]], { fill: E.tree, w, smooth: true });
  } else {
    const c = [x, gy - hgt * s];
    const pts = [];
    for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2; const r = 2.0 * s * (0.85 + R() * 0.3); pts.push([c[0] + Math.cos(a) * r * 1.1, c[1] + Math.sin(a) * r * 0.95]); }
    shape(ctx, pts, { fill: E.tree, w, smooth: true });
  }
}

// a sarsen on a sledge, hauled by two locals with a rope (k = backdrop depth)
export function haulers(ctx, V, E, X, k, phase) {
  const s = V.s(k), gy = V.gy(k), w = 3.4 * V.u;
  const sx = V.sx(X, k);
  // sledge + stone lying down
  stroke(ctx, [[sx - 2.6 * s, gy - 0.12 * s], [sx + 2.6 * s, gy - 0.12 * s]], 0.22 * s + w, INK);
  stroke(ctx, [[sx - 2.6 * s, gy - 0.12 * s], [sx + 2.6 * s, gy - 0.12 * s]], 0.22 * s, '#8a6a45');
  stoneBlock(ctx, [[sx - 2.4 * s, gy - 0.3 * s], [sx + 2.3 * s, gy - 0.3 * s], [sx + 2.0 * s, gy - 1.45 * s], [sx - 2.2 * s, gy - 1.35 * s]], E, w, 1);
  // rope to the haulers
  const hx = [sx + 4.4 * s, sx + 6.0 * s];
  const cols = ['#b48a5a', '#8c7a5c'];
  const opts = hx.map((x, i) => ({ x, gy, h: 1.7 * s, phase: (phase * 0.6 + i * 0.37) % 1, walk: true, lean: 0.34, look: 0.6, lw: 3.4 * V.u,
    hair: i ? 'messy' : 'long', hairColor: i ? '#2f2520' : '#5b3a26', female: i === 0, mood: 'neutral',
    arms: [[-0.85, -0.05], [-0.75, -0.05]], outfit: OUTFITS.wool({ fill: cols[i] }) }));
  const hands = opts.map(o => skeleton(o).arms[0].wr);
  stroke(ctx, [[sx + 2.5 * s, gy - 0.3 * s], hands[0], hands[1]], w * 0.8, '#7a5a35');
  opts.forEach(o => drawFigure(ctx, o));
}

// The era line: a full-height dashed ink line on the stage with a milestone at its foot.
export function eraLine(ctx, V, x, label, font) {
  const u = V.u;
  ctx.save();
  ctx.setLineDash([18 * u, 13 * u]);
  stroke(ctx, [[x, -10], [x, V.G - 22 * u]], 4.2 * u, INK, 'butt');
  ctx.restore();
  // a small stake where it meets the road
  shape(ctx, [[x - 9 * u, V.G - 30 * u], [x + 9 * u, V.G - 30 * u], [x + 9 * u, V.G - 4 * u], [x, V.G + 6 * u], [x - 9 * u, V.G - 4 * u]], { fill: '#a77d50', w: 3.4 * u });
  // the flag: a paper pennant hanging on the line under the date card's band
  ctx.font = `700 ${26 * u}px Mali`;
  const w = ctx.measureText(label).width + 50 * u, h = 52 * u, y = V.wide ? 205 * u : 395 * u;
  shape(ctx, [[x, y], [x + w, y], [x + w - 16 * u, y + h / 2], [x + w, y + h], [x, y + h]], { fill: '#fffdf7', w: 3.6 * u });
  ctx.fillStyle = INK; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillText(label, x + 16 * u, y + h * 0.54);
}

// Draw the environment of one era (everything behind the walker), optionally clipped to x range.
export function drawEra(ctx, V, E, t, items, clip) {
  ctx.save();
  if (clip) { ctx.beginPath(); ctx.rect(clip[0], 0, clip[1] - clip[0], V.H); ctx.clip(); }
  sky(ctx, V, E);
  for (const c of items.clouds ?? []) cloud(ctx, V.sx(c.X, 0.08) + c.drift * t * V.u, c.y * V.u, c.s * V.u, E, V.u);
  hills(ctx, V, E, 0.14, items.seed ?? 1, V.wide ? 95 : 130);
  ground(ctx, V, E);
  tufts(ctx, V, E, 0.45, -0, 3.2, 11, 12, E.tuft, 2.6);
  for (const d of (items.back ?? []).slice().sort((a, b) => a.k - b.k)) d.draw(ctx, V, E, t);
  tufts(ctx, V, E, 1, -26, 1.1, 5, 20, E.tuft, 3.4);
  ctx.restore();
}

export function drawFront(ctx, V, E, clip) {
  ctx.save();
  if (clip) { ctx.beginPath(); ctx.rect(clip[0], 0, clip[1] - clip[0], V.H); ctx.clip(); }
  tufts(ctx, V, E, 1.25, 0, 2.6, 17, 24, shade(E.tuft, -0.12), 3.8);
  ctx.restore();
}

// ---------- additions for the film ----------
export function zoomed(L, z = 1, pan = 0, tilt = 0) {
  return { ...L, Hf: L.Hf * z, hor: L.G - (L.G - L.hor) * z + tilt, G: L.G + tilt, ax: L.ax + pan, z };
}

// side view of a pyramid: front face + one flat side plane + a few courses (true metres, depth k)
export function pyramid(ctx, V, E, X, k, hM, baseM) {
  const s = V.s(k), cx = V.sx(X, k), gy = V.gy(k), w = 4 * V.u;
  const L = cx - baseM / 2 * s, R = cx + baseM / 2 * s, T = gy - hM * s;
  const apx = cx + baseM * 0.06 * s; // seen a little from the side
  shape(ctx, [[L, gy], [apx, T], [R, gy]], { fill: E.stone, w });
  ctx.save(); trace0(ctx, [[L, gy], [apx, T], [R, gy]]); ctx.clip();
  shape(ctx, [[apx, T], [R, gy], [apx + (R - apx) * 0.35, gy]], { fill: E.stoneShade, line: null });
  ctx.strokeStyle = shade(E.stoneShade, -0.12); ctx.lineWidth = Math.max(1, 2 * V.u);
  for (let i = 1; i < 9; i++) { const y = gy - (hM * s) * i / 9; ctx.beginPath(); ctx.moveTo(L - 10, y); ctx.lineTo(R + 10, y); ctx.globalAlpha = 0.35; ctx.stroke(); }
  ctx.restore();
  shape(ctx, [[L, gy], [apx, T], [R, gy]], { fill: null, w });
  return { apex: [apx, T], L, R, gy };
}
function trace0(ctx, p) { ctx.beginPath(); ctx.moveTo(p[0][0], p[0][1]); for (let i = 1; i < p.length; i++) ctx.lineTo(p[i][0], p[i][1]); ctx.closePath(); }

export function palm(ctx, V, E, X, k, seed = 1) {
  const s = V.s(k), x = V.sx(X, k), gy = V.gy(k), w = 3.4 * V.u;
  const R = rand(seed), hgt = 8 * (0.85 + R() * 0.3), lean = (R() - 0.5) * 1.6;
  const top = [x + lean * s, gy - hgt * s];
  const trunk = [[x, gy], [x + lean * 0.3 * s, gy - hgt * 0.5 * s], top];
  stroke(ctx, trunk, 0.5 * s + 2 * w, INK, 'butt'); stroke(ctx, trunk, 0.5 * s, '#9a7448', 'butt');
  for (let i = 0; i < 6; i++) {
    const a = -Math.PI / 2 + (i - 2.5) * 0.55, len = 3.2 * s;
    const tip = [top[0] + Math.cos(a) * len, top[1] + Math.sin(a) * len * 0.75 + len * 0.35];
    const mid = [top[0] + Math.cos(a) * len * 0.5, top[1] + Math.sin(a) * len * 0.5 - 0.4 * s];
    const n = [-(tip[1] - top[1]), tip[0] - top[0]], nl = Math.hypot(...n) || 1;
    const o = 0.45 * s;
    shape(ctx, [top, [mid[0] + n[0] / nl * o, mid[1] + n[1] / nl * o], tip, [mid[0] - n[0] / nl * o * 0.4, mid[1] - n[1] / nl * o * 0.4]], { fill: E.tree, w, smooth: false });
  }
}

export function hunter(ctx, V, E, X, k, t) {
  const s = V.s(k), x = V.sx(X, k), gy = V.gy(k);
  const S = drawFigure(ctx, { x, gy, h: 1.7 * s, walk: false, front: true, look: -0.2, lw: 3.4 * V.u, hair: 'messy', hairColor: '#2a211c', mood: 'neutral',
    arms: [[0.55, 0.9], [-0.2, 0.1]], blink: (t % 3.7) < 0.12 ? 1 : 0, outfit: OUTFITS.hide({ fill: '#c99a5e' }) });
  const [hx, hy] = S.arms[0].wr;
  stroke(ctx, [[hx - 0.05 * s, hy + 0.9 * s], [hx + 0.12 * s, hy - 1.3 * s]], 3 * V.u + 0.07 * s, INK);
  stroke(ctx, [[hx - 0.05 * s, hy + 0.9 * s], [hx + 0.12 * s, hy - 1.3 * s]], 0.07 * s, '#8a6a45');
  shape(ctx, [[hx + 0.12 * s, hy - 1.3 * s], [hx + 0.05 * s, hy - 1.05 * s], [hx + 0.2 * s, hy - 1.06 * s]], { fill: '#9a9a96', w: 2.4 * V.u });
}
