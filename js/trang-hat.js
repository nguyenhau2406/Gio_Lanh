/* Gió Lành — Chuỗi tràng hạt: đếm niệm Phật bằng tràng hạt ảo.
   Chạm / bấm Space / Enter / → để lần một hạt. Tròn chuỗi có chuông. Thống kê lưu trên máy. */
(function () {
  'use strict';
  const root = document.getElementById('malaApp');
  if (!root) return;
  const $ = (s, r = root) => r.querySelector(s);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const PHRASES = ['Nam mô A Di Đà Phật', 'Nam mô Bổn Sư Thích Ca Mâu Ni Phật', 'Nam mô Đại Bi Quán Thế Âm Bồ Tát', 'Nam mô Dược Sư Lưu Ly Quang Phật', 'Nam mô Địa Tạng Vương Bồ Tát', 'Om Mani Padme Hum'];
  const SIZES = [27, 54, 108];
  const KEY = 'gl_mala_v1', DAYS = 'gl_mala_days_v1';
  const load = (k, d) => { try { return Object.assign(d, JSON.parse(localStorage.getItem(k) || '{}')) } catch (e) { return d } };
  const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)) } catch (e) { } };
  const st = load(KEY, { phrase: 0, custom: '', size: 108, goal: 1, count: 0, total: 0, vib: true, bell: true, tick: true, mat: 'go' });
  const days = load(DAYS, {});
  const dayKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const phrase = () => st.phrase === -1 ? (st.custom.trim() || 'Câu niệm của bạn') : PHRASES[st.phrase];

  /* ---------- Âm thanh ---------- */
  let ac = null;
  function audio() { if (!ac) { const AC = window.AudioContext || window.webkitAudioContext; if (AC) ac = new AC(); } if (ac && ac.state === 'suspended') ac.resume(); return ac; }
  function tone(f, peak, decay, t0 = 0) {
    const a = audio(); if (!a) return; const t = a.currentTime + t0;
    const o = a.createOscillator(), g = a.createGain(); o.frequency.value = f;
    g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + .004); g.gain.exponentialRampToValueAtTime(.0001, t + decay);
    o.connect(g).connect(a.destination); o.start(t); o.stop(t + decay + .05);
  }
  const tick = () => { tone(1750, .05, .05); tone(880, .04, .08); };
  const bell = () => { [[1, .16, 3.2], [2.32, .08, 2.2], [4.25, .04, 1.3]].forEach(([r, p, d]) => tone(740 * r, p, d)); tone(744, .07, 3); };

  /* ---------- Vẽ tràng hạt: bộ vẽ 3D trong js/mala-3d.js ---------- */
  const MATS = window.GioMala3D ? window.GioMala3D.MATS : {};
  if (!MATS[st.mat]) st.mat = 'go';
  const placeCenter = el => ({ cx, cy, rx, ry }) => { Object.assign(el.style, { left: (cx - rx * .78) + 'px', top: (cy - ry * .82) + 'px', width: (rx * 1.56) + 'px', height: (ry * 1.64) + 'px' }); };

  root.innerHTML = `
   <div class="mala-stage">
     <button type="button" class="mala-tap" aria-label="Lần một hạt">
       <canvas class="mala-cv" aria-hidden="true"></canvas>
       <span class="mala-center"><b class="mala-count" aria-live="polite">0</b><small class="mala-of">/ 108</small><span class="mala-phrase"></span><em class="mala-hint">Chạm để lần hạt</em></span>
     </button>
     <div class="mala-quick"><button type="button" class="mala-undo" aria-label="Lùi lại một hạt">↶ Lùi 1</button><button type="button" class="mala-full" aria-label="Mở toàn màn hình">⛶ Toàn màn hình</button><button type="button" class="mala-reset">↺ Chuỗi mới</button></div>
   </div>
   <div class="mala-side">
     <label class="mala-field"><span>Câu niệm</span><select class="mala-sel">${PHRASES.map((p, i) => `<option value="${i}">${esc(p)}</option>`).join('')}<option value="-1">Tự nhập…</option></select></label>
     <input class="mala-custom" type="text" maxlength="60" placeholder="Nhập câu niệm của bạn" hidden>
     <div class="mala-field"><span>Chất liệu hạt</span><div class="mala-mats">${Object.entries(MATS).map(([k, m]) => `<button type="button" data-mat="${k}" style="--sw1:${m.base[0]};--sw2:${m.base[1]};--sw3:${m.base[2]}"><i aria-hidden="true"></i>${esc(m.name)}</button>`).join('')}</div></div>
     <div class="mala-field"><span>Số hạt mỗi chuỗi</span><div class="mala-seg">${SIZES.map(n => `<button type="button" data-size="${n}">${n}</button>`).join('')}</div></div>
     <div class="mala-field"><span>Mục tiêu mỗi ngày</span><div class="mala-seg mala-goal">${[1, 3, 5, 10].map(n => `<button type="button" data-goal="${n}">${n} chuỗi</button>`).join('')}</div></div>
     <div class="mala-toggles"><button type="button" data-t="tick">Tiếng hạt</button><button type="button" data-t="bell">Chuông tròn chuỗi</button><button type="button" data-t="vib">Rung</button></div>
     <div class="mala-stats">
       <div class="mala-today"><span>Hôm nay</span><b class="ms-today">0</b><small class="ms-goal"></small><i class="ms-bar"><i></i></i></div>
       <div><span>Chuỗi tròn</span><b class="ms-rounds">0</b></div>
       <div><span>Tổng cộng</span><b class="ms-total">0</b></div>
     </div>
     <div class="mala-week" aria-label="Số câu niệm 7 ngày gần đây"></div>
   </div>`;

  const E = { tap: $('.mala-tap'), wrap: $('.mala-ringwrap'), count: $('.mala-count'), of: $('.mala-of'), ph: $('.mala-phrase'), sel: $('.mala-sel'), custom: $('.mala-custom') };
  let mala = null, malaOv = null;
  function build() {
    st.count = Math.min(st.count, st.size - 1);
    if (!mala && window.GioMala3D) mala = new window.GioMala3D($('.mala-cv'), { onLayout: placeCenter($('.mala-center')) });
    mala && mala.set({ n: st.size, count: st.count, mat: st.mat }, false);
  }
  function render(animate = true) {
    const n = st.size, c = st.count;
    [mala, ov && !ov.hidden ? malaOv : null].forEach(r => r && r.set({ n, count: c, mat: st.mat }, animate));
    root.querySelectorAll('[data-mat]').forEach(b => { const on = b.dataset.mat === st.mat; b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on)); });
    E.count.textContent = c; E.of.textContent = '/ ' + n; E.ph.textContent = phrase();
    E.sel.value = String(st.phrase); E.custom.hidden = st.phrase !== -1; E.custom.value = st.custom;
    root.querySelectorAll('[data-size]').forEach(b => b.classList.toggle('on', Number(b.dataset.size) === n));
    root.querySelectorAll('[data-goal]').forEach(b => b.classList.toggle('on', Number(b.dataset.goal) === st.goal));
    root.querySelectorAll('[data-t]').forEach(b => { const on = st[b.dataset.t]; b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on)); });
    const today = days[dayKey()] || 0, goal = st.goal * n;
    $('.ms-today').textContent = today.toLocaleString('vi-VN');
    $('.ms-goal').textContent = today >= goal ? `✓ Đạt mục tiêu ${st.goal} chuỗi` : `Mục tiêu ${goal.toLocaleString('vi-VN')} câu`;
    $('.ms-bar i').style.width = Math.min(100, today / goal * 100) + '%';
    $('.ms-rounds').textContent = Math.floor(today / n);
    $('.ms-total').textContent = st.total.toLocaleString('vi-VN');
    const week = [...Array(7)].map((_, k) => { const d = new Date(); d.setDate(d.getDate() - 6 + k); return [d, days[dayKey(d)] || 0]; });
    const max = Math.max(goal, ...week.map(w => w[1]));
    $('.mala-week').innerHTML = week.map(([d, v], k) => `<span title="${d.getDate()}/${d.getMonth() + 1}: ${v} câu"><i style="height:${Math.max(3, v / max * 100)}%"${k === 6 ? ' class="today"' : ''}></i><small>${['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][d.getDay()]}</small></span>`).join('');
    if (ov && !ov.hidden) renderOv();
  }
  function persist() { save(KEY, st); save(DAYS, days); }
  function step(dir = 1) {
    const k = dayKey();
    if (dir > 0) {
      days[k] = (days[k] || 0) + 1; st.total++;
      if (st.tick) tick();
      st.count++;
      if (st.count >= st.size) {
        st.count = 0;
        if (st.bell) bell();
        if (st.vib && navigator.vibrate) navigator.vibrate([40, 60, 40]);
        root.classList.add('round'); setTimeout(() => root.classList.remove('round'), 1200);
        document.dispatchEvent(new CustomEvent('gio:mala-round', { detail: { size: st.size } }));
      } else if (st.vib && navigator.vibrate) navigator.vibrate(12);
    } else {
      if (st.count === 0 && !(days[k] > 0)) return;
      st.count = (st.count - 1 + st.size) % st.size; days[k] = Math.max(0, (days[k] || 0) - 1); st.total = Math.max(0, st.total - 1);
    }
    // xóa dữ liệu quá 60 ngày
    const keys = Object.keys(days).sort(); while (keys.length > 60) delete days[keys.shift()];
    persist(); render();
  }

  /* ---------- Toàn màn hình ---------- */
  let ov = null;
  function renderOv() {
    ov.querySelector('.mo-count').textContent = st.count; ov.querySelector('.mo-of').textContent = '/ ' + st.size;
    ov.querySelector('.mo-phrase').textContent = phrase();
    ov.querySelector('.mo-today').textContent = `Hôm nay ${(days[dayKey()] || 0).toLocaleString('vi-VN')} câu`;
  }
  function openFull() {
    if (!ov) {
      ov = document.createElement('div'); ov.className = 'mala-ov'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); ov.setAttribute('aria-label', 'Lần tràng hạt toàn màn hình');
      ov.innerHTML = `<button type="button" class="mo-x" aria-label="Thoát toàn màn hình">×</button><button type="button" class="mo-tap" aria-label="Lần một hạt"><canvas class="mo-cv" aria-hidden="true"></canvas><span class="mo-center"><b class="mo-count">0</b><small class="mo-of"></small></span></button><p class="mo-phrase"></p><p class="mo-today"></p><p class="mo-hint">Chạm bất cứ đâu để lần hạt · Esc để thoát</p>`;
      document.body.appendChild(ov);
      ov.addEventListener('click', e => { if (e.target.closest('.mo-x')) return closeFull(); step(1); pulse(ov.querySelector('.mo-tap')); });
      ov.addEventListener('keydown', e => { if (e.key === 'Escape') closeFull(); else if ([' ', 'Enter', 'ArrowRight'].includes(e.key)) { e.preventDefault(); step(1); } else if (e.key === 'ArrowLeft' || e.key === 'Backspace') step(-1); });
    }
    ov.hidden = false;
    if (!malaOv && window.GioMala3D) malaOv = new window.GioMala3D(ov.querySelector('.mo-cv'), { onLayout: placeCenter(ov.querySelector('.mo-center')) });
    malaOv && malaOv.set({ n: st.size, count: st.count, mat: st.mat }, false); document.documentElement.classList.add('tk-open'); renderOv(); render(false);
    try { wake = null; navigator.wakeLock && navigator.wakeLock.request('screen').then(w => wake = w).catch(() => 0); } catch (e) { }
    ov.querySelector('.mo-tap').focus({ preventScroll: true });
  }
  let wake = null;
  function closeFull() {
    ov.hidden = true; document.documentElement.classList.remove('tk-open'); wake && wake.release().catch(() => 0);
    render(false); E.tap.focus({ preventScroll: true });
  }
  const pulse = el => { el.classList.remove('pulse'); void el.offsetWidth; el.classList.add('pulse'); };

  /* ---------- Sự kiện ---------- */
  E.tap.addEventListener('click', () => { step(1); pulse(E.tap); });
  E.tap.addEventListener('keydown', e => { if (e.key === 'ArrowRight') { e.preventDefault(); step(1); } if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); } });
  $('.mala-undo').addEventListener('click', () => step(-1));
  $('.mala-reset').addEventListener('click', () => { st.count = 0; persist(); render(); });
  $('.mala-full').addEventListener('click', openFull);
  E.sel.addEventListener('change', () => { st.phrase = Number(E.sel.value); persist(); render(); if (st.phrase === -1) E.custom.focus(); });
  E.custom.addEventListener('input', () => { st.custom = E.custom.value; persist(); E.ph.textContent = phrase(); });
  root.querySelectorAll('[data-size]').forEach(b => b.addEventListener('click', () => { st.size = Number(b.dataset.size); st.count = 0; persist(); build(); render(false); }));
  root.querySelectorAll('[data-mat]').forEach(b => b.addEventListener('click', () => { st.mat = b.dataset.mat; persist(); render(false); }));
  root.querySelectorAll('[data-goal]').forEach(b => b.addEventListener('click', () => { st.goal = Number(b.dataset.goal); persist(); render(); }));
  root.querySelectorAll('[data-t]').forEach(b => b.addEventListener('click', () => { st[b.dataset.t] = !st[b.dataset.t]; persist(); render(); }));

  build(); render(false);
  window.GioMala = { step, open: openFull };
})();
