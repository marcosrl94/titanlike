// ---------- Estado y combate ----------
let S = null;   // expedición: {wave, squad, fallen, rel, gas, gasMax, map, rewards, picks, pend}
let C = null;   // combate en curso
let scr = 'title';
const rnd = (a,b)=>a+Math.random()*(b-a);
const pick = a=>a[Math.floor(Math.random()*a.length)];
const store = {
  get(k){ try{ return JSON.parse(localStorage.getItem('titanlike.'+k)); }catch(e){ return null; } },
  set(k,v){ try{ localStorage.setItem('titanlike.'+k, JSON.stringify(v)); }catch(e){} },
  del(k){ try{ localStorage.removeItem('titanlike.'+k); }catch(e){} }
};
const rel = k => (S.rel[k]||0);
const lvlMul = s => 1 + .05*(s.lvl-1);
const maxHp = s => Math.round(ROSTER[s.id].hp * lvlMul(s) * (1 + .15*rel('capa')) * (1 + .25*pwOf(s.id).length));
const atkOf = s => ROSTER[s.id].atk * lvlMul(s);
const spdOf = s => ROSTER[s.id].spd + 3*rel('caballos');
const alive = () => S.squad.filter(s=>s.hp>0);
const liveT = () => C.titans.filter(t=>t.hp>0);
const clampW = w => Math.min(TOTAL, Math.max(1, w));
const sagaIx = w => Math.floor((clampW(w)-1)/PER);
const sagaOf = w => SAGAS[sagaIx(w)];
const zoneOf = w => sagaOf(w).zones[Math.floor(((clampW(w)-1)%PER)/5)];
const dayOf = w => (clampW(w)-1)%PER + 1;
const curNode = () => S.map.pos ? S.map.rows[S.map.pos[0]][S.map.pos[1]] : null;
const nm = s => ROSTER[s.id].n;
const SAGA_MUL = [1, 1.12, 1.4, 1.8];
const scaleAt = w => (1 + .15*(w-1)) * SAGA_MUL[sagaIx(w)];

function mkTitan(id, sc){
  const b=TITANS[id], hp=Math.round(b.hp*sc);
  return {id, n:b.n, cls:b.cls, boss:!!b.boss, m:b.m||{}, twice:!!b.twice, hp, max:hp, atk:b.atk*sc, spd:b.spd, turns:0, mark:0, stun:0, blind:0, hard:0};
}
function genWave(w, type){
  const z = zoneOf(w), k = (w-1)%5, elite = type==='e';
  const sc = scaleAt(w) * (elite ? 1.2 : 1);
  if(type==='b') return [mkTitan(z.boss, sc)];
  const count = Math.min(3, 1 + Math.floor((k + (w>5?2:0))/2) + (elite?1:0));
  const out=[]; for(let i=0;i<count;i++) out.push(mkTitan(pick(k===0&&w<=5 ? ['t3','t5'] : z.pool), sc));
  return out;
}
function startWave(){
  const type = curNode().t;
  C = {titans:genWave(S.wave, type), queue:[], active:null, pending:null, log:[], ev:[], fx:{}, busy:false, used:{}, usedPw:{}};
  const btr = S.pend && S.pend.btr;
  if(btr){ const b=C.titans[0]; b.n=`${ROSTER[btr.id].n} · ${b.n}`; b.max=b.hp=Math.round(b.max*(btr.id==='eren' ? 1+.15*btr.pws.length : 1.2)); b.atk*=1.1; }
  S.squad.forEach(s=>{ C.fx[s.id]={up:0,guard:0,taunt:0,evade:0,titan:0,crit:0,armor:0,ward:0,form:null,formT:0}; });
  S.gas = Math.min(S.gasMax, S.gas + 2*rel('bengala'));
  C.log.push(type==='b' ? `¡${C.titans[0].n} a la vista!` : `${type==='e'?'Grupo de élite: ':''}${C.titans.length===1?'un titán':C.titans.length+' titanes'} en ${zoneOf(S.wave).n}.`);
  scr='combat'; nextTurn();
}
const ev = e => C.ev.push(e);
const say = (m,w) => ev({k:'say', m, w});
function eff(sol, t){ return EFF[ROSTER[sol.id].st][t.cls] || 1; }

function nextTurn(){
  C.active=null; C.pending=null;
  if(!liveT().length) return setTimeout(win, 450);
  if(!alive().length) return setTimeout(lose, 700);
  if(!C.queue.length){
    const u = alive().map(s=>({s, v:spdOf(s)+rnd(0,2)})).concat(liveT().map(t=>({t, v:t.spd+rnd(0,2)})));
    C.queue = u.sort((a,b)=>b.v-a.v);
  }
  const u = C.queue.shift();
  if(u.s){
    if(u.s.hp<=0) return nextTurn();
    C.active=u.s; C.busy=false; render();
  } else {
    if(u.t.hp<=0) return nextTurn();
    C.busy=true; render();
    titanAct(u.t);
    play(()=>{ render(); setTimeout(nextTurn, 140); });
  }
}
// daño de soldado a titán
function strike(s, t, mult, o={}){
  if(t.hp<=0) return false;
  const f=C.fx[s.id];
  let d = atkOf(s)*mult*rnd(.9,1.1);
  if(!o.pierce) d *= eff(s,t);
  d *= 1 + .15*rel('cuchillas');
  if(t.boss) d *= 1 + .3*rel('lanzas');
  if(f.up>0) d *= 1.35;
  if(f.titan>0) d *= 2;
  if(t.mark>0) d *= 1.5;
  if(t.hard>0 && !o.pierce) d *= .4;
  const crit = f.crit>0 || Math.random() < (ROSTER[s.id].st==='preciso' ? .22 : .1);
  if(crit) d *= 1.5;
  d = Math.max(1, Math.round(d));
  const exec = !!o.nape && !t.boss && (t.hp-d)/t.max < .25 && d < t.hp;
  if(exec) d = t.hp;
  t.hp = Math.max(0, t.hp-d);
  ev({k:'slash', s:s.id, t:C.titans.indexOf(t), d, crit, exec, kill:t.hp<=0, hp:t.hp, max:t.max, boom:!!o.pierce,
      m:`${nm(s)} ${o.verb||'corta a'} ${t.n}: ${d}${crit?' (crítico)':''}${t.hp<=0?'. ¡Abatido!':''}`});
  return t.hp<=0;
}
function doAction(kind, target){
  const s=C.active, R=ROSTER[s.id], f=C.fx[s.id], ti = target && C.titans.indexOf(target);
  const all = () => alive().map(a=>a.id);
  C.busy=true; C.pending=null;
  if(kind==='cut') strike(s, target, 1);
  else if(kind==='nape'){ S.gas-=1; strike(s, target, 1.6, {nape:true, verb:'va a la nuca de'}); }
  else if(kind.startsWith('pw:')) usePower(s, kind.slice(3), target);
  else {
    S.gas -= R.sk.gas; if(R.sk.once) C.used[s.id]=true;
    switch(s.id){
      case 'eren': strike(s,target, s.hp<maxHp(s)/2 ? 2.2 : 1.5, {verb:'se lanza contra'}); break;
      case 'mikasa': strike(s,target,.75); strike(s,target,.75); break;
      case 'armin': strike(s,target,1,{verb:'estudia y corta a'}); if(target.hp>0) target.mark=3; ev({k:'mark', t:ti, txt:'MARCADO', m:`Armin señala el punto débil de ${target.n}.`}); break;
      case 'sasha': strike(s,target,1.2,{verb:'dispara a'}); if(target.hp>0){ target.blind=1; ev({k:'mark', t:ti, txt:'CEGADO'}); } break;
      case 'jean': alive().forEach(a=>C.fx[a.id].up=3); ev({k:'buff', ids:all(), txt:'FLANQUEO', m:'Jean ordena flanquear. El escuadrón aprieta.'}); break;
      case 'connie': f.taunt=3; f.evade=1; ev({k:'buff', ids:[s.id], txt:'SEÑUELO', m:'Connie cruza por delante de los titanes gritando.'}); break;
      case 'hange': strike(s,target,2.6,{pierce:true, verb:'clava una lanza trueno en'}); break;
      case 'reiner': f.guard=4; ev({k:'buff', ids:[s.id], txt:'ESCUDO', m:'Reiner se pone delante del escuadrón.'}); break;
      case 'annie': strike(s,target,1.3,{verb:'barre a'});
        if(target.hp>0 && !target.boss){ target.stun=1; ev({k:'mark', t:ti, txt:'DERRIBADO'}); } else if(target.hp>0) say(`${target.n} aguanta en pie.`); break;
      case 'historia': { const h=Math.min(maxHp(target)-target.hp, Math.round(maxHp(target)*.4)); target.hp+=h;
        ev({k:'heal', s:target.id, d:h, hp:target.hp, max:maxHp(target), m:`Historia venda a ${nm(target)}: +${h} PV.`}); break; }
      case 'levi': say('Levi gira sobre sí mismo.',120); liveT().forEach(t=>strike(s,t,1)); break;
      case 'erwin': ev({k:'buff', ids:all(), txt:'¡AVANZAD!', m:'Erwin: «¡Avanzad!»'}); alive().filter(a=>a!==s).forEach(a=>strike(a,target,1)); break;
      case 'ymir': if(strike(s,target,1.5,{verb:'muerde a'})){ const h=Math.min(maxHp(s)-s.hp, Math.round(maxHp(s)*.3)); s.hp+=h;
        if(h) ev({k:'heal', s:s.id, d:h, hp:s.hp, max:maxHp(s), m:`Ymir se rehace: +${h} PV.`}); } break;
      case 'nanaba': for(let i=0;i<2;i++){ const l=liveT(); if(l.length) strike(s, pick(l), 1.1, {verb:'pasa rasante sobre'}); } break;
      case 'mike': alive().forEach(a=>C.fx[a.id].crit=3); ev({k:'buff', ids:all(), txt:'OLFATO', m:'Mike olfatea el aire y señala dónde cortar.'}); break;
      case 'floch': say('Floch ordena la salva.',120); liveT().forEach(t=>strike(s,t,1.2,{pierce:true, verb:'revienta a'})); break;
      case 'gabi': strike(s,target,2.1,{verb:'dispara a'}); break;
      case 'pieck': say('La artillería de Pieck abre fuego.',120); liveT().forEach(t=>{ strike(s,t,.8,{verb:'bombardea a'}); if(t.hp>0) t.mark=2; }); break;
    }
  }
  ['up','guard','taunt','titan','crit','armor','ward','formT'].forEach(k=>{ if(f[k]>0) f[k]--; });
  header(); busyUI();
  play(()=>{ render(); setTimeout(nextTurn, 140); });
}
// daño de titán a soldado
function wound(t, s, mult){
  if(s.hp<=0) return;
  const guard = alive().find(a=>C.fx[a.id].guard>0 && a!==s);
  const tgt = guard || s, f=C.fx[tgt.id], ti=C.titans.indexOf(t);
  let d = t.atk*mult*rnd(.85,1.15);
  if(t.blind>0) return ev({k:'miss', t:ti, s:tgt.id, txt:'FALLA', m:`${t.n} manotea a ciegas y falla.`});
  if(f.evade>0){ f.evade=0; return ev({k:'miss', t:ti, s:tgt.id, txt:'ESQUIVA', m:`${nm(tgt)} esquiva a ${t.n}.`}); }
  if(guard || f.guard>0) d*=.5;
  if(f.titan>0) d*=.5;
  if(f.armor>0) d*=.5;
  if(f.ward>0) d*=.6;
  d *= Math.max(.4, 1-.12*rel('cristal'));
  d = Math.max(1, Math.round(d));
  tgt.hp = Math.max(0, tgt.hp-d);
  ev({k:'bite', t:ti, s:tgt.id, d, hp:tgt.hp, max:maxHp(tgt), dead:tgt.hp<=0, m:`${t.n} golpea a ${nm(tgt)}: ${d}${tgt.hp<=0?'. Ha caído.':''}`});
}
function titanAct(t){
  const ti=C.titans.indexOf(t), m=t.m, every = n => n && t.turns%n===0;
  t.turns++;
  if(t.hard>0) t.hard--;
  if(t.mark>0) t.mark--;
  if(t.stun>0){ t.stun=0; return say(`${t.n} sigue en el suelo.`, 450); }
  const choose = ()=>{ const a=alive(); if(!a.length) return null; return a.find(x=>C.fx[x.id].taunt>0) || pick(a); };
  if(every(m.harden)){ t.hard=1; ev({k:'roar', t:ti, txt:'ENDURECIMIENTO', m:`${t.n} endurece la piel.`}); }
  if(every(m.aoe)){ ev({k:'roar', t:ti, txt:m.txt||'EMBESTIDA', m:`${t.n} golpea a todo el escuadrón.`}); alive().forEach(s=>wound(t,s,.6)); }
  else if(every(m.devour)){
    const s = alive().sort((a,b)=>a.hp/maxHp(a)-b.hp/maxHp(b))[0];
    ev({k:'roar', t:ti, txt:'DEVORA', m:`${t.n} se lanza a por ${nm(s)}.`}); wound(t,s,1.8);
  } else {
    const n = t.twice ? 2 : 1;
    for(let i=0;i<n;i++){ const s=choose(); if(s) wound(t,s,t.twice?.7:1); }
  }
  if(m.aura && alive().length){ ev({k:'roar', t:ti, txt:'CALOR', m:`El calor de ${t.n} abrasa al escuadrón.`}); alive().forEach(s=>wound(t,s,m.aura)); }
  if(t.blind>0) t.blind=0;
  if(every(m.summon) && alive().length){
    // ocupa un hueco libre: nunca hay más de tres titanes en pantalla
    const slot = C.titans.length<3 ? C.titans.length : C.titans.findIndex(x=>x.hp<=0 && !x.boss);
    if(slot>=0){ const n = mkTitan(pick(zoneOf(S.wave).pool), scaleAt(S.wave)*.8); C.titans[slot]=n;
      ev({k:'summon', t:slot, txt:'LLAMADA', m:`${t.n} llama a un ${n.n}.`}); }
  }
}
