/* Gió Lành — Thời khóa tụng niệm có hướng dẫn.
   Mõ gõ theo nhịp, mỗi tiếng mõ một chữ được tô sáng; chuông lớn mở/kết thời khóa, chuông gia trì mở/kết từng bài.
   Âm thanh tổng hợp bằng Web Audio. Mọi mốc thời gian tính theo đồng hồ âm thanh nên tạm dừng/tiếp tục luôn khớp. */
(function () {
  'use strict';
  const PARTS = window.GioThoiKhoaParts, SESSIONS = window.GioThoiKhoa;
  const host = document.getElementById('tkCards');
  if (!PARTS || !SESSIONS || !host) return;
  const $ = (s, r = document) => r.querySelector(s);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const store = { get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : v } catch (e) { return d } }, set(k, v) { try { localStorage.setItem(k, v) } catch (e) { } } };
  const TEMPOS = [['Chậm', 56], ['Vừa', 72], ['Nhanh', 92]];
  const SMALL_BELL = 2.4, LEAD = 2;                      // giây cho một tiếng chuông gia trì; số nhịp dạo đầu
  const opt = {
    tempo: Math.min(2, Math.max(0, Number(store.get('tk_tempo', '1')))),
    mo: store.get('tk_mo', '1') === '1', bell: store.get('tk_bell', '1') === '1',
    mean: store.get('tk_mean', '1') === '1', vol: Number(store.get('tk_vol', '0.8'))
  };
  const spb = () => 60 / TEMPOS[opt.tempo][1];

  /* ---------- Dựng dòng thời gian cho một bước ---------- */
  function words(line) { return line.split(/\s+/).filter(Boolean); }
  function buildStep(part) {
    const ev = []; let t = 0;                            // ev: {t, kind, ...}; kind: big|small|mo|word|rest|end
    if (part.type === 'bell') {
      for (let i = 0; i < part.strikes; i++) { ev.push({ t, kind: 'big', n: i + 1 }); t += part.gap; }
      return { ev, dur: t };
    }
    if (part.type === 'guide' || part.type === 'breath') return { ev, dur: part.seconds };
    // chant
    const plan = [];
    const reps = part.repeat || 1;
    for (let r = 0; r < reps; r++) part.lines.forEach((ln, li) => plan.push({ li, r }));
    if (part.lastRepeat) for (let r = 1; r < part.lastRepeat; r++) plan.push({ li: part.lines.length - 1, r });
    ev.push({ t, kind: 'small' }); t += SMALL_BELL; ev.push({ t, kind: 'small' }); t += SMALL_BELL;
    const b = spb(); t += LEAD * b;
    let rep = 0;
    plan.forEach((p, k) => {
      const ws = words(part.lines[p.li][0]);
      ws.forEach((w, wi) => { ev.push({ t, kind: 'word', li: p.li, wi, rep: p.r, k, accent: wi === 0 }); t += b; });
      t += b;                                            // nghỉ một nhịp cuối câu
    });
    ev.push({ t, kind: 'small' }); t += SMALL_BELL;
    return { ev, dur: t, plan };
  }
  function estimate(session) {
    return session.steps.reduce((a, id) => a + buildStep(PARTS[id]).dur + 1.5, 0);
  }
  const fmtMin = s => { const m = Math.round(s / 60); return m < 1 ? '1 phút' : m + ' phút'; };
  const fmt = s => { s = Math.max(0, Math.ceil(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };

  /* ---------- Thẻ thời khóa trên trang ---------- */
  const LABEL = { bell: 'Chuông', guide: 'Hướng dẫn', breath: 'Hơi thở', chant: 'Tụng' };
  host.innerHTML = SESSIONS.map(s => `<article class="tk-card" data-tk="${s.id}">
    <div class="tk-card-top"><span class="tk-card-icon" aria-hidden="true">${s.icon}</span><div><small>${esc(s.when)}</small><h3>${esc(s.name)}</h3></div><span class="tk-card-time" data-tk-time="${s.id}">${fmtMin(estimate(s))}</span></div>
    <p>${esc(s.desc)}</p>
    <ol class="tk-card-steps">${s.steps.filter(id => PARTS[id].type === 'chant' || PARTS[id].type === 'breath').map(id => `<li>${esc(PARTS[id].title)}</li>`).join('')}</ol>
    <button type="button" class="tk-start" data-tk-start="${s.id}"><span aria-hidden="true">▶</span> Bắt đầu thời khóa</button>
  </article>`).join('');
  const refreshTimes = () => SESSIONS.forEach(s => { const n = host.querySelector(`[data-tk-time="${s.id}"]`); if (n) n.textContent = fmtMin(estimate(s)); });

  /* ---------- Âm thanh ---------- */
  let ac = null, master = null;
  function audio() {
    if (!ac) { const AC = window.AudioContext || window.webkitAudioContext; ac = new AC(); master = ac.createGain(); master.gain.value = opt.vol; master.connect(ac.destination); }
    return ac;
  }
  function partial(t, f, peak, decay, type = 'sine') {
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + 0.006); g.gain.exponentialRampToValueAtTime(0.0001, t + decay);
    o.connect(g).connect(master); o.start(t); o.stop(t + decay + 0.05);
  }
  function noise(t, dur, freq, q, peak) {
    const len = Math.ceil(ac.sampleRate * dur), buf = ac.createBuffer(1, len, ac.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
    const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
    s.buffer = buf; f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = q; g.gain.value = peak;
    s.connect(f).connect(g).connect(master); s.start(t);
  }
  const SOUND = {
    big(t) {   // chuông lớn: các bội âm không điều hòa, ngân dài
      [[1, .34, 11], [2.02, .2, 8], [2.74, .16, 6.5], [4.1, .09, 4.5], [5.43, .06, 3], [0.5, .12, 9]].forEach(([r, p, d]) => partial(t, 132 * r, p, d));
      partial(t, 133.2, .16, 10); noise(t, .08, 900, 1.2, .25);
    },
    small(t) { // chuông gia trì (dẫn khánh)
      [[1, .22, 2.6], [2.32, .12, 1.8], [4.25, .06, 1.1], [5.9, .03, .6]].forEach(([r, p, d]) => partial(t, 988 * r, p, d));
      partial(t, 991, .1, 2.4); noise(t, .02, 3500, 2, .12);
    },
    mo(t, accent) { // mõ gỗ: tiếng gõ ngắn, ấm
      const o = ac.createOscillator(), g = ac.createGain();
      o.type = 'sine'; o.frequency.setValueAtTime(accent ? 470 : 430, t); o.frequency.exponentialRampToValueAtTime(accent ? 380 : 350, t + 0.06);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(accent ? .75 : .55, t + 0.003); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);
      o.connect(g).connect(master); o.start(t); o.stop(t + 0.16);
      noise(t, .03, 1300, 3.5, accent ? .5 : .35);
    }
  };

  /* ---------- Màn tụng ---------- */
  const ov = document.createElement('div');
  ov.className = 'tk-ov'; ov.hidden = true; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); ov.setAttribute('aria-labelledby', 'tkTitle');
  ov.innerHTML = `<div class="tk-ov-glow" aria-hidden="true"></div>
   <header class="tk-head"><div><small class="tk-sess"></small><strong class="tk-stepno"></strong></div><span class="tk-remain" aria-live="off"></span><button type="button" class="tk-x" aria-label="Kết thúc thời khóa">×</button></header>
   <div class="tk-segs" role="tablist" aria-label="Các bước của thời khóa"></div>
   <main class="tk-stage"><span class="tk-kind"></span><h2 id="tkTitle" class="tk-title"></h2><div class="tk-body"></div></main>
   <footer class="tk-foot">
    <div class="tk-ctrl"><button type="button" class="tk-b tk-prev" aria-label="Bước trước"><svg viewBox="0 0 24 24"><path d="M6 5v14M19 5 9 12l10 7z"/></svg></button>
     <button type="button" class="tk-b tk-play" aria-label="Tạm dừng"><svg class="i-pl" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg><svg class="i-pa" viewBox="0 0 24 24"><path d="M8 5h3v14H8zM13 5h3v14h-3z"/></svg></button>
     <button type="button" class="tk-b tk-next" aria-label="Bước tiếp theo"><svg viewBox="0 0 24 24"><path d="M18 5v14M5 5l10 7-10 7z"/></svg></button></div>
    <div class="tk-opts">
     <div class="tk-seg" role="group" aria-label="Nhịp mõ">${TEMPOS.map(([n], i) => `<button type="button" data-tempo="${i}">${n}</button>`).join('')}</div>
     <button type="button" class="tk-tg" data-opt="mo">Mõ</button><button type="button" class="tk-tg" data-opt="bell">Chuông</button><button type="button" class="tk-tg" data-opt="mean">Nghĩa</button>
     <label class="tk-vol"><span aria-hidden="true">🔔</span><input type="range" min="0" max="1" step="0.05" aria-label="Âm lượng chuông mõ"></label>
    </div></footer>`;
  document.body.appendChild(ov);
  const E = { sess: $('.tk-sess', ov), no: $('.tk-stepno', ov), remain: $('.tk-remain', ov), segs: $('.tk-segs', ov), kind: $('.tk-kind', ov), title: $('.tk-title', ov), body: $('.tk-body', ov), play: $('.tk-play', ov), vol: $('.tk-vol input', ov) };

  let S = null;            // phiên đang chạy
  let raf = 0, sched = 0, wake = null, lastFocus = null;

  function renderOpts() {
    ov.querySelectorAll('[data-tempo]').forEach(b => b.classList.toggle('on', Number(b.dataset.tempo) === opt.tempo));
    ov.querySelectorAll('[data-opt]').forEach(b => { const on = opt[b.dataset.opt]; b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on)); });
    ov.classList.toggle('no-mean', !opt.mean); E.vol.value = opt.vol;
  }

  function stepBody(part) {
    if (part.type === 'chant') {
      return `<div class="tk-text">${part.lines.map(([l, m], li) => `<p class="tk-line" data-li="${li}"><span class="tk-hv">${words(l).map((w, wi) => `<span class="tk-w" data-wi="${wi}">${esc(w)}</span>`).join(' ')}</span>${m ? `<small class="tk-mean">${esc(m)}</small>` : ''}</p>`).join('')}</div><div class="tk-rep" aria-live="polite"></div>`;
    }
    if (part.type === 'bell') return `<div class="tk-bell" aria-hidden="true"><i></i><i></i><i></i><span>🔔</span></div><p class="tk-note">${esc(part.note || '')}</p><div class="tk-rep" aria-live="polite"></div>`;
    if (part.type === 'breath') return `<div class="tk-breath" aria-hidden="true"><div class="tk-breath-c"><span class="tk-breath-t">Thở vào</span></div></div><p class="tk-note">Thở tự nhiên. Thở vào, biết mình đang thở vào. Thở ra, biết mình đang thở ra.</p>`;
    return `<p class="tk-guide">${esc(part.text)}</p><div class="tk-count"><svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="18"/><circle class="tk-count-p" cx="20" cy="20" r="18"/></svg></div>`;
  }

  function loadStep(i, startNow = true) {
    const sess = S.session;
    S.i = Math.max(0, Math.min(sess.steps.length - 1, i));
    const part = PARTS[sess.steps[S.i]];
    S.part = part; S.build = buildStep(part); S.ptr = 0; S.cur = null;
    S.t0 = audio().currentTime + 0.35;
    E.no.textContent = `Bước ${S.i + 1}/${sess.steps.length}`;
    E.kind.textContent = LABEL[part.type];
    E.title.textContent = part.title;
    E.body.innerHTML = stepBody(part);
    E.body.scrollTop = 0;
    ov.dataset.type = part.type;
    E.segs.querySelectorAll('button').forEach((b, k) => { b.classList.toggle('done', k < S.i); b.classList.toggle('on', k === S.i); b.style.setProperty('--p', k < S.i ? '100%' : '0%'); });
    S.wordEls = part.type === 'chant' ? [...E.body.querySelectorAll('.tk-line')].map(p => [...p.querySelectorAll('.tk-w')]) : null;
    if (startNow && ac.state === 'suspended' && !S.paused) ac.resume();
  }

  function schedule() {
    if (!S || S.paused) return;
    const now = ac.currentTime, ahead = now + 0.25, ev = S.build.ev;
    while (S.ptr < ev.length && S.t0 + ev[S.ptr].t < ahead) {
      const e = ev[S.ptr++], at = Math.max(now, S.t0 + e.t);
      if (e.kind === 'big' && opt.bell) SOUND.big(at);
      else if (e.kind === 'small' && opt.bell) SOUND.small(at);
      else if (e.kind === 'word' && opt.mo) SOUND.mo(at, e.accent);
    }
  }

  function frame() {
    raf = requestAnimationFrame(frame);
    if (!S) return;
    const t = ac.currentTime - S.t0, part = S.part, dur = S.build.dur;
    const p = Math.max(0, Math.min(1, t / dur));
    const seg = E.segs.children[S.i]; if (seg) seg.style.setProperty('--p', (p * 100).toFixed(1) + '%');
    const left = S.build.dur - t + S.session.steps.slice(S.i + 1).reduce((a, id) => a + buildStep(PARTS[id]).dur + 1.5, 0);
    E.remain.textContent = 'Còn ' + fmt(left);
    if (part.type === 'chant') {
      // tìm chữ hiện tại
      let cur = null; const ev = S.build.ev;
      for (let k = 0; k < ev.length && ev[k].t <= t + 0.02; k++) if (ev[k].kind === 'word') cur = ev[k];
      if (cur !== S.cur) {
        if (S.cur) { const o = S.wordEls[S.cur.li][S.cur.wi]; o && o.classList.remove('on'); }
        if (cur) {
          const n = S.wordEls[cur.li][cur.wi];
          E.body.querySelectorAll('.tk-line').forEach((l, li) => { l.classList.toggle('cur', li === cur.li); });
          S.wordEls.forEach((ws, li) => ws.forEach((w, wi) => w.classList.toggle('said', li < cur.li || (li === cur.li && wi < cur.wi))));
          n.classList.add('on');
          const line = n.closest('.tk-line');
          if (!S.cur || S.cur.li !== cur.li) E.body.scrollTo({ top: line.offsetTop - E.body.clientHeight * 0.32, behavior: 'smooth' });
          const reps = (part.repeat || 1), rep = E.body.querySelector('.tk-rep');
          if (rep) rep.textContent = reps > 1 ? `Lần ${cur.rep + 1}/${reps}` : (part.lastRepeat && cur.li === part.lines.length - 1 ? `Câu chú · lần ${cur.rep + 1}/${part.lastRepeat}` : '');
        }
        S.cur = cur;
      }
    } else if (part.type === 'bell') {
      const n = Math.min(part.strikes, Math.floor(t / part.gap) + 1);
      const rep = E.body.querySelector('.tk-rep'); if (rep) rep.textContent = t < 0 ? '' : `Tiếng chuông ${n}/${part.strikes}`;
      const bell = E.body.querySelector('.tk-bell'); if (bell) bell.style.setProperty('--ring', ((t % part.gap) / part.gap).toFixed(3));
    } else if (part.type === 'breath') {
      const cyc = 10, ph = ((t % cyc) + cyc) % cyc, inhale = ph < 4;
      const c = E.body.querySelector('.tk-breath-c'), tx = E.body.querySelector('.tk-breath-t');
      if (c) c.style.setProperty('--s', inhale ? (0.62 + 0.38 * ph / 4).toFixed(3) : (1 - 0.38 * (ph - 4) / 6).toFixed(3));
      if (tx) tx.textContent = (inhale ? 'Thở vào' : 'Thở ra') + ' · ' + fmt(dur - t);
    } else {
      const c = E.body.querySelector('.tk-count-p'); if (c) c.style.strokeDashoffset = (113.1 * p).toFixed(1);
    }
    if (t >= dur + 1.2 && !S.paused) {
      if (S.i < S.session.steps.length - 1) loadStep(S.i + 1); else finish();
    }
  }

  async function lockScreen() { try { wake = await navigator.wakeLock.request('screen'); } catch (e) { wake = null; } }
  function start(id) {
    const session = SESSIONS.find(s => s.id === id); if (!session) return;
    try { window.GioListen && window.GioListen.stop(); window.GioLanhMedia && window.GioLanhMedia.stopAll(); window.GioBgm && window.GioBgm.hold(); } catch (e) { }
    audio(); if (ac.state === 'suspended') ac.resume();
    lastFocus = document.activeElement;
    S = { session, i: 0, paused: false };
    E.sess.textContent = session.name;
    E.segs.innerHTML = session.steps.map((id, k) => `<button type="button" role="tab" aria-label="Bước ${k + 1}: ${esc(PARTS[id].title)}" title="${esc(PARTS[id].title)}"><i></i></button>`).join('');
    renderOpts(); ov.hidden = false; document.documentElement.classList.add('tk-open');
    ov.classList.remove('is-paused', 'is-done');
    loadStep(0);
    cancelAnimationFrame(raf); raf = requestAnimationFrame(frame);
    clearInterval(sched); sched = setInterval(schedule, 50);
    lockScreen(); $('.tk-play', ov).focus({ preventScroll: true });
  }
  function pause(on) {
    if (!S) return; S.paused = on;
    ov.classList.toggle('is-paused', on); E.play.setAttribute('aria-label', on ? 'Tiếp tục' : 'Tạm dừng');
    if (on) ac.suspend(); else ac.resume();
  }
  function finish() {
    if (!S) return;
    ov.classList.add('is-done'); S.paused = true;
    E.kind.textContent = 'Viên mãn'; E.title.textContent = 'Thời khóa đã xong';
    E.body.innerHTML = `<p class="tk-guide">Nguyện cho bạn và mọi người được bình an. Mang sự tĩnh lặng này theo vào từng việc trong ngày.</p><button type="button" class="tk-again">↻ Tụng lại từ đầu</button>`;
    E.segs.querySelectorAll('button').forEach(b => { b.classList.add('done'); b.style.setProperty('--p', '100%'); });
    E.remain.textContent = '';
    try { store.set('tk_last_' + S.session.id, new Date().toISOString().slice(0, 10)); document.dispatchEvent(new CustomEvent('gio:thoikhoa-done', { detail: { id: S.session.id } })); } catch (e) { }
  }
  function close() {
    if (!S) return;
    cancelAnimationFrame(raf); clearInterval(sched);
    if (ac) { master.gain.setTargetAtTime(0, ac.currentTime, .15); setTimeout(() => { try { ac.close() } catch (e) { } ac = null; master = null; }, 500); }
    S = null; ov.hidden = true; document.documentElement.classList.remove('tk-open');
    if (wake) { wake.release().catch(() => 0); wake = null; }
    try { window.GioBgm && window.GioBgm.release(); } catch (e) { }
    lastFocus && lastFocus.focus && lastFocus.focus({ preventScroll: true });
  }

  function unDone() { if (S && ov.classList.contains('is-done')) { ov.classList.remove('is-done'); S.paused = false; ov.classList.remove('is-paused'); ac.resume(); } }
  /* ---------- Sự kiện ---------- */
  host.addEventListener('click', e => { const b = e.target.closest('[data-tk-start]'); if (b) start(b.dataset.tkStart); });
  $('.tk-x', ov).addEventListener('click', close);
  E.play.addEventListener('click', () => { if (ov.classList.contains('is-done')) return; pause(!S.paused); });
  $('.tk-prev', ov).addEventListener('click', () => { if (!S) return; const t = ac.currentTime - S.t0, wasDone = ov.classList.contains('is-done'); unDone(); loadStep(wasDone || t <= 3 ? (wasDone ? S.i : S.i - 1) : S.i); });
  $('.tk-next', ov).addEventListener('click', () => { if (!S) return; if (S.i < S.session.steps.length - 1) loadStep(S.i + 1); else finish(); });
  E.segs.addEventListener('click', e => { const b = e.target.closest('button'); if (!b || !S) return; unDone(); if (S.paused) pause(false); loadStep([...E.segs.children].indexOf(b)); });
  E.body.addEventListener('click', e => { if (e.target.closest('.tk-again') && S) { unDone(); loadStep(0); } });
  ov.querySelectorAll('[data-tempo]').forEach(b => b.addEventListener('click', () => {
    opt.tempo = Number(b.dataset.tempo); store.set('tk_tempo', String(opt.tempo)); renderOpts(); refreshTimes();
    if (S && S.part.type === 'chant') {     // đổi nhịp giữa chừng: dựng lại từ chữ đang tụng
      const t = ac.currentTime - S.t0, old = S.build, nb = buildStep(S.part);
      const done = old.ev.filter(x => x.kind === 'word' && x.t <= t).length;
      const nw = nb.ev.filter(x => x.kind === 'word'); const anchor = nw[Math.min(done, nw.length - 1)];
      S.build = nb; S.t0 = ac.currentTime - (anchor ? anchor.t : 0) + spb() * 0.5; S.ptr = nb.ev.findIndex(x => S.t0 + x.t >= ac.currentTime); if (S.ptr < 0) S.ptr = nb.ev.length;
    }
  }));
  ov.querySelectorAll('[data-opt]').forEach(b => b.addEventListener('click', () => { const k = b.dataset.opt; opt[k] = !opt[k]; store.set('tk_' + k, opt[k] ? '1' : '0'); renderOpts(); }));
  E.vol.addEventListener('input', () => { opt.vol = Number(E.vol.value); store.set('tk_vol', String(opt.vol)); if (master) master.gain.value = opt.vol; });
  ov.addEventListener('keydown', e => {
    if (e.key === 'Escape') { e.preventDefault(); close(); }
    if (e.key === ' ' && !e.target.closest('button,input')) { e.preventDefault(); E.play.click(); }
    if (e.key === 'ArrowRight' && !e.target.closest('input')) $('.tk-next', ov).click();
    if (e.key === 'ArrowLeft' && !e.target.closest('input')) $('.tk-prev', ov).click();
  });
  document.addEventListener('visibilitychange', () => { if (!document.hidden && S && !wake) lockScreen(); });

  window.GioThoiKhoaPlayer = { start, close, sessions: SESSIONS.map(s => s.id) };
})();
