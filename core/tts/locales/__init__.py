"""Localization for voice and subtitles: written text → what the voice says, and how the subtitle writes it.

  from locales import localize, line_forms
  localize('เจอกัน 2:00pm', 'th', 'say')   → 'เจอกัน บ่ายสองโมง'
  localize('เจอกัน 2:00pm', 'th', 'sub')   → 'เจอกัน บ่าย 2 โมง'

Languages: th (rules in th.py, word swaps in th_words.tsv). Text in any other language comes back unchanged.
Lexicons (word swaps) are tab-separated files, one swap per line:  written<TAB>say[<TAB>sub]   (# starts a comment; sub defaults to written).
They run before the rules, longest written form first. Several files can be given; a later file wins for the same written form, so pass
the library's first (automatic), then a series', then a project's.
"""
import os, re, importlib

HERE = os.path.dirname(os.path.abspath(__file__))
THAI = re.compile('[฀-๿]')
SUPPORTED = ('th',)
_mods, _lex_cache = {}, {}


def lang_of(line_or_text, default=None):
    """The localization language of a line ({'lang': 'th-TH', ...} or its text): 'th', or None when no rules apply."""
    if isinstance(line_or_text, dict):
        lang = (line_or_text.get('lang') or default or '').lower().replace('_', '-').split('-')[0]
        if lang in SUPPORTED: return lang
        if lang and lang not in ('', 'auto'): return None   # an explicit other language: leave it alone
        line_or_text = line_or_text.get('text', '')
    elif default:
        d = default.lower().split('-')[0]
        return d if d in SUPPORTED else None
    return 'th' if THAI.search(line_or_text or '') else None


def _rules(lang):
    if lang not in _mods: _mods[lang] = importlib.import_module(f'{__name__}.{lang}')
    return _mods[lang]


def load_lexicon(path):
    """A lexicon file → {written: (say, sub)}. Raises ValueError with the line number for a malformed row."""
    path = os.path.abspath(path)
    if path in _lex_cache: return _lex_cache[path]
    out = {}
    with open(path, encoding='utf-8') as f:
        for i, raw in enumerate(f, 1):
            row = raw.rstrip('\n').rstrip('\r')
            if not row.strip() or row.lstrip().startswith('#'): continue
            cols = row.split('\t')
            if len(cols) < 2 or not cols[0] or not cols[1]:
                raise ValueError(f'{path}:{i}: expected  written<TAB>say[<TAB>sub], got {row!r}')
            out[cols[0]] = (cols[1], cols[2] if len(cols) > 2 and cols[2] else cols[0])
    _lex_cache[path] = out
    return out


def lexicon(lang, extra=()):
    """The library's word swaps for lang, then each extra file in order (a later one wins)."""
    merged = {}
    base = os.path.join(HERE, f'{lang}_words.tsv')
    for p in ([base] if os.path.exists(base) else []) + list(extra or ()):
        merged.update(load_lexicon(p))
    return merged


def localize(text, lang, form='say', lexicons=()):
    """text in form 'say' (numbers as words, for the voice) or 'sub' (digits kept, for subtitles). Unknown languages: unchanged."""
    if form not in ('say', 'sub'): raise ValueError(f"form must be 'say' or 'sub', got {form!r}")
    if lang not in SUPPORTED or not text: return text
    lex = lexicon(lang, lexicons)
    if lex:
        pat = re.compile('|'.join(re.escape(w) for w in sorted(lex, key=len, reverse=True)))
        text = pat.sub(lambda m: lex[m[0]][0 if form == 'say' else 1], text)
    for rule in _rules(lang).RULES:
        text = rule(text, form)
    return text


def line_forms(line, lexicons=(), default_lang=None):
    """A lines.json / cues.json entry → (sub, say). A line's own "say" wins over the rules; a line in a language without rules gets
    (text, say or text)."""
    text = line.get('text', '')
    lang = lang_of(line, default_lang)
    if not lang: return text, line.get('say') or text
    return localize(text, lang, 'sub', lexicons), line.get('say') or localize(text, lang, 'say', lexicons)
