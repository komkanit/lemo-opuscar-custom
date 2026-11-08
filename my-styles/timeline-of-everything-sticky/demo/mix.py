"""Score, foley and voice for the demo. Reads events.json (from the page), writes out/mix.wav and out/stems/*.wav.
Run with the library's Python from the library root:  $LIB/.venv/bin/python <project>/mix.py
"""
import os, sys, json
import numpy as np, soundfile as sf, soxr
HERE = os.path.dirname(os.path.abspath(__file__))
LIB = os.environ.get('LIB') or os.path.abspath(os.path.join(HERE, '..', '..'))
sys.path.insert(0, LIB)
from core.audio import sampler as S
from core.audio.sfx import SR, add, limit, noise, bp, hp, lp, env_exp, t_, norm, pop, whoosh

OUT = os.environ.get('OUT') or os.path.join(HERE, 'out')
os.makedirs(os.path.join(OUT, 'stems'), exist_ok=True)
EVJ = json.load(open(os.path.join(OUT, 'events.json') if os.path.exists(os.path.join(OUT, 'events.json')) else os.path.join(HERE, 'events.json')))
DUR, EV = EVJ['dur'], EVJ['ev']
N = int(DUR * SR) + SR
BEAT, BAR = 0.6, 2.4
rng = np.random.default_rng(5)

def buf(): return np.zeros((N, 2), np.float32)

# ---------------- voice ----------------
VO = {e['id']: e['t'] for e in EV if e['type'] == 'voice'}
voice = buf()
vmask = np.zeros(N, np.float32)
for vid, t in VO.items():
    x, sr = sf.read(os.path.join(HERE, 'voices', f'{vid}.wav'), dtype='float32')
    if x.ndim > 1: x = x.mean(1)
    x = soxr.resample(x, sr, SR)
    x = hp(x, 80)
    x = x / (np.sqrt(np.mean(x ** 2)) + 1e-9) * 0.075
    add(voice, x, t, 1.0, 0.0)
    a, b = int(t * SR), int(t * SR) + len(x)
    vmask[a:b] = 1
# duck envelope (attack 0.15 s, release 0.45 s)
k = int(0.3 * SR)
sm = np.convolve(vmask, np.ones(k) / k, mode='same')
duck = 10 ** (-12 * np.clip(sm * 1.4, 0, 1) / 20)

# ---------------- score: G major, 100 BPM, G – D – Em – C ----------------
CH = [['G3', 'B3', 'D4', 'G4'], ['A3', 'D4', 'F#4', 'A4'], ['B3', 'E4', 'G4', 'B4'], ['C4', 'E4', 'G4', 'C5']]
BASS = ['G2', 'D3', 'E3', 'C3']
MEL = ['D5', 'B4', 'G4', 'A4', 'B4', 'D5', 'E5', 'D5']  # pentatonic motif, 8ths over a bar
score = []
def bars(t0, t1):
    b = int(np.ceil(t0 / BAR - 1e-6))
    while b * BAR < t1 - 1e-6:
        yield b, b * BAR
        b += 1

def era_at(t):
    if t < 6.0 or t >= 32.6: return 'map'
    if t < 18.6: return 'anatolia'
    if t < 24.9: return 'britain'
    return 'egypt'

for b, t in bars(0, 38.4):
    ci = b % 4
    era = era_at(t + 0.01)
    quiet = 27.0 <= t < 32.0           # the scale check: drone and harp only
    if era == 'map':
        score.append((t, 'marimba', CH[ci][0], 1.2, .38, -.2))
        for j, p in enumerate(CH[ci][1:] + [CH[ci][2]]):
            score.append((t + 0.6 * j, 'marimba', p.replace('4', '5') if j == 2 else p, 0.6, .3, .2))
        for p_ in CH[ci]: score.append((t + 0.02 * CH[ci].index(p_), 'ukulele', p_, 2.2, .34, .1))
        continue
    if not quiet:
        # ukulele: down on the beat, light up-strum on the off-beat
        for j in range(4):
            tt = t + j * BEAT
            for i, p in enumerate(CH[ci]): score.append((tt + 0.012 * i, 'ukulele', p, 0.55, .5 if j % 2 == 0 else .4, .15))
            for i, p in enumerate(reversed(CH[ci][1:])): score.append((tt + 0.3 + 0.01 * i, 'ukulele', p, 0.25, .26, .15))
        # pizz bass on 1 and 3
        score.append((t, 'cellos_pizz', BASS[ci], 0.6, .6, -.1))
        score.append((t + 2 * BEAT, 'cellos_pizz', BASS[ci], 0.6, .5, -.1))
        # shaker 8ths
        for j in range(8): score.append((t + j * 0.3, 'shaker', 'down' if j % 2 == 0 else 'up', None, .32 if j % 2 else .42, .35))
        # melody: marimba (Anatolia, Britain), harp (Egypt)
        lead = 'harp' if era == 'egypt' else 'marimba'
        if b % 2 == 0:
            for j, p in enumerate(MEL): score.append((t + j * 0.3, lead, p, 0.35, .42, -.3))
        else:
            score.append((t, lead, MEL[0], 1.0, .4, -.3)); score.append((t + 1.2, lead, MEL[2], 1.0, .38, -.3))
    # era colour
    if era == 'anatolia' and not quiet:
        score.append((t, 'frame_drum', 'large', None, .55, -.2)); score.append((t + 2 * BEAT, 'frame_drum', 'large', None, .45, -.2))
        score.append((t + 1.5 * BEAT, 'frame_drum', 'small', None, .35, .2)); score.append((t + 3.5 * BEAT, 'frame_drum', 'small', None, .35, .2))
    if era == 'britain':
        score.append(dict(t=t, inst='bagpipe', pitch='G3', dur=BAR, vel=.35, pan=0, gain=.32, attack=.2, release=.3))
    if era == 'egypt':
        for j, p in enumerate(['G3', 'D4', 'G4', 'B4', 'D5', 'B4', 'G4', 'D4']):
            score.append((t + j * 0.3, 'harp', p, 0.6, .34 if not quiet else .28, .3))
        if quiet:
            score.append(dict(t=t, inst='cellos', pitch='G2', dur=BAR + .2, vel=.4, pan=0, gain=.6, attack=.4, release=.6))
# the speed-ups: tambourine on triplets while the walker speed-walks
for t0, t1 in [(15.6, 19.8), (23.4, 25.8)]:
    tt = t0
    while tt < t1 - 1e-6:
        score.append((tt, 'world_perc', 'tambourine', None, .28, .4)); tt += 0.2
# ending chord
score.append((38.2, 'marimba', 'G4', 1.2, .5, 0))
for i, p in enumerate(['G3', 'B3', 'D4', 'G4']): score.append((36.4 + 0.03 * i, 'ukulele', p, 2.6, .45, .1))
music = S.render(score, dur=N / SR)
music = S.room(music, size=.35, mix=.14)
music = music[:N] if len(music) >= N else np.pad(music, ((0, N - len(music)), (0, 0)))
music *= 0.85
music_d = music * duck[:, None]

# ---------------- foley ----------------
fx = buf()
def foot(surface, v):
    d = .12
    if surface == 'steppe':   # dry grass crunch
        x = bp(noise(d), 1800, 7000) * env_exp(d, .018) + lp(noise(d), 300) * env_exp(d, .012) * .6
    elif surface == 'turf':   # soft, damp
        x = lp(noise(d), 900) * env_exp(d, .02) + bp(noise(d), 1200, 3000) * env_exp(d, .008) * .3
    else:                     # sand: a short shh
        x = bp(noise(d), 2500, 8000) * (np.sin(np.pi * t_(d) / d) ** 2) * .9
    return norm(x) * v
for e in EV:
    t, ty = e['t'], e['type']
    if ty == 'step':
        add(fx, foot(e['surface'], 0.16 * (0.6 + 0.4 * min(1, e.get('v', 1)))), t, 1.0, rng.uniform(-.1, .1))
    elif ty == 'tick':
        d = .025; x = norm(bp(noise(d), 3000, 6000) * env_exp(d, .003)) * .05
        add(fx, x, t, 1.0, .2)
    elif ty == 'era':
        g = S.note('glockenspiel', 'G6', 1.8, vel=.55); add(fx, g * .5, t, 1.0, .25)
        g2 = S.note('glockenspiel', 'D7', 1.4, vel=.4); add(fx, g2 * .35, t + 0.09, 1.0, .3)
        d = .28; flip = norm(bp(noise(d), 900, 5000) * np.sin(np.pi * t_(d) / d) ** 3) * .12
        add(fx, flip, t - 0.05, 1.0, -.2)
    elif ty == 'pop':
        add(fx, pop(.22), t, 1.0, .1)
    elif ty == 'whoosh':
        add(fx, whoosh(e.get('d', .5), .2 if e.get('big') else .14), t, 1.0, 0)

# ---------------- mix ----------------
mix = voice * 1.0 + music_d + fx * 0.9
for c in range(2): mix[:, c] = limit(mix[:, c], .45)
mix = mix[:int(DUR * SR)]
sf.write(os.path.join(OUT, 'mix.wav'), mix, SR)
for nm, x in [('voice', voice), ('music', music_d), ('fx', fx)]: sf.write(os.path.join(OUT, 'stems', nm + '.wav'), x[:int(DUR * SR)], SR)
print('mix', mix.shape, 'peak', float(np.abs(mix).max()))
