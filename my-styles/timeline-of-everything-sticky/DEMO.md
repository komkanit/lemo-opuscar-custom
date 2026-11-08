# Timeline of Everything · Sticky Figure — our demo

One example among many. Don't reuse its story, arc, shots, props or timings.

Demo: *Ancient Monuments · อนุสรณ์สถานโบราณ* (39.4 s, Thai narration) · `test.mp4` (1920×1080) and `test-vertical.mp4` (1080×1920) from the same timeline · source in [`demo/`](demo/)

The brief: prove the style on the user's own topic (the "Ancient monuments" page of a history atlas): three monuments, one walker, Thai voice, both frames.

## Story & structure

"People left almost no trace, until they built things to last." The first line and the last answer each other.

| t (s) | Beat | Picture | Moves |
|---|---|---|---|
| 0–6.0 | Overview | map view: the winding road from above, three landmark icons with date flags, the walker a little head; slow push in; iris closes on the head | map view |
| 6.0–15.6 | Göbekli Tepe | iris opens on the walker in a hide; card rolls 10,000 → 9500 BCE; T-pillars on a mound, a hunter with a spear; she slows over two steps, turns, points; call-out | treadmill, rolling card, stop–point–call-out |
| 15.6–24.9 | Stonehenge | speed-up (3×, speed lines, tambourine) on "หลายพันปีต่อมา" while the card spins to 2950; the era line sweeps through her (hide → wool, gold steppe → green); two locals haul a sarsen; call-out on "สโตนเฮนจ์" | speed-up, era line |
| 24.9–32.0 | Giza | second speed-up and era line (wool → linen, sand); she stops at the foot of a slope; pull back (0.012×) reveals the whole Great Pyramid on the stage beside her: dashed height line, "× 86", call-out "146 m" | era line, scale check |
| 32.0–39.4 | Ending | iris to the map: the head walks on past the pyramid icon toward a "?" flag as the map pulls back to the whole road | map view |

## Shots

| Beat | Camera |
|---|---|
| Map | top-down, zoom 1.35 → 1.75 on the head, iris into it |
| Walk | locked side view, walker at 0.36 W (16:9) / 0.5 W (9:16) |
| Stop | locked; the walker turns, nothing else moves but the hunter's blink and the clouds |
| Scale check | log-zoom 1 → 0.012 about the walker's feet with a pan (−60 px in 16:9, −450 px in 9:16) so the pyramid sits centred |
| Ending | iris out, map pull-back from the pyramid icon to the whole road |

## Palette

Fixed: ink `#1d1b19`, heads `#fffefb`, paper `#fffdf7`, scale-check red `#d9483b`.
Eras (sky / hills / ground / road / stone): Anatolia `#cfe7ef` `#d8c08c` `#d8b66e` `#f1e5c6` `#eadbb6`; Britain `#d3e5ee` `#a9c38c` `#8fb866` `#e9e2c9` `#bdb8ae`; Egypt `#d6ecf3` `#e9cf96` `#e2c27f` `#f5ead0` `#ecd8a8`. Map land `#dde6b6`, road `#f4ecd2`.
Walker: brown bun `#4b3022`; hide `#d9a560` with `#8b5a2c` spots, wool `#9b7a50` with a rope belt, linen kilt `#f6f1e4` with a blue-and-gold collar.

## Score & sound

100 BPM in G major, G – D – Em – C, one bar = 2.4 s, one step per beat. Ukulele strums (down on the beat, light up-strum on the off-beat), pizzicato cellos on 1 and 3, shaker 8ths, marimba motif (harp in Egypt). Era colour: frame drum (Anatolia), bagpipe drone (Britain), harp arpeggios (Egypt). Speed-ups add tambourine triplets (the 3× walk steps on triplets). Under the scale check everything drops out except harp and a low cello G. Footsteps per surface (dry grass, turf, sand), glockenspiel chime + paper flip per era line, odometer ticks, pops, whooshes. Voice: one ElevenLabs narrator (eleven_v4), music ducked 12 dB. Mastered to −14 LUFS.

## Build notes

- **Feet locked to the road.** `src/film.js` integrates a speed profile into road position `X(t)` (600 Hz table) and derives the walk phase from it: `phase = X / stride`, stride = 4 × reach × 1.7 m. Every speed change starts on the beat and lasts 1.2 s with a smoothstep, so the following steps land back on the beat grid (0→1 and 1→0 cover half a stride, 1↔3 cover two strides).
- **Place things by when they should be seen.** Landmark positions are computed from `X(t)` at the moment they should stand at a given screen x (measured in the 16:9 frame, `REF_M`), so both frames share one world.
- **Era lines are visible for ~7 s at walking speed** (the stage crosses 4.9 m of screen). Put a speed-up between stops so the next era stays off screen during a stop, and check that a call-out is gone before the next era line wipes its landmark.
- **Pull-backs keep line weight**: zoom is applied by changing the layout (`zoomed()`: figure height, horizon, anchors), never by scaling the canvas; tufts and road shrink with it, the cards don't.
- **Walk → stand**: `blendSkel()` interpolates joint positions over 0.45 s.
- **Passed eras disappear** during a pull-back (a boundary left of the walker is dropped when zoom < 0.95), otherwise the past fills the left of the frame.
- **Readcheck** reports the date card only while it is settled (rolling digits are not meant to be read) and skips the moving era flags.

## Which file draws what

| File | What |
|---|---|
| `demo/src/ink.js` | constant-width ink, flat shapes, tubes, easing, seeded random |
| `demo/src/figure.js` | the rig (two-bone legs with planted feet, arms, lean), face, hair, outfits (`hide`, `wool`, `linen`, `modern`, `dress`), `blendSkel` |
| `demo/src/world.js` | eras and palettes, layouts for both frames, depth-factor view, sky/hills/ground/road/tufts, landmarks (`gobekli`, `stonehenge`, `pyramid`), `tree`, `palm`, `haulers`, `hunter`, `eraLine`, `zoomed` |
| `demo/src/ui.js` | caption box (Thai word breaks, balanced lines), call-out, word wrap |
| `demo/src/map.js` | map view: road from a Catmull–Rom path, top-view icons, flags, the walker's head |
| `demo/src/film.js` | the timeline: speed profile, placements, rolling date card, walker poses, events for the mixer, frames, iris |
| `demo/src/frames.js` | the style frames and cast sheet: `index.html?frame=wipe|stop&lang=th|en`, `index.html?sheet=1` (render with `still.mjs … --q 'frame=wipe&lang=th'`) |
| `demo/mix.py` | score, foley, voice and ducking from `events.json` |
| `demo/build.sh` | one command: events → mix → both renders → mux → subtitles |
