# มุ้งขาว · The White Net — how the demo film was made

One example among many. Don't reuse its story, arc, shots, props or timings.

24 s, 1080×1920, 24 fps. No voice; a title and two captions; night sounds and a sparse score.

## Story

A woman alone in a teak house at night hears the mosquito net move though there is no wind. The lamp gutters and dies. When it relights, the shot is exactly the one we saw before, and a pale woman is standing inside the net. She does not see it.

## Shots

| # | t | Shot | Camera | What moves | Text |
|---|---|---|---|---|---|
| 1 | 0–4.5 | the empty room | slow push | lamp, fog | title มุ้งขาว / THE WHITE NET, 0.6–4.0 |
| 2 | 4.5–10.5 | the woman by the lamp, listening | locked | lamp, fog, her breath | คืนนั้น… มุ้งขยับทั้งที่ไม่มีลม |
| 3 | 10.5–15 | the net, closer | drift right + push | the net sways; the flame grows ragged | ไม่มีใครอยู่ในห้องนั้น… นอกจากเธอ |
| 4 | 15–16.6 | shot 2's framing | locked | the flame shrinks and dies; print-black | — |
| 5 | 16.6–24 | **same shot twice**: shot 2 again; the figure stands in the net | locked | lamp relights ragged, steadies, dims out on the last second | — |

Print damage rises from 0.3 (opening) to 0.75 (end).

## Pictures

Three ChatGPT images (prompts in `demo/images.json`): the empty room (`img/house.png`, 1242×2208, 1.15× the frame), the woman on green (`img/woman.png`, keyed by `tools/key.py`, her own lamp erased because the plate has one), and an edit of the room with the figure in the net (`img/house-ghost.png`). The edit is used only inside `img/ghost-mask.png`: the difference between the two images in the net area, closed, filled and feathered by 18 px, so nothing else the edit moved can show.

## Score and sound (`demo/mix.py`)

Synthesised night bed (three cricket voices, frogs, brown-noise air) that fades in, thins in shot 3, drains to nothing for the lamp-out and creeps back after the reveal; a far dog howl (shot 1), a tokay gecko twice (shot 2), a floorboard creak; a detuned low drone on D; a low erhu line standing in for a ซออู้ under the net (A3, then slipping to G#3); one low marimba note standing in for a ระนาดทุ้ม 2.3 s after the light returns; a far gong at the open; the flame sputter as it dies and relights. Mastered by `core/render/mux.sh` to −14 LUFS.

## Build

`demo/build.sh` (set `LIB`; output goes to `$OUT`, default `../build`): mix → `core/render/video.mjs` at 24 fps 1080×1920 → `core/render/mux.sh` with grain 0 (the print pass has its own).

## Which file draws what

- `src/engine.js`: the whole picture in one WebGL2 pass: plate with camera, cloth sway, the same-shot-twice plate inside its mask (changed pixels drained of colour and lifted), breathing lamp relight, fog behind and in front of figures, keyed figures with contact shadow and breath, the code flame, the colour print (cyan fade, crushed brown blacks, contrast, halation, vignette), the title on the print without fade, colour grain, scratches, dust. `flicker(t, ragged)` and `weave(frame, dmg)` drive the lamp and the gate.
- `src/text.js`: captions in screen space (`caption`), the horror-poster title (`horrorTitle`), the place-and-time stamp (`stamp`).
- `src/film.js`: the timeline above; `src/frames.js`: the two style frames (`?frame=caption`, `?frame=title`, with type-test query options).
- `tools/key.py`: green key with spill removal, erase boxes and crop.

## Narrated versions

`?v=tonce` / `?v=hammy` (and `VOICE=tonce|hammy sh build.sh`) add a narrator: three lines (`voice/<v>/lines.json`, ElevenLabs eleven_v4, stability 0.75) starting at `voice/starts.json` (5.2, 11.1, 20.2 s). Each caption follows its line (from 0.1 s before to 0.5 s after, at least 3.9 s), and a third line, บางคืน… มุ้งก็ไม่ได้กางไว้ให้คนเป็น, comes 3.6 s after the figure appears, once the viewer has found it. In the mix every line is levelled to the same loudness and everything else ducks about 8 dB under it (6.7 dB or more over the bed on every line). Films: `test-tonce.mp4`, `test-hammy.mp4`.
