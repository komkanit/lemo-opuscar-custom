#!/bin/sh
# Rebuild the demo film: both frames (1920×1080, 1080×1920), the mix and the subtitles.
# The voice is already in voices/ (ElevenLabs, paid): this script never calls the TTS.
set -e
LIB=${LIB:-/Users/komkanit/Documents/work/lemo-opuscar}
HERE=$(cd "$(dirname "$0")" && pwd)
OUT=${OUT:-$HERE/../build}
export LIB OUT
[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the Lemo-Opuscar library folder"; exit 1; }
mkdir -p "$OUT"
cd "$LIB"
node core/render/events.mjs "$HERE" --out "$OUT/events.json"
"$LIB/.venv/bin/python" "$HERE/mix.py"
node core/render/video.mjs "$HERE" --fps 30 --workers 3 --out "$OUT/video169.mp4"
node core/render/video.mjs "$HERE" --fps 30 --workers 3 --size 1080x1920 --out "$OUT/video916.mp4"
sh core/render/mux.sh "$OUT/video169.mp4" "$OUT/mix.wav" "$OUT/test.mp4" 30 0
sh core/render/mux.sh "$OUT/video916.mp4" "$OUT/mix.wav" "$OUT/test-vertical.mp4" 30 0
"$LIB/.venv/bin/python" - "$HERE" "$OUT" <<'PY'
import json, sys
here, out = sys.argv[1], sys.argv[2]
L = {l['id']: l['text'] for l in json.load(open(here + '/lines.json'))}
D = json.load(open(here + '/voices/dur.json'))
VO = {'n1': 0.5, 'n2': 8.4, 'n3': 15.8, 'n4': 25.2, 'n5': 32.6}   # same as VO in src/film.js
json.dump([{'t0': t, 't1': t + max(1.8, D[i] + 0.6), 'text': L[i]} for i, t in VO.items()], open(out + '/cues.json', 'w'), ensure_ascii=False)
PY
"$LIB/.venv/bin/python" core/render/srt.py "$OUT/cues.json" "$OUT/test.srt"
echo "done → $OUT/test.mp4, $OUT/test-vertical.mp4, $OUT/test.srt"
