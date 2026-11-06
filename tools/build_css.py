# -*- coding: utf-8 -*-
"""Gom toàn bộ CSS của Gió Lành thành một file duy nhất.

    python tools/build_css.py

- Nguồn: css/src/NN-ten.css — số NN là THỨ TỰ NẠP (quan trọng: file sau đè file trước).
  Muốn thêm kiểu mới: tạo file với số kế tiếp, ví dụ css/src/24-thoi-khoa.css.
- Kết quả: css/gio-lanh.css (đã nén, index.html chỉ nạp file này).
Không cần cài thêm thư viện.
"""
import pathlib, re, hashlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "css" / "src"
OUT = ROOT / "css" / "gio-lanh.css"


def minify(css: str) -> str:
    # Giữ nguyên chuỗi trong ngoặc kép/đơn (content:"…", url('…')) trong lúc nén.
    keep = []
    def stash(m):
        keep.append(m.group(0)); return f"\x00{len(keep) - 1}\x00"
    css = re.sub(r'"(?:\\.|[^"\\])*"|\'(?:\\.|[^\'\\])*\'', stash, css)
    css = re.sub(r"/\*.*?\*/", "", css, flags=re.S)          # bỏ chú thích
    css = re.sub(r"\s+", " ", css)                            # gộp khoảng trắng
    css = re.sub(r"\s*([{};,])\s*", r"\1", css)               # bỏ khoảng trắng quanh { } ; ,
    css = re.sub(r";}", "}", css)
    return re.sub(r"\x00(\d+)\x00", lambda m: keep[int(m.group(1))], css).strip()


def main():
    files = sorted(SRC.glob("*.css"))
    parts, raw = [], 0
    for f in files:
        text = f.read_text(encoding="utf-8")
        raw += len(text.encode("utf-8"))
        parts.append(f"/*{f.name}*/" + minify(text))
    body = "\n".join(parts) + "\n"
    head = "/* Gió Lành — TỰ SINH bởi tools/build_css.py từ css/src/. Đừng sửa tay file này. */\n"
    OUT.write_text(head + body, encoding="utf-8")
    ver = hashlib.sha1(body.encode("utf-8")).hexdigest()[:8]
    print(f"{len(files)} file nguồn, {raw/1024:.0f} KB → {OUT.relative_to(ROOT)} {OUT.stat().st_size/1024:.0f} KB (phiên bản {ver})")


if __name__ == "__main__":
    main()
