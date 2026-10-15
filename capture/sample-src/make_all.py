# -*- coding: utf-8 -*-
"""샘플 문서 8종을 한 번에 다시 만든다: python make_all.py

- docx/xlsx/pptx/pdf/xmind/hwpx는 각 make_*.py가 만든다.
- 회의메모.md, 행사소개.html은 손으로 쓴 원본(static/)을 그대로 복사한다.
- make_xmind.py가 쓰는 xmind_theme.json은 IeumOffice xmind-engine의
  themeTable('pill/harbor/light') 출력이다 (openoffice-release에서 npx tsx로 뽑음).
- make_hwpx.py에는 claw-hwp 플러그인(Claude Code)이 필요하다.
"""
import shutil
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
OUT = HERE.parent / "samples"

SCRIPTS = ["make_docx.py", "make_xlsx.py", "make_pptx.py", "make_pdf.py",
           "make_xmind.py", "make_hwpx.py"]


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    for name in SCRIPTS:
        print(f"== {name}")
        subprocess.run([sys.executable, str(HERE / name)], check=True)
    for f in (HERE / "static").iterdir():
        shutil.copy2(f, OUT / f.name)
        print(f"== copied {f.name}")


if __name__ == "__main__":
    main()
