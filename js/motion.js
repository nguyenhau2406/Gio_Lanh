/* Gió Lành — Hệ chuyển động: hiện dần khi cuộn, hoa sen nở ở tiêu đề, gợn sáng khi bấm, thanh tiến độ cuộn,
   và cảnh động trên ảnh đầu trang (tia nắng, bụi sáng, cánh sen rơi).
   Tự tắt khi người dùng bật "Giảm chuyển động" (hệ điều hành hoặc Chế độ dễ đọc). Nội dung không bao giờ bị ẩn nếu JS lỗi. */
(function () {
  'use strict';
  const html = document.documentElement;
  const calm = () => html.hasAttribute('data-a11y-calm') || matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Thanh tiến độ cuộn ---------- */
  const bar = document.createElement('div'); bar.className = 'mo-progress'; bar.setAttribute('aria-hidden', 'true');
  document.body.appendChild(bar);
  let q = false;
  const prog = () => { q = false; const h = document.documentElement.scrollHeight - innerHeight; bar.style.transform = `scaleX(${h > 0 ? Math.min(1, scrollY / h) : 0})`; };
  addEventListener('scroll', () => { if (!q) { q = true; requestAnimationFrame(prog); } }, { passive: true }); prog();

  /* ---------- Hiện dần khi cuộn tới ---------- */
  const GROUPS = [
    // [bộ chọn phần tử, kiểu hiệu ứng, có so le theo thứ tự trong nhóm]
    ['.section-heading, .talk-section-head, .music-top', 'up', false],
    ['.practice-card, .music-card, .tk-card, .gm-card, .talk-card', 'up', true],
    ['.listen-item, .lc-list li, .journey-list span', 'left', true],
    ['.daily-quote, .listen-feature, .chant-photo, .gl-close-art', 'zoom', true],
    ['.lc-today, .lc-cal, .mala-stage, .mala-side, .td-today, .welcome-left, .meditation-box, .chant-editor, .listen-list-wrap, .gl-close-copy', 'up', true],
  ];
  // Phần tử nằm trong dải trượt ngang (thư viện ảnh, nhạc thiền trên điện thoại…) không bao giờ "lọt" vào màn hình
  // theo chiều dọc nên không dùng hiệu ứng hiện dần — tránh bị ẩn mãi khi người dùng vuốt tới.
  const inScroller = n => !!n.closest('.gallery-track, .music-grid, .td-list, .gk-tabs, .gk-grid');
  if (!calm() && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.add('mo-in'); io.unobserve(e.target);
    }), { rootMargin: '0px 0px -8% 0px', threshold: .08 });
    const seen = new Set();
    GROUPS.forEach(([sel, kind, stagger]) => {
      const nodes = [...document.querySelectorAll(sel)].filter(n => !seen.has(n));
      const byParent = new Map();
      nodes.forEach(n => { seen.add(n); const p = n.parentElement; byParent.set(p, (byParent.get(p) || 0) + 1);
        const r = n.getBoundingClientRect(); if (r.top < innerHeight * .92 || inScroller(n)) return;   // đang trong màn hình hoặc trong dải trượt ngang: để nguyên
        n.classList.add('mo', 'mo-' + kind);
        if (stagger) n.style.setProperty('--mo-d', Math.min(6, byParent.get(p) - 1) * 90 + 'ms');
        io.observe(n);
      });
    });
    // phần tử được dựng sau (thẻ thời khóa, danh sách…) — quan sát thêm một lần khi trang tải xong
    addEventListener('load', () => setTimeout(() => GROUPS.forEach(([sel, kind, stagger]) => document.querySelectorAll(sel).forEach((n, i) => {
      if (seen.has(n)) return; seen.add(n); if (n.getBoundingClientRect().top < innerHeight * .92 || inScroller(n)) return;
      n.classList.add('mo', 'mo-' + kind); if (stagger) n.style.setProperty('--mo-d', Math.min(6, i % 7) * 90 + 'ms'); io.observe(n);
    })), 300));
    // hoa sen ở tiêu đề mục: nở khi hiện ra
    const lio = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('bloom'); lio.unobserve(e.target); } }), { threshold: .6 });
    document.querySelectorAll('.heading-mark img, .gl-close-kicker img, .chant-eyebrow img').forEach(n => lio.observe(n));
  }

  /* ---------- Gợn sáng khi bấm nút ---------- */
  document.addEventListener('pointerdown', e => {
    if (calm()) return;
    const b = e.target.closest('.btn, .tk-start, .gm-start, .gl-close .gl-btn-gold, .gl-close .gl-btn-ghost, .gl-app-actions button, .lc-act');
    if (!b) return;
    const r = b.getBoundingClientRect(), s = Math.max(r.width, r.height) * 2.2, d = document.createElement('span');
    d.className = 'mo-ripple'; d.style.cssText = `width:${s}px;height:${s}px;left:${e.clientX - r.left - s / 2}px;top:${e.clientY - r.top - s / 2}px`;
    if (getComputedStyle(b).position === 'static') b.style.position = 'relative';
    b.style.overflow = 'hidden'; b.appendChild(d); setTimeout(() => d.remove(), 750);
  }, { passive: true });

  /* ---------- Cảnh động trên ảnh đầu trang ---------- */
  const hero = document.querySelector('.hero');
  if (!hero) return;
  const cv = document.createElement('canvas'); cv.className = 'mo-hero'; cv.setAttribute('aria-hidden', 'true');
  (hero.querySelector('.hero-slides') || hero).appendChild(cv);
  const g = cv.getContext('2d');
  let W = 0, H = 0, dpr = 1, motes = [], petals = [], running = false, visible = true, raf = 0, t0 = performance.now();
  const R = (a, b) => a + Math.random() * (b - a);
  function size() {
    const r = cv.getBoundingClientRect(); dpr = Math.min(2, devicePixelRatio || 1);
    W = r.width; H = r.height; cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    const area = W * H / 12000;
    motes = Array.from({ length: Math.round(Math.min(70, area * .9)) }, () => ({ x: R(0, W), y: R(0, H), r: R(.6, 2.2), v: R(6, 18), a: R(0, 6.28), s: R(.2, .7) }));
    petals = Array.from({ length: Math.round(Math.min(9, 3 + area * .08)) }, () => newPetal(true));
  }
  function newPetal(any) { return { x: R(-.1, 1) * W, y: any ? R(0, H) : R(-60, -20), s: R(7, 13), vx: R(8, 22), vy: R(14, 26), rot: R(0, 6.28), vr: R(-.9, .9), sw: R(0, 6.28), hue: R(340, 360) }; }
  function frame(now) {
    raf = 0; if (!running) return;
    const dt = Math.min(.05, (now - t0) / 1000); t0 = now; const T = now / 1000;
    g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, H);
    // tia nắng từ phía mặt trời (giữa-phải ảnh)
    const sx = W * .62, sy = H * .55;
    g.save(); g.globalCompositeOperation = 'screen';
    for (let k = 0; k < 7; k++) {
      const ang = -2.2 + k * .26 + Math.sin(T * .15 + k) * .04, len = Math.hypot(W, H);
      const a = .05 + .04 * Math.sin(T * .5 + k * 1.7);
      const gr = g.createLinearGradient(sx, sy, sx + Math.cos(ang) * len, sy + Math.sin(ang) * len);
      gr.addColorStop(0, `rgba(255,236,190,${a})`); gr.addColorStop(1, 'rgba(255,236,190,0)');
      g.fillStyle = gr; g.beginPath(); g.moveTo(sx, sy);
      g.lineTo(sx + Math.cos(ang - .045) * len, sy + Math.sin(ang - .045) * len); g.lineTo(sx + Math.cos(ang + .045) * len, sy + Math.sin(ang + .045) * len); g.fill();
    }
    // bụi sáng bay lên
    for (const m of motes) {
      m.y -= m.v * dt; m.x += Math.sin(T * m.s + m.a) * 8 * dt; if (m.y < -5) { m.y = H + 5; m.x = R(0, W); }
      const tw = .35 + .45 * (.5 + .5 * Math.sin(T * 2 * m.s + m.a));
      const rg = g.createRadialGradient(m.x, m.y, 0, m.x, m.y, m.r * 4);
      rg.addColorStop(0, `rgba(255,240,200,${tw})`); rg.addColorStop(1, 'rgba(255,240,200,0)');
      g.fillStyle = rg; g.beginPath(); g.arc(m.x, m.y, m.r * 4, 0, 6.283); g.fill();
    }
    g.restore();
    // cánh sen rơi
    for (const p of petals) {
      p.sw += dt * 1.3; p.x += (p.vx + Math.sin(p.sw) * 18) * dt; p.y += p.vy * dt; p.rot += p.vr * dt;
      if (p.y > H + 30 || p.x > W + 40) Object.assign(p, newPetal(false));
      g.save(); g.translate(p.x, p.y); g.rotate(p.rot); g.scale(1, .55 + .45 * Math.abs(Math.sin(p.sw * .8)));
      const pg = g.createLinearGradient(0, -p.s, 0, p.s); pg.addColorStop(0, `hsla(${p.hue},80%,92%,.95)`); pg.addColorStop(1, `hsla(${p.hue},70%,74%,.85)`);
      g.fillStyle = pg; g.beginPath(); g.moveTo(0, -p.s); g.quadraticCurveTo(p.s * .75, 0, 0, p.s); g.quadraticCurveTo(-p.s * .75, 0, 0, -p.s); g.fill();
      g.restore();
    }
    raf = requestAnimationFrame(frame);
  }
  function update() {
    const should = visible && !document.hidden && !calm();
    if (should && !running) { running = true; t0 = performance.now(); raf = requestAnimationFrame(frame); cv.hidden = false; }
    else if (!should && running) { running = false; cancelAnimationFrame(raf); raf = 0; g.clearRect(0, 0, cv.width, cv.height); cv.hidden = calm(); }
  }
  new ResizeObserver(size).observe(cv); size();
  new IntersectionObserver(es => { visible = es[0].isIntersecting; update(); }).observe(hero);
  document.addEventListener('visibilitychange', update);
  new MutationObserver(update).observe(html, { attributes: true, attributeFilter: ['data-a11y-calm'] });
  update();
})();
