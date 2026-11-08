// Clean constant-width ink + flat fills. No boil, no texture.
export const INK = '#1d1b19';
export const HEAD = '#fffefb';
export const PAPER = '#fffdf7';

export const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
export const lerp = (a, b, t) => a + (b - a) * t;
export const ss = (t) => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
export const back = (t, s = 1.4) => { t = clamp(t, 0, 1) - 1; return t * t * ((s + 1) * t + s) + 1; };
export function rand(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

function mid(a, b) { return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]; }

export function trace(ctx, p, closed = true, smooth = false) {
  ctx.beginPath();
  const n = p.length;
  if (!smooth) {
    ctx.moveTo(p[0][0], p[0][1]);
    for (let i = 1; i < n; i++) ctx.lineTo(p[i][0], p[i][1]);
    if (closed) ctx.closePath();
    return;
  }
  if (!closed) {
    ctx.moveTo(p[0][0], p[0][1]);
    for (let i = 1; i < n - 1; i++) { const m = mid(p[i], p[i + 1]); ctx.quadraticCurveTo(p[i][0], p[i][1], m[0], m[1]); }
    ctx.lineTo(p[n - 1][0], p[n - 1][1]);
    return;
  }
  const m0 = mid(p[n - 1], p[0]);
  ctx.moveTo(m0[0], m0[1]);
  for (let i = 0; i < n; i++) { const a = p[i], m = mid(a, p[(i + 1) % n]); ctx.quadraticCurveTo(a[0], a[1], m[0], m[1]); }
  ctx.closePath();
}

export function shape(ctx, pts, o = {}) {
  const { fill = null, line = INK, w = 4, closed = true, smooth = false, cap = 'round', alpha = 1 } = o;
  trace(ctx, pts, closed, smooth);
  ctx.save();
  ctx.globalAlpha *= alpha;
  if (fill && closed) { ctx.fillStyle = fill; ctx.fill(); }
  if (line && w > 0) { ctx.lineWidth = w; ctx.strokeStyle = line; ctx.lineJoin = 'round'; ctx.lineCap = cap; ctx.stroke(); }
  ctx.restore();
}

export function stroke(ctx, pts, w, color = INK, cap = 'round') {
  shape(ctx, pts, { fill: null, line: color, w, closed: false, cap });
}

export function circle(ctx, x, y, r, o = {}) {
  const { fill = null, line = INK, w = 4 } = o;
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (line && w > 0) { ctx.lineWidth = w; ctx.strokeStyle = line; ctx.stroke(); }
}

export function ellipse(ctx, x, y, rx, ry, rot, o = {}) {
  const { fill = null, line = INK, w = 4, alpha = 1 } = o;
  ctx.save(); ctx.globalAlpha *= alpha;
  ctx.beginPath(); ctx.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (line && w > 0) { ctx.lineWidth = w; ctx.strokeStyle = line; ctx.stroke(); }
  ctx.restore();
}

// A tube along a polyline: ink tube under a colour tube (sleeves, trousers).
export function tube(ctx, pts, width, fill, w, cap = 'butt') {
  for (const [col, lw] of [[INK, width + 2 * w], [fill, width]]) {
    ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.lineWidth = lw; ctx.strokeStyle = col; ctx.lineJoin = 'round'; ctx.lineCap = cap; ctx.stroke();
  }
}

export function rrect(ctx, x, y, w, h, r, o = {}) {
  const { fill = null, line = INK, lw = 4 } = o;
  ctx.beginPath(); ctx.roundRect(x, y, w, h, r);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (line && lw > 0) { ctx.lineWidth = lw; ctx.strokeStyle = line; ctx.lineJoin = 'round'; ctx.stroke(); }
}

export function shade(hex, f) { // f < 0 darker, > 0 lighter
  const n = parseInt(hex.slice(1), 16);
  let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  const t = f < 0 ? 0 : 255, k = Math.abs(f);
  r = Math.round(r + (t - r) * k); g = Math.round(g + (t - g) * k); b = Math.round(b + (t - b) * k);
  return '#' + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
}
