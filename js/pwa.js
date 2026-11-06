/* Gió Lành — Ứng dụng (PWA): cài lên màn hình chính, dùng khi không có mạng.
   Service worker chỉ chạy khi trang mở qua http(s) — mở trực tiếp file index.html thì khối này tự ẩn. */
(function () {
  'use strict';
  const band = document.getElementById('glApp');
  const $ = s => band && band.querySelector(s);
  const mb = b => (b / 1048576).toFixed(b > 10485760 ? 0 : 1).replace('.', ',') + ' MB';

  /* Lối tắt từ biểu tượng ứng dụng: ./?go=nghe-kinh */
  const go = new URLSearchParams(location.search).get('go');
  if (go && /^[a-z-]+$/.test(go)) addEventListener('load', () => setTimeout(() => { const t = document.getElementById(go); t && t.scrollIntoView({ behavior: 'smooth' }) }, 400));

  const supported = 'serviceWorker' in navigator && /^https?:$/.test(location.protocol);
  if (!supported) { if (band) band.hidden = true; return; }

  /* Báo mất mạng / có mạng lại */
  const pill = document.createElement('div');
  pill.className = 'gl-net'; pill.setAttribute('role', 'status'); pill.hidden = true;
  document.body.appendChild(pill);
  let pillTimer = 0;
  function net() {
    clearTimeout(pillTimer);
    pill.classList.toggle('off', !navigator.onLine);
    pill.textContent = navigator.onLine ? '● Đã có mạng trở lại' : '○ Đang dùng khi không có mạng — kinh đã lưu vẫn đọc và nghe được';
    pill.hidden = false;
    pillTimer = setTimeout(() => { pill.hidden = true }, navigator.onLine ? 3000 : 6000);
  }
  addEventListener('online', net); addEventListener('offline', net);
  if (!navigator.onLine) net();

  navigator.serviceWorker.register('sw.js').catch(err => console.warn('Không đăng ký được service worker:', err));
  const sw = () => navigator.serviceWorker.controller || null;

  /* Có bản mới: service worker mới tự kích hoạt; nạp lại một lần cho đồng bộ. */
  let reloaded = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloaded || !window.__glHadController) return; reloaded = true;
    const t = document.getElementById('toast'); if (t) { t.textContent = 'Gió Lành vừa được cập nhật ✦'; t.classList.add('show'); }
  });
  window.__glHadController = !!navigator.serviceWorker.controller;

  document.querySelectorAll('[data-pwa-only]').forEach(n => { n.hidden = false; });
  if (!band) return;
  band.hidden = false;

  /* ----- Cài ứng dụng ----- */
  const installBtn = $('.gl-app-install'), hint = $('.gl-app-hint');
  const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone;
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  let deferred = null;
  if (standalone) { installBtn.hidden = true; $('.gl-app-installed').hidden = false; }
  else if (ios) { installBtn.hidden = false; installBtn.dataset.ios = '1'; }
  addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferred = e; installBtn.hidden = false; });
  addEventListener('appinstalled', () => { installBtn.hidden = true; $('.gl-app-installed').hidden = false; deferred = null; });
  installBtn.addEventListener('click', async () => {
    if (deferred) { deferred.prompt(); await deferred.userChoice.catch(() => 0); deferred = null; return; }
    hint.hidden = !hint.hidden;
    hint.textContent = installBtn.dataset.ios
      ? 'Trên iPhone/iPad: mở bằng Safari, bấm nút Chia sẻ (ô vuông có mũi tên lên) rồi chọn “Thêm vào MH chính”.'
      : 'Trên máy tính: bấm biểu tượng cài đặt ở thanh địa chỉ. Trên Android: mở menu ⋮ của trình duyệt rồi chọn “Cài đặt ứng dụng” hoặc “Thêm vào màn hình chính”.';
  });

  /* ----- Gói dùng khi không có mạng ----- */
  const packBtn = $('.gl-app-pack'), bar = $('.gl-app-bar i'), barWrap = $('.gl-app-bar'), status = $('.gl-app-status');
  let busy = false;
  function show(s) {
    if (s.type === 'pack-progress') {
      barWrap.hidden = false; bar.style.width = (s.bytes / s.total * 100).toFixed(1) + '%';
      status.textContent = `Đang tải ${s.done}/${s.count} · ${mb(s.bytes)} / ${mb(s.total)}`;
      return;
    }
    const full = s.have >= s.count;
    busy = false; packBtn.disabled = false;
    barWrap.hidden = !full && !s.have; bar.style.width = (s.haveBytes / s.total * 100).toFixed(1) + '%';
    band.classList.toggle('is-ready', full);
    packBtn.textContent = full ? '✓ Đã lưu trọn bộ' : s.have ? `Tải tiếp phần còn lại (${mb(s.total - s.haveBytes)})` : `Tải để dùng khi không có mạng (${mb(s.total)})`;
    status.textContent = full
      ? `63 bài kinh, ảnh, giọng đọc kinh và các bài thiền đã nằm trên máy (${mb(s.total)}). Mất mạng vẫn đọc, nghe được.`
      : s.type === 'pack-done' && s.failed ? `Còn ${s.failed} tệp chưa tải được — kiểm tra mạng rồi bấm lại.`
      : 'Bài nào bạn đã mở sẽ tự được lưu. Tải trọn bộ để đọc mọi bài kinh và nghe giọng đọc ở bất cứ đâu.';
  }
  navigator.serviceWorker.addEventListener('message', e => { const d = e.data || {}; if (/^pack-/.test(d.type)) show(d); });
  packBtn.addEventListener('click', () => {
    if (busy || !sw()) return;
    if (band.classList.contains('is-ready')) return;
    busy = true; packBtn.disabled = true; packBtn.textContent = 'Đang tải…';
    sw().postMessage({ type: 'pack-download' });
  });
  navigator.serviceWorker.ready.then(() => {
    const ask = () => sw() ? sw().postMessage({ type: 'pack-status' }) : setTimeout(ask, 300);
    ask();
  });
})();
