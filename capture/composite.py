"""Lay the captured layers back together: python composite.py <raw-dir> <out.png>"""
import json
import sys
from pathlib import Path

from PIL import Image

raw, out = Path(sys.argv[1]), Path(sys.argv[2])
meta = json.loads((raw / "meta.json").read_text(encoding="utf-8"))
base = Image.open(raw / meta["layers"][0]["file"]).convert("RGB")
scale = base.width / meta["width"]
canvas = Image.new("RGB", (round(meta["width"] * scale), round(meta["height"] * scale)), "white")
canvas.paste(base, (0, 0))
for layer in meta["layers"][1:]:
    img = Image.open(raw / layer["file"]).convert("RGB")
    size = (round(layer["width"] * scale), round(layer["height"] * scale))
    if img.size != size:
        img = img.resize(size, Image.LANCZOS)
    canvas.paste(img, (round(layer["x"] * scale), round(layer["y"] * scale)))
canvas.save(out, optimize=True)
print(f"composited {out.name} {canvas.size}")
