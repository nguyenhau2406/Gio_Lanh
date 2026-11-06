/* Gió Lành 7.15 — Thư viện nghe kinh: giọng đọc thật (MP3), thanh tua, tốc độ, lời đọc chạy theo câu.
   Dữ liệu: js/listen-data-v7-15.js (tự sinh bởi tools/build_listen_audio.py). */
(function(){'use strict';
 const DATA=window.GioListenData||[];
 const list=document.getElementById('listenList');
 if(!list||!DATA.length)return;
 const $=(s,r=document)=>r.querySelector(s);
 const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
 const fmt=t=>{t=Math.max(0,Math.floor(t||0));return Math.floor(t/60)+':'+String(t%60).padStart(2,'0')};
 const byId=new Map(DATA.map(d=>[d.id,d]));
 const SPEEDS=[0.85,1,1.15,1.3];
 const store={get(k,d){try{const v=localStorage.getItem(k);return v==null?d:v}catch(e){return d}},set(k,v){try{localStorage.setItem(k,v)}catch(e){}}};

 const audio=new Audio();audio.preload='none';
 let cur=null,speedIdx=Math.max(0,SPEEDS.indexOf(Number(store.get('gl_listen_speed','1')))),sentEls=[],activeSent=-1,seeking=false;
 audio.playbackRate=SPEEDS[speedIdx];

 /* ---------- Giao diện ---------- */
 const total=DATA.reduce((a,d)=>a+d.duration,0);
 const meta=$('#glListenMeta');if(meta)meta.textContent=`${String(DATA.length).padStart(2,'0')} bài · khoảng ${Math.round(total/60)} phút · Giọng đọc tiếng Việt`;

 list.innerHTML=DATA.map((d,i)=>`<button type="button" class="listen-item" data-listen="${d.id}" aria-label="Nghe ${esc(d.title)}, ${fmt(d.duration)} phút">
   <span class="listen-thumb"><img src="${d.image}" alt="" loading="lazy"><span class="listen-eq" aria-hidden="true"><i></i><i></i><i></i></span></span>
   <span class="listen-item-copy"><strong>${esc(d.title)}</strong><small class="listen-pali">${esc(d.pali)}</small><small class="listen-meta">${esc(d.tag)} · Bài ${String(i+1).padStart(2,'0')} · ${fmt(d.duration)}</small></span>
   <span class="listen-item-play" aria-hidden="true">▶</span><span class="listen-item-bar" aria-hidden="true"><i></i></span></button>`).join('');

 const now=$('#glNow');
 now.innerHTML=`<div class="gl-now-head"><img class="gl-now-art" alt=""><div class="gl-now-titles"><small class="gl-now-kicker">ĐANG NGHE</small><strong class="gl-now-title"></strong><span class="gl-now-sub"></span></div><a class="gl-now-src" target="_blank" rel="noopener noreferrer" title="Đối chiếu kinh gốc">Kinh gốc ↗</a></div>
  <p class="gl-now-summary"></p>
  <div class="gl-seek"><span class="gl-time gl-time-cur">0:00</span><input type="range" class="gl-seek-range" min="0" max="100" step="0.1" value="0" aria-label="Tua bài nghe"><span class="gl-time gl-time-total">0:00</span></div>
  <div class="gl-ctrls">
   <button type="button" class="gl-btn gl-prev" aria-label="Bài trước" title="Bài trước"><svg viewBox="0 0 24 24"><path d="M6 5v14M19 5 9 12l10 7z"/></svg></button>
   <button type="button" class="gl-btn gl-back" aria-label="Lùi 10 giây" title="Lùi 10 giây"><svg viewBox="0 0 24 24"><path d="M4 12a8 8 0 1 0 2.3-5.6M4 4v4h4"/></svg><b>10</b></button>
   <button type="button" class="gl-btn gl-main" aria-label="Phát"><svg class="i-play" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg><svg class="i-pause" viewBox="0 0 24 24"><path d="M8 5h3v14H8zM13 5h3v14h-3z"/></svg></button>
   <button type="button" class="gl-btn gl-fwd" aria-label="Tới 10 giây" title="Tới 10 giây"><svg viewBox="0 0 24 24"><path d="M20 12a8 8 0 1 1-2.3-5.6M20 4v4h-4"/></svg><b>10</b></button>
   <button type="button" class="gl-btn gl-next" aria-label="Bài tiếp theo" title="Bài tiếp theo"><svg viewBox="0 0 24 24"><path d="M18 5v14M5 5l10 7-10 7z"/></svg></button>
  </div>
  <div class="gl-tools"><button type="button" class="gl-chip gl-speed" aria-label="Đổi tốc độ đọc">1×</button><button type="button" class="gl-chip gl-lyric-toggle" aria-expanded="true">Lời đọc ▾</button><button type="button" class="gl-chip gl-auto" aria-pressed="true">Tự chuyển bài</button></div>
  <div class="gl-lyrics" tabindex="0" aria-label="Lời đọc, câu đang đọc được tô sáng"></div>`;
 const el={art:$('.gl-now-art',now),title:$('.gl-now-title',now),sub:$('.gl-now-sub',now),src:$('.gl-now-src',now),sum:$('.gl-now-summary',now),cur:$('.gl-time-cur',now),tot:$('.gl-time-total',now),range:$('.gl-seek-range',now),main:$('.gl-main',now),speed:$('.gl-speed',now),lyr:$('.gl-lyrics',now),lyrT:$('.gl-lyric-toggle',now),auto:$('.gl-auto',now)};
 let autoNext=store.get('gl_listen_auto','1')==='1';
 const renderAuto=()=>{el.auto.setAttribute('aria-pressed',String(autoNext));el.auto.classList.toggle('on',autoNext)};renderAuto();
 const renderSpeed=()=>{el.speed.textContent=String(SPEEDS[speedIdx]).replace('.',',')+'×'};renderSpeed();
 if(store.get('gl_listen_lyrics','1')==='0'){el.lyr.hidden=true;el.lyrT.setAttribute('aria-expanded','false');el.lyrT.textContent='Lời đọc ▸'}

 function buildLyrics(d){
  sentEls=[];activeSent=-1;
  el.lyr.innerHTML=d.chapters.map(c=>`<section><h4>${esc(c.title)}</h4>${c.paras.map(p=>`<p>${p.map(([t,s])=>`<span data-t="${t}">${esc(s)}</span>`).join(' ')}</p>`).join('')}</section>`).join('');
  sentEls=[...el.lyr.querySelectorAll('[data-t]')].map(n=>({n,t:Number(n.dataset.t)}));
 }
 function select(d){
  cur=d;now.hidden=false;
  el.art.src=d.image;el.title.textContent=d.title;el.sub.textContent=d.pali;el.src.href=d.source;el.sum.textContent=d.summary;
  el.tot.textContent=fmt(d.duration);el.range.max=d.duration;el.range.value=0;el.cur.textContent='0:00';
  buildLyrics(d);el.lyr.scrollTop=0;
  audio.src=d.audio;audio.playbackRate=SPEEDS[speedIdx];
  const saved=Number(store.get('gl_listen_pos_'+d.id,'0'));
  if(saved>5&&saved<d.duration-8){audio.addEventListener('loadedmetadata',()=>{audio.currentTime=saved},{once:true})}
  render();
 }

 /* ---------- Phối hợp với trình phát nổi, nhạc nền và các âm thanh khác ---------- */
 const fp={box:$('#floatingPlayer'),title:$('#floatingTitle'),status:$('#floatingStatus'),toggle:$('#floatingToggle'),vol:$('#floatingVolume')};
 let owning=false;
 function claim(){
  if(!owning){window.GioLanhMedia&&window.GioLanhMedia.stopAll&&window.GioLanhMedia.stopAll();owning=true}
  window.GioBgm&&window.GioBgm.hold&&window.GioBgm.hold();
 }
 function release(){window.GioBgm&&window.GioBgm.release&&window.GioBgm.release()}
 function renderFloating(){
  if(!owning||!fp.box||!cur)return;
  fp.box.hidden=false;fp.title.textContent=cur.title;
  fp.status.textContent=audio.paused?`Tạm dừng · ${fmt(audio.currentTime)} / ${fmt(cur.duration)}`:`Đang nghe · ${fmt(audio.currentTime)} / ${fmt(cur.duration)}`;
  fp.toggle.textContent=audio.paused?'▶':'Ⅱ';fp.toggle.setAttribute('aria-label',audio.paused?'Tiếp tục phát':'Tạm dừng');
 }
 function render(){
  const playing=!audio.paused&&!!cur;
  now.classList.toggle('is-playing',playing);
  el.main.setAttribute('aria-label',playing?'Tạm dừng':'Phát');
  list.querySelectorAll('[data-listen]').forEach(b=>{const on=cur&&b.dataset.listen===cur.id;b.classList.toggle('selected',!!on);b.classList.toggle('is-playing',!!on&&playing);b.querySelector('.listen-item-play').textContent=on&&playing?'Ⅱ':'▶';b.setAttribute('aria-pressed',String(!!on))});
  renderFloating();
 }
 function play(d){
  if(d&&d!==cur)select(d);
  if(!cur)return;
  if(window.GioAmbient&&window.GioAmbient.pause)try{window.GioAmbient.pause()}catch(e){}
  claim();if(fp.vol)audio.volume=Math.max(.05,Number(fp.vol.value)/100);
  audio.play().catch(()=>{fp.status&&(fp.status.textContent='Chưa phát được — hãy bấm lại')});
 }
 function pause(){audio.pause()}
 function toggle(d){if(d&&d!==cur){play(d);return}audio.paused?play():pause()}
 function stop(){if(cur)store.set('gl_listen_pos_'+cur.id,String(audio.currentTime||0));audio.pause();owning=false;release();render()}

 /* ---------- Sự kiện ---------- */
 list.addEventListener('click',e=>{const b=e.target.closest('[data-listen]');if(!b)return;toggle(byId.get(b.dataset.listen));if(window.matchMedia('(max-width:960px)').matches)now.scrollIntoView({behavior:'smooth',block:'nearest'})});
 el.main.addEventListener('click',()=>toggle());
 const step=s=>{if(!cur)return;audio.currentTime=Math.max(0,Math.min(cur.duration-0.2,(audio.currentTime||0)+s))};
 $('.gl-back',now).addEventListener('click',()=>step(-10));
 $('.gl-fwd',now).addEventListener('click',()=>step(10));
 const idx=()=>DATA.indexOf(cur);
 $('.gl-prev',now).addEventListener('click',()=>{if(audio.currentTime>4){audio.currentTime=0;return}play(DATA[(idx()-1+DATA.length)%DATA.length])});
 $('.gl-next',now).addEventListener('click',()=>play(DATA[(idx()+1)%DATA.length]));
 el.speed.addEventListener('click',()=>{speedIdx=(speedIdx+1)%SPEEDS.length;audio.playbackRate=SPEEDS[speedIdx];store.set('gl_listen_speed',String(SPEEDS[speedIdx]));renderSpeed()});
 el.lyrT.addEventListener('click',()=>{const open=el.lyr.hidden;el.lyr.hidden=!open;el.lyrT.setAttribute('aria-expanded',String(open));el.lyrT.textContent=open?'Lời đọc ▾':'Lời đọc ▸';store.set('gl_listen_lyrics',open?'1':'0')});
 el.auto.addEventListener('click',()=>{autoNext=!autoNext;store.set('gl_listen_auto',autoNext?'1':'0');renderAuto()});
 el.lyr.addEventListener('click',e=>{const s=e.target.closest('[data-t]');if(!s)return;audio.currentTime=Number(s.dataset.t);if(audio.paused)play()});
 el.range.addEventListener('input',()=>{seeking=true;el.cur.textContent=fmt(el.range.value)});
 el.range.addEventListener('change',()=>{audio.currentTime=Number(el.range.value);seeking=false});

 let lastSave=0;
 audio.addEventListener('timeupdate',()=>{
  if(!cur)return;const t=audio.currentTime;
  if(!seeking){el.range.value=t;el.cur.textContent=fmt(t)}
  el.range.style.setProperty('--p',(t/cur.duration*100).toFixed(2)+'%');
  const bar=list.querySelector(`[data-listen="${cur.id}"] .listen-item-bar i`);if(bar)bar.style.width=(t/cur.duration*100).toFixed(2)+'%';
  let i=activeSent;
  if(i<0||sentEls[i].t>t)i=-1;
  while(i+1<sentEls.length&&sentEls[i+1].t<=t+0.05)i++;
  if(i!==activeSent){
   if(activeSent>=0)sentEls[activeSent].n.classList.remove('on');
   activeSent=i;
   if(i>=0){const n=sentEls[i].n;n.classList.add('on');
    if(!el.lyr.hidden){const top=n.offsetTop-el.lyr.offsetTop-el.lyr.clientHeight*.35;el.lyr.scrollTo({top,behavior:'smooth'})}}
  }
  if(Date.now()-lastSave>4000){lastSave=Date.now();store.set('gl_listen_pos_'+cur.id,String(t))}
  renderFloating();
 });
 audio.addEventListener('play',render);
 audio.addEventListener('pause',()=>{if(cur)store.set('gl_listen_pos_'+cur.id,String(audio.currentTime));render()});
 audio.addEventListener('ended',()=>{store.set('gl_listen_pos_'+cur.id,'0');const i=idx();if(autoNext&&i<DATA.length-1){play(DATA[i+1])}else{owning&&fp.status&&(fp.status.textContent='Đã nghe xong');release();render()}});
 audio.addEventListener('error',()=>{if(fp.status&&owning)fp.status.textContent='Không tải được file âm thanh';render()});

 /* Trình phát nổi dùng chung */
 fp.toggle&&fp.toggle.addEventListener('click',e=>{if(owning){e.stopImmediatePropagation();toggle()}},true);
 ['#floatingStop','#floatingClose'].forEach(s=>{const b=$(s);b&&b.addEventListener('click',()=>{if(owning){stop();fp.box.hidden=true}},true)});
 fp.vol&&fp.vol.addEventListener('input',()=>{audio.volume=Math.max(.05,Number(fp.vol.value)/100)});
 /* Khi người dùng mở âm thanh khác (nhạc thiền, đọc lời nguyện, nghe trong trình đọc) thì nhường. */
 document.addEventListener('click',e=>{if(owning&&e.target.closest('[data-sound],#chantPlay,#listenButton,[data-ga]'))stop()},true);

 /* Điều khiển trên màn hình khóa điện thoại */
 if('mediaSession' in navigator){
  const ms=navigator.mediaSession;
  audio.addEventListener('play',()=>{try{ms.metadata=new MediaMetadata({title:cur.title,artist:'Gió Lành · Diễn ý kinh',album:cur.pali,artwork:[{src:new URL(cur.image,location.href).href,sizes:'512x512'}]})}catch(e){}});
  try{ms.setActionHandler('play',()=>play());ms.setActionHandler('pause',pause);ms.setActionHandler('previoustrack',()=>$('.gl-prev',now).click());ms.setActionHandler('nexttrack',()=>$('.gl-next',now).click());ms.setActionHandler('seekbackward',()=>step(-10));ms.setActionHandler('seekforward',()=>step(10))}catch(e){}
 }
 document.addEventListener('keydown',e=>{if(!owning||e.target.closest('input,textarea,select,[contenteditable]'))return;if(e.code==='Space'&&e.target.closest('#nghe-kinh')){e.preventDefault();toggle()}});

 select(DATA[0]);
 window.GioListen={has:id=>byId.has(id),play:id=>play(byId.get(id)),pause,stop};
})();
