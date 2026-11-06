"""Dựng sách kinh dạng chữ từ ext/*.json -> <project>/data/kinh/<id>.js
Dùng: python -I build_books.py <ext_dir> <out_dir>"""
import sys, json, re, os, unicodedata
sys.stdout.reconfigure(encoding='utf-8')
EXT, OUT = sys.argv[1], sys.argv[2]
os.makedirs(OUT, exist_ok=True)

DLH = 'https://www.daotranglienhoa.com/wp-content/uploads/'
BOOKS = [
    dict(id='dia-tang', file='kinh_dia_tang', title='Kinh Địa Tạng Bồ Tát Bổn Nguyện',
         by='Hán dịch: Tam Tạng Pháp Sư Pháp Đăng · Việt dịch: HT Thích Trí Tịnh', url=DLH + '2022/01/kinh_dia_tang.pdf',
         start='TỰA ĐỊA TẠNG', tail=r'^MA HA BÁT NHÃ', strip=['KINH ĐỊA TẠNG BỒ TÁT BỔN NGUYỆN'], drop=[r'^KINH ĐỊA TẠNG BỒ TÁT BỔN NGUYỆN QUYỂN']),
    dict(id='phap-hoa', file='kinh_phap_hoa', title='Kinh Diệu Pháp Liên Hoa',
         by='Hán dịch: Ngài Cưu Ma La Thập · Việt dịch: HT Thích Trí Tịnh', url=DLH + '2025/01/kinh_phap_hoa.pdf',
         start='TÂM NGUYỆN CỦA DỊCH GIẢ', tail=r'^BỔ KHUYẾT TÂM KINH', strip=['KINH DIỆU PHÁP LIÊN HOA', 'KINH'],
         sub=[r'^SỰ TÍCH', r'^NAM MÔ', r'^\d+\. ', r'^CHÍ TÂM', r'^THÍCH NGHĨA SÁM'], end='MƯỜI CÔNG ĐỨC ẤN TỐNG'),
    dict(id='kim-cang', file='kinh_kim_cang', title='Kinh Kim Cang Bát Nhã Ba La Mật',
         by='Việt dịch: HT Thích Trí Tịnh', url=DLH + '2022/01/kinh_kim_cang.pdf', start='NGUYỆN HƯƠNG',
         sub=[r'^PHỤNG THỈNH', r'^VÂN HÀ', r'^TÁN VIẾT']),
    dict(id='a-di-da', file='kinh_a_di_da_am_nghia', title='Kinh A Di Đà',
         by='Nghi thức tụng niệm · Phần dịch nghĩa, dịch âm và tiếng Anh', url=DLH + '2022/01/kinh_a_di_da_am_nghia.pdf',
         start='NGHI THỨC', drop=[r'^KINH A DI ĐÀ$']),
    dict(id='duoc-su', file='kinh_duoc_su', title='Kinh Dược Sư Lưu Ly Quang Như Lai Bổn Nguyện Công Đức',
         by='Việt dịch: HT Thích Huyền Dung', url=DLH + '2022/01/kinh_duoc_su.pdf', start='CÚNG HƯƠNG'),
    dict(id='pho-mon', file='kinh_pho_mon', title='Kinh Phổ Môn',
         by='Phẩm Quán Thế Âm Bồ Tát Phổ Môn · Việt dịch: HT Thích Trí Tịnh', url=DLH + '2022/01/kinh_pho_mon.pdf', start='NGUYỆN HƯƠNG'),
    dict(id='vo-luong-tho', file='kinh_vo_luong_tho', title='Kinh Vô Lượng Thọ',
         by='Hội tập: Cư sĩ Hạ Liên Cư · Việt dịch: HT Thích Đức Niệm', url=DLH + '2022/01/kinh_vo_luong_tho.pdf',
         start='THAY LỜI TỰA', tail=r'^MA HA BÁT NHÃ', end='MƯỜI CÔNG ĐỨC ẤN TỐNG'),
    dict(id='vu-lan', file='kinh_vu_lan_va_kinh_bao_an_cha_me', title='Kinh Vu Lan & Kinh Báo Ân Cha Mẹ',
         by='Phần dịch nghĩa và phần dịch thơ (HT Thích Huệ Đăng)', url=DLH + '2022/01/kinh_vu_lan_va_kinh_bao_an_cha_me.pdf',
         start='CÚNG HƯƠNG', drop=[r'^KINH VU LAN & KINH BÁO ÂN CHA MẸ$']),
    dict(id='chu-lang-nghiem', file='chu_lang_nghiem_version_2', title='Chú Lăng Nghiêm',
         by='Bản phiên âm Hán Việt để trì tụng', url=DLH + '2020/11/chu_lang_nghiem_version_2.pdf', start='CHÚ LĂNG NGHIÊM', skipfirst=True),
    dict(id='cong-phu-khuya', file='cong_phu_khuya', title='Công Phu Khuya',
         by='Thời khóa buổi sáng · Chú Lăng Nghiêm, Đại Bi, Thập Chú, Tâm Kinh', url=DLH + '2023/05/cong_phu_khuya.pdf',
         start='Nam mô Lăng Nghiêm Hội Thượng', startTitle='Chú Lăng Nghiêm'),
    dict(id='cong-phu-chieu', file='cong_phu_chieu', title='Công Phu Chiều',
         by='Thời khóa buổi chiều tối · Phần dịch nghĩa và dịch âm', url=DLH + '2024/01/cong_phu_chieu.pdf',
         start='NGUYỆN HƯƠNG', drop=[r'^CÔNG PHU CHIỀU$']),
    dict(id='nhat-tung', file='kinh_nhat_tung', title='Kinh Nhật Tụng',
         by='Các nghi thức tụng niệm hằng ngày', url=DLH + '2021/04/kinh_nhat_tung.pdf', start='KÝ HIỆU PHÁP KHÍ',
         end='MƯỜI CÔNG ĐỨC ẤN TỐNG'),
    dict(id='nghi-thuc-gdpt', file='nghi_thuc_tung_niem_gia_dinh_phat_tu', title='Nghi Thức Tụng Niệm Gia Đình Phật Tử',
         by='Nghi thức tụng niệm ngắn cho người tại gia', url=DLH + '2022/03/nghi_thuc_tung_niem_gia_dinh_phat_tu.pdf', start='NGUYỆN HƯƠNG'),
    dict(id='luong-hoang-sam', file='luong_hoang_sam', title='Lương Hoàng Sám',
         by='Từ Bi Đạo Tràng Sám Pháp · Việt dịch: HT Thích Viên Giác', url=DLH + '2025/01/luong_hoang_sam.pdf',
         start='LỜI GIỚI THIỆU', drop=[r'^TỪ BI ĐẠO TRÀNG SÁM PHÁP( QUYỂN.*)?$', r'^✵$', r'^LƯƠNG HOÀNG BẢO SÁM$'],
         sub=[r'^CUNG VĂN', r'^CÁI VĂN', r'^PHỤC NGUYỆN', r'^TỤNG CHÚ ĐẠI BI', r'^CẢM RƠI', r'^TÁN THÁN PHẬT', r'^✵ ']),
    dict(id='ngu-bach-danh', file='kinh_ngu_bach_danh', title='Kinh Ngũ Bách Danh',
         by='Năm trăm danh hiệu Quán Thế Âm Bồ Tát · Lễ lạy, trì niệm', url=DLH + '2022/01/kinh_ngu_bach_danh.pdf',
         start='Nam mô', startTitle='Ngũ Bách Danh Quán Thế Âm Bồ Tát'),
    dict(id='pham-vong', file='kinh_pham_vong', title='Kinh Phạm Võng Bồ Tát Giới',
         by='Việt dịch: HT Thích Trí Tịnh · Mười giới trọng và 48 giới khinh', url=DLH + '2024/08/kinh_pham_vong.pdf',
         start='NGHI THỨC TỤNG GIỚI', drop=[r'^(I|II|III|IV)$']),
    dict(id='khuyen-phat-bo-de-tam', file='khuyen_phat_bo_de_tam_van', title='Khuyến Phát Bồ Đề Tâm Văn',
         by='Đại sư Thật Hiền soạn · Việt dịch: HT Thích Trí Quang', url=DLH + '2022/01/khuyen_phat_bo_de_tam_van.pdf',
         start='KHUYẾN PHÁT BỒ ĐỀ TÂM VĂN', skipfirst=True, charmap={'ʦ': ' ', 'ʟ': ' ', 'ʫ': '.', 'ʬ': ',', 'ʭ': ':', 'ʲ': '?', 'ʮ': ';', 'ʺ': ':', 'ˈ': '(', 'ˉ': ')', 'ˁ': '(', 'ʥ': ',', 'ʤ': '.', '˂': '-', 'ː': '“', 'ˑ': '”', '˘': '"', 'ʸ': '/', '˝': '@', 'ʉ': '0', 'ʊ': '1', 'ʋ': '2', 'ʌ': '3', 'ʍ': '4', 'ʎ': '5', 'ʏ': '6', 'ʐ': '7', 'ʑ': '8', 'ʒ': '9', 'Ņ': 't', 'Ŋ': 'u', 'ş': 'w', 'Ť': 'x', 'ť': 'y', 'œ': 'ư', 'Œ': 'ủ', 'Ķ': 'p', 'Ĺ': 'r', 'Ş': 'v', 'Ľ': 's', 'Į': 'ở', 'Ī': 'ơ', 'ī': 'ớ', 'ŗ': 'ử', 'Ģ': 'ộ', 'ģ': 'ồ', 'Ĭ': 'ợ', 'Ŕ': 'ứ', 'ġ': 'ố', 'ħ': 'ọ', 'Ő': 'ụ', 'ŋ': 'ú', 'ŕ': 'ự', 'B· Đ͵': 'BỒ ĐỀ'}),
    dict(id='thinh-chuong', file='nghi_thuc_thinh_dai_hong_chung', title='Nghi Thức Thỉnh Đại Hồng Chung',
         by='Kệ thỉnh chuông sáng và chiều · Phần dịch nghĩa và dịch âm', url=DLH + '2021/06/nghi_thuc_thinh_dai_hong_chung.pdf',
         start='NGHI THỨC THỈNH ĐẠI HỒNG CHUNG (SÁNG)'),
    dict(id='oai-nghi', file='oai_nghi_cua_nguoi_phat_tu', title='Oai Nghi Của Người Phật Tử',
         by='Phép tắc cơ bản khi đến chùa và trong đời sống', url=DLH + '2022/08/oai_nghi_cua_nguoi_phat_tu.pdf',
         start='OAI NGHI CỦA NGƯỜI PHẬT TỬ', skipfirst=True),
]

def _thinh(ch):
    note = ch[2]['b']
    for c in ch[:2]: c['p'] = 'Phần Dịch Âm'
    for c in ch[3:5]: c['p'] = 'Phần Dịch Nghĩa'
    ch[3]['b'] = [['p', 'Dịch nghĩa: ' + ' · '.join(str(x[1]).replace('Dịch Giả: ', '') for x in note)]] + ch[3]['b']
    for c in ch: c['t'] = 'Thỉnh Chuông Buổi ' + ('Sáng' if 'Sáng' in c['t'] else 'Chiều')
    return ch[:2] + ch[3:5]
def _kpbd(ch):
    ch = [c for c in ch if c['b'] and not (len(c['b']) < 12 and c['t'] == 'Khuyến Phát Bồ Đề Tâm Văn' and 'GIẢI THÍCH' in str(c['b']))]
    for c in ch:
        if c['t'].startswith('Phụ Lục 1') and c['b'] and c['b'][0][0] == 'p' and c['b'][0][1].isupper():
            c['t'] = 'Phụ Lục 1: ' + tcase(c['b'][0][1]); c['b'] = c['b'][1:]
        c['t'] = c['t'].replace('(1685- 1734)', '(1685–1734)')
    return ch
def _nbd(ch):
    # Ghép các dòng bị ngắt rồi tách lại theo số thứ tự danh hiệu; mỗi 50 danh hiệu một mục
    text = ' '.join(' '.join(b[1]) if b[0] == 'v' else str(b[1]) for b in ch[0]['b'])
    start = text.find('1. Kính lạy')
    body = text[start:]
    items = [x.strip() for x in re.split(r'\s(?=\d{1,3}\. Kính lạy)', ' ' + body) if x.strip()]
    tail = ''
    m = re.search(r'\s(Chúng con nay xin.*)$', items[-1])
    if m: tail = m.group(1); items[-1] = items[-1][:m.start()].strip()
    out = []
    for i in range(0, len(items), 50):
        part = items[i:i + 50]
        a, b = part[0].split('.')[0], part[-1].split('.')[0]
        out.append(dict(t=f'Danh hiệu {a}–{b}', r='Ngũ Bách Danh Quán Thế Âm Bồ Tát', b=[['p', x] for x in part]))
    if tail: out[-1]['b'].append(['h', 'Hồi hướng']); out[-1]['b'].append(['p', tail])
    return out
POST = {'thinh-chuong': _thinh, 'khuyen-phat-bo-de-tam': _kpbd, 'ngu-bach-danh': _nbd}

SMALL = {'và', 'của', 'trong', 'cho', 'với', 'các', 'những'}
def tcase(s):
    s = re.sub(r'\s+', ' ', s).strip()
    words = s.split(' ')
    out = []
    for i, w in enumerate(words):
        m = re.match(r'^([“"(\[‘]*)(.*)$', w)
        pre, core = m.group(1), m.group(2)
        low = core.lower()
        if re.fullmatch(r'[IVXL]+\.?', core): out.append(pre + core); continue
        out.append(pre + (low if (i and low in SMALL) else low[:1].upper() + low[1:]))
    return ' '.join(out)

NOISE = re.compile(r'^[|oO○●.…\s\-–]*$')
def is_upper(t):
    L = [c for c in t if c.isalpha()]
    return len(L) >= 3 and sum(c.isupper() for c in L) / len(L) > .85

def build(cfg):
    raw = open(os.path.join(EXT, cfg['file'] + '.json'), encoding='utf-8').read()
    raw = unicodedata.normalize('NFC', raw).replace('PHÂM̉', 'PHẨM').replace('Phâm̉', 'Phẩm')
    data = json.loads(raw)['blocks']
    cm = cfg.get('charmap')
    if cm:  # font mã hoá thay thế: đổi ký tự rồi gom khoảng trắng
        def fx(t):
            for k, v in cm.items(): t = t.replace(k, v)
            t = re.sub(r'[\x00-\x1f]', ' ', t)
            return re.sub(r'\s+([,.:;?)”])', r'\1', re.sub(r'\s{2,}', ' ', unicodedata.normalize('NFC', t))).strip()
        data = [[t, [fx(x) for x in v] if t == 'v' else fx(v)] for t, v in data]
        data = [[t, v] for t, v in data if not re.search(r'\.{6,}', v if t != 'v' else ' '.join(v))]
    # đoạn in hoa bắt đầu bằng PHẨM là tiêu đề phẩm bị tách khỏi dòng tiêu đề
    fixed = []
    for t, v in data:  # khổ có dòng cuối là tiêu đề PHẨM -> tách ra
        if t == 'v' and re.match(r'^PHẨM ', v[-1]) and is_upper(v[-1]):
            if v[:-1]: fixed.append(['v', v[:-1]] if len(v) > 2 else ['p', ' '.join(v[:-1])])
            fixed.append(['h', v[-1]]); continue
        fixed.append([t, v])
    data = fixed
    data = [['h', v] if t == 'p' and re.match(r'^PHẨM ', v) and is_upper(v) and len(v) < 90 else [t, v] for t, v in data]
    # bỏ trang bìa + mục lục
    i = 0
    start = cfg['start']
    hits = [k for k, (t, v) in enumerate(data) if (v if t != 'v' else v[0]).upper().startswith(start.upper())]
    i = hits[1] if cfg.get('skipfirst') and len(hits) > 1 else hits[0]
    blocks = data[i:]
    endre = cfg.get('end', 'NAM MÔ HỘ PHÁP TẠNG BỒ TÁT')
    for k, (t, v) in enumerate(blocks):
        if t == 'h' and v.upper().startswith(endre.upper()):
            blocks = blocks[:k]; break
    chapters, cur, part = [], None, ''
    pending_head = None
    if cfg.get('startTitle'):
        cur = dict(t=cfg['startTitle'], b=[]); chapters.append(cur)
    strip = sorted(cfg.get('strip', []), key=len, reverse=True)
    subs = [re.compile(x) for x in cfg.get('sub', [])]
    drops = [re.compile(x) for x in cfg.get('drop', [])] + [re.compile(r'^❖$'), re.compile(r'^MỤC LỤC$')]

    k = 0
    while k < len(blocks):
        t, v = blocks[k]
        # dòng in hoa kẹp giữa hai tiêu đề -> thuộc tiêu đề
        if t == 'h' and k + 2 < len(blocks) and blocks[k + 1][0] == 'p' and is_upper(blocks[k + 1][1]) and len(blocks[k + 1][1]) < 70 and blocks[k + 2][0] == 'h':
            v = v + ' ' + blocks[k + 1][1] + ' ' + blocks[k + 2][1]; k += 2
        k += 1
        if t != 'h':
            if t == 'p' and NOISE.match(v): continue
            if t == 'v':
                v = [x for x in v if not NOISE.match(x)]
                if not v: continue
            if cur is None:
                cur = dict(t=tcase(cfg['title']), b=[]); chapters.append(cur)
            cur['b'].append([t, v]); continue
        hv = v.strip()
        if any(d.search(hv) for d in drops): continue
        for s in strip:
            if hv.upper().startswith(s + ' ') and len(hv) > len(s) + 3:
                hv = hv[len(s):].strip()
        m = re.match(r'^(QUYỂN (?:THƯỢNG|TRUNG|HẠ|THỨ \S+(?: \S+)?))\s*(.*)$', hv)
        if m and (m.group(1).split()[-1] in ('THƯỢNG', 'TRUNG', 'HẠ') or m.group(1).startswith('QUYỂN THỨ')):
            q = m.group(1)
            if q.startswith('QUYỂN THỨ'):
                q = re.match(r'QUYỂN THỨ (NHẤT|HAI|BA|TƯ|NĂM|SÁU|BẢY|TÁM|CHÍN|MƯỜI)', q)
                q = q.group(0) if q else m.group(1)
                rest = hv[len(q):].strip()
            else:
                rest = m.group(2)
            part = tcase(q)
            if not rest: continue
            hv = rest
        mp = re.match(r'^(?:PHẦN DỊCH (ÂM|NGHĨA|THƠ|TIẾNG ANH))', hv)
        if mp:
            part = tcase('Phần dịch ' + mp.group(1)); hv = hv[mp.end():].strip(' -–:')
            if not hv or hv.startswith('DỊCH GIẢ'): continue
        if re.match(r'^NGHI THỨC KINH A DI ĐÀ PHẦN DỊCH', hv):
            part = 'Phần Dịch ' + ('Âm' if 'ÂM' in hv else 'Nghĩa'); continue
        if cfg.get('tail') and re.search(cfg['tail'], hv):
            part = 'Nghi thức hoàn kinh'
        if subs and any(sr.search(hv) for sr in subs) and cur is not None:
            cur['b'].append(['h', tcase(hv)]); continue
        if cur is not None and not cur['b'] and cur.get('p', '') == part:
            cur['t'] = cur['t'] + ' · ' + tcase(hv); continue
        cur = dict(t=tcase(hv), b=[])
        if part: cur['p'] = part
        chapters.append(cur)
    chapters = [c for c in chapters if c['b']]
    for c in chapters:
        f = c['b'][0]
        if f[0] == 'p' and re.match(r'^Quyển Thứ', f[1]) and len(f[1]) < 25:
            c['t'] = 'Lời tán · ' + f[1]; c['b'] = c['b'][1:]
    for c in chapters:
        c['t'] = re.sub(r'\s*·\s*$', '', c['t'])
        c['t'] = re.sub(r'^Diệu Pháp Liên Hoa · ', '', c['t'])
        c['t'] = re.sub(r' · (Thứ|Sự)', lambda m: ' ' + m.group(1), c['t'])
    if cfg['id'] in POST: chapters = POST[cfg['id']](chapters)
    book = dict(id=cfg['id'], title=cfg['title'], by=cfg['by'], src=cfg['url'],
                srcName='Đạo Tràng Liên Hoa', chapters=chapters)
    js = '(window.GioKinhBooks=window.GioKinhBooks||{})[' + json.dumps(cfg['id']) + ']=' + json.dumps(book, ensure_ascii=False, separators=(',', ':')) + ';\n'
    open(os.path.join(OUT, cfg['id'] + '.js'), 'w', encoding='utf-8').write(js)
    words = sum(len((' '.join(b[1]) if b[0] == 'v' else b[1]).split()) for c in chapters for b in c['b'])
    print(f"{cfg['id']}: {len(chapters)} chương, {words} chữ, {len(js)//1024} KB")
    return dict(id=cfg['id'], title=cfg['title'], by=cfg['by'], src=cfg['url'], n=len(chapters), words=words,
                toc=[[c.get('p', ''), c['t']] for c in chapters])

index = [build(c) for c in BOOKS]
json.dump(index, open(os.path.join(EXT, '_index.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=0)
