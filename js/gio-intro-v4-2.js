/* Gió Lành 4.2 – Chỉ xuất hiện khi tải trang, có thể bỏ qua/xem lại. */
(function(){'use strict';
 const overlay=document.getElementById('gioIntro');
 if(!overlay)return;
 const skip=document.getElementById('gioIntroSkip');
 const replay=document.getElementById('gioReplayIntro');
 const page=Array.from(document.querySelectorAll('.site-header, main, footer'));
 const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 let finishTimer=0, removeTimer=0, showing=false, priorFocus=null;
 function lock(){document.documentElement.classList.add('gio-intro-open');page.forEach(n=>n.inert=true)}
 function unlock(){document.documentElement.classList.remove('gio-intro-open');page.forEach(n=>n.inert=false)}
 function end(){if(!showing)return;showing=false;window.clearTimeout(finishTimer);overlay.classList.add('gio-intro-out');overlay.classList.remove('gio-intro-wait');if(enter)enter.hidden=true;unlock();window.clearTimeout(removeTimer);removeTimer=window.setTimeout(()=>{overlay.hidden=true;overlay.classList.remove('gio-intro-out');if(document.activeElement===skip){(priorFocus&&priorFocus.isConnected?priorFocus:document.querySelector('.brand'))?.focus?.({preventScroll:true})}},reduced?0:760)}
 function start(){window.clearTimeout(finishTimer);window.clearTimeout(removeTimer);priorFocus=document.activeElement;overlay.hidden=false;overlay.classList.remove('gio-intro-out');showing=true; // Reflow restarts all entrance animations when user replays.
 void overlay.offsetWidth;const children=overlay.querySelectorAll('.gio-intro-content > *, .gio-intro-progress span');children.forEach(x=>{x.style.animation='none';void x.offsetWidth;x.style.animation=''});lock();skip.focus({preventScroll:true});finishTimer=window.setTimeout(timeUp,reduced?2000:5800)}
 function timeUp(){if(window.GioBgm&&window.GioBgm.blocked()){overlay.classList.add('gio-intro-wait');enter.hidden=false;enter.focus({preventScroll:true});return}end()}
 const enter=document.getElementById('gioIntroEnter');
 skip?.addEventListener('click',end);
 enter?.addEventListener('click',end);
 overlay.addEventListener('click',e=>{if(overlay.classList.contains('gio-intro-wait')&&!e.target.closest('#gioIntroSkip'))end()});
 replay?.addEventListener('click',()=>{start()});
 overlay.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();end()}if(event.key==='Tab'){event.preventDefault();(enter&&!enter.hidden?enter:skip).focus()}});
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();