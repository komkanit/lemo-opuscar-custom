// Map view: the timeline road seen from above, atlas-style. Not a real map: no coastlines, no borders.
import { INK, PAPER, HEAD, shape, stroke, circle, rrect, shade, rand } from './ink.js';

const MW = 2000, MH = 1200;
const RAW = [[120, 990], [520, 1010], [840, 880], [700, 650], [1000, 520], [1380, 590], [1600, 400], [1420, 215], [1820, 140], [2100, 130]];

function catmull(pts, n = 24) {
  const out = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    for (let j = 0; j < n; j++) {
      const t = j / n, t2 = t * t, t3 = t2 * t;
      out.push([0, 1].map(c => 0.5 * ((2 * p1[c]) + (-p0[c] + p2[c]) * t + (2 * p0[c] - 5 * p1[c] + 4 * p2[c] - p3[c]) * t2 + (-p0[c] + 3 * p1[c] - 3 * p2[c] + p3[c]) * t3)));
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
}

export function makeMap(W, H) {
  const tall = H > W;
  // tall frames: the road runs bottom → top
  const tf = tall ? ([x, y]) => [y * 0.9, MW - x] : (p) => p;
  const dims = tall ? [MH * 0.9, MW] : [MW, MH];
  const road = catmull(RAW.map(tf));
  const cum = [0];
  for (let i = 1; i < road.length; i++) cum.push(cum[i - 1] + Math.hypot(road[i][0] - road[i - 1][0], road[i][1] - road[i - 1][1]));
  const total = cum[cum.length - 1];
  const at = (s) => {
    const d = s * total; let i = 1; while (i < cum.length - 1 && cum[i] < d) i++;
    const a = road[i - 1], b = road[i], k = (d - cum[i - 1]) / (cum[i] - cum[i - 1] || 1);
    const p = [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
    const tg = [b[0] - a[0], b[1] - a[1]], l = Math.hypot(...tg) || 1;
    return { p, n: [-tg[1] / l, tg[0] / l] };
  };
  // trees, kept off the road
  const R = rand(21), trees = [];
  for (let i = 0; i < 260 && trees.length < 70; i++) {
    const p = [R() * dims[0], R() * dims[1]];
    let dmin = 1e9; for (let j = 0; j < road.length; j += 3) dmin = Math.min(dmin, Math.hypot(p[0] - road[j][0], p[1] - road[j][1]));
    if (dmin > 120) trees.push({ p, r: 16 + R() * 14 });
  }
  return { tall, dims, road, at, trees };
}

function icon(ctx, kind, x, y, z, E) {
  const w = 3 * Math.max(0.6, Math.min(1.4, z));
  if (kind === 'gobekli') {
    circle(ctx, x, y, 62 * z, { fill: '#d8c08c', w });
    circle(ctx, x, y, 46 * z, { fill: '#e4d2a3', w: w * 0.8 });
    for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2; ctx.save(); ctx.translate(x + Math.cos(a) * 46 * z, y + Math.sin(a) * 46 * z); ctx.rotate(a); rrect(ctx, -9 * z, -4 * z, 18 * z, 8 * z, 2 * z, { fill: '#eadbb6', lw: w * 0.7 }); ctx.restore(); }
    rrect(ctx, x - 14 * z, y - 5 * z, 12 * z, 10 * z, 2 * z, { fill: '#eadbb6', lw: w * 0.7 });
    rrect(ctx, x + 4 * z, y - 5 * z, 12 * z, 10 * z, 2 * z, { fill: '#eadbb6', lw: w * 0.7 });
  } else if (kind === 'stonehenge') {
    circle(ctx, x, y, 64 * z, { fill: '#b9d48f', line: '#7fa25e', w: w * 0.8 });
    for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2; ctx.save(); ctx.translate(x + Math.cos(a) * 46 * z, y + Math.sin(a) * 46 * z); ctx.rotate(a + Math.PI / 2); rrect(ctx, -8 * z, -4 * z, 16 * z, 8 * z, 2 * z, { fill: '#bdb8ae', lw: w * 0.7 }); ctx.restore(); }
    for (let i = 0; i < 5; i++) { const a = Math.PI * (0.15 + i * 0.175) + Math.PI; ctx.save(); ctx.translate(x + Math.cos(a) * 24 * z, y + Math.sin(a) * 24 * z); ctx.rotate(a + Math.PI / 2); rrect(ctx, -9 * z, -5 * z, 18 * z, 10 * z, 2 * z, { fill: '#a9a49a', lw: w * 0.7 }); ctx.restore(); }
  } else if (kind === 'giza') {
    for (const [dx, dy, r] of [[-38, 30, 34], [10, -2, 32], [46, -34, 16]]) {
      const cx = x + dx * z, cy = y + dy * z, q = r * z;
      shape(ctx, [[cx - q, cy - q], [cx + q, cy - q], [cx, cy]], { fill: '#f0dfb2', w: w * 0.7 });
      shape(ctx, [[cx + q, cy - q], [cx + q, cy + q], [cx, cy]], { fill: '#d4bd88', w: w * 0.7 });
      shape(ctx, [[cx + q, cy + q], [cx - q, cy + q], [cx, cy]], { fill: '#c7ae76', w: w * 0.7 });
      shape(ctx, [[cx - q, cy + q], [cx - q, cy - q], [cx, cy]], { fill: '#e6d09c', w: w * 0.7 });
    }
  }
}

function flag(ctx, x, y, text, z, u, pop = 1) {
  const fs = 24 * u;
  ctx.font = `700 ${fs}px Mali`;
  const w = ctx.measureText(text).width + 34 * u, h = 42 * u;
  stroke(ctx, [[x, y], [x, y - 70 * u]], 3.4 * u);
  ctx.save(); ctx.translate(x, y - 70 * u); ctx.scale(pop, pop);
  shape(ctx, [[0, 0], [w, 0], [w - 12 * u, h / 2], [w, h], [0, h]], { fill: PAPER, w: 3.2 * u });
  ctx.fillStyle = INK; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText(text, 11 * u, h * 0.54);
  ctx.restore();
  return { x0: x, y0: y - 70 * u, x1: x + w, y1: y - 70 * u + h };
}

// cam: { s (dot position along the road 0..1 to centre on), z (zoom, 1 = fit), dot: s of the walker }
// stops: [{ s, kind, label, side }], qflag: pop 0..1 for the "?" flag
export function drawMap(ctx, M, V, cam, stops, texts, qflag = 0) {
  const u = V.u, W = V.W, H = V.H;
  const fit = Math.min(W / M.dims[0], H / M.dims[1]) * 1.02;
  const z = fit * cam.z;
  const c = cam.center;
  const T = ([x, y]) => [W / 2 + (x - c[0]) * z, H / 2 + (y - c[1]) * z + (M.tall ? 120 * u : 40 * u)];
  ctx.fillStyle = '#dde6b6'; ctx.fillRect(0, 0, W, H);
  // soft fields
  const R = rand(4);
  for (let i = 0; i < 14; i++) {
    const p = T([R() * M.dims[0], R() * M.dims[1]]), r = (120 + R() * 160) * z;
    ctx.fillStyle = i % 2 ? '#d5e0a9' : '#e3e9c2'; ctx.beginPath(); ctx.ellipse(p[0], p[1], r, r * 0.7, R() * 3, 0, Math.PI * 2); ctx.fill();
  }
  for (const t of M.trees) { const p = T(t.p); circle(ctx, p[0], p[1], t.r * z, { fill: '#6f9a4a', line: INK, w: 2.6 * u }); }
  // the road
  const pts = M.road.map(T);
  for (const [col, wd] of [[INK, 92 * z + 6 * u], ['#f4ecd2', 92 * z]]) {
    ctx.beginPath(); ctx.moveTo(...pts[0]); for (const p of pts) ctx.lineTo(...p);
    ctx.lineWidth = wd; ctx.strokeStyle = col; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.stroke();
  }
  // stops
  for (const st of stops) {
    const { p, n } = M.at(st.s);
    const ip = T([p[0] + n[0] * 150 * st.side, p[1] + n[1] * 150 * st.side]);
    icon(ctx, st.kind, ip[0], ip[1], z, null);
    const fp = T([p[0] - n[0] * 30 * st.side, p[1] - n[1] * 30 * st.side]);
    const b = flag(ctx, fp[0], fp[1], st.label, z, u);
    texts?.push({ id: 'map:' + st.label, text: st.label, ...b });
  }
  if (qflag > 0) { const { p } = M.at(0.93); const fp = T(p); const b = flag(ctx, fp[0], fp[1], '?', z, u, qflag); texts?.push({ id: 'map:?', text: '?', ...b }); }
  // the walker: a little head
  const dp = T(M.at(cam.dot).p);
  circle(ctx, dp[0] + 9 * u, dp[1] - 21 * u, 9 * u, { fill: '#4b3022', w: 3 * u });
  circle(ctx, dp[0], dp[1], 20 * u, { fill: HEAD, w: 3.6 * u });
  shape(ctx, [[dp[0] - 19 * u, dp[1] - 4 * u], [dp[0] - 12 * u, dp[1] - 17 * u], [dp[0] + 6 * u, dp[1] - 20 * u], [dp[0] + 18 * u, dp[1] - 8 * u], [dp[0] + 8 * u, dp[1] - 8 * u], [dp[0] - 6 * u, dp[1] - 6 * u]], { fill: '#4b3022', w: 3 * u, smooth: true });
  return { dot: dp, T, fit };
}

export const roadPoint = (M, s) => M.at(s).p;
