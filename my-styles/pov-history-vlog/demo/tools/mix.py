"""Score, room tone, sound effects and voice for one language → $OUT/mix.<lang>.wav
python mix.py <lang>   (run with the library's .venv; LIB = the library root, PAGE = the page folder, OUT = the build folder)
Score: a hand-percussion vlog groove in D Hijaz (darbuka, shaker, harp ostinato, pizzicato bass) under the day; it cuts out on
the accident (the shot marked "alarm"), a lone harp for the next shot, a quiet harp from the first dusk/night shot, a hand-chime
swell on every fact from the future, and under the end card a D chord and the groove once more, softly."""
import json, os, sys
import numpy as np, soundfile as sf
from scipy.signal import resample_poly
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
PAGE = os.environ.get('PAGE') or os.path.join(ROOT, 'demo')     # the page folder (index.html, shots.json, images)
OUTD = os.environ.get('OUT') or os.path.join(ROOT, 'build')    # where builds go
LIB = os.environ.get('LIB') or os.path.abspath(os.path.join(ROOT, '..', '..'))
sys.path.insert(0, os.path.join(LIB, 'core', 'audio'))
import sfx, sampler as smp
from sfx import SR, add, whoosh, pop, thump, rumble, clack, click, noise, lp, hp, bp, brown, norm

lang = sys.argv[1]
TL = json.load(open(os.path.join(PAGE, f'timeline.{lang}.json'), encoding='utf-8'))
DUR = TL['DUR']; N = int((DUR + 0.5) * SR)
shot = {s['id']: s for s in TL['shots']}
rng = np.random.default_rng(3); smp.seed(5)

def stereo(m): return np.stack([m, m], 1)
def rms(x): return float(np.sqrt(np.mean(np.square(x)) + 1e-12))

# ---- voice --------------------------------------------------------------------------------------------------------
voice = np.zeros((N, 2), np.float32); vo_mask = np.zeros(N, np.float32); spans = []
for s in TL['shots']:
    x, sr = sf.read(os.path.join(ROOT, 'voice', f'out-{lang}', s['line'] + '.wav'), dtype='float32')
    if x.ndim > 1: x = x.mean(1)
    if sr != SR: x = resample_poly(x, SR, sr).astype(np.float32)
    x = x / (np.abs(x).max() + 1e-9) * 0.7
    i = int(s['vo'] * SR); voice[i:i + len(x)] += stereo(x)[:N - i]; vo_mask[i:i + len(x)] = 1; spans.append((i, i + len(x)))

# ---- score --------------------------------------------------------------------------------------------------------
B = 0.6                                    # 100 BPM, one beat
# sections from the shots themselves: the accident (alarm), the doctor (the shot after it), dusk and night (first dusk/night bed after)
SH = TL['shots']; ia = next(i for i, s in enumerate(SH) if s.get('alarm'))
t_acc = SH[ia]['t0']; t_doc = SH[ia]['t1']
t_night = next(s['t0'] for s in SH[ia + 1:] if s.get('bed') in ('dusk', 'night')); t_din = t_night
BARS = [['D4', 'A4', 'F#4', 'A4', 'D5', 'A4', 'F#4', 'A4'], ['C4', 'G4', 'Eb4', 'G4', 'C5', 'G4', 'Eb4', 'G4'],
        ['Bb3', 'F4', 'D4', 'F4', 'Bb4', 'F4', 'D4', 'F4'], ['D4', 'A4', 'F#4', 'A4', 'Eb5', 'D5', 'C5', 'A4']]
ROOTS = ['D2', 'C2', 'Bb1', 'D2']
ev = []
def groove(t0, t1, level):
    bar = 0; t = t0
    while t + 0.01 < t1:
        for k in range(8):                                              # harp ostinato, eighths
            tk = t + k * B / 2
            if tk >= t1: break
            ev.append((tk, 'harp', BARS[bar % 4][k], 0.5, (0.5 if k % 2 else 0.62) * level, 0.15))
        for k, (nm, v) in enumerate([('darbuka_doom', .85), ('darbuka_tak', .5), (None, 0), ('darbuka_tak', .55),
                                     ('darbuka_doom', .7), (None, 0), ('darbuka_tak', .6), ('darbuka_pa', .35)]):
            tk = t + k * B / 2
            if nm and tk < t1: ev.append(dict(t=tk, inst='world_perc', var=nm, vel=v * level, pan=-0.1, gain=0.9))
        for k in range(8):
            tk = t + k * B / 2
            if tk < t1: ev.append(dict(t=tk, inst='shaker', var='down' if k % 2 == 0 else 'up', vel=.35 * level, pan=0.3, gain=0.5))
        for k in (0, 2):
            tk = t + k * B
            if tk < t1: ev.append((tk, 'jazz_bass', ROOTS[bar % 4], B * 1.6, .8 * level, 0.0))
        bar += 1; t += 4 * B
groove(0.0, t_acc, 1.0)
for k, p in enumerate(['D3', 'A3', 'F#3', 'D3']):                     # the doctor: a lone harp, slow
    tk = t_doc + 0.2 + k * 2 * B
    if tk < t_din: ev.append((tk, 'harp', p, 2.0, .45, -0.1))
t = t_night; pat = ['D4', 'A3', 'F#4', 'A3', 'C4', 'G3', 'Eb4', 'G3']; k = 0
t_end = next((s['endcard']['t'] for s in SH if s.get('endcard')), DUR - 2.2)
while t < t_end - 0.3:                                                  # dusk to night: harp in quarters, quiet
    ev.append((t, 'harp', pat[k % 8], 1.2, .4, 0.1)); t += B; k += 1
for e in TL['EV']:                                                      # each fact from the future: a bell swell
    if e['type'] == 'future':
        for j, p in enumerate(['D5', 'A5', 'F#5'] if e.get('year') else ['A5', 'D6']):
            ev.append((e['t'] + 0.1 + j * 0.07, 'hand_chimes', p, 2.5, .5, (j - 1) * 0.3))
for p in ['D3', 'A3', 'D4', 'F#4', 'A4']: ev.append((t_end, 'harp', p, 2.5, .55, 0.0))   # the closing chord, under the end card
groove(t_end, DUR, 0.55)                                                 # and the day's groove, once more, softly

def to_dict(e):
    if isinstance(e, dict): return e
    t, inst, p, d, v, pan = e; return dict(t=t, inst=inst, pitch=p, dur=d, vel=v, pan=pan)
evs = []
for e in map(to_dict, ev):
    if 'var' in e: evs.append((e['t'], e['inst'], e['var'], None, e['vel'], e['pan'], e.get('gain', 1.0)))
    else: evs.append((e['t'], e['inst'], e['pitch'], e['dur'], e['vel'], e['pan']))
music = smp.render(evs, dur=DUR + 0.5).astype(np.float32)
music = music[:N] if len(music) >= N else np.pad(music, ((0, N - len(music)), (0, 0)))
music[int(t_acc * SR):int(t_doc * SR)] = 0                            # silence under the accident
f = int(0.04 * SR); i = int(t_acc * SR); music[i - f:i] *= np.linspace(1, 0, f)[:, None]
music = music / (rms(music[: int(t_acc * SR)]) + 1e-9) * 0.05

# ---- room tone per shot -----------------------------------------------------------------------------------------
def bed(kind, d):
    tt = sfx.t_(d); n = len(tt)   # same rounding as noise()
    if kind in ('dawn', 'wind'):
        x = bp(noise(d), 250, 2200) * (0.6 + 0.4 * np.sin(2 * np.pi * 0.13 * tt + rng.random() * 6)) * (0.5 if kind == 'dawn' else 0.9)
        if kind == 'dawn':
            for _ in range(int(d * 0.8)):                              # a few distant birds
                c0 = rng.random() * max(0.01, d - 0.3); m = int(0.12 * SR); tc = np.arange(m) / SR
                ch = np.sin(2 * np.pi * (3200 + 1800 * tc / 0.12) * tc) * np.sin(np.pi * tc / 0.12) * 0.25
                j = int(c0 * SR); x[j:j + m] += ch[:len(x) - j]
        return x * 0.5
    if kind == 'fire':
        x = lp(noise(d), 900) * 0.5
        for _ in range(int(d * 9)):
            j = int(rng.random() * (n - 2000)); c = click(0.6 + rng.random(), 0.25 + 0.4 * rng.random()); x[j:j + len(c)] += c[:n - j] * 0.5
        return x * 0.6
    if kind in ('site', 'haul'):
        x = bp(noise(d), 250, 1100) * (0.7 + 0.3 * np.sin(2 * np.pi * 0.4 * tt)) * 0.7
        for _ in range(int(d * 1.3)):
            j = int(rng.random() * (n - 6000)); c = clack(0.4 + 0.5 * rng.random(), 0.3); x[j:j + len(c)] += c[:n - j] * 0.4
        return x * (0.8 if kind == 'haul' else 0.6)
    if kind == 'shade': return lp(noise(d), 700) * 0.3
    if kind == 'dusk': return bp(noise(d), 200, 900) * (0.6 + 0.4 * np.sin(2 * np.pi * 0.2 * tt)) * 0.35 + lp(noise(d), 400) * 0.2
    if kind == 'archive':                                               # an old projector: hum and crackle
        x = np.sin(2 * np.pi * 100 * tt) * 0.05 + lp(noise(d), 3000) * 0.08
        for _ in range(int(d * 14)):
            j = int(rng.random() * (n - 800)); x[j:j + 300] += hp(noise(300 / SR), 2000)[:300] * np.exp(-np.arange(300) / 60) * rng.random()
        return x
    if kind == 'night':                                                 # crickets
        x = lp(noise(d), 500) * 0.15
        for c0 in np.arange(0.1, d - 0.3, 0.55):
            for r in range(3):
                j = int((c0 + r * 0.05 + 0.02 * rng.random()) * SR); m = int(0.03 * SR); tc = np.arange(m) / SR
                x[j:j + m] += np.sin(2 * np.pi * 4600 * tc) * np.sin(np.pi * tc / 0.03) * 0.12
        return x
    return np.zeros(n)
amb = np.zeros(N, np.float32)
for s in TL['shots']:
    d = s['t1'] - s['t0'] + 0.1; x = bed(s.get('bed'), d).astype(np.float32); n = len(x)
    fade = int(0.08 * SR); x[:fade] *= np.linspace(0, 1, fade); x[-fade:] *= np.linspace(1, 0, fade)
    i = int(s['t0'] * SR); amb[i:i + n] += x[:N - i]
amb = amb / (rms(amb) + 1e-9) * 0.03

# ---- effects on the picture's events -------------------------------------------------------------------------------
fx = np.zeros((N, 2), np.float32)
for e in TL['EV']:
    if e['type'] == 'cut':
        if e.get('alarm'):
            add(fx, thump(1.0, 48), e['t'] - 0.05, 0.8); add(fx, rumble(0.9), e['t'] - 0.05, 0.3); add(fx, clack(0.35, 1.0), e['t'] - 0.03, 0.5)
        elif not e.get('glitch'): add(fx, whoosh(0.24), e['t'] - 0.12, 0.28)
    elif e['type'] == 'future':   # the glitch: a reversed whoosh and a burst of torn noise
        add(fx, whoosh(0.4)[::-1].copy(), e['t'] - 0.3, 0.35)
        z = hp(noise(0.35), 1500) * (np.random.default_rng(1).random(len(sfx.t_(0.35))) > 0.6) * np.linspace(1, 0, len(sfx.t_(0.35)))
        add(fx, z.astype(np.float32), e['t'], 0.12)
    elif e['type'] == 'pop': add(fx, pop(), e['t'], 0.3); add(fx, click(1.6, 0.6), e['t'], 0.15)
    elif e['type'] == 'punch': add(fx, whoosh(0.18), e['t'] - 0.06, 0.3); add(fx, thump(0.8, 62), e['t'] + 0.14, 0.45)
add(fx, whoosh(0.35), DUR - 0.4, 0.3)

# ---- mix: voice first, the rest ducks under it -------------------------------------------------------------------
k = int(0.15 * SR); duck = np.convolve(vo_mask, np.ones(k) / k, 'same')
under = 1 - 0.6 * duck
bgm = music * under[:, None] + stereo(amb * (1 - 0.4 * duck)) + fx * (1 - 0.45 * duck)[:, None]
mix = voice + bgm
for a, b in spans:   # report: voice over everything else, per line
    print(f'  line at {a / SR:5.2f}s  voice/rest = {20 * np.log10(rms(voice[a:b]) / (rms(bgm[a:b]) + 1e-9)):5.1f} dB')
mix = mix / (np.abs(mix).max() + 1e-9) * 0.89
os.makedirs(OUTD, exist_ok=True)
sf.write(os.path.join(OUTD, f'mix.{lang}.wav'), mix, SR, subtype='PCM_24')
print(f'mix.{lang}.wav {DUR:.2f}s')
