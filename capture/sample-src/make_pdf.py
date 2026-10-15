# -*- coding: utf-8 -*-
"""북페어_안내문.pdf — reportlab 생성기 (A4 2쪽 안내문)."""
from pathlib import Path

from reportlab.lib.colors import HexColor, white
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas

OUT = Path(__file__).resolve().parent.parent / "samples" / "북페어_안내문.pdf"

pdfmetrics.registerFont(TTFont("Malgun", "C:/Windows/Fonts/malgun.ttf"))
pdfmetrics.registerFont(TTFont("MalgunBd", "C:/Windows/Fonts/malgunbd.ttf"))

INDIGO = HexColor("#4338CA")
INDIGO_DEEP = HexColor("#312A9E")
INDIGO_SOFT = HexColor("#E4E2FA")
AMBER = HexColor("#FFB020")
AMBER_SOFT = HexColor("#FFF1D2")
OFF = HexColor("#F7F7FB")
DARK = HexColor("#1E1B4B")
MUTED = HexColor("#5F5C86")
LINE = HexColor("#E2E0F4")

W, H = A4
M = 18 * mm


def t(c, x, y, s, size, font="Malgun", color=DARK):
    c.setFont(font, size)
    c.setFillColor(color)
    c.drawString(x, y, s)


def tc(c, x, y, s, size, font="Malgun", color=DARK):
    c.setFont(font, size)
    c.setFillColor(color)
    c.drawCentredString(x, y, s)


def wrap(text, font, size, width):
    """공백 단위로 줄을 나눈다(한국어 어절 단위)."""
    words, lines, cur = text.split(" "), [], ""
    for w in words:
        trial = (cur + " " + w).strip()
        if pdfmetrics.stringWidth(trial, font, size) <= width:
            cur = trial
        else:
            lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    return lines


def para(c, x, y, text, size, width, font="Malgun", color=DARK, leading=1.6):
    for ln in wrap(text, font, size, width):
        t(c, x, y, ln, size, font, color)
        y -= size * leading
    return y


def footer(c, page):
    c.setStrokeColor(LINE)
    c.setLineWidth(0.6)
    c.line(M, 16 * mm, W - M, 16 * mm)
    t(c, M, 11 * mm, "이음책방 · 2026 가을 골목 북페어 안내문", 8, color=MUTED)
    c.setFont("MalgunBd", 8)
    c.setFillColor(INDIGO)
    c.drawRightString(W - M, 11 * mm, f"{page} / 2")


def page1(c):
    # 머리 띠
    band_h = 92 * mm
    c.setFillColor(INDIGO)
    c.rect(0, H - band_h, W, band_h, stroke=0, fill=1)
    c.setFillColor(INDIGO_DEEP)
    c.circle(W - 30 * mm, H - 30 * mm, 46 * mm, stroke=0, fill=1)
    c.setFillColor(AMBER)
    c.circle(W - 24 * mm, H - band_h + 20 * mm, 13 * mm, stroke=0, fill=1)
    # 책 더미
    books = [(W - 66 * mm, H - 62 * mm, 44 * mm, white),
             (W - 62 * mm, H - 55 * mm, 38 * mm, AMBER_SOFT),
             (W - 68 * mm, H - 48 * mm, 41 * mm, HexColor("#C7C3F2")),
             (W - 60 * mm, H - 41 * mm, 33 * mm, AMBER)]
    for bx, by, bw, col in books:
        c.setFillColor(col)
        c.roundRect(bx, by, bw, 6.2 * mm, 1.6 * mm, stroke=0, fill=1)
        c.setFillColor(INDIGO_DEEP)
        c.rect(bx + 3 * mm, by + 1.5 * mm, 0.9 * mm, 3.2 * mm, stroke=0, fill=1)

    c.setFillColor(AMBER)
    c.rect(M, H - 24 * mm, 12 * mm, 1.6 * mm, stroke=0, fill=1)
    t(c, M, H - 32 * mm, "이음책방 개점 7주년 · 동네 책 축제", 11, "MalgunBd", AMBER)
    t(c, M, H - 47 * mm, "2026 가을", 26, "MalgunBd", white)
    t(c, M, H - 62 * mm, "골목 북페어", 34, "MalgunBd", white)
    t(c, M, H - 74 * mm, "책 한 권으로 이어지는 골목의 사흘", 12.5, "Malgun", INDIGO_SOFT)
    c.setFillColor(INDIGO_DEEP)
    c.roundRect(M, H - 87 * mm, 98 * mm, 9 * mm, 4.5 * mm, stroke=0, fill=1)
    t(c, M + 5 * mm, H - 84 * mm, "10.31(토) – 11.2(월)  ·  매일 11:00–20:00", 10, "MalgunBd", white)

    # 행사 정보 상자
    y_top = H - band_h - 10 * mm
    box_h = 46 * mm
    c.setFillColor(OFF)
    c.setStrokeColor(LINE)
    c.roundRect(M, y_top - box_h, W - 2 * M, box_h, 4 * mm, stroke=1, fill=1)
    info = [("일정", "2026. 10. 31.(토) ~ 11. 2.(월)", "매일 11:00 ~ 20:00"),
            ("장소", "이음책방 및 연남 골목 일대", "참여 공간 9곳 · 메인 무대 골목 쉼터"),
            ("입장", "누구나 무료", "사전 신청 없이 입장, 체험은 현장 선착순"),
            ("문의", "이음책방 기획팀", "010-0000-0000 · hello@example.com")]
    col_w = (W - 2 * M) / 2
    for i, (k, v, sub) in enumerate(info):
        cx = M + 8 * mm + (i % 2) * col_w
        cy = y_top - 13 * mm - (i // 2) * 19 * mm
        c.setFillColor(INDIGO)
        c.roundRect(cx, cy - 1.6 * mm, 13 * mm, 6.4 * mm, 3.2 * mm, stroke=0, fill=1)
        tc(c, cx + 6.5 * mm, cy, k, 8.5, "MalgunBd", white)
        t(c, cx + 17 * mm, cy, v, 11, "MalgunBd", DARK)
        t(c, cx + 17 * mm, cy - 6 * mm, sub, 8.5, "Malgun", MUTED)

    # 프로그램
    y = y_top - box_h - 13 * mm
    c.setFillColor(AMBER)
    c.rect(M, y + 1 * mm, 3 * mm, 3 * mm, stroke=0, fill=1)
    t(c, M + 6 * mm, y, "날짜별 프로그램", 14, "MalgunBd", DARK)
    t(c, M + 48 * mm, y, "모든 프로그램 무료", 9, "Malgun", MUTED)
    y -= 8 * mm

    days = [
        ("10.31", "토", [("11:00", "개막 · 골목 책 장터 오픈", "골목 전역"),
                         ("15:00", "작가와의 대화 ‘동네를 쓰는 법’", "이음책방 2층"),
                         ("19:00", "책 읽는 밤 — 낭독과 어쿠스틱 공연", "골목 쉼터")]),
        ("11.1", "일", [("11:00", "어린이 그림책 만들기 체험", "공방 작은손"),
                        ("14:00", "독립출판 제작 워크숍", "카페 온기"),
                        ("17:00", "중고책 교환 장터", "골목 쉼터")]),
        ("11.2", "월", [("13:00", "북 큐레이터 추천 강연", "이음책방 2층"),
                        ("18:00", "폐막 · 스탬프 완주 선물 증정", "골목 쉼터")]),
    ]
    row_h = 9.2 * mm
    for d, wd, rows in days:
        block_h = row_h * len(rows) + 3 * mm
        c.setFillColor(INDIGO_SOFT if d != "10.31" else AMBER_SOFT)
        c.roundRect(M, y - block_h + 5 * mm, 24 * mm, block_h - 1 * mm, 2.5 * mm, stroke=0, fill=1)
        tc(c, M + 12 * mm, y - block_h / 2 + 4.5 * mm, d, 13, "MalgunBd", INDIGO)
        tc(c, M + 12 * mm, y - block_h / 2 - 0.5 * mm, f"({wd})", 8.5, "Malgun", MUTED)
        ry = y
        for k, (tm, name, place) in enumerate(rows):
            t(c, M + 30 * mm, ry, tm, 10, "MalgunBd", INDIGO)
            t(c, M + 46 * mm, ry, name, 10.5, "Malgun", DARK)
            c.setFont("Malgun", 9)
            c.setFillColor(MUTED)
            c.drawRightString(W - M - 3 * mm, ry, place)
            if k < len(rows) - 1:
                c.setStrokeColor(LINE)
                c.setLineWidth(0.5)
                c.line(M + 30 * mm, ry - 3.4 * mm, W - M, ry - 3.4 * mm)
            ry -= row_h
        y -= block_h + 3 * mm
    footer(c, 1)


def page2(c):
    c.setFillColor(INDIGO)
    c.rect(0, H - 14 * mm, W, 14 * mm, stroke=0, fill=1)
    t(c, M, H - 9.2 * mm, "2026 가을 골목 북페어 · 오시는 길과 이용 안내", 10, "MalgunBd", white)

    y = H - 30 * mm
    c.setFillColor(AMBER)
    c.rect(M, y + 1 * mm, 3 * mm, 3 * mm, stroke=0, fill=1)
    t(c, M + 6 * mm, y, "골목 지도", 14, "MalgunBd", DARK)
    y -= 6 * mm

    # 약도
    map_h = 92 * mm
    mx, my, mw = M, y - map_h, W - 2 * M
    c.setFillColor(HexColor("#F1F0F8"))
    c.roundRect(mx, my, mw, map_h, 4 * mm, stroke=0, fill=1)
    # 도로
    c.setFillColor(white)
    c.rect(mx, my + 52 * mm, mw, 9 * mm, stroke=0, fill=1)          # 큰길
    c.rect(mx + 46 * mm, my, 7 * mm, map_h, stroke=0, fill=1)       # 세로 골목
    c.rect(mx + 118 * mm, my, 7 * mm, map_h, stroke=0, fill=1)
    c.rect(mx + 46 * mm, my + 22 * mm, 79 * mm, 6 * mm, stroke=0, fill=1)  # 가로 골목
    t(c, mx + 4 * mm, my + 55 * mm, "연남로", 8, "Malgun", MUTED)
    t(c, mx + 60 * mm, my + 24 * mm, "책방 골목", 8, "Malgun", MUTED)
    # 지하철
    c.setFillColor(HexColor("#2E9E5B"))
    c.circle(mx + 14 * mm, my + 72 * mm, 4.5 * mm, stroke=0, fill=1)
    tc(c, mx + 14 * mm, my + 70.6 * mm, "역", 9, "MalgunBd", white)
    t(c, mx + 20 * mm, my + 70.8 * mm, "골목역 3번 출구", 8.5, "MalgunBd", DARK)
    # 참여 공간 표시
    spots = [
        (mx + 66 * mm, my + 36 * mm, "1", "이음책방", True),
        (mx + 96 * mm, my + 36 * mm, "2", "공방 작은손", False),
        (mx + 66 * mm, my + 12 * mm, "3", "카페 온기", False),
        (mx + 100 * mm, my + 12 * mm, "4", "골목 쉼터", True),
        (mx + 140 * mm, my + 36 * mm, "5", "책방 모퉁이", False),
        (mx + 140 * mm, my + 76 * mm, "6", "출판사 부스 거리", False),
        (mx + 66 * mm, my + 76 * mm, "7", "장바구니 대여소", False),
    ]
    for sx, sy, n, name, key in spots:
        c.setFillColor(AMBER if key else INDIGO)
        c.circle(sx, sy, 3.6 * mm, stroke=0, fill=1)
        tc(c, sx, sy - 1.3 * mm, n, 9, "MalgunBd", DARK if key else white)
        t(c, sx + 5 * mm, sy - 1.2 * mm, name, 8.5, "MalgunBd" if key else "Malgun", DARK)
    # 범례
    c.setFillColor(white)
    lx = mx + 4 * mm
    c.roundRect(lx, my + 4 * mm, 38 * mm, 14 * mm, 2 * mm, stroke=0, fill=1)
    c.setFillColor(AMBER)
    c.circle(lx + 5 * mm, my + 13.5 * mm, 1.8 * mm, stroke=0, fill=1)
    t(c, lx + 9 * mm, my + 12.4 * mm, "주요 무대·안내소", 7.5, "Malgun", DARK)
    c.setFillColor(INDIGO)
    c.circle(lx + 5 * mm, my + 8 * mm, 1.8 * mm, stroke=0, fill=1)
    t(c, lx + 9 * mm, my + 6.9 * mm, "참여 공간·부스", 7.5, "Malgun", DARK)

    y = my - 12 * mm
    # 두 단: 스탬프 투어 / 이용 안내
    col_w = (W - 2 * M - 8 * mm) / 2
    left_x, right_x = M, M + col_w + 8 * mm
    box_h = 88 * mm
    for bx, title, fill in ((left_x, "스탬프 투어", AMBER_SOFT), (right_x, "이용 안내", OFF)):
        c.setFillColor(fill)
        c.roundRect(bx, y - box_h, col_w, box_h, 4 * mm, stroke=0, fill=1)
        t(c, bx + 6 * mm, y - 10 * mm, title, 13, "MalgunBd", DARK)

    yy = y - 20 * mm
    steps = ["안내소에서 지도와 스탬프 카드를 받습니다.",
             "참여 공간 9곳 중 6곳 이상을 들러 도장을 찍습니다.",
             "11월 2일 18시까지 골목 쉼터 안내소에 카드를 내면 완주 선물을 드립니다."]
    for i, s in enumerate(steps, start=1):
        c.setFillColor(INDIGO)
        c.circle(left_x + 9 * mm, yy + 1.2 * mm, 2.8 * mm, stroke=0, fill=1)
        tc(c, left_x + 9 * mm, yy - 0.1 * mm, str(i), 8, "MalgunBd", white)
        yy = para(c, left_x + 14 * mm, yy, s, 9.5, col_w - 20 * mm, leading=1.55) - 3 * mm
    notes = ["행사장 안은 금연이며, 반려동물은 목줄을 꼭 채워 주세요.",
             "장바구니 대여소와 다회용 컵 반납함을 이용해 주세요.",
             "휠체어·유아차 동선은 바닥의 보라색 표시를 따라가세요.",
             "확성 장비는 20시 이전, 무대에서만 사용합니다.",
             "우천 시 일부 부스는 이음책방 2층으로 옮깁니다."]
    yy = y - 20 * mm
    for s in notes:
        c.setFillColor(AMBER)
        c.circle(right_x + 8 * mm, yy + 1.3 * mm, 1.2 * mm, stroke=0, fill=1)
        yy = para(c, right_x + 12 * mm, yy, s, 9.5, col_w - 18 * mm, leading=1.55) - 2.2 * mm

    # 하단 강조 띠
    y2 = y - box_h - 10 * mm
    c.setFillColor(DARK)
    c.roundRect(M, y2 - 16 * mm, W - 2 * M, 16 * mm, 4 * mm, stroke=0, fill=1)
    t(c, M + 7 * mm, y2 - 9.6 * mm, "골목에서 만나요", 13, "MalgunBd", white)
    t(c, M + 48 * mm, y2 - 9.6 * mm, "책 한 권을 들고 오셔도, 빈손으로 오셔도 좋습니다.", 9.5,
      "Malgun", INDIGO_SOFT)
    footer(c, 2)


def main():
    OUT.parent.mkdir(parents=True, exist_ok=True)
    c = canvas.Canvas(str(OUT), pagesize=A4)
    c.setTitle("2026 가을 골목 북페어 안내문")
    c.setAuthor("이음책방")
    c.setSubject("행사 안내")
    page1(c)
    c.showPage()
    page2(c)
    c.showPage()
    c.save()
    print(OUT)


if __name__ == "__main__":
    main()
