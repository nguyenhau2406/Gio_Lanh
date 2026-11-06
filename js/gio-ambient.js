/* Gió Lành 7 · Nhạc nền YouTube khi đọc kinh.
   Phát qua trình phát YouTube nhúng chính thức (IFrame Player API) — không tải, không chuyển đổi tệp.
   Theo chính sách YouTube, khung phát luôn hiển thị (tối thiểu 200×200px). */
(function(){'use strict';
const $=(s,r=document)=>r.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const store={get(k,d){try{const v=localStorage.getItem(k);return v==null?d:JSON.parse(v)}catch(e){return d}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};
const cfg=Object.assign({vol:35,loop:true,side:'right'},store.get('ga_cfg_v1',{}));
let recent=store.get('ga_recent_v1',[]); // [{v,list,title}]
let player=null,current=null,apiPromise=null;

function parse(input){
 const raw=String(input||'').trim();if(!raw)return null;
 if(/^[\w-]{11}$/.test(raw))return{v:raw,list:''};
 let u;try{u=new URL(/^https?:\/\//i.test(raw)?raw:'https://'+raw)}catch(e){return null}
 const host=u.hostname.replace(/^(www|m|music)\./,'');
 let v='',list=u.searchParams.get('list')||'';
 if(host==='youtu.be')v=u.pathname.slice(1,12);
 else if(host==='youtube.com'||host==='youtube-nocookie.com'){
  v=u.searchParams.get('v')||'';
  const m=u.pathname.match(/^\/(?:embed|shorts|live|v)\/([\w-]{11})/);if(m)v=m[1];
 }else return null;
 if(v&&!/^[\w-]{11}$/.test(v))v='';
 if(!v&&!list)return null;
 return{v,list};
}

/* ---------- Giao diện ---------- */
const panel=document.createElement('div');
panel.id='gaPanel';panel.className='ga-panel';panel.hidden=true;panel.setAttribute('role','dialog');panel.setAttribute('aria-label','Nhạc nền khi đọc kinh');
panel.innerHTML=`
 <div class="ga-head"><span class="ga-ic" aria-hidden="true">♫</span><div><strong>Nhạc nền khi đọc kinh</strong><small>Dán link YouTube — nhạc phát nhẹ dưới nền</small></div><button type="button" class="ga-x" data-ga="hide" aria-label="Đóng">×</button></div>
 <form class="ga-form" id="gaForm"><input id="gaUrl" type="url" inputmode="url" placeholder="https://www.youtube.com/watch?v=…" autocomplete="off" aria-label="Link YouTube"><button type="submit">Phát</button></form>
 <p class="ga-msg" id="gaMsg" role="status"></p>
 <div class="ga-ctrl"><label>Âm lượng <input id="gaVol" type="range" min="0" max="100"></label><label class="ga-check"><input id="gaLoop" type="checkbox"> Lặp lại</label></div>
 <div class="ga-recent" id="gaRecent"></div>
 <p class="ga-note">Phát qua trình phát YouTube nhúng chính thức, cần Internet. Gió Lành không tải hay chuyển đổi tệp từ YouTube.</p>`;
const mini=document.createElement('div');
mini.id='gaMini';mini.className='ga-mini';mini.hidden=true;mini.setAttribute('role','region');mini.setAttribute('aria-label','Trình phát nhạc nền');
mini.innerHTML=`<div class="ga-frame"><div id="gaPlayer"></div></div>
 <div class="ga-mini-bar"><span class="ga-title" id="gaTitle">Đang mở nhạc…</span>
 <button type="button" data-ga="toggle" id="gaToggle" aria-label="Tạm dừng">❚❚</button><button type="button" data-ga="open" aria-label="Đổi link nhạc">♫</button><button type="button" data-ga="side" aria-label="Chuyển sang góc bên kia">⇄</button><button type="button" data-ga="stop" aria-label="Tắt nhạc nền">×</button></div>`;
document.body.append(panel,mini);
const msg=t=>{$('#gaMsg').textContent=t||''};

function renderRecent(){
 $('#gaRecent').innerHTML=recent.length?`<p>Đã nghe gần đây</p>${recent.map((r,i)=>`<button type="button" data-ga-recent="${i}"><span aria-hidden="true">▶</span>${esc(r.title||'Video YouTube')}</button>`).join('')}`:'';
}
function applyCfg(){
 $('#gaVol').value=cfg.vol;$('#gaLoop').checked=cfg.loop;mini.dataset.side=cfg.side;panel.dataset.side=cfg.side;
 if(player?.setVolume)player.setVolume(cfg.vol);
 store.set('ga_cfg_v1',cfg);
}
function show(){panel.hidden=false;renderRecent();applyCfg();msg('');setTimeout(()=>$('#gaUrl').focus(),20)}
function hide(){panel.hidden=true}

/* ---------- YouTube IFrame API ---------- */
function loadApi(){
 if(window.YT&&window.YT.Player)return Promise.resolve();
 if(apiPromise)return apiPromise;
 apiPromise=new Promise((res,rej)=>{
  const prev=window.onYouTubeIframeAPIReady;
  window.onYouTubeIframeAPIReady=()=>{prev&&prev();res()};
  const s=document.createElement('script');s.src='https://www.youtube.com/iframe_api';s.onerror=()=>{apiPromise=null;rej(new Error('net'))};
  document.head.appendChild(s);
 });
 return apiPromise;
}
const ERR={2:'Link không hợp lệ.',5:'Trình duyệt không phát được video này.',100:'Video không tồn tại hoặc đã bị gỡ.',101:'Chủ video không cho phép phát nhúng trên trang khác. Hãy thử video khác.',150:'Chủ video không cho phép phát nhúng trên trang khác. Hãy thử video khác.',153:'YouTube từ chối phát khi mở trang trực tiếp từ tệp. Hãy đưa Gió Lành lên hosting hoặc mở qua máy chủ cục bộ (http://).'};
async function play(item){
 current=item;mini.hidden=false;$('#gaTitle').textContent='Đang mở nhạc…';
 window.GioLanhMedia?.stopAll?.();window.GioBgm?.hold();
 try{await loadApi()}catch(e){msg('Không tải được trình phát YouTube. Hãy kiểm tra kết nối Internet.');mini.hidden=true;return}
 const vars={autoplay:1,playsinline:1,rel:0,modestbranding:1,controls:1};
 if(location.protocol.startsWith('http'))vars.origin=location.origin;
 if(item.list&&!item.v){vars.listType='playlist';vars.list=item.list}
 else if(item.list)vars.list=item.list;
 if(player){
  if(item.list&&!item.v)player.loadPlaylist({list:item.list,listType:'playlist'});else player.loadVideoById(item.v);
  return;
 }
 player=new YT.Player('gaPlayer',{width:'100%',height:'100%',videoId:item.v||undefined,playerVars:vars,events:{
  onReady:e=>{e.target.setVolume(cfg.vol);e.target.playVideo()},
  onStateChange:e=>{
   const S=YT.PlayerState;
   $('#gaToggle').textContent=e.data===S.PLAYING?'❚❚':'▶';$('#gaToggle').setAttribute('aria-label',e.data===S.PLAYING?'Tạm dừng':'Tiếp tục');
   if(e.data===S.PLAYING){const t=player.getVideoData?.().title;if(t){$('#gaTitle').textContent=t;remember(t)}msg('')}
   if(e.data===S.ENDED&&cfg.loop){if(current?.list)player.playVideoAt(0);else{player.seekTo(0);player.playVideo()}}
  },
  onError:e=>{const t=ERR[e.data]||'Không phát được video này (mã '+e.data+').';msg(t);$('#gaTitle').textContent=t;show()}
 }});
}
function remember(title){
 if(!current)return;
 recent=recent.filter(r=>!(r.v===current.v&&r.list===current.list));
 recent.unshift({v:current.v,list:current.list,title});recent=recent.slice(0,6);store.set('ga_recent_v1',recent);
}
function stop(){try{player?.stopVideo()}catch(e){}mini.hidden=true;current=null;window.GioBgm?.release()}

/* ---------- Sự kiện ---------- */
$('#gaForm').addEventListener('submit',e=>{
 e.preventDefault();const item=parse($('#gaUrl').value);
 if(!item){msg('Chưa nhận ra link YouTube. Ví dụ: https://youtu.be/… hoặc https://www.youtube.com/watch?v=…');return}
 msg('Đang mở…');play(item);hide();$('#gaUrl').value='';
});
$('#gaUrl').addEventListener('paste',()=>setTimeout(()=>{const item=parse($('#gaUrl').value);if(item){play(item);hide();$('#gaUrl').value=''}},0));
$('#gaVol').addEventListener('input',e=>{cfg.vol=Number(e.target.value);applyCfg()});
$('#gaLoop').addEventListener('change',e=>{cfg.loop=e.target.checked;applyCfg()});
document.addEventListener('click',e=>{
 const a=e.target.closest('[data-ga]');
 if(a){const act=a.dataset.ga;
  if(act==='open')panel.hidden?show():hide();
  else if(act==='hide')hide();
  else if(act==='stop')stop();
  else if(act==='side'){cfg.side=cfg.side==='right'?'left':'right';applyCfg()}
  else if(act==='toggle'&&player){player.getPlayerState()===YT.PlayerState.PLAYING?player.pauseVideo():player.playVideo()}
  return}
 const r=e.target.closest('[data-ga-recent]');if(r){play(recent[Number(r.dataset.gaRecent)]);hide();return}
 if(!panel.hidden&&!e.target.closest('#gaPanel'))hide();
});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!panel.hidden){e.stopPropagation();hide()}},true);
applyCfg();
window.GioAmbient={open:show,play:url=>{const i=parse(url);if(i)play(i);return!!i},stop,parse};
})();
