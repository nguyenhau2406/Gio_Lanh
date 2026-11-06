/* Gió Lành 7.13 — Đồng bộ viền vàng theo menu và cuộn về đầu trang. */
(function () {
  'use strict';
  function initNavigation() {
    const header = document.querySelector('.site-header');
    const nav = [...document.querySelectorAll('.desktop-nav a[href^="#"], #mobileNav a[href^="#"]')];
    const primary = [...document.querySelectorAll('.desktop-nav a[href^="#"]')];
    const sectionIds = primary.map(a=>a.getAttribute('href').slice(1));
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
    }

    function targetByScroll() {
      if (window.scrollY <= 100) return 'top';
      const offset = (header ? header.getBoundingClientRect().height : 75) + Math.min(155, Math.round(window.innerHeight * .21));
      const probe = window.scrollY + offset;
      let result = 'top';
      for (const id of sectionIds) {
        if (id === 'top') continue;
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top + window.scrollY <= probe) result = id;
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
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initNavigation, {once:true});
  else initNavigation();
})();
