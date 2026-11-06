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
