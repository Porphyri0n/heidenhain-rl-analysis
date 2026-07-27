#!/usr/bin/env python3
"""
build_standalone.py

index.html + assets/*  ->  standalone/index.html

Modüler sürümdeki yerel <link rel="stylesheet"> ve <script src="..."> etiketlerini
dosya içerikleriyle değiştirip tek dosyalık sürümü üretir. Uzak kaynaklar
(Google Fonts gibi) olduğu gibi bırakılır.

Inlines the local <link rel="stylesheet"> and <script src="..."> tags of the
modular build into a single self-contained page. Remote resources (Google Fonts)
are left untouched.

Kullanım / usage:
    python tools/build_standalone.py
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "index.html"
OUT = ROOT / "standalone" / "index.html"

BANNER = """<!--
  ============================================================================
  TEK DOSYA SÜRÜMÜ — OTOMATİK ÜRETİLDİ, ELLE DÜZENLEME
  STANDALONE BUILD — GENERATED, DO NOT EDIT BY HAND

  Kaynak / source : index.html + assets/
  Üretim / build  : python tools/build_standalone.py

  Bu dosya tek başına çalışır: indir, çift tıkla, tarayıcıda açılır.
  Yazı tipleri internetten gelir; çevrimdışıyken sistem yazı tipine düşer.

  This file runs on its own: download it, double-click, it opens in a browser.
  Fonts come from the network; offline it falls back to system fonts.
  ============================================================================
-->
"""

LINK_RE = re.compile(
    r'[ \t]*<link[^>]*?rel=["\']stylesheet["\'][^>]*?href=["\'](?P<href>(?!https?:|//)[^"\']+)["\'][^>]*?>[ \t]*\n?',
    re.IGNORECASE,
)
SCRIPT_RE = re.compile(
    r'[ \t]*<script[^>]*?src=["\'](?P<src>(?!https?:|//)[^"\']+)["\'][^>]*?>\s*</script>[ \t]*\n?',
    re.IGNORECASE,
)


def read(path: Path) -> str:
    if not path.is_file():
        sys.exit(f"eksik dosya / missing file: {path}")
    return path.read_text(encoding="utf-8")


def guard(text: str, closing: str, path: Path) -> str:
    """Gömülen içerik kapanış etiketini erken kapatmasın."""
    if closing.lower() in text.lower():
        sys.exit(f"{path}: gömülemez, '{closing}' içeriyor / cannot inline, contains '{closing}'")
    return text


def main() -> int:
    html = read(SRC)

    def css(match: re.Match) -> str:
        path = (ROOT / match.group("href")).resolve()
        body = guard(read(path), "</style", path)
        return f"  <style>\n/* ---- {match.group('href')} ---- */\n{body.rstrip()}\n  </style>\n"

    def js(match: re.Match) -> str:
        path = (ROOT / match.group("src")).resolve()
        body = guard(read(path), "</script", path)
        return f"  <script>\n/* ---- {match.group('src')} ---- */\n{body.rstrip()}\n  </script>\n"

    html, n_css = LINK_RE.subn(css, html)
    html, n_js = SCRIPT_RE.subn(js, html)

    if not n_css or not n_js:
        sys.exit(f"gömülecek bir şey bulunamadı / nothing to inline (css={n_css}, js={n_js})")

    html = html.replace("<!DOCTYPE html>\n", "<!DOCTYPE html>\n" + BANNER, 1)

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(html, encoding="utf-8", newline="\n")
    size = OUT.stat().st_size
    print(f"{OUT.relative_to(ROOT)} yazıldı / written — {n_css} css, {n_js} js, {size / 1024:.0f} KB")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
