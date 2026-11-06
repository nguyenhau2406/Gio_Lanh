"""Sinh js/gio-kinh-registry.js: danh mục sách chữ + ánh xạ mục thư viện -> sách/chương."""
import sys, json, os, glob
sys.stdout.reconfigure(encoding='utf-8')
OUTDIR, SUTRAS, DEST = sys.argv[1], sys.argv[2], sys.argv[3]

books = {}
for f in glob.glob(os.path.join(OUTDIR, '*.js')):
    if os.path.basename(f).startswith('_'): continue
    s = open(f, encoding='utf-8').read()
    b = json.loads(s[s.index(']=') + 2:].rstrip().rstrip(';'))
    words = sum(len((' '.join(x[-1]) if x[0] in 'vk' else str(x[1])).split()) for c in b['chapters'] for x in c['b'])
    books[b['id']] = dict(title=b['title'], by=b['by'], src=b['src'], srcName=b['srcName'], n=len(b['chapters']), w=words,
                          toc=[c['t'] for c in b['chapters']])

def find(book, title, nth=0):
    hits = [i for i, t in enumerate(books[book]['toc']) if t.lower().startswith(title.lower())]
    if len(hits) <= nth: raise SystemExit(f'Không thấy "{title}" trong {book}')
    return hits[nth]

link = {}
sutras = json.load(open(SUTRAS, encoding='utf-8'))
ids = {s['id'] for s in sutras}
for sid in ids:
    if sid in books: link[sid] = [sid, 0]
for sid, book, title in [
    ('kim-cang', 'kim-cang', 'Phật Nói Kinh Kim Cang'), ('a-di-da', 'a-di-da', 'Phật Nói Kinh A Di Đà'),
    ('pho-mon', 'pho-mon', 'Kinh Diệu Pháp Liên Hoa'), ('duoc-su', 'duoc-su', 'Kinh Dược Sư'),
    ('chu-duoc-su', 'duoc-su', 'Kinh Dược Sư'), ('vo-luong-tho', 'vo-luong-tho', 'Phật Nói Kinh'),
    ('phap-hoa', 'phap-hoa', 'Phẩm “Tựa”'), ('dia-tang', 'dia-tang', 'Phẩm Thứ Nhất'),
    ('sang-binh-an', 'cong-phu-khuya', 'Chú Lăng Nghiêm'),
    ('bat-nha-buoi-toi', 'tam-kinh', ''), ('chu-chuan-de', 'thap-chu', ''), ('kinh-chau-bau', 'tieu-tung', 'Kinh Châu Báu'),
    ('toi-lang-tam', 'cong-phu-chieu', 'Nguyện Hương'),
    ('hoi-huong-cong-duc', 'cong-phu-chieu', 'Hồi Hướng'), ('sam-hoi-buoi-toi', 'sam-hoi', ''),
    ('niem-phat-truoc-ngu', 'chu-vang-sanh', 'Kệ Niệm Phật'),
    ('hoi-huong-ong-ba', 'vu-lan', 'Kinh Vu Lan'), ('hoi-huong-chung-sinh', 'nghi-thuc-gdpt', 'Hồi Hướng Công Đức'),
    ('tam-quy-y', 'nghi-thuc-gdpt', 'Tam Tự Quy Y'), ('bon-loi-nguyen-lon', 'nghi-thuc-gdpt', 'Bốn Lời Nguyện Lớn'),
    ('tu-bi-truoc-ngu', 'tu-bi', ''), ('ngu-gioi', 'ngu-triet', ''),
]:
    link[sid] = [book, find(book, title) if title else 0]
for sid, col in [('truong-bo', 'dn'), ('trung-bo', 'mn'), ('tuong-ung-bo', 'sn'), ('tang-chi-bo', 'an'), ('tieu-bo', 'kn')]:
    link[sid] = ['nikaya:' + col, -1]
missing = sorted(ids - set(link))
print('Có toàn văn:', len(link), '/', len(ids), '· Chưa có:', ', '.join(missing))

shelf = [
    ('hang-ngay', 'Kinh tụng hằng ngày', ['chu-dai-bi', 'tam-kinh', 'thap-chu', 'chu-vang-sanh', 'chu-lang-nghiem', 'pho-mon', 'a-di-da',
                                          'sam-hoi', 'hong-danh-bao-sam', 'mong-son-thi-thuc', 'ngu-bach-danh', 'thinh-chuong', 'tieu-tung']),
    ('dai-thua', 'Kinh Đại thừa', ['phap-hoa', 'dia-tang', 'kim-cang', 'a-di-da', 'vo-luong-tho', 'duoc-su', 'pho-mon', 'vu-lan']),
    ('nghi-thuc', 'Thời khóa & sám pháp', ['cong-phu-khuya', 'cong-phu-chieu', 'nhat-tung', 'luong-hoang-sam', 'pham-vong', 'nghi-thuc-gdpt', 'khuyen-phat-bo-de-tam', 'oai-nghi']),
    ('nguyen-thuy', 'Kinh Nguyên thủy', ['phap-cu', 'tieu-tung', 'tu-bi', 'hanh-phuc', 'chuyen-phap-luan', 'niem-xu', 'nhap-tuc-xuat-tuc', 'kala-ma', 'giao-tho-thi-ca-la-viet',
                                         'dai-niem-xu', 'dai-bat-niet-ban-pali', 'sa-mon-qua', 'vi-du-cai-cua', 'vi-du-con-ran', 'nhat-da-hien-gia']),
]
for _, _, l in shelf:
    for b in l: assert b in books, b
# tên quen gọi trong thư viện -> sách/chương (dùng cho ô tìm kinh theo tên)
alias = [[x['name'], x.get('pali', '')] + link[x['id']] for x in sutras if x['id'] in link]
# mục lục rút gọn: bỏ tiêu đề nghi thức lặp lại ở nhiều sách
common = {}
for b in books.values():
    for t in set(b['toc']): common[t] = common.get(t, 0) + 1
for b in books.values():
    b['toc'] = [t if common[t] < 3 else '' for t in b['toc']]
js = ('/* Gió Lành 7 · Danh mục kinh văn đọc dạng chữ (tự sinh từ công cụ chuyển đổi). */\n'
      'window.GioKinhRegistry=' + json.dumps(dict(books=books, link=link, shelf=shelf, alias=alias), ensure_ascii=False, separators=(',', ':')) + ';\n')
open(DEST, 'w', encoding='utf-8').write(js)
print(len(books), 'sách ·', sum(b['w'] for b in books.values()), 'chữ ·', len(js) // 1024, 'KB')
