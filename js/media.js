'use strict';
// Gió Lành — demonstrator with Vietnamese TTS and original browser-generated ambient audio.
// Nothing autoplays; play buttons are direct user gestures. Texts are editorial summaries, not scripture translations.
(() => {
 const q = (sel,root=document)=>root.querySelector(sel);
 const qa = (sel,root=document)=>Array.from(root.querySelectorAll(sel));
 const listenOrder=['tu-bi','phap-cu','chuyen-phap-luan','hanh-phuc','niem-xu','nhap-tuc-xuat-tuc'];
 const talks=[
  {id:'tro-ve',title:'Trở về với hơi thở',label:'CHÁNH NIỆM',image:'assets/gallery-6.jpg',excerpt:'Bắt đầu thực tập từ điều gần gũi nhất: một hơi thở có ý thức.',paragraphs:[
    'Chúng ta thường dành nhiều thời gian để lo điều chưa tới hoặc nhớ những chuyện đã qua. Trong lúc ấy, hơi thở vẫn ở đây, âm thầm nuôi dưỡng sự sống.',
    'Khi dừng lại và nhận biết mình đang hít vào, đang thở ra, ta không cần phải xua đuổi mọi suy nghĩ. Ta chỉ học cách nhận ra chúng và nhẹ nhàng quay về.',
    'Thực tập ngay: trước khi bắt đầu một công việc, hãy dừng lại ba hơi thở tự nhiên. Chú ý vai, bàn tay và lòng bàn chân. Rồi bắt đầu với sự hiện diện rõ ràng hơn.'
  ]},
  {id:'lang-nghe',title:'Lắng nghe để thương',label:'LÒNG TỪ BI',image:'assets/gallery-2.jpg',excerpt:'Một cách lắng nghe có thể mở ra những cuộc trò chuyện dịu dàng hơn.',paragraphs:[
    'Đôi khi người đối diện chỉ cần được lắng nghe mà chưa cần ngay một lời khuyên. Nếu vừa nghe vừa chuẩn bị phản bác, ta dễ bỏ lỡ cảm xúc thực sự của họ.',
    'Lắng nghe bằng tâm từ không có nghĩa là phải đồng ý với tất cả. Đó là giữ một khoảng mở để thấy người kia cũng có khó khăn và mong muốn được thấu hiểu.',
    'Thực tập ngay: trong một cuộc trò chuyện hôm nay, hãy đặt điện thoại xuống, để người kia nói trọn câu và hỏi một câu với sự quan tâm chân thành.'
  ]},
  {id:'buong-bo',title:'Buông bỏ điều không cần giữ',label:'SỐNG AN NHIÊN',image:'assets/gallery-3.jpg',excerpt:'Buông bỏ là học nhìn rõ và bớt nắm chặt, không phải trốn tránh trách nhiệm.',paragraphs:[
    'Có những điều ta tưởng phải giữ thật chặt mới được bình yên: một lời khen, một ý kiến, một hình ảnh về bản thân. Nhưng càng nắm chặt, tâm càng dễ mệt mỏi.',
    'Buông bỏ không phải là thờ ơ. Ta vẫn chăm sóc công việc, gia đình và các mối quan hệ, nhưng học cách hành động mà không để mọi kết quả quyết định giá trị của mình.',
    'Thực tập ngay: hãy gọi tên một điều bạn không thể kiểm soát và một hành động nhỏ bạn thực sự có thể làm hôm nay.'
  ]},
  {id:'tu-dieu-de',title:'Bốn sự thật giữa đời thường',label:'GIÁO LÝ NỀN TẢNG',image:'assets/gallery-4.jpg',excerpt:'Một cách gần gũi để bước đầu tiếp cận Tứ Diệu Đế.',paragraphs:[
    'Giáo lý Tứ Diệu Đế được trình bày trong Kinh Chuyển Pháp Luân: có khổ, có nguyên nhân của khổ, có khả năng chấm dứt khổ và có con đường thực tập dẫn đến sự chấm dứt ấy.',
    'Khi gặp điều bất như ý, ta có thể bắt đầu bằng việc nhận diện cảm giác khó chịu thay vì phủ nhận. Sau đó nhìn xem sự mong cầu, sợ hãi hay thói quen nào đang tiếp sức cho cảm giác ấy.',
    'Thực tập ngay: viết ra một tình huống khiến bạn phiền lòng, điều bạn đang mong đợi và một hành động thiện lành để thay đổi cách ứng xử.'
  ]}
 ];
 if(typeof __gioAssets!=='undefined')talks.forEach(t=>{t.image=__gioAssets[t.image]||t.image});
 const chants={
  peace:'Nguyện hôm nay, tôi giữ một tâm an lành.\nNguyện mỗi lời nói được cất lên với sự chân thành.\nNguyện từng việc làm giúp giảm bớt khổ đau.\nNguyện biết dừng lại trước khi làm tổn thương ai.\nNguyện cho tất cả chúng sinh được sống trong bình an.',
  kindness:'Tôi xin học nhìn mọi người bằng đôi mắt cảm thông.\nMong tôi được an ổn và biết chăm sóc chính mình.\nMong những người tôi thương được an vui.\nMong những người còn bất đồng với tôi được nhẹ lòng.\nMong muôn loài được sống trong sự an lành.',
  dedication:'Tôi xin biết ơn những điều tốt đẹp hôm nay.\nXin dùng hiểu biết để nuôi dưỡng tình thương.\nXin dùng lời nói dịu dàng để nối gần khoảng cách.\nXin làm một việc thiện dù rất nhỏ bé.\nNguyện cho điều lành được lan xa như gió mát.',
  morning:'Nam mô Bổn Sư Thích Ca Mâu Ni Phật.\nCon xin hướng tâm về Tam bảo.\nHôm nay, nguyện giữ lời nói chân thật, việc làm thiện lành và tâm ý sáng trong.\nNguyện không gây tổn hại và học cách hiểu, thương mọi người.\nNguyện hồi hướng việc lành đến tất cả chúng sinh.',
  night:'Nam mô Bổn Sư Thích Ca Mâu Ni Phật.\nCon nhìn lại ngày đã qua trong chánh niệm.\nĐiều thiện đã làm, xin trân trọng và tiếp tục.\nĐiều chưa đúng, con xin nhận biết và phát nguyện sửa đổi.\nMong mọi người được bình an; xin hồi hướng điều thiện trong ngày.',
  family:'Con xin kính nhớ công ơn ông bà, cha mẹ và những người đã thương yêu, chăm sóc con.\nNguyện nương những điều thiện con đã làm để bồi đắp lòng biết ơn, hiếu kính và sự tử tế.\nMong người thân hiện tiền và đã khuất được an lành theo nhân duyên.'
 };
 const soundscape={lotus:{title:'Hồ sen tĩnh lặng',image:'assets/gallery-3.jpg',hz:[196,294,392],wind:0.027,volume:0.075},bamboo:{title:'Gió qua rừng trúc',image:'assets/gallery-6.jpg',hz:[174.61,261.63,349.23],wind:0.078,volume:0.058},bell:{title:'Chuông sớm cửa thiền',image:'assets/gallery-4.jpg',hz:[220,329.63,440],wind:0.018,volume:0.09}};
 const player=q('#floatingPlayer'),playTitle=q('#floatingTitle'),playStatus=q('#floatingStatus'),playToggle=q('#floatingToggle');
 let mode='',currentKey='',playing=false,paused=false,token=0,utterance=null,audioContext=null,audioMaster=null,noiseSource=null,ambientOscillators=[],bellInterval=null;
 const savedVolume=()=>Number(q('#floatingVolume').value)/100;
 function setStatus(msg){playStatus.textContent=msg;playToggle.textContent=paused?'▶':'Ⅱ';playToggle.setAttribute('aria-label',paused?'Tiếp tục phát':'Tạm dừng')}
 function showPlayer(title,status){player.hidden=false;playTitle.textContent=title;setStatus(status)}
 function highlight(){qa('[data-sutra-audio]').forEach(el=>el.classList.toggle('selected',mode==='speech'&&currentKey===el.dataset.sutraAudio&&playing));qa('[data-sound]').forEach(el=>{const active=mode==='music'&&currentKey===el.dataset.sound&&playing;el.classList.toggle('is-playing',active);el.textContent=active?'Ⅱ  Đang phát · Bấm để tạm dừng':'▶  Bắt đầu lắng nghe'})}
 function tearDownAudio(){if(bellInterval){clearInterval(bellInterval);bellInterval=null}if(noiseSource){try{noiseSource.stop()}catch(_){ }noiseSource=null}ambientOscillators.forEach(o=>{try{o.stop()}catch(_){ }});ambientOscillators=[];if(audioContext){audioContext.close().catch(()=>{});audioContext=null}audioMaster=null}
 function stopAll(hide=true){token++;if('speechSynthesis' in window)window.speechSynthesis.cancel();tearDownAudio();playing=false;paused=false;mode='';currentKey='';utterance=null;highlight();if(hide)player.hidden=true}
 function finishSpeech(myToken){if(token!==myToken)return;playing=false;paused=false;mode='';currentKey='';utterance=null;setStatus('Đã phát xong');playToggle.textContent='▶';highlight();q('#listenButton').textContent='♫ Nghe phần diễn ý'}
 function playSpeech({key,title,text}){
   if(!('speechSynthesis' in window)||!('SpeechSynthesisUtterance' in window)){window.alert('Trình duyệt hiện chưa hỗ trợ đọc văn bản tiếng Việt. Bạn có thể đọc nội dung trên website.');return}
   if(playing&&mode==='speech'&&currentKey===key){togglePause();return}
   stopAll(false);mode='speech';currentKey=key;playing=true;paused=false;
   const thisToken=token;utterance=new SpeechSynthesisUtterance(text);utterance.lang='vi-VN';utterance.rate=.86;utterance.pitch=.96;utterance.volume=Math.max(.08,savedVolume());
   const vietVoice=window.speechSynthesis.getVoices().find(v=>v.lang.toLowerCase().startsWith('vi'));
   if(vietVoice)utterance.voice=vietVoice;
   utterance.onend=()=>finishSpeech(thisToken);
   utterance.onerror=(e)=>{if(e.error!=='interrupted'&&e.error!=='canceled')setStatus('Giọng đọc chưa sẵn sàng trên thiết bị');finishSpeech(thisToken)};
   showPlayer(title,'Đang đọc bằng giọng tiếng Việt của trình duyệt');highlight();
   window.speechSynthesis.speak(utterance);
   q('#listenButton').textContent='♫ Nghe phần diễn ý';
 }
 function playSutra(id){if(window.GioListen&&window.GioListen.has(id)){window.GioListen.play(id);return}const s=sutras.find(x=>x.id===id);if(!s)return;const text=`${s.name}. Đây là phần diễn ý tham khảo, không phải nguyên văn kinh Phật. `+s.sections.map(([heading,...rest])=>`${heading}. ${rest.join(' ')}`).join(' ');playSpeech({key:`sutra:${id}`,title:`Nghe diễn ý: ${s.name}`,text})}
 function tone(freq,duration=5,level=.1){if(!audioContext||!audioMaster)return;const now=audioContext.currentTime;const osc=audioContext.createOscillator(),env=audioContext.createGain();osc.type='sine';osc.frequency.value=freq;osc.connect(env).connect(audioMaster);env.gain.setValueAtTime(.0001,now);env.gain.exponentialRampToValueAtTime(level,now+.08);env.gain.exponentialRampToValueAtTime(.0001,now+duration);osc.start(now);osc.stop(now+duration+.05)}
 function createWind(level){const buffer=audioContext.createBuffer(1,Math.ceil(audioContext.sampleRate*2.5),audioContext.sampleRate);const arr=buffer.getChannelData(0);let last=0;for(let i=0;i<arr.length;i++){last=(last+(.12*(Math.random()*2-1)))/1.12;arr[i]=last*.35}noiseSource=audioContext.createBufferSource();noiseSource.buffer=buffer;noiseSource.loop=true;const low=audioContext.createBiquadFilter();low.type='lowpass';low.frequency.value=320;const gain=audioContext.createGain();gain.gain.value=level;noiseSource.connect(low).connect(gain).connect(audioMaster);noiseSource.start()}
 function startMusic(key){const s=soundscape[key];if(!s)return;if(playing&&mode==='music'&&currentKey===key){togglePause();return}stopAll(false);
   const AC=window.AudioContext||window.webkitAudioContext;if(!AC){window.alert('Thiết bị chưa hỗ trợ Web Audio. Hãy thử Chrome, Safari hoặc Edge.');return}
   try{audioContext=new AC();audioMaster=audioContext.createGain();audioMaster.gain.value=savedVolume();audioMaster.connect(audioContext.destination);createWind(s.wind);
    s.hz.forEach((hz,i)=>{const o=audioContext.createOscillator(),g=audioContext.createGain();o.type='sine';o.frequency.value=hz/(i===0?2:1);g.gain.value=s.volume/(i===0?1.8:3.8);o.connect(g).connect(audioMaster);o.start();ambientOscillators.push(o)});
    tone(s.hz[1]*2.0,7,.08);bellInterval=setInterval(()=>{if(!audioContext||audioContext.state!=='running')return;const notes=s.hz;const index=Math.floor(Math.random()*notes.length);tone(notes[index]*2,6,key==='bell'?.095:.055)},key==='bell'?5400:8900);
    mode='music';currentKey=key;playing=true;paused=false;showPlayer(s.title,'Âm thanh thiền tự tạo · Đang phát');highlight();
   }catch(e){console.error('Không tạo được âm thanh:',e);stopAll();window.alert('Chưa thể mở âm thanh trên trình duyệt này.')}
 }
 function togglePause(){if(!playing)return;if(mode==='speech'){if(paused)window.speechSynthesis.resume();else window.speechSynthesis.pause()}else if(mode==='music'&&audioContext){if(paused)audioContext.resume();else audioContext.suspend()}
 paused=!paused;setStatus(paused?'Đang tạm dừng':mode==='speech'?'Đang đọc bằng giọng máy':'Âm thanh thiền tự tạo · Đang phát');highlight()}
 // Danh sách nghe kinh do js/listen-v7-15.js dựng (giọng đọc MP3 + lời đọc theo câu).
 // Optional user-supplied practice text; no modern copyrighted sutra transcription is distributed.
 const chantChoice=q('#chantChoice'),chantText=q('#chantText');chantText.value=chants.peace;
 chantChoice.addEventListener('change',()=>{if(chantChoice.value!=='custom')chantText.value=chants[chantChoice.value];else chantText.value='';});
 chantText.addEventListener('input',()=>{if(chantChoice.value!=='custom')chantChoice.value='custom'});
 q('#chantReset').addEventListener('click',()=>{if(chantChoice.value==='custom')chantChoice.value='peace';chantText.value=chants[chantChoice.value];});
 q('#chantPlay').addEventListener('click',()=>{const t=chantText.value.trim();if(!t)return window.alert('Bạn hãy nhập nội dung muốn nghe đọc.');playSpeech({key:'chant:custom',title:'Tụng niệm · Lời nguyện',text:t})});
 // Editorial talks — no false attribution to monks or inherited copyrighted recordings.
 const talksById=new Map(talks.map(t=>[t.id,t]));let selectedTalk=talks[0].id;
 q('#talkGrid').innerHTML=talks.map((talk,i)=>`<button type="button" class="talk-card ${i===0?'selected':''}" data-talk="${talk.id}" aria-pressed="${i===0?'true':'false'}" aria-label="Đọc bài: ${talk.title}"><span class="talk-card-image"><img src="${talk.image}" loading="lazy" alt=""><span class="talk-card-num">${String(i+1).padStart(2,'0')}</span></span><span class="talk-card-body"><small>${talk.label}</small><strong>${talk.title}</strong><span class="talk-card-excerpt">${talk.excerpt}</span><span class="talk-card-read">ĐỌC BÀI CHIA SẺ <b aria-hidden="true">↗</b></span></span></button>`).join('');
 function showTalk(id,scroll=false){const t=talksById.get(id);if(!t)return;selectedTalk=id;q('#talkDetailTitle').textContent=t.title;q('#talkDetailTopic').textContent=t.label+' · BÀI CHIA SẺ';q('#talkDetailText').innerHTML=t.paragraphs.map(p=>`<p>${p}</p>`).join('');q('#talkDetailImage').src=t.image;q('#talkDetailImage').alt=`Minh họa: ${t.title}`;qa('[data-talk]').forEach(b=>{const active=b.dataset.talk===id;b.classList.toggle('selected',active);b.setAttribute('aria-pressed',String(active))});if(scroll)q('#talkDetail').scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'})}
 showTalk(selectedTalk);
 q('#talkGrid').addEventListener('click',e=>{const b=e.target.closest('[data-talk]');if(b)showTalk(b.dataset.talk,true)});
 qa('[data-sound]').forEach(button=>button.addEventListener('click',()=>startMusic(button.dataset.sound)));
 playToggle.addEventListener('click',togglePause);q('#floatingStop').addEventListener('click',()=>stopAll());q('#floatingClose').addEventListener('click',()=>stopAll());
 q('#floatingVolume').addEventListener('input',()=>{if(mode==='music'&&audioMaster)audioMaster.gain.value=savedVolume();if(mode==='speech'&&utterance)utterance.volume=savedVolume()});
 document.addEventListener('visibilitychange',()=>{if(document.hidden&&playing&&mode==='music'&&!paused)togglePause()});
 window.GioLanhMedia={playSutra,stopSpeech:()=>{if(mode==='speech')stopAll()},stopAll};
})();
