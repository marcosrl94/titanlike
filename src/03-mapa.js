// ---------- Mapa, nodos, recompensas y sagas ----------
const meta = () => Object.assign({unlocked:1, best:0, nine:[], endings:[]}, store.get('meta')||{});
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
const KIT_PW = [0, 1, 2, 2];   // mejoras de partida según la saga de inicio
function newRun(ids, saga=0){
  const w = saga*PER + 1;
  saveMeta({runs:(meta().runs||0)+1});
  S = {v:4, wave:w, squad:ids.map(id=>({id, lvl:w, hp:0})), fallen:[], rel:{}, pw:{}, q:[], loyal:{}, pity:0, after:null, scene:null, note:null, gas:8+4*saga, gasMax:8+4*saga, map:genMap(saga*3), rewards:null, picks:0, pend:null, kit:[]};
  for(let i=0;i<KITS[saga];i++) S.kit.push(randomUpg());
  S.kitPw = KIT_PW[saga];
  S.squad.forEach(s=>{ s.hp=maxHp(s); bringPower(s.id); });
  // quien empieza en una saga avanzada trae los poderes que de media se consiguen antes (medido en simulación)
  for(let i=0;i<S.kitPw;i++){ const miss=MINOR.filter(k=>!(k in S.pw)), who=S.squad.filter(hasRoom); if(miss.length&&who.length){ const s=pick(who); grant(pick(miss), s.id); s.hp=maxHp(s); } }
  C=null; scr='map'; store.set('run', S);
}
function enterNode(r, j){
  if(!openNodes().some(o=>o[0]===r && o[1]===j)) return;
  S.map.pos=[r,j]; S.map.path.push(j);
  const t = curNode().t;
  if(t==='b'){ const boss=zoneOf(S.wave).boss, b=betrayer(boss); if(b) return startBetrayal(b, boss); }
  if(t==='v'){ const ok=EVENTS.map((e,i)=>i).filter(i=>!EVENTS[i].when || EVENTS[i].when()); S.pend={k:'event', i:pick(ok), res:null}; scr='event'; }
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
  if(boss) S.map = genMap(S.map.z+1);
  store.set('run', S); scr='map'; render();
}
function levelUp(s){ const b=maxHp(s); s.lvl++; s.hp += maxHp(s)-b; }
function healAll(p){ S.squad.forEach(s=>{ s.hp=Math.min(maxHp(s), s.hp+Math.round(maxHp(s)*p)); }); }
function hurtAll(p){ S.squad.forEach(s=>{ s.hp=Math.max(1, s.hp-Math.round(maxHp(s)*p)); }); }
function saveBest(w){ if(w>meta().best) saveMeta({best:w}); }
function win(){
  const t = curNode().t, sagaEnd = t==='b' && dayOf(S.wave)===PER, btr = S.pend && S.pend.btr, bossId = t==='b' ? C.titans[0].id : null;
  S.q = []; S.note = null;
  S.squad.filter(s=>s.hp<=0).forEach(s=>{ S.fallen.push(s.id); if(pwOf(s.id).length){ S.note=`${nm(s)} ha caído. Su poder pasa a la reserva: se puede inyectar en un campamento.`; release(s.id); } });
  S.squad = alive();
  S.squad.forEach(levelUp);
  healAll(.10 + .15*rel('vendas') + (t==='b'?.25:0) + (sagaEnd?.3:0));
  S.gas = sagaEnd ? S.gasMax : Math.min(S.gasMax, S.gas+3);
  saveBest(S.wave);
  if(sagaEnd) saveMeta({unlocked:Math.max(meta().unlocked, Math.min(SAGAS.length, sagaIx(S.wave)+2))});
  if(btr && btr.id==='eren'){ S.fallen.push('eren'); btr.pws.forEach(k=>grant(k,'reserva')); S.erenFell=true; }
  else if(btr) S.q.push({k:'spare', id:btr.id, lvl:btr.lvl});
  else rollDrop(t, bossId);
  if(S.wave>=TOTAL){ S.ending=endingOf(); const m=meta(); if(!m.endings.includes(S.ending)) saveMeta({endings:m.endings.concat(S.ending)}); store.del('run'); scr='victory'; return render(); }
  S.sagaDone = sagaEnd;
  S.picks = t==='e' || sagaEnd ? 2 : 1;
  S.rewards = genRewards(t); S.pend=null; S.after='reward';
  nextScene();
}
function lose(){
  S.squad.forEach(s=>S.fallen.push(s.id)); saveBest(S.wave-1);
  store.del('run'); scr='over'; render();
}
function recruitPool(){ const g=sagaIx(S.wave); return Object.keys(ROSTER).filter(id=>ROSTER[id].sg<=g && !S.squad.some(s=>s.id===id) && !S.fallen.includes(id)); }
function upgPool(){ return Object.keys(UPG).filter(k=>!UPG[k].max || rel(k)<UPG[k].max); }
function genRewards(t){
  let cands = recruitPool();
  const rare = cands.filter(id=>ROSTER[id].rare);
  cands = t==='b' && rare.length ? rare : cands.filter(id=>!ROSTER[id].rare);
  const out=[], total = S.picks>1 ? 4 : 3;
  if(cands.length){ const a=pick(cands); out.push({t:'rec', id:a});
    const rest=cands.filter(c=>c!==a); if(S.squad.length<=2 && rest.length) out.push({t:'rec', id:pick(rest)}); }
  const hurt = S.squad.some(s=>s.hp < maxHp(s)*.7);
  const ups = upgPool().filter(k=>k!=='raciones'||hurt).sort(()=>Math.random()-.5);
  while(out.length<total) out.push({t:'upg', id:ups.pop()});
  return out;
}
function applyUpg(k){
  const before = S.squad.map(maxHp);
  if(UPG[k].stack) S.rel[k]=rel(k)+1;
  if(k==='capa') S.squad.forEach((s,i)=>{ s.hp += maxHp(s)-before[i]; });
  if(k==='bombona'){ S.gasMax+=3; S.gas=S.gasMax; }
  if(k==='raciones') healAll(.45);
  if(k==='shadis') S.squad.forEach(levelUp);
}
function randomUpg(){ const k=pick(upgPool().filter(x=>UPG[x].stack)); applyUpg(k); return UPG[k].n; }
function recruit(id, replaceId, hpPct=1){
  if(replaceId){ if(pwOf(replaceId).length) S.note=`${ROSTER[replaceId].n} vuelve a las murallas. Su poder queda en la reserva.`; release(replaceId); S.squad = S.squad.filter(s=>s.id!==replaceId); }
  const s={id, lvl:Math.max(1,S.wave), hp:0}; S.squad.push(s); bringPower(id); s.hp=Math.max(1, Math.round(maxHp(s)*hpPct));
}
function tookReward(i){
  S.rewards.splice(i,1); S.picks--;
  if(S.picks>0){ store.set('run', S); scr='reward'; return render(); }
  advance();
}
const CAMP = [
  {n:'Descansar', d:'Todo el escuadrón recupera el 40 % de sus PV.', f(){ healAll(.4); }},
  {n:'Entrenar', d:'Todo el escuadrón sube 1 nivel.', f(){ S.squad.forEach(levelUp); }},
  {n:'Reabastecer', d:'Depósito de gas lleno y +1 de gas máximo.', f(){ S.gasMax++; S.gas=S.gasMax; }}
];
// cada opción devuelve el texto del desenlace
const EVENTS = [
  {n:'Carro de suministros volcado', d:'Un carro de la Guarnición yace en la cuneta. Las bombonas siguen atadas, pero entre los árboles se mueve algo.',
   o:[{l:'Cargar el gas y salir', d:'Depósito lleno.', f(){ S.gas=S.gasMax; return 'Llenáis las bombonas y os vais antes de que nadie os oiga.'; }},
      {l:'Rebuscar a fondo', d:'Una mejora al azar. El ruido os costará un 15 % de PV.', f(){ hurtAll(.15); return `Bajo la lona aparece equipo intacto: ${randomUpg()}. Un titán os alcanza por la espalda antes de montar.`; }}]},
  {n:'Recluta rezagado', d:'Un soldado herido os hace señas desde un tejado. Ha perdido a su escuadrón.',
   o:[{l:'Acogerlo', d:'Se une con la mitad de sus PV. Si no hay hueco, enseña lo que sabe: +1 nivel a todos.', f(){
        const p=recruitPool().filter(id=>!ROSTER[id].rare);
        if(S.squad.length<4 && p.length){ const id=pick(p); recruit(id, null, .5); return `${ROSTER[id].n} baja del tejado y se une al escuadrón.`; }
        S.squad.forEach(levelUp); return 'No hay sitio en la formación, pero os cuenta cómo sobrevivió tres días. Todos suben 1 nivel.'; }},
      {l:'Darle un caballo y seguir', d:'+3 de gas por no desviaros.', f(){ S.gas=Math.min(S.gasMax,S.gas+3); return 'Le dejáis un caballo de refresco y mantenéis la ruta.'; }}]},
  {n:'Frasco sin etiqueta', d:'En una mochila del laboratorio hay un frasco que burbujea. La nota dice «no beber (todavía)».',
   o:[{l:'Que alguien se lo beba', d:'A cara o cruz: +3 niveles o pierde el 40 % de sus PV.', f(){
        const s=pick(S.squad);
        if(Math.random()<.5){ levelUp(s); levelUp(s); levelUp(s); return `${nm(s)} tose, se pone en pie y parte una rama de un tajo. +3 niveles.`; }
        s.hp=Math.max(1, s.hp-Math.round(maxHp(s)*.4)); return `${nm(s)} pasa una hora doblado en la cuneta. Pierde el 40 % de sus PV.`; }},
      {l:'Dejarlo donde está', d:'Descansáis un rato: cura el 12 %.', f(){ healAll(.12); return 'Nadie se atreve. Aprovecháis para beber agua, que es más seguro.'; }}]},
  {n:'Aldea abandonada', d:'Casas reventadas desde dentro y ni una gota de sangre. Las despensas siguen llenas.',
   o:[{l:'Registrar las casas', d:'60 %: una mejora. 40 %: emboscada, todos pierden el 20 % de PV.', f(){
        if(Math.random()<.6) return `En un establo hay material del Cuerpo: ${randomUpg()}.`;
        hurtAll(.2); return 'Un anormal sale de un pajar. Escapáis, pero no ilesos: todos pierden el 20 % de PV.'; }},
      {l:'Acampar en las afueras', d:'Cura el 20 % a todos.', f(){ healAll(.2); return 'Hacéis noche lejos de las casas. Nadie duerme mucho, pero se descansa.'; }}]},
  {n:'Jeringa en un sótano', when:()=>sagaIx(S.wave)>=1 && Math.random()<.5, d:'Bajo una casa en ruinas hay un maletín de médico. Dentro, una jeringa con un líquido turbio y una etiqueta con un nombre que nadie reconoce.',
   o:[{l:'Quedárosla', d:'Un poder de los Nueve que aún no tengáis, al azar.', f(){
        const miss=NINE.filter(k=>!(k in S.pw)); if(!miss.length){ healAll(.2); return 'Ya tenéis los Nueve. La jeringa está vacía; aprovecháis para descansar.'; }
        const k=pick(miss); S.q.push({k:'drop', p:k, src:'event'}); return `La etiqueta lleva el nombre de un portador del ${POWERS[k].n}. Hay que decidir quién lo hereda.`; }},
      {l:'Romperla', d:'Nadie debería tener ese poder. Todos suben 1 nivel.', f(){ S.squad.forEach(levelUp); return 'La jeringa se hace añicos contra el suelo. Nadie dice nada en todo el día.'; }}]},
  {n:'Desertor en el camino', d:'Un soldado sin capa os ofrece su equipo a cambio de que no digáis que lo habéis visto.',
   o:[{l:'Aceptar el trato', d:'Una mejora al azar.', f(){ return `Os deja el macuto y desaparece entre los árboles: ${randomUpg()}.`; }},
      {l:'Convencerlo de volver', d:'El soldado más débil sube 2 niveles con lo que le enseña.', f(){
        const s=S.squad.slice().sort((a,b)=>a.lvl-b.lvl)[0]; levelUp(s); levelUp(s); return `Cabalga con vosotros un trecho y entrena a ${nm(s)} antes de marcharse. +2 niveles.`; }}]}
];
