"""Các bài tụng hằng ngày tách riêng từ sách đã dựng (Đạo Tràng Liên Hoa).
Dùng: python -I build_extra.py <thư_mục_data_kinh>"""
import sys, json, os, re
sys.stdout.reconfigure(encoding='utf-8')
D = sys.argv[1]
_cache = {}
def load(i):
    if i not in _cache:
        s = open(os.path.join(D, i + '.js'), encoding='utf-8').read()
        _cache[i] = json.loads(s[s.index(']=') + 2:].rstrip().rstrip(';'))
    return _cache[i]
def save(b):
    js = '(window.GioKinhBooks=window.GioKinhBooks||{})[' + json.dumps(b['id']) + ']=' + json.dumps(b, ensure_ascii=False, separators=(',', ':')) + ';\n'
    open(os.path.join(D, b['id'] + '.js'), 'w', encoding='utf-8').write(js)
    print(f"{b['id']}: {len(b['chapters'])} mục")
def pick(book, title, part=None, nth=0):
    hits = [c for c in load(book)['chapters'] if c['t'].startswith(title) and (part is None or c.get('p', '') == part)]
    return hits[nth]
def chap(t, r, src):
    return dict(t=t, r=r, b=src['b'])

# Chú Đại Bi: mỗi câu chú một dòng
ch = pick('cong-phu-chieu', 'Chú Đại Bi', '')
lines = []
for k, v in ch['b']:
    for part in (v if k == 'v' else [v]):
        lines += [x.strip() for x in re.split(r'(?<=\.)\s+(?=[A-ZÀ-Ỹ])', part) if x.strip()]
head = [l for l in lines if l.startswith('Nam mô Đại Bi Hội Thượng') or l.startswith('Thiên thủ thiên nhãn')]
body = [l for l in lines if l not in head]
src = load('cong-phu-chieu')['src']
save(dict(id='chu-dai-bi', title='Chú Đại Bi', by='Thiên Thủ Thiên Nhãn Vô Ngại Đại Bi Tâm Đà La Ni · Bản phiên âm Hán Việt để trì tụng',
          src=src, srcName='Đạo Tràng Liên Hoa', chapters=[dict(t='Chú Đại Bi', r='Trích từ sách Công Phu Chiều', b=[['v', head], ['h', 'Đại Bi Tâm Đà La Ni'], ['v', body]])]))

save(dict(id='tam-kinh', title='Bát Nhã Ba La Mật Đa Tâm Kinh', by='Tâm Kinh · Bản dịch nghĩa và bản phiên âm Hán Việt',
          src=load('a-di-da')['src'], srcName='Đạo Tràng Liên Hoa', chapters=[
    chap('Tâm Kinh · Dịch nghĩa', 'Trích từ Nghi thức Kinh A Di Đà', pick('a-di-da', 'Ma Ha Bát Nhã', 'Phần Dịch Nghĩa')),
    chap('Tâm Kinh · Phiên âm Hán Việt', 'Trích từ sách Công Phu Khuya', pick('cong-phu-khuya', 'Ma Ha Bát Nhã'))]))

save(dict(id='thap-chu', title='Thập Chú', by='Mười bài chú trong thời khóa công phu khuya · Bản phiên âm',
          src=load('cong-phu-khuya')['src'], srcName='Đạo Tràng Liên Hoa', chapters=[
    chap('Thập Chú', 'Như Ý Bảo Luân Vương, Tiêu Tai Kiết Tường, Công Đức Bảo Sơn, Chuẩn Đề, Dược Sư, Vãng Sanh…', pick('cong-phu-khuya', 'Thập Chú'))]))

save(dict(id='chu-vang-sanh', title='Chú Vãng Sanh & Kệ Niệm Phật', by='Vãng Sanh Quyết Định Chơn Ngôn · Kệ tán Phật A Di Đà',
          src=load('a-di-da')['src'], srcName='Đạo Tràng Liên Hoa', chapters=[
    chap('Vãng Sanh Quyết Định Chơn Ngôn', 'Chú Vãng Sanh', pick('a-di-da', 'Vãng Sanh Quyết Định', 'Phần Dịch Nghĩa')),
    chap('Kệ Niệm Phật', 'Tán thán Phật A Di Đà', pick('a-di-da', 'Kệ Niệm Phật', 'Phần Dịch Nghĩa'))]))

save(dict(id='hong-danh-bao-sam', title='Hồng Danh Bảo Sám', by='Lễ 88 danh hiệu Phật sám hối · Trích Kinh Nhật Tụng',
          src=load('nhat-tung')['src'], srcName='Đạo Tràng Liên Hoa', chapters=[
    chap('Hồng Danh Bảo Sám', 'Trích từ Kinh Nhật Tụng', pick('nhat-tung', 'Hồng Danh Bảo Sám'))]))

save(dict(id='mong-son-thi-thuc', title='Mông Sơn Thí Thực', by='Nghi thức thí thực cô hồn trong thời khóa chiều',
          src=load('cong-phu-chieu')['src'], srcName='Đạo Tràng Liên Hoa', chapters=[
    chap('Mông Sơn Thí Thực', 'Trích từ sách Công Phu Chiều', pick('cong-phu-chieu', 'Mông Sơn Thí Thực', ''))]))

save(dict(id='sam-hoi', title='Các Bài Sám Hối', by='Sám Thập Phương, Nhứt Tâm, Hối Phát Nguyện, Cầu An, Cầu Siêu, Quy Mạng, Phổ Hiền',
          src=load('nhat-tung')['src'], srcName='Đạo Tràng Liên Hoa', chapters=[
    chap('Sám Thập Phương', 'Kinh Nhật Tụng · Nghi thức A Di Đà', pick('nhat-tung', 'Sám Thập Phương')),
    chap('Sám Nhứt Tâm', 'Kinh Nhật Tụng', pick('nhat-tung', 'Sám Nhứt Tâm')),
    chap('Sám Hối Phát Nguyện', 'Kinh Nhật Tụng · Hồng Danh Bảo Sám', pick('nhat-tung', 'Sám Hối Phát Nguyện')),
    chap('Sám Phát Nguyện', 'Kinh Nhật Tụng · Nghi thức Phổ Môn', pick('nhat-tung', 'Sám Phát Nguyện')),
    chap('Sám Cầu An', 'Kinh Nhật Tụng', pick('nhat-tung', 'Sám Cầu An')),
    chap('Sám Cầu Siêu', 'Kinh Nhật Tụng', pick('nhat-tung', 'Sám Cầu Siêu')),
    chap('Sám Quy Mạng', 'Kinh Nhật Tụng · Công phu khuya', pick('nhat-tung', 'Sám Quy Mạng')),
    chap('Sám Phổ Hiền', 'Kinh Nhật Tụng · Công phu khuya', pick('nhat-tung', 'Sám Phổ Hiền')),
    chap('Bài Sám Hối (Gia Đình Phật Tử)', 'Nghi thức tụng niệm GĐPT', pick('nghi-thuc-gdpt', 'Khai Chuông Mõ'))]))
