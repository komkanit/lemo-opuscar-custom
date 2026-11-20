// POV vlog from the past: generated stills + a handheld phone camera, jump cuts, vlog UI, stickers and captions, all in code.
// ?lang=th|en picks timeline.<lang>.json (built by tools/timeline.py from shots.json and that language's voice).
const q = new URLSearchParams(location.search);
const L = q.get('lang') === 'en' ? 'en' : 'th';
const TL = await (await fetch(`timeline.${L}.json`)).json();
const cv = document.getElementById('c'), W = cv.width = innerWidth, H = cv.height = innerHeight, g = cv.getContext('2d');
const S = W / 1080;   // layout is written for 1080 wide

const load = src => new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => no(new Error('missing ' + src)); i.src = src; });
const IMG = {};
await Promise.all([...new Set(TL.shots.map(s => s.img).filter(Boolean))].map(async n => { IMG[n] = await load(`images/${n}.${TL.img_ext || 'png'}`); }));
window.DUR = TL.DUR; window.EV = TL.EV;

// ---- helpers ----------------------------------------------------------------------------------------------------
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const ease = x => { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); };
const back = x => { x = clamp(x, 0, 1); const c = 1.9; return 1 + (c + 1) * (x - 1) ** 3 + c * (x - 1) ** 2; };
const lerp = (a, b, k) => a + (b - a) * k;
const hash = n => { const s = Math.sin(n * 127.1) * 43758.5453; return s - Math.floor(s); };
// handheld phone: a few sines per axis, slow drift plus small fast jitter (deterministic in t)
const shake = (t, a) => ({
  x: a * (9 * Math.sin(t * 2.1 + 0.4) + 4 * Math.sin(t * 5.3 + 1.7) + 1.5 * Math.sin(t * 13.1)),
  y: a * (7 * Math.sin(t * 1.7 + 2.2) + 3.5 * Math.sin(t * 6.1 + 0.3) + 1.5 * Math.sin(t * 11.3 + 1)),
  r: a * (0.006 * Math.sin(t * 1.3 + 0.8) + 0.002 * Math.sin(t * 4.7)),
});

function outlined(text, x, y, size, { font = 'Kanit', weight = 900, fill = '#fff', stroke = '#111', sw = 0.16, align = 'center' } = {}) {
  g.font = `${weight} ${size}px ${font}`; g.textAlign = align; g.textBaseline = 'alphabetic';
  g.lineJoin = 'round'; g.lineWidth = size * sw; g.strokeStyle = stroke; g.strokeText(text, x, y);
  g.fillStyle = fill; g.fillText(text, x, y);
}
function fit(lines, size, max, font = 'Kanit', weight = 900) {   // shrink until the widest line fits
  g.font = `${weight} ${size}px ${font}`; const w = Math.max(...lines.map(l => g.measureText(l).width));
  return w > max ? size * max / w : size;
}

// ---- camera -----------------------------------------------------------------------------------------------------
let CAM, TEXTS = [];
const shotAt = t => TL.shots.find(s => t >= s.t0 && t < s.t1) || TL.shots[TL.shots.length - 1];
const toScreen = (u, v) => [W / 2 + CAM.sh.x * S + (u - CAM.fx) * CAM.iw * CAM.sc, H / 2 + CAM.sh.y * S + (v - CAM.fy) * CAM.ih * CAM.sc];

function drawShot(t, s) {
  const img = IMG[s.img], local = t - s.t0, k = local / (s.t1 - s.t0);
  let z = lerp(s.push[0], s.push[1], ease(k)), [fx, fy] = s.focus;
  z *= 1 + 0.07 * (1 - ease(local / 0.22));               // jump cut: lands zoomed in, snaps back
  if (s.punch && t >= s.punch.t) { const p = back((t - s.punch.t) / 0.24); z *= lerp(1, s.punch.to, p); fx = lerp(fx, s.punch.focus[0], p); fy = lerp(fy, s.punch.focus[1], p); }
  let amp = 1; if (s.shake) amp = 1 + (s.shake - 1) * Math.exp(-local / 1.4);   // the accident: a hard jolt that settles
  const sh = shake(t, amp), sc = Math.max(W / img.width, H / img.height) * z * 1.04;
  const mx = (W / 2 + 24 * S * amp) / (img.width * sc), my = (H / 2 + 24 * S * amp) / (img.height * sc);   // never show an edge
  fx = clamp(fx, mx, 1 - mx); fy = clamp(fy, my, 1 - my);
  g.save(); g.translate(W / 2 + sh.x * S, H / 2 + sh.y * S); g.rotate(sh.r); g.scale(sc, sc);
  if (s.archive) g.filter = 'sepia(0.85) saturate(0.55) contrast(1.08) brightness(0.9)';   // the same picture, now an archive photo
  g.drawImage(img, -fx * img.width, -fy * img.height); g.filter = 'none'; g.restore();
  CAM = { sh, sc, fx, fy, iw: img.width, ih: img.height };
  if (s.archive) archiveLook(t);
  if (s.lamp) {   // lamp light breathes: a soft dark wash that comes and goes
    const f = 0.06 + 0.05 * Math.sin(t * 9.1) * Math.sin(t * 3.7 + 1) + 0.03 * hash(Math.floor(t * 12));
    g.fillStyle = `rgba(10,5,0,${f})`; g.fillRect(0, 0, W, H);
  }
  if (local < 0.1 && s.t0 > 0 && !s.archive) {   // flash on the cut (red on the accident; the archive cut glitches instead)
    g.fillStyle = s.alarm ? `rgba(220,30,20,${0.6 * (1 - local / 0.1)})` : `rgba(255,255,255,${0.5 * (1 - local / 0.1)})`; g.fillRect(0, 0, W, H);
  }
  if (s.alarm && local < 1.2) { const a = 0.25 * (1 - local / 1.2) * (0.6 + 0.4 * Math.sin(local * 30)); g.fillStyle = `rgba(200,20,10,${a})`; g.fillRect(0, 0, W, H); }
  if (s.loop && t > s.t1 - 0.3) { g.fillStyle = `rgba(255,255,255,${ease((t - (s.t1 - 0.3)) / 0.3)})`; g.fillRect(0, 0, W, H); }
}

// ---- the map "from the future": where the canal is in today's city ------------------------------------------------
// Schematic, in 1080×1920 layout units, north up. Before the future glitch: the day it was dug (the loop is the river, the
// cut a thin yellow line). After it: today (the cut is the river, the loop shrinks to two canals), then the pins pop in.
const MAP = {
  north: [[700, 150], [696, 320], [682, 470], [650, 600]],
  cut: [[650, 600], [628, 720], [622, 850], [640, 975], [670, 1080]],
  south: [[670, 1080], [700, 1170], [760, 1250], [860, 1310], [1000, 1345], [1140, 1360]],
  loop: [[650, 600], [580, 585], [505, 615], [430, 585], [350, 612], [280, 660], [245, 740], [262, 820], [232, 900], [255, 985],
         [300, 1060], [380, 1090], [465, 1060], [545, 1100], [615, 1085], [670, 1080]],
  pins: { siriraj: [602, 668, 'L'], thaphrachan: [690, 628, 'R'], palace: [688, 780, 'R'], thatien: [690, 915, 'R'], watarun: [588, 930, 'L'] },
};
const plen = pts => pts.slice(1).reduce((a, p, i) => a + Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]), 0);
function mpath(pts) {
  g.beginPath(); g.moveTo(pts[0][0] * S, pts[0][1] * S);
  for (let i = 1; i < pts.length - 1; i++) g.quadraticCurveTo(pts[i][0] * S, pts[i][1] * S, (pts[i][0] + pts[i + 1][0]) / 2 * S, (pts[i][1] + pts[i + 1][1]) / 2 * S);
  const e = pts[pts.length - 1]; g.lineTo(e[0] * S, e[1] * S);
}
function mstroke(pts, w, col, d = 1, alpha = 1) {   // d: how much of the line is drawn so far
  if (d <= 0) return; const L0 = plen(pts) * 1.08 * S;
  g.save(); g.globalAlpha = alpha; g.lineCap = 'round'; g.lineJoin = 'round'; g.strokeStyle = col; g.lineWidth = w * S;
  if (d < 1) g.setLineDash([L0 * d, L0 * 2]); mpath(pts); g.stroke(); g.restore();
}
// an old map on parchment: Trirong ink lettering, faded teal water with ink banks, red ink for the canal we dug
const INK = '#3b2614', RED = '#a5281b', WATER = '#86a39d';
function mlabel(text, x, y, size, { col = INK, align = 'center', rot = 0, a = 1, sc = 1, font = 'Trirong', weight = 700 } = {}) {
  g.save(); g.globalAlpha = a; g.translate(x * S, y * S); g.rotate(rot); g.scale(sc, sc);
  g.font = `${weight} ${size * S}px ${font}`; g.textAlign = align; g.textBaseline = 'middle';
  g.lineJoin = 'round'; g.lineWidth = size * 0.18 * S; g.strokeStyle = 'rgba(236,222,186,0.85)'; g.strokeText(text, 0, 0);   // paper halo
  g.fillStyle = col; g.fillText(text, 0, 0); g.restore();
  g.font = `${weight} ${size * S}px ${font}`; const w = g.measureText(text).width, x0 = align === 'right' ? x * S - w : align === 'left' ? x * S : x * S - w / 2;
  return { text, x0, y0: (y - size * 0.6) * S, x1: x0 + w, y1: (y + size * 0.6) * S };
}
const FIBRE = (() => { const c = document.createElement('canvas'); c.width = c.height = 512; const x = c.getContext('2d'), d = x.createImageData(512, 512);
  for (let i = 0; i < d.data.length; i += 4) { const v = (hash(i * 0.113) - 0.5); d.data[i] = 90 + v * 60; d.data[i + 1] = 60 + v * 40; d.data[i + 2] = 20; d.data[i + 3] = 18 + Math.abs(v) * 30; }
  x.putImageData(d, 0, 0); return c; })();
function nearRiver(x, y) {
  for (const pts of [MAP.north, MAP.cut, MAP.south, MAP.loop]) for (const p of pts) if (Math.hypot(p[0] - x, p[1] - y) < 75) return true;
  return false;
}
const TREES = (() => { const out = []; for (let i = 0; out.length < 46 && i < 600; i++) {
  const x = 90 + hash(i * 1.37) * 900, y = 300 + hash(i * 2.91 + 5) * 1000;
  if (!nearRiver(x, y) && !(x > 330 && x < 600 && y > 760 && y < 840)) out.push([x, y, 0.7 + hash(i * 7.7) * 0.6]); } return out; })();
function paper() {
  g.fillStyle = '#e4cf9f'; g.fillRect(0, 0, W, H);
  const r = g.createRadialGradient(W / 2, H * 0.45, H * 0.1, W / 2, H * 0.5, H * 0.75);
  r.addColorStop(0, 'rgba(250,238,205,0.7)'); r.addColorStop(1, 'rgba(250,238,205,0)'); g.fillStyle = r; g.fillRect(0, 0, W, H);
  g.fillStyle = g.createPattern(FIBRE, 'repeat'); g.fillRect(0, 0, W, H);
  for (let i = 0; i < 7; i++) {   // old stains
    const x = hash(i * 3.3) * W, y = hash(i * 5.1 + 2) * H, rr = (80 + hash(i * 9.2) * 220) * S, st = g.createRadialGradient(x, y, rr * 0.2, x, y, rr);
    st.addColorStop(0, 'rgba(150,100,40,0.10)'); st.addColorStop(0.85, 'rgba(150,100,40,0.06)'); st.addColorStop(1, 'rgba(150,100,40,0)'); g.fillStyle = st; g.fillRect(0, 0, W, H);
  }
  const e = g.createRadialGradient(W / 2, H / 2, H * 0.32, W / 2, H / 2, H * 0.72);   // burnt edges
  e.addColorStop(0, 'rgba(80,45,10,0)'); e.addColorStop(1, 'rgba(80,45,10,0.62)'); g.fillStyle = e; g.fillRect(0, 0, W, H);
}
function riverInk(pts, w, d = 1) { mstroke(pts, w + 7, INK, d, 0.85); mstroke(pts, w, WATER, d); if (w > 20) mstroke(pts, w * 0.3, 'rgba(220,232,222,0.35)', d); }
function tree(x, y, k, a) {
  g.save(); g.globalAlpha = a * 0.5; g.strokeStyle = INK; g.lineWidth = 2.2 * S; g.translate(x * S, y * S); g.scale(k, k);
  g.beginPath(); g.moveTo(0, 0); g.lineTo(0, -16 * S); g.stroke();
  for (const ang of [-2.5, -1.9, -1.2, -0.6]) { g.beginPath(); g.moveTo(0, -16 * S); g.quadraticCurveTo(Math.cos(ang) * 10 * S, -16 * S + Math.sin(ang) * 10 * S - 4 * S, Math.cos(ang) * 16 * S, -12 * S + Math.sin(ang) * 6 * S); g.stroke(); }
  g.restore();
}
function rose(x, y, r, a) {
  g.save(); g.globalAlpha = a; g.translate(x * S, y * S); g.strokeStyle = INK; g.lineWidth = 2 * S;
  g.beginPath(); g.arc(0, 0, r * 0.62 * S, 0, 7); g.stroke(); g.beginPath(); g.arc(0, 0, r * 0.7 * S, 0, 7); g.stroke();
  for (let i = 0; i < 8; i++) {
    const ang = i * Math.PI / 4, len = (i % 2 ? 0.55 : 1) * r * S, wd = (i % 2 ? 0.1 : 0.16) * r * S;
    g.save(); g.rotate(ang);
    g.fillStyle = i === 0 ? RED : INK; g.beginPath(); g.moveTo(0, -len); g.lineTo(wd, 0); g.lineTo(0, 0); g.closePath(); g.fill();
    g.fillStyle = '#f1e3bd'; g.beginPath(); g.moveTo(0, -len); g.lineTo(-wd, 0); g.lineTo(0, 0); g.closePath(); g.fill(); g.stroke();
    g.restore();
  }
  g.restore();
}
function landmark(id, x, y, big, sc) {   // a little ink drawing: a prang for a temple, a tiered roof for the palace, a ring for the rest
  g.save(); g.translate(x * S, y * S); g.scale(sc * S, sc * S); g.strokeStyle = big ? RED : INK; g.fillStyle = big ? RED : INK; g.lineWidth = 2.5;
  if (id === 'watarun' || id === 'thatien') { g.beginPath(); g.moveTo(-9, 10); g.lineTo(-6, -6); g.lineTo(0, -24); g.lineTo(6, -6); g.lineTo(9, 10); g.closePath(); g.fill(); g.fillRect(-13, 10, 26, 4); }
  else if (id === 'palace') { for (let k = 0; k < 3; k++) { g.beginPath(); g.moveTo(-16 + k * 4, 10 - k * 9); g.lineTo(0, -4 - k * 9); g.lineTo(16 - k * 4, 10 - k * 9); g.stroke(); } g.fillRect(-14, 10, 28, 4); }
  else { g.beginPath(); g.arc(0, 0, 9, 0, 7); g.stroke(); g.beginPath(); g.arc(0, 0, 3.5, 0, 7); g.fill(); }
  g.restore();
}
function drawMap(t, s) {
  const m = s.map, lab = m.labels[L], u = t - s.t0, k = (t - s.t0) / (s.t1 - s.t0), at = f => s.vo + f * s.vo_dur;
  const tf = s.future ? s.future.t : at(0.3), mo = ease((t - tf) / 1.2);                 // 0 = the day it was dug, 1 = today
  paper();
  const z = lerp(s.push[0], s.push[1], ease(k));
  g.save(); g.translate(W / 2, 900 * S); g.scale(z, z); g.translate(-W / 2, -900 * S);
  for (const [x, y, kk] of TREES) tree(x, y, kk, 1);
  const dIn = ease(u / 1.1);
  riverInk(MAP.north, 58, dIn); riverInk(MAP.south, 58, dIn);
  riverInk(MAP.loop, lerp(52, 12, mo), dIn);
  const dc = ease((t - at(m.cut)) / 0.8);                                                // the cut, inked in as the voice names it
  if (mo > 0) { const pulse = 0.35 + 0.25 * Math.sin(t * 5); mstroke(MAP.cut, lerp(10, 58, mo) + 22, RED, 1, pulse); riverInk(MAP.cut, lerp(10, 58, mo)); }
  else mstroke(MAP.cut, 9, RED, dc);
  const T = [], la = ease((t - tf - 0.9) / 0.4);
  if (dc > 0.3) {
    const a = mo > 0 ? 1 : ease((dc - 0.3) / 0.4); T.push(mlabel(lab.cut, 410, 800, 44, { col: RED, a }));
    g.save(); g.globalAlpha = a; g.strokeStyle = RED; g.lineWidth = 4 * S; g.lineCap = 'round';   // an ink arrow to the cut
    g.beginPath(); g.moveTo(548 * S, 806 * S); g.quadraticCurveTo(575 * S, 818 * S, 596 * S, 806 * S); g.stroke();
    g.beginPath(); g.moveTo(582 * S, 796 * S); g.lineTo(598 * S, 805 * S); g.lineTo(584 * S, 818 * S); g.stroke(); g.restore();
  }
  if (la > 0) {
    T.push(mlabel(lab.noi, 470, 546, 34, { a: la })); T.push(mlabel(lab.yai, 450, 1152, 34, { a: la }));
    T.push(mlabel(lab.river, 770, 330, 36, { align: 'left', a: la }));
  }
  if (mo === 0 && dIn > 0.6) T.push(mlabel(lab.old, 180, 840, 34, { rot: -Math.PI / 2, a: ease((dIn - 0.6) / 0.4) }));
  for (const p of m.pins) {
    const tp = at(p.at); if (t < tp) continue;
    const [x, y, side] = MAP.pins[p.id], sc = back((t - tp) / 0.25), big = p.id === 'watarun' || p.id === 'palace';
    landmark(p.id, x, y, big, sc * (big ? 1.25 : 1));
    T.push(mlabel(p[L], x + (side === 'R' ? 30 : -30), y, big ? 46 : 36, { align: side === 'R' ? 'left' : 'right', col: big ? RED : INK, sc }));
  }
  g.restore();
  // frame, compass rose, legend: fixed on the page
  g.save(); g.strokeStyle = INK; g.globalAlpha = 0.75; g.lineWidth = 5 * S; g.strokeRect(34 * S, 34 * S, W - 68 * S, H - 68 * S);
  g.lineWidth = 1.6 * S; g.strokeRect(48 * S, 48 * S, W - 96 * S, H - 96 * S); g.restore();
  const tb = g.createLinearGradient(0, 0, 0, 330 * S); tb.addColorStop(0, 'rgba(40,22,5,0.55)'); tb.addColorStop(1, 'rgba(40,22,5,0)'); g.fillStyle = tb; g.fillRect(0, 0, W, 330 * S);
  const cb = g.createLinearGradient(0, 1380 * S, 0, 1590 * S);   // a darker band of paper under the captions
  cb.addColorStop(0, 'rgba(40,22,5,0)'); cb.addColorStop(0.5, 'rgba(40,22,5,0.32)'); cb.addColorStop(1, 'rgba(40,22,5,0)'); g.fillStyle = cb; g.fillRect(0, 1380 * S, W, 210 * S);
  const ln = ease((t - tf - 1.4) / 0.4);
  rose(935, 1200, 70, ease(u / 1.2) * 0.85);
  T.push(mlabel('N', 935, 1105, 30, { a: ease(u / 1.2) }));
  if (ln > 0) {
    g.save(); g.globalAlpha = ln; g.lineCap = 'round';
    g.strokeStyle = RED; g.lineWidth = 12 * S; g.beginPath(); g.moveTo(90 * S, 1612 * S); g.lineTo(170 * S, 1612 * S); g.stroke();
    g.strokeStyle = INK; g.lineWidth = 13 * S; g.beginPath(); g.moveTo(90 * S, 1684 * S); g.lineTo(170 * S, 1684 * S); g.stroke();
    g.strokeStyle = WATER; g.lineWidth = 7 * S; g.beginPath(); g.moveTo(90 * S, 1684 * S); g.lineTo(170 * S, 1684 * S); g.stroke(); g.restore();
    T.push(mlabel(lab.leg1, 196, 1612, 36, { align: 'left', a: ln }));
    T.push(mlabel(lab.leg2, 196, 1684, 36, { align: 'left', a: ln }));
    T.push(mlabel(lab.note, 90, 1752, 28, { align: 'left', col: 'rgba(59,38,20,0.7)', a: ln }));
  }
  CAM = { sh: { x: 0, y: 0 }, sc: 1, fx: 0.5, fy: 0.5, iw: W, ih: H };
  for (const e of T) TEXTS.push({ id: 'map' + e.text, ...e });
  if (u < 0.1) { g.fillStyle = `rgba(255,255,255,${0.5 * (1 - u / 0.1)})`; g.fillRect(0, 0, W, H); }
}

// paper grain for the archive photo: a fixed speckle tile, shifted a little each frame like old film
const GRAIN = (() => { const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d'), d = x.createImageData(256, 256);
  for (let i = 0; i < d.data.length; i += 4) { const v = 128 + (hash(i * 0.37) - 0.5) * 140; d.data[i] = v; d.data[i + 1] = v * 0.95; d.data[i + 2] = v * 0.85; d.data[i + 3] = 34; }
  x.putImageData(d, 0, 0); return c; })();
function archiveLook(t) {
  g.save(); g.fillStyle = g.createPattern(GRAIN, 'repeat'); const o = Math.floor(t * 24) % 8;
  g.translate(o * 31, o * 17); g.fillRect(-300, -300, W + 600, H + 600); g.restore();
  const v = g.createRadialGradient(W / 2, H / 2, H * 0.25, W / 2, H / 2, H * 0.7);
  v.addColorStop(0, 'rgba(40,25,10,0)'); v.addColorStop(1, 'rgba(40,25,10,0.55)'); g.fillStyle = v; g.fillRect(0, 0, W, H);
  if (hash(Math.floor(t * 24)) > 0.85) { g.fillStyle = 'rgba(255,240,210,0.05)'; g.fillRect(0, 0, W, H); }   // exposure flicker
}

// the "from the future" jump: the frame tears into slices and colour fringes for a moment
function glitch(k) {   // k: 1 → 0 over the glitch
  const snap = document.createElement('canvas'); snap.width = W; snap.height = H; snap.getContext('2d').drawImage(cv, 0, 0);
  const n = 9;
  for (let i = 0; i < n; i++) {
    const y = Math.floor(hash(i * 3.1 + k * 7) * H), h = Math.floor((20 + hash(i * 1.7 + k) * 140) * S), dx = (hash(i * 9.3 + k * 3) - 0.5) * 160 * S * k;
    g.drawImage(snap, 0, y, W, h, dx, y, W, h);
  }
  g.save(); g.globalCompositeOperation = 'screen'; g.globalAlpha = 0.35 * k;
  g.filter = 'hue-rotate(160deg)'; g.drawImage(snap, 14 * S * k, 0); g.filter = 'none'; g.restore();
  g.fillStyle = `rgba(0,0,0,${0.25 * k})`; for (let y = 0; y < H; y += 6 * S) g.fillRect(0, y, W, 2 * S);
}
const futureOn = (t, s) => s.future && t >= s.future.t;

function vignette() {
  const v = g.createRadialGradient(W / 2, H * 0.48, H * 0.3, W / 2, H * 0.5, H * 0.75);
  v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.38)'); g.fillStyle = v; g.fillRect(0, 0, W, H);
  const b = g.createLinearGradient(0, 0, 0, 330 * S); b.addColorStop(0, 'rgba(0,0,0,0.38)'); b.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = b; g.fillRect(0, 0, W, 330 * S);
}

function ui(t, s) {
  const y = 175 * S, alarm = s.alarm && t - s.t0 < 2.5, fut = futureOn(t, s), year = fut && s.future.year;
  if (s.clock) {
    if (alarm || Math.floor(t * 1.6) % 2 === 0) { g.fillStyle = '#ff3b30'; g.beginPath(); g.arc(78 * S, y - 16 * S, 13 * S, 0, 7); g.fill(); }
    outlined('DAY 1', 104 * S, y, 46 * S, { align: 'left', sw: 0.12, stroke: 'rgba(0,0,0,.6)' });
    outlined(s.clock, W - 64 * S, y, 46 * S, { align: 'right', sw: 0.12, stroke: 'rgba(0,0,0,.6)', fill: alarm ? '#ff6b5e' : '#fff' });
  }
  const py = y + 62 * S, px = 78 * S;
  g.fillStyle = year ? '#FFE14D' : '#fff'; g.beginPath(); g.arc(px, py - 18 * S, 11 * S, Math.PI, 0); g.lineTo(px, py + 2 * S); g.closePath(); g.fill();
  g.fillStyle = '#222'; g.beginPath(); g.arc(px, py - 18 * S, 4.5 * S, 0, 7); g.fill();
  // the date under the pin: Giza 2560 BC, until a fact from the future rewrites it
  outlined(year || TL.place, 100 * S, py, (year ? 38 : 34) * S, { align: 'left', weight: year ? 900 : 600, sw: 0.14, stroke: 'rgba(0,0,0,.65)', fill: year ? '#FFE14D' : '#fff' });
  if (fut) {   // the yellow "from the future" tag
    const p = back((t - s.future.t) / 0.25), size = 34 * S, ty = py + 62 * S;
    g.font = `900 ${size}px Kanit`; const tw = g.measureText(s.future.tag).width, w = tw + 92 * S, h = 56 * S;
    g.save(); g.translate(60 * S, ty); g.scale(p, p);
    g.fillStyle = '#FFE14D'; g.beginPath(); g.roundRect(0, -h / 2, w, h, 12 * S); g.fill();
    g.fillStyle = '#141414';
    for (const ox of [18, 36]) { g.beginPath(); g.moveTo((ox) * S, -13 * S); g.lineTo((ox + 16) * S, 0); g.lineTo(ox * S, 13 * S); g.closePath(); g.fill(); }   // ▶▶
    g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText(s.future.tag, 66 * S, 2 * S); g.restore();
    TEXTS.push({ id: 'future' + s.id, text: s.future.tag, x0: 60 * S, y0: ty - h / 2, x1: 60 * S + w, y1: ty + h / 2 });
  }
}

function endcard(t, s) {
  const e = s.endcard; if (!e || t < e.t) return;
  const p = back((t - e.t) / 0.3), size = fit(e.lines, 68 * S, 860 * S), lh = size * 1.25;
  g.font = `900 ${size}px Kanit`; const w = Math.max(...e.lines.map(l => g.measureText(l).width)) + 80 * S, bh = lh * e.lines.length + 44 * S, cy = H * 0.62;
  g.save(); g.translate(W / 2, cy); g.rotate(0.02); g.scale(p, p);
  g.fillStyle = '#FFE14D'; g.beginPath(); g.roundRect(-w / 2, -bh / 2, w, bh, 24 * S); g.fill();
  g.lineWidth = 6 * S; g.strokeStyle = '#141414'; g.stroke();
  g.fillStyle = '#141414'; g.textAlign = 'center'; g.textBaseline = 'middle';
  e.lines.forEach((ln, j) => g.fillText(ln, 0, -bh / 2 + 22 * S + lh * (j + 0.5)));
  g.restore();
  TEXTS.push({ id: 'end', text: e.lines.join(' '), x0: W / 2 - w / 2, y0: cy - bh / 2, x1: W / 2 + w / 2, y1: cy + bh / 2 });
}

function hook(t) {   // the opening banner: black text on a white card, like a short-video title
  const h = TL.hook; if (t < h.t0 || t >= h.t1) return;
  const p = back((t - h.t0) / 0.25), out = 1 - ease((t - (h.t1 - 0.2)) / 0.2);
  const size = fit(h.lines, 70 * S, 860 * S), lh = size * 1.25, w = Math.max(...h.lines.map(l => { g.font = `900 ${size}px Kanit`; return g.measureText(l).width; })) + 70 * S;
  const bh = lh * h.lines.length + 40 * S, cy = H * 0.47;   // on the chest, between the face and the captions
  g.save(); g.globalAlpha = out; g.translate(W / 2, cy); g.rotate(-0.025); g.scale(p, p);
  g.fillStyle = '#fff'; g.beginPath(); g.roundRect(-w / 2, -bh / 2, w, bh, 22 * S); g.fill();
  g.fillStyle = '#111'; g.font = `900 ${size}px Kanit`; g.textAlign = 'center'; g.textBaseline = 'middle';
  h.lines.forEach((ln, j) => g.fillText(ln, 0, -bh / 2 + 20 * S + lh * (j + 0.5)));
  g.restore();
  TEXTS.push({ id: 'hook', text: h.lines.join(' '), x0: W / 2 - w / 2, y0: cy - bh / 2, x1: W / 2 + w / 2, y1: cy + bh / 2 });
}

// caption looks: A = the first cut (Kanit Black, thick outline, pop); B/C/D = quieter options that sit in the picture
const CAPS = {
  B: { w: 600, size: 50, y: 0.775, blur: 14, stroke: 0, alpha: 1, rise: 8, dbl: true }, // Kanit SemiBold 50, soft shadow only, low in the frame
  C: { w: 700, size: 64, y: 0.69, blur: 10, stroke: 0.07, alpha: 1, rise: 0 },        // Kanit Bold, thin soft outline + shadow
  D: { w: 500, size: 56, y: 0.72, blur: 18, stroke: 0, alpha: 0.88, rise: 8 },        // Kanit Medium, soft shadow, slightly see-through
};
const CAP = q.get('cap') || TL.cap || 'B';
function captions(t) {
  const c = TL.caps.find(c => t >= c.t0 && t < c.t1); if (!c) return;
  const k = CAPS[CAP];
  if (k) {
    const fade = ease((t - c.t0) / 0.14), size = fit(c.lines, (L === 'th' ? k.size : k.size - 4) * S, 920 * S, 'Kanit', k.w), lh = size * 1.28;
    const y0 = H * k.y - (c.lines.length - 1) * lh / 2;
    g.save(); g.globalAlpha = k.alpha * fade; g.translate(W / 2, y0 + (1 - fade) * k.rise * S);
    g.font = `${k.w} ${size}px Kanit`; g.textAlign = 'center'; g.textBaseline = 'alphabetic'; g.lineJoin = 'round';
    c.lines.forEach((ln, j) => {
      g.shadowColor = 'rgba(0,0,0,0.75)'; g.shadowBlur = k.blur * S; g.shadowOffsetY = 2 * S;
      if (k.stroke) { g.lineWidth = size * k.stroke; g.strokeStyle = 'rgba(15,15,15,0.55)'; g.strokeText(ln, 0, j * lh); }
      g.fillStyle = '#fff'; g.fillText(ln, 0, j * lh); if (k.dbl) { g.shadowBlur = 4 * S; g.shadowColor = 'rgba(0,0,0,0.6)'; g.fillText(ln, 0, j * lh); } g.shadowBlur = 0; g.fillText(ln, 0, j * lh);
    });
    g.restore();
    TEXTS.push({ id: 'cap' + c.t0, pass: true, text: c.lines.join(' '), x0: 70 * S, y0: y0 - size, x1: W - 70 * S, y1: y0 + (c.lines.length - 1) * lh + size * 0.3 });
    return;
  }
  const pop = back((t - c.t0) / 0.16), size = fit(c.lines, (L === 'th' ? 78 : 72) * S, 940 * S), lh = size * 1.18;
  const y0 = H * 0.665 - (c.lines.length - 1) * lh / 2;
  g.save(); g.translate(W / 2, y0); g.scale(lerp(0.8, 1, pop), lerp(0.8, 1, pop));
  c.lines.forEach((ln, j) => outlined(ln, 0, j * lh, size, { sw: 0.2, stroke: '#141414' }));
  g.restore();
  // captions are the voice's own subtitles, on screen exactly while it speaks: timed by the voice (and the .srt), not by reading speed
  TEXTS.push({ id: 'cap' + c.t0, pass: true, text: c.lines.join(' '), x0: 70 * S, y0: y0 - size, x1: W - 70 * S, y1: y0 + (c.lines.length - 1) * lh + size * 0.3 });
}

function arrow(sx, sy, tx, ty, d) {
  const cx = (sx + tx) / 2 + (ty - sy) * 0.25, cy = (sy + ty) / 2 - (tx - sx) * 0.25;
  const pt = k => [(1 - k) ** 2 * sx + 2 * (1 - k) * k * cx + k * k * tx, (1 - k) ** 2 * sy + 2 * (1 - k) * k * cy + k * k * ty];
  g.lineCap = 'round'; g.lineJoin = 'round';
  for (const [w, col] of [[16 * S, '#141414'], [8 * S, '#FFE14D']]) {
    g.strokeStyle = col; g.lineWidth = w; g.beginPath(); g.moveTo(sx, sy);
    for (let k = 0.05; k <= d + 1e-6; k += 0.05) g.lineTo(...pt(k)); g.stroke();
    if (d >= 1) { const [ex, ey] = pt(1), [bx, by] = pt(0.88), a = Math.atan2(ey - by, ex - bx);
      g.beginPath(); g.moveTo(ex - 34 * S * Math.cos(a - 0.5), ey - 34 * S * Math.sin(a - 0.5)); g.lineTo(ex, ey);
      g.lineTo(ex - 34 * S * Math.cos(a + 0.5), ey - 34 * S * Math.sin(a + 0.5)); g.stroke(); }
  }
}

function stickers(t, s) {
  for (const k of s.stickers) {
    if (t < k.t) continue;
    const p = back((t - k.t) / 0.2), [ax, ay] = toScreen(...k.pos), [tx, ty] = k.to ? toScreen(...k.to) : [ax, ay + 1];
    const size = fit([k.text], 62 * S, 560 * S, 'Mali', 700);
    g.font = `700 ${size}px Mali`; const tw = g.measureText(k.text).width;
    const ux = Math.cos(Math.atan2(ty - ay, tx - ax)), uy = Math.sin(Math.atan2(ty - ay, tx - ax));
    const d = clamp((t - k.t - 0.1) / 0.25, 0, 1);
    if (d > 0 && k.to) arrow(ax + ux * (tw / 2 + 10 * S), ay + uy * 40 * S, tx - ux * 20 * S, ty - uy * 20 * S, d);
    g.save(); g.translate(ax, ay); g.rotate(k.rot * Math.PI / 180); g.scale(p, p);
    outlined(k.text, 0, size * 0.35, size, { font: 'Mali', weight: 700, fill: '#FFE14D', stroke: '#141414', sw: 0.2 });
    g.restore();
    TEXTS.push({ id: 'st' + k.t, text: k.text, x0: ax - tw / 2, y0: ay - size, x1: ax + tw / 2, y1: ay + size * 0.5 });
  }
}

function box(t, s) {
  const b = s.box; if (!b || t < b.t) return;
  const p = ease((t - b.t) / 0.2), [x0, y0] = toScreen(b.rect[0], b.rect[1]), [x1, y1] = toScreen(b.rect[2], b.rect[3]);
  g.save(); g.globalAlpha = p; g.lineJoin = 'round';
  for (const [w, col] of [[16 * S, '#141414'], [8 * S, '#FFE14D']]) {
    g.strokeStyle = col; g.lineWidth = w; g.beginPath();
    g.moveTo(x0 + 6 * S, y0); g.lineTo(x1, y0 + 5 * S); g.lineTo(x1 - 4 * S, y1); g.lineTo(x0, y1 - 6 * S); g.closePath(); g.stroke();
  }
  const sc = lerp(0.6, 1, back((t - b.t) / 0.2));
  g.translate(x1 - 10 * S, y0 - 24 * S); g.rotate(-0.06); g.scale(sc, sc);
  outlined(b.text, 0, 0, 64 * S, { font: 'Mali', weight: 700, fill: '#FFE14D', stroke: '#141414', sw: 0.2, align: 'right' });
  g.restore();
  TEXTS.push({ id: 'box', text: b.text, x0: x0, y0: y0 - 90 * S, x1: x1, y1: y0 });
}

// the channel's watermark: small, white, see-through, top right under the clock (clear of the Shorts buttons)
function watermark() {
  g.save(); g.globalAlpha = 0.72; g.font = `600 ${30 * S}px Kanit`; g.textAlign = 'right'; g.textBaseline = 'alphabetic';
  g.shadowColor = 'rgba(0,0,0,0.85)'; g.shadowBlur = 8 * S; g.fillStyle = '#fff';
  g.fillText(TL.watermark || 'samaichanvlogs', W - 64 * S, 237 * S); g.restore();
}

window.render = t => {
  TEXTS = [];
  g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
  const s = shotAt(t);
  if (s.map) drawMap(t, s); else { drawShot(t, s); vignette(); } box(t, s); stickers(t, s); ui(t, s); hook(t);
  if (!(s.endcard && t >= s.endcard.t)) captions(t);
  endcard(t, s);
  watermark();
  if (s.future && t >= s.future.t && t < s.future.t + 0.4) glitch(1 - (t - s.future.t) / 0.4);
};
window.TEXTS = t => { window.render(t); return TEXTS; };
