// ---------- Cabecera, render y entradas ----------
let lastScr = null, lastBolt = null;
function header(){
  $('bmus').classList.toggle('off', !AU.on.m); $('bsfx').classList.toggle('off', !AU.on.s);
  $('bmus').setAttribute('aria-pressed', AU.on.m); $('bsfx').setAttribute('aria-pressed', AU.on.s);
  const h=$('hacc'); if(h) h.innerHTML = !cloudOn() ? '' : CLOUD.user
    ? `<button class="ib av-b" data-a="acct" aria-label="Tu cuenta: ${esc(userName())}" title="${esc(userName())}">${avatar('sm')}</button>`
    : `<button class="btn sm ghost hin" data-a="acct" aria-label="Entrar o crear cuenta"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg><span>Entrar</span></button>`;
  const on = S && !['title','starter','gallery','sagas','board','codex','settings'].includes(scr) && S.map;
  $('prog').hidden = !on;
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
  document.body.classList.toggle('wide', scr==='combat' || scr==='map');
  $('screen').innerHTML = `<div>${tipHTML()}${V[scr]()}</div>`;
  if(scr==='event') rollDice($('screen'));
  if(scr==='map') maybeMoment();
  if(!$('menu').hidden && typeof menuHTML==='function') $('menu').innerHTML = menuHTML();   // el menú refleja la sesión y los avisos
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
  if(['cfg','cfganim','dcopy','dimport','derase','derase0','derase2'].includes(a)) return settingsAct(a, i);
  if(a==='tipok' || a==='tipoff' || a==='tipreset') return tipAct(a, i);
  if(a!=='order' && a!=='titan' && a!=='sol') sfx('click');
  if(a==='sagas'){ picked=[]; pendingNg=false; relicPick=[]; scr='sagas'; return render(); }
  if(a==='ngstart'){ pendingAlt=null; pendingSaga=0; pendingNg=true; picked=[]; relicPick=[]; scr='starter'; return render(); }
  if(a==='relic'){ relicPick = relicPick.includes(i) ? relicPick.filter(x=>x!==i) : relicPick.length<relicsMax(ngLevel()) ? relicPick.concat(i) : relicPick; return render(); }
  if(a==='diff'){ if(DIFF[i]) setCfg('diff', i); return render(); }
  if(a==='saga'){ const [g,alt]=String(i).split(':'); pendingSaga=+g; pendingAlt=alt||null; picked=[]; relicPick=[]; scr='starter'; return render(); }
  if(a==='gallery' || a==='home'){ scr = a==='home' ? 'title' : 'gallery'; return render(); }
  if(a==='rm'){ delete CUSTOM[i]; store.set('img', CUSTOM); return render(); }
  if(a==='rmau') return delMyAudio(i);
  if(a==='fit'){ const [k,op]=i.split('|'); fitAdjust(k, op); return render(); }
  if(a==='closesheet'){ $('sheet').hidden=true; return; }
  if(a==='rmall'){ CUSTOM={}; store.set('img', CUSTOM); NAMES={}; store.del('names'); applyNames(); packMsg=''; cloudDeletePack(); return render(); }
  if(a==='pespack'){ packMsg='Cargando el paquete…'; render(); fetch('titanlike-pes.json').then(r=>r.text()).then(t=>{ const n=mergePack(t); packMsg = n ? `Paquete «sin licencia» cargado: ${n} elementos. Tukasa, Patasha y Lavi se presentan.` : 'No se pudo leer el paquete.'; render(); if(n && typeof cloudUploadPack==='function' && CLOUD.user) cloudUploadPack(); }).catch(()=>{ packMsg='No se pudo descargar el paquete.'; render(); }); return; }
  if(a==='rmnames'){ NAMES={}; store.del('names'); applyNames(); packMsg='Nombres originales restaurados.'; if(typeof cloudUploadPack==='function' && CLOUD.user) cloudUploadPack(); return render(); }
  if(a==='daily'){ if(dailyDone()) return; newDaily(); return render(); }
  if(a==='codex'){ scr='codex'; return render(); }
  if(a==='login') return cloudLogin();
  if(a.startsWith('mail') && mailAct(a, i)) return;
  if(a==='logout') return cloudLogout();
  if(a==='board'){ CLOUD.tab = i || CLOUD.tab || 'general'; scr='board'; if(CLOUD.tab==='jefes') return cloudBossBoard(CLOUD.bossSel || BOSSES[0]); cloudBoard(); return; }
  if(a==='bossb') return cloudBossBoard(i);
  if(a==='arbol'){ scr='arbol'; window.scrollTo(0,0); return render(); }
  if(a==='moment') return showMoment(+i, 'Momento', true);
  if(a==='ficha'){ fichaId=i; scr='ficha'; window.scrollTo(0,0); return render(); }
  if(a==='comps'){ compsTab=i||'mine'; scr='comps'; if(compsTab==='all') return cloudComps(); return render(); }
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
  if(a==='pickst'){ const n = pendingNg ? 2 : startSize(pendingSaga); picked = picked.includes(i) ? picked.filter(x=>x!==i) : picked.length<n ? picked.concat(i) : picked; return render(); }
  if(a==='go' && pendingNg && picked.length===2){ newRun(picked, 0, undefined, {level:ngLevel(), relics:relicPick}); pendingNg=false; return render(); }
  if(a==='kitpw'){ relicPick = relicPick.includes(i) ? relicPick.filter(x=>x!==i) : relicPick.length<KIT_PW[pendingSaga] ? relicPick.concat(i) : relicPick; return render(); }
  if(a==='go' && !pendingNg && picked.length===startSize(pendingSaga)){ newRun(picked, pendingSaga, undefined, {powers:relicPick}); if(pendingAlt){ S.route[pendingSaga]=pendingAlt; store.set('run', S); } relicPick=[]; pendingAlt=null; return render(); }
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
  if(a==='speed'){ const ks=Object.keys(ANIM), n=ks[(ks.indexOf(CFG.anim)+1)%ks.length]; setCfg('anim', n); fast = n!=='normal'; const b=document.querySelector('[data-a=speed]'); if(b) b.textContent=`Animación: ${ANIM[n].n}`; return; }
  if(scr!=='combat' || !C.active || C.busy) return;
  if(a==='order'){
    if(C.pending && C.pending.kind===i){ C.pending=null; return render(); }
    if(i.startsWith('it:') && C.itemUsed) return;
    if(i==='skill' && (C.cd[C.active.id]>0 || S.gas<ROSTER[C.active.id].sk.gas)) return;
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
  if(ev.target.closest('#bmenu') || ev.target.closest('[data-a=acct]')){ auUnlock(); return openMenu(); }
  const l=ev.target.closest('[data-a=login]'); if(l){ if(!l.disabled) cloudLogin(); return; }
  const b=ev.target.closest('[data-s]'); if(!b) return;
  auUnlock(); toggleSound(b.dataset.s); header(); sfx('click');
});
$('screen').addEventListener('click', ev=>{
  const b=ev.target.closest('[data-a]'); if(!b || b.disabled) return;
  act(b.dataset.a, b.dataset.i);
});
$('screen').addEventListener('keydown', ev=>{
  if(ev.key!=='Enter' && ev.key!==' ') return;
  const lf=ev.target.closest('label.file'); if(lf){ ev.preventDefault(); const inp=document.getElementById(lf.htmlFor); if(inp) inp.click(); return; }
  const b=ev.target.closest('g[data-a]'); if(!b) return;
  ev.preventDefault(); act(b.dataset.a, b.dataset.i);
});
$('screen').addEventListener('change', ev=>{
  const f=ev.target; if(!f.dataset || !f.files || !f.files[0]) return;
  if(f.dataset.up) setCustom(f.dataset.up, f.files[0]);
  if(f.dataset.au) setMyAudio(f.dataset.au, f.files[0]);
  if(f.dataset.pack) importPack(f.files[0]);
});
// ---- ficha al mantener pulsado (móvil) o con clic derecho (escritorio) ----
function infoFor(el){
  const u=el.dataset.u; if(!u || !C) return null;
  if(u[0]==='t'){ const t=C.titans[+u.slice(1)]; if(!t) return null;
    const a=C.active, e=a?eff(a,t):1;
    return `<b>${t.n}</b><span class="lbl">${CLS[t.cls]}${t.boss?' · cambiante':''}${t.phase?' · segunda fase':''}</span>
      <p>${t.hp} / ${t.max} PV · ataque ${Math.round(t.atk)} · velocidad ${t.spd}</p>
      <p>${AI_TXT[aiOf(t)]}${t.intent?` Ahora apunta a ${t.intent==='all'?'todo el escuadrón':ROSTER[t.intent].n}.`:''}</p>
      ${a?`<p>${ROSTER[a.id].n} (${STYLE[ROSTER[a.id].st]}) le hace ×${String(e).replace('.',',')}.</p>`:''}
      ${[t.mark>0&&'Marcado: recibe +50 %.',t.stun>0&&'Derribado: pierde su turno.',t.blind>0&&'Cegado: falla el próximo ataque.',t.hard>0&&'Endurecido: recibe el 40 %.',t.alert>0&&`Alerta: no se deja cegar ni derribar durante ${t.alert} turno${t.alert>1?'s':''} más.`].filter(Boolean).map(x=>`<p>${x}</p>`).join('')}`; }
  if(u[0]==='s'){ const s=S.squad.find(x=>x.id===u.slice(1)); if(!s) return null; const R=ROSTER[s.id];
    const dodge = 5 + 5*Math.max(0, Math.floor((spdOf(s)-10)/3));
    return `<b>${R.n}</b><span class="lbl">${STYLE[R.st]} · nivel ${s.lvl}</span><p>${s.hp} / ${maxHp(s)} PV · ataque ${Math.round(atkOf(s))} · velocidad ${spdOf(s)} · esquiva ${dodge} %</p><p>${traitsOf(s.id).map(([k,v])=>`${SKILLS[k]} +${v}`).join(' · ')||'Sin rasgos'}.</p>
      <p><b>${R.sk.n}.</b> ${R.sk.d}</p>${pwOf(s.id).map(k=>`<p><b>${POWERS[k].n}.</b> ${POWERS[k].d}</p>`).join('')}`; }
  return null;
}
function showSheet(el){ const h=infoFor(el); if(!h) return false; $('sheet').innerHTML=`<div class="sheet-in">${h}<button class="btn sm" data-a="closesheet">Cerrar</button></div>`; $('sheet').hidden=false; return true; }
let pressT=null, pressed=false;
$('screen').addEventListener('pointerdown', ev=>{ const el=ev.target.closest('[data-u]'); if(!el || ev.pointerType==='mouse') return;
  pressed=false; clearTimeout(pressT); pressT=setTimeout(()=>{ pressed=showSheet(el); }, 480); });
['pointerup','pointercancel','pointerleave'].forEach(n=>$('screen').addEventListener(n, ()=>clearTimeout(pressT)));
$('screen').addEventListener('click', ev=>{ if(pressed){ pressed=false; ev.stopImmediatePropagation(); ev.preventDefault(); } }, true);
$('screen').addEventListener('contextmenu', ev=>{ const el=ev.target.closest('[data-u]'); if(el && showSheet(el)) ev.preventDefault(); });
$('sheet').addEventListener('click', ev=>{ if(ev.target.id==='sheet' || ev.target.closest('[data-a=closesheet]')) $('sheet').hidden=true; });

cloudInit();
render();
