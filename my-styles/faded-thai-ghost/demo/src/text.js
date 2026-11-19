// Lettering: phrase captions in screen space (sharp, above the print) and the horror-poster title (on the print).
import { W, H } from './engine.js';

export const CAP = { font: '600 56px Kanit', bold: '900 56px Kanit', y: Math.round(H * .70), color: '#F6EFE0', edge: '#140C08', edgeW: 0 };

// draw one caption phrase; a word wrapped in *stars* is set in Kanit Black. Returns its box for TEXTS().
export function caption(ctx, text, alpha = 1, wv = [0, 0]) {
  if (!text || alpha <= 0) return null;
  const parts = text.split(/(\*[^*]+\*)/).filter(Boolean).map(s => s.startsWith('*') ? { s: s.slice(1, -1), b: 1 } : { s, b: 0 });
  ctx.save();
  ctx.globalAlpha = alpha;
  let total = 0;
  for (const p of parts) { ctx.font = p.b ? CAP.bold : CAP.font; p.w = ctx.measureText(p.s).width; total += p.w; }
  let x = W / 2 - total / 2 + wv[0];
  const y = CAP.y + wv[1];
  ctx.textBaseline = 'alphabetic'; ctx.lineJoin = 'round';
  for (const pass of ['shadow', 'edge', 'fill']) {
    let px = x;
    for (const p of parts) {
      ctx.font = p.b ? CAP.bold : CAP.font;
      if (pass === 'shadow') { ctx.shadowColor = 'rgba(10,6,4,.75)'; ctx.shadowBlur = 18; ctx.shadowOffsetY = 3; ctx.fillStyle = CAP.edge; ctx.fillText(p.s, px, y); }
      if (pass === 'edge') { ctx.shadowColor = 'transparent'; ctx.strokeStyle = CAP.edge; if (CAP.edgeW > 0) { ctx.lineWidth = CAP.edgeW; ctx.strokeText(p.s, px, y); } }
      if (pass === 'fill') { ctx.fillStyle = CAP.color; ctx.fillText(p.s, px, y); }
      px += p.w;
    }
  }
  ctx.restore();
  return { x0: x - 10, y0: y - 62, x1: x + total + 10, y1: y + 24 };
}

// the horror-poster title: loopless Thai letters in worn silver-white, eaten by grain and scratches,
// a soft black shadow, and an optional small red English line spaced out underneath
export const TITLE2 = { family: 'Prompt', weight: 600, size: 185, en: 'Trirong', enWeight: 700, red: '#B3201A', track: 0 };
export function horrorTitle(canvas, th, en, { y = H * .2, seed = 7 } = {}) {
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, W, H);
  const T = TITLE2, s = T.size;
  // the letters on their own canvas, so the wear only eats the letters
  const L = document.createElement('canvas'); L.width = W; L.height = H;
  const l = L.getContext('2d');
  l.textAlign = 'center'; l.textBaseline = 'alphabetic';
  l.font = `${T.weight} ${s}px "${T.family}"`;
  if (T.track) l.letterSpacing = `${T.track}px`;
  const g = l.createLinearGradient(0, y - s * .9, 0, y + s * .15);
  g.addColorStop(0, '#FBFAF7'); g.addColorStop(.55, '#E4E1DB'); g.addColorStop(1, '#A9A49C');
  l.fillStyle = g; l.fillText(th, W / 2, y);
  // wear: speckles and short horizontal scrapes cut out of the letters (deterministic)
  let r = seed * 9301 + 49297; const rnd = () => ((r = (r * 9301 + 49297) % 233280) / 233280);
  l.globalCompositeOperation = 'destination-out';
  const x0 = W / 2 - l.measureText(th).width / 2 - 20, x1 = W - x0;
  for (let i = 0; i < 7000; i++) {
    const x = x0 + rnd() * (x1 - x0), yy = y - s + rnd() * s * 1.3, rr = Math.pow(rnd(), 4) * 1.5 + .35;
    l.globalAlpha = .25 + rnd() * .6; l.beginPath(); l.arc(x, yy, rr, 0, 7); l.fill();
  }
  for (let i = 0; i < 14; i++) {
    const x = x0 + rnd() * (x1 - x0), yy = y - s + rnd() * s * 1.3;
    l.globalAlpha = .9; l.beginPath(); l.arc(x, yy, 1.5 + rnd() * 2.2, 0, 7); l.fill();
  }
  for (let i = 0; i < 40; i++) {
    const x = x0 + rnd() * (x1 - x0), yy = y - s + rnd() * s * 1.3;
    l.globalAlpha = .4 + rnd() * .5; l.fillRect(x, yy, 6 + rnd() * 50, .6 + rnd() * 1.1);
  }
  l.globalCompositeOperation = 'source-over'; l.globalAlpha = 1;
  // shadow under, then the worn letters
  ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.85)'; ctx.shadowBlur = s * .22; ctx.shadowOffsetY = s * .04;
  ctx.drawImage(L, 0, 0); ctx.restore();
  ctx.drawImage(L, 0, 0);
  if (en) {
    ctx.textAlign = 'center'; ctx.font = `${T.enWeight} ${Math.round(s * .2)}px "${T.en}"`;
    ctx.letterSpacing = `${Math.round(s * .09)}px`;
    ctx.shadowColor = 'rgba(0,0,0,.8)'; ctx.shadowBlur = 10;
    ctx.fillStyle = T.red; ctx.fillText(en.toUpperCase(), W / 2 + s * .045, y + s * .62);
  }
  return canvas;
}

// place-and-time stamp, lower left, in screen space
export function stamp(ctx, text, alpha = 1, wv = [0, 0]) {
  if (!text || alpha <= 0) return null;
  ctx.save(); ctx.globalAlpha = alpha * .85;
  ctx.font = '600 34px Kanit'; ctx.fillStyle = '#F0E0BE'; ctx.shadowColor = 'rgba(0,0,0,.8)'; ctx.shadowBlur = 10;
  const x = 64 + wv[0], y = H * .80 + wv[1];
  ctx.fillText(text, x, y);
  const w = ctx.measureText(text).width;
  ctx.restore();
  return { x0: x, y0: y - 40, x1: x + w, y1: y + 12 };
}
