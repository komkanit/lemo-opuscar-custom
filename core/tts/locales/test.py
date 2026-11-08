"""Runs every rule's examples: python core/tts/locales/test.py   (exit 0 when all pass)"""
import os, sys, tempfile
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from locales import localize, line_forms, SUPPORTED, _rules, load_lexicon

bad = total = 0
for lang in SUPPORTED:
    for rule, examples in _rules(lang).EXAMPLES.items():
        for written, sub, say in examples:
            for form, want in (('sub', sub), ('say', say)):
                got = localize(written, lang, form, ()); total += 1
                if got != want:
                    bad += 1; print(f'FAIL {lang}/{rule} {form}: {written!r} → {got!r}, want {want!r}')

# lexicons: library swap, a later file wins, sub column, line "say" wins, other languages untouched
with tempfile.TemporaryDirectory() as d:
    a, b = os.path.join(d, 'series.tsv'), os.path.join(d, 'project.tsv')
    open(a, 'w', encoding='utf-8').write('# series\nมะลิ\tมะ-ลิ\nACME\tแอค-มี่\n')
    open(b, 'w', encoding='utf-8').write('ACME\tเอ-ซี-เอ็ม-อี\tACME™\n')
    checks = [
        (localize('ไป กทม. 2pm', 'th', 'say'), 'ไป กรุงเทพมหานครบ่ายสองโมง'),
        (localize('ไป กทม. 2pm', 'th', 'sub'), 'ไป กทม. บ่าย 2 โมง'),
        (localize('มะลิ ที่ ACME', 'th', 'say', [a, b]), 'มะ-ลิ ที่ เอ-ซี-เอ็ม-อี'),
        (localize('มะลิ ที่ ACME', 'th', 'sub', [a, b]), 'มะลิ ที่ ACME™'),
        (line_forms({'text': 'เจอกัน 7pm', 'say': 'เจอกันตอนค่ำ'}), ('เจอกัน 1 ทุ่ม', 'เจอกันตอนค่ำ')),
        (line_forms({'text': 'See you at 7pm'}), ('See you at 7pm', 'See you at 7pm')),
        (line_forms({'text': 'เจอกัน 7pm', 'lang': 'en-us'}), ('เจอกัน 7pm', 'เจอกัน 7pm')),
        (line_forms({'text': 'see you 7pm', 'lang': 'th'}), ('see you 1 ทุ่ม', 'see you หนึ่งทุ่ม')),
    ]
    for got, want in checks:
        total += 1
        if got != want: bad += 1; print(f'FAIL lexicon/lines: {got!r}, want {want!r}')
    open(b, 'w', encoding='utf-8').write('broken-row-without-tab\n')
    load_lexicon.__globals__['_lex_cache'].clear()
    try: load_lexicon(b); bad += 1; print('FAIL: a malformed lexicon row was accepted')
    except ValueError: pass
    total += 1

print(f'{total - bad}/{total} passed')
sys.exit(1 if bad else 0)
