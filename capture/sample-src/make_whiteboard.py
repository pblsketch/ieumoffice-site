"""Creates capture/samples/북페어_기획보드.whiteboard for the 0.13.1 website showcase.

Two-page warm paper-craft planning board for the shared "가을 골목 북페어" sample set:
  Page 1: 2026 가을 골목 북페어 · 운영 기획 보드
    - Flow diagram (shapes + anchored connectors with labels)
    - 6 pastel sticky notes with structured team checklists
    - Parchment timetable + 3 numbered goal cards
    - Link card, die-cut paper stickers, highlighter & pen emphasis strokes
  Page 2: 현장 부스 배치도
    - Clean booth map with zones, arrows, stickers, and notes
"""
from __future__ import annotations

import json
import math
import zipfile
from pathlib import Path

HERE = Path(__file__).parent
OUT = HERE.parent / "samples" / "북페어_기획보드.whiteboard"

ALPHABET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"


def order_key(idx: int) -> str:
    # Deterministic strictly increasing base-62 keys ("a00" .. "azz")
    hi = idx // 62
    lo = idx % 62
    return f"a{ALPHABET[hi]}{ALPHABET[lo]}"


def rt_lines(lines: list[dict | str], align: str | None = None) -> dict:
    paragraphs = []
    for item in lines:
        if isinstance(item, str):
            p: dict = {"runs": [{"text": item}] if item else []}
            if align:
                p["align"] = align
            paragraphs.append(p)
        else:
            p = {"runs": item["runs"]}
            a = item.get("align", align)
            if a:
                p["align"] = a
            paragraphs.append(p)
    return {"paragraphs": paragraphs}


def sticky_rt(heading: str, bullets: list[str], heading_color: str = "#221D17") -> dict:
    lines: list[dict | str] = [
        {"runs": [{"text": heading, "bold": True, "color": heading_color}]},
    ]
    for b in bullets:
        lines.append({"runs": [{"text": f"• {b}", "color": "#221D17"}]})
    return rt_lines(lines, align="left")


def shape_rt(title: str, subtitle: str = "", title_color: str = "#221D17") -> dict:
    lines: list[dict | str] = [
        {"runs": [{"text": title, "bold": True, "color": title_color}], "align": "center"}
    ]
    if subtitle:
        lines.append({"runs": [{"text": subtitle, "color": "#4B4237"}], "align": "center"})
    return rt_lines(lines, align="center")


def highlighter_points(x0: float, y0: float, x1: float, y1: float, wave: float = 2.0, steps: int = 16) -> list[list[float]]:
    pts = []
    for i in range(steps + 1):
        t = i / steps
        x = x0 + (x1 - x0) * t
        y = y0 + (y1 - y0) * t + math.sin(t * math.pi) * wave
        pts.append([round(x, 1), round(y, 1), 0.55])
    return pts


def pen_underline_points(width: float, dip: float = 4.0, steps: int = 18) -> list[list[float]]:
    pts = []
    for i in range(steps + 1):
        t = i / steps
        x = width * t
        y = math.sin(t * math.pi) * dip + math.sin(t * math.pi * 2.5) * 1.1
        pressure = 0.45 + 0.25 * math.sin(t * math.pi)
        pts.append([round(x, 1), round(y, 1), round(pressure, 2)])
    return pts


def build_board() -> dict:
    p1 = "page-plan"
    p2 = "page-booth"
    objs: list[dict] = []

    def add(
        oid: str,
        page_id: str,
        kind: str,
        x: float,
        y: float,
        w: float,
        h: float,
        props: dict,
        rotation: float = 0.0,
    ) -> None:
        objs.append(
            {
                "id": oid,
                "pageId": page_id,
                "kind": kind,
                "orderKey": order_key(len(objs)),
                "x": x,
                "y": y,
                "width": w,
                "height": h,
                "rotation": rotation,
                "props": props,
            }
        )

    # =========================================================================
    # PAGE 1: 2026 가을 골목 북페어 · 운영 기획 보드 (1920 x 1080)
    # =========================================================================

    # Subtle highlighter wash behind the title keyword
    add(
        "p1-title-hi",
        p1,
        "stroke",
        60,
        66,
        365,
        28,
        {
            "tool": "highlighter",
            "color": "#F5C542",
            "width": 26,
            "opacity": 0.45,
            "points": highlighter_points(6, 14, 355, 13, wave=1.8, steps=18),
        },
    )

    # Header title & subtitle
    add(
        "p1-title",
        p1,
        "text",
        64,
        40,
        1040,
        56,
        {
            "text": rt_lines(
                [
                    {
                        "runs": [
                            {"text": "2026 가을 골목 북페어", "bold": True, "color": "#221D17"},
                            {"text": "  ·  운영 기획 보드", "bold": True, "color": "#B4462A"},
                        ]
                    }
                ]
            ),
            "fontSize": 38,
            "color": "#221D17",
            "align": "left",
        },
    )
    add(
        "p1-sub",
        p1,
        "text",
        66,
        98,
        1040,
        36,
        {
            "text": rt_lines(["10월 17–18일(토·일) 11:00–18:30 · 연남동 작은 서점 골목 · 참여 서점 18곳"]),
            "fontSize": 19,
            "color": "#6B6257",
            "align": "left",
        },
    )

    # Top-right status pill & paper-craft stickers
    add(
        "p1-status-pill",
        p1,
        "shape",
        1424,
        52,
        228,
        56,
        {
            "shape": "rounded_rectangle",
            "fill": "#CFE6C2",
            "stroke": "#3F7A2E",
            "strokeWidth": 2.2,
            "text": shape_rt("최종 점검 완료 · D-7", "", "#27541B"),
            "fontSize": 19,
            "align": "center",
        },
    )
    add(
        "p1-sticker-book",
        p1,
        "sticker",
        1678,
        38,
        80,
        80,
        {"stickerId": "book"},
        rotation=-6,
    )
    add(
        "p1-sticker-sparkle",
        p1,
        "sticker",
        1770,
        42,
        66,
        66,
        {"stickerId": "sparkle"},
        rotation=8,
    )

    # --- Three dashed column zones ---
    add(
        "p1-zone-a",
        p1,
        "shape",
        56,
        152,
        590,
        878,
        {
            "shape": "rounded_rectangle",
            "fill": "#F7F2E8",
            "stroke": "#CFC3AF",
            "strokeWidth": 2,
            "lineStyle": "dashed",
            "text": rt_lines([""]),
        },
    )
    add(
        "p1-zone-b",
        p1,
        "shape",
        670,
        152,
        580,
        878,
        {
            "shape": "rounded_rectangle",
            "fill": "#F7F2E8",
            "stroke": "#CFC3AF",
            "strokeWidth": 2,
            "lineStyle": "dashed",
            "text": rt_lines([""]),
        },
    )
    add(
        "p1-zone-c",
        p1,
        "shape",
        1274,
        152,
        590,
        878,
        {
            "shape": "rounded_rectangle",
            "fill": "#F7F2E8",
            "stroke": "#CFC3AF",
            "strokeWidth": 2,
            "lineStyle": "dashed",
            "text": rt_lines([""]),
        },
    )

    # Zone headers
    add(
        "p1-zone-a-title",
        p1,
        "text",
        84,
        172,
        530,
        42,
        {
            "text": rt_lines([{"runs": [{"text": "01  방문객 동선과 현장 흐름", "bold": True, "color": "#B4462A"}]}]),
            "fontSize": 22,
            "color": "#B4462A",
            "align": "left",
        },
    )
    add(
        "p1-zone-b-title",
        p1,
        "text",
        698,
        172,
        520,
        42,
        {
            "text": rt_lines([{"runs": [{"text": "02  팀별 아이디어 & 체크 메모", "bold": True, "color": "#1E6B66"}]}]),
            "fontSize": 22,
            "color": "#1E6B66",
            "align": "left",
        },
    )
    add(
        "p1-zone-c-title",
        p1,
        "text",
        1302,
        172,
        530,
        42,
        {
            "text": rt_lines([{"runs": [{"text": "03  당일 시간표 & 핵심 목표", "bold": True, "color": "#2F5FA8"}]}]),
            "fontSize": 22,
            "color": "#2F5FA8",
            "align": "left",
        },
    )

    # =========================================================================
    # ZONE A: Visitor Flow Diagram + Link Card
    # =========================================================================
    add(
        "flow-entry",
        p1,
        "shape",
        106,
        232,
        490,
        92,
        {
            "shape": "rounded_rectangle",
            "fill": "#C9DDF0",
            "stroke": "#2F5FA8",
            "strokeWidth": 2.5,
            "text": shape_rt("입구 안내 데스크", "리플릿 배부 · 스탬프 카드 수령", "#1B3D70"),
            "fontSize": 19,
            "align": "center",
        },
    )
    add(
        "flow-decide",
        p1,
        "shape",
        226,
        384,
        250,
        122,
        {
            "shape": "diamond",
            "fill": "#FBE7A1",
            "stroke": "#C8641E",
            "strokeWidth": 2.5,
            "text": shape_rt("스탬프 투어", "참여할까요?", "#7A3B0E"),
            "fontSize": 18,
            "align": "center",
        },
    )
    add(
        "flow-shops",
        p1,
        "shape",
        88,
        568,
        244,
        106,
        {
            "shape": "rounded_rectangle",
            "fill": "#CFE6C2",
            "stroke": "#3F7A2E",
            "strokeWidth": 2.5,
            "text": shape_rt("독립서점 18곳", "스탬프 4개 모으기", "#244D18"),
            "fontSize": 18,
            "align": "center",
        },
    )
    add(
        "flow-stage",
        p1,
        "shape",
        370,
        568,
        244,
        106,
        {
            "shape": "rounded_rectangle",
            "fill": "#E9DEF2",
            "stroke": "#6E4A9E",
            "strokeWidth": 2.5,
            "text": shape_rt("마당 낭독 무대", "14:00 작가 낭독회", "#472C6E"),
            "fontSize": 18,
            "align": "center",
        },
    )
    add(
        "flow-goods",
        p1,
        "shape",
        134,
        734,
        434,
        94,
        {
            "shape": "rounded_rectangle",
            "fill": "#F7C9C4",
            "stroke": "#B4462A",
            "strokeWidth": 2.5,
            "text": shape_rt("골목 쉼터 & 굿즈 교환소", "한정 에코백 · 책갈피 증정", "#7A2A16"),
            "fontSize": 19,
            "align": "center",
        },
    )

    # Anchored Connectors
    add(
        "conn-1",
        p1,
        "connector",
        0,
        0,
        0,
        0,
        {
            "start": {"objectId": "flow-entry", "anchorX": 0.5, "anchorY": 1.0},
            "end": {"objectId": "flow-decide", "anchorX": 0.5, "anchorY": 0.0},
            "routing": "straight",
            "startHead": "none",
            "endHead": "arrow",
            "color": "#2F5FA8",
            "strokeWidth": 2.8,
            "label": rt_lines(["도보 1분"]),
        },
    )
    add(
        "conn-2",
        p1,
        "connector",
        0,
        0,
        0,
        0,
        {
            "start": {"objectId": "flow-decide", "anchorX": 0.0, "anchorY": 0.5},
            "end": {"objectId": "flow-shops", "anchorX": 0.5, "anchorY": 0.0},
            "routing": "elbow",
            "waypoints": [{"x": 210, "y": 445}],
            "startHead": "none",
            "endHead": "arrow",
            "color": "#3F7A2E",
            "strokeWidth": 2.8,
            "label": rt_lines(["참여"]),
        },
    )
    add(
        "conn-3",
        p1,
        "connector",
        0,
        0,
        0,
        0,
        {
            "start": {"objectId": "flow-decide", "anchorX": 1.0, "anchorY": 0.5},
            "end": {"objectId": "flow-stage", "anchorX": 0.5, "anchorY": 0.0},
            "routing": "elbow",
            "waypoints": [{"x": 492, "y": 445}],
            "startHead": "none",
            "endHead": "arrow",
            "color": "#6E4A9E",
            "strokeWidth": 2.8,
            "label": rt_lines(["바로 이동"]),
        },
    )
    add(
        "conn-4",
        p1,
        "connector",
        0,
        0,
        0,
        0,
        {
            "start": {"objectId": "flow-shops", "anchorX": 0.5, "anchorY": 1.0},
            "end": {"objectId": "flow-goods", "anchorX": 0.28, "anchorY": 0.0},
            "routing": "straight",
            "startHead": "none",
            "endHead": "arrow",
            "color": "#B4462A",
            "strokeWidth": 2.6,
        },
    )
    add(
        "conn-5",
        p1,
        "connector",
        0,
        0,
        0,
        0,
        {
            "start": {"objectId": "flow-stage", "anchorX": 0.5, "anchorY": 1.0},
            "end": {"objectId": "flow-goods", "anchorX": 0.72, "anchorY": 0.0},
            "routing": "straight",
            "startHead": "none",
            "endHead": "arrow",
            "color": "#B4462A",
            "strokeWidth": 2.6,
        },
    )

    # Link card at bottom of Zone A
    add(
        "p1-link-map",
        p1,
        "link",
        88,
        884,
        526,
        104,
        {
            "url": "https://ieumoffice.com/bookfair-map",
            "title": "가을 골목 북페어 참가 서점 지도",
            "description": "서점별 위치 · 주차장 안내 · 우천 시 실내 대피 공간 정리",
        },
    )

    # Zone A stickers
    add("p1-st-flag", p1, "sticker", 564, 206, 58, 58, {"stickerId": "flag"}, rotation=7)
    add("p1-st-check", p1, "sticker", 538, 706, 56, 56, {"stickerId": "check"}, rotation=-6)

    # =========================================================================
    # ZONE B: 6 Pastel Sticky Notes + Hand-drawn Pen Accent + Stickers
    # =========================================================================
    stickies = [
        (
            "st-promo",
            698,
            234,
            "#FBE7A1",
            -1.2,
            "홍보 · 현장 안내",
            ["골목 입구 배너 3개 설치", "서점별 스탬프 잉크 점검", "현장 사진 2시간마다 공유"],
            "#7A4F0B",
        ),
        (
            "st-safety",
            972,
            238,
            "#F7C9C4",
            1.3,
            "안전 · 우천 대비",
            ["접이식 천막 6동 예약", "구급함 안내 데스크 비치", "골목 차량 통제 오전 9시"],
            "#8A281A",
        ),
        (
            "st-author",
            700,
            490,
            "#CFE6C2",
            0.8,
            "작가 프로그램",
            ["14:00 시 낭독 (마당 무대)", "16:00 독립출판 토크쇼", "무선 마이크 여분 배터리!"],
            "#245218",
        ),
        (
            "st-goods",
            970,
            494,
            "#C9DDF0",
            -1.1,
            "굿즈 & 정산",
            ["에코백 300개 입고 확인", "책갈피 3종 세트 포장", "카드 단말기 통신 테스트"],
            "#1B4075",
        ),
        (
            "st-exp",
            698,
            748,
            "#F9CFA0",
            -0.7,
            "방문객 체험 코너",
            ["나만의 책도장 만들기", "추천 책 한 줄 메모판", "어린이 그림책 쉼터 매트"],
            "#7F3F0C",
        ),
        (
            "st-wrap",
            972,
            744,
            "#E9DEF2",
            1.1,
            "마감 & 사후 정리",
            ["분리수거 구역 2곳 표시", "참여 서점 정산서 월요일", "출구 후기 설문 QR 비치"],
            "#4A2A75",
        ),
    ]
    for sid, sx, sy, scol, srot, head, bullets, hcol in stickies:
        add(
            sid,
            p1,
            "sticky",
            sx,
            sy,
            250,
            224,
            {
                "color": scol,
                "text": sticky_rt(head, bullets, hcol),
                "fontSize": 18,
                "align": "left",
            },
            rotation=srot,
        )

    # Hand-drawn pen underline beneath "무선 마이크 여분 배터리!" inside st-author
    add(
        "p1-pen-underline",
        p1,
        "stroke",
        724,
        616,
        204,
        14,
        {
            "tool": "pen",
            "color": "#B4462A",
            "width": 4.2,
            "opacity": 0.92,
            "points": pen_underline_points(198, dip=4.0),
        },
    )

    # Zone B stickers
    add("p1-st-bulb", p1, "sticker", 906, 206, 62, 62, {"stickerId": "bulb"}, rotation=10)
    add("p1-st-star", p1, "sticker", 1180, 466, 60, 60, {"stickerId": "star"}, rotation=-8)
    add("p1-st-heart", p1, "sticker", 904, 932, 56, 56, {"stickerId": "heart"}, rotation=6)

    # =========================================================================
    # ZONE C: Timetable Table + 3 Numbered Goals + Highlighter
    # =========================================================================
    table_rows = [
        ("시간", "주요 일정", "담당 팀"),
        ("09:00 – 10:30", "부스 설치·전기 점검", "운영 지원팀"),
        ("10:30 – 11:00", "참여 서점 입고 확인", "현장 진행팀"),
        ("11:00 – 14:00", "개장 · 스탬프 투어", "안내 데스크"),
        ("14:00 – 16:30", "작가 낭독·토크쇼", "프로그램팀"),
        ("18:30 – 19:30", "마감 정리·정산 집계", "전체 스태프"),
    ]
    cells = {}
    for ri, row in enumerate(table_rows):
        for ci, val in enumerate(row):
            key = f"r{ri + 1}:c{ci + 1}"
            cells[key] = rt_lines(
                [{"runs": [{"text": val, "bold": ri == 0 or ci == 0, "color": "#221D17"}]}]
            )
    add(
        "p1-table",
        p1,
        "table",
        1302,
        234,
        534,
        354,
        {
            "rowIds": [f"r{i + 1}" for i in range(len(table_rows))],
            "colIds": ["c1", "c2", "c3"],
            "headerRow": True,
            "fontSize": 16,
            "cells": cells,
        },
    )

    # Highlighter band accentuating the 14:00 author program row
    add(
        "p1-row-hi",
        p1,
        "stroke",
        1308,
        476,
        520,
        24,
        {
            "tool": "highlighter",
            "color": "#F5C542",
            "width": 26,
            "opacity": 0.34,
            "points": highlighter_points(6, 12, 514, 12, wave=1.2, steps=18),
        },
    )

    # 3 numbered goal cards
    goals = [
        ("g1", "one", 626, "#1E6B66", "방문객 1,500명 · 스탬프 완주율 45% 달성", "주말 이틀 누적 기준 · 출구 카운터 집계"),
        ("g2", "two", 756, "#2F5FA8", "참여 서점 18곳 평균 판매 20% 끌어올리기", "서점별 추천 도서 큐레이션 카드 제공"),
        ("g3", "three", 886, "#B4462A", "일회용 컵 없는 친환경 골목 북페어 운영", "다회용 컵 대여 부스 · 분리수거 안내"),
    ]
    for gid, st_id, gy, stroke_col, g_title, g_sub in goals:
        add(
            f"p1-goal-{gid}",
            p1,
            "shape",
            1320,
            gy,
            516,
            106,
            {
                "shape": "rounded_rectangle",
                "fill": "#FFFDF8",
                "stroke": stroke_col,
                "strokeWidth": 2.2,
                "text": rt_lines(
                    [
                        {"runs": [{"text": g_title, "bold": True, "color": "#221D17"}], "align": "left"},
                        {"runs": [{"text": g_sub, "color": "#6B6257"}], "align": "left"},
                    ],
                    align="left",
                ),
                "fontSize": 17,
                "align": "left",
            },
        )
        add(
            f"p1-goal-st-{gid}",
            p1,
            "sticker",
            1288,
            gy - 16,
            54,
            54,
            {"stickerId": st_id},
        )

    add("p1-st-trophy", p1, "sticker", 1784, 932, 68, 68, {"stickerId": "trophy"}, rotation=7)

    # =========================================================================
    # PAGE 2: 현장 부스 배치도 (gives the left page rail a lively 2nd thumbnail)
    # =========================================================================
    add(
        "p2-title",
        p2,
        "text",
        72,
        48,
        900,
        54,
        {
            "text": rt_lines([{"runs": [{"text": "현장 부스 배치도 · 연남동 골목", "bold": True, "color": "#221D17"}]}]),
            "fontSize": 36,
            "color": "#221D17",
            "align": "left",
        },
    )
    add(
        "p2-zone-a",
        p2,
        "shape",
        88,
        160,
        520,
        760,
        {
            "shape": "rounded_rectangle",
            "fill": "#CFE6C2",
            "stroke": "#3F7A2E",
            "strokeWidth": 2.5,
            "text": shape_rt("A구역 · 독립서점 1~9", "소설 · 시 · 에세이 큐레이션", "#244D18"),
            "fontSize": 24,
            "align": "center",
        },
    )
    add(
        "p2-stage",
        p2,
        "shape",
        696,
        240,
        520,
        560,
        {
            "shape": "ellipse",
            "fill": "#FBE7A1",
            "stroke": "#C8641E",
            "strokeWidth": 3,
            "text": shape_rt("중앙 마당 무대", "낭독회 · 토크쇼 · 쉼터", "#7A3B0E"),
            "fontSize": 26,
            "align": "center",
        },
    )
    add(
        "p2-zone-b",
        p2,
        "shape",
        1304,
        160,
        520,
        760,
        {
            "shape": "rounded_rectangle",
            "fill": "#C9DDF0",
            "stroke": "#2F5FA8",
            "strokeWidth": 2.5,
            "text": shape_rt("B구역 · 독립서점 10~18", "그림책 · 사진집 · 진(Zine)", "#1B3D70"),
            "fontSize": 24,
            "align": "center",
        },
    )
    add(
        "p2-conn-1",
        p2,
        "connector",
        0,
        0,
        0,
        0,
        {
            "start": {"objectId": "p2-zone-a", "anchorX": 1.0, "anchorY": 0.5},
            "end": {"objectId": "p2-stage", "anchorX": 0.0, "anchorY": 0.5},
            "routing": "straight",
            "startHead": "none",
            "endHead": "arrow",
            "color": "#221D17",
            "strokeWidth": 3,
        },
    )
    add(
        "p2-conn-2",
        p2,
        "connector",
        0,
        0,
        0,
        0,
        {
            "start": {"objectId": "p2-stage", "anchorX": 1.0, "anchorY": 0.5},
            "end": {"objectId": "p2-zone-b", "anchorX": 0.0, "anchorY": 0.5},
            "routing": "straight",
            "startHead": "none",
            "endHead": "arrow",
            "color": "#221D17",
            "strokeWidth": 3,
        },
    )
    add("p2-st-rocket", p2, "sticker", 1740, 48, 76, 76, {"stickerId": "rocket"})

    return {
        "schemaVersion": 1,
        "id": "board-bookfair-2026",
        "title": "가을 골목 북페어 기획 보드",
        "pages": [
            {
                "id": p1,
                "title": "운영 기획 보드",
                "orderKey": "V",
                "format": "wide_16_9",
                "width": 1920.0,
                "height": 1080.0,
                "background": {"kind": "grid", "color": "#FFFDF8", "pattern": "dot"},
            },
            {
                "id": p2,
                "title": "현장 부스 배치도",
                "orderKey": "a",
                "format": "wide_16_9",
                "width": 1920.0,
                "height": 1080.0,
                "background": {"kind": "grid", "color": "#FFFDF8", "pattern": "dot"},
            },
        ],
        "objects": objs,
        "resources": {},
    }


def main() -> None:
    doc = build_board()
    OUT.parent.mkdir(parents=True, exist_ok=True)
    raw = json.dumps(doc, ensure_ascii=False, indent=2).encode("utf-8")
    with zipfile.ZipFile(OUT, "w", compression=zipfile.ZIP_DEFLATED) as zf:
        zf.writestr("board.json", raw)
    print(f"wrote {OUT} ({OUT.stat().st_size} bytes, {len(doc['objects'])} objects)")


if __name__ == "__main__":
    main()
