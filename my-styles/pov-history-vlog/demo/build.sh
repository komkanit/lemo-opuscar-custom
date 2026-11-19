#!/bin/sh
# Rebuild the demo film POV: Pyramid Worker (1080×1920, 30 fps, Thai voice, English .srt):
# timeline → mix → picture → mux → subtitles. The pictures in page/images come from ChatGPT and the voice in
# voice/out-th from ElevenLabs (see CREDITS); this script never generates images or calls the TTS.
set -e
LIB=${LIB:-D:/lemo-opuscar-custom/lemo-opuscar-custom}
HERE=$(cd "$(dirname "$0")" && pwd)
OUT=${OUT:-$HERE/../build}
PAGE="$HERE/page"
export LIB OUT PAGE PYTHONUTF8=1
[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the Lemo-Opuscar library folder"; exit 1; }
mkdir -p "$OUT"
PY="$LIB/.venv/bin/python"
"$PY" "$HERE/tools/timeline.py" th --sub en
"$PY" "$HERE/tools/mix.py" th
cd "$LIB"
node core/render/video.mjs "$PAGE" --fps 30 --workers 3 --size 1080x1920 --q "lang=th" --out "$OUT/video.th.mp4"
sh core/render/mux.sh "$OUT/video.th.mp4" "$OUT/mix.th.wav" "$OUT/test.mp4" 30 0
"$PY" core/render/srt.py "$OUT/cues.th.json" "$OUT/test.th.srt"
"$PY" core/render/srt.py "$OUT/cues.en.json" "$OUT/test.en.srt"
echo "done → $OUT/test.mp4 (+ test.th.srt, test.en.srt)"
