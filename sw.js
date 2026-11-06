/* Gió Lành — TỰ SINH bởi tools/build_pwa.py. Đừng sửa tay; sửa tools/sw-src.js rồi chạy lại. */
const VERSION = '400c89c64a';
const PRECACHE = ["./", "index.html", "manifest.webmanifest", "css/gio-lanh.css", "js/gio-kinh-registry.js", "js/main.js", "js/media.js", "js/listen-data-v7-15.js", "js/listen-v7-15.js", "js/final.js", "js/gio-intro-v4-2.js", "js/gio-reader.js", "js/gio-ambient.js", "js/gio-bgm.js", "js/bodhi-leaves-v7-11.js", "js/spacing-refine-v7-12.js", "js/navigation-v7-13.js", "js/thoi-khoa-data.js", "js/thoi-khoa.js", "js/lich-am.js", "js/thien-data.js", "js/thien.js", "js/trang-hat.js", "js/tu-dien-data.js", "js/tu-dien.js", "js/de-doc.js", "js/pwa.js", "assets/icons/apple-touch-icon.png", "assets/icons/favicon-32.png", "assets/icons/icon-192.png", "assets/icons/icon-512.png", "assets/icons/maskable-512.png", "assets/chant-sanctuary-v7-2.webp", "assets/gallery-1.jpg", "assets/gallery-2.jpg", "assets/gallery-3.jpg", "assets/gallery-4.jpg", "assets/gallery-5.jpg", "assets/gallery-6.jpg", "assets/hero-01.jpg", "assets/hero-02.jpg", "assets/kinh-phat-hoa-sen-nui-suong.webp", "assets/logo.png", "assets/lotus.svg", "assets/nature-lotus.jpg", "assets/nature-temple.jpg", "assets/sutra-chuyen-phap-luan.jpg", "assets/sutra-hanh-phuc.jpg", "assets/sutra-hoi-tho.jpg", "assets/sutra-niem-xu.jpg", "assets/sutra-phap-cu.jpg", "assets/sutra-tu-bi.jpg"];
const PACK = [["data/kinh/a-di-da.js", 62099], ["data/kinh/an-tru-tam.js", 9846], ["data/kinh/bang-cach-song.js", 14592], ["data/kinh/bon-phap-vo-luong.js", 4099], ["data/kinh/chinh-kien.js", 29396], ["data/kinh/chu-dai-bi.js", 2543], ["data/kinh/chu-lang-nghiem.js", 15500], ["data/kinh/chu-vang-sanh.js", 1647], ["data/kinh/chuyen-phap-luan.js", 7998], ["data/kinh/cong-nghiep.js", 12787], ["data/kinh/cong-phu-chieu.js", 82957], ["data/kinh/cong-phu-khuya.js", 34143], ["data/kinh/dai-bat-niet-ban-pali.js", 197088], ["data/kinh/dai-kinh-bon-muoi.js", 18993], ["data/kinh/dai-niem-xu.js", 45239], ["data/kinh/dia-tang.js", 156113], ["data/kinh/duoc-su.js", 49819], ["data/kinh/giao-gioi-la-hau-la-lon.js", 15989], ["data/kinh/giao-gioi-la-hau-la.js", 17922], ["data/kinh/giao-tho-thi-ca-la-viet.js", 23967], ["data/kinh/hanh-phuc.js", 2553], ["data/kinh/hong-danh-bao-sam.js", 10700], ["data/kinh/kala-ma.js", 17926], ["data/kinh/khuyen-phat-bo-de-tam.js", 54042], ["data/kinh/kim-cang.js", 93325], ["data/kinh/kinh-lua-chay.js", 3294], ["data/kinh/lon-cong-nghiep.js", 22577], ["data/kinh/luong-hoang-sam.js", 574098], ["data/kinh/mong-son-thi-thuc.js", 5915], ["data/kinh/nam-dieu-quan-niem.js", 9796], ["data/kinh/nghi-thuc-gdpt.js", 7479], ["data/kinh/ngu-bach-danh.js", 50413], ["data/kinh/ngu-triet.js", 6983], ["data/kinh/nhan-duyen.js", 5275], ["data/kinh/nhap-tuc-xuat-tuc.js", 25399], ["data/kinh/nhat-da-hien-gia.js", 6924], ["data/kinh/nhat-tung.js", 144698], ["data/kinh/niem-xu.js", 29964], ["data/kinh/nikaya-catalog.js", 294758], ["data/kinh/oai-nghi.js", 28169], ["data/kinh/pham-vong.js", 125681], ["data/kinh/phan-biet-su-that.js", 11853], ["data/kinh/phap-cu.js", 81082], ["data/kinh/phap-hoa.js", 598305], ["data/kinh/pho-mon.js", 28703], ["data/kinh/quy-y.js", 4959], ["data/kinh/sa-mon-qua.js", 97194], ["data/kinh/sam-hoi.js", 13489], ["data/kinh/song-tam.js", 15987], ["data/kinh/tam-kinh.js", 3933], ["data/kinh/tat-ca-lau-hoac.js", 17824], ["data/kinh/thap-chu.js", 4419], ["data/kinh/thinh-chuong.js", 27244], ["data/kinh/tieu-tung.js", 18863], ["data/kinh/trung-dao.js", 2398], ["data/kinh/tu-bi.js", 2738], ["data/kinh/vi-du-cai-cua.js", 23688], ["data/kinh/vi-du-con-ran.js", 41054], ["data/kinh/vi-du-dau-chan-voi.js", 22739], ["data/kinh/vi-du-tam.js", 11706], ["data/kinh/vo-luong-tho.js", 128769], ["data/kinh/vo-nga-tuong.js", 5529], ["data/kinh/vo-thuong-tuong.js", 1123], ["data/kinh/vu-lan.js", 66421], ["assets/kinh/a-di-da.webp", 39248], ["assets/kinh/an-tru-tam.webp", 22836], ["assets/kinh/bang-cach-song.webp", 33978], ["assets/kinh/bao-tich.webp", 46398], ["assets/kinh/bat-dai-nhan-giac.webp", 20938], ["assets/kinh/bat-nha-buoi-toi.webp", 48564], ["assets/kinh/bon-loi-nguyen-lon.webp", 38432], ["assets/kinh/bon-phap-vo-luong.webp", 21742], ["assets/kinh/chinh-kien.webp", 40428], ["assets/kinh/chu-chuan-de.webp", 17736], ["assets/kinh/chu-dai-bi.webp", 22162], ["assets/kinh/chu-duoc-su.webp", 39932], ["assets/kinh/chu-lang-nghiem.webp", 25874], ["assets/kinh/chu-vang-sanh.webp", 18988], ["assets/kinh/chuyen-phap-luan.webp", 35798], ["assets/kinh/cong-nghiep.webp", 34880], ["assets/kinh/dai-bat-niet-ban-pali.webp", 42884], ["assets/kinh/dai-bat-niet-ban.webp", 36024], ["assets/kinh/dai-kinh-bon-muoi.webp", 40798], ["assets/kinh/dai-niem-xu.webp", 20168], ["assets/kinh/di-giao.webp", 43538], ["assets/kinh/dia-tang.webp", 40152], ["assets/kinh/duoc-su.webp", 22940], ["assets/kinh/duy-ma-cat.webp", 35974], ["assets/kinh/giao-gioi-la-hau-la-lon.webp", 24948], ["assets/kinh/giao-gioi-la-hau-la.webp", 33430], ["assets/kinh/giao-tho-thi-ca-la-viet.webp", 33820], ["assets/kinh/hanh-phuc.webp", 22930], ["assets/kinh/hoa-nghiem.webp", 27330], ["assets/kinh/hoi-huong-chung-sinh.webp", 20920], ["assets/kinh/hoi-huong-cong-duc.webp", 21158], ["assets/kinh/hoi-huong-ong-ba.webp", 30650], ["assets/kinh/kala-ma.webp", 38780], ["assets/kinh/kim-cang.webp", 53746], ["assets/kinh/kinh-chau-bau.webp", 19034], ["assets/kinh/kinh-doc-cu.webp", 21282], ["assets/kinh/kinh-lua-chay.webp", 22720], ["assets/kinh/lang-gia.webp", 38614], ["assets/kinh/lang-nghiem.webp", 49326], ["assets/kinh/lon-cong-nghiep.webp", 22822], ["assets/kinh/luc-tu-dai-minh.webp", 21042], ["assets/kinh/nam-dieu-quan-niem.webp", 37272], ["assets/kinh/ngu-gioi.webp", 35436], ["assets/kinh/ngu-triet.webp", 33504], ["assets/kinh/nhan-duyen.webp", 36058], ["assets/kinh/nhap-tuc-xuat-tuc.webp", 43004], ["assets/kinh/nhat-da-hien-gia.webp", 54482], ["assets/kinh/niem-phat-truoc-ngu.webp", 43392], ["assets/kinh/niem-xu.webp", 27836], ["assets/kinh/phan-biet-su-that.webp", 43862], ["assets/kinh/phap-bao-dan.webp", 24146], ["assets/kinh/phap-cu.webp", 43386], ["assets/kinh/phap-hoa.webp", 24202], ["assets/kinh/pho-hien-hanh-nguyen.webp", 21598], ["assets/kinh/pho-mon.webp", 15634], ["assets/kinh/quan-vo-luong-tho.webp", 41904], ["assets/kinh/quy-y.webp", 43958], ["assets/kinh/sa-mon-qua.webp", 22952], ["assets/kinh/sam-hoi-buoi-toi.webp", 26930], ["assets/kinh/sang-binh-an.webp", 38756], ["assets/kinh/song-tam.webp", 35710], ["assets/kinh/tam-kinh.webp", 24868], ["assets/kinh/tam-quy-y.webp", 35874], ["assets/kinh/tang-chi-bo.webp", 51452], ["assets/kinh/tat-ca-lau-hoac.webp", 35024], ["assets/kinh/thang-man.webp", 21694], ["assets/kinh/tieu-bo.webp", 28584], ["assets/kinh/toi-lang-tam.webp", 51848], ["assets/kinh/trung-bo.webp", 52690], ["assets/kinh/trung-dao.webp", 27844], ["assets/kinh/truong-bo.webp", 51190], ["assets/kinh/tu-bi-truoc-ngu.webp", 18792], ["assets/kinh/tu-bi.webp", 24852], ["assets/kinh/tu-thap-nhi-chuong.webp", 43798], ["assets/kinh/tuong-ung-bo.webp", 28102], ["assets/kinh/vi-du-cai-cua.webp", 39760], ["assets/kinh/vi-du-con-ran.webp", 43146], ["assets/kinh/vi-du-dau-chan-voi.webp", 41408], ["assets/kinh/vi-du-tam.webp", 24716], ["assets/kinh/vien-giac.webp", 35694], ["assets/kinh/vo-luong-tho.webp", 27162], ["assets/kinh/vo-nga-tuong.webp", 42776], ["assets/kinh/vo-thuong-tuong.webp", 23928], ["assets/audio/nghe-kinh/chuyen-phap-luan.mp3", 1044576], ["assets/audio/nghe-kinh/hanh-phuc.mp3", 876384], ["assets/audio/nghe-kinh/nhap-tuc-xuat-tuc.mp3", 924624], ["assets/audio/nghe-kinh/niem-xu.mp3", 1058544], ["assets/audio/nghe-kinh/phap-cu.mp3", 820224], ["assets/audio/nghe-kinh/tu-bi.mp3", 967536], ["assets/audio/thien/hoi-tho-01.mp3", 74304], ["assets/audio/thien/hoi-tho-02.mp3", 63792], ["assets/audio/thien/hoi-tho-03.mp3", 50256], ["assets/audio/thien/hoi-tho-04.mp3", 73008], ["assets/audio/thien/hoi-tho-05.mp3", 68256], ["assets/audio/thien/hoi-tho-06.mp3", 35424], ["assets/audio/thien/hoi-tho-07.mp3", 41472], ["assets/audio/thien/hoi-tho-08.mp3", 50256], ["assets/audio/thien/quet-than-01.mp3", 78048], ["assets/audio/thien/quet-than-02.mp3", 56592], ["assets/audio/thien/quet-than-03.mp3", 78048], ["assets/audio/thien/quet-than-04.mp3", 73584], ["assets/audio/thien/quet-than-05.mp3", 71280], ["assets/audio/thien/quet-than-06.mp3", 77760], ["assets/audio/thien/quet-than-07.mp3", 67536], ["assets/audio/thien/quet-than-08.mp3", 55008], ["assets/audio/thien/quet-than-09.mp3", 71568], ["assets/audio/thien/quet-than-10.mp3", 50832], ["assets/audio/thien/quet-than-11.mp3", 44640], ["assets/audio/thien/quet-than-12.mp3", 54720], ["assets/audio/thien/tu-bi-01.mp3", 63216], ["assets/audio/thien/tu-bi-02.mp3", 71280], ["assets/audio/thien/tu-bi-03.mp3", 94032], ["assets/audio/thien/tu-bi-04.mp3", 72432], ["assets/audio/thien/tu-bi-05.mp3", 95904], ["assets/audio/thien/tu-bi-06.mp3", 96192], ["assets/audio/thien/tu-bi-07.mp3", 101952], ["assets/audio/thien/tu-bi-08.mp3", 60912], ["assets/audio/thien/tu-bi-09.mp3", 67392], ["assets/audio/thien/tu-bi-10.mp3", 61632], ["assets/audio/thien/tu-bi-11.mp3", 45216], ["assets/audio/thien/tu-bi-12.mp3", 71424]];
const FONTS = ["https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700&family=Noto+Serif:ital,wght@0,400;0,500;0,600;1,400&display=swap"];
/* Gió Lành — Service worker (phần logic). tools/build_pwa.py ghép VERSION, PRECACHE, PACK vào đầu và xuất ra /sw.js.
   Chiến lược:
   - Khung trang (PRECACHE): lưu khi cài, đổi VERSION là tự cập nhật.
   - Trang chính: ưu tiên mạng, mất mạng thì dùng bản đã lưu.
   - Kinh văn, ảnh: trả bản đã lưu ngay, đồng thời cập nhật ngầm (stale-while-revalidate).
   - Giọng đọc MP3: lưu trọn file, hỗ trợ tua (Range) khi không có mạng.
   - Nhạc nền 46 MB: không lưu (quá nặng).
   - Font Google: lưu lâu dài. SuttaCentral: ưu tiên mạng, bài đã mở thì đọc lại được khi mất mạng. */
const SHELL = 'gl-shell-' + VERSION, RUNTIME = 'gl-runtime-v1', PACK_CACHE = 'gl-pack-v1', EXT = 'gl-ext-v1';
const SKIP = [/\/assets\/audio\/nhac-nen\.mp3$/];

/* Font Google: lưu luôn khi cài để lần đầu mất mạng chữ vẫn đúng (không bắt buộc — lỗi thì bỏ qua). */
async function cacheFonts() {
  try {
    const cache = await caches.open(EXT);
    for (const href of FONTS) {
      const res = await fetch(href, { mode: 'cors' });
      if (!res.ok) continue;
      await cache.put(href, res.clone());
      const files = [...(await res.text()).matchAll(/url\((https:[^)]+\.woff2)\)/g)].map(m => m[1]);
      await Promise.all(files.map(u => cache.match(u).then(hit => hit || fetch(u, { mode: 'cors' }).then(r => r.ok && cache.put(u, r)))));
    }
  } catch (e) { /* không có mạng lúc cài: font sẽ được lưu ở lần dùng sau */ }
}
self.addEventListener('install', e => {
  e.waitUntil(caches.open(SHELL).then(c => c.addAll(PRECACHE.map(u => new Request(u, { cache: 'reload' }))))
    .then(() => cacheFonts()).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k.startsWith('gl-shell-') && k !== SHELL) await caches.delete(k);
    await self.clients.claim();
  })());
});

async function fromCache(req) { return caches.match(req, { ignoreSearch: true }); }

async function networkFirst(req, cacheName, fallbackUrl, timeoutMs = 3500) {
  const cache = await caches.open(cacheName);
  try {
    const res = await Promise.race([fetch(req), new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), timeoutMs))]);
    if (res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone());
    return res;
  } catch (err) {
    return (await caches.match(req)) || (fallbackUrl && (await fromCache(fallbackUrl))) || Response.error();
  }
}

async function staleWhileRevalidate(req, event) {
  const cached = await caches.match(req);
  const update = fetch(req).then(async res => {
    if (res && res.ok) (await caches.open(RUNTIME)).put(req, res.clone());
    return res;
  }).catch(() => null);
  if (cached) { event.waitUntil(update); return cached; }
  return (await update) || Response.error();
}

async function cacheFirst(req, cacheName) {
  const cached = await caches.match(req);
  if (cached) return cached;
  const res = await fetch(req);
  if (res && (res.ok || res.type === 'opaque')) (await caches.open(cacheName)).put(req, res.clone());
  return res;
}

/* Âm thanh: trình duyệt xin từng đoạn (Range). Lưu trọn file một lần rồi cắt đoạn trả về. */
async function audioWithRange(req) {
  const url = req.url.split('#')[0];
  let full = await caches.match(url, { ignoreSearch: true });
  if (!full) {
    try {
      const res = await fetch(url);
      if (!res.ok) return res;
      await (await caches.open(RUNTIME)).put(url, res.clone());
      full = res;
    } catch (e) { return Response.error(); }
  }
  const range = req.headers.get('range');
  if (!range) return full;
  const buf = await full.arrayBuffer();
  const m = /bytes=(\d*)-(\d*)/.exec(range) || [];
  const size = buf.byteLength;
  const start = m[1] ? Number(m[1]) : 0;
  const end = m[2] ? Math.min(Number(m[2]), size - 1) : size - 1;
  if (start >= size) return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${size}` } });
  return new Response(buf.slice(start, end + 1), {
    status: 206, statusText: 'Partial Content',
    headers: { 'Content-Type': full.headers.get('Content-Type') || 'audio/mpeg', 'Content-Range': `bytes ${start}-${end}/${size}`, 'Content-Length': String(end - start + 1), 'Accept-Ranges': 'bytes' }
  });
}

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin === location.origin) {
    if (SKIP.some(r => r.test(url.pathname))) return;
    if (req.mode === 'navigate') { event.respondWith(networkFirst(req, RUNTIME, './index.html')); return; }
    if (/\.mp3$/i.test(url.pathname)) { event.respondWith(audioWithRange(req)); return; }
    event.respondWith(staleWhileRevalidate(req, event));
    return;
  }
  if (/^fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)) { event.respondWith(cacheFirst(req, EXT)); return; }
  if (url.hostname === 'suttacentral.net' && url.pathname.startsWith('/api/')) { event.respondWith(networkFirst(req, EXT, null, 8000)); return; }
});

/* Gói "dùng khi không có mạng": tải trọn kinh văn, ảnh bìa kinh và giọng đọc. */
async function packStatus() {
  const cache = await caches.open(PACK_CACHE);
  let have = 0, haveBytes = 0, total = 0;
  for (const [u, size] of PACK) { total += size; if (await caches.match(u)) { have++; haveBytes += size; } }
  return { type: 'pack-status', have, count: PACK.length, haveBytes, total };
}
async function downloadPack(client) {
  const cache = await caches.open(PACK_CACHE);
  let done = 0, failed = 0, bytes = 0;
  const total = PACK.reduce((a, [, s]) => a + s, 0);
  const queue = PACK.slice();
  async function worker() {
    while (queue.length) {
      const [u, size] = queue.shift();
      try {
        if (!(await caches.match(u))) {
          const res = await fetch(u, { cache: 'no-cache' });
          if (!res.ok) throw new Error(res.status);
          await cache.put(u, res);
        }
      } catch (e) { failed++; }
      done++; bytes += size;
      client && client.postMessage({ type: 'pack-progress', done, count: PACK.length, bytes, total, failed });
    }
  }
  await Promise.all([worker(), worker(), worker(), worker()]);
  client && client.postMessage(Object.assign(await packStatus(), { type: 'pack-done', failed }));
}
self.addEventListener('message', event => {
  const d = event.data || {};
  if (d.type === 'pack-status') event.waitUntil(packStatus().then(s => event.source && event.source.postMessage(s)));
  if (d.type === 'pack-download') event.waitUntil(downloadPack(event.source));
  if (d.type === 'pack-clear') event.waitUntil(caches.delete(PACK_CACHE).then(packStatus).then(s => event.source && event.source.postMessage(s)));
});
