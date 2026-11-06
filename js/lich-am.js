/* Gió Lành — Lịch âm Phật giáo.
   Đổi dương ↔ âm theo thuật toán thiên văn của Hồ Ngọc Đức (múi giờ Việt Nam UTC+7).
   Hiển thị: hôm nay (âm lịch, can chi, Phật lịch), ngày sóc vọng, ngày vía, mùa An cư; gợi ý kinh & thời khóa. */
(function () {
  'use strict';
  const TZ = 7, PI = Math.PI, INT = Math.floor;

  /* ---------- Thuật toán âm lịch (Hồ Ngọc Đức) ---------- */
  function jdFromDate(d, m, y) {
    const a = INT((14 - m) / 12), yy = y + 4800 - a, mm = m + 12 * a - 3;
    let jd = d + INT((153 * mm + 2) / 5) + 365 * yy + INT(yy / 4) - INT(yy / 100) + INT(yy / 400) - 32045;
    if (jd < 2299161) jd = d + INT((153 * mm + 2) / 5) + 365 * yy + INT(yy / 4) - 32083;
    return jd;
  }
  function jdToDate(jd) {
    let a, b, c;
    if (jd > 2299160) { a = jd + 32044; b = INT((4 * a + 3) / 146097); c = a - INT((b * 146097) / 4); }
    else { b = 0; c = jd + 32082; }
    const d = INT((4 * c + 3) / 1461), e = c - INT((1461 * d) / 4), m = INT((5 * e + 2) / 153);
    return [e - INT((153 * m + 2) / 5) + 1, m + 3 - 12 * INT(m / 10), b * 100 + d - 4800 + INT(m / 10)];
  }
  function newMoon(k) {
    const T = k / 1236.85, T2 = T * T, T3 = T2 * T, dr = PI / 180;
    let Jd1 = 2415020.75933 + 29.53058868 * k + 0.0001178 * T2 - 0.000000155 * T3;
    Jd1 += 0.00033 * Math.sin((166.56 + 132.87 * T - 0.009173 * T2) * dr);
    const M = 359.2242 + 29.10535608 * k - 0.0000333 * T2 - 0.00000347 * T3;
    const Mpr = 306.0253 + 385.81691806 * k + 0.0107306 * T2 + 0.00001236 * T3;
    const F = 21.2964 + 390.67050646 * k - 0.0016528 * T2 - 0.00000239 * T3;
    let C1 = (0.1734 - 0.000393 * T) * Math.sin(M * dr) + 0.0021 * Math.sin(2 * dr * M);
    C1 = C1 - 0.4068 * Math.sin(Mpr * dr) + 0.0161 * Math.sin(dr * 2 * Mpr) - 0.0004 * Math.sin(dr * 3 * Mpr);
    C1 = C1 + 0.0104 * Math.sin(dr * 2 * F) - 0.0051 * Math.sin(dr * (M + Mpr)) - 0.0074 * Math.sin(dr * (M - Mpr));
    C1 = C1 + 0.0004 * Math.sin(dr * (2 * F + M)) - 0.0004 * Math.sin(dr * (2 * F - M)) - 0.0006 * Math.sin(dr * (2 * F + Mpr));
    C1 = C1 + 0.001 * Math.sin(dr * (2 * F - Mpr)) + 0.0005 * Math.sin(dr * (2 * Mpr + M));
    const deltat = T < -11 ? 0.001 + 0.000839 * T + 0.0002261 * T2 - 0.00000845 * T3 - 0.000000081 * T * T3 : -0.000278 + 0.000265 * T + 0.000262 * T2;
    return Jd1 + C1 - deltat;
  }
  function sunLongitude(jdn) {
    const T = (jdn - 2451545.0) / 36525, T2 = T * T, dr = PI / 180;
    const M = 357.5291 + 35999.0503 * T - 0.0001559 * T2 - 0.00000048 * T * T2;
    const L0 = 280.46645 + 36000.76983 * T + 0.0003032 * T2;
    let DL = (1.9146 - 0.004817 * T - 0.000014 * T2) * Math.sin(dr * M);
    DL += (0.019993 - 0.000101 * T) * Math.sin(dr * 2 * M) + 0.00029 * Math.sin(dr * 3 * M);
    let L = (L0 + DL) * dr; L -= PI * 2 * INT(L / (PI * 2));
    return L;
  }
  const getNewMoonDay = k => INT(newMoon(k) + 0.5 + TZ / 24);
  const getSunLongitude = d => INT(sunLongitude(d - 0.5 - TZ / 24) / PI * 6);
  function getLunarMonth11(yy) {
    const off = jdFromDate(31, 12, yy) - 2415021, k = INT(off / 29.530588853);
    let nm = getNewMoonDay(k);
    if (getSunLongitude(nm) >= 9) nm = getNewMoonDay(k - 1);
    return nm;
  }
  function getLeapMonthOffset(a11) {
    const k = INT((a11 - 2415021.076998695) / 29.530588853 + 0.5);
    let last, i = 1, arc = getSunLongitude(getNewMoonDay(k + i));
    do { last = arc; i++; arc = getSunLongitude(getNewMoonDay(k + i)); } while (arc !== last && i < 14);
    return i - 1;
  }
  function solar2lunar(dd, mm, yy) {
    const dayNumber = jdFromDate(dd, mm, yy), k = INT((dayNumber - 2415021.076998695) / 29.530588853);
    let monthStart = getNewMoonDay(k + 1);
    if (monthStart > dayNumber) monthStart = getNewMoonDay(k);
    let a11 = getLunarMonth11(yy), b11 = a11, lunarYear;
    if (a11 >= monthStart) { lunarYear = yy; a11 = getLunarMonth11(yy - 1); }
    else { lunarYear = yy + 1; b11 = getLunarMonth11(yy + 1); }
    const lunarDay = dayNumber - monthStart + 1, diff = INT((monthStart - a11) / 29);
    let lunarLeap = 0, lunarMonth = diff + 11;
    if (b11 - a11 > 365) {
      const leapDiff = getLeapMonthOffset(a11);
      if (diff >= leapDiff) { lunarMonth = diff + 10; if (diff === leapDiff) lunarLeap = 1; }
    }
    if (lunarMonth > 12) lunarMonth -= 12;
    if (lunarMonth >= 11 && diff < 4) lunarYear -= 1;
    // độ dài tháng âm hiện tại (29/30)
    const nextStart = getNewMoonDay(INT((monthStart - 2415021.076998695) / 29.530588853 + 0.5) + 1);
    return { d: lunarDay, m: lunarMonth, y: lunarYear, leap: lunarLeap, len: nextStart - monthStart, jd: dayNumber };
  }

  /* ---------- Tên gọi ---------- */
  const CAN = ['Giáp', 'Ất', 'Bính', 'Đinh', 'Mậu', 'Kỷ', 'Canh', 'Tân', 'Nhâm', 'Quý'];
  const CHI = ['Tý', 'Sửu', 'Dần', 'Mão', 'Thìn', 'Tỵ', 'Ngọ', 'Mùi', 'Thân', 'Dậu', 'Tuất', 'Hợi'];
  const THU = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
  const canChiYear = y => CAN[(y + 6) % 10] + ' ' + CHI[(y + 8) % 12];
  const canChiDay = jd => CAN[(jd + 9) % 10] + ' ' + CHI[(jd + 1) % 12];
  const MONTH_NAME = ['', 'Giêng', 'Hai', 'Ba', 'Tư', 'Năm', 'Sáu', 'Bảy', 'Tám', 'Chín', 'Mười', 'Mười Một', 'Chạp'];
  const lunarDayName = d => d === 1 ? 'Mùng Một' : d === 15 ? 'Rằm' : d <= 10 ? 'Mùng ' + d : String(d);

  /* ---------- Ngày lễ, ngày vía (âm lịch, theo truyền thống Phật giáo Việt Nam) ---------- */
  // last:true = ngày cuối tháng (29 hoặc 30). kinh = mã sách trong thư viện; tk = thời khóa gợi ý.
  const FEASTS = [
    { m: 1, d: 1, name: 'Vía Đức Phật Di Lặc', note: 'Ngày đầu năm mới, cầu an và phát nguyện.', tk: 'sang', big: true },
    { m: 1, d: 15, name: 'Rằm tháng Giêng', note: 'Lễ Thượng Nguyên — cầu an đầu năm.', tk: 'sang', big: true },
    { m: 2, d: 8, name: 'Đức Phật Thích Ca xuất gia', note: 'Tưởng nhớ ngày Thái tử Tất Đạt Đa rời cung thành tìm đạo.', kinh: 'chuyen-phap-luan' },
    { m: 2, d: 15, name: 'Đức Phật Thích Ca nhập Niết Bàn', note: 'Quán chiếu vô thường và lời di giáo của Đức Phật.', kinh: 'chuyen-phap-luan', big: true },
    { m: 2, d: 19, name: 'Vía Bồ Tát Quán Thế Âm đản sanh', note: 'Tụng Phẩm Phổ Môn, niệm danh hiệu Quán Thế Âm.', kinh: 'pho-mon', big: true },
    { m: 2, d: 21, name: 'Vía Bồ Tát Phổ Hiền', note: 'Ngày của hạnh nguyện và việc lành cụ thể.' },
    { m: 4, d: 4, name: 'Vía Bồ Tát Văn Thù', note: 'Ngày của trí tuệ — tụng Tâm Kinh.', kinh: 'tam-kinh' },
    { m: 4, d: 15, name: 'Đại lễ Phật Đản', note: 'Kỷ niệm ngày Đức Phật đản sanh. Phật lịch sang năm mới.', kinh: 'tam-kinh', tk: 'sang', big: true },
    { m: 4, d: 16, name: 'Bắt đầu An cư kiết hạ', note: 'Chư Tăng Ni an cư ba tháng; người tại gia tinh tấn tu học.' },
    { m: 6, d: 19, name: 'Vía Bồ Tát Quán Thế Âm thành đạo', kinh: 'pho-mon', note: 'Niệm Quán Thế Âm, thực tập lắng nghe sâu.' },
    { m: 7, d: 13, name: 'Vía Bồ Tát Đại Thế Chí', note: 'Niệm Phật, nuôi dưỡng chánh niệm.' },
    { m: 7, d: 15, name: 'Lễ Vu Lan báo hiếu', note: 'Tự tứ, mãn hạ. Tưởng nhớ công ơn cha mẹ, tụng Kinh Vu Lan.', kinh: 'vu-lan', tk: 'toi', big: true },
    { m: 7, last: true, name: 'Vía Bồ Tát Địa Tạng', note: 'Tụng Kinh Địa Tạng, hồi hướng đến người đã khuất.', kinh: 'dia-tang' },
    { m: 9, d: 19, name: 'Vía Bồ Tát Quán Thế Âm xuất gia', kinh: 'pho-mon', note: 'Tụng Phẩm Phổ Môn.' },
    { m: 9, last: true, name: 'Vía Đức Phật Dược Sư', note: 'Tụng Kinh Dược Sư, cầu an cho người bệnh.', kinh: 'duoc-su' },
    { m: 10, d: 15, name: 'Rằm tháng Mười', note: 'Lễ Hạ Nguyên.', tk: 'toi' },
    { m: 11, d: 17, name: 'Vía Đức Phật A Di Đà', note: 'Tụng Kinh A Di Đà, niệm Phật.', kinh: 'a-di-da', tk: 'toi', big: true },
    { m: 12, d: 8, name: 'Đức Phật Thích Ca thành đạo', note: 'Ngày Đức Phật giác ngộ dưới cội Bồ Đề.', kinh: 'chuyen-phap-luan', big: true },
  ];
  function feastsOn(L) {
    if (L.leap) return [];
    return FEASTS.filter(f => f.m === L.m && (f.last ? L.d === L.len : f.d === L.d));
  }
  function info(date) {
    const L = solar2lunar(date.getDate(), date.getMonth() + 1, date.getFullYear());
    const fs = feastsOn(L), soc = L.d === 1, vong = L.d === 15;
    const ancu = !L.leap && ((L.m === 4 && L.d >= 16) || L.m === 5 || L.m === 6 || (L.m === 7 && L.d <= 15));
    return { date, L, feasts: fs, soc, vong, ancu, special: fs.length > 0 || soc || vong };
  }
  const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
  const sameDay = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  // Phật lịch sang năm mới từ Rằm tháng Tư âm lịch (Đại lễ Phật Đản): 2026 → 2570.
  const phatLich = (date, L) => L.y + ((L.m > 4 || (L.m === 4 && L.d >= 15)) ? 544 : 543);
  function upcoming(from, n) {
    const out = []; for (let i = 0; i < 400 && out.length < n; i++) { const x = info(addDays(from, i)); if (x.feasts.length || x.soc || x.vong) out.push(x); }
    return out;
  }
  function labelOf(x) {
    if (x.feasts.length) return x.feasts.map(f => f.name).join(' · ');
    if (x.vong) return 'Rằm tháng ' + MONTH_NAME[x.L.m] + (x.L.leap ? ' (nhuận)' : '');
    if (x.soc) return 'Mùng Một tháng ' + MONTH_NAME[x.L.m] + (x.L.leap ? ' (nhuận)' : '');
    return '';
  }
  function suggestion(x) {
    const f = x.feasts.find(f => f.kinh || f.tk) || x.feasts[0];
    if (f) return { note: f.note, kinh: f.kinh, tk: f.tk || (f.kinh ? null : 'sang') };
    if (x.vong || x.soc) return { note: 'Ngày sóc vọng: dâng hương, tụng kinh, ăn chay và làm một việc thiện.', tk: 'sang', kinh: 'pho-mon' };
    return null;
  }

  /* ---------- Giao diện ---------- */
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const fmtSolar = d => `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const T = info(today);
  window.GioLich = { solar2lunar, info, upcoming, canChiYear };

  // Dòng nhỏ trên thanh trên cùng
  const topRight = document.querySelector('.topbar-inner span:last-child');
  if (topRight) {
    topRight.textContent = `${THU[today.getDay()]} · ${T.L.d}/${T.L.m}${T.L.leap ? ' nhuận' : ''} âm lịch · ${canChiYear(T.L.y)}`;
    topRight.title = 'Âm lịch hôm nay — xem Lịch Phật giáo';
    topRight.style.cursor = 'pointer';
    topRight.addEventListener('click', () => { const s = document.getElementById('lich'); s && s.scrollIntoView({ behavior: 'smooth' }); });
  }

  // Ngày âm hôm nay bên cạnh mục "Lịch Phật giáo" trong menu
  document.querySelectorAll('[data-lunar-today]').forEach(n => { n.textContent = `${T.L.d}/${T.L.m}`; n.title = `Hôm nay ${T.L.d}/${T.L.m} âm lịch`; if (T.special) n.classList.add('is-special'); });

  const root = document.getElementById('lichApp');
  if (!root) return;
  const kinhName = id => (window.GioKinhRegistry && window.GioKinhRegistry.books[id] && window.GioKinhRegistry.books[id].title) || '';
  const tkName = id => ((window.GioThoiKhoa || []).find(s => s.id === id) || {}).name || '';
  function actions(sg) {
    if (!sg) return '';
    const a = [];
    if (sg.tk && tkName(sg.tk)) a.push(`<button type="button" class="lc-act lc-act-main" data-lc-tk="${sg.tk}">▶ ${esc(tkName(sg.tk))}</button>`);
    if (sg.kinh && kinhName(sg.kinh)) a.push(`<button type="button" class="lc-act" data-lc-kinh="${sg.kinh}">📖 ${esc(kinhName(sg.kinh))}</button>`);
    return a.length ? `<div class="lc-acts">${a.join('')}</div>` : '';
  }
  function todayCard() {
    const x = T, L = x.L, sg = suggestion(x), next = upcoming(addDays(today, x.special ? 1 : 0), 1)[0];
    const days = next ? Math.round((next.date - today) / 864e5) : 0;
    return `<div class="lc-today">
      <div class="lc-today-top"><span class="lc-kicker">HÔM NAY · ${esc(THU[today.getDay()].toUpperCase())}</span><span class="lc-solar">${fmtSolar(today)}</span></div>
      <div class="lc-big"><b>${L.d}</b><span>tháng ${MONTH_NAME[L.m]}${L.leap ? ' nhuận' : ''}<small>năm ${canChiYear(L.y)}</small></span></div>
      <ul class="lc-meta"><li><span>Ngày</span>${canChiDay(x.L.jd)}</li><li><span>Phật lịch</span>${phatLich(today, L)}</li><li><span>Tháng âm</span>${L.len === 30 ? 'Đủ (30 ngày)' : 'Thiếu (29 ngày)'}</li></ul>
      ${x.special ? `<div class="lc-feast"><strong>✦ ${esc(labelOf(x))}</strong><p>${esc(sg ? sg.note : '')}</p>${actions(sg)}</div>`
        : `<div class="lc-next"><span>Sắp tới</span><strong>${esc(labelOf(next))}</strong><em>${days === 1 ? 'Ngày mai' : 'Còn ' + days + ' ngày'} · ${next.L.d}/${next.L.m} âm · ${fmtSolar(next.date)}</em></div>`}
      ${x.ancu ? '<p class="lc-ancu">☸ Đang trong mùa An cư kiết hạ (16/4 – 15/7 âm lịch).</p>' : ''}
    </div>`;
  }
  let view = new Date(today.getFullYear(), today.getMonth(), 1), picked = today;
  function monthGrid() {
    const first = view, startDow = (first.getDay() + 6) % 7, daysIn = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < startDow; i++) cells.push('<span class="lc-cell lc-empty"></span>');
    for (let d = 1; d <= daysIn; d++) {
      const date = new Date(first.getFullYear(), first.getMonth(), d), x = info(date);
      const cls = ['lc-cell', x.feasts.length ? 'is-feast' : '', x.feasts.some(f => f.big) ? 'is-big' : '', x.vong ? 'is-vong' : '', x.soc ? 'is-soc' : '', x.ancu ? 'is-ancu' : '', sameDay(date, today) ? 'is-today' : '', sameDay(date, picked) ? 'is-picked' : '', date.getDay() === 0 ? 'is-sun' : ''].filter(Boolean).join(' ');
      const lun = x.L.d === 1 ? `${x.L.d}/${x.L.m}${x.L.leap ? 'N' : ''}` : x.L.d;
      cells.push(`<button type="button" class="${cls}" data-d="${d}" aria-label="${d} tháng ${first.getMonth() + 1}, âm lịch ${x.L.d}/${x.L.m}${x.special ? ' — ' + esc(labelOf(x)) : ''}"><b>${d}</b><small>${lun}</small>${x.special ? '<i aria-hidden="true"></i>' : ''}</button>`);
    }
    const Lf = solar2lunar(1, first.getMonth() + 1, first.getFullYear());
    return `<div class="lc-cal">
      <div class="lc-cal-head"><button type="button" class="lc-nav" data-nav="-1" aria-label="Tháng trước">‹</button><div><strong>Tháng ${first.getMonth() + 1}/${first.getFullYear()}</strong><small>Năm ${canChiYear(Lf.y)}</small></div><button type="button" class="lc-nav" data-nav="1" aria-label="Tháng sau">›</button></div>
      <div class="lc-dow">${['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(s => `<span>${s}</span>`).join('')}</div>
      <div class="lc-grid">${cells.join('')}</div>
      <div class="lc-legend"><span><i class="lg-v"></i>Rằm</span><span><i class="lg-s"></i>Mùng Một</span><span><i class="lg-f"></i>Ngày vía, lễ</span><span><i class="lg-a"></i>An cư</span></div>
      <div class="lc-pick" aria-live="polite">${pickDetail()}</div>
    </div>`;
  }
  function pickDetail() {
    const x = info(picked), sg = suggestion(x);
    return `<div class="lc-pick-d"><b>${picked.getDate()}/${picked.getMonth() + 1}</b><span>${THU[picked.getDay()]} · ${lunarDayName(x.L.d)} tháng ${MONTH_NAME[x.L.m]}${x.L.leap ? ' nhuận' : ''} · ${canChiDay(x.L.jd)}</span></div>
      ${x.special ? `<strong class="lc-pick-t">✦ ${esc(labelOf(x))}</strong><p>${esc(sg ? sg.note : '')}</p>${actions(sg)}` : '<p class="lc-pick-n">Một ngày bình thường — hãy dành vài phút cho hơi thở và lời kinh.</p>'}`;
  }
  function list() {
    const xs = upcoming(addDays(today, 1), 8).filter(x => x.feasts.length || x.vong || x.soc);
    return `<div class="lc-list"><h3>Ngày lễ sắp tới</h3><ol>${xs.map(x => {
      const days = Math.round((x.date - today) / 864e5);
      return `<li class="${x.feasts.some(f => f.big) ? 'big' : ''}"><span class="lc-li-date"><b>${x.date.getDate()}</b>${'Th' + (x.date.getMonth() + 1)}</span><span class="lc-li-copy"><strong>${esc(labelOf(x))}</strong><small>${x.L.d}/${x.L.m} âm lịch · ${days === 1 ? 'ngày mai' : 'còn ' + days + ' ngày'}</small></span></li>`;
    }).join('')}</ol></div>`;
  }
  function render() { root.innerHTML = `<div class="lc-col">${todayCard()}${list()}</div>${monthGrid()}`; }
  render();

  root.addEventListener('click', e => {
    const nav = e.target.closest('[data-nav]');
    if (nav) { view = new Date(view.getFullYear(), view.getMonth() + Number(nav.dataset.nav), 1); render(); root.querySelector(`[data-nav="${nav.dataset.nav}"]`).focus(); return; }
    const c = e.target.closest('.lc-cell[data-d]');
    if (c) { picked = new Date(view.getFullYear(), view.getMonth(), Number(c.dataset.d)); root.querySelectorAll('.lc-cell').forEach(n => n.classList.toggle('is-picked', n === c)); root.querySelector('.lc-pick').innerHTML = pickDetail(); return; }
    const tk = e.target.closest('[data-lc-tk]'); if (tk && window.GioThoiKhoaPlayer) { window.GioThoiKhoaPlayer.start(tk.dataset.lcTk); return; }
    const kn = e.target.closest('[data-lc-kinh]'); if (kn && window.GioReader) window.GioReader.open(kn.dataset.lcKinh, 0);
  });
})();
