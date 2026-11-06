# -*- coding: utf-8 -*-
"""Chạy toàn bộ bước dựng của Gió Lành sau mỗi lần sửa:  python tools/build.py
1) Gom CSS (css/src → css/gio-lanh.css)   2) Tạo service worker (sw.js) với phiên bản mới.
(Giọng đọc nghe kinh tạo riêng bằng tools/build_listen_audio.py vì cần mạng.)"""
import build_css, build_pwa

build_css.main()
build_pwa.main()
