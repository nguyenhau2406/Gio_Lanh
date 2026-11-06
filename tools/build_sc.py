"""SuttaCentral (HT Thích Minh Châu) -> data/kinh/<id>.js ; Pháp Cú (bilara, CC0) -> data/kinh/phap-cu.js
Dùng: python -I build_sc.py <sc_dir> <pali.txt> <out_dir>"""
import sys, json, re, os, html, unicodedata
from html.parser import HTMLParser
sys.stdout.reconfigure(encoding='utf-8')
SC, LIST, OUT = sys.argv[1], sys.argv[2], sys.argv[3]

class P(HTMLParser):
    def __init__(self):
        super().__init__(); self.blocks = []; self.buf = None; self.kind = None; self.skip = 0; self.quote = 0; self.title = ''
        self.inh1 = False; self.ign = False
    def handle_starttag(self, tag, a):
        a = dict(a)
        if tag in ('footer', 'header'): self.skip += 1
        if tag == 'h1': self.inh1 = True
        if self.skip: return
        if tag == 'blockquote': self.quote += 1
        if tag in ('p', 'h2', 'h3', 'h4', 'h5', 'li', 'dd', 'dt'):
            self.buf = ['']; self.kind = 'h' if tag[0] == 'h' else 'p'
        if tag == 'br' and self.buf is not None: self.buf.append('')
        if tag == 'a' and 'ref' in (a.get('class') or '').split(): self.ign = True
    def handle_endtag(self, tag):
        if tag == 'h1': self.inh1 = False
        if tag == 'a': self.ign = False
        if tag in ('footer', 'header'): self.skip -= 1; return
        if self.skip: return
        if tag == 'blockquote': self.quote -= 1
        if tag in ('p', 'h2', 'h3', 'h4', 'h5', 'li', 'dd', 'dt') and self.buf is not None:
            lines = [re.sub(r'\s+', ' ', x).strip() for x in self.buf]
            lines = [x for x in lines if x]
            if lines:
                if self.kind == 'h': self.blocks.append(['h', ' '.join(lines)])
                elif len(lines) > 1 and (self.quote or sum(map(len, lines)) / len(lines) < 60): self.blocks.append(['v', lines])
                elif len(lines) > 1: self.blocks.extend(['p', x] for x in lines)
                else: self.blocks.append(['p', lines[0]])
            self.buf = None
    def handle_data(self, d):
        if self.inh1: self.title += d
        if self.skip or self.buf is None or self.ign: return
        self.buf[-1] += d

def norm(s):
    return unicodedata.normalize('NFC', s).replace('Ð', 'Đ')

def write(id_, book):
    js = '(window.GioKinhBooks=window.GioKinhBooks||{})[' + json.dumps(id_) + ']=' + json.dumps(book, ensure_ascii=False, separators=(',', ':')) + ';\n'
    open(os.path.join(OUT, id_ + '.js'), 'w', encoding='utf-8').write(js)
    return len(js)

index = []
for line in open(LIST, encoding='utf-8'):
    if not line.strip(): continue
    id_, uid = line.split()
    d = json.load(open(os.path.join(SC, uid + '.json'), encoding='utf-8'))
    t = d.get('translation') or {}
    if not t.get('text'): print('bỏ qua', id_, uid); continue
    p = P(); p.feed(norm(t['text']))
    blocks = [[k, [norm(x) for x in v]] if k == 'v' else [k, norm(v)] for k, v in p.blocks]
    title = norm(re.sub(r'\s+', ' ', p.title or t.get('title') or uid).strip())
    heads = [b for b in blocks if b[0] == 'h']
    chapters = []
    if len(heads) >= 3 and len(blocks) > 60:
        cur = None
        for b in blocks:
            if b[0] == 'h':
                cur = dict(t=b[1], b=[]); chapters.append(cur); continue
            if cur is None: cur = dict(t='Mở đầu', b=[]); chapters.append(cur)
            cur['b'].append(b)
        chapters = [c for c in chapters if c['b']]
    else:
        chapters = [dict(t=title, b=blocks)]
    acr = re.sub(r'^([a-z]+)', lambda m: m.group(1).upper() + ' ', uid)
    book = dict(id=id_, title=title, by='Việt dịch: HT Thích Minh Châu · ' + acr, src=f'https://suttacentral.net/{uid}/vi/minh_chau',
                srcName='SuttaCentral', chapters=chapters)
    size = write(id_, book)
    words = sum(len((' '.join(b[1]) if b[0] == 'v' else b[1]).split()) for c in chapters for b in c['b'])
    index.append(dict(id=id_, uid=uid, title=title, n=len(chapters), words=words))
    print(f'{id_} ({uid}): "{title}" {len(chapters)} chương, {words} chữ, {size//1024} KB')

# Kinh Pháp Cú — 26 phẩm từ bilara-data (bản dịch HT Thích Minh Châu, CC0)
names = ['Song Yếu', 'Không Phóng Dật', 'Tâm', 'Hoa', 'Ngu', 'Hiền Trí', 'A-la-hán', 'Ngàn', 'Ác', 'Hình Phạt', 'Già', 'Tự Ngã', 'Thế Gian', 'Phật-đà', 'An Lạc', 'Hỷ Ái', 'Phẫn Nộ', 'Cấu Uế', 'Pháp Trụ', 'Đạo', 'Tạp Lục', 'Địa Ngục', 'Voi', 'Tham Ái', 'Tỳ-kheo', 'Bà-la-môn']
bounds = [[1,20],[21,32],[33,43],[44,59],[60,75],[76,89],[90,99],[100,115],[116,128],[129,145],[146,156],[157,166],[167,178],[179,196],[197,208],[209,220],[221,234],[235,255],[256,272],[273,289],[290,305],[306,319],[320,333],[334,359],[360,382],[383,423]]
chapters = []
for i, (a, b) in enumerate(bounds):
    data = json.load(open(os.path.join(SC, 'dhp', f'dhp{a}-{b}.json'), encoding='utf-8'))
    blocks = []
    for n in range(a, b + 1):
        pre = f'dhp{n}:'
        ent = [(k[len(pre):], norm(str(v)).strip()) for k, v in data.items() if k.startswith(pre)]
        story = [v for s, v in ent if (s == '0' or s.startswith('0.4')) and v]
        lines = sorted([(float(s), v) for s, v in ent if re.fullmatch(r'\d+(?:\.\d+)?', s) and float(s) >= 1 and v and not v.startswith('Hết phẩm')])
        if not lines: continue
        for s in story: blocks.append(['n', s])
        blocks.append(['k', n, [v for _, v in lines]])
    chapters.append(dict(t=f'Phẩm {names[i]}', r=f'Kệ {a}–{b}', b=blocks))
book = dict(id='phap-cu', title='Kinh Pháp Cú', by='Việt dịch: HT Thích Minh Châu · Dhammapada · CC0',
            src='https://suttacentral.net/dhp/vi/phantuananh', srcName='SuttaCentral', chapters=chapters)
size = write('phap-cu', book)
print('phap-cu:', len(chapters), 'phẩm,', size // 1024, 'KB')
json.dump(index, open(os.path.join(SC, '_index.json'), 'w', encoding='utf-8'), ensure_ascii=False)

# Kinh Tiểu Tụng (Khuddakapāṭha) — 9 bài tụng hằng ngày, gộp thành một sách
names = {1: 'Tam Quy', 2: 'Thập Giới', 3: 'Ba Mươi Hai Thể Trược', 4: 'Câu Hỏi Của Sa-di', 5: 'Kinh Điềm Lành (Hạnh Phúc)',
         6: 'Kinh Châu Báu', 7: 'Kinh Ngoài Bức Tường', 8: 'Kinh Bảo Tàng', 9: 'Kinh Lòng Từ (Từ Bi)'}
chapters = []
for i in range(1, 10):
    t = json.load(open(os.path.join(SC, f'kp{i}.json'), encoding='utf-8'))['translation']
    p = P(); p.feed(norm(t['text']))
    blocks = [[k, [norm(x) for x in v]] if k == 'v' else [k, norm(v)] for k, v in p.blocks]
    chapters.append(dict(t=names[i], r=f'Khp {i}', b=blocks))
book = dict(id='tieu-tung', title='Kinh Tiểu Tụng', by='Khuddakapāṭha · 9 bài tụng hằng ngày · Việt dịch: HT Thích Minh Châu',
            src='https://suttacentral.net/kp/vi/minh_chau', srcName='SuttaCentral', chapters=chapters)
print('tieu-tung:', len(chapters), 'bài,', write('tieu-tung', book) // 1024, 'KB')
