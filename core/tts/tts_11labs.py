"""ElevenLabs voice (online, paid): python core/tts/tts_11labs.py lines.json out_dir [--voice <id or name>] [--model <id>] [--lexicon f.tsv …] [--dry-run]
                                    python core/tts/tts_11labs.py --list-voices [--search <words>]
lines.json = [{"id":..., "text":..., "voice":"<voice id or name>", "lang":"th", "say":"...", "model":"eleven_v4",
               "stability":0.5, "similarity":0.75, "style":0, "speed":1.0, "speaker_boost":true, "seed":7}, ...]
  Same outputs as tts.py and tts_zh.py: out_dir/<id>.wav (24 kHz mono, leading/trailing silence trimmed) and out_dir/dur.json, plus
  out_dir/say.json (the text actually spoken per line, for review).
  "voice"  a voice ID, or a voice name in the account (looked up once and remembered in out_dir/.cache/voices.json). No default: a line
           without one and no --voice is an error, so a film never gets a voice nobody chose. List them: --list-voices.
  "lang"   ISO 639-1 (th, en, zh…), sent as language_code (multilingual_v2 ignores it). Picks the default model: th → eleven_v4;
           otherwise $ELEVENLABS_MODEL or eleven_multilingual_v2. A line's "model" or --model wins.
  "say"    what is spoken when it differs from "text". Without it, Thai lines are localized (core/tts/locales: 2:00pm → บ่ายสองโมง);
           --lexicon adds a series' or project's word swaps, --no-localize turns this off.
  Voice settings: stability, similarity (similarity_boost), style, speed, speaker_boost; eleven_v4 takes only stability and similarity
           (its docs: no Style or Speed), so the others are not sent to it. "seed" makes a re-run as repeatable as the API allows.
  Neighbouring lines of the same voice are sent as previous_text / next_text, so the read doesn't reset its tone on every line
           (--no-context to turn off). They aren't part of the cache key: editing one line re-buys only that line.
Cost: ElevenLabs bills by character. Each run prints the characters it will send (cached lines are free); --dry-run prints that and every
  line's spoken text, then stops without calling the API. Audio is cached in out_dir/.cache/ by voice, model, settings, language and text.
Key: the ELEVENLABS_API_KEY environment variable, or a .env file at the library root (copy .env.example; git ignores .env). A variable
  already set in the shell wins over the file. Never put the key in lines.json, build.sh or a project file. ELEVENLABS_MODEL and
  ELEVENLABS_BASE_URL (another endpoint: a regional server such as https://api.eu.residency.elevenlabs.io, or a proxy) work the same way.
Exit codes: 0 done; 1 bad input (unknown voice, no key, the API rejected a line); 2 network unreachable; 3 key rejected or quota used up.
"""
import sys, os, json, re, time, hashlib, argparse, urllib.request, urllib.error, urllib.parse
HERE = os.path.dirname(os.path.abspath(__file__))
ENV_FILE = os.path.join(os.path.dirname(os.path.dirname(HERE)), '.env')   # <library root>/.env
sys.path.insert(0, HERE)
from locales import line_forms, lang_of

SR = 24000
DEFAULT_MODEL = {'th': 'eleven_v4'}
FALLBACK_MODEL = 'eleven_multilingual_v2'
NO_STYLE_SPEED = ('eleven_v4',)          # eleven_v4 and its variants (eleven_v4_turbo): Style and Speed aren't available
ID_RE = re.compile(r'[A-Za-z0-9]{20}')    # ElevenLabs voice IDs are 20 letters and digits


class ApiError(Exception):
    def __init__(self, code, status, detail): super().__init__(detail); self.code, self.status, self.detail = code, status, detail


def base_url(): return os.environ.get('ELEVENLABS_BASE_URL', 'https://api.elevenlabs.io').rstrip('/')


def load_env(path=ENV_FILE):
    """KEY=value lines from the library's .env into the environment, without replacing what the shell already set.
    Blank lines and # comments are skipped; `export ` in front and quotes around the value are allowed."""
    if not os.path.exists(path): return
    with open(path, encoding='utf-8') as f:
        for i, raw in enumerate(f, 1):
            row = raw.strip()
            if not row or row.startswith('#'): continue
            if row.startswith('export '): row = row[7:].lstrip()
            k, eq, v = row.partition('=')
            k, v = k.strip(), v.strip()
            if not eq or not re.fullmatch(r'[A-Za-z_][A-Za-z0-9_]*', k):
                sys.exit(f'tts_11labs.py: {path}:{i}: expected KEY=value')   # the line itself isn't printed: it may hold a key
            if len(v) >= 2 and v[0] == v[-1] and v[0] in '"\'': v = v[1:-1]
            elif ' #' in v: v = v.split(' #', 1)[0].rstrip()   # a comment after an unquoted value
            if v and not os.environ.get(k): os.environ[k] = v


def api_key():
    k = os.environ.get('ELEVENLABS_API_KEY', '').strip()
    if not k: sys.exit('tts_11labs.py: no ElevenLabs API key (elevenlabs.io → Developers → API keys). Either:\n'
                       f'  put ELEVENLABS_API_KEY=<key> in {ENV_FILE} (copy .env.example; git ignores .env), or\n'
                       '  export ELEVENLABS_API_KEY in your shell. Never put it in lines.json, build.sh or a project file.')
    return k


def call(method, path, body=None, query=None, tries=5):
    """One API call with retries on 429 and 5xx; returns the response bytes. Raises ApiError, or exits 2 when the network is unreachable."""
    url = base_url() + path + ('?' + urllib.parse.urlencode(query) if query else '')
    data = json.dumps(body, ensure_ascii=False).encode('utf-8') if body is not None else None
    for attempt in range(tries):
        req = urllib.request.Request(url, data=data, method=method, headers={'xi-api-key': api_key(), 'Content-Type': 'application/json',
                                                                            'User-Agent': 'lemo-opuscar-tts'})
        try:
            with urllib.request.urlopen(req, timeout=120) as r: return r.read()
        except urllib.error.HTTPError as e:
            raw = e.read().decode('utf-8', 'replace')
            try: detail = json.loads(raw).get('detail', raw)
            except ValueError: detail = raw
            status = detail.get('status', '') if isinstance(detail, dict) else ''
            if isinstance(detail, dict): msg = detail.get('message', json.dumps(detail, ensure_ascii=False))
            elif isinstance(detail, list): msg = '; '.join(f"{'.'.join(map(str, d.get('loc', [])))}: {d.get('msg', d)}" if isinstance(d, dict) else str(d) for d in detail)
            else: msg = str(detail)
            if (e.code == 429 and status != 'quota_exceeded') or e.code >= 500:
                if attempt < tries - 1: time.sleep(min(30, 2 ** attempt + 1)); continue
            raise ApiError(e.code, status, msg[:600])
        except (urllib.error.URLError, TimeoutError, ConnectionError) as e:
            if attempt < tries - 1: time.sleep(2 ** attempt); continue
            print(f'tts_11labs.py: cannot reach {base_url()}: {getattr(e, "reason", e)}', file=sys.stderr); sys.exit(2)


def fail(e, what):
    if e.code in (401, 402, 403) or e.status in ('quota_exceeded', 'invalid_api_key', 'detected_unusual_activity'):
        print(f'tts_11labs.py: ElevenLabs refused {what} ({e.code} {e.status}): {e.detail}\n'
              f'  check the key in ELEVENLABS_API_KEY and the characters left on the plan.', file=sys.stderr); sys.exit(3)
    sys.exit(f'tts_11labs.py: ElevenLabs rejected {what} ({e.code}): {e.detail}')


def list_voices(search=None):
    voices, token = [], None
    while True:
        q = {'page_size': 100}
        if search: q['search'] = search
        if token: q['next_page_token'] = token
        try: r = json.loads(call('GET', '/v2/voices', query=q))
        except ApiError as e: fail(e, 'the voice list')
        voices += r.get('voices', [])
        token = r.get('next_page_token')
        if not r.get('has_more') or not token: return voices


def resolve_voice(name, cache):
    """A voice ID is used as it is; a name is looked up in the account (exact name, ignoring case) and remembered."""
    if ID_RE.fullmatch(name): return name
    if name in cache: return cache[name]
    found = [v for v in list_voices(name) if v.get('name', '').strip().lower() == name.strip().lower()]
    if not found:
        near = [v['name'] for v in list_voices(name)][:8]
        sys.exit(f"tts_11labs.py: no voice named '{name}' in this ElevenLabs account."
                 + (f"\n  close: {', '.join(near)}" if near else '') + '\n  list them: python core/tts/tts_11labs.py --list-voices')
    if len(found) > 1: print(f"tts_11labs.py: {len(found)} voices are named '{name}'; using {found[0]['voice_id']}. Give the ID to pick another.", file=sys.stderr)
    cache[name] = found[0]['voice_id']; return cache[name]


def iso(lang):
    """'th-TH' / 'th' → 'th'; Kokoro's 'en-us' → 'en'; 'cmn' → 'zh'."""
    if not lang: return None
    l = lang.lower().replace('_', '-').split('-')[0]
    return {'cmn': 'zh'}.get(l, l) if re.fullmatch('[a-z]{2,3}', l) else None


def settings(L, model):
    s = {}
    for k, api in (('stability', 'stability'), ('similarity', 'similarity_boost'), ('style', 'style'), ('speed', 'speed'), ('speaker_boost', 'use_speaker_boost')):
        if k in L: s[api] = L[k]
    if model.startswith(NO_STYLE_SPEED):
        dropped = [k for k in ('style', 'speed') if k in s]
        if dropped: print(f"tts_11labs.py: line '{L['id']}': {model} has no {' or '.join(dropped)}; not sent", file=sys.stderr)
        for k in dropped: del s[k]
    return s


def trim(a):
    import numpy as np
    nz = np.where(np.abs(a) > (np.abs(a).max() if len(a) else 0) * .02)[0]
    if not len(nz): return a, False
    return a[max(0, nz[0] - int(.03 * SR)): nz[-1] + int(.08 * SR)], True   # same trim as tts.py


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('lines', nargs='?'); ap.add_argument('out_dir', nargs='?')
    ap.add_argument('--voice'); ap.add_argument('--model'); ap.add_argument('--lexicon', action='append', default=[])
    ap.add_argument('--dry-run', action='store_true'); ap.add_argument('--no-localize', action='store_true'); ap.add_argument('--no-context', action='store_true')
    ap.add_argument('--list-voices', action='store_true'); ap.add_argument('--search')
    a = ap.parse_args()
    load_env()

    if a.list_voices:
        for v in list_voices(a.search):
            lab = v.get('labels') or {}
            print(v['voice_id'], '|', v.get('name', ''), '|', v.get('category', ''), '|', ', '.join(f'{k}: {x}' for k, x in lab.items() if x))
        return
    if not (a.lines and a.out_dir): ap.print_usage(sys.stderr); sys.exit(2)
    lines = json.load(open(a.lines, encoding='utf-8'))
    for p in a.lexicon:
        if not os.path.exists(p): sys.exit(f'tts_11labs.py: lexicon not found: {p}')

    # check the input first: every line has an id, text and a voice
    plan = []
    for i, L in enumerate(lines):
        if not isinstance(L, dict) or not L.get('id') or not L.get('text'): sys.exit(f'tts_11labs.py: line {i} needs an "id" and a "text"')
        voice = L.get('voice') or a.voice
        if not voice: sys.exit(f"tts_11labs.py: line '{L['id']}' has no voice and there is no --voice.\n  list the account's voices: python core/tts/tts_11labs.py --list-voices")
        lang = iso(L.get('lang')) or lang_of(L)   # Thai letters and no "lang": Thai
        try: say = L.get('say') or (L['text'] if a.no_localize else line_forms(L, a.lexicon)[1])
        except ValueError as e: sys.exit(f'tts_11labs.py: {e}')
        model = L.get('model') or a.model or DEFAULT_MODEL.get(lang) or os.environ.get('ELEVENLABS_MODEL') or FALLBACK_MODEL
        plan.append(dict(L=L, voice=voice, lang=lang, say=say, model=model, settings=settings(L, model)))

    cache_dir = os.path.join(a.out_dir, '.cache'); os.makedirs(cache_dir, exist_ok=True)
    for n in os.listdir(cache_dir):
        if n.endswith('.part'): os.remove(os.path.join(cache_dir, n))   # left by an interrupted run
    vpath = os.path.join(cache_dir, 'voices.json')
    vcache = json.load(open(vpath, encoding='utf-8')) if os.path.exists(vpath) else {}

    def key(p, vid):
        return hashlib.sha1(json.dumps([vid, p['model'], p['settings'], p['lang'], p['L'].get('seed'), p['say']], ensure_ascii=False, sort_keys=True).encode('utf-8')).hexdigest()[:16]

    # cost before anything is bought; a name that isn't cached yet can't be keyed without the API, so it counts as not cached
    todo = 0
    for p in plan:
        vid = p['voice'] if ID_RE.fullmatch(p['voice']) else vcache.get(p['voice'])
        p['cached'] = bool(vid) and os.path.exists(os.path.join(cache_dir, key(p, vid) + '.wav'))
        if not p['cached']: todo += len(p['say'])
    print(f"tts_11labs.py: {len(plan)} lines, {sum(not p['cached'] for p in plan)} to generate, {todo} characters to send"
          f" (models: {', '.join(sorted({p['model'] for p in plan}))})")
    if not a.dry_run: api_key()   # no key: stop before any lookup or purchase
    if a.dry_run:
        for p in plan: print(' ', p['L']['id'], '|', p['model'], '|', p['voice'], '|', 'cached' if p['cached'] else f"{len(p['say'])} chars", '|', p['say'])
        return

    import numpy as np, soundfile as sf
    for p in plan:
        try: p['vid'] = resolve_voice(p['voice'], vcache)
        except ApiError as e: fail(e, f"the voice lookup for '{p['voice']}'")
    tmp = vpath + '.part'; json.dump(vcache, open(tmp, 'w', encoding='utf-8'), indent=1, ensure_ascii=False); os.replace(tmp, vpath)

    dur, said = {}, {}
    for i, p in enumerate(plan):
        L, wav = p['L'], os.path.join(cache_dir, key(p, p['vid']) + '.wav')
        if not os.path.exists(wav):
            body = {'text': p['say'], 'model_id': p['model']}
            if p['lang']: body['language_code'] = p['lang']
            if p['settings']: body['voice_settings'] = p['settings']
            if L.get('seed') is not None: body['seed'] = L['seed']
            if not a.no_context:
                prev = next((q['say'] for q in reversed(plan[:i]) if q['vid'] == p['vid']), None)
                nxt = next((q['say'] for q in plan[i + 1:] if q['vid'] == p['vid']), None)
                if prev: body['previous_text'] = prev
                if nxt: body['next_text'] = nxt
            try: pcm = call('POST', f"/v1/text-to-speech/{p['vid']}", body, {'output_format': f'pcm_{SR}'})
            except ApiError as e: fail(e, f"line '{L['id']}'")
            if len(pcm) < 2 * SR // 10: sys.exit(f"tts_11labs.py: line '{L['id']}': ElevenLabs returned {len(pcm)} bytes of audio, too short to be speech; try again")
            audio = np.frombuffer(pcm[:len(pcm) // 2 * 2], dtype='<i2').astype(np.float32) / 32768
            sf.write(wav + '.part', audio, SR, format='WAV'); os.replace(wav + '.part', wav)   # never a half file under the real name
        audio, sr = sf.read(wav, dtype='float32')
        audio, ok = trim(audio)
        if not ok: print('warning: line', L['id'], 'is silent', file=sys.stderr)
        sf.write(os.path.join(a.out_dir, L['id'] + '.wav'), audio, sr)
        dur[L['id']] = round(len(audio) / sr, 3); said[L['id']] = p['say']
        print(L['id'], dur[L['id']], p['say'])
    json.dump(dur, open(os.path.join(a.out_dir, 'dur.json'), 'w', encoding='utf-8'), indent=1)
    json.dump(said, open(os.path.join(a.out_dir, 'say.json'), 'w', encoding='utf-8'), indent=1, ensure_ascii=False)


if __name__ == '__main__':
    main()
