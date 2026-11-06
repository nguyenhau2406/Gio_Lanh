/* Gió Lành — Từ điển Phật học: trang tra cứu + giải nghĩa ngay trong trình đọc kinh. */
(function () {
  'use strict';
  const DATA = window.GioTuDien, GROUPS = window.GioTuDienGroups;
  if (!DATA) return;
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const fold = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase();
  const store = { get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : v } catch (e) { return d } }, set(k, v) { try { localStorage.setItem(k, v) } catch (e) { } } };
  DATA.forEach((x, i) => { x.i = i; x.key = fold([x.t, ...x.a, x.d].join(' ')); x.slug = fold(x.t).replace(/[^a-z0-9]+/g, '-'); });

  /* ---------- Trang tra cứu ---------- */
  const root = document.getElementById('tuDienApp');
  let group = 'all', q = '';
  function card(x, hl) {
    return `<article class="td-card" id="td-${x.slug}"><h3>${esc(x.t)}</h3>${x.a.length ? `<p class="td-aka">${x.a.map(esc).join(' · ')}</p>` : ''}<p class="td-def">${esc(x.d)}</p><span class="td-grp">${esc(GROUPS[x.c] || '')}</span></article>`;
  }
  function render() {
    const fq = fold(q).trim(), words = fq.split(/\s+/).filter(Boolean);
    const score = x => { if (!fq) return 1; const names = [x.t, ...x.a].map(fold); if (names.some(n => n === fq)) return 5; if (fold(x.t).startsWith(fq)) return 4; if (names.some(n => n.includes(fq))) return 3; if (fold(x.d).includes(fq)) return 2; return words.every(w => x.key.includes(w)) ? 1 : 0; };
    let list = DATA.filter(x => group === 'all' || x.c === group).map(x => [x, score(x)]).filter(([, s]) => s > 0);
    if (fq && list.some(([, s]) => s >= 2)) list = list.filter(([, s]) => s >= 2);   // có kết quả khớp nguyên cụm thì bỏ kết quả rời rạc
    list = list.sort((a, b) => b[1] - a[1] || a[0].t.localeCompare(b[0].t, 'vi')).map(([x]) => x);
    root.querySelector('.td-count').textContent = `${list.length} thuật ngữ`;
    root.querySelector('.td-list').innerHTML = list.length ? list.map(x => card(x)).join('') : `<p class="td-empty">Chưa có thuật ngữ “${esc(q)}”. Thử gõ ngắn hơn, hoặc không dấu.</p>`;
    root.querySelectorAll('[data-g]').forEach(b => { const on = b.dataset.g === group; b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on)); });
  }
  if (root) {
    const d = new Date(), today = DATA[(d.getFullYear() * 372 + d.getMonth() * 31 + d.getDate()) % DATA.length];
    root.innerHTML = `
      <div class="td-top">
        <div class="td-search"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 5 5"/></svg><input type="search" placeholder="Tìm thuật ngữ… (gõ có dấu hoặc không dấu: ngu uan, niet ban)" aria-label="Tìm thuật ngữ Phật học" autocomplete="off"></div>
        <div class="td-groups" role="group" aria-label="Lọc theo nhóm"><button type="button" data-g="all">Tất cả</button>${Object.entries(GROUPS).map(([k, v]) => `<button type="button" data-g="${k}">${esc(v)}</button>`).join('')}</div>
      </div>
      <div class="td-today"><span>✦ THUẬT NGỮ HÔM NAY</span><strong>${esc(today.t)}</strong><p>${esc(today.d)}</p></div>
      <div class="td-meta"><span class="td-count"></span><label class="td-sw"><input type="checkbox" class="td-auto"> Gạch chân & giải nghĩa thuật ngữ trong trình đọc kinh</label></div>
      <div class="td-list" aria-live="polite"></div>`;
    const input = root.querySelector('input[type=search]');
    let timer = 0;
    input.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(() => { q = input.value; render(); }, 120); });
    root.querySelector('.td-groups').addEventListener('click', e => { const b = e.target.closest('[data-g]'); if (b) { group = b.dataset.g; render(); } });
    const auto = root.querySelector('.td-auto'); auto.checked = store.get('td_auto', '1') === '1';
    auto.addEventListener('change', () => { store.set('td_auto', auto.checked ? '1' : '0'); annotate(true); });
    render();
  }
  function showInDict(x) {
    const sec = document.getElementById('tu-dien'); if (!sec || !root) return;
    window.GioReader && window.GioReader.close && window.GioReader.close();
    group = 'all'; q = x.t; root.querySelector('input[type=search]').value = x.t; render();
    setTimeout(() => { const c = document.getElementById('td-' + x.slug); (c || sec).scrollIntoView({ behavior: 'smooth', block: 'center' }); c && c.classList.add('flash'); }, 250);
  }

  /* ---------- Giải nghĩa trong trình đọc kinh ---------- */
  // Chỉ dùng thuật ngữ từ hai chữ trở lên (hoặc tên riêng dài) để tránh gạch chân các chữ thông dụng như "pháp", "không".
  const forms = [];
  DATA.forEach(x => [x.t, ...x.a].forEach(f => { const n = f.normalize('NFC'); if (n.split(/\s+/).length >= 2 && !/[ṇṭḍṃñāīūśṣ]/i.test(n)) forms.push([n, x]); }));
  forms.sort((a, b) => b[0].length - a[0].length);
  const byForm = new Map(forms.map(([f, x]) => [f.toLowerCase(), x]));
  const RE = new RegExp('(?<![\\p{L}\\p{M}])(' + forms.map(([f]) => f.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')(?![\\p{L}\\p{M}])', 'giu');

  function annotateNode(container) {
    const seen = new Set(); let count = 0;
    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, { acceptNode: n => n.parentElement.closest('.td-term,h1,h2,a,button,script,style') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT });
    const nodes = []; while (walker.nextNode()) nodes.push(walker.currentNode);
    for (const node of nodes) {
      if (count >= 30) break;
      const text = node.nodeValue.normalize('NFC'); RE.lastIndex = 0;
      let m, last = 0, frag = null;
      while ((m = RE.exec(text))) {
        const x = byForm.get(m[1].toLowerCase()); if (!x || seen.has(x.i)) continue;
        seen.add(x.i); count++;
        frag = frag || document.createDocumentFragment();
        frag.append(text.slice(last, m.index));
        const s = document.createElement('button'); s.type = 'button'; s.className = 'td-term'; s.dataset.td = x.i; s.textContent = m[1];
        s.setAttribute('aria-label', `${m[1]} — xem giải nghĩa`);
        frag.append(s); last = m.index + m[1].length;
        if (count >= 30) break;
      }
      if (frag) { frag.append(text.slice(last)); node.replaceWith(frag); }
    }
  }
  function strip(container) { container.querySelectorAll('.td-term').forEach(b => b.replaceWith(b.textContent)); container.normalize(); }
  let busy = false;
  function annotate(force) {
    const t = document.getElementById('gkText'); if (!t) return;
    busy = true;
    if (force) strip(t);
    if (store.get('td_auto', '1') === '1' && !t.querySelector('.td-term')) annotateNode(t);
    busy = false;
  }
  function watch() {
    const t = document.getElementById('gkText'); if (!t) return false;
    new MutationObserver(() => { if (!busy) { busy = true; requestAnimationFrame(() => { busy = false; annotate(false); }); } }).observe(t, { childList: true });
    annotate(false); return true;
  }
  if (!watch()) { const mo = new MutationObserver(() => { if (watch()) mo.disconnect(); }); mo.observe(document.body, { childList: true }); }

  /* Thẻ giải nghĩa nổi */
  const pop = document.createElement('div'); pop.className = 'td-pop'; pop.hidden = true; pop.setAttribute('role', 'dialog');
  document.body.appendChild(pop);
  let popFor = null;
  function openPop(btn) {
    const x = DATA[Number(btn.dataset.td)]; popFor = btn;
    pop.innerHTML = `<div class="td-pop-h"><strong>${esc(x.t)}</strong><button type="button" class="td-pop-x" aria-label="Đóng">×</button></div>${x.a.length ? `<p class="td-aka">${x.a.slice(0, 4).map(esc).join(' · ')}</p>` : ''}<p>${esc(x.d)}</p><button type="button" class="td-pop-more">Mở trong Từ điển Phật học →</button>`;
    pop.setAttribute('aria-label', 'Giải nghĩa: ' + x.t);
    pop.hidden = false;
    const r = btn.getBoundingClientRect(), w = pop.offsetWidth, h = pop.offsetHeight;
    let left = Math.min(innerWidth - w - 10, Math.max(10, r.left + r.width / 2 - w / 2));
    let top = r.bottom + 8; if (top + h > innerHeight - 10) top = Math.max(10, r.top - h - 8);
    pop.style.left = left + 'px'; pop.style.top = top + 'px';
    pop.querySelector('.td-pop-more').onclick = () => { closePop(); showInDict(x); };
    pop.querySelector('.td-pop-x').onclick = () => { closePop(); btn.focus(); };
    pop.querySelector('.td-pop-x').focus({ preventScroll: true });
  }
  function closePop() { pop.hidden = true; popFor = null; }
  document.addEventListener('click', e => {
    const b = e.target.closest('.td-term'); if (b) { e.preventDefault(); e.stopPropagation(); popFor === b ? closePop() : openPop(b); return; }
    if (!pop.hidden && !e.target.closest('.td-pop')) closePop();
  }, true);
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !pop.hidden) { e.stopPropagation(); const b = popFor; closePop(); b && b.focus(); } }, true);
  document.addEventListener('scroll', () => { if (!pop.hidden) closePop(); }, true);

  window.GioTuDienApi = { search: t => DATA.filter(x => x.key.includes(fold(t))), open: t => { const x = DATA.find(y => fold(y.t) === fold(t)); x && showInDict(x); } };
})();
