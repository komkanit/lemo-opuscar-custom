# Make a series

A series is several films with the same characters, world, plot and style, made over many sessions. Its **series bible** holds everything that must stay the same from one episode to the next: who the characters are and how they look and sound, the main plot and where it has got to, the style and the format. You plan the bible with the user once, and every later session reads it before it makes the next episode. It lives outside the library and never changes it.

Use this guide when the user wants a series, several episodes, a season or recurring characters ("a series about…", "episode 2 of…", "make the next episode", "ทำซีรีส์", "ตอนต่อไป", "做一个系列", "下一集"), or names a series in `my-series/`. Each episode is a film made with [`AGENTS.md`](AGENTS.md) as usual, with the exceptions this guide gives.

Talk to the user in their language. Write the files in English, like the library, with names and every line of dialogue in the film's language.

## Where it lives

Bibles live in **`my-series/`** at the library root (`$LIB/my-series/` in skill mode). The folder is gitignored: bibles stay on this machine and are never pushed, and a pull leaves them alone. `my-series/README.md` lists every series, one row each: English and original name, slug, style, episodes made, one line on what it is, and the folder when it isn't in `my-series/`. It's how a later session finds a series by name. If the user wants a bible kept in another folder (inside their own project, say), keep it there and still add its row, with the full path.

Each series has its own folder, `my-series/<slug>/`:

| File | What it holds |
|---|---|
| `series.json` | what the tools and later sessions read (below) |
| `SERIES.md` | the bible, in the sections below |
| `CONTINUITY.md` | the running list of facts the films have established: who knows what, who has met whom, what was lost, broken, won or revealed, and in which episode. Newest last |
| `characters/<id>/MODEL.md` | one character's look: proportions, silhouette, palette (hex), costume, expressions, how they move, what never changes, what to avoid |
| `characters/<id>/model-sheet.jpg` | the approved model sheet: turnaround, 3–4 expressions, 2–3 key poses, palette (DIRECTOR.md §5) |
| `characters/<id>/rig.js` (or the files it needs) | the code that draws the character, as approved on the model sheet. Episodes copy it, never edit it here |
| `characters/<id>/voice.wav` | the approved voice audition, a short line in the film's language, for comparing later episodes by ear |
| `shared/` | what every episode reuses: the opening title and end card code, the theme motif as score events (`theme.json`), fonts, the user's logo, recurring sets or props, and their `CREDITS` |
| `lexicon.tsv` | the series' word swaps for the voice (names, places, brand words the voice gets wrong): `written<TAB>say[<TAB>sub]`, as in `core/tts/locales/` |
| `episodes/EP01.md`, `EP02.md`… | one per episode made: logline, summary, the arc beat it covered, new continuity, where the project folder and the film are |

`series.json`:

```json
{
  "slug": "night-market", "en": "Night Market", "name": "ตลาดกลางคืน",
  "line": "one sentence on what the series is",
  "style": { "slug": "impasto", "source": "library", "library_version": "fc88235" },
  "format": { "size": "1920x1080", "fps": 24, "length_s": [60, 90], "language": "th",
              "subtitles": true, "opening": "shared/title.js", "ending": "shared/endcard.js", "theme": "shared/theme.json" },
  "characters": [
    { "id": "mali", "name": "มะลิ", "role": "lead", "model": "characters/mali/MODEL.md", "rig": "characters/mali/rig.js",
      "voice": { "engine": "elevenlabs", "voice": "<voice id>", "model": "eleven_v4", "lang": "th",
                 "stability": 0.5, "similarity": 0.8, "seed": 11 } },
    { "id": "narrator", "name": "Narrator", "role": "narrator",
      "voice": { "engine": "edge", "voice": "th-TH-PremwadeeNeural", "rate": "+0%" } }
  ],
  "lexicon": "lexicon.tsv",
  "episodes": [ { "n": 1, "title": "…", "status": "delivered", "file": "episodes/EP01.md" } ],
  "created": "2026-11-08", "library_version": "fc88235"
}
```

- `style.source` is `library` or `my-styles` (the user's own style, found through `my-styles/README.md`). A series has one style; an episode in another style is a spin-off, not an episode.
- `voice.engine` is `kokoro` (`core/tts/tts.py`), `edge` (`core/tts/tts_zh.py`) or `elevenlabs` (`core/tts/tts_11labs.py`); the other fields are that tool's line fields, copied into every line the character speaks. A character with no lines has no `voice`.
- `library_version`: `git -C "$LIB" rev-parse --short HEAD`, or the plugin version when `$LIB` isn't a git clone.

`SERIES.md`, the bible, in these sections:

1. **Premise.** Logline, and in a paragraph what the series is about and what it is not.
2. **World.** Where and when; the recurring sets, each in a line or two with what it looks and sounds like; the rules of the world.
3. **Characters.** For each: what they want, what stands in the way, their flaw, how they talk (a few typical lines), how they change across the season, who they are to the others. Their look is in `MODEL.md`.
4. **Main plot.** The season arc: setup → turns → ending, then one row per planned episode with the beat it must cover. Planned episodes may change; delivered ones are history.
5. **Tone.** Comedy, drama, wonder…; what the audience should feel; what never happens in this series.
6. **Recurring elements.** The opening and the ending, the theme motif, a catchphrase or running gag, a signature shot or transition. What each episode must include, and what it may vary.
7. **Style notes.** Only what this series adds on top of the style's `STYLE.md` (a palette per character, a set's light). `STYLE.md` itself stays as it is.
8. **Format.** Length, size, frame rate, language, subtitles, voice engine.

## 1. Plan the series

Ask the way MY-STYLES.md §2 does: **one question per message** with `AskUserQuestion`, 2–3 options with your recommendation first, and **Free conversation** (in their language) as the last option; "you decide" fills the rest with your recommendations. About ten questions at most. Don't ask what they've already said.

1. **Style.** A library style (**Finding the style** in `AGENTS.md`) or one of their own.
2. **Premise and tone**, and who it's for.
3. **Format**: episode length (DIRECTOR.md §1: 60–90 s is a good episode; longer costs more time and tokens per episode), how many episodes are planned, size, language, voice or no voice.
4. **Cast**: the lead and at most three or four others for the first season, each with a want, a flaw and a look in a line. More characters can arrive in later episodes.
5. **The main plot**: the season arc and one beat per episode. Offer two or three arcs built from their premise.
6. **Recurring elements**: the opening, the ending, a theme, a running gag.
7. **The name** and the slug.
8. Their own material: logos, fonts, a voice recording, pronunciations of names.

When everything is decided, show a short summary in their language and **wait for their OK**.

## 2. Prove the cast

Make the series' first project folder (`films/<slug>-ep01/` in a clone, `<slug>-ep01/` in the user's folder in skill mode) and work there until §3.

- **Model sheets**: one per character, drawn with the real drawing code in the series' style (DIRECTOR.md §5), and one frame with the whole cast together at the same scale. Check them against `STYLE.md`. In this flow you may read the style's `DEMO.md` (and, in skill mode, get its source with `setup.sh demo <slug>`) before any treatment, to learn how it draws characters.
- **Voice casting**, for each speaking character: two or three candidate voices, each reading the same short line in character, in the film's language. Engine as the user chose; ElevenLabs only with their API key and their agreement (TECHNIQUE.md §4), and say how many characters the auditions will cost first (`tts_11labs.py --dry-run`). Check every audition with `core/tts/asr_check.py`, then play them to the user as files.

**Show the sheets and the auditions, and wait.** Two rounds of notes; if a character still isn't right, say so and suggest a simpler design.

## 3. Write the bible

When they approve: write `series.json`, `SERIES.md`, an empty `CONTINUITY.md` (a title and nothing established yet), each character's `MODEL.md`, `model-sheet.jpg`, the approved `rig.js` and `voice.wav`, `lexicon.tsv` if names need it, and what `shared/` holds so far. Check that the slug is free in `my-series/README.md`, copy the folder to `my-series/<slug>/` (or where they want it) and add its row, creating the README if it's missing. Tell them where it is and how to use it ("Make episode 1 of <name>", "make the next episode of <name>").

Episode 1 may follow in the same session, through §4; the opening, the ending and the theme are usually built with it, then saved into `shared/`.

## 4. Make an episode

1. **Read the bible**: `series.json`, `SERIES.md`, `CONTINUITY.md`, the last two `episodes/EP*.md`, the style's `STYLE.md`, and each character's `MODEL.md` for the characters in this episode. Look at the model sheets.
2. **The brief** (AGENTS.md, Workflow step 1) asks only what's new: what this episode is about if the user has a wish (otherwise the next beat of the main plot), a new character or set, a change of length. Style, format, cast and voices come from the bible; don't ask again.
3. **Treatment** (DIRECTOR.md §4), with three candidate structures, as for any film. Add at its top:
   - the arc beat this episode covers, and how the episode ends differently from how it began;
   - the continuity it relies on (rows of `CONTINUITY.md`) and what it will add;
   - which recurring elements appear and how this episode varies them.

   An episode doesn't contradict `CONTINUITY.md` or the bible. If the user's wish would, say so in one line and offer a way that doesn't, or the change to the bible it would need.
4. **Produce** as usual (AGENTS.md, Workflow), with these exceptions:
   - Copy each character's rig and `shared/` into the project folder and use them as they are. The rule against reusing demo code is about the library's demos: the series' own code is meant to be reused. A character never looks different between episodes unless the bible changed.
   - Every line of dialogue takes its speaker's `voice` fields from `series.json`, with the same engine, voice, model, settings and seed. Pass the series' lexicon to the TTS tool and the speech check (`--lexicon <series>/lexicon.tsv`, then the project's own if it has one). Compare one line of each character by ear with its `voice.wav`.
   - Opening, ending and theme from `shared/`; the theme motif may be re-orchestrated for the episode's mood but stays recognisable.
5. **Checks**: DIRECTOR.md §11 as usual, plus:
   - **Not the last episode again.** Compare with the previous episode (its `EP*.md` and film): structure, signature shot, camera path, score shape beyond the theme, the setting of the turn. At least three of the five must differ. The shared opening and ending don't count.
   - Each character matches its model sheet at the same scale (put a frame next to `model-sheet.jpg`).
   - No contradiction with `CONTINUITY.md`.
   - *Not the demo again* (DIRECTOR.md §11) still compares the episode with the style's demo, as for any film.

## 5. After delivery: update the bible

Once the episode is delivered, update the bible in place, and tell the user what you changed:

- `episodes/EP<n>.md`: logline, a short summary, the arc beat, what changed, the project folder and the film.
- `CONTINUITY.md`: the new facts, each with the episode number.
- `series.json`: the episode's row with `status: "delivered"`.
- `SERIES.md` §4: mark the beat as done; if the episode moved the plot away from the plan, update the planned rows after it.

Code built for this episode that later ones will need (a new set, a new character's rig, a better version of the title) goes into `shared/` or `characters/` **only when the user agrees**, as does any change to a character's look or voice, a new character, or a change to the plan. A new character gets a `MODEL.md`, a model sheet and, if they speak, a voice audition, as in §2.

## 6. Change the series

- **A character's look or voice**: change `MODEL.md`, the rig and the model sheet (or re-cast the voice with new auditions), and add a row to `CONTINUITY.md` ("from EP05: new coat"). Episodes already made stay as they are.
- **The plot**: change `SERIES.md` §4 and the planned rows. What delivered episodes established stays true unless the user wants a retcon; then record it in `CONTINUITY.md`.
- **The style**: a different style is a new series, or a deliberate special episode the user names as one.
- **After a library update**: if the style's `STYLE.md` changed since `style.library_version`, mention it once and offer to bring the useful fixes in. Don't change the series without asking.

The films are the user's: no LemoLab credit, no watermark.
