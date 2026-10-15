# -*- coding: utf-8 -*-
"""북페어_아이디어.xmind — zipfile 생성기.

형식은 IeumOffice의 xmind-engine이 만드는 것과 같다:
content.json(시트 목록) + metadata.json + manifest.json, 폴더 항목 없음.
테마 표(xmind_theme.json)는 엔진의 themeTable('pill/harbor/light') 출력을 그대로 담아 둔 것이다.
"""
import json
import uuid
import zipfile
from pathlib import Path

HERE = Path(__file__).resolve().parent
OUT = HERE.parent / "samples" / "북페어_아이디어.xmind"

# 같은 입력이면 같은 id가 나오도록 고정 네임스페이스 사용
NS = uuid.UUID("6f0c2a52-7d1e-4b8a-9c41-2a9f3d6e8b10")


def tid(path):
    return str(uuid.uuid5(NS, path))


def topic(path, title, children=(), **extra):
    t = {"id": tid(path), "class": "topic", "title": title}
    t.update(extra)
    if children:
        t["children"] = {"attached": [topic(f"{path}/{i}", c[0], c[1] if len(c) > 1 else ())
                                      if isinstance(c, tuple) else topic(f"{path}/{i}", c)
                                      for i, c in enumerate(children)]}
    return t


BRANCHES = [
    ("프로그램", ["작가와의 대화", "책 읽는 밤 (낭독·공연)", "그림책 만들기 체험", "독립출판 워크숍"]),
    ("홍보", ["포스터 · 리플릿 3,000부", "SNS 카운트다운", "상인회 채널 공동 홍보"]),
    ("공간", ["골목 쉼터 메인 무대", "부스 32곳 배치", "우천 시 실내 전환"]),
    ("협력", ["독립서점 5곳", "출판사 14곳", "공방 · 카페 6곳", "자원봉사자 20명"]),
    ("예산", ["총 1,860만 원", "시설 · 홍보 · 프로그램", "예비비 114만 원"]),
]


def build_sheet():
    root = {
        "id": tid("root"),
        "class": "topic",
        "title": "가을 골목 북페어",
        "children": {"attached": []},
    }
    for bi, (title, kids) in enumerate(BRANCHES):
        root["children"]["attached"].append(topic(f"root/{bi}", title, kids))
    theme = json.loads((HERE / "xmind_theme.json").read_text(encoding="utf-8"))
    return {
        "id": tid("sheet"),
        "class": "sheet",
        "rootTopic": root,
        "title": "북페어 아이디어",
        "theme": theme,
    }


def main():
    sheets = [build_sheet()]
    content = json.dumps(sheets, ensure_ascii=False, separators=(",", ":"))
    metadata = json.dumps({"creator": {"name": "IeumOffice", "version": "0.1.0"}},
                          separators=(",", ":"))
    manifest = json.dumps({"file-entries": {"content.json": {}, "metadata.json": {}}},
                          separators=(",", ":"))
    OUT.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(OUT, "w", compression=zipfile.ZIP_DEFLATED) as z:
        z.writestr("content.json", content.encode("utf-8"))
        z.writestr("metadata.json", metadata.encode("utf-8"))
        z.writestr("manifest.json", manifest.encode("utf-8"))
    print(OUT)


if __name__ == "__main__":
    main()
