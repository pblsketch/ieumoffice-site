# -*- coding: utf-8 -*-
"""참가신청서.hwpx — claw-hwp(create.js + hwpx-edit.js) 생성기.

claw-hwp 플러그인이 설치돼 있어야 한다:
  ~/.claude/plugins/cache/claw-hwp/claw-hwp/<버전>/skills/hwp/scripts/
"""
import json
import subprocess
import sys
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / "samples" / "참가신청서.hwpx"
CACHE = Path.home() / ".claude" / "plugins" / "cache" / "claw-hwp" / "claw-hwp"


def scripts_dir():
    preferred = CACHE / "1.5.57" / "skills" / "hwp" / "scripts"
    if preferred.exists():
        return preferred
    found = sorted(CACHE.glob("*/skills/hwp/scripts"))
    if not found:
        sys.exit("claw-hwp 플러그인을 찾지 못했습니다.")
    return found[-1]


def run(script, payload):
    res = subprocess.run(["node", str(script)], input=json.dumps(payload, ensure_ascii=False),
                         capture_output=True, text=True, encoding="utf-8")
    raw = (res.stdout or "").strip()
    try:
        out = json.loads(raw)
    except json.JSONDecodeError:
        try:
            out = json.loads(raw.splitlines()[-1])
        except (json.JSONDecodeError, IndexError):
            sys.exit(f"{script.name}: 결과를 읽지 못함\n{raw[-2000:]}\n{res.stderr[-2000:]}")
    if res.returncode != 0 or out.get("status") == "error" or out.get("ok") is False:
        sys.exit(f"{script.name} 실패: {res.stdout}\n{res.stderr}")
    return out


BOX = "□"

CREATE_OPS = [
    {"type": "setup_document", "page_size": "a4", "orientation": "portrait", "margin_mm": 20},
    # 첫 문단은 구역 정의를 품는다. rhwp는 이 문단의 앞 16글자 글자 모양을 잘못 짚으므로
    # 꾸밈 없는 빈 문단을 먼저 둔다.
    {"type": "append_paragraph", "text": " "},
    {"type": "append_paragraph", "text": "이음책방 · 2026 가을 골목 북페어", "align": "center",
     "runs": [{"text": "이음책방 · 2026 가을 골목 북페어", "color": "#4338CA", "bold": True,
               "fontSize": 11}]},
    {"type": "append_heading", "level": 1, "text": "참가 신청서", "align": "center"},
    {"type": "append_paragraph",
     "text": "참가를 원하는 서점·출판사·공방은 이 신청서를 작성해 10월 20일(화)까지 "
             "hello@example.com으로 보내 주세요. 선정 결과는 10월 23일에 개별 안내합니다.",
     "runs": [{"text": "참가를 원하는 서점·출판사·공방은 이 신청서를 작성해 10월 20일(화)까지 "
                       "hello@example.com으로 보내 주세요. 선정 결과는 10월 23일에 개별 안내합니다.",
               "color": "#5F5C86", "fontSize": 10}]},

    {"type": "append_heading", "level": 2, "text": "1. 신청자 정보"},
    {"type": "append_table", "no_header": True,
     "rows": [
         ["상호(단체명)", "", "대표자", ""],
         ["담당자", "", "연락처", "010-    -    "],
         ["이메일", "", "구분", f"{BOX} 개인   {BOX} 사업자   {BOX} 단체"],
         ["주소", "", "", ""],
         ["소개", "", "", ""],
     ],
     "col_widths_cm": [3.0, 5.5, 2.6, 5.9],
     "merges": [
         {"from_row": 3, "from_col": 1, "to_row": 3, "to_col": 3},
         {"from_row": 4, "from_col": 1, "to_row": 4, "to_col": 3},
     ]},

    {"type": "append_heading", "level": 2, "text": "2. 참가 부문"},
    {"type": "append_table",
     "headers": ["선택", "부문", "운영 내용", "부스 크기"],
     "rows": [
         [BOX, "서점 부스", "신간·추천 도서 판매", "3m × 3m"],
         [BOX, "출판사 부스", "자사 도서 판매·홍보", "3m × 3m"],
         [BOX, "공방·체험", "만들기 체험 운영", "3m × 3m"],
         [BOX, "중고책 교환", "교환 장터 운영 참여", "테이블 1개"],
         [BOX, "프로그램 제안", "강연·낭독·공연 제안", "협의"],
     ],
     "col_widths_cm": [1.8, 3.6, 7.6, 4.0],
     "header_fill": "#E4E2FA"},
    {"type": "append_paragraph",
     "text": f"참가 희망 일자   {BOX} 10.31(토)   {BOX} 11.1(일)   {BOX} 11.2(월)   {BOX} 전 일정",
     "runs": [{"text": "참가 희망 일자", "bold": True, "color": "#1E1B4B"},
              {"text": f"   {BOX} 10.31(토)   {BOX} 11.1(일)   {BOX} 11.2(월)   {BOX} 전 일정"}]},

    {"type": "append_heading", "level": 2, "text": "3. 개인정보 수집·이용 동의"},
    {"type": "append_table",
     "headers": ["수집 목적", "수집 항목", "보유 기간"],
     "rows": [["참가 신청 확인, 행사 안내", "상호, 대표자, 담당자, 연락처, 이메일, 주소",
               "행사 종료 후 6개월"]],
     "col_widths_cm": [4.6, 8.0, 4.4],
     "header_fill": "#E4E2FA"},
    {"type": "append_paragraph",
     "text": f"위와 같이 개인정보를 수집·이용하는 데 동의합니다.     {BOX} 동의함    {BOX} 동의하지 않음",
     "runs": [{"text": "위와 같이 개인정보를 수집·이용하는 데 동의합니다.", "bold": True},
              {"text": f"     {BOX} 동의함    {BOX} 동의하지 않음"}]},
    {"type": "append_paragraph",
     "text": "※ 동의하지 않을 수 있으며, 이 경우 참가 신청이 제한될 수 있습니다.",
     "runs": [{"text": "※ 동의하지 않을 수 있으며, 이 경우 참가 신청이 제한될 수 있습니다.",
               "color": "#5F5C86", "fontSize": 9}]},

    {"type": "append_paragraph", "text": "위와 같이 2026 가을 골목 북페어 참가를 신청합니다.",
     "align": "center", "spacing_before": 1700},
    {"type": "append_paragraph", "text": "2026년        월        일", "align": "center",
     "spacing_before": 800},
    {"type": "append_paragraph", "text": "신청인                              (서명 또는 인)",
     "align": "right", "spacing_before": 800},
    {"type": "append_paragraph", "text": "이음책방 대표 귀하", "align": "center",
     "spacing_before": 900,
     "runs": [{"text": "이음책방 대표 귀하", "bold": True, "fontSize": 14, "color": "#1E1B4B"}]},
]


def main():
    sd = scripts_dir()
    OUT.parent.mkdir(parents=True, exist_ok=True)
    created = run(sd / "create.js", {
        "path": str(OUT),
        "allow_overwrite": True,
        "theme": "corporate",
        "theme_overrides": {"headingColors": {"1": "#1E1B4B", "2": "#4338CA"},
                            "headerFill": "#E4E2FA"},
        "operations": CREATE_OPS,
    })
    print("create:", created.get("status"), created.get("bytes_written"), "bytes")

    # 신청자 정보 표: 라벨 칸 음영 + 가운데 정렬
    label_cells = [(0, 0), (0, 2), (1, 0), (1, 2), (2, 0), (2, 2), (3, 0), (4, 0)]
    edit_ops = []
    for r, c in label_cells:
        edit_ops.append({"type": "set_cell_background", "table": 0, "row": r, "col": c,
                         "color": "#F4F3FC", "mode": "cellzone"})
        edit_ops.append({"type": "set_cell_align", "table": 0, "row": r, "col": c,
                         "horizontal": "CENTER", "vertical": "CENTER"})
    # 손으로 쓸 칸이 넉넉하도록 행 높이를 키운다 (HWP 단위, 약 283.46/mm)
    table0_cells = [(r, c) for r in range(3) for c in range(4)] + [(3, 0), (3, 1), (4, 0), (4, 1)]
    for r, c in table0_cells:
        edit_ops.append({"type": "set_cell_size", "table": 0, "row": r, "col": c,
                         "height": 4300 if r == 4 else 2700})
        if c in (1, 3):
            edit_ops.append({"type": "set_cell_align", "table": 0, "row": r, "col": c,
                             "vertical": "CENTER"})
    for r in range(6):
        for c in range(4):
            edit_ops.append({"type": "set_cell_size", "table": 1, "row": r, "col": c,
                             "height": 2200})
    for c in range(3):
        for r in range(2):
            edit_ops.append({"type": "set_cell_size", "table": 2, "row": r, "col": c,
                             "height": 2200})
    for r in range(1, 6):
        edit_ops.append({"type": "set_cell_align", "table": 1, "row": r, "col": 0,
                         "horizontal": "CENTER", "vertical": "CENTER"})
        edit_ops.append({"type": "set_cell_align", "table": 1, "row": r, "col": 3,
                         "horizontal": "CENTER", "vertical": "CENTER"})
    # 표 전체 너비를 본문 너비(A4 210mm - 여백 20mm x 2 = 170mm)에 맞춘다.
    # create.js는 hp:sz 너비(47620)와 칸 너비 합(48196)을 다르게 적는데,
    # rhwp 0.8.x(이음오피스 한글 편집기)는 둘이 다르면 마지막 열만 남기고 열을 접어 버린다.
    # set_table_size는 칸 너비를 비례로 맞춘 뒤 hp:sz를 다시 쓴다.
    for t in range(3):
        edit_ops.append({"type": "set_table_size", "table": t, "width_mm": 170})
        edit_ops.append({"type": "set_table_margin", "table": t, "left": 0, "right": 0})
    edited = run(sd / "hwpx-edit.js", {"path": str(OUT), "output": str(OUT),
                                       "operations": edit_ops})
    print("edit:", edited.get("ok"), len(edited.get("results", [])), "ops")
    check_table_widths(OUT)
    print(OUT)


def check_table_widths(path):
    """모든 표에서 hp:sz 너비 == 각 행의 칸 너비 합인지 확인한다."""
    import re
    import zipfile
    s = zipfile.ZipFile(path).read("Contents/section0.xml").decode("utf-8")
    for ti, tbl in enumerate(re.findall(r"<hp:tbl .*?</hp:tbl>", s, re.S)):
        sz = int(re.search(r'<hp:sz width="(\d+)"', tbl).group(1))
        rows = re.findall(r"<hp:tr>.*?</hp:tr>", tbl, re.S)
        sums = [sum(int(w) for w in re.findall(r'<hp:cellSz width="(\d+)"', tr)) for tr in rows]
        cols = [[int(w) for w in re.findall(r'<hp:cellSz width="(\d+)"', tr)] for tr in rows][0]
        print(f"table {ti}: sz={sz} row sums={sorted(set(sums))} first row={cols}")
        if any(x != sz for x in sums) or min(cols) < 3000:
            sys.exit(f"table {ti}: 표 너비와 칸 너비 합이 맞지 않습니다")


if __name__ == "__main__":
    main()
