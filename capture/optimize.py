"""capture/out/*.png -> public/shots/<name>-{1600,2880}.webp

    python capture/optimize.py              # every capture
    python capture/optimize.py split pdf    # only these names
"""
import sys
from pathlib import Path
from PIL import Image

here = Path(__file__).parent
dest = here.parent / "public" / "shots"
dest.mkdir(parents=True, exist_ok=True)
only = set(sys.argv[1:])
for png in sorted((here / "out").glob("*.png")):
    if only and png.stem not in only:
        continue
    img = Image.open(png).convert("RGB")
    for w in (1600, 2880):
        out = img if img.width == w else img.resize((w, round(img.height * w / img.width)), Image.LANCZOS)
        target = dest / f"{png.stem}-{w}.webp"
        out.save(target, "WEBP", quality=86, method=6)
        print(target.name, target.stat().st_size // 1024, "KB")
