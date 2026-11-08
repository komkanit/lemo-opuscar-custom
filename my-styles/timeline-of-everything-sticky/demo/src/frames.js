// Style frames and cast sheet: ?frame=wipe|stop&lang=th|en, or ?sheet=1
import { INK, back } from './ink.js';
import { drawFigure, OUTFITS } from './figure.js';
import { ERAS, layout, makeView, drawEra, drawFront, eraLine, stonehenge, gobekli, tree, haulers } from './world.js';
import { dateCard, caption, callout } from './ui.js';

const q = new URLSearchParams(location.search);
const W = innerWidth, H = innerHeight;
const cv = document.getElementById('c'); cv.width = W; cv.height = H;
const ctx = cv.getContext('2d');
const mode = q.get('frame') ?? 'wipe';
let TEXTS = [];

const STR = {
  th: { date: 'ราว 2950 ปีก่อน ค.ศ.', title: 'สโตนเฮนจ์ · อังกฤษ', mile: '2950 ปีก่อน ค.ศ.',
        cap: 'หลายพันปีต่อมา ชาวนายุคหินในอังกฤษลากหินหนักเท่าช้างสี่ตัว มาตั้งเป็นวงกลม', call: 'สโตนเฮนจ์' },
  en: { date: 'c. 2950–2500 BCE', title: 'Stonehenge · England', mile: '2950 BCE',
        cap: 'Farmers hauled stones as heavy as four elephants, and stood them in a circle.', call: 'Stonehenge' },
};

const ANATOLIA = {
  seed: 3,
  clouds: [{ X: -30, y: 300, s: 42, drift: 4 }, { X: 40, y: 240, s: 34, drift: 3 }],
  back: [
    { k: 0.16, draw: (c, V, E) => tree(c, V, E, -40, 0.16, 'flat', 4) },
    { k: 0.22, draw: (c, V, E) => gobekli(c, V, E, -7, 0.22) },
  ],
};
const BRITAIN = {
  seed: 8,
  clouds: [{ X: 10, y: 270, s: 44, drift: 3 }, { X: 90, y: 330, s: 30, drift: 2 }, { X: 160, y: 250, s: 38, drift: 2 }],
  back: [
    { k: 0.2, draw: (c, V, E) => tree(c, V, E, 22, 0.2, 'round', 2) },
    { k: 0.22, draw: (c, V, E) => tree(c, V, E, 36, 0.22, 'round', 5) },
    { k: 0.3, draw: (c, V, E) => stonehenge(c, V, E, 9.0, 0.3) },
    { k: 0.55, draw: (c, V, E, t) => haulers(c, V, E, 0.1, 0.55, t * 0.5) },
  ],
};

const WALKER = { hair: 'bun', hairColor: '#4b3022', female: true };

function frameWipe(t, lang) {
  const L = layout(W, H);
  const V = makeView(L, 0.02);           // walker's hip on the road (m); era line at X = 0
  const lx = V.sx(0, 1);
  const S = STR[lang];
  drawEra(ctx, V, ERAS.anatolia, t, ANATOLIA, [0, lx]);
  drawEra(ctx, V, ERAS.britain, t, BRITAIN, [lx, W]);
  eraLine(ctx, V, lx, S.mile);
  const fig = { x: L.ax, gy: L.G, h: L.Hf, phase: 0.18, walk: true, look: 0.45, lw: 5.5 * L.u, ...WALKER, mood: 'smile' };
  for (const [clip, outfit] of [[[0, lx], OUTFITS.hide()], [[lx, W], OUTFITS.wool()]]) {
    ctx.save(); ctx.beginPath(); ctx.rect(clip[0], 0, clip[1] - clip[0], H); ctx.clip();
    drawFigure(ctx, { ...fig, outfit });
    ctx.restore();
  }
  drawFront(ctx, V, ERAS.anatolia, [0, lx]);
  drawFront(ctx, V, ERAS.britain, [lx, W]);
  dateCard(ctx, V, ERAS.britain, { date: S.date, title: S.title }, TEXTS);
  caption(ctx, V, S.cap, lang, TEXTS);
}

function frameStop(t, lang) {
  const L = layout(W, H);
  const V = makeView(L, 7.3);
  const S = STR[lang];
  drawEra(ctx, V, ERAS.britain, t, BRITAIN, null);
  drawFigure(ctx, { x: L.ax, gy: L.G, h: L.Hf, walk: false, front: true, look: 0.1, lw: 5.5 * L.u, ...WALKER, mood: 'wow', brows: 1,
    arms: [[1.95, -0.12], [-0.2, 0.1]], outfit: OUTFITS.wool() });
  drawFront(ctx, V, ERAS.britain, null);
  dateCard(ctx, V, ERAS.britain, { date: S.date, title: S.title }, TEXTS);
  const s = V.s(0.3), gy = V.gy(0.3);
  const tx = V.sx(9.0 + 1.6, 0.3), ty = gy - 4.95 * s;
  callout(ctx, V, S.call, tx, ty, tx - 40 * L.u, ty - 150 * L.u, back(1), TEXTS);
  caption(ctx, V, S.cap, lang, TEXTS);
}

function frameSheet() {
  ctx.fillStyle = '#f4efe4'; ctx.fillRect(0, 0, W, H);
  const u = H / 1080, h = 380 * u, gy = 760 * u;
  const cast = [
    { label: 'walker · hide', outfit: OUTFITS.hide(), ...WALKER, walk: true, phase: 0.1 },
    { label: 'walker · wool', outfit: OUTFITS.wool(), ...WALKER, walk: true, phase: 0.6 },
    { label: 'walker · linen', outfit: OUTFITS.linen(), ...WALKER, walk: true, phase: 0.35 },
    { label: 'walker · today', outfit: OUTFITS.modern(), ...WALKER, walk: false, front: true, look: 0, arms: [[2.4, 0.3], [-0.16, 0.08]], mood: 'wow' },
    { label: 'man · today', outfit: OUTFITS.modern({ tee: '#e2574c' }), hair: 'short', hairColor: '#2c211b', walk: true, phase: 0.8 },
    { label: 'woman · dress', outfit: OUTFITS.dress(), hair: 'long', hairColor: '#5b3a26', female: true, walk: false, front: true, look: 0 },
    { label: 'hunter · hide', outfit: OUTFITS.hide({ fill: '#c99a5e' }), hair: 'messy', hairColor: '#1f1a17', walk: false, front: true, look: 0, mood: 'neutral' },
    { label: 'elder · wool', outfit: OUTFITS.wool({ fill: '#7d6c58' }), hair: 'messy', hairColor: '#a7a39c', walk: false, front: true, look: -0.3, mood: 'smile' },
  ];
  ctx.strokeStyle = '#d6cdb9'; ctx.lineWidth = 3 * u; ctx.beginPath(); ctx.moveTo(40 * u, gy); ctx.lineTo(W - 40 * u, gy); ctx.stroke();
  cast.forEach((c, i) => {
    const x = (150 + i * 232) * u;
    drawFigure(ctx, { x, gy, h, lw: 5.5 * u * (h / (430 * u)), look: c.look ?? 0.45, mood: c.mood ?? 'smile', ...c });
    ctx.fillStyle = INK; ctx.font = `600 ${24 * u}px Mali`; ctx.textAlign = 'center'; ctx.fillText(c.label, x, gy + 70 * u);
  });
  ctx.font = `700 ${40 * u}px Mali`; ctx.textAlign = 'left'; ctx.fillText('Timeline of Everything · Sticky Figure — cast sheet', 60 * u, 90 * u);
  ctx.font = `500 ${28 * u}px Mali`; ctx.fillText('ตัวละครหัวกลม เส้นเดียว ชุดเปลี่ยนตามยุค · ผม/หน้าไม่เปลี่ยน', 60 * u, 140 * u);
}

window.DUR = 1;
window.render = (t) => {
  TEXTS = [];
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, W, H);
  const lang = q.get('lang') ?? 'th';
  if (q.get('sheet')) frameSheet();
  else if (mode === 'stop') frameStop(t, lang);
  else frameWipe(t, lang);
};
window.TEXTS = (t) => { window.render(t); return TEXTS; };
