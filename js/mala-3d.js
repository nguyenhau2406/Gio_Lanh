/* Gió Lành — Bộ vẽ tràng hạt 3D (canvas 2D, phối cảnh nghiêng).
   - Vòng hạt nhìn chéo thành elip; hạt trước to/sáng, hạt sau nhỏ/tối, xếp vẽ theo chiều sâu.
   - Mỗi hạt là ảnh vẽ sẵn: vân chất liệu + ánh phản chiếu + viền tối; có bóng đổ xuống mặt nền.
   - Lần hạt: cả chuỗi trượt một nấc như kéo qua ngón tay; hạt chủ và tua đi theo chuỗi, tua đung đưa.
   Dùng: const m = new GioMala3D(canvas, {onLayout}); m.set({n, count, mat}, animate); */
(function () {
  'use strict';
  const TAU = Math.PI * 2;
  const MATS = {
    go:   { name: 'Gỗ đàn hương', base: ['#f1c98c', '#a8692f', '#4a250c'], grain: 'rgba(70,32,8,.38)', cord: '#7d1f17', tassel: ['#c0392b', '#7d1f17'], spec: .85, kind: 'wood' },
    bode: { name: 'Hạt bồ đề',    base: ['#fbf3dc', '#dcc79a', '#8a7246'], grain: 'rgba(110,85,40,.55)', cord: '#8a5a1f', tassel: ['#d4a24a', '#8a5a1f'], spec: .7, kind: 'seed' },
    ngoc: { name: 'Ngọc bích',    base: ['#bfe8c9', '#3f8f5c', '#0f3d22'], grain: 'rgba(235,255,240,.22)', cord: '#1f4a2c', tassel: ['#3d8a57', '#16402a'], spec: 1, kind: 'jade' },
    hong: { name: 'Thạch anh hồng', base: ['#ffe9ee', '#e7a2b2', '#9a4d62'], grain: 'rgba(255,255,255,.35)', cord: '#9a4d62', tassel: ['#e58aa0', '#9a4d62'], spec: 1, kind: 'quartz' },
  };
  const rnd = s => () => (s = (s * 16807) % 2147483647) / 2147483647;     // ngẫu nhiên có hạt giống → vẽ ổn định

  function makeSprites(mat, S = 128, variants = 6) {
    const m = MATS[mat], out = [];
    for (let v = 0; v < variants; v++) {
      const c = document.createElement('canvas'); c.width = c.height = S;
      const g = c.getContext('2d'), r = S / 2, R = rnd(97 + v * 131 + mat.length * 7);
      g.save(); g.beginPath(); g.arc(r, r, r - .5, 0, TAU); g.clip();
      // nền: ánh sáng từ trên-trái
      let gr = g.createRadialGradient(r * .62, r * .52, r * .05, r, r, r * 1.05);
      gr.addColorStop(0, m.base[0]); gr.addColorStop(.55, m.base[1]); gr.addColorStop(1, m.base[2]);
      g.fillStyle = gr; g.fillRect(0, 0, S, S);
      // vân chất liệu
      g.globalCompositeOperation = m.kind === 'jade' || m.kind === 'quartz' ? 'screen' : 'multiply';
      if (m.kind === 'wood') {
        // vân gỗ: các dải sóng mềm, cong theo khối cầu
        const ph = R() * TAU, tiltA = (R() - .5) * .5;
        g.translate(r, r); g.rotate(tiltA); g.translate(-r, -r);
        for (let k = 0; k < 22; k++) {
          const y0 = (k / 22) * S * 1.1 - S * .05, amp = 2 + R() * 3.5, fr = 3 + R() * 2.5, w = .6 + R() * 1.6;
          g.strokeStyle = m.grain; g.globalAlpha = .35 + R() * .45; g.lineWidth = w; g.beginPath();
          for (let x = -6; x <= S + 6; x += 2) { const bend = Math.pow((x - r) / r, 2) * (y0 - r) * .18; g.lineTo(x, y0 + Math.sin(x / S * fr + ph + k * .9) * amp + bend); }
          g.stroke();
        }
        g.globalAlpha = 1; g.setTransform(1, 0, 0, 1, 0, 0);
      } else if (m.kind === 'seed') {
        // hạt bồ đề: nhiều lỗ nhỏ lõm xuống
        for (let k = 0; k < 90; k++) {
          const a = R() * TAU, d = Math.sqrt(R()) * r * .95, x = r + Math.cos(a) * d, y = r + Math.sin(a) * d, s = 1.4 + R() * 2.6;
          g.fillStyle = m.grain; g.beginPath(); g.ellipse(x, y, s, s * .8, a, 0, TAU); g.fill();
        }
        g.globalCompositeOperation = 'source-over'; g.strokeStyle = 'rgba(120,90,40,.35)'; g.lineWidth = 2;
        g.beginPath(); g.ellipse(r, r * .3, r * .5, r * .16, 0, 0, TAU); g.stroke();
      } else {
        // ngọc, thạch anh: mây sáng bên trong + ánh xuyên sáng phía dưới-phải
        for (let k = 0; k < 7; k++) {
          const x = R() * S, y = R() * S, w = r * (.3 + R() * .6);
          const cg = g.createRadialGradient(x, y, 0, x, y, w); cg.addColorStop(0, m.grain); cg.addColorStop(1, 'rgba(255,255,255,0)');
          g.fillStyle = cg; g.beginPath(); g.ellipse(x, y, w, w * (.35 + R() * .5), R() * TAU, 0, TAU); g.fill();
        }
        const sg = g.createRadialGradient(r * 1.35, r * 1.4, 0, r * 1.35, r * 1.4, r * .9);
        sg.addColorStop(0, 'rgba(255,255,255,.35)'); sg.addColorStop(1, 'rgba(255,255,255,0)');
        g.fillStyle = sg; g.fillRect(0, 0, S, S);
      }
      g.globalCompositeOperation = 'source-over';
      // viền tối (che khuất xung quanh)
      gr = g.createRadialGradient(r * .9, r * .85, r * .55, r, r, r);
      gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,.42)');
      g.fillStyle = gr; g.fillRect(0, 0, S, S);
      // ánh viền phản sáng phía dưới-phải
      const rim = g.createRadialGradient(r * 1.3, r * 1.35, r * .2, r * 1.3, r * 1.35, r * .75);
      rim.addColorStop(0, 'rgba(255,236,205,.16)'); rim.addColorStop(1, 'rgba(255,236,205,0)');
      g.fillStyle = rim; g.fillRect(0, 0, S, S);
      // điểm phản chiếu chính
      g.filter = `blur(${S * .025}px)`;
      g.fillStyle = `rgba(255,255,255,${.75 * m.spec})`; g.beginPath(); g.ellipse(r * .64, r * .52, r * .2, r * .12, -.6, 0, TAU); g.fill();
      g.filter = 'none';
      g.fillStyle = `rgba(255,255,255,${.95 * m.spec})`; g.beginPath(); g.ellipse(r * .6, r * .5, r * .07, r * .045, -.6, 0, TAU); g.fill();
      g.restore();
      out.push(c);
    }
    return out;
  }
  const cache = {};
  const sprites = mat => cache[mat] || (cache[mat] = makeSprites(mat));

  class GioMala3D {
    constructor(canvas, opts = {}) {
      this.cv = canvas; this.g = canvas.getContext('2d'); this.opts = opts;
      this.n = 108; this.pos = 0; this.mat = 'go'; this.anim = null; this.sway = { t0: 0, amp: 0 };
      this.reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
      this.ro = new ResizeObserver(() => this.layout()); this.ro.observe(canvas);
      this.layout();
    }
    layout() {
      const w = this.cv.clientWidth, h = this.cv.clientHeight; if (!w || !h) return;
      const dpr = Math.min(2.5, window.devicePixelRatio || 1);
      this.cv.width = Math.round(w * dpr); this.cv.height = Math.round(h * dpr); this.dpr = dpr;
      this.W = w; this.H = h; this.tilt = .56;
      this.R = Math.min(w * .47, (h * .93) / (2 * this.tilt + .75));   // chừa chỗ cho tua rủ phía dưới
      this.cx = w / 2; this.cy = this.R * this.tilt + h * .07;
      // bán kính hạt: xếp khít quanh vòng (vòng có n hạt + chỗ của hạt chủ)
      this.gSlots = 1.7; this.br = Math.min(this.R * .15, (Math.PI * this.R / (this.n + this.gSlots)) * .98);
      this.gr = Math.min(this.R * .12, Math.max(this.br * 1.6, 7));
      this.gSlots = 1 + this.gr / this.br; this.T = this.n + this.gSlots;
      if (this.opts.onLayout) this.opts.onLayout({ cx: this.cx, cy: this.cy, rx: this.R - this.br * 1.6, ry: this.R * this.tilt - this.br * 1.4 });
      this.draw();
    }
    set({ n, count, mat }, animate = true) {
      const changedN = n && n !== this.n; if (n) this.n = n;
      if (mat && mat !== this.mat) this.mat = mat;
      if (changedN) { this.pos = count; this.anim = null; this.layout(); return; }
      let d = ((count - this.pos) % this.n + this.n) % this.n; if (d > this.n / 2) d -= this.n;
      if (!animate || this.reduced || Math.abs(d) < 1e-6) { this.pos = count; this.anim = null; this.draw(); return; }
      const from = this.pos, dur = Math.min(1100, 260 + Math.abs(d) * 10);
      this.anim = { from, to: from + d, t0: performance.now(), dur };
      this.sway = { t0: performance.now(), amp: Math.sign(d) * Math.min(.3, .12 + Math.abs(d) * .01) };
      this.loop();
    }
    loop() {
      if (this.raf) return;
      const tick = () => {
        this.raf = 0; const now = performance.now(); let busy = false;
        if (this.anim) {
          const a = this.anim, k = Math.min(1, (now - a.t0) / a.dur), e = 1 - Math.pow(1 - k, 3);
          this.pos = a.from + (a.to - a.from) * e;
          if (k >= 1) { this.pos = ((a.to % this.n) + this.n) % this.n; this.anim = null; } else busy = true;
        }
        if (now - this.sway.t0 < 2600) busy = true;
        this.draw();
        if (busy) this.raf = requestAnimationFrame(tick);
      };
      this.raf = requestAnimationFrame(tick);
    }
    // Vòng gồm n hạt + một khoảng cho hạt chủ. u = vị trí dọc theo dây (đơn vị: một hạt).
    // Khi lần qua hạt cuối, chuỗi trượt qua cả hạt chủ rồi mới về hạt đầu — như tràng hạt thật.
    frontU() {
      const n = this.n, off = this.gSlots / 2 + .5, p = ((this.pos % n) + n) % n;
      return p <= n - 1 ? p + off : (n - 1 + off) + (p - (n - 1)) * (this.gSlots + 1);
    }
    at(u) {
      const th = TAU * (u - this._front) / this.T + Math.PI / 2, z = Math.sin(th);   // z: 1 = sát người xem, -1 = xa nhất
      return { x: this.cx + this.R * Math.cos(th), y: this.cy + this.R * this.tilt * z, z, th };
    }
    point(i) { return this.at(i + this.gSlots / 2 + .5); }
    draw() {
      const g = this.g, n = this.n, m = MATS[this.mat], sp = sprites(this.mat), br = this.br;
      if (!this.W) return;
      g.setTransform(this.dpr, 0, 0, this.dpr, 0, 0); g.clearRect(0, 0, this.W, this.H);
      // bóng đổ của cả chuỗi xuống mặt nền
      g.save(); g.filter = `blur(${Math.max(3, br * .9)}px)`; g.strokeStyle = 'rgba(70,45,20,.22)'; g.lineWidth = br * 2;
      g.beginPath(); g.ellipse(this.cx + br * .4, this.cy + br * 2.2, this.R, this.R * this.tilt, 0, 0, TAU); g.stroke(); g.restore();
      this._front = this.frontU();
      // ánh vàng nơi "ngón tay" (phía trước, sát người xem)
      const f = this.at(this._front), fg = g.createRadialGradient(f.x, f.y, 0, f.x, f.y, br * 5);
      fg.addColorStop(0, 'rgba(255,214,130,.45)'); fg.addColorStop(1, 'rgba(255,214,130,0)'); g.fillStyle = fg; g.fillRect(f.x - br * 5, f.y - br * 5, br * 10, br * 10);

      const items = [], cord = (a, b) => items.push({ z: Math.min(a.z, b.z) - .02, kind: 'cord', a, b });   // dây luôn nằm dưới hai hạt nó nối
      const pts = []; for (let i = 0; i < n; i++) pts.push(this.point(i));
      pts.forEach((p, i) => { items.push({ z: p.z, kind: 'bead', p, v: (i * 7) % sp.length }); if (i < n - 1) cord(p, pts[i + 1]); });
      const gp = this.at(0), gs = 1 + .2 * gp.z, gr = this.gr * gs;
      const guru = { x: gp.x, y: gp.y };
      items.push({ z: gp.z + .001, kind: 'guru', p: gp, guru, gr });
      cord(pts[n - 1], gp); cord(gp, pts[0]);
      items.sort((a, b) => a.z - b.z);

      g.lineCap = 'round';
      for (const it of items) {
        if (it.kind === 'cord') {
          const s = 1 + .2 * it.z; g.strokeStyle = m.cord; g.globalAlpha = .55 + .45 * (it.z + 1) / 2; g.lineWidth = Math.max(1, br * .28 * s);
          g.beginPath(); g.moveTo(it.a.x, it.a.y); g.lineTo(it.b.x, it.b.y); g.stroke(); g.globalAlpha = 1;
        } else if (it.kind === 'bead') {
          this.bead(it.p.x, it.p.y, br * (1 + .2 * it.p.z), sp[it.v], it.p.z);
        } else this.drawGuru(it, m, sp);
      }
    }
    bead(x, y, r, img, z) {
      const g = this.g;
      g.fillStyle = 'rgba(40,25,10,.28)'; g.beginPath(); g.ellipse(x + r * .25, y + r * .55, r * .95, r * .6, 0, 0, TAU); g.fill();   // bóng tiếp xúc
      g.drawImage(img, x - r, y - r, r * 2, r * 2);
      const dark = (1 - z) / 2 * .38;                                                                                        // xa thì tối đi
      if (dark > .01) { g.fillStyle = `rgba(20,12,4,${dark})`; g.beginPath(); g.arc(x, y, r * .99, 0, TAU); g.fill(); }
    }
    drawGuru(it, m, sp) {
      const g = this.g, { guru, gr, p } = it, z = p.z;
      // tua: rủ xuống theo trọng lực, đung đưa sau mỗi lần lần hạt
      const dt = (performance.now() - this.sway.t0) / 1000, sw = this.reduced ? 0 : this.sway.amp * Math.exp(-dt * 1.6) * Math.sin(dt * 7);
      const L = Math.max(30, this.R * .34) * (1 + .2 * z), top = { x: guru.x, y: guru.y + gr * .85 };
      g.save(); g.translate(top.x, top.y); g.rotate(sw);
      g.fillStyle = '#c9a24e'; g.fillRect(-gr * .45, -gr * .15, gr * .9, gr * .45);                     // khoen vàng
      const R = rnd(7), strands = 26;
      for (let k = 0; k < strands; k++) {
        const t = k / (strands - 1) - .5, spread = gr * 1.25;
        const tg = g.createLinearGradient(0, 0, 0, L); tg.addColorStop(0, m.tassel[0]); tg.addColorStop(1, m.tassel[1]);
        g.strokeStyle = tg; g.lineWidth = Math.max(.8, gr * .1); g.globalAlpha = .75 + R() * .25;
        g.beginPath(); g.moveTo(t * gr * .5, gr * .3);
        g.quadraticCurveTo(t * spread * .8, L * .55, t * spread + Math.sin(dt * 5 + k) * sw * 6, L * (.92 + R() * .08)); g.stroke();
      }
      g.globalAlpha = 1; g.restore();
      // hạt chủ
      this.bead(guru.x, guru.y, gr, sp[0], Math.max(z, -.2));
    }
    destroy() { this.ro.disconnect(); cancelAnimationFrame(this.raf); }
  }
  GioMala3D.MATS = MATS;
  window.GioMala3D = GioMala3D;
})();
