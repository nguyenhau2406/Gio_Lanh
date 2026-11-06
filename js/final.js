// Gió Lành · Liên kết thời khóa và thư viện kinh
'use strict';
(function(){
  const library=document.getElementById('kinh-dien');
  function activateFilter(tag){
    const item=document.querySelector('#sutraFilters [data-filter="'+tag+'"]');
    if(item){item.click();library.scrollIntoView({behavior:'smooth',block:'start'});}
  }
  document.querySelectorAll('[data-daily-filter]').forEach(button=>button.addEventListener('click',()=>activateFilter(button.dataset.dailyFilter)));
  document.querySelectorAll('[data-daily-open]').forEach(button=>button.addEventListener('click',()=>{
    const id=button.dataset.dailyOpen;
    const filter=document.querySelector('#sutraFilters [data-filter="chu"]');
    if(filter)filter.click();
    // The library's existing reader opens by a real card action.
    const target=document.querySelector('#sutraGrid [data-read="'+id+'"]');
    if(target)target.click();else library.scrollIntoView({behavior:'smooth'});
  }));
})();
