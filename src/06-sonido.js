// ---------- Sonido: música original sintetizada, efectos y audio propio del jugador ----------
const AU = {ctx:null, out:null, sfxBus:null, bus:null, cur:null, want:null, timer:null, src:null,
            on:{m:store.get('mus')!==false, s:store.get('sfx')!==false}};
const TRACKS = {map:'Exploración', combat:'Combate', boss:'Jefe'};
const MY = {};   // audio propio: {name, data:ArrayBuffer, buf:AudioBuffer}
const hz = m => 440*Math.pow(2,(m-69)/12);
// Composiciones propias. chords: tríadas (MIDI); mel: 8 corcheas por compás (0 silencio, -1 mantener)
const SONGS = {
  map:{bpm:74, pad:.05, bass:'drone', drums:'march', lead:'soft',
    chords:[[50,53,57],[50,53,57],[46,50,53],[53,57,60],[43,46,50],[50,53,57],[45,49,52],[45,49,52]],
    mel:[[62,-1,65,-1,69,-1,-1,67],[65,-1,-1,-1,64,-1,62,-1],[70,-1,69,-1,65,-1,-1,67],[69,-1,-1,-1,72,-1,69,-1],
         [70,-1,-1,69,67,-1,70,-1],[69,-1,65,-1,62,-1,-1,-1],[64,-1,-1,69,73,-1,-1,-1],[76,-1,73,-1,69,-1,-1,-1]]},
  combat:{bpm:150, pad:.03, bass:'eighth', drums:'drive', lead:'brass', arp:1,
    chords:[[48,51,55],[48,51,55],[44,48,51],[46,50,53],[48,51,55],[51,55,58],[41,44,48],[43,47,50]],
    mel:[[72,-1,75,74,72,-1,67,-1],[72,-1,75,77,79,-1,-1,-1],[80,-1,79,77,75,-1,72,-1],[74,-1,77,-1,82,-1,-1,-1],
         [79,-1,75,79,84,-1,82,-1],[79,-1,-1,75,77,-1,79,-1],[80,-1,77,-1,72,-1,77,-1],[79,-1,-1,-1,74,71,74,-1]]},
  boss:{bpm:166, pad:.045, bass:'gallop', drums:'heavy', lead:'brass', stab:1,
    chords:[[50,53,57],[50,53,57],[46,50,53],[48,52,55],[50,53,57],[53,57,60],[43,46,50],[45,49,52]],
    mel:[[74,-1,74,77,76,-1,74,-1],[69,-1,-1,72,74,-1,-1,-1],[77,-1,77,81,79,-1,77,-1],[76,-1,-1,79,76,-1,72,-1],
         [74,-1,77,-1,81,-1,82,81],[79,-1,77,-1,72,-1,-1,-1],[82,-1,79,-1,77,-1,74,-1],[73,-1,76,-1,81,-1,-1,-1]]}
};
function auInit(){
  if(AU.ctx) return true;
  const A = window.AudioContext || window.webkitAudioContext; if(!A) return false;
  const c = AU.ctx = new A(), comp = c.createDynamicsCompressor();
  AU.out = c.createGain(); AU.out.gain.value=.9; AU.out.connect(comp); comp.connect(c.destination);
  AU.sfxBus = c.createGain(); AU.sfxBus.gain.value=.7*vol('sfx'); AU.sfxBus.connect(AU.out);
  const n = c.createBuffer(1, c.sampleRate, c.sampleRate), d = n.getChannelData(0);
  for(let i=0;i<d.length;i++) d[i]=Math.random()*2-1;
  AU.noise = n; return true;
}
// una nota: oscilador -> filtro -> envolvente
function tone(dest, type, f, t, dur, g, o={}){
  const c=AU.ctx, os=c.createOscillator(), ga=c.createGain(), fl=c.createBiquadFilter();
  os.type=type; os.frequency.setValueAtTime(f, t); if(o.to) os.frequency.exponentialRampToValueAtTime(o.to, t+dur);
  if(o.det) os.detune.value=o.det;
  fl.type='lowpass'; fl.frequency.value=o.cut||8000;
  const a=o.a||.01;
  ga.gain.setValueAtTime(0, t); ga.gain.linearRampToValueAtTime(g, t+a); ga.gain.setValueAtTime(g, t+Math.max(a, dur*.6)); ga.gain.linearRampToValueAtTime(0, t+dur);
  os.connect(fl); fl.connect(ga); ga.connect(dest); os.start(t); os.stop(t+dur+.05);
}
function noise(dest, t, dur, g, type, f, to){
  const c=AU.ctx, s=c.createBufferSource(), ga=c.createGain(), fl=c.createBiquadFilter();
  s.buffer=AU.noise; s.loop=true; fl.type=type; fl.frequency.setValueAtTime(f, t); if(to) fl.frequency.exponentialRampToValueAtTime(to, t+dur);
  ga.gain.setValueAtTime(g, t); ga.gain.exponentialRampToValueAtTime(.001, t+dur);
  s.connect(fl); fl.connect(ga); ga.connect(dest); s.start(t); s.stop(t+dur+.05);
}
const drum = {
  taiko(b,t,g=.5){ tone(b,'sine',120,t,.3,g,{to:42}); noise(b,t,.06,g*.3,'lowpass',500); },
  snare(b,t,g=.16){ noise(b,t,.13,g,'highpass',1600); tone(b,'triangle',190,t,.08,g*.6,{to:120}); },
  hat(b,t,g=.05){ noise(b,t,.035,g,'highpass',7000); }
};
function schedStep(S0, b, step, t, sd){
  const bar=Math.floor(step/16)%S0.chords.length, pos=step%16, ch=S0.chords[bar], barDur=sd*16;
  if(pos===0 && !S0.stab) ch.forEach((n,i)=>{ tone(b,'sawtooth',hz(n+12),t,barDur*1.02,S0.pad,{a:barDur*.25,cut:900,det:i*6-6}); tone(b,'sawtooth',hz(n),t,barDur*1.02,S0.pad,{a:barDur*.2,cut:700,det:7-i*5}); });
  if(S0.stab && (pos===0||pos===6||pos===10)) ch.forEach((n,i)=>tone(b,'sawtooth',hz(n+12),t,sd*2.6,S0.pad*1.5,{cut:1500,det:i*7-7}));
  const root=ch[0]-12;
  if(S0.bass==='drone' && pos===0){ tone(b,'triangle',hz(root),t,barDur,.16,{a:.2}); }
  if(S0.bass==='eighth' && pos%2===0) tone(b,'sawtooth',hz(root+(pos%8===6?12:0)),t,sd*1.7,.15,{cut:520});
  if(S0.bass==='gallop' && [0,2,3,4,6,7,8,10,11,12,14,15].includes(pos)) tone(b,'sawtooth',hz(root+(pos===14?7:0)),t,sd*.95,.16,{cut:480});
  if(S0.arp) tone(b,'triangle',hz(ch[[0,2,1,2][pos%4]]+24),t,sd*.8,.035,{cut:3000});
  if(S0.drums==='march'){ if(pos===0||pos===10) drum.taiko(b,t,.4); if(pos===12||pos===14||pos===15) drum.snare(b,t,.07); }
  if(S0.drums==='drive'){ if(pos===0||pos===6||pos===8) drum.taiko(b,t); if(pos===4||pos===12) drum.snare(b,t); if(pos%2===0) drum.hat(b,t); }
  if(S0.drums==='heavy'){ if([0,3,6,8,11,14].includes(pos)) drum.taiko(b,t,.55); if(pos===4||pos===12) drum.snare(b,t,.2); drum.hat(b,t,pos%4===2?.07:.035); if(pos===0&&bar%4===0) noise(b,t,.9,.12,'highpass',5000); }
  if(pos%2===0){
    const m=S0.mel[bar], i=pos/2, n=m[i];
    if(n>0){ let len=1; while(i+len<8 && m[i+len]===-1) len++;
      const d=sd*2*len*.96;
      if(S0.lead==='soft'){ tone(b,'triangle',hz(n),t,d,.11,{a:.06,cut:2400}); tone(b,'sine',hz(n+12),t,d,.03,{a:.08}); }
      else { tone(b,'sawtooth',hz(n),t,d,.07,{a:.015,cut:2300,det:-6}); tone(b,'square',hz(n),t,d,.035,{a:.015,cut:1800,det:6}); tone(b,'sawtooth',hz(n-12),t,d,.04,{cut:1200}); }
    }
  }
}
function stopMusic(){
  clearInterval(AU.timer); AU.timer=null;
  if(AU.src){ try{ AU.src.stop(); }catch(e){} AU.src=null; }
  if(AU.bus){ const b=AU.bus, t=AU.ctx.currentTime; b.gain.cancelScheduledValues(t); b.gain.setValueAtTime(b.gain.value, t); b.gain.linearRampToValueAtTime(0, t+.35); setTimeout(()=>b.disconnect(), 1500); AU.bus=null; }
  AU.cur=null;
}
function setTrack(k){
  AU.want = k;
  if(!AU.ctx || AU.cur===k) return;
  stopMusic();
  if(!k || !AU.on.m) return;
  const c=AU.ctx, b=AU.bus=c.createGain(); b.gain.value=.8*vol('mus'); b.connect(AU.out); AU.cur=k;
  if(MY[k]){
    const go = buf => { if(AU.cur!==k || AU.bus!==b) return; const s=AU.src=c.createBufferSource(); s.buffer=buf; s.loop=true; s.connect(b); s.start(); };
    if(MY[k].buf) return go(MY[k].buf);
    return c.decodeAudioData(MY[k].data.slice(0)).then(buf=>{ MY[k].buf=buf; go(buf); }).catch(()=>{ delete MY[k]; AU.cur=null; setTrack(k); });
  }
  const S0=SONGS[k], sd=60/S0.bpm/4; let step=0, next=c.currentTime+.12;
  AU.timer = setInterval(()=>{ while(next < c.currentTime+.25){ schedStep(S0, b, step, next, sd); step++; next+=sd; } }, 50);
}
function sfx(k){
  if(!AU.ctx || !AU.on.s) return;
  const b=AU.sfxBus, t=AU.ctx.currentTime+.005, seq=(ns,type,gap,d,g,o)=>ns.forEach((n,i)=>tone(b,type,hz(n),t+i*gap,d,g,o));
  ({ slash(){ noise(b,t,.14,.5,'bandpass',5200,900); },
     crit(){ noise(b,t,.16,.6,'bandpass',6000,800); tone(b,'sine',1760,t,.3,.14,{to:880}); },
     hit(){ tone(b,'sine',150,t,.24,.7,{to:45}); noise(b,t,.1,.3,'lowpass',420); },
     steam(){ noise(b,t,.95,.28,'highpass',2600); },
     boom(){ noise(b,t,.55,.8,'lowpass',340); tone(b,'sine',85,t,.55,.8,{to:30}); },
     bolt(){ noise(b,t,.09,.7,'highpass',3000); noise(b,t+.05,.7,.8,'lowpass',300); tone(b,'sine',90,t+.05,.6,.7,{to:28}); },
     roar(){ tone(b,'sawtooth',82,t,.7,.3,{to:55,cut:420,a:.08}); tone(b,'sawtooth',87,t,.7,.25,{to:50,cut:380,a:.08}); noise(b,t,.6,.12,'lowpass',700); },
     heal(){ seq([76,81],'sine',.09,.18,.16); },
     buff(){ seq([69,76],'triangle',.07,.14,.12); },
     miss(){ noise(b,t,.09,.16,'bandpass',2200,3600); },
     click(){ tone(b,'square',660,t,.035,.05,{cut:2000}); },
     win(){ seq([62,66,69,74,78],'triangle',.11,.4,.16); },
     lose(){ seq([62,58,55,50],'sawtooth',.28,.6,.13,{cut:700}); }
  }[k]||(()=>{}))();
}
function auUnlock(){
  if(!auInit()) return;
  if(AU.ctx.state==='suspended') AU.ctx.resume();
  if(AU.cur!==AU.want) setTrack(AU.want);
}
function toggleSound(w){
  AU.on[w]=!AU.on[w]; store.set(w==='m'?'mus':'sfx', AU.on[w]);
  if(w==='m'){ if(AU.on.m){ AU.cur=null; setTrack(AU.want); } else { const k=AU.want; stopMusic(); AU.want=k; } }
}
// ---- audio del jugador: se guarda en IndexedDB de este navegador ----
function idbDo(mode, fn){
  return new Promise((res, rej)=>{
    let r; try{ r=indexedDB.open('titanlike', 1); }catch(e){ return rej(e); }
    r.onupgradeneeded = ()=>r.result.createObjectStore('audio');
    r.onerror = ()=>rej(r.error);
    r.onsuccess = ()=>{ const tx=r.result.transaction('audio', mode), q=fn(tx.objectStore('audio')); tx.oncomplete=()=>res(q&&q.result); tx.onerror=()=>rej(tx.error); };
  });
}
function restart(k){ if(AU.want===k){ AU.cur=null; setTrack(k); } }
async function setMyAudio(k, file){
  const data = await file.arrayBuffer();
  await keepMyAudio(k, file.name, data, file.type);
  if(typeof cloudAudioUp==='function') cloudAudioUp(k);
}
// guarda una pista en memoria y en este navegador (también la usa la nube al descargar)
async function keepMyAudio(k, name, data, type){
  MY[k] = {name, data, type:type||''};
  try{ await idbDo('readwrite', st=>st.put({name, data, type:type||''}, k)); }catch(e){ MY[k].temp=true; }
  restart(k); render();
}
function delMyAudio(k){ delete MY[k]; idbDo('readwrite', st=>st.delete(k)).catch(()=>{}); if(typeof cloudAudioDel==='function') cloudAudioDel(k); restart(k); render(); }
let auMsg = '';
const myLoaded = Promise.all(Object.keys(TRACKS).map(k=>idbDo('readonly', st=>st.get(k)).then(v=>{ if(v && !MY[k]){ MY[k]=v; restart(k); if(scr==='gallery') render(); } }).catch(()=>{})));
