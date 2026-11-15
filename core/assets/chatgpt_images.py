#!/usr/bin/env python3
"""ChatGPT images: the file side of generating stills in the user's ChatGPT, through their Chrome.

The agent drives ChatGPT in the browser (TECHNIQUE.md §11); this tool keeps the job list,
writes the exact prompt to send, and takes each download from ~/Downloads into the project.

  chatgpt_images.py status  images.json            what is done, what is missing
  chatgpt_images.py start   images.json <id>       mark the start, print the prompt to type
  chatgpt_images.py ingest  images.json <id> [--chat URL] [--file F] [--downloads DIR]
                                                   move the new download in, fit it, log it
  chatgpt_images.py credits images.json            CREDITS lines for the images made

images.json:
  {"out": "images",                       folder for the images, relative to images.json
   "style": "flat paper-cut, red and cream", appended to every prompt (optional)
   "images": [{"id": "lantern", "prompt": "a red paper lantern on cream",
               "aspect": "16:9",           said in the prompt (optional)
               "size": "1920x1080",        crop and scale to this after download (optional)
               "text": false,              true lets the image contain lettering
               "use": "background, shot 3"}]}  a note for the log (optional)
"""
import argparse
import hashlib
import json
import os
import sys
import time
from pathlib import Path

IMAGE_EXT = {".png", ".jpg", ".jpeg", ".webp"}
PARTIAL = (".crdownload", ".download", ".part")


def die(msg, code=1):
    print(msg, file=sys.stderr)
    sys.exit(code)


def load_env():
    """CHATGPT_PROJECT_URL may sit in the library's .env, like the ElevenLabs key."""
    if os.environ.get("CHATGPT_PROJECT_URL"):
        return
    env = Path(__file__).resolve().parents[2] / ".env"
    if not env.is_file():
        return
    for line in env.read_text().splitlines():
        line = line.strip()
        if line.startswith("export "):
            line = line[7:]
        if line.startswith("CHATGPT_PROJECT_URL="):
            os.environ["CHATGPT_PROJECT_URL"] = line.split("=", 1)[1].strip().strip("'\"")


def load_jobs(path):
    path = Path(path)
    if not path.is_file():
        die(f"no such file: {path}")
    try:
        spec = json.loads(path.read_text())
    except json.JSONDecodeError as e:
        die(f"{path}: not valid JSON ({e})")
    jobs = spec.get("images")
    if not isinstance(jobs, list) or not jobs:
        die(f"{path}: needs an \"images\" list")
    seen = set()
    for j in jobs:
        if not j.get("id") or not j.get("prompt"):
            die(f"{path}: every image needs an id and a prompt ({j})")
        if j["id"] in seen:
            die(f"{path}: id {j['id']!r} appears twice")
        seen.add(j["id"])
        if j.get("size"):
            parse_size(j["size"])
    out = path.parent / spec.get("out", "images")
    return spec, jobs, out


def parse_size(s):
    try:
        w, h = (int(v) for v in str(s).lower().split("x"))
        assert w > 0 and h > 0
        return w, h
    except Exception:
        die(f"size must be WxH, like 1920x1080 (got {s!r})")


def find_job(jobs, jid):
    for j in jobs:
        if j["id"] == jid:
            return j
    die(f"no image with id {jid!r}; ids: {', '.join(j['id'] for j in jobs)}")


def log_path(out):
    return out / "images.log.json"


def read_log(out):
    p = log_path(out)
    if p.is_file():
        return json.loads(p.read_text())
    return {"chat": None, "pending": {}, "images": {}}


def write_log(out, log):
    out.mkdir(parents=True, exist_ok=True)
    tmp = log_path(out).with_suffix(".tmp")
    tmp.write_text(json.dumps(log, indent=2, ensure_ascii=False) + "\n")
    tmp.replace(log_path(out))


def prompt_for(spec, job):
    parts = [job["prompt"].strip().rstrip(".")]
    if spec.get("style"):
        parts.append(str(spec["style"]).strip().rstrip("."))
    if job.get("aspect"):
        parts.append(f"aspect ratio {job['aspect']}")
    if not job.get("text"):
        parts.append("no text, letters or watermark in the image")
    return "Generate an image: " + ". ".join(parts) + "."


def cmd_status(args):
    spec, jobs, out = load_jobs(args.jobs)
    log = read_log(out)
    done = 0
    for j in jobs:
        rec = log["images"].get(j["id"])
        if rec and (out / rec["file"]).is_file():
            done += 1
            print(f"  done     {j['id']:<20} {rec['file']}  {rec['size']}")
        elif j["id"] in log["pending"]:
            print(f"  started  {j['id']:<20} (waiting for ingest)")
        else:
            print(f"  missing  {j['id']:<20} {j.get('use', '')}")
    print(f"{done}/{len(jobs)} done; images in {out}")
    load_env()
    chat = log.get("chat")
    print(f"chat: {chat or '(none yet: start a new chat in the project)'}")
    if os.environ.get("CHATGPT_PROJECT_URL"):
        print(f"project: {os.environ['CHATGPT_PROJECT_URL']}")


def cmd_start(args):
    spec, jobs, out = load_jobs(args.jobs)
    job = find_job(jobs, args.id)
    log = read_log(out)
    log["pending"][job["id"]] = time.time()
    write_log(out, log)
    load_env()
    where = log.get("chat") or os.environ.get("CHATGPT_PROJECT_URL") or "(no CHATGPT_PROJECT_URL: ask the user for their project link)"
    print(f"open: {where}")
    print("prompt:")
    print(prompt_for(spec, job))


def newest_download(folder, since):
    folder = Path(folder).expanduser()
    if not folder.is_dir():
        die(f"no downloads folder: {folder}")
    pending, found = [], []
    for f in folder.iterdir():
        if not f.is_file():
            continue
        try:
            mtime = f.stat().st_mtime
        except OSError:
            continue
        if mtime < since:
            continue
        if f.name.endswith(PARTIAL) or f.name.startswith(".com.google.Chrome."):
            pending.append(f)
        elif f.suffix.lower() in IMAGE_EXT and not f.name.startswith("."):
            found.append((mtime, f))
    if not found:
        if pending:
            die("the download has not finished: Chrome may be waiting at its Save dialog "
                "(the user clicks Save, or turns off 'Ask where to save each file')")
        die(f"no new image in {folder} since {time.strftime('%H:%M:%S', time.localtime(since))}")
    found.sort()
    if len(found) > 1:
        print(f"note: {len(found)} new images; taking the newest", file=sys.stderr)
    return found[-1][1]


def fit(img, w, h):
    from PIL import Image
    sw, sh = img.size
    scale = max(w / sw, h / sh)
    nw, nh = round(sw * scale), round(sh * scale)
    img = img.resize((nw, nh), Image.LANCZOS)
    x, y = (nw - w) // 2, (nh - h) // 2
    return img.crop((x, y, x + w, y + h))


def cmd_ingest(args):
    from PIL import Image
    spec, jobs, out = load_jobs(args.jobs)
    job = find_job(jobs, args.id)
    log = read_log(out)
    if args.file:
        src = Path(args.file).expanduser()
        if not src.is_file():
            die(f"no such file: {src}")
    else:
        since = log["pending"].get(job["id"])
        if since is None:
            die(f"run `start` for {job['id']!r} first, or pass --file")
        src = newest_download(args.downloads, since - 2)

    orig_dir = out / "src"
    orig_dir.mkdir(parents=True, exist_ok=True)
    with Image.open(src) as im:
        im.load()
        has_alpha = im.mode in ("RGBA", "LA") or "transparency" in im.info
        im = im.convert("RGBA" if has_alpha else "RGB")
    orig = orig_dir / f"{job['id']}.png"
    im.save(orig)
    final = out / f"{job['id']}.png"
    if job.get("size"):
        w, h = parse_size(job["size"])
        fit(im, w, h).save(final)
    else:
        im.save(final)
    with Image.open(final) as f2:
        fw, fh = f2.size
    src_name = src.name
    if not args.file and not args.keep:
        src.unlink()

    if args.chat:
        log["chat"] = args.chat
    log["pending"].pop(job["id"], None)
    log["images"][job["id"]] = {
        "file": final.name,
        "original": str(orig.relative_to(out)),
        "size": f"{fw}x{fh}",
        "original_size": f"{im.size[0]}x{im.size[1]}",
        "prompt": prompt_for(spec, job),
        "chat": args.chat or log.get("chat"),
        "downloaded_as": src_name,
        "sha256": hashlib.sha256(final.read_bytes()).hexdigest(),
        "at": time.strftime("%Y-%m-%dT%H:%M:%S%z"),
        "use": job.get("use", ""),
    }
    write_log(out, log)
    print(f"{job['id']}: {src_name} → {final} ({im.size[0]}x{im.size[1]} → {fw}x{fh})")


def cmd_credits(args):
    spec, jobs, out = load_jobs(args.jobs)
    log = read_log(out)
    made = [j["id"] for j in jobs if j["id"] in log["images"]]
    if not made:
        die("no images made yet")
    where = os.path.relpath(log_path(out), Path(args.jobs).parent)
    print(f"Images: {', '.join(log['images'][i]['file'] for i in made)}. "
          f"Generated with ChatGPT image generation (OpenAI) for this film; prompts in {where}.")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="cmd")
    p = sub.add_parser("status"); p.add_argument("jobs"); p.set_defaults(fn=cmd_status)
    p = sub.add_parser("start"); p.add_argument("jobs"); p.add_argument("id"); p.set_defaults(fn=cmd_start)
    p = sub.add_parser("ingest"); p.add_argument("jobs"); p.add_argument("id")
    p.add_argument("--chat", help="the ChatGPT chat URL the image came from (kept for the next images)")
    p.add_argument("--file", help="take this file instead of the newest download")
    p.add_argument("--downloads", default="~/Downloads")
    p.add_argument("--keep", action="store_true", help="leave the download in place")
    p.set_defaults(fn=cmd_ingest)
    p = sub.add_parser("credits"); p.add_argument("jobs"); p.set_defaults(fn=cmd_credits)
    args = ap.parse_args()
    if not getattr(args, "fn", None):
        ap.print_help()
        sys.exit(2)
    args.fn(args)


if __name__ == "__main__":
    main()
