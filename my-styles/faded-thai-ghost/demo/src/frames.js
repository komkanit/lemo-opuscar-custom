// Style frames: ?frame=caption (the house at night, the woman listening, a caption) or ?frame=title
import { Film, W, H, flicker, weave } from './engine.js';
import { caption, horrorTitle, CAP, TITLE2 } from './text.js';

const q = new URLSearchParams(location.search);
const which = q.get('frame') || 'caption';
// type tests: ?cf=Family&cw=600&cbw=700&cs=74&cc=%23F6EFE0  ·  ?tf=Family&tw=700
if (q.get('cf')) { const cs = q.get('cs') || 74; CAP.font = `${q.get('cw') || 600} ${cs}px ${q.get('cf')}`; CAP.bold = `${q.get('cbw') || 700} ${cs}px ${q.get('cf')}`; }
if (q.get('cc')) CAP.color = q.get('cc');
if (q.get('ce')) CAP.edgeW = +q.get('ce');
const gl = document.getElementById('gl'), cap = document.getElementById('cap');
cap.width = W; cap.height = H;
const film = new Film(gl);
await film.load('house', 'img/house.png');
await film.load('woman', 'img/woman.png');

// woman: source crop offset (96,594), 821×911, scale 0.8; her hand (src 110,1440) lands at plate (250,1800)
const S = .8, HAND = [250, 1800];
const rect = [HAND[0] + (96 - 110) * S, HAND[1] + (594 - 1440) * S, 821 * S, 911 * S];
const LAMP = { x: 93, y: 1650 };

if (which === 'title') {
  if (q.get('tf')) { TITLE2.family = q.get('tf'); TITLE2.weight = q.get('tw') || 700; }
  if (q.get('ts')) TITLE2.size = +q.get('ts');
  film.updateText(horrorTitle(document.createElement('canvas'), 'มุ้งขาว', q.get('en') === '0' ? '' : 'The White Net', { y: H * .22 }));
}

window.DUR = 6;
let texts = [];
window.render = (t) => {
  const frame = Math.round(t * 24), dmg = .45;
  const wv = weave(frame, dmg);
  const push = t / window.DUR;
  const cam = which === 'title' ? [621, 1104 - 40 * push, .87 + .03 * push] : [600, 1250 - 30 * push, .93 + .04 * push];
  film.draw({
    plate: 'house', cam, cam0: [600, 1250, .93],
    figs: which === 'title' ? [] : [{ tex: 'woman', rect, k: 1.18, breath: 1 + .004 * Math.sin(t * 2 * Math.PI * .25), pivot: [560, 1845],
      shadow: [600, 1850, 360, 46, .55] }],
    lamp: { ...LAMP, on: 1, flick: flicker(t, .5), flame: 1, r: 650 },
    fogBack: .9, fogFront: .5, t, frame, dmg, weave: wv, text: which === 'title' ? 1 : 0,
  });
  const ctx = cap.getContext('2d');
  ctx.clearRect(0, 0, W, H);
  texts = [];
  if (which === 'caption') {
    const b = caption(ctx, 'คืนนั้น… *มุ้ง*ขยับทั้งที่ไม่มีลม', 1, wv);
    if (b) texts.push({ id: 'cap', text: 'คืนนั้น… มุ้งขยับทั้งที่ไม่มีลม', ...b });
  }
};
window.TEXTS = () => texts;
