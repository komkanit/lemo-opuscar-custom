// Date card (sky), caption box (ground), call-out tag. Mali for Thai and Latin.
import { INK, PAPER, rrect, stroke, circle } from './ink.js';
import { cloud } from './world.js';

const seg = (lang) => new Intl.Segmenter(lang === 'th' ? 'th' : 'en', { granularity: 'word' });

export function wrap(ctx, text, maxW, lang) {
  const parts = [...seg(lang).segment(text)].map(s => s.segment);
  const lines = []; let cur = '';
  for (const p of parts) {
    const next = cur + p;
    if (ctx.measureText(next.trim()).width > maxW && cur.trim()) { lines.push(cur.trim()); cur = p.trimStart(); }
    else cur = next;
  }
  if (cur.trim()) lines.push(cur.trim());
  return lines;
}

export function dateCard(ctx, V, E, { date, title }, texts) {
  const u = V.u, wide = V.wide;
  const f1 = (wide ? 50 : 60) * u, f2 = (wide ? 30 : 36) * u;
  ctx.font = `700 ${f1}px Mali`; const w1 = ctx.measureText(date).width;
  ctx.font = `600 ${f2}px Mali`; const w2 = ctx.measureText(title).width;
  const w = Math.max(w1, w2) + 90 * u, h = f1 * 1.25 + f2 * 1.35 + 30 * u;
  const cx = V.W / 2, y = wide ? 40 * u : 190 * u, x = cx - w / 2;
  cloud(ctx, x + w + 22 * u, y + h * 0.62, 46 * u, E, u);
  cloud(ctx, x - 6 * u, y + h * 0.3, 40 * u, E, u);
  rrect(ctx, x, y, w, h, 22 * u, { fill: PAPER, lw: 3.5 * u });
  ctx.fillStyle = INK; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  ctx.font = `700 ${f1}px Mali`; ctx.fillText(date, cx, y + 15 * u + f1 * 1.0);
  ctx.fillStyle = '#4a443d';
  ctx.font = `600 ${f2}px Mali`; ctx.fillText(title, cx, y + 15 * u + f1 * 1.25 + f2 * 1.05);
  texts?.push({ id: 'card', text: date + ' ' + title, x0: x, y0: y, x1: x + w, y1: y + h });
}

export function caption(ctx, V, text, lang, texts) {
  const u = V.u, wide = V.wide;
  const fs = (wide ? 40 : 44) * u, lh = fs * 1.42;
  const maxW = wide ? 1400 * u : 960 * u;
  ctx.font = `500 ${fs}px Mali`;
  let lines = wrap(ctx, text, maxW - 80 * u, lang);
  if (lines.length === 2) { // balance two lines
    for (let tw = maxW - 80 * u; tw > 200 * u; tw -= 10 * u) { const l = wrap(ctx, text, tw, lang); if (l.length > 2) break; lines = l; }
  }
  lines = lines.slice(0, 2);
  const tw = Math.max(...lines.map(l => ctx.measureText(l).width));
  const w = Math.min(maxW, tw + 80 * u), h = lines.length * lh + 34 * u;
  const cx = V.W / 2;
  const yb = wide ? 1045 * u : 1520 * u;
  const y = yb - h, x = cx - w / 2;
  ctx.save(); ctx.globalAlpha = 0.94; rrect(ctx, x, y, w, h, 24 * u, { fill: PAPER, line: null }); ctx.restore();
  rrect(ctx, x, y, w, h, 24 * u, { fill: null, lw: 3.5 * u });
  ctx.fillStyle = INK; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  lines.forEach((l, i) => ctx.fillText(l, cx, y + 17 * u + lh * (i + 0.5) + 2 * u));
  texts?.push({ id: 'cap', text, x0: x, y0: y, x1: x + w, y1: y + h });
}

export function callout(ctx, V, text, tx, ty, lx, ly, pop = 1, texts) {
  const u = V.u;
  const fs = 30 * u;
  ctx.font = `600 ${fs}px Mali`;
  const w = ctx.measureText(text).width + 44 * u, h = fs * 1.7;
  stroke(ctx, [[tx, ty], [lx, ly + h / 2]], 3 * u);
  circle(ctx, tx, ty, 6 * u, { fill: INK, line: null });
  ctx.save(); ctx.translate(lx, ly + h / 2); ctx.scale(pop, pop);
  rrect(ctx, -w / 2, -h / 2, w, h, 16 * u, { fill: PAPER, lw: 3.2 * u });
  ctx.fillStyle = INK; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(text, 0, 2 * u);
  ctx.restore();
  texts?.push({ id: 'call:' + text, text, x0: lx - w / 2, y0: ly, x1: lx + w / 2, y1: ly + h });
}
