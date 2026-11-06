/* Gió Lành 7 · Trình đọc kinh văn dạng chữ.
   - Sách Đạo Tràng Liên Hoa (đã chuyển từ PDF sang chữ) và kinh SuttaCentral: tải từ data/kinh/<id>.js, đọc được không cần mạng.
   - Ngũ Bộ Nikāya: danh mục có sẵn, nội dung từng bài tải trực tiếp từ SuttaCentral khi mở. */
(function(){'use strict';
const R=window.GioKinhRegistry;if(!R)return;
const books=window.GioKinhBooks=window.GioKinhBooks||{};
const API='https://suttacentral.net/api/suttas/';
const NIKAYA={dn:['Trường Bộ Kinh','Dīgha Nikāya · 34 bài kinh dài',34],mn:['Trung Bộ Kinh','Majjhima Nikāya · 152 bài kinh trung bình',152],sn:['Tương Ưng Bộ Kinh','Saṁyutta Nikāya · kinh xếp theo chủ đề',1805],an:['Tăng Chi Bộ Kinh','Aṅguttara Nikāya · kinh xếp theo pháp số',1395],kn:['Tiểu Bộ Kinh','Khuddaka Nikāya · Tiểu tụng, Kinh Tập, Phật tự thuyết, Trưởng lão kệ…',349]};
const $=(s,r=document)=>r.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fold=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/đ/g,'d').replace(/Đ/g,'D').toLowerCase();
const store={get(k,d){try{const v=localStorage.getItem(k);return v==null?d:JSON.parse(v)}catch(e){return d}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};

const prefs=Object.assign({font:20,lh:1.9,family:'serif',theme:'paper'},store.get('gk_prefs_v7',{}));
let pos=store.get('gk_pos_v7',{}); // {bookId:{c,y}}
let book=null,ch=0,loadSeq=0,priorFocus=null,speaking=false,saveTimer=null;

/* ---------- Khung giao diện ---------- */
const root=document.createElement('div');
root.id='gkReader';root.className='gk';root.hidden=true;
root.setAttribute('role','dialog');root.setAttribute('aria-modal','true');root.setAttribute('aria-labelledby','gkChapter');
root.innerHTML=`
<header class="gk-bar">
 <button type="button" class="gk-ic gk-toc-btn" data-gk="toc" aria-label="Mở mục lục" aria-controls="gkToc"><span aria-hidden="true">☰</span><em>Mục lục</em></button>
 <div class="gk-bar-title"><small id="gkBookName"></small><strong id="gkBarChapter"></strong></div>
 <div class="gk-bar-actions">
  <button type="button" class="gk-ic" data-gk="search" aria-label="Tìm trong kinh" title="Tìm trong kinh"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 5 5"/></svg></button>
  <button type="button" class="gk-ic" data-gk="listen" aria-label="Nghe đọc chương này" title="Nghe đọc bằng giọng máy" aria-pressed="false"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4Z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/></svg></button>
  <button type="button" class="gk-ic gk-music" data-ga="open" aria-label="Nhạc nền YouTube" title="Nhạc nền khi đọc kinh (dán link YouTube)"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/></svg></button>
  <button type="button" class="gk-ic gk-aa" data-gk="settings" aria-label="Tùy chỉnh hiển thị" aria-expanded="false" title="Cỡ chữ, phông, màu nền">Aa</button>
  <button type="button" class="gk-ic gk-close" data-gk="close" aria-label="Đóng sách">×</button>
 </div>
 <div class="gk-progress" aria-hidden="true"><i id="gkProgress"></i></div>
</header>
<div class="gk-pop" id="gkSettings" hidden role="group" aria-label="Tùy chỉnh hiển thị">
 <div class="gk-pop-row"><span>Cỡ chữ</span><div class="gk-seg"><button type="button" data-gk="font-" aria-label="Giảm cỡ chữ">A−</button><output id="gkFontVal">20</output><button type="button" data-gk="font+" aria-label="Tăng cỡ chữ">A+</button></div></div>
 <div class="gk-pop-row"><span>Giãn dòng</span><div class="gk-seg" data-group="lh"><button type="button" data-gk-lh="1.65">Gọn</button><button type="button" data-gk-lh="1.9">Vừa</button><button type="button" data-gk-lh="2.2">Thoáng</button></div></div>
 <div class="gk-pop-row"><span>Phông chữ</span><div class="gk-seg" data-group="family"><button type="button" data-gk-family="serif" class="gk-serif">Có chân</button><button type="button" data-gk-family="sans">Không chân</button></div></div>
 <div class="gk-pop-row"><span>Màu nền</span><div class="gk-swatches"><button type="button" data-gk-theme="light" aria-label="Nền sáng"><i></i>Sáng</button><button type="button" data-gk-theme="paper" aria-label="Nền giấy"><i></i>Giấy</button><button type="button" data-gk-theme="night" aria-label="Nền tối"><i></i>Đêm</button></div></div>
</div>
<div class="gk-pop gk-search" id="gkSearch" hidden>
 <label class="gk-search-box"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 5 5"/></svg><input id="gkSearchInput" type="search" placeholder="Tìm chữ trong toàn bộ kinh…" autocomplete="off" aria-label="Tìm trong kinh"></label>
 <p class="gk-search-note" id="gkSearchNote">Gõ ít nhất 2 ký tự, có thể gõ không dấu.</p>
 <ol class="gk-results" id="gkResults"></ol>
</div>
<div class="gk-body">
 <aside class="gk-toc" id="gkToc" aria-label="Mục lục">
  <div class="gk-book-card"><span class="gk-book-kicker">✿ KINH VĂN TIẾNG VIỆT</span><h2 id="gkBookTitle"></h2><p id="gkBookBy"></p><a id="gkBookSrc" href="#" target="_blank" rel="noopener noreferrer"></a></div>
  <label class="gk-toc-filter"><input id="gkTocFilter" type="search" placeholder="Lọc mục lục…" autocomplete="off" aria-label="Lọc mục lục"></label>
  <nav id="gkTocList" class="gk-toc-list"></nav>
 </aside>
 <div class="gk-scrim" data-gk="toc-close"></div>
 <main class="gk-main" id="gkScroll" tabindex="-1">
  <article class="gk-paper">
   <p class="gk-kicker" id="gkPart"></p>
   <h1 id="gkChapter"></h1>
   <p class="gk-range" id="gkRange"></p>
   <div class="gk-orn" aria-hidden="true"><span></span>❀<span></span></div>
   <div id="gkState" class="gk-state" role="status" hidden></div>
   <div id="gkText" class="gk-text"></div>
   <nav class="gk-pager" aria-label="Chuyển chương"><button type="button" data-gk="prev"><small>Trước</small><span id="gkPrevName"></span></button><span id="gkCounter"></span><button type="button" data-gk="next"><small>Tiếp theo</small><span id="gkNextName"></span></button></nav>
   <p class="gk-credit" id="gkCredit"></p>
  </article>
 </main>
</div>`;
document.body.appendChild(root);
const el=id=>root.querySelector('#'+id);
const scroller=el('gkScroll'),text=el('gkText'),state=el('gkState');

/* ---------- Tải dữ liệu ---------- */
function loadScript(src){return new Promise((res,rej)=>{const s=document.createElement('script');s.src=src;s.onload=()=>res();s.onerror=()=>rej(new Error('Không mở được tệp '+src));document.head.appendChild(s)})}
async function getBook(id){
 if(books[id])return books[id];
 if(id.startsWith('nikaya:'))return nikayaBook(id.slice(7));
 await loadScript('data/kinh/'+id+'.js');
 if(!books[id])throw new Error('Không tìm thấy dữ liệu kinh “'+id+'”.');
 return books[id];
}
async function nikayaBook(col){
 if(!window.GioKinhCatalog)await loadScript('data/kinh/nikaya-catalog.js');
 const cat=window.GioKinhCatalog[col];if(!cat)throw new Error('Không có danh mục '+col);
 let group='';const chapters=[];
 for(const n of cat.nodes){if(n[0]===0){group=n[2]||n[3];continue}chapters.push({t:n[2],r:n[3]&&n[3]!==n[2]?n[3]+' · '+n[1].toUpperCase():n[1].toUpperCase(),p:group,uid:n[1],author:n[4]})}
 const meta=NIKAYA[col];
 return books['nikaya:'+col]={id:'nikaya:'+col,title:cat.name,by:meta[1]+' · Việt dịch: HT Thích Minh Châu và chư vị',src:'https://suttacentral.net/'+col,srcName:'SuttaCentral',live:true,chapters};
}
function htmlToBlocks(html){
 const doc=new DOMParser().parseFromString(html,'text/html');
 doc.querySelectorAll('header,footer,a.ref,.ref,script,style').forEach(n=>n.remove());
 const out=[];
 doc.querySelectorAll('article p, article h2, article h3, article h4, article h5, article li, article dd').forEach(n=>{
  if(n.closest('li')&&n.tagName!=='LI')return;
  const parts=[];let cur='';
  n.childNodes.forEach(c=>{if(c.nodeName==='BR'){parts.push(cur);cur=''}else cur+=c.textContent});
  parts.push(cur);
  const lines=parts.map(s=>s.replace(/\s+/g,' ').trim()).filter(Boolean);
  if(!lines.length)return;
  if(/^H/.test(n.tagName))out.push(['h',lines.join(' ')]);
  else if(lines.length>1&&(n.closest('blockquote')||lines.join('').length/lines.length<60))out.push(['v',lines]);
  else lines.forEach(l=>out.push(['p',l]));
 });
 return out;
}
function segmentsToBlocks(seg){
 const out=[];let group=null,key=null;
 Object.keys(seg).forEach(k=>{
  const v=String(seg[k]||'').trim();if(!v)return;
  const ref=k.split(':')[1]||'';
  if(/^0\./.test(ref)){out.push(['h',v]);group=null;return}
  const g=ref.split('.')[0];
  if(group&&key===g)group[1].push(v);else{group=['v',[v]];key=g;out.push(group)}
 });
 return out.map(b=>b[0]==='v'&&b[1].length===1?['p',b[1][0]]:b);
}
async function loadLive(c){
 if(c.b)return c.b;
 const ck='gk_sc_'+c.uid+'_'+c.author;const cached=store.get(ck,null);
 if(cached){c.b=cached;return cached}
 const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),15000);
 let data;
 try{const r=await fetch(API+encodeURIComponent(c.uid)+'/'+encodeURIComponent(c.author)+'?lang=vi',{signal:ctl.signal});if(!r.ok)throw new Error('HTTP '+r.status);data=await r.json()}
 catch(e){throw new Error('Chưa tải được bài kinh này từ SuttaCentral. Hãy kiểm tra kết nối Internet rồi thử lại.')}
 finally{clearTimeout(timer)}
 let blocks=[];
 if(data.translation&&data.translation.text)blocks=htmlToBlocks(data.translation.text);
 else if(data.bilara_translated_text)blocks=segmentsToBlocks(data.bilara_translated_text);
 if(!blocks.length)throw new Error('SuttaCentral chưa có bản tiếng Việt cho bài này.');
 if(blocks[0][0]==='h'&&fold(blocks[0][1]).includes(fold(c.t).slice(0,12)))blocks.shift();
 c.b=blocks;store.set(ck,blocks);return blocks;
}

/* ---------- Hiển thị ---------- */
function inline(s){return esc(s).replace(/\((\d+ lần|3 lần|lặp lại[^)]*)\)/gi,'<span class="gk-rep">($1)</span>')}
function renderBlocks(blocks){
 return blocks.map((b,i)=>{
  switch(b[0]){
   case 'h':return `<h3 class="gk-sub" data-i="${i}">${esc(b[1])}</h3>`;
   case 'v':return `<p class="gk-verse" data-i="${i}">${b[1].map(l=>`<span>${inline(l)}</span>`).join('')}</p>`;
   case 'n':return `<p class="gk-story" data-i="${i}">${inline(b[1])}</p>`;
   case 'k':return `<div class="gk-gatha" data-i="${i}"><span class="gk-num">${b[1]}</span><p class="gk-verse">${b[2].map(l=>`<span>${inline(l)}</span>`).join('')}</p></div>`;
   default:return `<p data-i="${i}">${inline(b[1])}</p>`;
  }
 }).join('');
}
function applyPrefs(){
 root.style.setProperty('--gk-size',prefs.font+'px');root.style.setProperty('--gk-lh',prefs.lh);
 root.dataset.theme=prefs.theme;root.dataset.family=prefs.family;el('gkFontVal').textContent=prefs.font;
 root.querySelectorAll('[data-gk-lh]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.gkLh)===prefs.lh)));
 root.querySelectorAll('[data-gk-family]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.gkFamily===prefs.family)));
 root.querySelectorAll('[data-gk-theme]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.gkTheme===prefs.theme)));
 store.set('gk_prefs_v7',prefs);
}
function renderToc(){
 const list=el('gkTocList');let html='',part=null;
 book.chapters.forEach((c,i)=>{
  if((c.p||'')!==part){if(part!==null)html+='</div>';part=c.p||'';html+=`<div class="gk-toc-group">${part?`<p class="gk-toc-part">${esc(part)}</p>`:''}`}
  html+=`<button type="button" data-gk-ch="${i}" data-fold="${esc(fold(c.t+' '+(c.r||'')))}"><span class="gk-toc-no">${i+1}</span><span class="gk-toc-t">${esc(c.t)}${c.r&&!book.live?`<small>${esc(c.r)}</small>`:''}</span></button>`;
 });
 list.innerHTML=html+(part!==null?'</div>':'');
}
function markToc(){
 el('gkTocList').querySelectorAll('[data-gk-ch]').forEach(b=>{const on=Number(b.dataset.gkCh)===ch;b.classList.toggle('on',on);if(on)b.setAttribute('aria-current','true');else b.removeAttribute('aria-current')});
 const cur=el('gkTocList').querySelector('.on');if(cur)cur.scrollIntoView({block:'nearest'});
}
function shortName(c){return c?c.t.length>46?c.t.slice(0,44)+'…':c.t:''}
async function openChapter(i,opts={}){
 stopSpeech();
 ch=Math.max(0,Math.min(book.chapters.length-1,i));
 const c=book.chapters[ch],seq=++loadSeq;
 el('gkPart').textContent=c.p||book.title;
 el('gkChapter').textContent=c.t;el('gkBarChapter').textContent=c.t;
 el('gkRange').textContent=c.r||'';el('gkRange').hidden=!c.r;
 el('gkCounter').textContent=`${ch+1} / ${book.chapters.length}`;
 const prev=book.chapters[ch-1],next=book.chapters[ch+1];
 root.querySelector('[data-gk="prev"]').disabled=!prev;root.querySelector('[data-gk="next"]').disabled=!next;
 el('gkPrevName').textContent=shortName(prev)||'—';el('gkNextName').textContent=shortName(next)||'Hết kinh';
 markToc();closeToc();
 text.innerHTML='';
 if(book.live&&!c.b){state.hidden=false;state.className='gk-state';state.textContent='Đang tải bài kinh từ SuttaCentral…'}
 try{
  const blocks=book.live?await loadLive(c):c.b;
  if(seq!==loadSeq)return;
  state.hidden=true;text.innerHTML=renderBlocks(blocks);
 }catch(e){
  if(seq!==loadSeq)return;
  state.hidden=false;state.className='gk-state gk-error';
  state.innerHTML=`${esc(e.message)}<br><a href="https://suttacentral.net/${esc(c.uid||'')}/vi/${esc(c.author||'')}" target="_blank" rel="noopener noreferrer">Mở trên SuttaCentral ↗</a> <button type="button" data-gk="retry">Thử lại</button>`;
 }
 requestAnimationFrame(()=>{
  if(opts.y)scroller.scrollTop=opts.y*(scroller.scrollHeight-scroller.clientHeight);
  else if(opts.mark)highlight(opts.mark);
  else scroller.scrollTop=0;
  progress();
 });
 try{history.replaceState(null,'','#doc/'+book.id+'/'+(ch+1))}catch(e){}
 remember();
}
function highlight(q){
 const nq=fold(q);
 const target=[...text.querySelectorAll('p,h3')].find(n=>fold(n.textContent).includes(nq));
 if(!target){scroller.scrollTop=0;return}
 target.classList.add('gk-hit');target.scrollIntoView({block:'center'});
 setTimeout(()=>target.classList.remove('gk-hit'),4200);
}
function progress(){
 const max=scroller.scrollHeight-scroller.clientHeight;const p=max>0?scroller.scrollTop/max:1;
 el('gkProgress').style.width=(Math.max(0,Math.min(1,p))*100).toFixed(1)+'%';
}
function remember(){
 if(!book)return;
 const max=scroller.scrollHeight-scroller.clientHeight;
 pos[book.id]={c:ch,y:max>0?+(scroller.scrollTop/max).toFixed(4):0,t:Date.now()};
 store.set('gk_pos_v7',pos);
 store.set('gk_last_v7',{b:book.id,c:ch,title:book.title,ct:book.chapters[ch].t});
}

/* ---------- Mở / đóng ---------- */
async function open(id,chapter,opts={}){
 const modal=document.getElementById('sutraModal');
 if(modal&&!modal.hidden)document.getElementById('modalClose')?.click();
 if(root.hidden)priorFocus=document.activeElement;
 root.hidden=false;document.body.classList.add('gk-open');applyPrefs();
 state.hidden=false;state.className='gk-state';state.textContent='Đang mở sách kinh…';text.innerHTML='';
 try{book=await getBook(id)}catch(e){state.className='gk-state gk-error';state.textContent=e.message;return}
 el('gkBookName').textContent=book.title;el('gkBookTitle').textContent=book.title;el('gkBookBy').textContent=book.by;
 const src=el('gkBookSrc');src.href=book.src;src.textContent='Nguồn: '+book.srcName+' ↗';
 el('gkCredit').innerHTML=book.live
  ?`Kinh văn tải trực tiếp từ <a href="${esc(book.src)}" target="_blank" rel="noopener noreferrer">SuttaCentral</a> và lưu lại trên trình duyệt sau lần đọc đầu tiên.`
  :book.srcName==='SuttaCentral'
   ?`Bản dịch của HT Thích Minh Châu do <a href="${esc(book.src)}" target="_blank" rel="noopener noreferrer">SuttaCentral</a> phổ biến. Gió Lành trình bày lại dạng chữ để đọc trên mọi thiết bị.`
   :`Kinh văn chuyển từ sách ấn tống của <a href="${esc(book.src)}" target="_blank" rel="noopener noreferrer">Đạo Tràng Liên Hoa</a> sang dạng chữ để đọc trực tiếp. Kinh ấn tống, không bán. Nếu thấy lỗi chữ, xin đối chiếu bản gốc.`;
 el('gkTocFilter').value='';el('gkTocFilter').placeholder=book.live?`Tìm trong ${book.chapters.length} bài kinh…`:'Lọc mục lục…';
 renderToc();
 const saved=pos[book.id];
 let start=chapter,o=opts;
 if(start==null||start<0){start=saved?saved.c:0;o=saved?{y:saved.y,...opts}:opts}
 await openChapter(start,o);
 setTimeout(()=>scroller.focus({preventScroll:true}),30);
 window.dispatchEvent(new CustomEvent('gioreader:change'));
}
function close(){
 if(root.hidden)return;
 remember();stopSpeech();closePops();root.hidden=true;document.body.classList.remove('gk-open');
 try{history.replaceState(null,'',location.pathname+location.search)}catch(e){}
 priorFocus?.focus?.();
 window.dispatchEvent(new CustomEvent('gioreader:change'));
}
function openToc(){root.classList.add('toc-open');root.querySelector('[data-gk="toc"]').setAttribute('aria-expanded','true')}
function closeToc(){root.classList.remove('toc-open');root.querySelector('[data-gk="toc"]').setAttribute('aria-expanded','false')}
function closePops(){el('gkSettings').hidden=true;el('gkSearch').hidden=true;root.querySelector('[data-gk="settings"]').setAttribute('aria-expanded','false')}
function togglePop(id){const p=el(id),was=p.hidden;closePops();p.hidden=!was;if(id==='gkSettings')root.querySelector('[data-gk="settings"]').setAttribute('aria-expanded',String(was));if(!p.hidden&&id==='gkSearch')el('gkSearchInput').focus()}

/* ---------- Tìm kiếm ---------- */
function blockText(b){return b[0]==='k'?b[2].join(' '):b[0]==='v'?b[1].join(' '):String(b[1])}
function search(q){
 const res=el('gkResults'),note=el('gkSearchNote');const nq=fold(q.trim());
 if(nq.length<2){res.innerHTML='';note.textContent='Gõ ít nhất 2 ký tự, có thể gõ không dấu.';return}
 if(book.live){ // Nikāya: tìm theo tên bài
  const hits=book.chapters.map((c,i)=>[c,i]).filter(([c])=>fold(c.t+' '+c.r).includes(nq)).slice(0,80);
  note.textContent=hits.length?`${hits.length} bài kinh có tên phù hợp`:'Không thấy tên bài phù hợp.';
  res.innerHTML=hits.map(([c,i])=>`<li><button type="button" data-gk-hit="${i}"><strong>${esc(c.t)}</strong><span>${esc(c.p)} · ${esc(c.r)}</span></button></li>`).join('');return;
 }
 const hits=[];
 book.chapters.forEach((c,i)=>c.b.forEach(b=>{if(hits.length>=120)return;const t=blockText(b),f=fold(t),at=f.indexOf(nq);if(at<0)return;
  const a=Math.max(0,at-50),snip=(a?'…':'')+t.slice(a,at)+'\u0001'+t.slice(at,at+nq.length)+'\u0002'+t.slice(at+nq.length,at+nq.length+70)+'…';
  hits.push([i,c.t,snip,t.slice(at,at+nq.length)])}));
 note.textContent=hits.length?`Tìm thấy ${hits.length>=120?'hơn 120':hits.length} đoạn`:'Không tìm thấy trong kinh này.';
 res.innerHTML=hits.map(([i,t,s,m])=>`<li><button type="button" data-gk-hit="${i}" data-gk-q="${esc(m)}"><strong>${esc(t)}</strong><span>${esc(s).replace('\u0001','<mark>').replace('\u0002','</mark>')}</span></button></li>`).join('');
}

/* ---------- Nghe đọc ---------- */
function stopSpeech(){if(speaking&&'speechSynthesis' in window)speechSynthesis.cancel();speaking=false;text.querySelectorAll('.gk-speaking').forEach(n=>n.classList.remove('gk-speaking'));const b=root.querySelector('[data-gk="listen"]');b.setAttribute('aria-pressed','false');b.classList.remove('on')}
function listen(){
 if(speaking){stopSpeech();return}
 if(!('speechSynthesis' in window)){alert('Trình duyệt này chưa hỗ trợ đọc thành tiếng.');return}
 const nodes=[...text.querySelectorAll('h3,p')].filter(n=>!n.closest('.gk-gatha')||n.matches('.gk-verse'));if(!nodes.length)return;
 window.GioLanhMedia?.stopAll?.();
 const voice=speechSynthesis.getVoices().find(v=>/^vi/i.test(v.lang));
 speaking=true;const b=root.querySelector('[data-gk="listen"]');b.setAttribute('aria-pressed','true');b.classList.add('on');
 let k=0;const viewTop=scroller.scrollTop;
 k=Math.max(0,nodes.findIndex(n=>n.offsetTop>=viewTop-20));
 const next=()=>{
  if(!speaking)return;
  text.querySelectorAll('.gk-speaking').forEach(n=>n.classList.remove('gk-speaking'));
  if(k>=nodes.length){stopSpeech();return}
  const n=nodes[k++];n.classList.add('gk-speaking');n.scrollIntoView({block:'center',behavior:'smooth'});
  const u=new SpeechSynthesisUtterance(n.textContent);u.lang='vi-VN';if(voice)u.voice=voice;u.rate=.92;
  u.onend=next;u.onerror=next;speechSynthesis.speak(u);
 };
 speechSynthesis.cancel();next();
}

/* ---------- Sự kiện ---------- */
root.addEventListener('click',e=>{
 const a=e.target.closest('[data-gk]'),act=a?.dataset.gk;
 if(act==='close')close();
 else if(act==='toc')root.classList.contains('toc-open')?closeToc():openToc();
 else if(act==='toc-close')closeToc();
 else if(act==='prev')openChapter(ch-1);
 else if(act==='next')openChapter(ch+1);
 else if(act==='retry')openChapter(ch);
 else if(act==='settings')togglePop('gkSettings');
 else if(act==='search')togglePop('gkSearch');
 else if(act==='listen')listen();
 else if(act==='font-'){prefs.font=Math.max(15,prefs.font-1);applyPrefs()}
 else if(act==='font+'){prefs.font=Math.min(32,prefs.font+1);applyPrefs()}
 const t=e.target.closest('[data-gk-ch]');if(t)openChapter(Number(t.dataset.gkCh));
 const h=e.target.closest('[data-gk-hit]');if(h){closePops();openChapter(Number(h.dataset.gkHit),{mark:h.dataset.gkQ||''})}
 const lh=e.target.closest('[data-gk-lh]');if(lh){prefs.lh=Number(lh.dataset.gkLh);applyPrefs()}
 const fam=e.target.closest('[data-gk-family]');if(fam){prefs.family=fam.dataset.gkFamily;applyPrefs()}
 const th=e.target.closest('[data-gk-theme]');if(th){prefs.theme=th.dataset.gkTheme;applyPrefs()}
 if(!e.target.closest('.gk-pop,[data-gk="settings"],[data-gk="search"]'))closePops();
});
scroller.addEventListener('scroll',()=>{progress();clearTimeout(saveTimer);saveTimer=setTimeout(remember,400)},{passive:true});
el('gkTocFilter').addEventListener('input',e=>{
 const q=fold(e.target.value.trim());
 el('gkTocList').querySelectorAll('[data-gk-ch]').forEach(b=>{b.hidden=!!q&&!b.dataset.fold.includes(q)});
 el('gkTocList').querySelectorAll('.gk-toc-group').forEach(g=>{g.hidden=!g.querySelector('[data-gk-ch]:not([hidden])')});
});
let st;el('gkSearchInput').addEventListener('input',e=>{clearTimeout(st);st=setTimeout(()=>search(e.target.value),180)});
document.addEventListener('keydown',e=>{
 if(root.hidden)return;
 if(e.key==='Escape'){e.preventDefault();if(!el('gkSettings').hidden||!el('gkSearch').hidden)closePops();else if(root.classList.contains('toc-open'))closeToc();else close();return}
 if(/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName))return;
 if(e.key==='ArrowRight'&&ch<book.chapters.length-1)openChapter(ch+1);
 if(e.key==='ArrowLeft'&&ch>0)openChapter(ch-1);
});
document.addEventListener('click',e=>{
 const r=e.target.closest('[data-gk-read]');
 if(r){const l=R.link[r.dataset.gkRead];if(l){e.preventDefault();e.stopPropagation();open(l[0],l[1])}return}
 const b=e.target.closest('[data-gk-book]');
 if(b){e.preventDefault();open(b.dataset.gkBook,b.dataset.gkCh!=null?Number(b.dataset.gkCh):-1)}
},true);
window.addEventListener('pagehide',remember);

/* ---------- Tủ kinh trên trang chủ ---------- */
const fmtTime=w=>{const m=Math.round(w/180);return m<60?`~${Math.max(1,m)} phút đọc`:`~${(m/60).toFixed(m<600?1:0).replace('.',',')} giờ đọc`};
const unit=id=>/phap-hoa|dia-tang|vo-luong-tho|phap-cu/.test(id)?'phẩm/mục':id==='tieu-tung'?'bài kinh':'mục';
function bookCard(id,tag){
 const b=R.books[id],p=pos[id];
 const prog=p?`<span class="gk-card-prog">Đang đọc mục ${p.c+1}/${b.n}</span>`:'';
 return `<article class="gk-card"><button type="button" class="gk-card-hit" data-gk-book="${esc(id)}" aria-label="Đọc ${esc(b.title)}"></button><div class="gk-card-spine" aria-hidden="true"><span>${esc(b.title)}</span></div><div class="gk-card-body"><span class="gk-card-tag">${esc(tag)}</span><h4>${esc(b.title)}</h4><p>${esc(b.by)}</p><div class="gk-card-meta"><span>${b.n} ${unit(id)}</span><span>${fmtTime(b.w)}</span></div>${prog}<span class="gk-card-cta">${p?'Đọc tiếp':'Đọc ngay'} <b aria-hidden="true">→</b></span></div></article>`;
}
function nikayaCard(col){
 const m=NIKAYA[col];
 return `<article class="gk-card gk-card-nikaya"><button type="button" class="gk-card-hit" data-gk-book="nikaya:${col}" aria-label="Mở ${esc(m[0])}"></button><div class="gk-card-spine" aria-hidden="true"><span>${esc(m[0])}</span></div><div class="gk-card-body"><span class="gk-card-tag">NGŨ BỘ NIKĀYA · TRỰC TUYẾN</span><h4>${esc(m[0])}</h4><p>${esc(m[1])}</p><div class="gk-card-meta"><span>${m[2].toLocaleString('vi-VN')} bài kinh</span><span>HT Thích Minh Châu</span></div><span class="gk-card-cta">Mở mục lục <b aria-hidden="true">→</b></span></div></article>`;
}
const shelfEl=document.querySelector('.gk-shelf');
let shelfTab=store.get('gk_shelf_tab_v2','hang-ngay');
function renderShelf(){
 if(!shelfEl)return;
 pos=store.get('gk_pos_v7',{});
 const tabs=[...R.shelf.map(([k,n])=>[k,n]),['nikaya','Ngũ Bộ Nikāya']];
 if(!tabs.some(t=>t[0]===shelfTab))shelfTab='hang-ngay';
 const last=store.get('gk_last_v7',null);
 const cont=last&&(R.books[last.b]||last.b.startsWith('nikaya:'))?`<button type="button" class="gk-continue" data-gk-book="${esc(last.b)}"><span class="gk-continue-ic" aria-hidden="true">❀</span><span><small>ĐỌC TIẾP</small><strong>${esc(last.title)}</strong><em>${esc(last.ct)}</em></span><b aria-hidden="true">→</b></button>`:'';
 const body=shelfTab==='nikaya'?Object.keys(NIKAYA).map(nikayaCard).join(''):(R.shelf.find(s=>s[0]===shelfTab)[2]).map(id=>bookCard(id,tabs.find(t=>t[0]===shelfTab)[1].toUpperCase())).join('');
 shelfEl.querySelector('.gk-shelf-continue').innerHTML=cont;
 shelfEl.querySelector('.gk-tabs').innerHTML=tabs.map(([k,n])=>`<button type="button" role="tab" data-gk-tab="${k}" aria-selected="${k===shelfTab}">${esc(n)}</button>`).join('');
 shelfEl.querySelector('.gk-grid').innerHTML=body;
}
/* ---------- Tìm kinh theo tên ---------- */
const findInput=document.getElementById('gkFind'),findBox=document.getElementById('gkFindResults'),findClear=document.getElementById('gkFindClear');
let catalogLoading=null;
function mark(t,q){const f=fold(t),i=f.indexOf(q);if(i<0)return esc(t);return esc(t.slice(0,i))+'<mark>'+esc(t.slice(i,i+q.length))+'</mark>'+esc(t.slice(i+q.length))}
function hitRow(label,sub,attrs,tag){return `<li><button type="button" ${attrs}><span class="gk-find-tag">${esc(tag)}</span><strong>${label}</strong>${sub?`<small>${sub}</small>`:''}</button></li>`}
function runFind(){
 const raw=findInput.value.trim(),q=fold(raw);findClear.hidden=!raw;
 const on=q.length>=2;findBox.hidden=!on;
 shelfEl.querySelector('.gk-tabs').hidden=on;shelfEl.querySelector('.gk-grid').hidden=on;
 if(!on){findBox.innerHTML='';return}
 const seen=new Set(),books=[],chaps=[];
 // 1. Tên sách và tên quen gọi
 Object.entries(R.books).forEach(([id,b])=>{if(fold(b.title+' '+b.by).includes(q)){seen.add(id+':0');books.push(hitRow(mark(b.title,q),esc(b.by),`data-gk-book="${esc(id)}"`,R.books[id].srcName==='SuttaCentral'?'Nguyên thủy':'Kinh sách'))}});
 (R.alias||[]).forEach(([name,pali,bid,c])=>{
  if(!fold(name+' '+pali).includes(q))return;
  if(bid.startsWith('nikaya:')){const key=bid;if(seen.has(key))return;seen.add(key);books.push(hitRow(mark(name,q),esc(pali),`data-gk-book="${esc(bid)}"`,'Nikāya'));return}
  const key=bid+':'+Math.max(0,c);if(seen.has(key)||seen.has(bid+':0')&&c<=0)return;seen.add(key);
  const b=R.books[bid];if(!b)return;
  books.push(hitRow(mark(name,q),esc(b.title===name?pali:b.title+(pali?' · '+pali:'')),`data-gk-book="${esc(bid)}" data-gk-ch="${Math.max(0,c)}"`,'Kinh'));
 });
 // 2. Tên phẩm / chương trong sách
 Object.entries(R.books).forEach(([id,b])=>(b.toc||[]).forEach((t,i)=>{if(t&&fold(t).includes(q)&&!seen.has(id+':'+i)){seen.add(id+':'+i);chaps.push(hitRow(mark(t,q),esc(b.title),`data-gk-book="${esc(id)}" data-gk-ch="${i}"`,'Phẩm/chương'))}}));
 // 3. Ngũ Bộ Nikāya
 let nik=[];
 if(window.GioKinhCatalog){
  Object.entries(window.GioKinhCatalog).forEach(([col,cat])=>{let i=-1;cat.nodes.forEach(n=>{if(n[0]!==1)return;i++;if(nik.length<40&&fold(n[2]+' '+n[3]+' '+n[1]).includes(q))nik.push(hitRow(mark(n[2],q),esc(cat.name+' · '+n[1].toUpperCase()+(n[3]&&n[3]!==n[2]?' · '+n[3]:'')),`data-gk-book="nikaya:${col}" data-gk-ch="${i}"`,'Nikāya'))})});
 }else if(!catalogLoading){catalogLoading=loadScript('data/kinh/nikaya-catalog.js').then(()=>{if(findInput.value.trim())runFind()}).catch(()=>{})}
 const sec=(t,rows,more)=>rows.length?`<section><h4>${t} <span>${rows.length}${more?'+':''}</span></h4><ul>${rows.slice(0,30).join('')}</ul></section>`:'';
 const html=sec('Sách & bài kinh',books)+sec('Phẩm, chương trong sách',chaps.slice(0,30),chaps.length>30)+(window.GioKinhCatalog?sec('Ngũ Bộ Nikāya',nik,nik.length>=40):'<p class="gk-find-wait">Đang tìm thêm trong Ngũ Bộ Nikāya…</p>');
 findBox.innerHTML=html||`<p class="gk-find-empty">Chưa tìm thấy kinh có tên “${esc(raw)}”. Thử gõ ngắn hơn, ví dụ “Đại Bi”, “Di Đà”, “Pháp Cú”.</p>`;
}
if(shelfEl&&findInput){
 let ft;findInput.addEventListener('input',()=>{clearTimeout(ft);ft=setTimeout(runFind,120)});
 findInput.addEventListener('keydown',e=>{if(e.key==='Enter'){const first=findBox.querySelector('button');if(first){e.preventDefault();first.click()}}if(e.key==='Escape'){findInput.value='';runFind()}});
 findClear.addEventListener('click',()=>{findInput.value='';runFind();findInput.focus()});
}
if(shelfEl){
 shelfEl.addEventListener('click',e=>{const t=e.target.closest('[data-gk-tab]');if(!t)return;shelfTab=t.dataset.gkTab;store.set('gk_shelf_tab_v2',shelfTab);renderShelf()});
 window.addEventListener('gioreader:change',renderShelf);
 renderShelf();
}

window.GioReader={open,close,has:id=>!!R.link[id],openFor:id=>{const l=R.link[id];if(l)open(l[0],l[1])}};
const m=location.hash.match(/^#doc\/([\w:-]+)\/(\d+)$/);
if(m)open(m[1],Number(m[2])-1);
})();
