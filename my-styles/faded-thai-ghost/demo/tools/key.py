"""Green-screen key for generated figures: alpha from green dominance, green spill removed, optional erase boxes.

Usage: python key.py <src.png> <out.png> [--erase x0,y0,x1,y1 ...] [--crop]
  --erase  boxes (source pixels) made transparent, e.g. a prop the generator added that the plate already has
  --crop   trim to the opaque bounding box (+8 px) and print the offset, so placement can use source coordinates
"""
import argparse
import numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter, binary_erosion


def sm(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0, 1)
    return t * t * (3 - 2 * t)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("src"); ap.add_argument("out")
    ap.add_argument("--erase", nargs="*", default=[])
    ap.add_argument("--crop", action="store_true")
    a = ap.parse_args()
    im = np.asarray(Image.open(a.src).convert("RGB")).astype(np.float32) / 255
    r, g, b = im[..., 0], im[..., 1], im[..., 2]
    spill = g - np.maximum(r, b)                      # how much greener than the other channels
    alpha = 1 - sm(0.10, 0.32, spill)
    m = alpha > 0.5                                   # tighten the edge by one pixel, then soften it
    m = binary_erosion(m, iterations=1)
    alpha = np.minimum(alpha, gaussian_filter(m.astype(np.float32), 0.9))
    out = im.copy()
    out[..., 1] = np.minimum(g, np.maximum(r, b) + 0.02)   # despill
    for box in a.erase:
        x0, y0, x1, y1 = [int(v) for v in box.split(",")]
        alpha[y0:y1, x0:x1] = 0
    rgba = np.dstack([out, alpha])
    img = Image.fromarray((np.clip(rgba, 0, 1) * 255).astype(np.uint8), "RGBA")
    if a.crop:
        ys, xs = np.where(alpha > 0.02)
        x0, y0 = max(0, xs.min() - 8), max(0, ys.min() - 8)
        x1, y1 = min(img.width, xs.max() + 9), min(img.height, ys.max() + 9)
        img = img.crop((x0, y0, x1, y1))
        print(f"{a.out}: crop offset {x0},{y0} size {x1 - x0}x{y1 - y0}")
    img.save(a.out)


if __name__ == "__main__":
    main()
