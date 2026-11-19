// POV vlog from the past: generated stills + a handheld phone camera, jump cuts, vlog UI, stickers and captions, all in code.
// ?lang=th|en picks timeline.<lang>.json (built by tools/timeline.py from shots.json and that language's voice).
const q = new URLSearchParams(location.search);
const L = q.get('lang') === 'en' ? 'en' : 'th';
const TL = await (await fetch(`timeline.${L}.json`)).json();
const cv = document.getElementById('c'), W = cv.width = innerWidth, H = cv.height = innerHeight, g = cv.getContext('2d');
const S = W / 1080;   // layout is written for 1080 wide

const load = src => new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => no(new Error('missing ' + src)); i.src = src; });
const IMG = {};
await Promise.all([...new Set(TL.shots.map(s => s.img))].map(async n => { IMG[n] = await load(`images/${n}.${TL.img_ext || 'png'}`); }));
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

function captions(t) {
  const c = TL.caps.find(c => t >= c.t0 && t < c.t1); if (!c) return;
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

window.render = t => {
  TEXTS = [];
  g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
  const s = shotAt(t);
  drawShot(t, s); vignette(); box(t, s); stickers(t, s); ui(t, s); hook(t);
  if (!(s.endcard && t >= s.endcard.t)) captions(t);
  endcard(t, s);
  if (s.future && t >= s.future.t && t < s.future.t + 0.4) glitch(1 - (t - s.future.t) / 0.4);
};
window.TEXTS = t => { window.render(t); return TEXTS; };
