"""Chuyển sách kinh PDF (Đạo Tràng Liên Hoa) thành cấu trúc chữ: chương -> khối (h/p/v).
Dùng: python -I extract.py <pylib> <pdf> <out.json> [start_page] [end_page]"""
import sys
sys.stdout.reconfigure(encoding="utf-8")
sys.path.insert(0, sys.argv[1])
import warnings; warnings.filterwarnings("ignore")
import pymupdf, collections, re, json, statistics

pdf, OUT = sys.argv[2], sys.argv[3]
start = int(sys.argv[4]) if len(sys.argv) > 4 else 0
end = int(sys.argv[5]) if len(sys.argv) > 5 else None
doc = pymupdf.open(pdf)
pages = list(doc)[start:end]

ZW = re.compile('[​‌‍﻿­]')
BIDI = re.compile('[‪-‮⁦-⁩‎‏]')
SYM = re.compile('[©△▲①-⑳❶-❿]')
def clean(t):
    t = SYM.sub(' ', BIDI.sub('', ZW.sub('', t))).replace(' ', ' ')
    t = re.sub(r'\s+([,.;:!?])', r'', t)
    return re.sub(r'\s+', ' ', t)

lines = []
for pi, pg in enumerate(pages):
    W, H = pg.rect.width, pg.rect.height
    chars = []
    for b in pg.get_text('rawdict')['blocks']:
        for l in b.get('lines', []):
            for s in l['spans']:
                bold = 'Bold' in s['font'] or bool(s['flags'] & 16)
                ital = 'Italic' in s['font'] or bool(s['flags'] & 2)
                for ch in s['chars']:
                    c = ch['c']
                    c = BIDI.sub('', c)
                    if not c: continue
                    x0, y0, x1, y1 = ch['bbox']
                    chars.append((ch['origin'][1], x0, x1, c, s['size'], bold, ital, y0, y1))
    chars.sort(key=lambda c: (round(c[0]), c[1]))
    rows = []
    for c in chars:
        for r in rows[-4:]:
            if abs(r['by'] - c[0]) < 2.5:
                r['c'].append(c); break
        else:
            rows.append(dict(by=c[0], c=[c]))
    for r in rows:
        cs = sorted(r['c'], key=lambda c: c[1])
        out = ''; lastx = None
        for c in cs:
            if c[3] == '​':
                out += '​'; continue
            if lastx is not None and c[3] != ' ' and not out.endswith(' ') and c[1] - lastx > c[4] * 0.06:
                out += ' '
            out += c[3]; lastx = c[2]
        out = re.sub('​{2,}', ' ', out)
        t = clean(out).strip()
        vis = [c for c in cs if c[3].strip() and c[3] != '​']
        if not t or not vis: continue
        lines.append(dict(p=pi, t=t, sz=round(max(c[4] for c in vis), 1),
                          b=sum(c[5] for c in vis) > .8 * len(vis), i=sum(c[6] for c in vis) > .8 * len(vis),
                          x0=min(c[1] for c in vis), x1=max(c[2] for c in vis),
                          y0=min(c[7] for c in vis), y1=max(c[8] for c in vis), W=W, H=H))
lines.sort(key=lambda r: (r['p'], r['y0']))

cnt = collections.Counter()
for r in lines: cnt[r['sz']] += len(r['t'])
body = cnt.most_common(1)[0][0]
bl = [r for r in lines if abs(r['sz'] - body) < .6]
LR = {}
for par in (0, 1):
    pb = [r for r in bl if (r['p'] + start) % 2 == par] or bl
    LR[par] = (sorted(r['x0'] for r in pb)[int(len(pb) * .08)], sorted(r['x1'] for r in pb)[int(len(pb) * .93)])
for r in lines:
    r['L'], r['R'] = LR[(r['p'] + start) % 2]
left, right = LR[0]
lh = statistics.median([b['y0'] - a['y0'] for a, b in zip(bl, bl[1:]) if a['p'] == b['p'] and 0 < b['y0'] - a['y0'] < body * 3] or [body * 1.4])

def is_noise(r):
    t = r['t']
    if r['sz'] < body - 2.5 and (r['y0'] < 45 or r['y1'] > r['H'] - 40): return True  # đầu/chân trang
    if re.fullmatch(r'[\d\s\-–]+', t): return True
    if re.fullmatch(r'[❖✽❀✿*•·\-–—_\s]+', t): return True
    if re.search(r'\.{6,}', t): return True  # mục lục
    if re.fullmatch(r'[|oO○●.…\s]+', t): return True  # ký hiệu chuông mõ
    if re.fullmatch(r'\(\d{1,2}\)', t): return True
    return False

def is_upper(t):
    letters = [c for c in t if c.isalpha()]
    return len(letters) >= 2 and sum(c.isupper() for c in letters) / len(letters) > .85

def is_heading(r):
    t = r['t']
    if len(t) > 90: return False
    centered = abs((r['x0'] + r['x1']) / 2 - r['W'] / 2) < 30 and r['x0'] > r['L'] + 15
    if r['sz'] >= body + 1.5 and (is_upper(t) or centered): return True
    if is_upper(t) and centered and r['b'] and len(t) > 3: return True
    return False

blocks = []  # (kind, payload)
buf = []     # logical lines in current block: list of [text, nphys]
prev = None
def flush():
    global buf
    if not buf: return
    if len(buf) == 1:
        blocks.append(['p', buf[0][0]])
    elif all(n == 1 for _, n in buf) and statistics.mean(len(t) for t, _ in buf) < 70:
        blocks.append(['v', [t for t, _ in buf]])
    else:
        for t, _ in buf: blocks.append(['p', t])
    buf = []

for r in lines:
    if is_noise(r): continue
    if is_heading(r):
        flush()
        if blocks and blocks[-1][0] == 'h' and prev is not None and prev.get('_h') and r['p'] == prev['p'] and r['y0'] - prev['y1'] < lh * 2.2:
            blocks[-1][1] += ' ' + r['t']
        else:
            blocks.append(['h', r['t']])
        r['_h'] = True; prev = r; continue
    newblock = prev is None or prev.get('_h')
    if not newblock:
        same_page = prev['p'] == r['p']
        gap = r['y0'] - prev['y0'] if same_page else lh
        if gap > lh * 1.55 or abs(r['sz'] - prev['sz']) > 1.5: newblock = True
        elif (r['x0'] - r['L']) > (prev['x0'] - prev['L']) + 8 and r['x0'] > r['L'] + 8: newblock = True
    prev_short = prev is not None and not prev.get('_h') and (prev['x1'] < prev['R'] - 7 or (r['t'][:1].isupper() and re.search(r'[.:;!?”"]$', prev['t'])))
    if newblock:
        flush(); buf.append([r['t'], 1])
    elif prev_short or not buf:
        buf.append([r['t'], 1])
    else:
        buf[-1][0] += ' ' + r['t']; buf[-1][1] += 1
    prev = r
flush()

# Nhãn nhỏ như (3 lần) đứng riêng -> gắn vào khối trước
fixed = []
for k, v in blocks:
    if k == 'p' and re.fullmatch(r'\(.{1,20}\)', v) and fixed and fixed[-1][0] in 'pv':
        if fixed[-1][0] == 'p': fixed[-1][1] += ' ' + v
        else: fixed[-1][1][-1] += ' ' + v
        continue
    fixed.append([k, v])
# Gom các dòng ngắn liên tiếp (danh hiệu, liệt kê) thành một khổ
grouped = []
for k, v in fixed:
    short = k == 'p' and len(v) < 58
    if short and grouped and grouped[-1][0] == '_run':
        grouped[-1][1].append(v); continue
    if short:
        grouped.append(['_run', [v]]); continue
    grouped.append([k, v])
fixed = []
for k, v in grouped:
    if k == '_run':
        if len(v) >= 3: fixed.append(['v', v])
        else: fixed.extend(['p', x] for x in v)
    else: fixed.append([k, v])
json.dump(dict(body=body, left=left, right=right, lh=lh, blocks=fixed), open(OUT, "w", encoding="utf-8"), ensure_ascii=False)
print(f'{pdf}: body={body} left={left:.0f} right={right:.0f} lh={lh:.1f} blocks={len(fixed)} heads={sum(1 for k,_ in fixed if k=="h")}')
