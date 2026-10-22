"""Build the Wanted Sans subset the site actually needs.

The site used to ship `wanted-sans`'s split build: 92 woff2 files, one per
Unicode range. A single page view pulled 15 of them, and every one of those
is a CDN request.

This script collects every character that appears in the pages and their
scripts, plus a small safety set, and cuts one variable woff2 down to those
glyphs. One request, roughly a tenth of the bytes.

Run it again whenever page copy changes:

    python scripts/subset-font.py

Needs fonttools (`pip install fonttools brotli`).
"""

from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "node_modules/wanted-sans/fonts/webfonts/variable/complete/woff2/WantedSansVariable.woff2"
OUT = ROOT / "src/fonts/WantedSansVariable.subset.woff2"

# Would-be glyphs if the copy changes: the Hangul compatibility jamo, and the
# punctuation the site uses around Korean sentences.
SAFETY = (
    "".join(chr(c) for c in range(0x3131, 0x318F))
    + "·…—–‘’“”" + "×※•→←↑↓↔" + "₩°±"
)

SOURCES = ["index.html", "updates.html", "story.html", "public/privacy.html", "src/main.js", "src/updates.js", "src/story.js", "src/style.css"]


def main() -> int:
    if not SOURCE.exists():
        print(f"missing {SOURCE}", file=sys.stderr)
        return 1

    chars = set(SAFETY)
    for name in SOURCES:
        chars.update((ROOT / name).read_text(encoding="utf-8"))

    # everything a browser or a formatted number can add on its own
    chars.update(chr(c) for c in range(0x20, 0x7F))
    chars.update("\u00a0\u2009\u200b\u2028\u2029\ufeff")

    text = "".join(sorted(c for c in chars if not c.isspace() or c in " \u00a0"))
    # pyftsubset takes a text file; keep every character, whitespace included
    charset_file = ROOT / "scripts/.font-charset.txt"
    charset_file.write_text("".join(sorted(chars)), encoding="utf-8")

    OUT.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run(
        [
            sys.executable,
            "-m",
            "fontTools.subset",
            str(SOURCE),
            f"--text-file={charset_file}",
            f"--output-file={OUT}",
            "--flavor=woff2",
            "--layout-features=*",
            "--no-hinting",
            "--desubroutinize",
            "--drop-tables+=DSIG",
            "--name-IDs=*",
            "--recalc-bounds",
        ],
        check=True,
    )
    charset_file.unlink(missing_ok=True)

    print(f"{OUT.relative_to(ROOT)}: {OUT.stat().st_size / 1024:.1f} KB, {len(chars)} characters")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
