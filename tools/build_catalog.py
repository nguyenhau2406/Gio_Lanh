import sys, json, os, unicodedata
sys.stdout.reconfigure(encoding='utf-8')
D, OUT = sys.argv[1], sys.argv[2]
cols = [('dn','Trường Bộ Kinh',['dn']),('mn','Trung Bộ Kinh',['mn']),('sn','Tương Ưng Bộ Kinh',['sn']),('an','Tăng Chi Bộ Kinh',['an']),('kn','Tiểu Bộ Kinh',['kp','ud','iti','snp','thag','thig'])]
N = lambda s: unicodedata.normalize('NFC', s or '').replace('Ð','Đ').strip()
cat = {}
for key, name, files in cols:
    nodes = []; total = 0; vi = 0
    for f in files:
        data = json.load(open(os.path.join(D, f + '.json'), encoding='utf-8'))
        for x in data:
            if x['type'] == 'branch':
                if x['uid'] in ('dn','mn','sn','an'): continue
                t = N(x.get('translated_title')) or N(x.get('original_title'))
                nodes.append([0, x['uid'], t, N(x.get('original_title'))])
            else:
                tr = [t['author_uid'] for t in x.get('translations', []) if t['lang'] == 'vi' and not t.get('segmented')]
                seg = [t['author_uid'] for t in x.get('translations', []) if t['lang'] == 'vi' and t.get('segmented')]
                total += 1
                a = tr[0] if tr else (seg[0] if seg else '')
                if not a: continue
                vi += 1
                nodes.append([1, x['uid'], N(x.get('translated_title')) or N(x.get('original_title')), N(x.get('original_title')), a, 1 if (not tr and seg) else 0])
    # bỏ nhánh rỗng
    keep = []
    for i, n in enumerate(nodes):
        if n[0] == 0 and not any(m[0] == 1 for m in nodes[i+1:i+2]) and not (i + 1 < len(nodes) and nodes[i+1][0] == 0): continue
        keep.append(n)
    nodes = keep
    cat[key] = dict(name=name, total=total, vi=vi, nodes=nodes)
    print(key, name, total, 'bài,', vi, 'có bản Việt')
js = 'window.GioKinhCatalog=' + json.dumps(cat, ensure_ascii=False, separators=(',', ':')) + ';\n'
open(OUT, 'w', encoding='utf-8').write(js)
print(len(js)//1024, 'KB')
