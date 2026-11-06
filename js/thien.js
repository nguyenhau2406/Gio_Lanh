/* Gió Lành — Thiền có hướng dẫn: lời dẫn (MP3) đặt theo mốc thời gian, xen khoảng lặng; chuông & âm nền tổng hợp.
   Dữ liệu: js/thien-data.js (tự sinh bởi tools/build_meditation_audio.py). */
(function () {
  'use strict';
  const DATA = window.GioThienData, host = document.getElementById('thienApp');
  if (!DATA || !host) return;
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const fmt = s => { s = Math.max(0, Math.ceil(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
  const store = { get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : v } catch (e) { return d } }, set(k, v) { try { localStorage.setItem(k, v) } catch (e) { } } };
  const opt = { amb: store.get('gm_amb', '1') === '1', sub: store.get('gm_sub', '1') === '1', vol: Number(store.get('gm_vol', '0.9')) };

  host.innerHTML = DATA.map(m => `<article class="gm-card"><span class="gm-ic" aria-hidden="true">${m.icon}</span><div class="gm-copy"><small>${esc(m.tag)} · ${m.minutes} phút</small><h3>${esc(m.title)}</h3><p>${esc(m.desc)}</p></div><button type="button" class="gm-start" data-gm="${m.id}" aria-label="Bắt đầu bài thiền ${esc(m.title)}, ${m.minutes} phút">▶</button></article>`).join('');

  /* ---------- Âm thanh tổng hợp ---------- */
  let ac = null, master = null, amb = null;
  function audio() { if (!ac) { const AC = window.AudioContext || window.webkitAudioContext; ac = new AC(); master = ac.createGain(); master.gain.value = opt.vol; master.connect(ac.destination); } if (ac.state === 'suspended') ac.resume(); return ac; }
  function bell(at = 0) {
    const t = audio().currentTime + at;
    [[1, .3, 10], [2.02, .17, 7], [2.74, .13, 5.5], [4.1, .07, 4], [.5, .1, 8]].forEach(([r, p, d]) => {
      const o = ac.createOscillator(), g = ac.createGain(); o.frequency.value = 196 * r;
      g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(p, t + .006); g.gain.exponentialRampToValueAtTime(.0001, t + d);
      o.connect(g).connect(master); o.start(t); o.stop(t + d + .1);
    });
  }
  function ambient(on) {
    audio();
    if (on && !amb) {
      const len = ac.sampleRate * 4, buf = ac.createBuffer(1, len, ac.sampleRate), d = buf.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0; for (let i = 0; i < len; i++) { const w = Math.random() * 2 - 1; b0 = .997 * b0 + w * .029; b1 = .985 * b1 + w * .032; b2 = .95 * b2 + w * .048; d[i] = (b0 + b1 + b2) * .25; }
      const src = ac.createBufferSource(); src.buffer = buf; src.loop = true;
      const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 520;
      const g = ac.createGain(); g.gain.value = 0; g.gain.setTargetAtTime(.5, ac.currentTime, 2);
      const lfo = ac.createOscillator(), lg = ac.createGain(); lfo.frequency.value = .07; lg.gain.value = .18; lfo.connect(lg).connect(g.gain);
      const drone = ac.createOscillator(), dg = ac.createGain(); drone.frequency.value = 98; dg.gain.value = .012;
      src.connect(lp).connect(g).connect(master); drone.connect(dg).connect(master);
      src.start(); lfo.start(); drone.start(); amb = { src, lfo, drone, g };
    } else if (!on && amb) {
      const a = amb; amb = null; a.g.gain.setTargetAtTime(0, ac.currentTime, .4);
      setTimeout(() => { try { a.src.stop(); a.lfo.stop(); a.drone.stop(); } catch (e) { } }, 1500);
    }
  }

  /* ---------- Màn thiền ---------- */
  const ov = document.createElement('div');
  ov.className = 'gm-ov'; ov.hidden = true; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); ov.setAttribute('aria-labelledby', 'gmTitle');
  ov.innerHTML = `<header class="gm-head"><div><small>THIỀN CÓ HƯỚNG DẪN</small><strong id="gmTitle"></strong></div><button type="button" class="gm-x" aria-label="Kết thúc buổi thiền">×</button></header>
   <div class="gm-center"><div class="gm-orb" aria-hidden="true"><svg class="gm-ring" viewBox="0 0 200 200"><circle cx="100" cy="100" r="96"/><circle class="gm-ring-p" cx="100" cy="100" r="96"/></svg><div class="gm-breath"></div><div class="gm-time"></div></div>
   <p class="gm-sub" aria-live="polite"></p></div>
   <footer class="gm-foot"><button type="button" class="gm-play" aria-label="Tạm dừng"><svg class="i-pl" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg><svg class="i-pa" viewBox="0 0 24 24"><path d="M8 5h3v14H8zM13 5h3v14h-3z"/></svg></button>
    <div class="gm-opts"><button type="button" class="gm-tg" data-o="amb">Âm nền</button><button type="button" class="gm-tg" data-o="sub">Phụ đề</button><label class="gm-vol"><span aria-hidden="true">🔈</span><input type="range" min="0" max="1" step="0.05" aria-label="Âm lượng"></label></div></footer>`;
  document.body.appendChild(ov);
  const E = { title: ov.querySelector('#gmTitle'), sub: ov.querySelector('.gm-sub'), time: ov.querySelector('.gm-time'), ring: ov.querySelector('.gm-ring-p'), play: ov.querySelector('.gm-play'), vol: ov.querySelector('.gm-vol input') };
  const CIRC = 2 * Math.PI * 96;
  let S = null, raf = 0, wake = null;

  function now() { return S.paused ? S.pausedAt : (performance.now() - S.start) / 1000; }
  function renderOpts() { ov.querySelectorAll('[data-o]').forEach(b => { const on = opt[b.dataset.o]; b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on)); }); ov.classList.toggle('no-sub', !opt.sub); E.vol.value = opt.vol; }
  function start(id) {
    const m = DATA.find(x => x.id === id); if (!m) return;
    try { window.GioListen && window.GioListen.stop(); window.GioLanhMedia && window.GioLanhMedia.stopAll(); window.GioBgm && window.GioBgm.hold(); window.GioThoiKhoaPlayer && window.GioThoiKhoaPlayer.close(); } catch (e) { }
    audio();
    S = { m, start: performance.now(), paused: false, pausedAt: 0, next: 0, cur: null, endBells: [m.duration - 10, m.duration - 5, m.duration].map(t => ({ t, done: false })), began: false, done: false,
      audios: m.cues.map(c => { const a = new Audio(); a.preload = 'auto'; a.src = c.audio; a.volume = opt.vol; return a; }) };
    E.title.textContent = `${m.title} · ${m.minutes} phút`; E.sub.textContent = ''; ov.classList.remove('is-paused', 'is-done');
    renderOpts(); ov.hidden = false; document.documentElement.classList.add('tk-open');
    bell(0.2); if (opt.amb) ambient(true);
    cancelAnimationFrame(raf); raf = requestAnimationFrame(frame);
    try { navigator.wakeLock && navigator.wakeLock.request('screen').then(w => wake = w).catch(() => 0); } catch (e) { }
    E.play.focus({ preventScroll: true });
  }
  function frame() {
    raf = requestAnimationFrame(frame); if (!S || S.done) return;
    const t = now(), m = S.m;
    // lời dẫn đến giờ
    while (S.next < m.cues.length && t >= m.cues[S.next].at) {
      const i = S.next++, c = m.cues[i], a = S.audios[i];
      if (t - c.at < c.dur) { try { a.currentTime = Math.max(0, t - c.at); a.volume = opt.vol; a.play().catch(() => 0); } catch (e) { } S.cur = i; E.sub.textContent = c.text; ov.classList.add('speaking'); }
    }
    if (S.cur != null && t > m.cues[S.cur].at + m.cues[S.cur].dur + 1.5) { S.cur = null; ov.classList.remove('speaking'); }
    S.endBells.forEach(b => { if (!b.done && t >= b.t) { b.done = true; bell(0); } });
    E.time.textContent = fmt(m.duration - t);
    E.ring.style.strokeDashoffset = (CIRC * (1 - Math.min(1, t / m.duration))).toFixed(1);
    const ph = (t % 10) / 10, s = ph < .4 ? .72 + .28 * (ph / .4) : 1 - .28 * ((ph - .4) / .6);
    ov.style.setProperty('--b', s.toFixed(3));
    if (t >= m.duration + 5) finish();
  }
  function pause(on) {
    if (!S || S.done) return;
    if (on) { S.pausedAt = now(); S.paused = true; S.audios.forEach(a => a.pause()); if (ac) ac.suspend(); }
    else { S.start = performance.now() - S.pausedAt * 1000; S.paused = false; if (ac) ac.resume(); if (S.cur != null) S.audios[S.cur].play().catch(() => 0); }
    ov.classList.toggle('is-paused', on); E.play.setAttribute('aria-label', on ? 'Tiếp tục' : 'Tạm dừng');
  }
  function finish() {
    S.done = true; ov.classList.add('is-done'); ambient(false);
    E.sub.innerHTML = `Buổi thiền đã viên mãn. Mang sự tĩnh lặng này theo vào từng việc trong ngày.<br><button type="button" class="gm-again">↻ Thiền lại</button>`;
    E.time.textContent = '✓';
    try { const k = 'gm_done_' + S.m.id; store.set(k, String(Number(store.get(k, '0')) + 1)); document.dispatchEvent(new CustomEvent('gio:thien-done', { detail: { id: S.m.id } })); } catch (e) { }
  }
  function close() {
    if (!S) return; cancelAnimationFrame(raf);
    S.audios.forEach(a => { a.pause(); a.src = ''; });
    ambient(false); const a = ac; setTimeout(() => { try { a && a.close(); } catch (e) { } }, 1600); ac = null; master = null;
    S = null; ov.hidden = true; document.documentElement.classList.remove('tk-open');
    wake && wake.release().catch(() => 0); wake = null;
    try { window.GioBgm && window.GioBgm.release(); } catch (e) { }
  }

  host.addEventListener('click', e => { const b = e.target.closest('[data-gm]'); if (b) start(b.dataset.gm); });
  ov.querySelector('.gm-x').addEventListener('click', close);
  E.play.addEventListener('click', () => S && !S.done && pause(!S.paused));
  ov.addEventListener('click', e => { if (e.target.closest('.gm-again') && S) { const id = S.m.id; close(); setTimeout(() => start(id), 50); } });
  ov.querySelectorAll('[data-o]').forEach(b => b.addEventListener('click', () => { const k = b.dataset.o; opt[k] = !opt[k]; store.set('gm_' + k, opt[k] ? '1' : '0'); renderOpts(); if (k === 'amb' && S && !S.done) ambient(opt.amb); }));
  E.vol.addEventListener('input', () => { opt.vol = Number(E.vol.value); store.set('gm_vol', String(opt.vol)); if (master) master.gain.value = opt.vol; S && S.audios.forEach(a => a.volume = opt.vol); });
  ov.addEventListener('keydown', e => { if (e.key === 'Escape') { e.preventDefault(); close(); } if (e.key === ' ' && !e.target.closest('button,input')) { e.preventDefault(); E.play.click(); } });
  document.addEventListener('visibilitychange', () => { if (!document.hidden && S && !wake && navigator.wakeLock) navigator.wakeLock.request('screen').then(w => wake = w).catch(() => 0); });
  window.GioThien = { start, close, ids: DATA.map(m => m.id) };
})();
