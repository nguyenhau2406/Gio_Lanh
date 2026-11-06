/* Gió Lành 7.11 · Lá bồ đề chuyển động nhẹ, tôn trọng giảm chuyển động và tiết kiệm dữ liệu. */
(function(){
  'use strict';
  function init(){
    if(document.getElementById('gioBodhiRain')) return;
    var reduced=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var saveData=!!(navigator.connection&&navigator.connection.saveData);
    /* Nút bật/tắt chỉ gắn khi chân trang còn ô thứ hai (đã gỡ ở bản 7.14). */
    var footer=document.querySelector('.footer-bottom > span:nth-child(2)');
    var button=document.createElement('button');
    button.type='button'; button.id='gioLeafToggle';
    button.setAttribute('aria-label','Bật hoặc tắt hiệu ứng lá bồ đề rơi');
    button.title='Bật / tắt lá bồ đề';
    if(footer)footer.appendChild(button);
    if(reduced||saveData){button.hidden=true;return;}
    var enabled=true;
    try{enabled=localStorage.getItem('gio-bodhi-enabled')!=='0';}catch(e){}
    var rain=document.createElement('div');
    rain.id='gioBodhiRain'; rain.className='gio-bodhi-rain';
    rain.setAttribute('aria-hidden','true');
    /* Hình lá bồ đề dạng vector, không sử dụng ảnh bên ngoài. */
    var leafSVG='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 116" aria-hidden="true"><path class="leaf-shape" d="M50 8C29 1 13 15 11 35C8 58 29 73 43 88L50 104L57 88C71 73 92 58 89 35C87 15 71 1 50 8Z"/><path class="leaf-veins" d="M50 104C51 80 51 54 50 15M50 65C40 55 29 49 18 44M50 48C59 39 71 34 82 31M50 83C59 71 68 65 78 58M50 37C40 30 32 26 23 23"/><path d="M50 103l1 11" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>';
    var leaves=[
      [3,25,-8,23,'4vw'],[11,33,-21,28,'-4vw'],[22,20,-15,22,'5vw'],[36,28,-5,33,'-3vw'],
      [52,26,-18,29,'3vw'],[67,22,-12,25,'-5vw'],[78,32,-27,32,'4vw'],[88,24,-4,24,'-3vw'],
      [95,29,-17,31,'-4vw'],[15,19,-34,26,'3vw'],[62,18,-24,27,'-5vw'],[83,21,-11,30,'4vw']
    ];
    leaves.forEach(function(cfg){
      var el=document.createElement('span');el.className='gio-bodhi-leaf';
      el.style.setProperty('--left',cfg[0]+'%');
      el.style.setProperty('--size',cfg[1]+'px');
      el.style.setProperty('--delay',cfg[2]+'s');
      el.style.setProperty('--duration',cfg[3]+'s');
      el.style.setProperty('--sway',cfg[4]);
      el.innerHTML=leafSVG;rain.appendChild(el);
    });
    document.body.appendChild(rain);
    function apply(){rain.hidden=!enabled;button.setAttribute('aria-pressed',String(enabled));button.textContent=enabled?'❧ Lá bồ đề: Bật':'❧ Lá bồ đề: Tắt';}
    button.addEventListener('click',function(){enabled=!enabled;try{localStorage.setItem('gio-bodhi-enabled',enabled?'1':'0');}catch(e){}apply()});
    document.addEventListener('visibilitychange',function(){rain.classList.toggle('is-paused',document.hidden)});
    apply();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
