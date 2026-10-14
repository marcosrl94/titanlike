// ---------- Los Nueve: poderes, traiciones y escenas ----------
const POWERS = {
  ataque:   {n:'Titán de Ataque', art:'atq', tgt:'none', d:'3 turnos con daño ×2; recibe la mitad.'},
  colosal:  {n:'Titán Colosal', art:'col', tgt:'none', d:'Explosión: daño ×1,8 a todos los titanes, ignorando resistencias. Pierde el 15 % de sus PV.'},
  acorazado:{n:'Titán Acorazado', art:'aco', tgt:'none', d:'4 turnos: recibe los golpes del escuadrón y solo sufre una cuarta parte.'},
  hembra:   {n:'Titán Hembra', art:'hem', tgt:'enemy', d:'Patada endurecida: daño ×2,2 y derriba, también a los jefes (si no están alerta).'},
  bestia:   {n:'Titán Bestia', art:'bes', tgt:'none', d:'Lluvia de rocas: daño ×1,3 a todos los titanes.'},
  mandibula:{n:'Titán Mandíbula', art:'man', tgt:'enemy', d:'Mordisco: daño ×2,8 que ignora resistencias y endurecimiento.'},
  carguero: {n:'Titán Carguero', art:'car', tgt:'none', d:'Suministros: +4 de gas y cura el 20 % a todo el escuadrón.'},
  martillo: {n:'Titán Martillo de Guerra', art:'mar', tgt:'none', d:'Armas de cristal: 3 turnos con +35 % de daño y −40 % de daño recibido para todos.'},
  fundador: {n:'Titán Fundador', art:'fun', tgt:'none', d:'El Grito: derriba (si no están alerta) y marca a los titanes normales; marca a los jefes.'}
};
const NINE = Object.keys(POWERS);
const EREN3 = ['ataque','fundador','martillo'];
const MINOR = ['colosal','acorazado','hembra','bestia','mandibula','carguero'];
const BOSS_PW = {col:'colosal', col2:'colosal', hem:'hembra', hem2:'hembra', bes:'bestia', aco:'acorazado', aco2:'acorazado', man:'mandibula', mar:'martillo', rod:'fundador'};
const BRINGS = {eren:'ataque', ymir:'mandibula', pieck:'carguero'};
const BETRAY = {
  reiner:{bosses:['aco','aco2'], pw:'acorazado',
    pre:['Reiner se queda atrás mientras el escuadrón avanza.', '«Llevo demasiado tiempo aquí», dice sin mirar a nadie. «Ya no sé qué soy.»',
         'Se arranca el vendaje de la mano. Un rayo cae en mitad de la formación.', 'Donde estaba Reiner se levanta el Titán Acorazado.'],
    post:'La armadura se agrieta y Reiner cuelga de la nuca, medio fundido con la carne del titán. Sigue respirando.'},
  annie:{bosses:['hem','hem2'], pw:'hembra',
    pre:['Annie lleva todo el día callada.', 'Al llegar al claro se aparta de la formación y levanta la mano. En el dedo brilla un anillo con una cuchilla.',
         '«Lo siento. Tengo que volver a casa.»', 'El destello os ciega. Cuando abrís los ojos, el Titán Hembra os mira desde arriba.'],
    post:'La Hembra se arrodilla. Annie intenta encerrarse en cristal, pero llegáis antes de que se cierre.'},
  eren:{pre:['Eren deja de cabalgar.', '«He visto lo que viene. Y lo que hay que hacer.»',
         'Apoya la mano en el suelo. La tierra tiembla, primero muy lejos y después bajo vuestros pies.', 'El Titán Fundador se alza, y detrás de él suenan miles de pasos al unísono.']}
};
const ENDINGS = {
  retumbar:  {n:'El fin del Retumbar', d:'El Titán Fundador ha caído y el mundo sigue en pie.'},
  coordenada:{n:'La Coordenada', d:'Reunís los poderes que Eren llegó a acumular: Ataque, Fundador y Martillo de Guerra.'},
  nueve:     {n:'Los Nueve', d:'Los nueve poderes, de vuelta en manos de un solo escuadrón.'}
};
const cap = s => s.id==='eren' ? 3 : 1;
const pwOf = id => S && S.pw ? NINE.filter(k=>S.pw[k]===id) : [];
const hasRoom = s => pwOf(s.id).length < cap(s);
const owned = () => NINE.filter(k=>k in S.pw);
const dropP = () => Math.min(1, .4 + (S.pity||0));
function grant(k, holder, innate){   // holder: id de soldado o 'reserva'
  const s = S.squad.find(x=>x.id===holder), before = s ? maxHp(s) : 0;
  S.pw[k] = holder; if(s){ s.hp += maxHp(s)-before; if(!innate) ach('poder'); }
  codex('t', POWERS[k].art, 0);
  const m = meta(); if(!m.nine.includes(k)) saveMeta({nine:m.nine.concat(k)});
}
function release(id){ pwOf(id).forEach(k=>S.pw[k]='reserva'); }
function bringPower(id){ const k=BRINGS[id]; if(k && !(k in S.pw)) grant(k, id, true); }

// ---- transformaciones en combate ----
function usePower(s, k, target){
  const f=C.fx[s.id], P=POWERS[k], ti = target ? C.titans.indexOf(target) : -1;
  C.usedPw[k] = true;
  ev({k:'shift', s:s.id, pw:k, art:P.art, txt:P.n.toUpperCase(), m:`${nm(s)} se transforma en el ${P.n}.`});
  switch(k){
    case 'ataque': f.titan=4; f.form=k; f.formT=4; break;
    case 'colosal': liveT().forEach(t=>strike(s,t,1.8,{pierce:true, verb:'abrasa a'}));
      { const d=Math.min(s.hp-1, Math.round(maxHp(s)*.15)); if(d>0){ s.hp-=d; ev({k:'hurt', s:s.id, d, hp:s.hp, max:maxHp(s)}); } } break;
    case 'acorazado': f.guard=5; f.armor=5; f.form=k; f.formT=5; break;
    case 'hembra': strike(s,target,2.2,{verb:'patea a'}); applyCC(target,'stun',{boss:true}); break;
    case 'bestia': liveT().forEach(t=>strike(s,t,1.3,{verb:'lanza rocas a'})); break;
    case 'mandibula': strike(s,target,2.8,{pierce:true, verb:'muerde a'}); break;
    case 'carguero': S.gas=Math.min(S.gasMax, S.gas+4); alive().forEach(a=>{ const h=Math.min(maxHp(a)-a.hp, Math.round(maxHp(a)*.2)); a.hp+=h; if(h) ev({k:'heal', s:a.id, d:h, hp:a.hp, max:maxHp(a)}); }); break;
    case 'martillo': teamBuff(s,'up',3); teamBuff(s,'ward',3); ev({k:'buff', ids:alive().map(a=>a.id), txt:'CRISTAL', m:'Armas de cristal para todo el escuadrón.'}); break;
    case 'fundador': liveT().forEach(t=>{ if(t.boss) t.mark=Math.max(t.mark,3); else { applyCC(t,'stun',{quiet:true}); t.mark=Math.max(t.mark,2); } }); ev({k:'roarAll', txt:'EL GRITO', m:'El Grito recorre el campo. Los titanes se detienen.'}); break;
  }
}

// ---- traiciones: se comprueban al entrar en el nodo del jefe ----
function betrayer(boss){
  if(S.squad.length<2) return null;
  if(boss==='fun' && S.pw.fundador==='eren') return 'eren';
  return ['reiner','annie'].find(id=>BETRAY[id].bosses.includes(boss) && S.squad.some(s=>s.id===id) && !S.loyal[id]) || null;
}
function startBetrayal(id, boss){
  const s = S.squad.find(x=>x.id===id), pws = pwOf(id);
  if(id==='eren') pws.forEach(k=>delete S.pw[k]); else release(id);
  S.squad = S.squad.filter(x=>x!==s);
  S.pend = {k:'fight', btr:{id, lvl:s.lvl, pws}};
  S.q = [{k:'betray', id, boss}]; S.after = 'fight';
  nextScene();
}
// ---- escenas encadenadas (antes o después de un combate, eventos, campamentos) ----
function nextScene(){
  if(S.q && S.q.length){ S.scene = S.q.shift(); scr='scene'; store.set('run', S); return render(); }
  S.scene = null; const a = S.after; S.after = null;
  if(a==='advance') return advance();
  if(a==='fight'){ store.set('run', S); return startWave(); }
  scr='reward'; store.set('run', S); render();
}
function sceneAct(i){
  const sc = S.scene;
  if(i==='rescue'){ S.squad.push({id:sc.id, lvl:sc.lvl, hp:0}); const s=S.squad[S.squad.length-1]; s.hp=Math.round(maxHp(s)*.3); S.loyal[sc.id]=true; ach('perdon'); }
  else if(i==='take'){ S.fallen.push(sc.id); ach('sin_piedad'); const k=BETRAY[sc.id].pw; if(!(k in S.pw) || S.pw[k]==='reserva') S.q.unshift({k:'drop', p:k, src:'betray'}); }
  else if(i==='keep'){ grant(sc.p, 'reserva'); }
  else if(i==='alt'){ takeRoute(sc.alt); }
  else if(sc && sc.k==='story' && i && i.startsWith('st:')){ storyAct(sc, +i.slice(3)); }
  else if(i && i.startsWith('give:')){ const id=i.slice(5); if(S.pw[sc.p]) S.pw[sc.p]=null; grant(sc.p, id); }
  nextScene();
}
// botín tras vencer a un jefe o a una élite
function rollDrop(t, bossId){
  if(t==='b'){
    const k = BOSS_PW[bossId]; if(!k || k in S.pw) return;
    if(Math.random() < dropP()){ S.pity=0; S.q.push({k:'drop', p:k, src:'boss', boss:bossId}); }
    else { S.pity=(S.pity||0)+.2; S.note=`El portador del ${POWERS[k].n} se evapora con su poder. La próxima vez: ${Math.round(dropP()*100)} %.`; }
  } else if(t==='e' && Math.random()<.06){
    const miss = MINOR.filter(k=>!(k in S.pw)); if(miss.length) S.q.push({k:'drop', p:pick(miss), src:'elite'});
  }
}
function endingOf(){ const o=owned(); if(o.length===9) return 'nueve'; if(typeof onRoute==='function' && onRoute('paradis')) return 'paradis'; return EREN3.every(k=>o.includes(k)) ? 'coordenada' : 'retumbar'; }
