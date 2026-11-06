/* Gió Lành 7 · Nhạc nền tự phát khi vào trang (assets/audio/nhac-nen.mp3).
   Trình duyệt chặn tự phát có tiếng trước khi người dùng tương tác: thử phát ngay,
   nếu bị chặn thì phát ở lần chạm/bấm/gõ phím đầu tiên. Người dùng tắt thì nhớ lựa chọn. */
(function(){'use strict';
const SRC='assets/audio/nhac-nen.mp3',VOL=.35,KEY='gl_bgm_off_v1';
const store={get(){try{return localStorage.getItem(KEY)==='1'}catch(e){return false}},set(v){try{localStorage.setItem(KEY,v?'1':'0')}catch(e){}}};
const audio=new Audio();audio.src=SRC;audio.loop=true;audio.preload='auto';audio.volume=0;
let off=store.get(),held=false,fadeTimer=null;

const btn=document.createElement('button');
btn.type='button';btn.className='gl-bgm';btn.id='glBgm';
btn.innerHTML='<span class="gl-bgm-bars" aria-hidden="true"><i></i><i></i><i></i><i></i></span><svg class="gl-bgm-note" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/></svg>';
document.body.appendChild(btn);

function render(){
 const on=!audio.paused;
 btn.classList.toggle('on',on);btn.setAttribute('aria-pressed',String(on));
 btn.setAttribute('aria-label',on?'Tắt nhạc nền':'Bật nhạc nền');btn.title=on?'Tắt nhạc nền':'Bật nhạc nền';
}
function fadeTo(target,done){
 clearInterval(fadeTimer);
 fadeTimer=setInterval(()=>{
  const d=target-audio.volume;
  if(Math.abs(d)<.02){audio.volume=target;clearInterval(fadeTimer);done&&done();return}
  audio.volume=Math.max(0,Math.min(1,audio.volume+Math.sign(d)*.02));
 },60);
}
function play(){
 if(off||held)return Promise.resolve(false);
 return audio.play().then(()=>{fadeTo(VOL);render();return true}).catch(()=>{render();return false});
}
function pause(){fadeTo(0,()=>{audio.pause();render()})}

btn.addEventListener('click',()=>{
 if(audio.paused){off=false;store.set(false);held=false;play()}
 else{off=true;store.set(true);pause()}
});
// Chưa được phép tự phát -> phát ở tương tác đầu tiên (trừ khi chính là nút tắt/bật)
const kick=e=>{if(e.target.closest&&e.target.closest('#glBgm'))return;if(audio.paused)play();if(!audio.paused)['pointerdown','keydown','touchstart'].forEach(t=>document.removeEventListener(t,kick,true))};
['pointerdown','keydown','touchstart'].forEach(t=>document.addEventListener(t,kick,true));
// Tránh chồng tiếng: tạm dừng khi phát âm nền tổng hợp ở mục Nhạc thiền hoặc nhạc YouTube
document.addEventListener('click',e=>{if(e.target.closest('[data-sound]')&&!audio.paused){held=true;pause()}});
audio.addEventListener('error',()=>{btn.hidden=true});
render();play();

window.GioBgm={
 blocked:()=>audio.paused&&!off&&!held,
 hold(){if(!audio.paused){held=true;pause()}else held=true},
 release(){if(held){held=false;play()}},
 play,pause
};
})();
