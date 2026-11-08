// Ancient Monuments — demo film for Timeline of Everything · Sticky Figure.
// One timeline drives both frames (1920×1080, 1080×1920).
import { INK, PAPER, clamp, lerp, ss, back, stroke, circle, shape, rrect } from './ink.js';
import { skeleton, blendSkel, drawFigure, OUTFITS, P } from './figure.js';
import { ERAS, layout, zoomed, makeView, drawEra, drawFront, eraLine, gobekli, stonehenge, tree, haulers, pyramid, palm, hunter } from './world.js';
import { caption, callout, wrap } from './ui.js';
import { cloud } from './world.js';
import { makeMap, drawMap } from './map.js';

const W = innerWidth, H = innerHeight;
const cv = document.getElementById('c'); cv.width = W; cv.height = H;
const ctx = cv.getContext('2d');
const L0 = layout(W, H);
const DUR = 39.4;

const LINES = await fetch('lines.json').then(r => r.json());
const VD = await fetch('voices/dur.json').then(r => r.json());
const TXT = Object.fromEntries(LINES.map(l => [l.id, l.text]));
const VO = { n1: 0.5, n2: 8.4, n3: 15.8, n4: 25.2, n5: 32.6 };

// ---------- walking: speed profile → road position → walk phase (feet locked to the road) ----------
const BEAT = 0.6;                         // 100 BPM, one step per beat
const STRIDE_M = 4 * P.reach * 1.7;       // metres per stride (two steps)
const V0 = STRIDE_M / (2 * BEAT);         // road speed, m/s
const SPEED = [ // [t0, t1, from, to]; all starts on the beat grid
  [9.6, 10.8, 1, 0], [14.4, 15.6, 0, 1], [15.6, 16.8, 1, 3], [18.6, 19.8, 3, 1],
  [23.4, 24.6, 1, 3], [25.8, 27.0, 3, 0],
];
function speed(t) {
  let v = 1;
  for (const [a, b, f, g] of SPEED) { if (t >= b) v = g; else if (t > a) { v = lerp(f, g, ss((t - a) / (b - a))); break; } else break; }
  return v;
}
const HZ = 600, XT = new Float64Array(Math.ceil(DUR * HZ) + 2);
for (let i = 1; i < XT.length; i++) XT[i] = XT[i - 1] + V0 * speed((i - 0.5) / HZ) / HZ;
const Xat = (t) => { const f = clamp(t, 0, DUR) * HZ, i = Math.floor(f); return lerp(XT[i], XT[Math.min(i + 1, XT.length - 1)], f - i); };
const phaseAt = (t) => Xat(t) / STRIDE_M;

// ---------- the world, placed by when things should be seen ----------
const X_STOP1 = Xat(10.8), X_STOP2 = Xat(27.0);
const T_E1 = 18.6, T_E2 = 24.9;
const X_E1 = Xat(T_E1), X_E2 = Xat(T_E2);
const REF_M = 430 / 1.7;                  // px per metre in the 16:9 frame: placements are made there, shared by both frames
const X_GOB = X_STOP1 + 260 / (REF_M * 0.22) + 0.6;
const X_HUNT = X_STOP1 + 420 / (REF_M * 0.45);
const X_HAUL = Xat(20.6) + 2.16;
const X_HENGE = Xat(21.7) + 400 / (REF_M * 0.3) - 1.4;
const X_KHUFU = X_STOP2 + 1.2 + 115;

const SECTIONS = [
  { era: 'anatolia', X0: -1e9, X1: X_E1, outfit: OUTFITS.hide(), surface: 'steppe',
    date: { from: 10000, to: 9500, t0: 6.0, t1: 9.6 }, title: 'เกอเบกลี เทเป · ตุรกี', mile: null,
    items: { seed: 3, clouds: [{ X: 0, y: 300, s: 42, drift: 6 }, { X: 60, y: 250, s: 34, drift: 4 }, { X: 120, y: 330, s: 30, drift: 5 }],
      back: [
        { k: 0.15, draw: (c, V, E) => { tree(c, V, E, X_GOB - 30, 0.15, 'flat', 4); tree(c, V, E, X_GOB + 10, 0.15, 'flat', 8); } },
        { k: 0.22, draw: (c, V, E) => gobekli(c, V, E, X_GOB, 0.22) },
        { k: 0.45, draw: (c, V, E, t) => hunter(c, V, E, X_HUNT, 0.45, t) },
      ] } },
  { era: 'britain', X0: X_E1, X1: X_E2, outfit: OUTFITS.wool(), surface: 'turf',
    date: { from: 9500, to: 2950, t0: 15.6, t1: 18.6 }, title: 'สโตนเฮนจ์ · อังกฤษ', mile: '2950 ปีก่อน ค.ศ.',
    items: { seed: 8, clouds: [{ X: 40, y: 270, s: 44, drift: 3 }, { X: 110, y: 330, s: 30, drift: 2 }, { X: 170, y: 250, s: 38, drift: 2 }],
      back: [
        { k: 0.2, draw: (c, V, E) => { tree(c, V, E, X_HENGE - 26, 0.2, 'round', 2); tree(c, V, E, X_HENGE + 14, 0.2, 'round', 5); tree(c, V, E, X_HENGE + 40, 0.2, 'round', 9); } },
        { k: 0.3, draw: (c, V, E) => stonehenge(c, V, E, X_HENGE, 0.3) },
        { k: 0.55, draw: (c, V, E, t) => haulers(c, V, E, X_HAUL, 0.55, t * 0.8) },
        { k: 0.5, draw: (c, V, E) => tree(c, V, E, X_E1 + 9, 0.5, 'round', 11) },
      ] } },
  { era: 'egypt', X0: X_E2, X1: 1e9, outfit: OUTFITS.linen(), surface: 'sand',
    date: { from: 2950, to: 2560, t0: 23.4, t1: 25.6 }, title: 'พีระมิดแห่งกิซา · อียิปต์', mile: '2589 ปีก่อน ค.ศ.',
    items: { seed: 12, clouds: [{ X: 60, y: 260, s: 40, drift: 3 }, { X: 150, y: 320, s: 32, drift: 3 }],
      back: [
        { k: 0.22, draw: (c, V, E) => { palm(c, V, E, X_E2 + 2, 0.22, 3); palm(c, V, E, X_E2 + 9, 0.22, 6); palm(c, V, E, X_E2 + 13, 0.22, 9); } },
        { k: 0.5, draw: (c, V, E) => pyramid(c, V, E, X_KHUFU + 330, 0.5, 136, 215) },
        { k: 0.42, draw: (c, V, E) => pyramid(c, V, E, X_KHUFU + 520, 0.42, 65, 103) },
      ],
      stage: (c, V, E) => pyramid(c, V, E, X_KHUFU, 1, 146, 230) } },
];

// ---------- the date card (rolling digits) ----------
function dateValue(t) {
  for (let i = SECTIONS.length - 1; i >= 0; i--) {
    const d = SECTIONS[i].date;
    if (t >= d.t0) return lerp(d.from, d.to, ss((t - d.t0) / (d.t1 - d.t0)));
  }
  return SECTIONS[0].date.from;
}
const rolling = (t) => SECTIONS.some(s => t > s.date.t0 && t < s.date.t1);
function sectionAt(t) { const X = Xat(t); return SECTIONS.findIndex(s => X >= s.X0 && X < s.X1); }

function drawOdometer(ctx, v, x, y, fs) {
  // v counts years; digits roll in tens (units always 0)
  const n = v / 10, digits = String(Math.floor(n)).length;
  ctx.font = `700 ${fs}px Mali`;
  const adv = Math.max(...'0123456789'.split('').map(d => ctx.measureText(d).width));
  const comma = v >= 10000 ? ctx.measureText(',').width : 0;
  const total = (digits + 1) * adv + comma;
  let cx = x;
  ctx.save(); ctx.beginPath(); ctx.rect(x - 4, y - fs * 0.95, total + 8, fs * 1.25); ctx.clip();
  const all = [];
  for (let i = digits - 1; i >= 0; i--) {
    const p = Math.floor(n / Math.pow(10, i)) % 10;
    const lower = n % Math.pow(10, i), fr = n - Math.floor(n);
    const roll = i === 0 ? fr : (Math.pow(10, i) - 1 - Math.floor(lower) === 0 ? fr : 0);
    all.push([p, roll]);
  }
  all.forEach(([p, roll], j) => {
    const i = digits - 1 - j;
    const lh = fs * 1.15, off = roll * lh;
    ctx.textAlign = 'center';
    ctx.fillText(String(p), cx + adv / 2, y + off);
    ctx.fillText(String((p + 1) % 10), cx + adv / 2, y + off - lh);
    cx += adv;
    if (v >= 10000 && i === 3) { ctx.fillText(',', cx + comma / 2, y); cx += comma; }
  });
  ctx.fillText('0', cx + adv / 2, y); cx += adv;
  ctx.restore();
  return total;
}

function dateCard(ctx, V, E, t, mapMode, texts) {
  const u = V.u, wide = V.wide;
  const f1 = (wide ? 50 : 60) * u, f2 = (wide ? 30 : 36) * u;
  let line2, w1;
  const pre = 'ราว ', post = ' ปีก่อน ค.ศ.';
  if (mapMode) {
    line2 = 'ราว 10,000 – 2500 ปีก่อน ค.ศ.';
  } else {
    line2 = SECTIONS[Math.max(0, sectionAt(t))].title;
  }
  ctx.font = `700 ${f1}px Mali`;
  const adv = Math.max(...'0123456789'.split('').map(d => ctx.measureText(d).width));
  const head = mapMode ? 'อนุสรณ์สถานโบราณ' : null;
  const v = dateValue(t);
  const numW = (String(Math.floor(v / 10)).length + 1) * adv + (v >= 10000 ? ctx.measureText(',').width : 0);
  w1 = head ? ctx.measureText(head).width : ctx.measureText(pre).width + numW + ctx.measureText(post).width;
  ctx.font = `600 ${f2}px Mali`; const w2 = ctx.measureText(line2).width;
  const w = Math.max(wide ? 560 * u : 640 * u, Math.max(w1, w2) + 90 * u), h = f1 * 1.25 + f2 * 1.35 + 30 * u;
  const cx = V.W / 2, y = wide ? 40 * u : 190 * u, x = cx - w / 2;
  cloud(ctx, x + w + 22 * u, y + h * 0.62, 46 * u, E, u);
  cloud(ctx, x - 6 * u, y + h * 0.3, 40 * u, E, u);
  rrect(ctx, x, y, w, h, 22 * u, { fill: PAPER, lw: 3.5 * u });
  ctx.fillStyle = INK; ctx.textBaseline = 'alphabetic';
  const by = y + 15 * u + f1;
  if (head) { ctx.font = `700 ${f1}px Mali`; ctx.textAlign = 'center'; ctx.fillText(head, cx, by); }
  else {
    ctx.font = `700 ${f1}px Mali`; ctx.textAlign = 'left';
    let lx = cx - w1 / 2; ctx.fillText(pre, lx, by); lx += ctx.measureText(pre).width;
    drawOdometer(ctx, v, lx, by, f1); lx += numW;
    ctx.font = `700 ${f1}px Mali`; ctx.textAlign = 'left'; ctx.fillText(post, lx, by);
  }
  ctx.fillStyle = '#4a443d'; ctx.textAlign = 'center';
  ctx.font = `600 ${f2}px Mali`; ctx.fillText(line2, cx, by + f2 * 0.25 + f2 * 1.05);
  if (!rolling(t)) texts.push({ id: 'card', text: (head ?? `${pre}${Math.round(v)}${post}`) + ' ' + line2, x0: x, y0: y, x1: x + w, y1: y + h });
}

// ---------- the walker ----------
const WALKER = { hair: 'bun', hairColor: '#4b3022', female: true };
function walkerOpts(t, Lz) {
  const lw = Math.min(5.5 * Lz.u, Lz.Hf * 0.0128);
  const base = { x: Lz.ax, gy: Lz.G, h: Lz.Hf, lw, ...WALKER };
  const walk = skeleton({ ...base, walk: true, phase: phaseAt(t) });
  // stop 1: turn to the viewer and point at the pillars; stop 2: stand, look up at the pyramid
  const stand1 = skeleton({ ...base, walk: false, front: true, arms: [[2.15, -0.15], [-0.2, 0.1]] });
  const stand2 = skeleton({ ...base, walk: false, arms: [[0.15, 0.1], [-0.1, 0.1]] });
  let S = walk, look = 0.45, mood = 'smile', brows = 0;
  const k1 = ss((t - 10.8) / 0.45) * (1 - ss((t - 14.0) / 0.4));
  const k2 = ss((t - 27.0) / 0.45);
  if (k1 > 0) { S = blendSkel(walk, stand1, k1); look = lerp(0.45, 0.12, k1); brows = k1 > 0.5 ? 1 : 0; mood = k1 > 0.5 ? 'wow' : 'smile'; }
  if (k2 > 0) { S = blendSkel(walk, stand2, k2); look = lerp(0.45, 0.8, k2); brows = k2 > 0.5 ? 1 : 0; mood = k2 > 0.5 ? 'wow' : 'smile'; }
  const blink = [7.3, 12.6, 18.9, 22.4, 28.1].some(b => t > b && t < b + 0.12) ? 1 : 0;
  return { S, look, mood, brows, blink, lw };
}

// ---------- events for the mixer ----------
const EV = [];
for (const [id, t] of Object.entries(VO)) EV.push({ t, type: 'voice', id });
{ // footsteps: every plant while the walker is on screen and moving
  let last = phaseAt(5.99), lastStep = -1;
  for (let t = 6.0; t < 32.0; t += 1 / HZ) {
    const ph = phaseAt(t);
    if (Math.floor(ph * 2) !== Math.floor(last * 2) && speed(t) > 0.05 && t - lastStep > 0.12) {
      lastStep = t;
      const X = Xat(t), s = SECTIONS.find(s => X >= s.X0 && X < s.X1);
      EV.push({ t: +t.toFixed(3), type: 'step', surface: s.surface, v: speed(t) });
    }
    last = ph;
  }
  // card ticks
  let lastN = Math.floor(dateValue(0) / 10), lastT = -1;
  for (let t = 5.5; t < 27; t += 1 / 120) {
    const n = Math.floor(dateValue(t) / 10);
    if (n !== lastN && t - lastT > 0.05) { EV.push({ t: +t.toFixed(3), type: 'tick' }); lastT = t; }
    lastN = n;
  }
}
EV.push({ t: T_E1, type: 'era' }, { t: T_E2, type: 'era' });
EV.push({ t: 11.0, type: 'pop' }, { t: 21.7, type: 'pop' }, { t: 29.0, type: 'pop' }, { t: 29.2, type: 'pop' }, { t: 36.0, type: 'pop' });
EV.push({ t: 5.4, type: 'whoosh', d: 0.6 }, { t: 6.0, type: 'whoosh', d: 0.6 }, { t: 27.0, type: 'whoosh', d: 2.0, big: 1 }, { t: 15.6, type: 'whoosh', d: 1.2 }, { t: 23.4, type: 'whoosh', d: 1.2 }, { t: 32.0, type: 'whoosh', d: 0.6 }, { t: 32.6, type: 'whoosh', d: 0.6 });
EV.sort((a, b) => a.t - b.t);

// ---------- frame ----------
const M = makeMap(W, H);
const MAPSTOPS = [
  { s: 0.2, kind: 'gobekli', label: '9500 ปีก่อน ค.ศ.', side: 1 },
  { s: 0.48, kind: 'stonehenge', label: '2950 ปีก่อน ค.ศ.', side: -1 },
  { s: 0.74, kind: 'giza', label: '2560 ปีก่อน ค.ศ.', side: 1 },
];
let TEXTS = [];

function captionAt(t) {
  for (const [id, t0] of Object.entries(VO)) {
    const t1 = t0 + Math.max(1.8, VD[id] + 0.6);
    if (t >= t0 && t < t1) return id;
  }
  return null;
}

function iris(ctx, cx, cy, r) {
  ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.arc(cx, cy, Math.max(0, r), 0, Math.PI * 2, true);
  ctx.fillStyle = INK; ctx.fill('evenodd'); ctx.restore();
}

function mapFrame(t, end) {
  const V = { ...L0 };
  let cam, q = 0;
  if (!end) {
    const s = 0.03;
    cam = { center: M.at(s + 0.02 * ss(t / 6)).p, z: lerp(1.35, 1.75, ss(t / 6)), dot: s };
  } else {
    const k = ss((t - 32.6) / 3.6), d = lerp(0.745, 0.88, ss((t - 33.2) / 4.6));
    const c0 = M.at(0.745).p, c1 = [M.dims[0] / 2, M.dims[1] / 2];
    cam = { center: [lerp(c0[0], c1[0], k), lerp(c0[1], c1[1], k)], z: lerp(1.75, 1.0, k), dot: d };
    q = back((t - 36.0) / 0.35);
  }
  const r = drawMap(ctx, M, V, cam, MAPSTOPS, TEXTS, q);
  dateCard(ctx, V, ERAS.anatolia, t, true, TEXTS);
  return r;
}

// a call-out tag beside its target, kept out of the date card's band and inside the frame
function tagPos(tx, ty) {
  const u = L0.u, cardBot = (L0.wide ? 185 : 370) * u;
  const side = tx > W * 0.6 ? -1 : 1;
  const lx = clamp(tx + side * 170 * u, 170 * u, W - 170 * u);
  const ly = Math.max(ty - 110 * u, cardBot + 30 * u);
  return [lx, ly];
}

function speedLines(ctx, Lz, t) {
  const k = clamp((speed(t) - 1.3) / 1.5, 0, 1);
  if (k <= 0) return;
  const u = L0.u, h = Lz.Hf, x = Lz.ax - 0.16 * h;
  ctx.save(); ctx.globalAlpha = k;
  [0.62, 0.48, 0.3].forEach((f, i) => {
    const y = Lz.G - f * h, len = (70 + 40 * ((i * 7 + Math.floor(t * 12)) % 3)) * u;
    stroke(ctx, [[x - len - i * 14 * u, y], [x - i * 14 * u, y]], 4 * u);
  });
  ctx.restore();
}

function sideFrame(t) {
  // camera: pull back for the scale check (log zoom), pan so the pyramid sits in frame
  const zk = ss((t - 27.0) / 2.0);
  const zEnd = L0.wide ? 0.012 : 0.0125, pEnd = L0.wide ? -60 * L0.u : -450 * L0.u;
  const z = Math.exp(lerp(0, Math.log(zEnd), zk)), pan = pEnd * zk;
  const Lz = zoomed(L0, z, pan, 0);
  const cam = Xat(t);
  const V = makeView(Lz, cam);
  const V1 = makeView(L0, cam);
  // era regions on screen (boundaries that have left the frame stop clipping)
  const regions = SECTIONS.map(s => {
    const b = (X) => { if (X < -1e8) return -Infinity; if (X > 1e8) return Infinity; const x1 = V1.sx(X, 1); if (x1 < -60 || (z < 0.95 && x1 < L0.ax)) return -Infinity; if (x1 > W + 60) return Infinity; return V.sx(X, 1); };
    return [Math.max(0, b(s.X0)), Math.min(W, b(s.X1))];
  });
  const vis = SECTIONS.map((s, i) => regions[i][1] > regions[i][0]);
  SECTIONS.forEach((s, i) => { if (vis[i]) drawEra(ctx, V, ERAS[s.era], t, s.items, regions[i]); });
  // stage landmarks
  SECTIONS.forEach((s, i) => { if (vis[i] && s.items.stage) { ctx.save(); ctx.beginPath(); ctx.rect(regions[i][0], 0, regions[i][1] - regions[i][0], H); ctx.clip(); s.items.stage(ctx, V, ERAS[s.era]); ctx.restore(); } });
  // era lines
  SECTIONS.forEach((s, i) => { if (s.mile && z > 0.5) { const x = V.sx(s.X0, 1); if (x > -300 && x < W + 50) eraLine(ctx, V, x, s.mile); } });
  // walker, split by era regions
  const wo = walkerOpts(t, Lz);
  SECTIONS.forEach((s, i) => {
    if (!vis[i]) return;
    ctx.save(); ctx.beginPath(); ctx.rect(regions[i][0], 0, regions[i][1] - regions[i][0], H); ctx.clip();
    drawFigure(ctx, { S: wo.S, outfit: s.outfit, ...WALKER, look: wo.look, mood: wo.mood, brows: wo.brows, blink: wo.blink });
    ctx.restore();
  });
  SECTIONS.forEach((s, i) => { if (vis[i] && z > 0.3) drawFront(ctx, V, ERAS[s.era], regions[i]); });
  speedLines(ctx, Lz, t);

  // call-outs riding with their landmarks
  const u = L0.u;
  const cA = clamp((t - 11.0) / 0.25, 0, 1) * (1 - clamp((t - 14.6) / 0.2, 0, 1));
  if (cA > 0) {
    const s = V.s(0.22), gy = V.gy(0.22), tx = V.sx(X_GOB - 0.6, 0.22), ty = gy - 1.9 * s - 5.5 * s;
    const [lx, ly] = tagPos(tx, ty); callout(ctx, V, 'เกอเบกลี เทเป', tx, ty, lx, ly, back(cA), TEXTS);
  }
  const cB = clamp((t - 21.7) / 0.25, 0, 1);
  if (cB > 0 && vis[1]) {
    ctx.save(); ctx.beginPath(); ctx.rect(regions[1][0], 0, regions[1][1] - regions[1][0], H); ctx.clip();
    const s = V.s(0.3), gy = V.gy(0.3), tx = V.sx(X_HENGE + 1.4, 0.3), ty = gy - 4.95 * s;
    const [lx, ly] = tagPos(tx, ty); callout(ctx, V, 'สโตนเฮนจ์', tx, ty, lx, ly, back(cB), TEXTS);
    ctx.restore();
  }
  // scale check
  const sc = clamp((t - 29.0) / 0.3, 0, 1);
  if (zk > 0.98 && sc > 0) {
    const s = V.s(1), gy = V.gy(1);
    const apx = V.sx(X_KHUFU, 1) + 230 * 0.06 * s, apy = gy - 146 * s;
    const wx = Lz.ax, wy = Lz.G - Lz.Hf;
    ctx.save(); ctx.setLineDash([12 * u, 9 * u]);
    stroke(ctx, [[wx, apy], [apx - 30 * u, apy]], 3.4 * u, '#d9483b', 'butt');
    stroke(ctx, [[wx, wy - 14 * u], [wx, apy]], 3.4 * u, '#d9483b', 'butt');
    ctx.restore();
    circle(ctx, wx, Lz.G - Lz.Hf / 2, 22 * u, { fill: null, line: '#d9483b', w: 3.6 * u });
    ctx.save(); ctx.translate(wx + 20 * u, (wy + apy) / 2); ctx.scale(back(sc), back(sc));
    ctx.font = `700 ${64 * u}px Mali`; ctx.fillStyle = '#d9483b'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.lineWidth = 10 * u; ctx.strokeStyle = PAPER; ctx.lineJoin = 'round'; ctx.strokeText('× 86', 0, 0); ctx.fillText('× 86', 0, 0);
    ctx.restore();
    TEXTS.push({ id: 'x86', text: '× 86', x0: wx + 20 * u, y0: (wy + apy) / 2 - 40 * u, x1: wx + 220 * u, y1: (wy + apy) / 2 + 40 * u });
    const pc = clamp((t - 29.2) / 0.3, 0, 1);
    if (pc > 0) callout(ctx, V, 'มหาพีระมิด · สูง 146 ม.', apx, apy, apx + (L0.wide ? 150 : -60) * u, apy - 120 * u, back(pc), TEXTS);
  }
  const E = ERAS[SECTIONS[Math.max(0, sectionAt(t))].era];
  dateCard(ctx, V1, E, t, false, TEXTS);
  return { head: [wo.S.head[0], wo.S.head[1]], E };
}

window.DUR = DUR;
window.EV = EV;
window.render = (t) => {
  TEXTS = [];
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, W, H);
  const diag = Math.hypot(W, H);
  if (t < 6.0) {
    const r = mapFrame(t, false);
    if (t > 5.4) iris(ctx, r.dot[0], r.dot[1], diag * (1 - ss((t - 5.4) / 0.6)));
  } else if (t < 32.6) {
    const r = sideFrame(t);
    if (t < 6.6) iris(ctx, r.head[0], r.head[1], diag * ss((t - 6.0) / 0.6));
    if (t > 32.0) iris(ctx, r.head[0], r.head[1], diag * (1 - ss((t - 32.0) / 0.6)));
  } else {
    const r = mapFrame(t, true);
    if (t < 33.2) iris(ctx, r.dot[0], r.dot[1], diag * ss((t - 32.6) / 0.6));
  }
  const id = captionAt(t);
  if (id) caption(ctx, L0, TXT[id], 'th', TEXTS);
};
window.TEXTS = (t) => { window.render(t); return TEXTS.filter(x => !x.id.startsWith('mile')); };
window.CUES = Object.entries(VO).map(([id, t0]) => ({ t0, t1: t0 + Math.max(1.8, VD[id] + 0.6), text: TXT[id] }));
