// ---------- Cabecera, render y entradas ----------
let lastScr = null, lastBolt = null;
function header(){
  $('bmus').classList.toggle('off', !AU.on.m); $('bsfx').classList.toggle('off', !AU.on.s);
  $('bmus').setAttribute('aria-pressed', AU.on.m); $('bsfx').setAttribute('aria-pressed', AU.on.s);
  const on = S && !['title','starter','gallery','sagas','board','codex'].includes(scr) && S.map;
  $('gas').hidden = $('prog').hidden = !on;
  if(!on) return;
  let g=''; for(let i=0;i<S.gasMax;i++) g+=`<i class="${i<S.gas?'on':''}"></i>`;
  $('gasbar').innerHTML = S.gasMax>16 ? '' : g; $('gasn').textContent=`${S.gas}/${S.gasMax}`;
  const gi=sagaIx(S.wave), d=dayOf(S.wave), over=S.wave>TOTAL;
  $('sagabar').innerHTML = SAGAS.map((_,i)=>`<span class="${i<gi||over?'done':i===gi?'now':''}"></span>`).join('');
  let w=''; for(let i=1;i<=PER;i++) w+=`<span class="${i<d||over?'done':i===d?'now':''} ${i%5===0?'boss':''}"></span>`;
  $('wall').innerHTML=w;
  $('zname').textContent=`${sagaLbl(S.wave)} · ${zoneOf(S.wave).n}`;
  $('zwave').textContent=`Jornada ${d} de ${PER}`;
}
function render(){
  header();
  $('screen').innerHTML = `<div>${tipHTML()}${V[scr]()}</div>`;
  if(scr!==lastScr){
    if(scr==='over'){ setTrack(null); sfx('lose'); }
    else if(scr==='victory'){ setTrack('map'); sfx('win'); }
    else if(scr==='reward' && lastScr==='combat') sfx('win');
    lastScr=scr;
  }
  if(scr==='scene' && S.scene.k==='betray' && lastBolt!==S.scene){ lastBolt=S.scene; setTimeout(()=>{ if(scr!=='scene') return; boltAt({x:innerWidth/2, y:innerHeight*.45}); sfx('bolt'); flash('var(--gold)',.85); cls($('screen'),'shake'); }, 1900); }
  if(scr==='combat' || (scr==='scene' && S.scene.k==='betray')) setTrack(scr==='scene' || curNode().t==='b' ? 'boss' : 'combat');
  else if(scr!=='over') setTrack('map');
}
function act(a, i){
  if(a==='tipok' || a==='tipoff' || a==='tipreset') return tipAct(a, i);
  if(a!=='order' && a!=='titan' && a!=='sol') sfx('click');
  if(a==='sagas'){ picked=[]; scr='sagas'; return render(); }
  if(a==='saga'){ pendingSaga=+i; picked=[]; scr='starter'; return render(); }
  if(a==='gallery' || a==='home'){ scr = a==='home' ? 'title' : 'gallery'; return render(); }
  if(a==='rm'){ delete CUSTOM[i]; store.set('img', CUSTOM); return render(); }
  if(a==='rmau') return delMyAudio(i);
  if(a==='rmall'){ CUSTOM={}; store.set('img', CUSTOM); packMsg=''; cloudDeletePack(); return render(); }
  if(a==='daily'){ if(dailyDone()) return; newDaily(); return render(); }
  if(a==='codex'){ scr='codex'; return render(); }
  if(a==='login') return cloudLogin();
  if(a==='logout') return cloudLogout();
  if(a==='board'){ CLOUD.tab = i || CLOUD.tab || 'general'; scr='board'; cloudBoard(); return; }
  if(a==='rename'){ const f=document.getElementById('nm'); return cloudRename(f && f.value); }
  if(a==='continue'){
    S=migrateRun(store.get('run')); C=null;
    if(!S){ scr='sagas'; return render(); }
    if(S.scene){ scr='scene'; return render(); }
    if(S.rewards){ scr='reward'; return render(); }
    if(S.pend && S.pend.k==='fight') return startWave();
    scr = S.pend ? S.pend.k : 'map'; return render();
  }
  if(a==='start'){ newRun([i], 0); return render(); }
  if(a==='pickst'){ picked = picked.includes(i) ? picked.filter(x=>x!==i) : picked.length<3 ? picked.concat(i) : picked; return render(); }
  if(a==='go' && picked.length===3){ newRun(picked, pendingSaga); return render(); }
  if(a==='node'){ const [r,j]=i.split(',').map(Number); return enterNode(r,j); }
  if(a==='reward'){ const r=S.rewards[i];
    if(r.t==='upg'){ applyUpg(r.id); return tookReward(+i); }
    if(r.t==='item'){ (S.items=S.items||[]).push(r.id); return tookReward(+i); }
    if(S.squad.length<4){ recruit(r.id); return tookReward(+i); }
    pendingRec={id:r.id, i:+i}; scr='replace'; return render(); }
  if(a==='swap' && scr==='replace'){ recruit(pendingRec.id, i); return tookReward(pendingRec.i); }
  if(a==='back'){ scr='reward'; return render(); }
  if(a==='camp'){ CAMP[i].f(); return advance(); }
  if(a==='evopt'){ S.pend.res = EVENTS[S.pend.i].o[i].f(); store.set('run', S); return render(); }
  if(a==='evok'){ if(S.q && S.q.length){ S.after='advance'; return nextScene(); } return advance(); }
  if(a==='scn') return sceneAct(i);
  if(a==='inject'){ S.q=[{k:'drop', p:NINE.find(k=>S.pw[k]==='reserva'), src:'camp'}]; S.after='advance'; return nextScene(); }
  if(a==='speed'){ fast=!fast; store.set('fast', fast); const b=document.querySelector('[data-a=speed]'); if(b) b.textContent=`Velocidad ×${fast?2:1}`; return; }
  if(scr!=='combat' || !C.active || C.busy) return;
  if(a==='order'){
    if(C.pending && C.pending.kind===i){ C.pending=null; return render(); }
    if(i.startsWith('it:') && C.itemUsed) return;
    const tgt = i==='skill' ? ROSTER[C.active.id].sk.tgt : i.startsWith('pw:') ? POWERS[i.slice(3)].tgt : i.startsWith('it:') ? ITEMS[i.slice(3)].tgt : 'enemy';
    if(tgt==='none') return doAction(i);
    if(tgt==='enemy' && liveT().length===1) return doAction(i, liveT()[0]);
    C.pending={kind:i, tgt}; return render();
  }
  if(a==='titan' && C.pending) return doAction(C.pending.kind, C.titans[i]);
  if(a==='sol' && C.pending) return doAction(C.pending.kind, S.squad.find(s=>s.id===i));
}
document.addEventListener('pointerdown', auUnlock);
document.addEventListener('keydown', auUnlock);
document.querySelector('.snd').addEventListener('click', ev=>{
  const b=ev.target.closest('[data-s]'); if(!b) return;
  auUnlock(); toggleSound(b.dataset.s); header(); sfx('click');
});
$('screen').addEventListener('click', ev=>{
  const b=ev.target.closest('[data-a]'); if(!b || b.disabled) return;
  act(b.dataset.a, b.dataset.i);
});
$('screen').addEventListener('keydown', ev=>{
  if(ev.key!=='Enter' && ev.key!==' ') return;
  const b=ev.target.closest('g[data-a]'); if(!b) return;
  ev.preventDefault(); act(b.dataset.a, b.dataset.i);
});
$('screen').addEventListener('change', ev=>{
  const f=ev.target; if(!f.dataset || !f.files || !f.files[0]) return;
  if(f.dataset.up) setCustom(f.dataset.up, f.files[0]);
  if(f.dataset.au) setMyAudio(f.dataset.au, f.files[0]);
  if(f.dataset.pack) importPack(f.files[0]);
});
cloudInit();
render();
