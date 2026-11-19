// มุ้งขาว · The White Net: the 24 s demo film of "Faded Thai Ghost Film" (TREATMENT.md)
import { Film, W, H, flicker, weave, noise1 } from './engine.js';
import { caption, horrorTitle } from './text.js';

const gl = document.getElementById('gl'), cap = document.getElementById('cap');
cap.width = W; cap.height = H;
const film = new Film(gl);
await film.load('house', 'img/house.png');
await film.load('houseB', 'img/house-ghost.png');
await film.load('mask', 'img/ghost-mask.png');
await film.load('woman', 'img/woman.png');
film.updateText(horrorTitle(document.createElement('canvas'), 'มุ้งขาว', 'The White Net', { y: H * .22 }));

window.DUR = 24;
const FPS = 24;
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const seg = (t, a, b) => clamp((t - a) / (b - a));
const ease = (x) => x * x * (3 - 2 * x);
const lerp = (a, b, k) => a + (b - a) * k;
const lerp3 = (a, b, k) => a.map((v, i) => lerp(v, b[i], k));

// placement (plate px): the woman's hand (src 110,1440) at (250,1800), scale 0.8; crop offset (96,594), 821×911
const S = .8, HAND = [250, 1800];
const WOMAN = { tex: 'woman', rect: [HAND[0] + (96 - 110) * S, HAND[1] + (594 - 1440) * S, 821 * S, 911 * S], k: 1.18,
  pivot: [560, 1845], shadow: [600, 1850, 360, 46, .55] };
const LAMP = [93, 1650];
const NET = [800, 820, 1242, 1790];       // the mosquito net in the plate

// shots
const C1a = [621, 1104, .87], C1b = [621, 1070, .9];
const C2 = [640, 1140, .9];               // locked: shots 2, 4 and 5 (same shot twice)
const C3a = [790, 1290, 1.22], C3b = [830, 1262, 1.32];
const SHOTS = [0, 4.5, 10.5, 15.0, 16.6, 24];
const CAPS = [
  { id: 'c1', t0: 5.1, t1: 8.8, text: 'คืนนั้น… *มุ้ง*ขยับทั้งที่ไม่มีลม' },
  { id: 'c2', t0: 11.0, t1: 14.7, text: 'ไม่มีใครอยู่ในห้องนั้น… *นอกจากเธอ*' },
];
// ?v=tonce|hammy: the narrated version. Lines start at voice/starts.json; each caption follows its line,
// and a third line comes after the viewer has found the figure in the net.
const VQ = new URLSearchParams(location.search).get('v');
if (VQ) {
  const starts = await (await fetch('voice/starts.json')).json();
  const dur = await (await fetch(`voice/${VQ}/dur.json`)).json();
  CAPS.push({ id: 'c3', text: 'บางคืน… *มุ้ง*ก็ไม่ได้กางไว้ให้คนเป็น' });
  ['n1', 'n2', 'n3'].forEach((n, i) => {
    const c = CAPS[i]; c.t0 = starts[n] - .1; c.t1 = Math.max(starts[n] + dur[n] + .5, c.t0 + 3.9);
  });
}
const TITLE = [0.6, 4.0];

let texts = [];
window.render = (t) => {
  const frame = Math.round(t * FPS);
  const shot = SHOTS.findIndex((s, i) => t >= s && t < SHOTS[i + 1]) + 1 || 5;
  let cam = C2, figs = [WOMAN], ragged = .3, dmg = .3, on = 1, flame = 1, sway = 0, B = null, fogB = .9, fogF = .5, text = 0;
  const breath = 1 + .004 * Math.sin(t * 2 * Math.PI * .25);

  if (shot === 1) {
    cam = lerp3(C1a, C1b, ease(seg(t, 0, 4.5))); figs = []; ragged = .15; dmg = .3;
    text = ease(seg(t, TITLE[0], TITLE[0] + .8)) * (1 - ease(seg(t, TITLE[1] - .6, TITLE[1])));
  } else if (shot === 2) {
    ragged = .3; dmg = .35;
  } else if (shot === 3) {
    cam = lerp3(C3a, C3b, ease(seg(t, 10.5, 15))); ragged = .55 + .4 * seg(t, 12, 15); dmg = .5;
    sway = 7 * ease(seg(t, 10.8, 12.2));
  } else if (shot === 4) {
    ragged = 1; dmg = .55; sway = 4 * (1 - seg(t, 15, 15.8));
    const k = seg(t, 15.05, 15.85);                     // the flame shrinks, gutters, dies
    flame = 1 - ease(k) * .9;
    on = k < 1 ? clamp(1 - k * k + (noise1(t * 30) - .5) * .5 * k) : 0;
  } else {
    dmg = lerp(.6, .75, seg(t, 16.6, 24)); B = { tex: 'houseB', mask: 'mask', on: 1, pale: .75 };
    const k = seg(t, 16.6, 17.5);                       // relights low and ragged, then steadies
    on = ease(k) * (k < 1 ? .55 + .45 * noise1(t * 22) : 1);
    flame = .3 + .7 * ease(seg(t, 16.6, 18.2));
    ragged = lerp(1, .35, seg(t, 17.5, 20));
    const end = seg(t, 23.0, 24);                       // last second: the lamp dims to dark
    on *= 1 - ease(end); flame *= 1 - .7 * end;
  }

  const wv = weave(frame, dmg);
  film.draw({
    plate: 'house', cam, cam0: shot === 3 ? C3a : cam,
    figs: figs.map(f => ({ ...f, breath })), plateB: B,
    sway: { rect: NET, amp: sway },
    lamp: { x: LAMP[0], y: LAMP[1], on, flick: flicker(t, ragged), flame, r: 650 },
    fogBack: fogB, fogFront: fogF, t, frame, dmg, weave: wv, text, expo: 1,
  });

  const ctx = cap.getContext('2d');
  ctx.clearRect(0, 0, W, H);
  texts = [];
  for (const c of CAPS) {
    if (t < c.t0 || t >= c.t1) continue;
    const a = Math.min(seg(t, c.t0, c.t0 + 3 / FPS), 1 - seg(t, c.t1 - 3 / FPS, c.t1));
    const b = caption(ctx, c.text, a, wv);
    if (b) texts.push({ id: c.id, text: c.text.replace(/\*/g, ''), ...b });
  }
  if (t >= TITLE[0] && t < TITLE[1]) {
    texts.push({ id: 'title', text: 'มุ้งขาว', x0: 300, y0: 230, x1: 780, y1: 450 });
    texts.push({ id: 'title-en', text: 'THE WHITE NET', x0: 300, y0: 490, x1: 780, y1: 560 });
  }
};
window.TEXTS = () => texts;
