/* Gió Lành 7.13 — Đồng bộ viền vàng theo menu và cuộn về đầu trang.
   7.17 — Menu PC gộp nhóm xổ xuống (Kinh điển · Tu tập · Khám phá), dùng được bằng chuột, cảm ứng và bàn phím. */
(function () {
  'use strict';
  function initNavigation() {
    const header = document.querySelector('.site-header');
    const nav = [...document.querySelectorAll('.desktop-nav a[href^="#"], #mobileNav a[href^="#"]')];
    // Mọi mục có trong menu, xếp theo thứ tự xuất hiện trên trang (menu đã gộp nhóm nên thứ tự khác trang).
    const sectionIds = [...new Set(nav.map(a=>a.getAttribute('href').slice(1)))]
      .filter(id => id === 'top' || document.getElementById(id))
      .sort((a, b) => a === 'top' ? -1 : b === 'top' ? 1 : (document.getElementById(a).compareDocumentPosition(document.getElementById(b)) & 4 ? -1 : 1));
    const sectionSet = new Set(sectionIds);
    let lastActive = '';
    let queued = false;
    let holdId = '';
    let holdUntil = 0;

    function markActive(id) {
      if (!sectionSet.has(id)) return;
      if (id === lastActive) return;
      lastActive = id;
      nav.forEach(link=>{
        const active = link.getAttribute('href') === '#'+id;
        link.classList.toggle('nav-active', active);
        if (active) link.setAttribute('aria-current','location');
        else link.removeAttribute('aria-current');
      });
      document.querySelectorAll('.nav-group, .mn-group').forEach(g => g.classList.toggle('has-active', !!g.querySelector('a.nav-active')));
    }

    function targetByScroll() {
      if (window.scrollY <= 100) return 'top';
      const offset = (header ? header.getBoundingClientRect().height : 75) + Math.min(155, Math.round(window.innerHeight * .21));
      const probe = window.scrollY + offset;
      let result = 'top';
      for (const id of sectionIds) {
        if (id === 'top') continue;
        const el = document.getElementById(id);
        if (el && el.getClientRects().length && el.getBoundingClientRect().top + window.scrollY <= probe) result = id;
      }
      return result;
    }

    function refresh() {
      queued = false;
      if (holdId && Date.now() < holdUntil) { markActive(holdId); return; }
      holdId = '';
      markActive(targetByScroll());
    }
    function requestRefresh() {
      if (queued) return;
      queued = true;
      window.requestAnimationFrame(refresh);
    }
    function holdSelection(id) {
      if (!sectionSet.has(id)) return;
      holdId = id;
      holdUntil = Date.now() + 1050;
      markActive(id);
      window.setTimeout(requestRefresh, 1100);
    }

    function scrollToAbsoluteTop() {
      holdSelection('top');
      const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.scrollTo({ top: 0, left: 0, behavior: reduced ? 'instant' : 'smooth' });
      // Không để lại #top trên URL, tránh neo vào thanh header sticky.
      if (window.location.hash === '#top') {
        try { window.history.replaceState(window.history.state, '', location.pathname + location.search); } catch (_) { /* no-op */ }
      }
    }

    nav.forEach(link => link.addEventListener('click', () => {
      const id = link.getAttribute('href').slice(1);
      holdSelection(id);
    }));
    // Chặn điều hướng #top đến phần tử sticky; luôn cuộn tài liệu về y=0.
    document.addEventListener('click', (event) => {
      const a = event.target.closest('a[href="#top"]');
      if (!a) return;
      event.preventDefault();
      scrollToAbsoluteTop();
    }, true);
    // Xử lý sớm để không phụ thuộc listener cuộn cũ.
    const back = document.getElementById('backToTop');
    if (back) back.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopImmediatePropagation();
      scrollToAbsoluteTop();
    }, true);

    window.addEventListener('scroll', requestRefresh, {passive:true});
    window.addEventListener('resize', requestRefresh, {passive:true});
    window.addEventListener('popstate', requestRefresh);
    window.addEventListener('hashchange', requestRefresh);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(requestRefresh).catch(()=>{});
    requestRefresh();
  }
  function initDropdowns() {
    const groups = [...document.querySelectorAll('.desktop-nav .nav-group')];
    if (!groups.length) return;
    const canHover = window.matchMedia('(hover: hover) and (pointer: fine)');
    let closeTimer = 0;
    function setOpen(g, open) {
      g.classList.toggle('open', open);
      g.querySelector('.nav-group-btn').setAttribute('aria-expanded', String(open));
    }
    const closeAll = except => groups.forEach(g => { if (g !== except) setOpen(g, false); });
    groups.forEach(g => {
      const btn = g.querySelector('.nav-group-btn');
      const links = () => [...g.querySelectorAll('.nav-pop a:not([hidden])')];
      btn.addEventListener('click', () => { const open = !g.classList.contains('open'); closeAll(g); setOpen(g, open); });
      g.addEventListener('pointerenter', e => { if (e.pointerType !== 'mouse' || !canHover.matches) return; clearTimeout(closeTimer); closeAll(g); setOpen(g, true); });
      g.addEventListener('pointerleave', e => { if (e.pointerType !== 'mouse' || !canHover.matches) return; closeTimer = setTimeout(() => setOpen(g, false), 180); });
      btn.addEventListener('keydown', e => {
        if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') { if (e.key !== 'ArrowDown' && g.classList.contains('open')) return; e.preventDefault(); closeAll(g); setOpen(g, true); const l = links()[0]; l && l.focus(); }
      });
      g.querySelector('.nav-pop').addEventListener('keydown', e => {
        const ls = links(), i = ls.indexOf(document.activeElement);
        if (e.key === 'ArrowDown') { e.preventDefault(); ls[(i + 1) % ls.length].focus(); }
        if (e.key === 'ArrowUp') { e.preventDefault(); ls[(i - 1 + ls.length) % ls.length].focus(); }
        if (e.key === 'Escape') { e.preventDefault(); setOpen(g, false); btn.focus(); }
      });
      g.addEventListener('focusout', () => setTimeout(() => { if (!g.contains(document.activeElement)) setOpen(g, false); }, 0));
      g.querySelectorAll('.nav-pop a').forEach(a => a.addEventListener('click', () => setOpen(g, false)));
    });
    document.addEventListener('click', e => { if (!e.target.closest('.nav-group')) closeAll(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeAll(); });
    window.addEventListener('scroll', () => { if (!canHover.matches) closeAll(); }, { passive: true });
  }
  function boot() { initNavigation(); initDropdowns(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();
})();
