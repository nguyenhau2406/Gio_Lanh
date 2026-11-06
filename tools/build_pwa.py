# -*- coding: utf-8 -*-
"""Tạo /sw.js (service worker) cho Gió Lành.

    python tools/build_pwa.py      (hoặc python tools/build.py để chạy cả CSS lẫn PWA)

- PRECACHE: khung trang — index.html, css, js nạp trong index.html, manifest, biểu tượng
  và mọi ảnh assets/... được nhắc tới trong mã nguồn (tự dò, ảnh không dùng thì bỏ qua).
- PACK: gói tải về khi người dùng bấm "Tải để dùng khi không có mạng":
  toàn bộ data/kinh/*.js, ảnh bìa assets/kinh/*, giọng đọc assets/audio/nghe-kinh/*.mp3.
- VERSION: băm từ nội dung các file khung trang → sửa bất cứ gì rồi chạy lại là người dùng tự nhận bản mới.
"""
import hashlib, json, pathlib, re

ROOT = pathlib.Path(__file__).resolve().parent.parent
BIG_SKIP = {"assets/audio/nhac-nen.mp3"}


def rel(p):
    return p.relative_to(ROOT).as_posix()


def main():
    index = (ROOT / "index.html").read_text(encoding="utf-8")
    shell = ["./", "index.html", "manifest.webmanifest"]
    shell += re.findall(r'<(?:script[^>]+src|link[^>]+href)="((?:css|js)/[^"?#]+)"', index)
    shell += [rel(p) for p in sorted((ROOT / "assets" / "icons").glob("*.png"))]
    # Ảnh được nhắc tới trong index.html / js / css (bỏ âm thanh và ảnh bìa kinh — thuộc gói tải về).
    sources = [index] + [(ROOT / s).read_text(encoding="utf-8") for s in shell if s.endswith((".js", ".css"))]
    refs = set()
    for text in sources:
        for m in re.findall(r"assets/[A-Za-z0-9_./-]+\.(?:jpg|jpeg|png|webp|svg|gif)", text):
            if not m.startswith(("assets/kinh/", "assets/audio/")) and (ROOT / m).is_file():
                refs.add(m)
    shell += sorted(refs)
    shell = list(dict.fromkeys(s for s in shell if s == "./" or (ROOT / s).is_file()))

    pack = []
    for pattern in ("data/kinh/*.js", "assets/kinh/*", "assets/audio/nghe-kinh/*.mp3", "assets/audio/thien/*.mp3"):
        for p in sorted(ROOT.glob(pattern)):
            if p.is_file() and rel(p) not in BIG_SKIP:
                pack.append([rel(p), p.stat().st_size])

    h = hashlib.sha1()
    for s in shell:
        if s != "./":
            h.update(s.encode()); h.update((ROOT / s).read_bytes())
    h.update(json.dumps(pack).encode()); h.update((ROOT / "tools" / "sw-src.js").read_bytes())
    version = h.hexdigest()[:10]

    fonts = [u.replace("&amp;", "&") for u in re.findall(r'<link[^>]+href="(https://fonts\.googleapis\.com/[^"]+)"', index)]
    core = (ROOT / "tools" / "sw-src.js").read_text(encoding="utf-8")
    head = ("/* Gió Lành — TỰ SINH bởi tools/build_pwa.py. Đừng sửa tay; sửa tools/sw-src.js rồi chạy lại. */\n"
            f"const VERSION = '{version}';\n"
            f"const PRECACHE = {json.dumps(shell, ensure_ascii=False)};\n"
            f"const PACK = {json.dumps(pack, ensure_ascii=False)};\n"
            f"const FONTS = {json.dumps(fonts)};\n")
    (ROOT / "sw.js").write_text(head + core, encoding="utf-8")
    shell_kb = sum((ROOT / s).stat().st_size for s in shell if s != "./") / 1024
    pack_mb = sum(s for _, s in pack) / 1024 / 1024
    print(f"sw.js phiên bản {version}: khung trang {len(shell)} file ({shell_kb:.0f} KB), gói ngoại tuyến {len(pack)} file ({pack_mb:.1f} MB)")


if __name__ == "__main__":
    main()
