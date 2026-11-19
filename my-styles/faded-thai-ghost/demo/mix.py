"""มุ้งขาว · The White Net: the mix (night bed, drone, single notes, silence as the sting). Writes $OUT/mix.wav.
Times match src/film.js (shots 0 / 4.5 / 10.5 / 15.0 / 16.6 / 24)."""
import os, sys
import numpy as np
import soundfile as sf

LIB = os.environ.get('LIB') or os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
sys.path.insert(0, LIB)
from core.audio import sampler as S
from core.audio.sfx import SR, t_, noise, bp, lp, hp, env_exp, norm, brown, creak, add, limit

OUT = os.environ.get('OUT') or os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'build')
os.makedirs(OUT, exist_ok=True)
DUR = 24.0
N = int(DUR * SR)
rng = np.random.default_rng(11)
S.seed(5)


def ramp(points):
    """piecewise-linear gain curve over the whole film: [(t, gain), …]"""
    ts, gs = zip(*points)
    return np.interp(np.arange(N) / SR, ts, gs)


def stereo(m, pan=0.0):
    l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    return np.stack([m * l, m * r], 1)


def crickets(d, f0, rate, seed):
    r = np.random.default_rng(seed)
    tt = t_(d)
    carrier = np.sin(2 * np.pi * f0 * tt + r.uniform(0, 6))
    pulses = (np.sin(2 * np.pi * rate * tt) > .55).astype(float)          # chirp trains
    gate = (np.sin(2 * np.pi * (rate / 9.3) * tt + r.uniform(0, 6)) > -.2).astype(float)
    return lp(carrier * pulses * gate, 9000) * .5


def frogs(d, seed):
    r = np.random.default_rng(seed)
    out = np.zeros(int(d * SR))
    t = r.uniform(0, .6)
    while t < d - .4:
        L = r.uniform(.08, .16)
        x = bp(noise(L), 380, 900) * np.sin(np.pi * np.linspace(0, 1, int(round(L * SR)))) ** 2
        x *= 1 + .8 * np.sin(2 * np.pi * r.uniform(35, 60) * t_(L))   # throat buzz
        i = int(t * SR); out[i:i + len(x)] += x[:len(out) - i]
        t += r.uniform(.25, .9)
    return out * .35


def howl(d=2.6):
    tt = t_(d)
    f = 520 + 160 * np.sin(np.pi * np.clip(tt / d, 0, 1)) - 90 * (tt / d) + 6 * np.sin(2 * np.pi * 5.5 * tt)
    ph = 2 * np.cumsum(f) * np.pi / SR
    x = np.sin(ph) + .35 * np.sin(2 * ph) + .12 * np.sin(3 * ph)
    e = np.sin(np.pi * np.clip(tt / d, 0, 1)) ** 1.5
    return lp(x * e, 1800) * .25


def gecko(f0=380):
    """a tokay's call: 'tok' then a falling 'kae', nasal"""
    def syl(f, L, fall):
        tt = t_(L)
        ff = f * (1 - fall * tt / L)
        ph = 2 * np.pi * np.cumsum(ff) / SR
        x = sum(np.sin(k * ph) / k ** .7 for k in range(1, 7))
        e = np.minimum(1, tt / .012) * np.exp(-tt / (L * .45))
        return bp(x * e, 280, 2600)
    a, b = syl(f0, .13, .08), syl(f0 * .78, .22, .22)
    out = np.zeros(int(.5 * SR)); out[:len(a)] += a; out[int(.2 * SR):int(.2 * SR) + len(b)] += b
    return out * .5


def drone(d, f=73.4):
    tt = t_(d)
    x = sum(np.sin(2 * np.pi * f * k * (1 + dt) * tt + k) / k for k in (1, 2, 3, 4) for dt in (-.0025, .0021))
    x = lp(x, 420) * (1 + .15 * np.sin(2 * np.pi * .13 * tt))
    return x * .12


def sputter(d=.75, v=1.0):
    """an oil flame guttering: soft crackle and breath"""
    x = np.zeros(int(d * SR))
    for _ in range(28):
        i = rng.integers(0, len(x) - 400)
        c = hp(noise(.008), 1500) * env_exp(.008, .002)
        x[i:i + len(c)] += c * rng.uniform(.2, 1)
    x += bp(noise(d), 200, 1200) * np.linspace(.3, 0, len(x)) * .25
    return x * v


mix = np.zeros((N, 2))

# --- night bed ----------------------------------------------------------------------------
bed = np.zeros((N, 2))
bed += stereo(crickets(DUR, 4300, 26, 1), -.5) + stereo(crickets(DUR, 5100, 31, 2), .55) + stereo(crickets(DUR, 3800, 22, 3), .1) * .7
bed += stereo(frogs(DUR, 4), -.2) + stereo(frogs(DUR, 5), .4) * .8
bed += stereo(lp(brown(DUR), 300) * .06, 0)                          # room and far air
# fades in, thins in shot 3, drains for the lamp-out, creeps back after the reveal
bed *= ramp([(0, 0), (1.8, .9), (10.5, .9), (14.6, .45), (15.6, .0), (18.6, 0), (22.0, .55), (24, .6)])[:, None]
mix += bed * .55

add(mix, howl(), 2.2, .35, .7)                                       # far dog, shot 1
S2 = gecko()
add(mix, S2, 6.0, .55, -.35); add(mix, S2, 6.75, .5, -.35)          # tokay, shot 2
add(mix, creak(.6), 9.4, .35, .2)                                    # floorboard

# --- drone and single notes ----------------------------------------------------------------
dr = drone(DUR)
dr *= ramp([(0, 0), (2.0, 0), (5.0, .8), (14.0, 1.0), (15.5, 0), (19.2, 0), (21.5, .5), (24, .3)])
mix += stereo(dr, 0) * .9
erhu = S.note('erhu', 'A3', 3.6, vel=.35, release=1.2, attack=.6)  # the "saw u": a low bowed line under the net
add(mix, erhu, 11.6, .45, .25)
erhu2 = S.note('erhu', 'G#3', 2.0, vel=.3, release=.9, attack=.3)   # it slips down a semitone
add(mix, erhu2, 14.0, .3, .25)
mar = S.note('marimba', 'D3', 3.0, vel=.55)                          # one low ระนาดทุ้ม-like note after the reveal
add(mix, S.room(np.stack([mar, mar], 1), size=.6, mix=.35)[:, 0], 18.9, .55, -.1)
bell = S.hit('gong2', None, .35)                                     # temple gong far away, opening
add(mix, lp(bell, 1200), 0.9, .18, -.6)

# --- the lamp -------------------------------------------------------------------------------
add(mix, sputter(.8, 1.0), 15.05, .35, -.7)                          # gutters and dies
add(mix, sputter(.6, .7), 16.6, .25, -.7)                            # relights

mix = S.room(mix.astype(np.float32), size=.42, mix=.16)

# --- the narrator (VOICE=tonce|hammy): voice in front, everything else ducks 7 dB under each line ---
VOICE = os.environ.get('VOICE')
if VOICE:
    here = os.path.dirname(os.path.abspath(__file__))
    import json
    starts = json.load(open(os.path.join(here, 'voice', 'starts.json')))
    vo = np.zeros(N)
    duck = np.zeros(N)
    for n, t0 in starts.items():
        x, sr = sf.read(os.path.join(here, 'voice', VOICE, f'{n}.wav'))
        if x.ndim > 1: x = x.mean(1)
        if sr != SR:
            import soxr
            x = soxr.resample(x, sr, SR)
        x = x * (10 ** (-20.5 / 20) / np.sqrt((x ** 2).mean()))     # every line at the same loudness
        i = int(t0 * SR); vo[i:i + len(x)] += x[:N - i]
        a, b = max(0, i - int(.35 * SR)), min(N, i + len(x) + int(.45 * SR))
        duck[a:b] = 1
    k = int(.3 * SR)
    duck = np.convolve(duck, np.ones(k) / k, 'same')               # smooth the duck in and out
    mix *= (1 - .6 * duck)[:, None]
    voice = S.room(np.stack([vo, vo], 1).astype(np.float32), size=.3, mix=.10)
    mix = mix + voice * 1.0
mix = limit(mix * .9, .89)
sf.write(os.path.join(OUT, 'mix.wav'), mix.astype(np.float32), SR)
print('mix →', os.path.join(OUT, 'mix.wav'), f'{len(mix) / SR:.2f}s peak {np.abs(mix).max():.2f}')
