# Timeline of Everything · Sticky Figure — Style Prompt

Made from a blank page; techniques from Sci-Fi Sitcom Toon (scifi-toon) in Lemo-Opuscar, with moves borrowed from 16-bit Pixel RPG (pixel-rpg), Mid-century Cartoon (midcentury-toon) and Isometric Picture Book (isometric-picture-book).
Default size: 1920×1080, and every film is also laid out for 1080×1920 (§2 *Two frames*).

> One stick figure walks in place while history scrolls past from right to left: the ground, sky, landmarks and the walker's clothes change with each era, a date card counts the years overhead, and a narrator's words sit in a box at the bottom.
> References (grammar only): stick-figure explainer channels (white round heads, line bodies, flat-coloured clothes); children's history atlases that lay the past out as one winding road with dates and call-outs; side-scrolling games (parallax travel as progress). Copy none of their drawings, characters, text or layouts, and never name them in a film.

Suits "the history of X" films: a timeline of monuments, inventions, empires, foods, fashions, any topic that has a "when". The length follows how many stops the road has.

## 1. Essence, and what it is not

- **The road is the timeline.** One walker walks on a pale road; the world moves, the walker doesn't. Distance on the road is time. Every era begins at a dashed **era line** that sweeps through the walker and changes everything it passes.
- **Stick figures**: a big white circle head, dot eyes, a one-line mouth; body, arms and legs are single ink lines; hands are small white mittens. **Clothes are flat-coloured shapes put on the stick**, and they change with the era. Hair and face never change: that is who the walker is.
- **Clean, uniform ink line and flat colour**, like a tidy children's picture book drawn in a vector app: no texture, no gradients, no line boil, no paper grain.
- **Side view, a stage in depth**: the walker on the road in front; landmarks, trees and people further back, smaller and slower; hills and sky behind.
- A date card in the sky, a caption box on the ground. The narrator explains; the picture shows.

Not a whiteboard explainer (nothing is drawn on in front of us; the world is already there and slides in). Not pixel art, not the boiling adult sitcom toon, not isometric (the atlas's road is flattened into a side view; only the *map view* move sees it from above). Not a caricature: every person has the same white head; culture is told by clothes, tools and buildings, never by drawn ethnic features.

## 2. Materials & rendering

All sizes below are for a 1080 px short side; multiply by `u = min(W, H) / 1080`.

- **Ink**: warm near-black `#1d1b19`, round caps and joins, **constant width**: figures 5.5 px, stage objects 4.5 px, landmarks on the backdrop 3.5–4 px. Ink is only on the stage and backdrop; far hills and clouds are outlined in a darker shade of their own fill (depth by line colour, not by blur).
- **The figure** (height `Hf`: 430 px in 16:9, 520 px in 9:16), from the feet up: legs 0.37 `Hf` (two bones, thigh = shin), torso 0.27 `Hf`, head 0.36 `Hf` (a circle, fill `#fffefb`). Arms 0.255 `Hf` (two bones) from a shoulder point 0.045 `Hf` under the neck. Feet are short lines pointing the way the figure faces; shoes, when worn, are shapes on them.
- **Face**: two ink dots (r 0.017 `Hf`), a one-line mouth (smile curve, flat line, or an ink oval when talking or surprised), optional brows for big emotions. Women: two lash ticks per eye and soft blush ovals. Elders: grey hair and a stick, never wrinkles. **Look** shifts eyes and mouth toward the facing side (0.45 while walking, 0 when talking to the viewer).
- **Hands**: white mittens with a thumb, outlined at 0.75× line weight. Never black hands, never fingers drawn one by one.
- **Hair** (drawn over the head): `short`, `bun`, `messy`, `long`, `bald`; dark brown or black, grey for elders. Hair moves with the head only; it never changes between eras.
- **Clothes**: flat fills with the figure's ink outline; pattern only as flat spots or stripes (a hide's spots, a collar's bands). A tunic or dress covers the torso lines and the tops of the thighs; trousers and sleeves are tubes along the bones (ink tube under a colour tube, butt ends with a cuff line). Collars, belts and hats are separate layers. One outfit per era for the walker, chosen from what ordinary people there wore; locals in the backdrop wear the same era's clothes in other colours.
- **Depth factor `k`** (the stage is `k = 1`): an object at depth `k` draws at `k ×` its true size relative to the walker (1.7 m), stands at `y = horizon + (ground − horizon) · k`, and scrolls at `k ×` the road speed. Use it everywhere; it is what makes the frieze feel like a place. Usual depths: road, walker, era line, near tufts 1.0; landmarks 0.3–0.5; trees, people and props 0.35–0.6; hills 0.12–0.2; clouds 0.08; sky 0.
- **Landmarks**: drawn from simple shapes (≤ about 15 parts), true proportions, one flat darker side plane per block of stone (the only shading in the style). A landmark too tall for its depth goes further back (smaller `k`), never cropped by the top of the frame unless the camera tilts up to it.
- **Ground**: a horizon ink line; flat ground colour below it; a pale **road** band under the walker with thin edge lines in a darker road tone; grass tufts as little `M` and `V` strokes in a darker ground tone (the stage), sparse ones in front of the feet.
- **Sky**: two flat bands (paler toward the horizon). Clouds are flat white shapes. Night is a flat dark blue with a few four-point stars.
- **Two frames.** Each film is laid out for both sizes from the same timeline; positions come from these anchors, never from pixels copied between sizes:

  | | 16:9 (1920×1080) | 9:16 (1080×1920) |
  |---|---|---|
  | horizon | y 560 | y 1010 |
  | walker's feet | y 830, x = 0.36 W, facing right | y 1290, x = 0.5 W, facing right |
  | date card | top centre, y 40–175 | y 190–360 (under the app's top bar) |
  | caption box | bottom centre, y ≈ 900–1045, width ≤ 1400 | y ≈ 1340–1520, width 960 (above the app's bottom bar and clear of the right-hand buttons: nothing important in the right 140 px) |

## 3. Colour logic

- **Fixed everywhere**: ink `#1d1b19`, head white `#fffefb`, card and caption paper `#fffdf7`. These are what the eye holds on to while everything else changes.
- **One palette per era**: sky (two tones), far hills (fill + darker line), ground (two tones), road (fill + edge), tufts, stone. Soft, a little dusty, never neon; the next era differs in hue so the era line reads from colour alone.
- **The walker's clothes are the most saturated colour in the frame.** Backdrop people use the same era's clothes in duller tones; landmarks use the stone or brick of the place.
- Night, storms and disasters are the era palette pushed darker or greyer, not a new logic.
- Example palettes: Anatolian steppe — sky `#cfe7ef`, hills `#d8c08c`, ground `#d8b66e`, stone `#eadbb6`; Neolithic Britain — sky `#d3e5ee`, hills `#a9c38c`, ground `#8fb866`, stone `#bdb8ae`; Old Kingdom Egypt — sky `#d6ecf3`, hills `#e9cf96`, ground `#e2c27f`, stone `#ecd8a8`.

## 4. Type & subtitles

- **Mali** (Google Fonts, OFL; Thai and Latin in one family, a rounded handwriting) for everything: date card, captions, call-outs, era flags. Thai and English films use the same face, so the two versions look the same. One language per film; a Thai and an English version are two renders of the same timeline.
- **Date card**: a paper rounded rectangle (radius 22 px, ink outline 3.5 px) hanging in the sky with a small cloud behind one end. Line 1, the date in Mali Bold 50 px (60 px in 9:16): `c. 2600 BCE` / `ราว 2600 ปีก่อน ค.ศ.`; ranges with an en dash. Line 2, the stop's name in Mali SemiBold 30 px (36 px). The card stays for the whole film; its digits **roll** as the road moves (§8). Dates follow the user's source; a Thai film writes years in ค.ศ. unless the user asks for พ.ศ.
- **Caption box**: paper (94 %), ink outline 3.5 px, radius 24 px, Mali Medium 40 px (44 px in 9:16), centred, at most two lines. Thai lines break at words (`Intl.Segmenter`), never inside a word. Two lines are balanced to similar widths. One narrator line per box; hold ≥ max(1.8 s, speech + 0.6 s).
- **Call-out**: a small paper tag with Mali SemiBold 30 px, linked to its landmark by a thin ink leader line ending in a dot, popping in on the word.
- **Era flag**: a paper pennant hanging on each era line just under the date card's band (y 205 in 16:9, 395 in 9:16), with the era's first year in Mali Bold 26 px; a small wooden stake marks where the line meets the road.

## 5. Motion quality

- **30 fps, on ones.** The road and the planted foot must move together on every frame; drawing the figure on twos makes the feet skate.
- **Walk in place**: one step per musical beat (around 100 BPM → a 1.2 s stride). The stance foot is planted: it moves backward exactly as fast as the road moves forward, so road speed = 4 × (step reach) / stride time. Swing foot lifts 0.055 `Hf` on an ease-in-out arc, hips bob 0.012 `Hf` (highest at mid-stance), arms counter-swing about ±30° with a forward elbow bend. The far arm and leg are drawn first, behind the clothes.
- **Starting and stopping**: speed eases over two steps; the walk phase is the integral of speed, so feet never slide while the road slows. Start every speed change on the beat and give it 1.2 s, so the steps after it land back on the beat.
- **Speed-up**: between stops the walker speed-walks at 3× (feet still locked to the road, steps on triplets), with three short speed lines behind and the card digits spinning.
- **Turning to the viewer** (to point or react): over 0.3 s `look` goes from 0.45 to 0, feet come together, one arm points; back to walking the same way.
- **Pop-ins** (call-outs, era flags, the card's second line): back-ease, 0.25 s, small overshoot. Nothing else bounces.
- **Life in the backdrop**: locals work on a slow loop (hauling, carving, carrying) at their depth's speed; clouds drift a little on their own.

## 6. Camera grammar

The camera is locked to the walker by default: the world moves, the frame doesn't. A vocabulary, not a route. Opening and ending come from the topic.

| Move | What it expresses | Can serve |
|---|---|---|
| Locked side view, world scrolling | time passing | the walk between stops; a quiet stretch of centuries |
| Slow push toward a landmark while the walker stops and points | "look at this" | each stop; a key fact |
| Tilt up past the date card | how tall | a pyramid, a tower, a rocket |
| Pull back until the walker is a tick on the road (scale check) | how big compared with us | a monument's size; a crowd; a distance |
| Rise (or iris through the walker's head) to the **map view**: the road seen from above, winding, dates along it, the walker a little head | where we are in the whole story | the opening; a new chapter; the ending |
| Cut to a close-up of the walker's face | a reaction | a surprising number; a disaster; a joke |
| Speed-up (road blurs into speed lines, card digits spin) | a jump over a long time | thousands of years with nothing to stop for |

Rules: no handheld shake; every move eases; the date card and caption box stay in the frame through every move except the map view, where the card shows the whole span.

## 7. Sound palette

- **Score**: light acoustic, at the walking tempo (90–110 BPM): ukulele or nylon guitar strums, marimba, pizzicato strings, a soft kick and shaker. A small **era colour** may join for each era (a frame drum and reed flute for the ancient Near East, a harp for Egypt, bagpipe drone for Britain, a lute for the Middle Ages, a piano for the 1800s, a synth for today) on the same groove.
- **Footsteps on every beat**, their surface following the ground: grass, sand, stone, mud, wood, pavement.
- **Signature sounds**: a soft chime + paper flip when an era line passes; a dry tick per rolling digit on the date card (thinned to a ripple when it spins); a pop for call-outs; a whoosh for the map rise and the speed-up.
- **Voice**: one narrator, warm and clear (ElevenLabs for Thai when the user agrees). Music ducks ~14 dB under the voice and lifts between lines. Mix to −14 LUFS.
- **Silence**: the footsteps and music stop when the walker stops for something sad or huge; one beat of silence before the narration goes on.

## 8. Native moves

The first three are the style's signature; use them in every film. The rest are a menu.

- **Treadmill of time.** The walker walks in place, the road scrolls right to left at exactly the planted foot's speed, the backdrop at its depth. *Fits content like:* any stretch between two dates; a migration; the long wait before an invention.
- **The era line.** A full-height dashed ink line with a paper flag near its top and a stake at its foot rides in on the road and sweeps through the walker: everything to its right is the next era (sky, hills, ground, road, and the half of the walker it has passed, wearing the new clothes). *Fits content like:* a new period; a new country; before and after an event.
- **Rolling date card.** The date's digits roll like an odometer while the road moves and settle when the walker reaches a stop; crossing year 1 flips "BCE" to "CE" with a card flip. *Fits content like:* any count of years; a countdown; ages of a person.
- **Stop, point, call-out.** The walker slows over two steps, turns to the viewer, points; a call-out tag pops with a leader line to the landmark on the narrator's word. *Fits content like:* each monument; each invention; each ruler.
- **Map view.** The camera rises until the road is seen from above, winding across the land with dates along it like an atlas page, the walker a dot. *Fits content like:* the opening overview; a chapter break; the ending ("and the road goes on").
- **Scale check.** A dashed height line runs from the walker's head to the landmark's top, a number beside it ("× 86"), then the camera pulls back. *Fits content like:* a pyramid's height; a ship's length; a crowd's size.
- **Lend a hand.** The walker joins the locals for one beat (pulls the rope, lifts a stone, takes a photo) and walks on. *Fits content like:* how it was built; daily life; a ritual.

## 9. Pitfalls of the medium

- **Era lines show early**: at walking speed an era line is on screen for about 7 s before it reaches the walker (16:9). During a stop the next era should be off screen: put a speed-up between stops. A call-out must have been read before the next era line wipes its landmark.
- **The past during a pull-back**: when the camera pulls back, eras already passed would fill the left of the frame; drop a boundary once it is behind the walker.
- **Skating feet**: the road must be driven by the walk phase (or the phase by the road), never both by time with separate constants; check a 10-frame strip of the planted foot.
- **Clothes breaking at the joints**: tubes need round joins at the knee and elbow; a tunic must cover both thighs' tops in every phase of the walk; check the extremes (phase 0, 0.25, 0.5, 0.75).
- **Text over faces in 9:16**: the date card and caption box have fixed bands (§2); landmarks and heads keep out of them, tall landmarks go behind the card's sky band only when the card is narrow.
- **Landmarks drawn in more detail than the walker** read as a different film: ≤ about 15 parts, the same ink.
- **Too many things moving at once**: in each shot the road and one other thing move (a local, a call-out, a cloud drift).
- **Facts and dates**: check every date, place and outfit against the user's source; when sources disagree, use "c." and a range. Clothes from the right century and region; no horns on Vikings.
- **Thai text**: break lines with `Intl.Segmenter('th')`; a font that lacks Thai glyphs falls back silently, so check the first frame of every text.
- **Two frames**: positions copied from 16:9 into 9:16 land under the app's buttons; lay each size out from §2's anchors.
- **TTS**: Thai numbers and dates must be written in the form the voice reads (`core/tts/locales/`); check with `asr_check.py --lang th`.

## 10. Engine

The style's own code is in [`demo/`](demo/) (plain Canvas 2D, no dependencies): `src/ink.js` (constant-width ink, flat shapes, tubes), `src/figure.js` (the rig with planted feet, faces, hair, outfits, `blendSkel` for walk → stand), `src/world.js` (eras, both frames' layouts, the depth-factor view, ground and road, landmarks, people, the era line, `zoomed()` for pull-backs that keep line weight), `src/ui.js` (caption box with Thai word breaks, call-outs), `src/map.js` (the map view), `src/film.js` (a whole film: speed profile → road position → walk phase, placements by time, the rolling date card, events for the mixer), `mix.py` (score, foley, voice, ducking). New eras need a palette in `ERAS`, an outfit in `OUTFITS` and their landmarks as functions in metres. How the demo was built and which file draws what: [DEMO.md](DEMO.md).

Techniques came from Sci-Fi Sitcom Toon (`$LIB/styles/scifi-toon/`: constant-width vector drawing, without the boil), 16-bit Pixel RPG (`$LIB/styles/pixel-rpg/`: parallax side-scroll) and Mid-century Cartoon (`$LIB/styles/midcentury-toon/`: call-outs and pop-ins).

## 11. Variation space

You decide the topic, the stops, the eras and their palettes, the walker (man or woman, hair), the outfits, the opening, the ending, the camera path, the pacing, the music and the voice.

- Structures: **one road, many stops** (the default: walk, stop, call-out, walk); **the race** (two walkers on two roads, two inventions in two countries, side by side in a split frame); **backwards** (the walker turns round and the road scrolls left to right, from today into the past); **the long jump** (most of the film is the speed-up, with three short stops).
- Openings: **the map view** coming down onto the road; **the empty road** with only a date card that rolls back from today; **a close-up** of the walker's face in today's clothes, who then sets off.
- Endings: **the walker reaches today** and the era line brings the viewer's own street; **the map view** rising to show the whole road; **the road goes on** past the frame with the date card rolling into "?".
