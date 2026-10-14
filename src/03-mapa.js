// ---------- Mapa, nodos, recompensas y sagas ----------
let skipRunStart = false;   // la diaria registra su propia expedición
// partidas guardadas de versiones anteriores: se completan los campos nuevos en lugar de descartarlas
function migrateRun(r){
  if(!r || !r.v || r.v<3 || !r.map) return null;
  if(r.v===3){ Object.assign(r, {pw:{}, q:[], loyal:{}, pity:0, after:null, scene:null, note:null}); r.v=4; }
  r.items = r.items || []; r.napes = r.napes || 0; r.fallen = r.fallen || []; r.rel = r.rel || {}; r.diff = r.diff || 'explorador'; r.ng = r.ng || 0;
  return r;
}
const meta = () => Object.assign({unlocked:1, best:0, nine:[], endings:[], ach:[], codex:{t:{},s:{}}}, store.get('meta')||{});
function saveMeta(p){ store.set('meta', Object.assign(meta(), p)); if(typeof cloudPush==='function') cloudPush(); }
function rollType(r, z){
  const w = (z>0 ? r>=1 : r>=3) ? [['c',40],['e',18],['v',22],['k',20]] : [['c',50],['v',28],['k',22]];
  let x = Math.random()*w.reduce((a,b)=>a+b[1],0);
  for(const [t,p] of w){ x-=p; if(x<0) return t; }
  return 'c';
}
function genMap(z){   // z: zona global (3 por saga)
  const rows=[];
  for(let r=0;r<4;r++){
    let cols=[0,1,2].filter(()=>Math.random()<.75);
    if(cols.length<2) cols=pick([[0,1],[1,2],[0,2]]);
    rows.push(cols.map(c=>({c, t:r===0?'c':rollType(r, z), next:[]})));
  }
  if(!rows[3].some(n=>n.t==='k')) pick(rows[3]).t='k';
  for(let r=0;r<3;r++){
    const A=rows[r], B=rows[r+1];
    A.forEach(n=>{
      B.forEach((m,j)=>{ if(Math.abs(m.c-n.c)<=1 && Math.random()<.7) n.next.push(j); });
      if(!n.next.length){ let best=0; B.forEach((m,j)=>{ if(Math.abs(m.c-n.c)<Math.abs(B[best].c-n.c)) best=j; }); n.next.push(best); }
    });
    B.forEach((m,j)=>{ if(!A.some(n=>n.next.includes(j))){ let best=A[0]; A.forEach(n=>{ if(Math.abs(n.c-m.c)<Math.abs(best.c-m.c)) best=n; }); best.next.push(j); } });
  }
  rows[3].forEach(n=>n.next=[0]);
  rows.push([{c:1, t:'b', next:[]}]);
  return {z, rows, pos:null, path:[]};
}
function openNodes(){ const m=S.map; return m.pos ? m.rows[m.pos[0]][m.pos[1]].next.map(j=>[m.pos[0]+1, j]) : m.rows[0].map((_,j)=>[0,j]); }
// saga 0: un recluta de nivel 1. Sagas posteriores: tres veteranos con el equipo que traería una campaña en curso.
const KITS = [0, 10, 22, 36];
const KIT_PW = [0, 1, 2, 4];   // poderes de partida según la saga de inicio
const startSize = g => g>=2 ? 4 : 3;   // soldados con los que se empieza una saga avanzada
const startLvl = g => g*PER + 1 + 3*g;   // veteranía extra de quien ya ha recorrido las sagas anteriores
function newRun(ids, saga=0, diff){
  const w = saga*PER + 1;
  saveMeta({runs:(meta().runs||0)+1});
  S = {v:4, diff: diff || (typeof CFG!=='undefined' && DIFF[CFG.diff] ? CFG.diff : 'explorador'), ng:0, wave:w, squad:ids.map(id=>({id, lvl:saga?startLvl(saga):w, hp:0})), fallen:[], rel:{}, pw:{}, q:[], loyal:{}, pity:0, after:null, scene:null, note:null, gas:10+2*saga, gasMax:10+2*saga, map:genMap(saga*3), rewards:null, picks:0, pend:null, kit:[], items:[]};
  for(let i=0;i<KITS[saga];i++) S.kit.push(randomUpg());
  S.kitPw = KIT_PW[saga];
  S.squad.forEach(s=>{ s.hp=maxHp(s); bringPower(s.id); codex('s', s.id); });
  // quien empieza en una saga avanzada trae los poderes que de media se consiguen antes (medido en simulación)
  for(let i=0;i<S.kitPw;i++){ const miss=MINOR.filter(k=>!(k in S.pw)), who=S.squad.filter(hasRoom); if(miss.length&&who.length){ const s=pick(who); grant(pick(miss), s.id); s.hp=maxHp(s); } }
  C=null; scr='map'; store.set('run', S);
  if(S.diff==='recluta') S.runNote = 'Modo Recluta: esta expedición no puntúa en la clasificación.';
  else if(typeof cloudStartRun==='function' && !skipRunStart) cloudStartRun(saga, false);
}
function enterNode(r, j){
  if(!openNodes().some(o=>o[0]===r && o[1]===j)) return;
  S.map.pos=[r,j]; S.map.path.push(j);
  const t = curNode().t;
  if(t==='b'){ const boss=zoneOf(S.wave).boss, b=betrayer(boss); if(b) return startBetrayal(b, boss); }
  if(t==='v'){ const ok=EVENTS.map((e,i)=>i).filter(i=>!EVENTS[i].when || EVENTS[i].when()); S.pend={k:'event', i:seeded('ev'+S.wave+'-'+r+'-'+j, ()=>pick(ok)), res:null}; scr='event'; }
  else if(t==='k'){ S.pend={k:'camp'}; scr='camp'; }
  else S.pend={k:'fight'};
  store.set('run', S);
  if(S.pend.k==='fight') startWave(); else render();
}
// el nodo actual queda resuelto: vuelve al mapa (o abre la zona o la saga siguiente)
function advance(){
  const t = curNode().t, boss = t==='b';
  if(t==='v' || t==='k') S.squad.forEach(levelUp);   // la veteranía sube con cada jornada
  S.pend=null; S.rewards=null; S.picks=0; S.sagaDone=false; S.note=null; S.wave++; C=null;
  if(boss){ const z=S.map.z+1; S.map = seeded('map'+z, ()=>genMap(z)); }
  store.set('run', S); scr='map'; render();
}
const GAS_CAP = 20;
function addGasMax(n){ S.gasMax = Math.min(GAS_CAP, S.gasMax+n); }
function levelUp(s){ const b=maxHp(s); s.lvl++; s.hp += maxHp(s)-b; }
function healAll(p){ S.squad.forEach(s=>{ s.hp=Math.min(maxHp(s), s.hp+Math.round(maxHp(s)*p)); }); }
function hurtAll(p){ S.squad.forEach(s=>{ s.hp=Math.max(1, s.hp-Math.round(maxHp(s)*p)); }); }
function saveBest(w){ if(w>meta().best) saveMeta({best:w}); }
function win(){
  const t = curNode().t, sagaEnd = t==='b' && dayOf(S.wave)===PER, btr = S.pend && S.pend.btr, bossId = t==='b' ? C.titans[0].id : null;
  S.q = []; S.note = null;
  const lost = S.squad.filter(s=>s.hp<=0).length;
  C.titans.forEach(x=>{ if(x.hp<=0) codex('t', x.id); });
  if(t==='b'){ ach('primer_jefe'); if(!lost) ach('impecable'); }
  if(C.start===4 && alive().length===1) ach('solo');
  if(sagaEnd) ach('saga'+(sagaIx(S.wave)+1));
  if(S.wave>=30) ach('jornada30');
  S.squad.filter(s=>s.hp<=0).forEach(s=>{ S.fallen.push(s.id); if(pwOf(s.id).length){ S.note=`${nm(s)} ha caído. Su poder pasa a la reserva: se puede inyectar en un campamento.`; release(s.id); } });
  S.squad = alive();
  S.squad.forEach(levelUp);
  healAll(.10 + .10*rel('vendas') + (t==='b'?.25:0) + (sagaEnd?.3:0));
  S.gas = sagaEnd ? S.gasMax : Math.min(S.gasMax, S.gas+diffOf().gas);
  saveBest(S.wave);
  if(sagaEnd) saveMeta({unlocked:Math.max(meta().unlocked, Math.min(SAGAS.length, sagaIx(S.wave)+2))});
  if(btr && btr.id==='eren'){ S.fallen.push('eren'); btr.pws.forEach(k=>grant(k,'reserva')); S.erenFell=true; }
  else if(btr) S.q.push({k:'spare', id:btr.id, lvl:btr.lvl});
  else rollDrop(t, bossId);
  if(owned().length>=3) ach('tres_poderes');
  if(S.daily && sagaEnd){ finishDaily(true); if(typeof cloudFinishRun==='function') cloudFinishRun(S.runId, PER+1, null); store.del('run'); scr='victory'; return render(); }
  if(S.wave>=TOTAL){ S.ending=endingOf(); ach(S.ending==='retumbar' ? 'saga4' : S.ending); ach('saga4'); if(S.erenFell) ach('detener_eren'); if(typeof cloudFinishRun==='function') cloudFinishRun(S.runId, TOTAL+1, S.ending); const m=meta(); if(!m.endings.includes(S.ending)) saveMeta({endings:m.endings.concat(S.ending)}); store.del('run'); scr='victory'; return render(); }
  S.sagaDone = sagaEnd;
  S.picks = (t==='e' || sagaEnd ? 2 : 1) + (S.mod==='botin' ? 1 : 0);
  S.rewards = seeded('r'+S.wave+'-'+S.map.pos, ()=>genRewards(t)); S.pend=null; S.after='reward';
  nextScene();
}
function lose(){
  if(S.daily) finishDaily(false);
  if(typeof cloudFinishRun==='function') cloudFinishRun(S.runId, S.wave, null);
  S.squad.forEach(s=>S.fallen.push(s.id)); saveBest(S.wave-1);
  store.del('run'); scr='over'; render();
}
function recruitPool(){ const g=sagaIx(S.wave); return Object.keys(ROSTER).filter(id=>ROSTER[id].sg<=g && !S.squad.some(s=>s.id===id) && !S.fallen.includes(id)); }
function upgPool(){ return Object.keys(UPG).filter(k=>(!UPG[k].max || rel(k)<UPG[k].max) && (k!=='lanzas' || sagaIx(S.wave)>=1)); }
function genRewards(t){
  let cands = recruitPool();
  const rare = cands.filter(id=>ROSTER[id].rare);
  cands = t==='b' && rare.length ? rare : cands.filter(id=>!ROSTER[id].rare);
  const out=[], total = Math.min(5, S.picks+2);
  if(cands.length){ const a=pick(cands); out.push({t:'rec', id:a});
    const rest=cands.filter(c=>c!==a); if(S.squad.length<=2 && rest.length) out.push({t:'rec', id:pick(rest)}); }
  const hurt = S.squad.some(s=>s.hp < maxHp(s)*.7);
  const ups = upgPool().filter(k=>!['raciones','recarga','shadis'].includes(k)).sort(()=>Math.random()-.5);
  // de un solo uso: cierran el hueco cuando las apilables llegan a su tope
  const once = ['shadis'].concat(hurt?['raciones']:[], S.gas<S.gasMax-3?['recarga']:[]).sort(()=>Math.random()-.5);
  while(out.length<total){ const k = ups.pop() || once.pop() || pick(['shadis','raciones','recarga']); out.push({t:'upg', id:k}); }
  if((S.items||[]).length<3 && Math.random()<.45) out[out.length-1] = {t:'item', id:pick(Object.keys(ITEMS))};
  return out;
}
function applyUpg(k){
  const before = S.squad.map(maxHp);
  if(UPG[k].stack) S.rel[k]=rel(k)+1;
  if(k==='capa') S.squad.forEach((s,i)=>{ s.hp += maxHp(s)-before[i]; });
  if(k==='bombona'){ addGasMax(2); S.gas=S.gasMax; }
  if(k==='raciones') healAll(.45);
  if(k==='recarga') S.gas=Math.min(S.gasMax, S.gas+4);
  if(k==='shadis') S.squad.forEach(levelUp);
}
function randomUpg(){ const p=upgPool().filter(x=>UPG[x].stack); const k=p.length ? pick(p) : pick(['shadis','raciones','recarga']); applyUpg(k); return UPG[k].n; }
function recruit(id, replaceId, hpPct=1){
  if(replaceId){ if(pwOf(replaceId).length) S.note=`${ROSTER[replaceId].n} vuelve a las murallas. Su poder queda en la reserva.`; release(replaceId); S.squad = S.squad.filter(s=>s.id!==replaceId); }
  const s={id, lvl:Math.max(1,S.wave), hp:0}; S.squad.push(s); bringPower(id); s.hp=Math.max(1, Math.round(maxHp(s)*hpPct));
  codex('s', id); if(S.squad.length>=4) ach('escuadron');
}
function tookReward(i){
  S.rewards.splice(i,1); S.picks--;
  if(S.picks>0){ store.set('run', S); scr='reward'; return render(); }
  advance();
}
const CAMP = [
  {n:'Descansar', d:'Todo el escuadrón recupera el 40 % de sus PV.', f(){ healAll(.4); }},
  {n:'Entrenar', d:'Todo el escuadrón sube 1 nivel.', f(){ S.squad.forEach(levelUp); }},
  {n:'Reabastecer', d:'Depósito de gas lleno.', f(){ S.gas=S.gasMax; }}
];
// cada opción devuelve el texto del desenlace
const inParadis = () => sagaIx(S.wave)<3, inMarley = () => sagaIx(S.wave)>=3;
const has = id => S.squad.some(s=>s.id===id && s.hp>0);
const who = id => S.squad.find(s=>s.id===id);
const EVENTS = [
  {n:'Carro de suministros volcado', when:inParadis,d:'Un carro de la Guarnición yace en la cuneta. Las bombonas siguen atadas, pero entre los árboles se mueve algo.',
   o:[{l:'Cargar el gas y salir', d:'Depósito lleno.', f(){ S.gas=S.gasMax; return 'Llenáis las bombonas y os vais antes de que nadie os oiga.'; }},
      {l:'Rebuscar a fondo', d:'Una mejora al azar. Prueba de Sigilo (12): si falla, el ruido os cuesta un 15 % de PV.', f(){ const c=check('sigilo',12); if(!c.ok) hurtAll(.15); return `${c.txt} Bajo la lona aparece equipo intacto: ${randomUpg()}.${c.ok?' Nadie os oye.':' Un titán os alcanza por la espalda antes de montar.'}`; }}]},
  {n:'Recluta rezagado', d:'Un soldado herido os hace señas desde un tejado. Ha perdido a su escuadrón.',
   o:[{l:'Acogerlo', d:'Se une con la mitad de sus PV. Si no hay hueco, enseña lo que sabe: +1 nivel a todos.', f(){
        const p=recruitPool().filter(id=>!ROSTER[id].rare);
        if(S.squad.length<4 && p.length){ const id=pick(p); recruit(id, null, .5); return `${ROSTER[id].n} baja del tejado y se une al escuadrón.`; }
        S.squad.forEach(levelUp); return 'No hay sitio en la formación, pero os cuenta cómo sobrevivió tres días. Todos suben 1 nivel.'; }},
      {l:'Darle un caballo y seguir', d:'+3 de gas por no desviaros.', f(){ S.gas=Math.min(S.gasMax,S.gas+3); return 'Le dejáis un caballo de refresco y mantenéis la ruta.'; }}]},
  {n:'Frasco sin etiqueta', d:'En una mochila del laboratorio hay un frasco que burbujea. La nota dice «no beber (todavía)».',
   o:[{l:'Que alguien se lo beba', d:'Prueba de Aguante (13): +3 niveles si la supera; si no, pierde el 40 % de sus PV.', f(){
        const c=check('aguante',13), s=c.who;
        if(c.ok){ levelUp(s); levelUp(s); levelUp(s); return `${c.txt} ${nm(s)} tose, se pone en pie y parte una rama de un tajo. +3 niveles.`; }
        s.hp=Math.max(1, s.hp-Math.round(maxHp(s)*.4)); return `${c.txt} ${nm(s)} pasa una hora doblado en la cuneta. Pierde el 40 % de sus PV.`; }},
      {l:'Dejarlo donde está', d:'Descansáis un rato: cura el 12 %.', f(){ healAll(.12); return 'Nadie se atreve. Aprovecháis para beber agua, que es más seguro.'; }}]},
  {n:'Aldea abandonada', when:inParadis,d:'Casas reventadas desde dentro y ni una gota de sangre. Las despensas siguen llenas.',
   o:[{l:'Registrar las casas', d:'Prueba de Percepción (11): una mejora si la superáis; si no, emboscada y todos pierden el 20 % de PV.', f(){
        const c=check('percepcion',11);
        if(c.ok) return `${c.txt} En un establo hay material del Cuerpo: ${randomUpg()}.`;
        hurtAll(.2); return `${c.txt} Un anormal sale de un pajar. Escapáis, pero no ilesos: todos pierden el 20 % de PV.`; }},
      {l:'Acampar en las afueras', d:'Cura el 20 % a todos.', f(){ healAll(.2); return 'Hacéis noche lejos de las casas. Nadie duerme mucho, pero se descansa.'; }}]},
  {n:'Jeringa en un sótano', when:()=>sagaIx(S.wave)>=1 && Math.random()<.5, d:'Bajo una casa en ruinas hay un maletín de médico. Dentro, una jeringa con un líquido turbio y una etiqueta con un nombre que nadie reconoce.',
   o:[{l:'Quedárosla', d:'Un poder de los Nueve que aún no tengáis, al azar.', f(){
        const miss=NINE.filter(k=>!(k in S.pw)); if(!miss.length){ healAll(.2); return 'Ya tenéis los Nueve. La jeringa está vacía; aprovecháis para descansar.'; }
        const k=pick(miss); S.q.push({k:'drop', p:k, src:'event'}); return `La etiqueta lleva el nombre de un portador del ${POWERS[k].n}. Hay que decidir quién lo hereda.`; }},
      {l:'Romperla', d:'Nadie debería tener ese poder. Todos suben 1 nivel.', f(){ S.squad.forEach(levelUp); return 'La jeringa se hace añicos contra el suelo. Nadie dice nada en todo el día.'; }}]},
  {n:'Desertor en el camino', d:'Un soldado sin capa os ofrece su equipo a cambio de que no digáis que lo habéis visto.',
   o:[{l:'Aceptar el trato', d:'Una mejora al azar.', f(){ return `Os deja el macuto y desaparece entre los árboles: ${randomUpg()}.`; }},
      {l:'Convencerlo de volver', d:'El soldado más débil sube 2 niveles con lo que le enseña.', f(){
        const s=S.squad.slice().sort((a,b)=>a.lvl-b.lvl)[0]; levelUp(s); levelUp(s); return `Cabalga con vosotros un trecho y entrena a ${nm(s)} antes de marcharse. +2 niveles.`; }}]},
  // ---- eventos que dependen de quién va en el escuadrón ----
  {n:'La despensa del oficial', when:()=>inParadis() && has('sasha'), d:'Sasha ha encontrado la despensa de un oficial de la Policía Militar. Hay una patata cocida encima de la mesa.',
   o:[{l:'Que se la coma', d:'Sasha sube 2 niveles. El escándalo os cuesta 2 de gas.', f(){ const s=who('sasha'); levelUp(s); levelUp(s); S.gas=Math.max(0,S.gas-2); return 'Sasha se la come entera mirando al oficial a los ojos. Corréis sin parar hasta el bosque.'; }},
      {l:'Repartir la comida', d:'Todo el escuadrón recupera el 20 % de sus PV.', f(){ healAll(.2); return 'Sasha reparte con lágrimas en los ojos. Nadie había comido caliente en una semana.'; }}]},
  {n:'Entregad vuestro corazón', when:()=>has('erwin'), d:'Antes de la carga, Erwin reúne al escuadrón. Nadie sabe cuántos volverán.',
   o:[{l:'Escuchar el discurso', d:'Todos suben 1 nivel y +1 de gas máximo.', f(){ S.squad.forEach(levelUp); addGasMax(1); S.gas=Math.min(S.gasMax,S.gas+1); return 'Nadie dice nada cuando termina. Todos se ajustan el equipo a la vez.'; }},
      {l:'Pedirle que descanse', d:'Erwin recupera todos sus PV.', f(){ const s=who('erwin'); s.hp=maxHp(s); return 'Erwin duerme por primera vez en días. Nadie se atreve a despertarlo.'; }}]},
  {n:'Un titán para estudiar', when:()=>inParadis() && has('hange'), d:'Hange quiere capturar vivo a un titán de 4 metros que duerme junto al camino.',
   o:[{l:'Ayudar a capturarlo', d:'Una mejora al azar. Todos pierden el 15 % de sus PV.', f(){ hurtAll(.15); return `Hange anota durante horas. Al final reparte material de su laboratorio: ${randomUpg()}.`; }},
      {l:'Convencerla de seguir', d:'Hange sube 2 niveles de pura frustración.', f(){ const s=who('hange'); levelUp(s); levelUp(s); return 'Hange protesta todo el camino. Por la noche entrena sola.'; }}]},
  {n:'Cuartel abandonado', when:()=>has('levi'), d:'El único refugio en kilómetros es un cuartel lleno de polvo. Levi se niega a dormir así.',
   o:[{l:'Limpiarlo de arriba abajo', d:'Todos suben 1 nivel. Gastáis 2 de gas.', f(){ S.squad.forEach(levelUp); S.gas=Math.max(0,S.gas-2); return 'Al amanecer el suelo brilla. Levi asiente una vez. Es lo más parecido a un elogio.'; }},
      {l:'Dormir tal cual', d:'Cura el 30 %, pero Levi pierde el 20 % de sus PV del disgusto.', f(){ healAll(.3); const s=who('levi'); s.hp=Math.max(1,s.hp-Math.round(maxHp(s)*.2)); return 'Todos duermen menos Levi, que pasa la noche mirando una mancha.'; }}]},
  {n:'Algo en el viento', when:()=>inParadis() && has('mike'), d:'Mike levanta la cabeza y olfatea. Hay titanes cerca, muchos.',
   o:[{l:'Rodearlos', d:'Depósito de gas lleno y cura el 10 %.', f(){ S.gas=S.gasMax; healAll(.1); return 'Dais un rodeo de medio día. No os ve ninguno.'; }},
      {l:'Tenderles una trampa', d:'Todos suben 2 niveles y pierden el 25 % de sus PV.', f(){ S.squad.forEach(s=>{ levelUp(s); levelUp(s); }); hurtAll(.25); return 'La trampa funciona a medias. Volvéis cubiertos de vapor y de experiencia.'; }}]},
  {n:'Puñetazos en el establo', when:()=>has('eren') && has('jean'), d:'Eren y Jean llevan toda la tarde discutiendo. Ahora ruedan por el suelo del establo.',
   o:[{l:'Dejar que se desahoguen', d:'Ambos suben 2 niveles y pierden el 20 % de sus PV.', f(){ ['eren','jean'].forEach(id=>{ const s=who(id); levelUp(s); levelUp(s); s.hp=Math.max(1,s.hp-Math.round(maxHp(s)*.2)); }); return 'Acaban sangrando y riéndose. Al día siguiente luchan espalda con espalda.'; }},
      {l:'Separarlos', d:'Todo el escuadrón recupera el 15 %.', f(){ healAll(.15); return 'Mikasa levanta a Eren del cuello de la camisa. Se acabó la pelea.'; }}]},
  {n:'La bufanda', when:()=>has('mikasa') && has('eren'), d:'Eren está herido. Mikasa no se separa de él en toda la noche.',
   o:[{l:'Hacer guardia con ella', d:'Eren y Mikasa recuperan todos sus PV.', f(){ ['eren','mikasa'].forEach(id=>{ const s=who(id); s.hp=maxHp(s); }); return 'Por la mañana Mikasa se ajusta la bufanda y sale la primera.'; }},
      {l:'Ponerla a entrenar', d:'Mikasa sube 3 niveles.', f(){ const s=who('mikasa'); levelUp(s); levelUp(s); levelUp(s); return 'Mikasa entrena hasta que no queda un árbol sin marcas de cuchilla.'; }}]},
  {n:'El mapa de Armin', when:()=>has('armin'), d:'Armin pasa la noche dibujando un mapa con las rutas de los titanes.',
   o:[{l:'Seguir su ruta', d:'+3 de gas y cura el 15 %.', f(){ S.gas=Math.min(S.gasMax,S.gas+3); healAll(.15); return 'La ruta de Armin os ahorra dos combates y un río.'; }},
      {l:'Usarlo para entrenar', d:'Todos suben 1 nivel.', f(){ S.squad.forEach(levelUp); return 'Armin explica cada flanqueo con piedras sobre la mesa.'; }}]},
  {n:'La aldea de Ragako', when:()=>inParadis() && has('connie'), d:'Es el pueblo de Connie. No queda nadie, y en su casa hay un titán tumbado que no puede moverse.',
   o:[{l:'Quedarse a investigar', d:'Una mejora al azar. Connie pierde el 30 % de sus PV.', f(){ const s=who('connie'); s.hp=Math.max(1,s.hp-Math.round(maxHp(s)*.3)); return `Connie no dice una palabra. Entre las casas encontráis equipo de la Guarnición: ${randomUpg()}.`; }},
      {l:'Seguir sin mirar atrás', d:'Connie sube 2 niveles.', f(){ const s=who('connie'); levelUp(s); levelUp(s); return 'Connie cabalga delante todo el día. Nadie le pregunta.'; }}]},
  {n:'Una reina en el escuadrón', when:()=>inParadis() && has('historia'), d:'Un pueblo reconoce a Historia y os ofrece lo poco que tiene.',
   o:[{l:'Aceptar la ayuda', d:'Todos recuperan el 35 % de sus PV.', f(){ healAll(.35); return 'Comida, vendas y camas limpias. Historia da las gracias casa por casa.'; }},
      {l:'Rechazarla', d:'Historia sube 2 niveles y el escuadrón 1.', f(){ S.squad.forEach(levelUp); levelUp(who('historia')); return 'Historia insiste en que el pueblo lo necesita más. Nadie discute con ella.'; }}]},
  // ---- eventos generales ----
  {n:'Mercader de la Policía Militar', when:inParadis,d:'Un soldado del interior vende material del Cuerpo de Exploración a precio de oro. Acepta gas.',
   o:[{l:'Pagar 4 de gas', d:'Una mejora al azar.', f(){ if(S.gas<4) return 'No os llega el gas. El soldado se ríe y se va.'; S.gas-=4; return `Os vende una caja sin abrir: ${randomUpg()}.`; }},
      {l:'Denunciarlo', d:'Todos suben 1 nivel por la reprimenda que os ahorráis.', f(){ S.squad.forEach(levelUp); return 'El capitán os felicita y os da el día libre para entrenar.'; }}]},
  // ---- Marley (saga 4) ----
  {n:'Brazaletes de la zona de internamiento', when:inMarley, d:'En Liberio todos los eldianos llevan brazalete. Con uno puesto, nadie os mira dos veces.',
   o:[{l:'Llevarlos y pasar desapercibidos', d:'Depósito de gas lleno y cura el 10 %.', f(){ S.gas=S.gasMax; healAll(.1); return 'Cruzáis la zona de internamiento con la cabeza gacha. Nadie os para.'; }},
      {l:'Quitároslos', d:'Todos suben 1 nivel; una patrulla os descubre: −10 % de PV.', f(){ S.squad.forEach(levelUp); hurtAll(.1); return 'Eren es el primero en tirarlo al suelo. La patrulla os cuesta sangre, pero nadie vuelve a ponérselo.'; }}]},
  {n:'El festival de los Tybur', when:inMarley, d:'Liberio celebra el festival. Willy Tybur va a hablar ante embajadores de medio mundo.',
   o:[{l:'Escuchar entre el público', d:'Todos suben 1 nivel.', f(){ S.squad.forEach(levelUp); return 'Escucháis la historia de Helos y la verdad sobre Paradis. Nadie aplaude.'; }},
      {l:'Ocupar posiciones en los tejados', d:'Una mejora al azar.', f(){ return `Desde arriba se ve todo el escenario. En un desván encontráis material: ${randomUpg()}.`; }}]},
  {n:'El dirigible de Hange', when:inMarley, d:'El dirigible espera sobre las nubes. Se puede subir a bordo una noche.',
   o:[{l:'Dormir a bordo', d:'Cura el 30 %.', f(){ healAll(.3); return 'Es la primera noche sin guardias en semanas. El motor arrulla.'; }},
      {l:'Cargar bombonas del almacén', d:'Depósito lleno y +1 de gas máximo.', f(){ addGasMax(1); S.gas=S.gasMax; return 'Bajáis con el equipo nuevo y las bombonas llenas.'; }}]},
  {n:'Dos candidatos a guerrero', when:inMarley, d:'Dos críos con brazalete os siguen desde el muelle. Quieren ser guerreros de Marley.',
   o:[{l:'Dejarlos marchar', d:'Cura el 15 %.', f(){ healAll(.15); return 'Se van corriendo. Os sentáis un rato antes de seguir.'; }},
      {l:'Seguirlos hasta el cuartel', d:'Prueba de Sigilo (12): una mejora si la superáis; si no, emboscada y todos pierden el 20 %.', f(){
        const c=check('sigilo',12);
        if(c.ok) return `${c.txt} Os llevan hasta un almacén del ejército: ${randomUpg()}.`;
        hurtAll(.2); return `${c.txt} Era una trampa de los guerreros. Salís a tiros de la zona.`; }}]},
  {n:'Puerto de Liberio', when:inMarley, d:'En el puerto hay un carguero de suministros con la guardia cambiando de turno.',
   o:[{l:'Vaciar la bodega', d:'Una mejora al azar y +2 de gas.', f(){ S.gas=Math.min(S.gasMax,S.gas+2); return `Sacáis cajas durante media hora: ${randomUpg()}.`; }},
      {l:'Hundirlo', d:'Todos suben 1 nivel y pierden el 10 %.', f(){ S.squad.forEach(levelUp); hurtAll(.1); return 'El barco se va a pique con la guardia a bordo. Os llevan dos balas de recuerdo.'; }}]},
  {n:'Las trincheras', when:inMarley, d:'Delante del fuerte hay un laberinto de trincheras vacías. Huele a pólvora.',
   o:[{l:'Avanzar por las trincheras', d:'Todos suben 2 niveles y pierden el 15 %.', f(){ S.squad.forEach(s=>{ levelUp(s); levelUp(s); }); hurtAll(.15); return 'Aprendéis a moveros entre alambradas. No era lo vuestro, hasta hoy.'; }},
      {l:'Rodear el fuerte', d:'Depósito de gas lleno.', f(){ S.gas=S.gasMax; return 'Un camino largo, pero sin un solo disparo. Rellenáis el gas en un puesto abandonado.'; }}]},
  {n:'Tormenta', d:'Una tormenta cierra el camino. Se oyen pasos enormes entre los truenos.',
   o:[{l:'Refugiarse en una cueva', d:'Cura el 25 %.', f(){ healAll(.25); return 'La tormenta pasa de largo, y los pasos también.'; }},
      {l:'Avanzar de noche', d:'Todos suben 1 nivel y pierden el 10 % de sus PV.', f(){ S.squad.forEach(levelUp); hurtAll(.1); return 'Avanzáis a ciegas y al amanecer estáis muy lejos.'; }}]},
  {n:'Cañón de la Guarnición', when:inParadis,d:'Una batería de la Guarnición pide ayuda para mover un cañón hasta la muralla.',
   o:[{l:'Ayudar', d:'+1 de gas máximo y +2 de gas; todos pierden el 10 % de PV.', f(){ addGasMax(1); S.gas=Math.min(S.gasMax,S.gas+2); hurtAll(.1); return 'En agradecimiento os dejan dos bombonas nuevas.'; }},
      {l:'Seguir', d:'Nada cambia.', f(){ return 'Seguís el camino. A lo lejos se oye el primer cañonazo.'; }}]},
  {n:'Un titán dormido', when:inParadis,d:'En mitad del camino duerme un titán de 10 metros. No hay forma de rodearlo sin hacer ruido.',
   o:[{l:'Ir a por su nuca', d:'Prueba de Sigilo (11): todos suben 2 niveles si la superáis; si no, todos pierden el 25 %.', f(){
        const c=check('sigilo',11);
        if(c.ok){ S.squad.forEach(s=>{ levelUp(s); levelUp(s); }); return `${c.txt} Un solo corte limpio. El vapor tarda una hora en disiparse.`; }
        hurtAll(.25); return `${c.txt} Se despierta a mitad del salto. Salís vivos, que no es poco.`; }},
      {l:'Esperar a que se vaya', d:'Cura el 15 %.', f(){ healAll(.15); return 'Tarda toda la tarde en marcharse. Aprovecháis para curar heridas.'; }}]},
  {n:'Huérfanos en el camino', when:inParadis,d:'Tres niños caminan solos hacia la muralla. Están a dos días de distancia.',
   o:[{l:'Escoltarlos', d:'Todos suben 2 niveles; gastáis 3 de gas.', f(){ S.squad.forEach(s=>{ levelUp(s); levelUp(s); }); S.gas=Math.max(0,S.gas-3); return 'Llegan a la puerta. Uno de ellos dice que quiere alistarse.'; }},
      {l:'Indicarles el camino', d:'+1 de gas.', f(){ S.gas=Math.min(S.gasMax,S.gas+1); return 'Les dais agua y una bengala. Esperáis hasta verlos desaparecer.'; }}]},
  {n:'Bengala verde', when:inParadis,d:'Una bengala verde sube a lo lejos: otro escuadrón ha encontrado algo.',
   o:[{l:'Ir hacia ella', d:'Prueba de Percepción (12): una mejora si la superáis; si no, todos pierden el 20 %.', f(){
        const c=check('percepcion',12);
        if(c.ok) return `${c.txt} Es un depósito de suministros intacto: ${randomUpg()}.`;
        hurtAll(.2); return `${c.txt} Llegáis tarde. Solo quedan titanes y equipo roto.`; }},
      {l:'Mantener la ruta', d:'Depósito de gas lleno.', f(){ S.gas=S.gasMax; return 'La disciplina también salva vidas. Llenáis el gas en un puesto de paso.'; }}]},
];
