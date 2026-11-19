# Faded Thai Ghost Film · หนังผีไทยฟิล์มซีด — Style Prompt

Made from a blank page; techniques from Manga Panels (`manga-panels`) in Lemo-Opuscar, with the film print pass borrowed from 1920s Silent Film (`silent-film`).
Default size: 1080×1920.

> Photorealistic stills of an older Thailand (a teak house on stilts, a riverside sala, a temple yard at dusk, a rice-field road at night), printed on colour film that has faded for fifty years, and brought to life in code: the oil lamp breathes, smoke and fog drift, the layers of the picture slide past each other, and something in the picture changes when you look again. A Thai voice tells the story; big captions carry it on a phone.
> References (grammar only): 1970s Thai ghost-film prints (faded red-yellow colour, crushed brown blacks); modern Thai horror posters for the title (loopless worn white letters, a small red English line); campfire and radio ghost storytelling (one voice, the night around it); slow-cinema horror, where dread comes from holding still. Copy no film, poster, character, legend illustration or music; never name a real film, studio or person in the film.

## 1. Essence, and what it is not

- **Real-looking stills, alive in code.** Every shot is a photorealistic still (generated for this film), split into layers and moved by code: a slow camera, parallax between layers, practical light that breathes, fog, smoke, dust, rain. People in the picture do not walk or talk; they breathe and sway at most.
- **Faded colour film.** The whole film is one print of 1970s colour stock that has aged: the cyan dye has gone, so everything leans red-yellow; blacks are crushed and brown; grain, a little weave, rare scratches and dust. The only saturated colour is warm practical light: an oil lamp, a candle, a joss stick tip, a fire.
- **Dread from stillness and change.** Fear comes from what changes in a picture the viewer has already seen, from light going out and coming back, and from silence. Never a jump scare with a loud sting, never gore.
- **A voice and big captions.** One Thai narrator tells the story; every line is on screen in large captions for viewers with the sound off.

Not AI video (nothing walks or lip-syncs), not a slideshow (no shot holds without at least two things moving), not a clean modern horror grade (no teal-and-orange, no crisp digital blacks), not a found-footage tape (this is a film print, not a camcorder).

## 2. Materials & rendering

**Plates and layers** (rule)
- **Background plate**: a full-frame photorealistic still of the place, no people unless they are part of the set, generated at 9:16 or taller (a tilt needs a taller plate) and scaled to at least 1.15× the frame so the camera can move without showing edges.
- **Figure layers**: each person (and the ghost, when it is a figure in its own layer) generated on **flat pure green `#00FF00`**, lit from the same side as the plate's main light, keyed to alpha with a soft 1–2 px edge and the green spill removed. A figure layer gets a contact shadow on the ground, and the plate's grade before compositing, so it sits in the light of the place.
- **Foreground layer** (optional, often worth it): a door frame, a mosquito net, a post, banana leaves, a window shutter, keyed or cut from a plate; it moves fastest and is slightly soft.
- **At least two layers in every held shot**, so a camera move shows depth.

**Light** (rule): every shot names its practical sources (lamp, candle, moon, fire) with a position in the frame. Code relights the composite: a breathing intensity per source (two noise octaves, 0.6–3 Hz, plus rare dips), applied as a radial falloff from the source over the whole frame, so walls and faces brighten and darken with the flame. The flame itself is drawn in code over the source (a small teardrop with an orange core and yellow tip, wobbling), so it can flicker, dim and go out. Moonlight does not breathe.

**Atmosphere** (code): drifting fog in 2–3 noise layers at different depths; incense smoke as curling ribbons rising from a point; dust motes lit only inside light shafts; rain streaks and splashes when the story has rain. Atmosphere sits between layers (fog behind the figure, smoke in front), never as one flat overlay.

**Print pass** (borrowed from Silent Film's `engine/film.js`, rewritten for colour; rule):
- Fade: cyan dye loss (red and yellow lift, blue and green sink), saturation down about 35 % except warm light, highlights roll off to cream, blacks crushed to warm brown-black (never `#000`).
- Halation: a red-orange glow around every bright light.
- Colour grain in two octaves, stronger in the mids; slight gate weave (sub-pixel to 1.5 px); exposure flicker 1–3 %; a few short vertical scratches and dust specks, rare; vignette.
- Damage is a mood control: cleaner when the story is calm, more grain, weave and scratches as dread rises.

### Image generation (✦)

**An image generator is required.** Plates, figures and the ghost are generated for each film's own story, with the user's tool: ChatGPT through Claude in Chrome (`core/assets/chatgpt_images.py`, TECHNIQUE.md §11), the Codex CLI (`core/image/gen_image.py`), or another image app where the user makes the images from our prompts and file names. Without one, a film in this style cannot start; code never draws stand-in people or places. Before generating, tell the user how many images and of what.

**Pipeline**
1. References first: one **character reference** per person (half-body, face clear, the outfit that defines them) and, when the story has one, the **ghost reference**. Every later image of that person gets the reference attached and the same features written in the prompt (age, hair, face, clothes, one identifying item).
2. **Plates** without the cast; **figures** on flat green, in the pose and the lighting direction of the shot they go into.
3. **Same shot twice** (§8): the second image is an edit of the first ("keep everything exactly the same; only add …"). Code uses the edited image **only inside a feathered mask around the change**, so anything else the edit moved does not show.
4. No text, letters, signs, watermarks or logos in any image; all lettering is set in code.
5. Images are generated neutral and low-key; the faded look is applied by the print pass, never asked of the image generator.

- **Style suffix** (appended to every prompt):

> Photorealistic cinematic film still, Thailand in an earlier era, shot on 35mm with a normal lens at night or dusk, lit only by practical sources (oil lamps, candles, moonlight, fire), deep natural shadows, realistic skin and fabric, authentic Thai wooden architecture and props of the period, calm composition with room above the subject. Natural neutral colour, no colour grading, no film effects. Absolutely no text, letters, signs, watermark or logo. Original people, not resembling any real person or actor.

- **Prompt templates**: *plate* — "{place, era, time of night}. {where the light source is}. {what fills the foreground, middle, back}. Empty of people. Vertical 9:16." *Figure* — "Same person as the reference image (same face, {hair}, {clothes}). {pose}, full body, lit by a warm lamp from the {side}. Background: flat solid pure green (#00FF00), completely empty, no shadow on the background." *Edit* — "Keep this image exactly the same, every object, light and position. Only add {the change} at {where}."

## 3. Colour logic

| Name | Value | Use |
|---|---|---|
| SHADOW | `#140C08` | the darkest the print goes: warm brown-black |
| MID | desaturated ochre, olive, brick | everything lit by ambient light |
| CREAM | `#F0E0BE` | the brightest the print goes (paper of the print, sky glow) |
| LAMP | `#FFAA45` core, `#FFD27A` tip | practical light: the only saturated colour |
| PALE | `#C7CCBF` | the ghost's skin and cloth: the one cool, colourless thing |
| TITLE WHITE | `#FBFAF7` → `#A9A49C` | the title letters, a worn silver-white gradient; not faded by the print |
| TITLE RED | `#B3201A` | the small English line under the title only |

- Warm light is saturated; everything it does not touch is muddy and faded. The ghost is never lit warm: it stays PALE even next to the lamp.
- Night is brown-black and dark olive, never blue. Moonlight is a sickly grey-green, low.
- No pure white and no pure black anywhere, captions included (caption white is `#F6EFE0`).

## 4. Type & subtitles

- **Captions** (Kanit SemiBold, 56 px at 1080 wide; Kanit Black for a stressed word): `#F6EFE0` with no outline, only a soft warm-black shadow (blur 18 px, 3 px down), centred, the baseline at 70 % of the frame height: low like a film subtitle, still above the platform's buttons and caption bar. One phrase at a time (2–7 words, broken at Thai phrase boundaries, never inside a word), in on the voice, out on the next phrase; a 3-frame fade, no pop or bounce. Captions are set in screen space, outside the print pass, so they stay sharp; they get the same weave so they don't float.
- **Title** (Prompt SemiBold, about 185 px): loopless Thai letters in a worn silver-white gradient, eaten by fine grit and short horizontal scrapes, with a soft black shadow, like a modern Thai horror poster. Under it, a small English line in TITLE RED (Trirong Bold, about 37 px, capitals, letters spaced wide). It sits on the opening plate and gets the weave, grain and scratches of the print but not its fade, so the white stays white. Once per film.
- **Place-and-time stamp** (optional, Kanit SemiBold, 34 px, CREAM at 85 %): "บ้านริมคลอง · พ.ศ. ๒๕๑๕", lower left, for a new place or a jump in time. Thai digits.
- Thai only by default; another language uses a font that covers it with the same sizes. Fonts: Kanit, Prompt and Trirong, all OFL.

## 5. Motion quality

- **Every held shot has at least two moving things**: the camera plus light, fog, smoke, dust, rain or a breathing figure.
- **Slow.** Camera speeds are slow enough that the eye can search the picture: a push of 2–8 % of the frame per shot, a drift of 20–60 px over the shot. Ease in and out over at least a second.
- **Figures breathe, they don't act**: a 0.3–0.6 % scale breath at 0.2–0.3 Hz around the feet, a sway of a degree for someone sitting or standing in wind. A new action is a new image.
- **Shot length** 3–7 s; a reveal holds longer than feels comfortable (1.5–3 s after the viewer finds it).
- **Transitions**: hard cuts on the narration, or a dip through dark where the lamp dims to nothing and the next shot's light comes up. No crossfades between two photographs, no wipes, no zoom transitions.
- **Shake** only once per film at most, on the one moment that earns it, 4–10 px decaying in 0.3 s.

## 6. Camera grammar

A vocabulary, not a route.

| Move | What it expresses | Can serve |
|---|---|---|
| Slow push toward a dark area (a doorway, under the house, the end of a corridor) | something is there before we see it | the build before a reveal |
| Lateral drift with parallax (foreground fast, plate slow) | walking past, being watched from the side | arriving at a place; a search |
| Tilt up a tall plate | something above, scale, a tree or roof that matters | a figure in a tree; the house looming |
| Slow pull back to a wider frame | the person is smaller, alone, the place is bigger | an ending; isolation |
| Locked-off frame | stillness; the viewer has to look | **required for the same shot twice** |
| Rack focus between layers (blur moves from back to front) | attention shifts | the face, then what is behind it |

The camera is never handheld and never fast. A push may stop early and hold, as if it doesn't want to go further.

## 7. Sound palette

- **Night first**: crickets and frogs as a bed, tokay gecko (ตุ๊กแก) and house gecko (จิ้งจก) calls as punctuation, a dog howling far away, wind on a thatch or zinc roof, bamboo creaking, a floorboard, rain on zinc, a temple bell far off, a mosquito.
- **Music is sparse**: a low drone under the narration; single notes of a ซออู้ (low Thai fiddle) or a ระนาดทุ้ม (low xylophone); never a melody that runs. Sampled or synthesised; original only.
- **The voice in front.** Narration sits clearly above everything (at least 6 dB over the bed in every line); the bed ducks under it.
- **Silence is the sting.** Before a reveal the bed and drone drop out over 0.5 s to near silence (0.8–1.5 s); the reveal comes in that silence, and the night sounds return slowly after. No loud stinger, no whoosh.
- Room tone matches the place (wood, open field, temple stone); the projector is not heard.

## 8. Native moves

A menu: use what the story needs.

- **Same shot twice** (signature): a shot the viewer has seen comes back, identical framing, identical light, locked off; this time one thing is different (a figure in the doorway, a face behind the net, a third pair of feet, a lamp that is now lit). The change is never in the centre of the frame and never pointed at; the narration doesn't mention it until after the viewer has found it, or never. The sound drops away instead of rising. *Fits*: the moment the story turns; a return to a place; the ending.
- **The lamp breathes**: the flame's flicker follows the tension, steady when calm, ragged as it rises. *Fits*: every night scene.
- **Lamp out**: the flame shrinks and dies; the frame goes to near black (the print's brown-black, with grain) for 0.5–1.5 s; light comes back on the same or the next shot, and something has moved. *Fits*: a transition; a reveal.
- **Fog thins**: fog drifts aside to show what was behind it. *Fits*: a field, a pond, a road at night.
- **Poster title**: the film's title on the opening plate in worn silver-white Prompt with its small red English line. *Fits*: openings.
- **Place-and-time stamp**: lower-left line when the story moves. *Fits*: a new place, a jump in years.

## 9. Pitfalls of the medium

- A shot that is just a zoomed still → add a second moving thing (light, atmosphere, parallax), or cut sooner.
- Figures pasted on (wrong light side, no contact shadow, a green fringe, sharper than the plate) → match light direction in the prompt, despill, add the shadow, grade before compositing, add the plate's grain and softness.
- The edit in the same shot twice shifting the whole picture → use the edited image only inside the change mask; check the A/B toggle frame by frame for anything else moving.
- The ghost looking like a different photo (sharper, cleaner, wrong colour) → it goes through the same print pass; keep it PALE and slightly softer than the living.
- The print pass turning to mud → keep a real black and a real cream in every shot; check each shot as a thumbnail.
- Captions unreadable or under the platform UI → 56 px Kanit with its shadow, baseline at 70 %, never lower; over a bright area, darken the plate locally behind the line rather than adding an outline; check on a phone-size preview.
- Jump-scare habits (loud sting, sudden zoom, a face rushing at camera) → the style's fear is silence and change; at most one shake per film.
- Faces in generated images drifting between shots → attach the reference every time, repeat the features, reject images where the face changes.
- Thai period details wrong (modern objects, wrong clothes, plastic, electric light in a story without electricity) → name the era's props in every prompt; reject images with modern objects.
- Real people, real temples' names, real victims of real deaths → never; legends and invented stories only.

## 10. Engine

In `demo/` (how the demo was made: [DEMO.md](DEMO.md)):
- `src/engine.js`: one WebGL2 pass for the whole picture: plate and camera, keyed figures with parallax, breath and contact shadow, cloth sway, the same-shot-twice plate inside its change mask, the breathing lamp (relight, code flame, halation), fog behind and in front, and the faded colour print (cyan fade, crushed brown blacks, grain, weave, scratches, dust, vignette; damage as one number). `flicker(t, ragged)` and `weave(frame, dmg)` drive the lamp and the gate.
- `src/text.js`: captions in screen space, the horror-poster title, the place-and-time stamp.
- `tools/key.py`: green key for generated figures (spill removal, erase boxes, crop).
- `mix.py`: the night bed, drone, single notes and the silence, as a pattern for a film's own mix.
- Image generation: `$LIB/core/assets/chatgpt_images.py` (ChatGPT through Chrome) or `$LIB/core/image/gen_image.py` (Codex).
- Then the bases: `$LIB/styles/manga-panels/` (generated-image pipeline, references), `$LIB/styles/silent-film/demo/engine/film.js` (print pass).

A minimal new use: one plate, one keyed figure, `film.draw()` with a lamp, one `caption()`.

## 11. Variation space

You decide the story, the era, the places, the cast, the ghost, the opening, the ending and the pacing.

- Stories: a village legend told by an old woman; one night of a newcomer in an old house; a chain of small wrong things on a long road; a ghost story told from the ghost's side.
- Openings: the poster title on the house; a lamp being lit in the dark; a place-and-time stamp over an empty plate with only night sounds.
- Endings: the same shot twice on the first shot of the film; the lamp going out on the last line; a pull back from the house to the dark field around it; a question to the viewer in the last caption.
