#!/bin/sh
# Rebuild the demo film มุ้งขาว · The White Net (1080×1920, 24 fps): mix, picture, mux.
# The pictures in img/ come from ChatGPT and the voices in voice/ from ElevenLabs (see CREDITS); this script
# never generates images or calls the TTS. VOICE=tonce|hammy builds the narrated version (test-<voice>.mp4).
set -e
LIB=${LIB:-D:/lemo-opuscar-custom/lemo-opuscar-custom}
HERE=$(cd "$(dirname "$0")" && pwd)
OUT=${OUT:-$HERE/../build}
export LIB OUT
[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the Lemo-Opuscar library folder"; exit 1; }
mkdir -p "$OUT"
PY="$LIB/.venv/bin/python"
"$PY" "$HERE/mix.py"
cd "$LIB"
Q=""; NAME=test; [ -n "$VOICE" ] && { Q="v=$VOICE"; NAME="test-$VOICE"; }
node core/render/video.mjs "$HERE" --fps 24 --workers 3 --size 1080x1920 --q "$Q" --out "$OUT/video.mp4"
sh core/render/mux.sh "$OUT/video.mp4" "$OUT/mix.wav" "$OUT/$NAME.mp4" 24 0
echo "done → $OUT/$NAME.mp4"
