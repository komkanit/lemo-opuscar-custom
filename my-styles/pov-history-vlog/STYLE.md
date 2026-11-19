# POV History Vlog · POV vlog ย้อนยุค — Style Prompt

Made from a blank page; techniques from Manga Panels (`manga-panels`) in Lemo-Opuscar.
Default size: 1080×1920.

> Someone who lived in the past films their own day like a modern vlogger: selfies at arm's length, first-person shots of their own hands at work, a clock in the corner, a location pin, hand-written stickers and arrows, captions on every phrase. The pictures are photoreal stills made for the film, the phone is code: it shakes in the hand, cuts on the jump, punches in on the detail. Under the fun sits a real story with one point, and the facts that prove it; when the vlogger says something they could not have known, the film admits it: a yellow tag "from the future", and the date under the pin jumps forward to the year it was found.
> References (grammar only): phone vlogs and short-video editing (jump cuts, punch-ins, sticker arrows, burned-in captions); "a day in the life" timelines; museum labels for the facts. Copy no channel, title template, creator, character or music; never name a real creator or channel in the film.

## 1. Essence, and what it is not

- **A person, not a period.** One named person of the era (a worker, a sailor, a cook, an apprentice) is the camera. We see their face in selfies and their hands in first person; we never see the past from nowhere.
- **A day with a spine.** The clock runs through one day, but every beat serves one sentence the film is about (written down before any line: e.g. "the pyramids were built by ordinary people who left their names behind"). Plant something early, pay it off at the end.
- **Facts that surprise, proven.** Each film carries a handful of facts that change what the viewer pictured, every one with a source in the film's `FACTS.md`. The strongest fact is the climax, not the opening.
- **From the future.** What the vlogger could not know (what was found later, what it became) is marked: the yellow tag and the date jump. This is how the film crosses from their day to ours.

Not a slideshow of pretty AI pictures with timestamps (no spine, no person), not a documentary narrator (the vlogger speaks as themselves, in the present tense of their day), not AI video (nothing walks or lip-syncs), not a "1 day in the life of…" title card copied from another channel.

## 2. Materials & rendering

**Stills** (✦ image generation, rule): every picture is a photoreal still made for this film with the user's image tool (ChatGPT through Chrome, `core/assets/chatgpt_images.py`, TECHNIQUE.md §11; or the Codex CLI; or the user's own app with our prompts). Without one, a film in this style cannot start; code never draws stand-in people or places. Before generating, tell the user how many images and of what (a 60 s film takes about 10–12, plus one reference).

- **Two kinds of shot, alternating**: *selfie* (arm's-length front camera, the vlogger's face in the upper middle, their arm running to a lower corner) and *first person* (their own hands and forearms in the lower part of the frame, doing the work). Group selfies, a shot over the shoulder of someone else, and one wide establishing view are allowed.
- **Recurring faces**: one chat per film; the first selfie is the vlogger's reference, and a reference image for each other recurring person (a friend, a boss). Every later prompt names them and their identifying details (hair, an amulet, a bead bracelet).
- **Continuity is checked**: an injured person stays injured, the hour's light matches the clock. A wrong image is fixed with the image's own Edit (keep everything, change one thing), not by a new prompt.
- **Style suffix** (appended to every prompt):

> Photorealistic, looks exactly like a frame from a modern smartphone vlog: wide-angle phone lens, natural light, slight lens distortion at the edges, crisp detail, realistic skin with sweat and dust, authentic {culture, period} clothing, tools and architecture at {place, date}, nothing modern anywhere in the scene, no phone or camera visible. Original people, not resembling any real person or actor. Tall vertical image. aspect ratio 9:16. no text, letters or watermark in the image.

- Every image asks for "room for captions in the lower third". Writing in the scene (papyrus, signs, painted marks) is asked as "marks, not readable text"; all readable text is set in code.

**The phone, in code** (rule): each still is placed by a camera that never shows an edge (the focus is clamped so the picture always covers the frame, with room for the shake), with a slow push in over the shot, a handheld shake (a few sines per axis, drift plus jitter), and a punch-in on a detail when the line names it. A vignette and a dark band behind the top UI. Night shots breathe with the lamp (a soft dark wash that comes and goes).

**Archive look** (a variation for the payoff): the same still drawn as an old photograph: sepia, low saturation, a warm dark vignette, moving paper grain, a rare exposure flicker.

## 3. Colour logic

| Name | Value | Use |
|---|---|---|
| CAPTION | `#FFFFFF` with `#141414` outline | every caption and the UI text |
| STICKER | `#FFE14D` with `#141414` outline | hand-written stickers, arrows, the box around a detail, the "from the future" tag and the future date, the end card |
| REC | `#FF3B30` | the blinking record dot; the clock turns `#FF6B5E` on the accident |
| ALARM | red wash `rgba(220,30,20,…)` | the flash on a shock cut, fading over a second |
| HOOK | white card, `#111` text | the opening POV card only |

- The pictures keep their own natural colour; no grade over the whole film except the archive look.
- Yellow means "added by the editor" (stickers) or "from the future" (tag and date); white means "said now".

## 4. Type & subtitles

- **Captions**: Kanit Black, 78 px at 1080 wide for Thai (72 for Latin), white, a dark outline of 20 % of the size, centred, the block centred at 66.5 % of the frame height; 1–2 lines per phrase (`|` breaks lines), shrunk to fit 940 px. They pop in (scale 0.8 → 1 with a slight overshoot, 0.16 s) and change on the voice's phrases; the last phrase of a line holds to the cut. They are the voice's own subtitles: timed by the voice and exported as `.srt`, not by reading speed.
- **Hook card** (first 3.4 s): Kanit Black on a white rounded card, tilted −1.5°, at 47 % height (on the chest, between face and captions): "POV: คุณคือ…" / "POV: you …". Never a "1 day in the life of…" card.
- **Vlog UI** (top, inside a dark band): blinking REC dot + "DAY 1" (Kanit Black 46 px) at the left, the clock at the right, a location pin with "place · date" (Kanit SemiBold 34 px) under it.
- **Stickers**: Mali Bold 62 px, yellow with a dark outline, tilted a few degrees, popping in; an optional hand-drawn curved arrow that draws itself in 0.25 s to the thing named. Stickers and boxes are pinned to the picture (they move with the camera).
- **From the future**: a yellow rounded tag with ▶▶ and "ข้อมูลจากอนาคต" / "from the future" under the pin; with a year, the pin text itself turns yellow and becomes the year and the find ("ค.ศ. 1837 · พบชื่อนี้ในพีระมิด").
- **End card**: yellow card with a dark border, Kanit Black, at 62 % height, replacing the captions for the last ~3.5 s: the question that leads to the next film.
- Thai by default (the film's language); Latin uses the same fonts. Fonts: Kanit and Mali, both OFL.

## 5. Motion quality

- **Snappy edits, slow pictures.** Inside a shot everything is slow (a push of 3–8 %, the shake); between shots everything is fast (a jump cut that lands 7 % zoomed in and snaps back in 0.22 s, a white flash of 0.1 s).
- **Punch-in**: 0.24 s with an overshoot, to 1.2–1.3×, on the detail the line names, then a box or a sticker on it.
- **Pops**: captions, stickers, tags and cards enter with a small overshoot; nothing slides in from the side.
- **The shock cut**: red flash, the shake ×3 decaying over 1.4 s, the REC dot stops blinking, the clock goes red, the music stops.
- **The future glitch**: 0.4 s of torn horizontal slices, a colour-fringe double and scanlines, then the tag and the date change.
- **The loop**: the last 0.3 s fade to white, so the end flows back into the first selfie.

## 6. Camera grammar

- The vlogger holds the camera: selfie or first person. A third-person view is never "objective"; it is still their phone, handed to someone or propped.
- A punch-in replaces a cut to a close-up. A detail the voice names gets a punch-in or a box, not a new shot.
- A new shot is a new time of day or a new place; the clock in the corner changes with it.
- The same still may be used twice when the second time means something (the archive look over the scene we just saw).

## 7. Sound palette

- **The voice leads**: one first-person voice (ElevenLabs, the user's choice per series), casual, present tense; at least 6 dB above everything else on every line (`tools/mix.py` prints it per line). Music ducks about 60 % and room tone 40 % under the voice.
- **Score**: a light hand-percussion groove of the place (for Egypt: darbuka doom-tak, shaker, a harp ostinato in D Hijaz, pizzicato bass) under the day; silence on the shock; a lone instrument for the aftermath; quiet for dusk and night; a bell swell (hand chimes) on every fact from the future; under the end card, the closing chord and the groove once more, softly.
- **Room tone per shot**: wind, ovens and crackle, a work site with knocks, crickets, an old projector's hum and crackle for the archive.
- **Effects on the picture's events**: a whoosh into every cut, a pop for every sticker, a whoosh and thump for a punch-in, a deep thump, rumble and stone clack on the shock, a reversed whoosh and torn noise on the future glitch.
- Loudness −14 LUFS, true peak ≤ −1 dBTP (`mux.sh`).

## 8. Native moves

1. **The date jump**: a fact from the future arrives with the glitch, the yellow tag, and the date under the pin rewriting itself to the year it was found. The signature.
2. **Plant and pay off**: something named early ("remember this name") comes back as the last line.
3. **Punch, box, number**: the voice names a weight or a count, the camera punches in, a yellow box and a number sticker land on it.
4. **The shock cut**: the day breaks once (an accident, a raid, a storm), in red, and the music stops.
5. **Archive reveal**: the scene we saw becomes an old photograph as the voice says what it became.

## 9. Pitfalls of the medium

- **A day without a point.** A clock and nice pictures are not a film. Write the one sentence first; cut beats that don't serve it; end on the message, not a generic question.
- **Unsourced facts.** Every number and claim has a source in `FACTS.md`; say "about", "almost", "evidence of" where the sources do.
- **Faces drift.** Keep one chat, reference images, and the identifying details in every prompt; check each image and fix with the image's own Edit.
- **Continuity.** An injured friend can't appear whole at dinner; the light must match the clock.
- **Text in images.** Generators write fake letters; ask for marks, never text, and set every readable word in code.
- **Stickers that collide.** Pin stickers to the picture, then check a still of every shot: nothing over the face, the top UI, the captions or off the edge.
- **Real people.** No real person's likeness; historical people are invented likenesses, said so in `FACTS.md`. Thai history: tell it through commoners, not the royal court.
- **Copying a channel.** No other channel's title template, thumbnail layout or catchphrase.

## 10. Engine

- `demo/page/film.js` (2D canvas): the camera (push, clamped focus, shake, punch-in), cut flashes, lamp breath, archive look, glitch; UI, hook card, captions, stickers and arrows, box, future tag, end card; `window.TEXTS` for readcheck (captions marked `pass`).
- `demo/page/shots.json`: the film as data: per shot the image, the voice line, the clock, push and focus, room tone, captions per language, stickers, box, punch, future; plus the place, the hook, the tag and the end card.
- `demo/tools/timeline.py`: shots + the voice's durations → `timeline.<lang>.json` (times of everything, events for the mix) and subtitle cues (`--sub en` for a second language on the same timing).
- `demo/tools/mix.py`: score (sampler), room tone and effects (sfx) from the events, voice-first ducking, per-line voice margin.
- `demo/build.sh`: timeline → mix → `core/render/video.mjs` → `mux.sh` → `srt.py`.
- Technique base: `$LIB/styles/manga-panels/` (stills from an image generator brought to life in code).

## 11. Variation space

Free in every film: the person, era and place (any culture; Thai topics through commoners), the one-sentence message, the facts, the number and order of shots (about 10–12 for 55–60 s), the clock, which native moves appear besides the date jump, the shock (or none), the voice, the instruments of the place, the end-card question, the language (one language per channel; another language as an `.srt`, or a separate build with its own voice).
