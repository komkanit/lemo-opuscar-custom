"""Thai localization rules: how written Thai is said aloud, and how it is written in Thai subtitles.

Every rule turns a piece of text into two forms:
  sub  what the subtitle shows, digits kept:   2:00pm → บ่าย 2 โมง
  say  what the voice reads, numbers as words: 2:00pm → บ่ายสองโมง

To add a rule: write a function rule_<name>(text, form) that returns the text with its pattern replaced in that form, add it to RULES in the
order it should run, and give it EXAMPLES (input, sub, say). `python core/tts/locales/test.py` runs every example. Plain word swaps
(abbreviations, names, a word the voice gets wrong) need no code: add a row to th_words.tsv, or to a project's own lexicon.
"""
import re

_DIGIT = 'ศูนย์ หนึ่ง สอง สาม สี่ ห้า หก เจ็ด แปด เก้า'.split()
_UNIT = ['', 'สิบ', 'ร้อย', 'พัน', 'หมื่น', 'แสน']
_THAI_DIGITS = {0x0e50 + d: str(d) for d in range(10)}   # ๐–๙ → 0–9


def num(n):
    """A whole number → its Thai reading: 21 → ยี่สิบเอ็ด, 110 → หนึ่งร้อยสิบ, 2569 → สองพันห้าร้อยหกสิบเก้า. Above a million the groups repeat."""
    if n >= 10 ** 6:
        hi, lo = divmod(n, 10 ** 6); return num(hi) + 'ล้าน' + (num(lo) if lo else '')
    if not n: return _DIGIT[0]
    digits, out = str(n), ''
    for i, c in enumerate(digits):
        d, place = int(c), len(digits) - 1 - i
        if not d: continue
        if place == 1 and d <= 2: out += 'ยี่สิบ' if d == 2 else 'สิบ'
        elif place == 0 and d == 1 and n > 10: out += 'เอ็ด'
        else: out += _DIGIT[d] + _UNIT[place]
    return out


# ---------------------------------------------------------------- time of day (the six-hour clock)

def clock(h, m, form):
    """h 0–23, m 0–59 → the Thai six-hour clock.
    0 เที่ยงคืน · 1–5 ตี N · 6–11 N โมงเช้า · 12 เที่ยงวัน · 13 บ่ายโมง · 14–16 บ่าย N โมง · 17–18 N โมงเย็น · 19–23 (N−18) ทุ่ม.
    :30 is ครึ่ง (บ่าย 2 โมงครึ่ง, 1 ทุ่มครึ่ง, เที่ยงครึ่ง); other minutes are N นาที (ตี 5 45 นาที)."""
    say = form == 'say'
    n = num if say else str
    j = (lambda *p: ''.join(p)) if say else (lambda *p: ' '.join(p))
    if h == 0: base = 'เที่ยงคืน'
    elif h <= 5: base = j('ตี', n(h))
    elif h <= 11: base = j(n(h), 'โมงเช้า')
    elif h == 12: base = 'เที่ยงวัน' if m == 0 else 'เที่ยง'   # เที่ยงวัน on the hour; เที่ยงครึ่ง, เที่ยง 15 นาที
    elif h == 13: base = 'บ่ายโมง'
    elif h <= 16: base = j('บ่าย', n(h - 12), 'โมง')
    elif h <= 18: base = j(n(h - 12), 'โมงเย็น')
    else: base = j(n(h - 18), 'ทุ่ม')
    if m == 0: return base
    if m == 30: return base + (' ' if not say and base[-1].isdigit() else '') + 'ครึ่ง'   # ตี 5 ครึ่ง, บ่าย 2 โมงครึ่ง
    return j(base, n(m), 'นาที')


_D = '[0-9๐-๙]'
_AMPM = re.compile(rf'(?<![0-9๐-๙:.])({_D}{{1,2}})(?:[:.]({_D}{{2}}))?\s*([ap])\.?\s?m(?![a-z])\.?', re.I)   # 2pm, 2:30 PM, 2.30 p.m.
_24H = re.compile(rf'(?<![0-9๐-๙:.])({_D}{{1,2}})(?::({_D}{{2}})(?:\s*น\.)?|\.({_D}{{2}})\s*น\.)(?![0-9๐-๙])')   # 14:00, 14:00 น., 14.00 น. (14.00 alone is a decimal)


def rule_time(text, form):
    def ampm(mo):
        h, m = int(mo[1].translate(_THAI_DIGITS)), int((mo[2] or '0').translate(_THAI_DIGITS))
        if not (1 <= h <= 12 and m <= 59): return mo[0]
        return clock(h % 12 + (12 if mo[3].lower() == 'p' else 0), m, form)

    def h24(mo):
        h, m = int(mo[1].translate(_THAI_DIGITS)), int((mo[2] or mo[3]).translate(_THAI_DIGITS))
        if not (h <= 23 and m <= 59): return mo[0]
        return clock(h, m, form)
    return _24H.sub(h24, _AMPM.sub(ampm, text))


EXAMPLES_TIME = [
    # (written, sub, say)
    ('12:00am', 'เที่ยงคืน', 'เที่ยงคืน'),
    ('1:00am', 'ตี 1', 'ตีหนึ่ง'),
    ('5:00am', 'ตี 5', 'ตีห้า'),
    ('6:00am', '6 โมงเช้า', 'หกโมงเช้า'),
    ('11:00am', '11 โมงเช้า', 'สิบเอ็ดโมงเช้า'),
    ('12:00pm', 'เที่ยงวัน', 'เที่ยงวัน'),
    ('1:00pm', 'บ่ายโมง', 'บ่ายโมง'),
    ('2:00pm', 'บ่าย 2 โมง', 'บ่ายสองโมง'),
    ('4:00pm', 'บ่าย 4 โมง', 'บ่ายสี่โมง'),
    ('5:00pm', '5 โมงเย็น', 'ห้าโมงเย็น'),
    ('6:00pm', '6 โมงเย็น', 'หกโมงเย็น'),
    ('7:00pm', '1 ทุ่ม', 'หนึ่งทุ่ม'),
    ('8:00pm', '2 ทุ่ม', 'สองทุ่ม'),
    ('11:00pm', '5 ทุ่ม', 'ห้าทุ่ม'),
    # written other ways
    ('2pm', 'บ่าย 2 โมง', 'บ่ายสองโมง'),
    ('2:00 PM', 'บ่าย 2 โมง', 'บ่ายสองโมง'),
    ('2.00 p.m.', 'บ่าย 2 โมง', 'บ่ายสองโมง'),
    ('14:00', 'บ่าย 2 โมง', 'บ่ายสองโมง'),
    ('14.00 น.', 'บ่าย 2 โมง', 'บ่ายสองโมง'),
    ('๑๔:๐๐ น.', 'บ่าย 2 โมง', 'บ่ายสองโมง'),
    ('00:00', 'เที่ยงคืน', 'เที่ยงคืน'),
    # minutes
    ('2:30pm', 'บ่าย 2 โมงครึ่ง', 'บ่ายสองโมงครึ่ง'),
    ('7:30pm', '1 ทุ่มครึ่ง', 'หนึ่งทุ่มครึ่ง'),
    ('5:30am', 'ตี 5 ครึ่ง', 'ตีห้าครึ่ง'),
    ('12:30pm', 'เที่ยงครึ่ง', 'เที่ยงครึ่ง'),
    ('12:30am', 'เที่ยงคืนครึ่ง', 'เที่ยงคืนครึ่ง'),
    ('5:45am', 'ตี 5 45 นาที', 'ตีห้าสี่สิบห้านาที'),
    ('7:15pm', '1 ทุ่ม 15 นาที', 'หนึ่งทุ่มสิบห้านาที'),
    ('12:15pm', 'เที่ยง 15 นาที', 'เที่ยงสิบห้านาที'),
    ('13:05', 'บ่ายโมง 5 นาที', 'บ่ายโมงห้านาที'),
    # in a sentence, with and without spaces
    ('นัดกันตอน 2:30pm นะ', 'นัดกันตอน บ่าย 2 โมงครึ่ง นะ', 'นัดกันตอน บ่ายสองโมงครึ่ง นะ'),
    ('รถออก14.00 น.ตรง', 'รถออกบ่าย 2 โมงตรง', 'รถออกบ่ายสองโมงตรง'),
    ('เจอกัน2pmนะ', 'เจอกันบ่าย 2 โมงนะ', 'เจอกันบ่ายสองโมงนะ'),
    # left alone
    ('ราคา 14.50 บาท', 'ราคา 14.50 บาท', 'ราคา 14.50 บาท'),
    ('25:00', '25:00', '25:00'),
    ('13pm', '13pm', '13pm'),
]


RULES = [rule_time]
EXAMPLES = {'time': EXAMPLES_TIME}
