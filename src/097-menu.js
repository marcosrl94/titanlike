// ---------- Menú y pantalla de ajustes ----------
let confirmAbandon = false, confirmErase = false, dataMsg = '';
const inRun = () => !!(S && S.map && ['map','combat','reward','replace','event','camp','scene'].includes(scr));
function menuHTML(){
  const saved = !inRun() && migrateRun(store.get('run'));
  const item = (a, t, d, attrs='') => `<button class="mi" data-m="${a}" ${attrs}><b>${t}</b>${d?`<span>${d}</span>`:''}</button>`;
  return `<div class="menu-in" role="document">
    <div class="row" style="justify-content:space-between"><span class="lbl">Menú</span><button class="btn ghost sm" data-m="close" aria-label="Cerrar el menú">Cerrar</button></div>
    ${accountHTML('menu')}
    ${inRun() ? item('close', 'Volver a la partida', `${sagaLbl(S.wave)} · jornada ${dayOf(S.wave)}`) : ''}
    ${saved ? item('continue', 'Continuar expedición', `${sagaOf(saved.wave).n}, jornada ${dayOf(saved.wave)}`) : ''}
    ${item('title', 'Portada')}
    ${item('sagas', 'Nueva expedición', inRun() ? 'Sustituye a la expedición en curso' : '')}
    ${item('daily', 'Expedición del día', dailyDone() ? 'Ya la has jugado hoy' : `${dailyInfo().mod.n}: ${dailyInfo().mod.d}`, dailyDone() ? 'disabled' : '')}
    ${item('codex', 'Logros y códice', `${meta().ach.length} de ${ACH.length} logros`)}
    ${item('ficha', 'Fichas de personaje', 'Estadísticas, rasgos e historial de cada soldado')}
    ${item('comps', 'Escuadrones', `${statsOf().f} combates calificados${statsOf().g['S+']?' · '+statsOf().g['S+']+' S+':''}`)}
    
    ${item('gallery', 'Imágenes y música')}
    ${item('settings', 'Ajustes')}
    ${item('patch', 'Novedades', PATCH.t)}
    ${item('tips', 'Repetir los consejos', 'Vuelven a aparecer la primera vez que veas cada cosa')}
    ${inRun() ? (confirmAbandon
      ? `<div class="mi warn"><b>¿Abandonar la expedición?</b><span>Cuenta como derrota y no se puede deshacer.</span><div class="row"><button class="btn sm" data-m="abandon-yes">Sí, abandonar</button><button class="btn ghost sm" data-m="abandon-no">No</button></div></div>`
      : item('abandon', 'Abandonar expedición', 'Termina la expedición como derrota')) : ''}
  </div>`;
}
function openMenu(){ confirmAbandon=false; $('menu').innerHTML=menuHTML(); $('menu').hidden=false; const f=$('menu').querySelector('.mi, button'); if(f) f.focus(); }
function closeMenu(){ $('menu').hidden=true; }
function menuAct(m){
  if(m==='close') return closeMenu();
  if(m==='abandon'){ confirmAbandon=true; $('menu').innerHTML=menuHTML(); return; }
  if(m==='abandon-no'){ confirmAbandon=false; $('menu').innerHTML=menuHTML(); return; }
  closeMenu();
  if(m==='abandon-yes'){ confirmAbandon=false; if(C) C.busy=true; return lose(); }
  if(m==='title'){ scr='title'; return render(); }
  if(m==='tips') return tipAct('tipreset');
  if(m==='patch') return showPatch(PATCHES);
  if(m==='ficha') return act('ficha', fichaId);
  if(m==='settings'){ confirmErase=false; dataMsg=''; scr='settings'; return render(); }
  act(m==='sagas' ? 'sagas' : m==='continue' ? 'continue' : m, m==='board' ? 'general' : undefined);
}

// ---- pantalla de ajustes ----
// interruptor: id de la acción, si está activo, título y descripción
const sw = (id, on, t, d) => `<div class="set"><div><b>${t}</b>${d?`<span>${d}</span>`:''}</div><button class="sw ${on?'on':''}" role="switch" aria-checked="${!!on}" aria-label="${t}" data-a="cfg" data-i="${id}"><span>${on?'Sí':'No'}</span></button></div>`;
const tog = (k, t, d) => sw(k, CFG[k], t, d);
const slider = (k, t) => `<div class="set"><div><label for="cfg-${k}"><b>${t}</b></label><span class="num" id="cfg-${k}-v">${CFG[k]} %</span></div><input type="range" min="0" max="100" step="5" id="cfg-${k}" data-cfg="${k}" value="${CFG[k]}"></div>`;
V.settings = function(){
  const exp = JSON.stringify({titanlike:'progreso', v:1, meta:store.get('meta'), run:store.get('run'), tips:store.get('tips'), fit:store.get('fit'), cfg:CFG});
  return `<div><h2>Ajustes</h2><p class="dim">Se guardan en este navegador.</p></div>
    <div><button class="btn ghost" data-a="home">Volver</button></div>
    <section class="panel"><span class="lbl">Sonido</span>
      ${sw('music', AU.on.m, 'Música', 'Temas de exploración, combate y jefe.')}
      ${slider('mus','Volumen de la música')}
      ${sw('sound', AU.on.s, 'Efectos de sonido')}
      ${slider('sfx','Volumen de los efectos')}
    </section>
    <section class="panel"><span class="lbl">Juego</span>
      <div class="set"><div><b>Velocidad de las animaciones</b><span>También se cambia en combate.</span></div><div class="seg" role="radiogroup" aria-label="Velocidad">${Object.keys(ANIM).map(k=>`<button class="btn sm ${CFG.anim===k?'':'ghost'}" role="radio" aria-checked="${CFG.anim===k}" data-a="cfganim" data-i="${k}">${ANIM[k].n}</button>`).join('')}</div></div>
      ${tog('preview','Previsión de daño','Muestra sobre cada titán el daño de la orden elegida.')}
      ${tog('intent','Intenciones de los titanes','Muestra a quién atacará cada titán.')}
      ${sw('tipson', !tipsSeen.off, 'Consejos', 'Explicaciones la primera vez que aparece cada cosa.')}
    </section>
    <section class="panel"><span class="lbl">Accesibilidad</span>
      ${tog('flash','Destellos','Fogonazos de pantalla en rayos, golpes y explosiones.')}
      ${tog('story','Viñetas de historia','Una escena breve al entrar en cada zona del mapa. Se pueden volver a ver en el códice.')}
      ${tog('dice','Dados animados','El d20 rueda en pantalla en cada corte, esquiva y prueba de habilidad. Desactivado, la tirada queda solo en el registro.')}
      ${tog('shake','Sacudidas de pantalla')}
      ${tog('calm','Reducir movimiento','Animaciones mínimas y sin balanceo de los titanes.')}
      ${tog('big','Texto más grande')}
    </section>
    ${cloudOn() ? `<section class="panel"><span class="lbl">Cuenta</span>${accountHTML('settings')}</section>` : ''}
    <section class="panel"><span class="lbl">Datos</span>
      <div class="set col"><div><b>Copia del progreso</b><span>Sagas, logros, códice, partida en curso y ajustes. No incluye las imágenes.</span></div>
        <textarea id="cfg-data" rows="3" readonly aria-label="Copia del progreso">${esc(exp)}</textarea>
        <div class="row"><button class="btn ghost sm" data-a="dcopy">Copiar</button></div></div>
      <div class="set col"><div><label for="cfg-imp"><b>Restaurar una copia</b></label><span>Pega aquí una copia y pulsa Restaurar. Sustituye al progreso actual.</span></div>
        <textarea id="cfg-imp" rows="3" aria-label="Copia para restaurar"></textarea>
        <div class="row"><button class="btn ghost sm" data-a="dimport">Restaurar</button></div></div>
      <div class="set"><div><b>Borrar el progreso</b><span>Sagas, logros, códice y partida en curso. No borra imágenes ni ajustes.</span></div>
        ${confirmErase ? '<div class="row"><button class="btn sm danger" data-a="derase2">Sí, borrar</button><button class="btn ghost sm" data-a="derase0">Cancelar</button></div>' : '<button class="btn ghost sm" data-a="derase">Borrar progreso</button>'}</div>
      ${dataMsg ? `<p class="lbl" style="color:var(--gold)" role="status">${esc(dataMsg)}</p>` : ''}
    </section>`;
};
function settingsAct(a, i){
  if(a==='cfg'){
    if(i==='music') toggleSound('m'); else if(i==='sound') toggleSound('s');
    else if(i==='tipson'){ tipsSeen.off = !tipsSeen.off; store.set('tips', tipsSeen); }
    else setCfg(i, !CFG[i]);
    return render();
  }
  if(a==='cfganim'){ setCfg('anim', i); fast = i!=='normal'; return render(); }
  if(a==='dcopy'){ const t=$('cfg-data'); const done=()=>{ dataMsg='Copia copiada al portapapeles.'; render(); };
    try{ navigator.clipboard.writeText(t.value).then(done, ()=>{ t.select(); dataMsg='Selecciónala y cópiala a mano.'; render(); }); }catch(e){ t.select(); } return; }
  if(a==='dimport'){
    let d=null; try{ d=JSON.parse($('cfg-imp').value); }catch(e){}
    if(!d || d.titanlike!=='progreso' || typeof d.meta!=='object'){ dataMsg='Eso no es una copia de progreso de Titanlike.'; return render(); }
    store.set('meta', d.meta||{}); if(d.run) store.set('run', d.run); else store.del('run');
    if(d.tips) store.set('tips', d.tips); if(d.fit) store.set('fit', d.fit); if(d.cfg) store.set('cfg', d.cfg);
    tipsSeen=store.get('tips')||{}; FIT=store.get('fit')||{}; CFG=Object.assign({}, CFG_DEF, store.get('cfg')||{}); applyCfg();
    S=null; C=null; dataMsg='Copia restaurada.'; if(typeof cloudPush==='function') cloudPush(); return render();
  }
  if(a==='derase'){ confirmErase=true; return render(); }
  if(a==='derase0'){ confirmErase=false; return render(); }
  if(a==='derase2'){ ['meta','run','tips'].forEach(k=>store.del(k)); tipsSeen={}; S=null; C=null; confirmErase=false; dataMsg='Progreso borrado.'; return render(); }
}
$('menu').addEventListener('click', ev=>{
  if(ev.target.id==='menu') return closeMenu();
  const a=ev.target.closest('[data-a]'); if(a && !a.disabled){ if(a.dataset.a.startsWith('mail')){ mailAct(a.dataset.a, a.dataset.i); $('menu').innerHTML=menuHTML(); return; } if(a.dataset.a!=='login') closeMenu(); return act(a.dataset.a, a.dataset.a==='board'?'general':a.dataset.i); }
  const b=ev.target.closest('[data-m]'); if(b && !b.disabled) menuAct(b.dataset.m);
});
document.addEventListener('keydown', ev=>{
  if(ev.key!=='Escape') return;
  if(!$('sheet').hidden){ $('sheet').hidden=true; return; }
  if($('menu').hidden) openMenu(); else closeMenu();
});
$('screen').addEventListener('input', ev=>{
  const k=ev.target.dataset && ev.target.dataset.cfg; if(!k) return;
  CFG[k]=+ev.target.value; store.set('cfg', CFG); applyCfg();
  const v=$('cfg-'+k+'-v'); if(v) v.textContent=CFG[k]+' %';
});
applyCfg();
