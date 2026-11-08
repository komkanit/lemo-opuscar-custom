"""Localize a script for voice and subtitles.

  python core/tts/localize.py lines.json [out.json] [--lexicon file.tsv …] [--lang th]
  python core/tts/localize.py --text "เจอกัน 2:00pm" [--lang th]

lines.json (or cues.json) is a list of entries with "text". For each entry in a language with rules (Thai: "lang": "th", or Thai letters
in the text), "text" becomes the subtitle form (2:00pm → บ่าย 2 โมง) and "say" the spoken form (บ่ายสองโมง), unless the entry already has a
"say". Other entries are copied unchanged. Without out.json the result is printed. Run it again on its own output and nothing changes.
The TTS tools apply the same rules to "say" by themselves; run this to get the subtitle form for Thai subtitles and captions.
--lexicon  word swaps (written<TAB>say[<TAB>sub]) on top of the library's, in order, a later file winning: a series', then a project's.
--lang     treat every entry without its own "lang" as this language.
Rules and how to add one: core/tts/locales/th.py; run its examples with python core/tts/locales/test.py.
Exit codes: 0 done; 1 bad input (a malformed lexicon row, an entry without "text").
"""
import sys, os, json, argparse
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from locales import line_forms, localize, lang_of


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('lines', nargs='?'); ap.add_argument('out', nargs='?')
    ap.add_argument('--text'); ap.add_argument('--lang'); ap.add_argument('--lexicon', action='append', default=[])
    a = ap.parse_args()
    for p in a.lexicon:
        if not os.path.exists(p): sys.exit(f'localize.py: lexicon not found: {p}')
    try:
        if a.text is not None:
            lang = lang_of({'text': a.text, 'lang': a.lang})
            if not lang: print(f'(no rules for this text{" in " + a.lang if a.lang else ""}; unchanged)', file=sys.stderr)
            print('sub:', localize(a.text, lang, 'sub', a.lexicon)); print('say:', localize(a.text, lang, 'say', a.lexicon)); return
        if not a.lines: ap.print_usage(sys.stderr); sys.exit(2)
        lines = json.load(open(a.lines, encoding='utf-8'))
        if not isinstance(lines, list): sys.exit('localize.py: expected a JSON list of entries with "text"')
        out = []
        for i, L in enumerate(lines):
            if not isinstance(L, dict) or 'text' not in L: sys.exit(f'localize.py: entry {i} has no "text"')
            sub, say = line_forms(L, a.lexicon, a.lang)
            M = dict(L)
            if lang_of(L, a.lang):
                M['text'] = sub
                if say != sub: M['say'] = say
            out.append(M)
    except ValueError as e: sys.exit(f'localize.py: {e}')
    s = json.dumps(out, ensure_ascii=False, indent=1)
    if a.out:
        open(a.out, 'w', encoding='utf-8').write(s + '\n')
        changed = sum(1 for x, y in zip(lines, out) if x != y)
        print(f'localize.py: {changed} of {len(out)} entries localized → {a.out}')
    else: print(s)


if __name__ == '__main__':
    main()
