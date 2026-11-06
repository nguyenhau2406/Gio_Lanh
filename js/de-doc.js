/* Gió Lành — Chế độ dễ đọc: cỡ chữ toàn trang, tương phản cao, phông chữ đơn giản, giảm chuyển động.
   Thuộc tính được gắn lên <html> ngay trong <head> (xem đoạn script nhỏ ở index.html) để không bị nháy. */
(function () {
  'use strict';
  const KEY = 'gl_a11y_v1';
  const DEF = { size: 0, contrast: false, plain: false, calm: false };
  let st; try { st = Object.assign({}, DEF, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) { st = Object.assign({}, DEF); }
  const SIZES = [['Vừa', 1], ['Lớn', 1.15], ['Rất lớn', 1.3]];
  const html = document.documentElement;
  function apply() {
    html.style.setProperty('--gl-zoom', SIZES[st.size][1]);
    html.toggleAttribute('data-a11y-zoom', st.size > 0);
    html.toggleAttribute('data-a11y-contrast', st.contrast);
    html.toggleAttribute('data-a11y-plain', st.plain);
    html.toggleAttribute('data-a11y-calm', st.calm);
    try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) { }
    const on = st.size > 0 || st.contrast || st.plain || st.calm;
    document.querySelectorAll('.a11y-toggle').forEach(b => b.classList.toggle('is-on', on));
    if (panel) {
      panel.querySelectorAll('[data-size]').forEach(b => { const a = Number(b.dataset.size) === st.size; b.classList.toggle('on', a); b.setAttribute('aria-pressed', String(a)); });
      panel.querySelectorAll('[data-k]').forEach(b => { const a = !!st[b.dataset.k]; b.classList.toggle('on', a); b.setAttribute('aria-checked', String(a)); });
    }
  }

  /* Nút "Aa" trên thanh đầu trang */
  const actions = document.querySelector('.header-actions');
  if (!actions) { apply(); return; }
  const btn = document.createElement('button');
  btn.type = 'button'; btn.className = 'icon-button a11y-toggle'; btn.id = 'a11yToggle';
  btn.setAttribute('aria-label', 'Chế độ dễ đọc'); btn.title = 'Chế độ dễ đọc';
  btn.setAttribute('aria-expanded', 'false'); btn.setAttribute('aria-controls', 'a11yPanel');
  btn.innerHTML = '<span aria-hidden="true">Aa</span>';
  actions.insertBefore(btn, actions.firstChild);

  const panel = document.createElement('div');
  panel.className = 'a11y-panel'; panel.id = 'a11yPanel'; panel.hidden = true;
  panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-label', 'Chế độ dễ đọc');
  panel.innerHTML = `<div class="a11y-head"><strong>Chế độ dễ đọc</strong><button type="button" class="a11y-x" aria-label="Đóng">×</button></div>
    <div class="a11y-row"><span>Cỡ chữ toàn trang</span><div class="a11y-seg">${SIZES.map(([n], i) => `<button type="button" data-size="${i}" style="font-size:${13 + i * 2}px">${n}</button>`).join('')}</div></div>
    ${[['contrast', 'Tương phản cao', 'Chữ đậm và tối hơn, dễ nhìn dưới nắng'], ['plain', 'Phông chữ đơn giản', 'Dùng một kiểu chữ không chân cho toàn trang'], ['calm', 'Giảm chuyển động', 'Tắt lá rơi, hiệu ứng trượt và chuyển cảnh']]
      .map(([k, t, d]) => `<button type="button" class="a11y-sw" role="switch" data-k="${k}"><span><b>${t}</b><small>${d}</small></span><i aria-hidden="true"></i></button>`).join('')}
    <button type="button" class="a11y-reset">↺ Trở về mặc định</button>`;
  document.body.appendChild(panel); // ngoài header: header có thể bị áp filter khi bật tương phản cao

  function open(v) {
    panel.hidden = !v; btn.setAttribute('aria-expanded', String(v));
    if (v) { const r = btn.getBoundingClientRect(), z = st.size ? SIZES[st.size][1] : 1, hb = document.querySelector('.site-header').getBoundingClientRect().bottom; panel.style.setProperty('--a11y-right', Math.max(12, innerWidth - r.right * z) + 'px'); panel.style.setProperty('--a11y-top', Math.round(hb * z + 8) + 'px'); panel.querySelector('[data-size].on, [data-size]').focus({ preventScroll: true }); }
  }
  btn.addEventListener('click', () => open(panel.hidden));
  panel.querySelector('.a11y-x').addEventListener('click', () => { open(false); btn.focus(); });
  panel.addEventListener('click', e => {
    const s = e.target.closest('[data-size]'); if (s) { st.size = Number(s.dataset.size); apply(); return; }
    const k = e.target.closest('[data-k]'); if (k) { st[k.dataset.k] = !st[k.dataset.k]; apply(); return; }
    if (e.target.closest('.a11y-reset')) { st = Object.assign({}, DEF); apply(); }
  });
  document.addEventListener('click', e => { if (!panel.hidden && !e.target.closest('#a11yPanel,#a11yToggle')) open(false); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !panel.hidden) { open(false); btn.focus(); } });
  apply();
  window.GioA11y = { get: () => Object.assign({}, st), set: o => { Object.assign(st, o); apply(); } };
})();
