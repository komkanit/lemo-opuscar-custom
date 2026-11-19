"""Build the timeline of one language from shots.json and that language's voice durations.
python timeline.py <lang> [--sub <lang2>]  →  demo/timeline.<lang>.json (shots, captions, stickers, events),
build/cues.<lang>.json for the .srt, and with --sub also build/cues.<lang2>.json: the same timing with <lang2>'s subtitle text.
Each shot lasts: pre + its voice line + post; captions split the line by character count; sticker/punch/box/future times are
fractions of the line (a future at 0 lands on the cut)."""
import json, sys, os
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
PAGE = os.environ.get('PAGE') or os.path.join(ROOT, 'demo')     # the page folder (index.html, shots.json, images)
OUTD = os.environ.get('OUT') or os.path.join(ROOT, 'build')    # where builds go
lang = sys.argv[1]; sub = sys.argv[sys.argv.index('--sub') + 1] if '--sub' in sys.argv else None
S = json.load(open(os.path.join(PAGE, 'shots.json'), encoding='utf-8'))
dur = json.load(open(os.path.join(ROOT, 'voice', f'out-{lang}', 'dur.json'), encoding='utf-8'))

def weight(s): return max(1, len(s.replace('|', '').replace(' ', '')))

t, shots, caps, ev, cues, subcues = 0.0, [], [], [], [], []
for i, s in enumerate(S['shots']):
    d = dur[s['line']]; pre = s.get('pre', 0.15); post = s.get('post', 0.28)
    t0 = t; vo = t0 + pre; t1 = vo + d + post
    at = lambda f: round(vo + f * d, 3) if f > 0 else round(t0, 3)
    sh = {k: s[k] for k in s if k not in ('caps', 'stickers', 'box', 'punch', 'future', 'sub')}
    sh.update(t0=round(t0, 3), t1=round(t1, 3), vo=round(vo, 3), vo_dur=d)
    if 'punch' in s: sh['punch'] = dict(s['punch'], t=at(s['punch']['at'])); ev.append(dict(t=sh['punch']['t'], type='punch'))
    if 'box' in s: sh['box'] = dict(rect=s['box']['rect'], text=s['box'][lang], t=at(s['box']['at'])); ev.append(dict(t=sh['box']['t'], type='pop', v=0.8))
    if 'future' in s:
        y = s['future'].get('year'); sh['future'] = dict(t=at(s['future']['at']), tag=S['future_tag'][lang], year=y[lang] if y else None)
        ev.append(dict(t=sh['future']['t'], type='future', year=bool(y)))
    sh['stickers'] = [dict(text=k[lang], pos=k['pos'], to=k['to'], rot=k['rot'], t=at(k['at'])) for k in s.get('stickers', [])]
    for k in sh['stickers']: ev.append(dict(t=k['t'], type='pop', v=1.0))
    if i > 0: ev.append(dict(t=round(t0, 3), type='cut', alarm=bool(s.get('alarm')), glitch=bool(s.get('archive'))))
    ev.append(dict(t=round(vo, 3), type='vo', id=s['line'], shot=s['id']))
    ph = s['caps'][lang]; w = [weight(p) for p in ph]; acc = 0
    end_cap = t1 - (0.3 if s.get('loop') else 0.02)
    if s.get('end'): end_cap = min(end_cap, vo + d + 0.3)     # the end card takes over after the last words
    for j, p in enumerate(ph):
        c0 = vo + d * acc / sum(w); acc += w[j]
        c1 = vo + d * acc / sum(w) if j < len(ph) - 1 else end_cap   # the last phrase holds to the cut
        caps.append(dict(t0=round(c0, 3), t1=round(c1, 3), lines=p.split('|')))
    cues.append(dict(t0=round(vo, 3), t1=round(vo + d + 0.2, 3), text=' '.join(p.replace('|', ' ') for p in ph)))
    if sub: subcues.append(dict(t0=round(vo, 3), t1=round(vo + d + 0.2, 3), text=s['sub'][sub]))
    if s.get('end'):
        sh["endcard"] = dict(t=round(vo + d + 0.3, 3), lines=S['endcard'][lang].split('|')); ev.append(dict(t=sh['endcard']['t'], type='pop', v=0.9))
        endtxt = S['endcard'][lang].replace('|', ' ')
        cues.append(dict(t0=sh['endcard']['t'], t1=round(t1 - 0.3, 3), text=endtxt))
        if sub: subcues.append(dict(t0=sh['endcard']['t'], t1=round(t1 - 0.3, 3), text=S['endcard'][sub].replace('|', ' ') + ' Comment below.'))
    shots.append(sh); t = t1

out = dict(lang=lang, DUR=round(t, 3), img_ext=S.get('img_ext', 'png'), place=S['place'][lang], hook=dict(t0=0.1, t1=3.45, lines=S['hook'][lang].split('|')),
           shots=shots, caps=caps, EV=sorted(ev, key=lambda e: e['t']))
json.dump(out, open(os.path.join(PAGE, f'timeline.{lang}.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
os.makedirs(OUTD, exist_ok=True)
json.dump(cues, open(os.path.join(OUTD, f'cues.{lang}.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
if sub: json.dump(subcues, open(os.path.join(OUTD, f'cues.{sub}.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(f'{lang}: {len(shots)} shots, {out["DUR"]:.2f} s' + (f' (+ {sub} subtitles)' if sub else ''))
