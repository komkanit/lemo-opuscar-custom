# POV: Pyramid Worker · POV คนงานสร้างพีระมิด — how the demo film was made

One example among many. Don't reuse its story, arc, shots, props or timings.

60.9 s, 1080×1920, 30 fps. Thai voice (ElevenLabs, Bankky) and burned-in Thai captions; English subtitles as `test.en.srt` on the same timing. Made in `films/pov-pyramid` (v1, a looser first cut, kept in its `v1/`).

## Message

The pyramids were not built by nameless slaves, but by ordinary people who left their names and their records behind, and we can still read them.

## Story

Iry, a paid worker at Giza around 2560 BC, vlogs his day. Breakfast is his pay (bread and beer). His crew is called "Friends of Khufu": remember the name. They haul 2.5-tonne blocks over wetted sand; at the harbour he points at the white casing the pyramid will wear for 3,800 years as the tallest thing on Earth. At 13:10 a block pins his friend Neb's leg; a doctor splints it (they even did brain surgery). At dusk the crew paints its name on a block that will sit deepest inside: from the future, 1837, the name is found. The boat captain Merer writes his log every day: from the future, 2013, it is the oldest papyrus with writing ever found. In bed Iry closes: next time you see a pyramid, remember, our names are inside. End card: whose life next?

## Shots (Thai timing)

| # | t | Image | Clock | Native move / on screen |
|---|---|---|---|---|
| 1 | 0–5.8 | selfie_dawn | 05:12 | hook card "POV: คุณคือคนงาน สร้างพีระมิด" |
| 2 | 5.8–10.1 | bakery (first person) | 05:40 | stickers "ค่าแรง!" → bread, "+ เบียร์" → jar |
| 3 | 10.1–14.8 | crew_selfie | 06:15 | sticker "ทีม: เพื่อนของคูฟู" (the plant) |
| 4 | 14.8–20.4 | pov_rope (first person) | 09:30 | punch-box-number: punch to the block, "≈ 2.5 ตัน", "รวม 2.3 ล้านก้อน!", "แรงลาก ≈ ½" → the water |
| 5 | 20.4–26.3 | harbor_white | 11:00 | future tag (no year) |
| 6 | 26.3–29.5 | accident (first person) | 13:10 | shock cut |
| 7 | 29.5–34.1 | doctor (first person) | 13:30 | sticker "เฝือกไม้" |
| 8 | 34.1–39.3 | graffiti (first person) | 17:40 | date jump → ค.ศ. 1837 |
| 9 | 39.3–44.0 | merer_log | 20:30 | — |
| 10 | 44.0–51.8 | merer_log, archive look | — | date jump → ค.ศ. 2013; archive reveal |
| 11 | 51.8–60.9 | bed | 21:15 | the pay-off line; end card "ย้อนไปดูชีวิตใครต่อดี? คอมเมนต์มา"; white loop |

## Build notes

- `demo/build.sh` rebuilds everything from the saved images and voice (no generation, no TTS calls): `OUT=<folder> sh demo/build.sh`.
- Images: 10 stills + 1 reference made in one ChatGPT chat (`demo/images.json` has the prompts). The first round's dinner image showed the injured Neb unhurt and was fixed with an edit; v2 added harbor_white, graffiti, merer_log. Stored as JPG in `page/images` (`"img_ext": "jpg"` in `shots.json`).
- Voice: `demo/voice/lines.th.json` (Bankky `RwilAvCC3o05RLuACpAn`, eleven_v4, stability 0.45, 0.35 on the shock line); speech-checked with `asr_check.py` (Whisper spells กีซา as กิซ่า; the `asr` fields hold its spellings).
- Mix: voice margin 8.6–18 dB per line; −14.2 LUFS.
- readcheck: all non-caption texts pass after two fixes (the future tag moved earlier in shot 8; the end card held 3.5 s).
- Facts and sources: `demo/FACTS.md`.

## Which file draws what

- `page/film.js`: camera, cuts, lamp, archive, glitch, UI, hook, captions, stickers, box, future tag, end card.
- `page/shots.json`: the film as data. `tools/timeline.py`: timing. `tools/mix.py`: score, room tone, effects, mix.
