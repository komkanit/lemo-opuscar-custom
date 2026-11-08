// Stick-figure rig: two-bone legs with planted feet, counter-swinging arms,
// white circle head, dot face, hair, and outfits as flat shapes on the stick.
import { INK, HEAD, shape, stroke, circle, ellipse, tube, clamp, shade, rand } from './ink.js';

const TAU = Math.PI * 2;

// Proportions (fractions of figure height h)
export const P = { thigh: .185, shin: .185, torso: .27, headR: .18, sh: .045, upper: .13, fore: .125, reach: .12, lift: .055, bob: .012, foot: .055 };

function ik(hx, hy, ax, ay, a, b, dir) {
  let dx = ax - hx, dy = ay - hy, d = Math.hypot(dx, dy);
  const maxd = (a + b) * 0.998;
  if (d > maxd) { dx *= maxd / d; dy *= maxd / d; d = maxd; ax = hx + dx; ay = hy + dy; }
  const ang = Math.atan2(dy, dx);
  const k = Math.acos(clamp((a * a + d * d - b * b) / (2 * a * d), -1, 1));
  const k1 = [hx + a * Math.cos(ang + k), hy + a * Math.sin(ang + k)];
  const k2 = [hx + a * Math.cos(ang - k), hy + a * Math.sin(ang - k)];
  return { knee: (k1[0] - k2[0]) * dir > 0 ? k1 : k2, ankle: [ax, ay] };
}

// o: { x, gy, h, facing=1, phase, walk=true, lean=0, arms?: [[θ,β],[θ,β]], lw }
export function skeleton(o) {
  const { x, gy, h } = o;
  const f = o.facing ?? 1, lean = o.lean ?? 0, lw = o.lw ?? h * 0.0128;
  const ph = o.phase ?? 0;
  let hipY, feet;
  if (o.walk !== false) {
    const bob = P.bob * h * Math.cos(2 * TAU * (ph - 0.25));
    hipY = gy - (0.352 * h + bob);
    feet = [0, 1].map(i => {
      const q = (((ph + i * 0.5) % 1) + 1) % 1;
      let fx, fy, toe = 0;
      if (q < 0.5) { fx = P.reach * h * (1 - 4 * q); fy = 0; }
      else { const s = (q - 0.5) * 2, e = s * s * (3 - 2 * s); fx = -P.reach * h + 2 * P.reach * h * e; fy = P.lift * h * Math.sin(Math.PI * s); toe = Math.sin(Math.PI * s) * 0.35; }
      return { x: x + f * fx, y: gy - lw * 0.5 - fy, toe, dir: f };
    });
  } else {
    const sp = o.stance ?? 0.045;
    hipY = gy - 0.366 * h;
    feet = [{ x: x + sp * h, y: gy - lw * 0.5, toe: 0, dir: o.front ? 1 : f }, { x: x - sp * h, y: gy - lw * 0.5, toe: 0, dir: o.front ? -1 : f }];
  }
  const hip = [x, hipY];
  const rot = (dx, dy) => { // body-local (dx forward, dy up, in px) -> screen, rotated by lean about hip
    const c = Math.cos(lean), s = Math.sin(lean);
    const X = dx * c + dy * s, Y = -dx * s + dy * c;
    return [hip[0] + f * X, hip[1] - Y];
  };
  const neck = rot(0, P.torso * h);
  const head = rot(0, (P.torso + P.headR) * h);
  const shoulder = rot(0, (P.torso - P.sh) * h);
  const legs = feet.map(ft => {
    const r = ik(hip[0], hip[1], ft.x, ft.y, P.thigh * h, P.shin * h, f);
    return { hip, knee: r.knee, ankle: r.ankle, toe: ft.toe, dir: ft.dir };
  });
  const arms = [0, 1].map(i => {
    let th, be;
    if (o.arms) [th, be] = o.arms[i];
    else if (o.walk !== false) { const A = 0.5; th = -A * Math.cos(TAU * (ph + i * 0.5)); be = 0.18 + 0.4 * Math.max(0, th / A); }
    else { th = i === 0 ? 0.16 : -0.16; be = 0.08; }
    th += lean; // world angle
    const dir = (a) => [f * Math.sin(a), Math.cos(a)];
    const d1 = dir(th), d2 = dir(th + be);
    const el = [shoulder[0] + d1[0] * P.upper * h, shoulder[1] + d1[1] * P.upper * h];
    const wr = [el[0] + d2[0] * P.fore * h, el[1] + d2[1] * P.fore * h];
    return { sh: shoulder, el, wr, ang: th + be };
  });
  return { h, f, lw, lean, hip, neck, head, headR: P.headR * h, shoulder, legs, arms, rot, phase: ph, walk: o.walk !== false };
}

function hand(ctx, S, arm) {
  const h = S.h, a = arm.ang, f = S.f;
  const dx = f * Math.sin(a), dy = Math.cos(a);
  const cx = arm.wr[0] + dx * 0.022 * h, cy = arm.wr[1] + dy * 0.022 * h;
  const rot = Math.atan2(dy, dx);
  const w = S.lw * 0.75;
  // thumb, then palm
  const tx = cx + f * Math.cos(a) * 0.022 * h - dx * 0.004 * h, ty = cy - Math.sin(a) * 0.022 * h * 1;
  ellipse(ctx, tx, ty, 0.013 * h, 0.009 * h, rot - f * 0.9, { fill: HEAD, w });
  ellipse(ctx, cx, cy, 0.028 * h, 0.021 * h, rot, { fill: HEAD, w });
}

function foot(ctx, S, leg, outfit) {
  const h = S.h, [ax, ay] = leg.ankle, d = leg.dir;
  if (outfit?.shoe) { outfit.shoe(ctx, S, leg); return; }
  const tx = ax + d * P.foot * h * Math.cos(leg.toe), ty = ay - P.foot * h * Math.sin(leg.toe) * 0.6;
  stroke(ctx, [[ax - d * 0.006 * h, ay], [tx, ty]], S.lw);
}

function limbLeg(ctx, S, leg, outfit) {
  stroke(ctx, [leg.hip, leg.knee, leg.ankle], S.lw);
  outfit?.leg?.(ctx, S, leg);
  foot(ctx, S, leg, outfit);
}
function limbArm(ctx, S, arm, outfit) {
  stroke(ctx, [arm.sh, arm.el, arm.wr], S.lw);
  outfit?.sleeve?.(ctx, S, arm);
  hand(ctx, S, arm);
}

// ---------- face & hair ----------
function face(ctx, S, o) {
  const h = S.h, [cx, cy] = S.head, f = S.f, look = o.look ?? 0.45;
  const ox = f * look * 0.075 * h, sp = 0.055 * h * (1 - 0.4 * Math.abs(look));
  const ey = cy + 0.004 * h, er = 0.017 * h;
  const eyes = [[cx + ox - sp, ey], [cx + ox + sp, ey]];
  const blink = o.blink ?? 0;
  for (const [x, y] of eyes) {
    if (blink > 0.5) stroke(ctx, [[x - er, y], [x + er, y]], S.lw * 0.7);
    else ellipse(ctx, x, y, er, er * 1.12, 0, { fill: INK, line: null });
  }
  if (o.female) {
    for (const [i, [x, y]] of eyes.entries()) {
      const s = i === 0 ? -1 : 1;
      stroke(ctx, [[x + s * er * 0.85, y - er * 0.55], [x + s * er * 1.75, y - er * 0.95]], S.lw * 0.45);
    }
    for (const [x, y] of eyes) ellipse(ctx, x + (x < cx + ox ? -1 : 1) * 0.012 * h, y + 0.045 * h, 0.026 * h, 0.014 * h, 0, { fill: '#ee9f86', line: null, alpha: 0.5 });
  }
  if (o.brows) for (const [i, [x, y]] of eyes.entries()) {
    const s = i === 0 ? -1 : 1, b = o.brows; // >0 raised arch, <0 frown
    const by = y - 0.05 * h - (b > 0 ? 0.012 * h : 0);
    if (b > 0) { ctx.beginPath(); ctx.moveTo(x - 0.02 * h, by + 0.006 * h); ctx.quadraticCurveTo(x, by - 0.008 * h, x + 0.02 * h, by + 0.006 * h); ctx.lineWidth = S.lw * 0.6; ctx.strokeStyle = INK; ctx.lineCap = 'round'; ctx.stroke(); }
    else stroke(ctx, [[x - s * 0.02 * h, by - 0.008 * h], [x + s * 0.02 * h, by + 0.006 * h]], S.lw * 0.6);
  }
  const mx = cx + ox * 1.15, my = cy + 0.062 * h, mw = 0.036 * h;
  const mood = o.mood ?? 'smile', open = o.open ?? 0;
  if (open > 0.05 || mood === 'wow') {
    const k = mood === 'wow' ? 1 : open;
    ellipse(ctx, mx, my + 0.004 * h, mw * (0.55 + 0.25 * (1 - k)), 0.008 * h + 0.022 * h * k, 0, { fill: '#5a2a24', w: S.lw * 0.7 });
  } else if (mood === 'smile') {
    ctx.beginPath(); ctx.moveTo(mx - mw, my - 0.004 * h); ctx.quadraticCurveTo(mx, my + 0.03 * h, mx + mw, my - 0.004 * h);
    ctx.lineWidth = S.lw * 0.75; ctx.strokeStyle = INK; ctx.lineCap = 'round'; ctx.stroke();
  } else {
    stroke(ctx, [[mx - mw * 0.7, my + 0.006 * h], [mx + mw * 0.7, my + 0.006 * h]], S.lw * 0.75);
  }
}

function hairCap(S, look, lo, rOut, fringe, jag, seed) {
  // outline: from left side angle lo (below horizon) over the top to right side, then a fringe back across the forehead
  const [cx, cy] = S.head, r = S.headR, f = S.f;
  const shift = -f * look * 0.1 * r;
  const R = rand(seed);
  const pts = [];
  const a0 = Math.PI - lo, a1 = TAU + lo; // canvas angles: left side → top → right side
  const N = jag ? 22 : 14;
  for (let i = 0; i <= N; i++) {
    const a = a0 + (a1 - a0) * i / N;
    const rr = r * rOut * (jag && i % 2 ? 1.12 + R() * 0.08 : 1);
    pts.push([cx + shift + Math.cos(a) * rr, cy + Math.sin(a) * rr]);
  }
  // fringe: right → left across the forehead
  const fy = cy - r * fringe;
  const M = jag ? 8 : 4;
  for (let i = 0; i <= M; i++) {
    const t = i / M;
    const x = cx + shift + r * (0.95 - 1.9 * t) * (i === 0 || i === M ? 1 : 0.92);
    let y = fy + Math.sin(Math.PI * t) * r * 0.08;
    if (i === 0 || i === M) y = cy + Math.sin(lo) * r * 0.9;
    if (jag && i % 2 && i !== M) y += r * 0.16;
    pts.push([x + f * look * 0.18 * r * Math.sin(Math.PI * t), y]);
  }
  return pts;
}

export function drawHair(ctx, S, o) {
  const style = o.hair ?? 'short', col = o.hairColor ?? '#4b3022', look = o.look ?? 0.45, w = S.lw;
  const [cx, cy] = S.head, r = S.headR, f = S.f;
  if (style === 'bald' || style === 'none') return;
  if (style === 'bun') {
    circle(ctx, cx - f * look * 0.25 * r, cy - r * 1.02, r * 0.36, { fill: col, w });
    shape(ctx, hairCap(S, look, 0.12, 1.05, 0.38, false, 3), { fill: col, w, smooth: true });
  } else if (style === 'short') {
    shape(ctx, hairCap(S, look, -0.05, 1.05, 0.45, false, 5), { fill: col, w, smooth: true });
  } else if (style === 'messy') {
    shape(ctx, hairCap(S, look, 0.55, 1.08, 0.36, true, 7), { fill: col, w });
  } else if (style === 'long') {
    shape(ctx, hairCap(S, look, 0.9, 1.06, 0.38, false, 9), { fill: col, w, smooth: true });
  }
}

export function drawHead(ctx, S, o) {
  circle(ctx, S.head[0], S.head[1], S.headR, { fill: HEAD, w: S.lw });
  face(ctx, S, o);
  drawHair(ctx, S, o);
  o.outfit?.hat?.(ctx, S, o);
}

// ---------- the whole figure ----------
// o: skeleton opts + { outfit, hair, hairColor, female, look, mood, open, brows }
export function blendSkel(a, b, k) {
  const L = (p, q) => [p[0] + (q[0] - p[0]) * k, p[1] + (q[1] - p[1]) * k];
  const hip = L(a.hip, b.hip), lean = a.lean + (b.lean - a.lean) * k, f = a.f;
  const rot = (dx, dy) => { const c = Math.cos(lean), s = Math.sin(lean); const X = dx * c + dy * s, Y = -dx * s + dy * c; return [hip[0] + f * X, hip[1] - Y]; };
  return { ...a, hip, lean, rot, neck: L(a.neck, b.neck), head: L(a.head, b.head), shoulder: L(a.shoulder, b.shoulder),
    legs: a.legs.map((l, i) => ({ hip, knee: L(l.knee, b.legs[i].knee), ankle: L(l.ankle, b.legs[i].ankle), toe: l.toe + (b.legs[i].toe - l.toe) * k, dir: k < 0.5 ? l.dir : b.legs[i].dir })),
    arms: a.arms.map((m, i) => ({ sh: L(m.sh, b.arms[i].sh), el: L(m.el, b.arms[i].el), wr: L(m.wr, b.arms[i].wr), ang: m.ang + (b.arms[i].ang - m.ang) * k })),
    walk: k < 0.5 ? a.walk : b.walk };
}

export function drawFigure(ctx, o) {
  const S = o.S ?? skeleton(o);
  const out = o.outfit;
  const far = 1, near = 0;
  limbArm(ctx, S, S.arms[far], out);
  limbLeg(ctx, S, S.legs[far], out);
  limbLeg(ctx, S, S.legs[near], out);
  stroke(ctx, [S.hip, S.neck], S.lw);
  out?.body?.(ctx, S);
  out?.neck?.(ctx, S);
  drawHeadUnder(ctx, S, o);
  limbArm(ctx, S, S.arms[near], out);
  return S;
}
function drawHeadUnder(ctx, S, o) { drawHead(ctx, S, o); }

// ---------- outfits ----------
// helper: body-local polygon in units of h (dx forward, dy up from hip)
const B = (S, pts) => pts.map(([dx, dy]) => S.rot(dx * S.h, dy * S.h));
const sway = (S, k = 0.012) => (S.walk ? k * Math.sin(2 * TAU * S.phase) : 0);

function spots(ctx, S, poly, col, seed, n = 9) {
  ctx.save();
  shape(ctx, poly, { fill: null, line: null }); ctx.clip();
  const R = rand(seed);
  for (let i = 0; i < n; i++) {
    const dx = -0.08 + R() * 0.17, dy = -0.12 + R() * 0.35;
    const [x, y] = S.rot(dx * S.h, dy * S.h);
    ellipse(ctx, x, y, S.h * (0.011 + R() * 0.007), S.h * (0.009 + R() * 0.006), R() * 3, { fill: col, line: null });
  }
  ctx.restore();
}

export const OUTFITS = {
  // hunter-gatherer hide, one shoulder, jagged hem
  hide: (c = {}) => ({
    body(ctx, S) {
      const s = sway(S);
      const hem = [];
      const N = 7;
      for (let i = 0; i <= N; i++) { const t = i / N; hem.push([0.105 - 0.205 * t + s, -0.14 + (i % 2 ? 0.035 : 0)]); }
      const poly = B(S, [[-0.07, 0.205], [-0.03, 0.262], [0.02, 0.24], [0.075, 0.17], [0.088, 0.04], ...hem, [-0.09, 0.04]]);
      shape(ctx, poly, { fill: c.fill ?? '#d9a560', w: S.lw * 0.85 });
      spots(ctx, S, poly, c.spot ?? '#8b5a2c', 11);
      shape(ctx, poly, { fill: null, w: S.lw * 0.85 });
    },
  }),
  // undyed wool tunic with a rope belt and short sleeves
  wool: (c = {}) => ({
    body(ctx, S) {
      const s = sway(S, 0.008), col = c.fill ?? '#9b7a50';
      const poly = B(S, [[-0.07, 0.232], [-0.02, 0.255], [0.02, 0.255], [0.07, 0.232], [0.085, 0.06], [0.1 + s, -0.12], [0.0 + s, -0.128], [-0.1 + s, -0.12], [-0.085, 0.06]]);
      shape(ctx, poly, { fill: col, w: S.lw * 0.85, smooth: false });
      stroke(ctx, B(S, [[-0.02, 0.255], [0.0, 0.215], [0.02, 0.255]]), S.lw * 0.6);
      stroke(ctx, B(S, [[-0.086, 0.035], [0.088, 0.035]]), S.lw * 1.3, c.belt ?? '#5b4630');
      stroke(ctx, B(S, [[0.05, 0.035], [0.065, -0.02]]), S.lw * 0.8, c.belt ?? '#5b4630');
    },
    sleeve(ctx, S, arm) {
      const t = 0.5, e = [arm.sh[0] + (arm.el[0] - arm.sh[0]) * t, arm.sh[1] + (arm.el[1] - arm.sh[1]) * t];
      tube(ctx, [arm.sh, e], S.h * 0.05, c.fill ?? '#9b7a50', S.lw * 0.85);
    },
    shoe(ctx, S, leg) { // wrapped leather
      const [ax, ay] = leg.ankle, d = leg.dir, h = S.h;
      shape(ctx, [[ax - d * 0.012 * h, ay - 0.018 * h], [ax + d * 0.02 * h, ay - 0.016 * h], [ax + d * 0.058 * h, ay - 0.002 * h - leg.toe * 0.02 * h], [ax + d * 0.056 * h, ay + 0.006 * h], [ax - d * 0.014 * h, ay + 0.006 * h]], { fill: '#6b4a2e', w: S.lw * 0.7 });
    },
  }),
  // Old Kingdom linen kilt, broad collar, bare torso line
  linen: (c = {}) => ({
    body(ctx, S) {
      const s = sway(S, 0.006);
      const poly = B(S, [[-0.078, 0.035], [0.078, 0.035], [0.105 + s, -0.14], [-0.09 + s, -0.14]]);
      shape(ctx, poly, { fill: '#f6f1e4', w: S.lw * 0.85 });
      shape(ctx, B(S, [[0.0, 0.03], [0.07 + s, -0.135], [0.02 + s, -0.137]]), { fill: '#ebe3cf', w: S.lw * 0.6 });
      stroke(ctx, B(S, [[-0.079, 0.03], [0.079, 0.03]]), S.lw * 1.4, c.belt ?? '#d9a93a');
    },
    neck(ctx, S) {
      const [nx, ny] = S.neck, h = S.h;
      for (const [r, col] of [[0.075, '#2f86b8'], [0.055, '#e2b33f'], [0.035, '#2f86b8']]) {
        ctx.beginPath(); ctx.ellipse(nx, ny + 0.005 * h, r * h, r * h * 0.6, 0, 0, Math.PI);
        ctx.lineTo(nx, ny + 0.005 * h); ctx.closePath();
        ctx.fillStyle = col; ctx.fill(); ctx.lineWidth = S.lw * 0.6; ctx.strokeStyle = INK; ctx.stroke();
      }
    },
    shoe(ctx, S, leg) {
      const [ax, ay] = leg.ankle, d = leg.dir, h = S.h;
      stroke(ctx, [[ax - d * 0.006 * h, ay], [ax + d * P.foot * h * Math.cos(leg.toe), ay - P.foot * h * Math.sin(leg.toe) * 0.6]], S.lw);
      stroke(ctx, [[ax - d * 0.01 * h, ay + 0.007 * h], [ax + d * 0.06 * h, ay + 0.007 * h - leg.toe * 0.02 * h]], S.lw * 0.7, '#9a6a3a');
    },
  }),
  // today: t-shirt, jeans, sneakers
  modern: (c = {}) => ({
    leg(ctx, S, leg) { tube(ctx, [[leg.hip[0], leg.hip[1] + 0.01 * S.h], leg.knee, leg.ankle], S.h * 0.056, c.jeans ?? '#4a78b5', S.lw * 0.8); },
    body(ctx, S) {
      shape(ctx, B(S, [[-0.06, 0.0], [0.06, 0.0], [0.06, -0.035], [-0.06, -0.035]]), { fill: c.jeans ?? '#4a78b5', w: S.lw * 0.8 });
      const poly = B(S, [[-0.072, 0.236], [-0.022, 0.258], [0.022, 0.258], [0.072, 0.236], [0.074, 0.0], [-0.074, 0.0]]);
      shape(ctx, poly, { fill: c.tee ?? '#2e9be6', w: S.lw * 0.85 });
      stroke(ctx, B(S, [[-0.022, 0.258], [0, 0.236], [0.022, 0.258]]), S.lw * 0.6);
    },
    sleeve(ctx, S, arm) {
      const e = [arm.sh[0] + (arm.el[0] - arm.sh[0]) * 0.55, arm.sh[1] + (arm.el[1] - arm.sh[1]) * 0.55];
      tube(ctx, [arm.sh, e], S.h * 0.058, c.tee ?? '#2e9be6', S.lw * 0.85);
    },
    shoe(ctx, S, leg) {
      const [ax, ay] = leg.ankle, d = leg.dir, h = S.h, t = leg.toe * 0.025 * h;
      shape(ctx, [[ax - d * 0.02 * h, ay - 0.02 * h], [ax + d * 0.02 * h, ay - 0.02 * h], [ax + d * 0.066 * h, ay - 0.004 * h - t], [ax + d * 0.066 * h, ay + 0.009 * h - t], [ax - d * 0.024 * h, ay + 0.009 * h]], { fill: '#ffffff', w: S.lw * 0.75 });
      stroke(ctx, [[ax - d * 0.024 * h, ay + 0.003 * h], [ax + d * 0.066 * h, ay + 0.003 * h - t]], S.lw * 0.5);
    },
  }),
  // a long dress
  dress: (c = {}) => ({
    body(ctx, S) {
      const s = sway(S, 0.014);
      shape(ctx, B(S, [[-0.055, 0.238], [-0.02, 0.256], [0.02, 0.256], [0.055, 0.238], [0.07, 0.06], [0.14 + s, -0.27], [-0.13 + s, -0.27], [-0.07, 0.06]]), { fill: c.fill ?? '#5aa55e', w: S.lw * 0.85 });
    },
  }),
};
