/* Gió Lành 7.12 — Khoảng chuyển tiếp thực tế giữa khung pháp thoại và Nhạc thiền. */
(function () {
  'use strict';
  const section = document.getElementById('phap-thoai');
  const lastCard = document.getElementById('talkDetail');
  const next = document.getElementById('nhac-thien');
  if (!section || !lastCard || !next) return;
  let pending = false;
  function align() {
    pending = false;
    if (!lastCard.getBoundingClientRect().height || !section.getBoundingClientRect().height) return;
    const cardEnd = lastCard.getBoundingClientRect().bottom;
    const musicStart = next.getBoundingClientRect().top;
    const margin = Number.parseFloat(section.style.marginBottom) || 0;
    // Gap independent of the previously applied margin. No fixed empty block.
    const naturalGap = musicStart - cardEnd - margin;
    const target = innerWidth <= 700 ? 18 : (innerWidth <= 1050 ? 24 : 30);
    const correction = Math.max(-650, Math.min(0, target - naturalGap));
    if (Math.abs(margin - correction) > 1) section.style.marginBottom = correction + 'px';
  }
  function request() {
    if (pending) return;
    pending = true;
    requestAnimationFrame(align);
  }
  request();
  window.addEventListener('load', request);
  window.addEventListener('resize', request, {passive:true});
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(request).catch(function(){});
  if ('ResizeObserver' in window) {
    const observer = new ResizeObserver(request);
    observer.observe(lastCard);
    observer.observe(section);
  }
  if ('MutationObserver' in window) {
    const inner = document.getElementById('talkDetailText');
    if (inner) new MutationObserver(request).observe(inner, {childList:true,subtree:true,characterData:true});
  }
})();
