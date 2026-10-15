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
const atkOf = s => ROSTER[s.id].atk * lvlMul(s) * (S && S.vow && S.vow[s.id] ? 1.1 : 1);   // juramento por un compañero caído: +10 %
const spdOf = s => ROSTER[s.id].spd + 3*rel('caballos');
const alive = () => S.squad.filter(s=>s.hp>0);
const liveT = () => C.titans.filter(t=>t.hp>0);
const clampW = w => Math.min(TOTAL, Math.max(1, w));
const sagaIx = w => Math.floor((clampW(w)-1)/PER);
const sagaOf = w => (typeof altSaga==='function' && altSaga(sagaIx(w))) || SAGAS[sagaIx(w)];   // la senda alternativa sustituye a la canónica
const zoneOf = w => sagaOf(w).zones[Math.floor(((clampW(w)-1)%PER)/5)];
const dayOf = w => (clampW(w)-1)%PER + 1;
const curNode = () => S.map.pos ? S.map.rows[S.map.pos[0]][S.map.pos[1]] : null;
const nm = s => ROSTER[s.id].n;
const SAGA_MUL = [1.03, 1.17, 1.65, 2.05];
// dificultad: multiplicador de PV y ataque enemigos, gas recuperado tras cada combate
const DIFF = {recluta:{n:'Recluta', m:.85, gas:4, d:'Enemigos un 15 % más débiles y 4 de gas tras cada combate. No puntúa en la clasificación.'},
  explorador:{n:'Explorador', m:1, gas:3, d:'El juego tal y como está pensado.'},
  veterano:{n:'Veterano', m:1.15, gas:2, d:'Enemigos un 15 % más fuertes y solo 2 de gas tras cada combate.'}};
const diffOf = () => DIFF[S && S.diff] || DIFF.explorador;
const ngMul = () => 1 + .12*((S && S.ng)||0);   // New Game+: +12 % por vuelta
const d20 = () => 1 + Math.floor(Math.random()*20);
const skillBonus = (s, k) => ((ROSTER[s.id].tr||{})[k]||0) + (STYLE_SKILL[ROSTER[s.id].st]===k ? 1 : 0);
// prueba de habilidad del escuadrón: tira el mejor en esa habilidad
function check(k, dc){
  const a=alive(); const who = a.slice().sort((x,y)=>skillBonus(y,k)-skillBonus(x,k))[0];
  const b = who ? skillBonus(who,k) : 0, r = d20(), ok = r===20 || (r!==1 && r+b>=dc);
  const txt = `Tirada de ${SKILLS[k]} (${who?nm(who):'nadie'} +${b}): ${r}${r===20?' ¡20 natural!':r===1?' ¡pifia!':''}${b?' + '+b+' = '+(r+b):''} contra ${dc}. ${ok?'Éxito.':'Fallo.'}`;
  if(S && S.pend) (S.pend.dice = S.pend.dice || []).push({k, r, b, dc, ok, who: who ? who.id : null});
  if(ok && typeof orderEvent==='function') orderEvent('prueba');
  return {ok, who, r, b, txt};
}
// crecimiento por jornada: 15 % de la base en la saga 1 y 13 % a partir de la 2 (la curva se aplanaba poco con los niveles del escuadrón)
const scaleAt = w => (1 + .15*Math.min(w-1, PER-1) + .13*Math.max(0, w-PER)) * SAGA_MUL[sagaIx(w)];

function mkTitan(id, sc){
  const b=TITANS[id]; sc *= diffOf().m * ngMul(); const hp=Math.round(b.hp*sc);
  return {id, n:b.n, cls:b.cls, boss:!!b.boss, m:b.m||{}, twice:!!b.twice, v:b.v||'golpea a', hp, max:hp, atk:b.atk*sc, spd:b.spd, turns:0, mark:0, stun:0, blind:0, hard:0, alert:0};
}
function genWave(w, type){
  if(S && S.pvp && typeof duelFoes==='function') return duelFoes();   // duelo: el escuadrón de leyenda rival
  const z = zoneOf(w), k = (w-1)%5, elite = type==='e';
  const sc = scaleAt(w) * (elite ? 1.2 : 1);
  // jefe doble (p. ej. Colosal y Acorazado juntos en la brecha): cada uno al 72 %
  if(type==='b') return z.boss2 ? [mkTitan(z.boss, sc*.72), mkTitan(z.boss2, sc*.72)] : [mkTitan(z.boss, sc)];
  const count = Math.min(type==='x' ? 4 : 3, 1 + Math.floor((k + (w>5?2:0))/2) + (elite?1:0) + (type==='x'?1:0));
  const out=[]; for(let i=0;i<count;i++) out.push(mkTitan(pick(k===0&&w<=5 ? ['t3','t5'] : z.pool), sc));
  return out;
}
function startWave(){
  const type = curNode().t;
  C = {titans:seeded('w'+S.wave+'-'+S.map.pos, ()=>genWave(S.wave, type)), start:S.squad.filter(s=>s.hp>0).length, queue:[], active:null, pending:null, log:[], ev:[], fx:{}, busy:false, used:{}, usedPw:{}, cd:{}, rounds:0, taken:0, gas0:S.gas, acts:{},
    // estadísticas para la nota del combate
    dealt:0, sacts:0, rolls:[], drolls:[], crits:0, nat20:0, nat1:0, execs:0};
  C.by = {}; S.squad.forEach(s=>{ C.by[s.id]={d:0,k:0,c:0,n:0,t:0,a:0}; }); C.comp = compKey(S.squad.filter(s=>s.hp>0));
  C.hp0 = S.squad.filter(s=>s.hp>0).reduce((a,s)=>a+maxHp(s),0); C.ref = S.squad.filter(s=>s.hp>0).reduce((a,s)=>a+atkOf(s),0)/Math.max(1,C.start);
  C.titans.forEach(t=>{ if(t.m.coraza) t.plate = Math.round(t.max*t.m.coraza); });   // coraza del Acorazado: puntos de armadura
  const btr = S.pend && S.pend.btr;
  if(btr){ const b=C.titans[0]; b.n=`${ROSTER[btr.id].n} · ${b.n}`; b.max=b.hp=Math.round(b.max*(btr.id==='eren' ? 1+.15*btr.pws.length : 1.2)); b.atk*=1.1; }
  if(S.mod==='veloces') C.titans.forEach(t=>t.spd+=3);
  if(wxNow()==='noche') C.titans.forEach(t=>{ if(!t.boss && t.cls!=='anormal') t.spd=Math.max(1, t.spd-3); });
  if(type==='x'){ C.hold=3; C.log.push('Rescate: aguantad 3 rondas mientras los civiles cruzan.'); }
  if(!S.pvp && S.scoutZ===S.map.z && type==='b'){ C.titans.forEach(t=>{ if(t.boss) t.mark=Math.max(t.mark,2); }); C.log.push('Lo estudiasteis desde lejos: sabéis dónde golpear.'); }
  if(!S.pvp && (type==='c' || type==='e' || type==='x')) C.reto = seeded('reto'+S.wave+'-'+S.map.pos, ()=>pickReto(C.titans.length));
  C.titans.forEach(t=>{ if(!TITANS[t.id].pvp) codex('t', t.id, 0); });
  S.squad.forEach(s=>{ C.fx[s.id]={up:0,guard:0,taunt:0,evade:0,titan:0,crit:0,armor:0,ward:0,form:null,formT:0,stun:0}; });
  S.gas = Math.min(S.gasMax, S.gas + rel('bengala'));
  C.log.push(type==='b' ? `¡${C.titans[0].n} a la vista!` : `${type==='e'?'Grupo de élite: ':''}${C.titans.length===1?'un titán':C.titans.length+' titanes'} en ${zoneOf(S.wave).n}.`);
  scr='combat';
  // entrada de jefe: presentación cinematográfica antes del primer turno
  if(S.pvp){ C.busy=true; render(); ev({k:'duel', m:`Duelo contra ${DUEL.foeName}.`, a:DUEL.mine.name, b:DUEL.foeName}); return play(()=>{ C.busy=false; nextTurn(); }); }
  const bi = C.titans.findIndex(t=>t.boss);
  if(bi>=0){ C.busy=true; render(); ev({k:'intro', t:bi, m:''}); return play(()=>{ C.busy=false; nextTurn(); }); }
  nextTurn();
}
const ev = e => C.ev.push(e);
// fin de un turno propio (también si lo pierde aturdido): bajan las mejoras temporales y la recarga
function tick(s){ const f=C.fx[s.id]; ['up','guard','taunt','titan','crit','armor','ward','formT'].forEach(k=>{ if(f[k]>0) f[k]--; }); if(C.cd[s.id]>0) C.cd[s.id]--; }
// mejora de equipo: n acciones para cada soldado; quien la lanza gasta su turno en darla, así que cuenta una más
function teamBuff(src, k, n){ alive().forEach(a=>{ C.fx[a.id][k] = Math.max(C.fx[a.id][k], a===src ? n+1 : n); }); }
const say = (m,w) => ev({k:'say', m, w});
function eff(sol, t){ return EFF[ROSTER[sol.id].st][t.cls] || 1; }

function nextTurn(){
  C.active=null; C.pending=null;
  if(!liveT().length) return setTimeout(S.pvp ? ()=>duelEnd(true) : win, 450);
  if(!alive().length) return setTimeout(S.pvp ? ()=>duelEnd(false) : lose, 700);
  planAll();
  if(!C.queue.length){
    const u = alive().map(s=>({s, v:spdOf(s)+rnd(0,2)})).concat(liveT().map(t=>({t, v:t.spd+rnd(0,2)})));
    C.queue = u.sort((a,b)=>b.v-a.v); C.rounds++;
    if(C.hold && C.rounds>C.hold){ C.rounds=C.hold; C.queue=[]; C.held=true; C.log.push('Los civiles han cruzado. ¡Retirada!'); render(); return setTimeout(win, 400); }
  }
  const u = C.queue.shift();
  if(u.s){
    if(u.s.hp<=0) return nextTurn();
    // aturdido (lanzado por el Bestia, pateado por la Hembra): pierde este turno
    if(C.fx[u.s.id].stun>0){ C.fx[u.s.id].stun=0; tick(u.s); C.busy=true; render(); say(`${nm(u.s)} se levanta del suelo.`, 500); return play(()=>{ render(); setTimeout(nextTurn, 140); }); }
    C.active=u.s; C.busy=false; C.itemUsed=false; render();
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
  if(t.exposed>0) d *= 1.5;
  if(t.hard>0 && !o.pierce) d *= .4;
  if(t.plate>0 && !o.pierce) d *= .5;   // coraza: la mitad hasta romperla (lanzas trueno, Mandíbula y cargas la ignoran)
  // d20: 19-20 crítico (17-20 los Precisos); 1, el corte resbala y hace la mitad
  const r = d20(), crit = f.crit>0 || r >= (ROSTER[s.id].st==='preciso' ? 17 : 19) - (wxNow()==='sol' ? 1 : 0), fumble = !crit && (r===1 || (r===2 && wxNow()==='lluvia'));
  if(crit) d *= 1.5; if(fumble) d *= .5;
  d = Math.max(1, Math.round(d));
  const exec = !!o.nape && !t.boss && (t.hp-d)/t.max < .25 && d < t.hp;
  if(exec){ d = t.hp; S.napes=(S.napes||0)+1; if(S.napes>=5) ach('nuca5'); C.execs++; }
  { const B=C.by[s.id]; if(B){ B.d+=Math.min(d,t.hp); if(crit) B.c++; if(r===20 && !(f.crit>0)) B.n++; if(d>=t.hp) B.k++; } }
  C.dealt += Math.min(d, t.hp); if(!(f.crit>0)) C.rolls.push(r); if(crit) C.crits++; if(r===20 && !(f.crit>0)) C.nat20++; if(r===1 && !(f.crit>0)) C.nat1++;
  t.hp = Math.max(0, t.hp-d);
  t.lastHit = s.id; t.threat = t.threat || {}; t.threat[s.id] = (t.threat[s.id]||0) + d;
  // primero el golpe; después lo que provoca (coraza rota, segunda fase)
  ev({k:'slash', s:s.id, t:C.titans.indexOf(t), d, crit, fumble, roll:r, auto:f.crit>0, exec, boss:t.boss, kill:t.hp<=0, hp:t.hp, max:t.max, boom:!!o.pierce,
      m:`${nm(s)} ${o.verb||'corta a'} ${t.n}: ${d} <small class="die">d20 ${f.crit>0?'olfato':r}${crit?' · crítico':fumble?' · resbala':''}</small>${t.hp<=0?'. ¡Abatido!':''}`});
  if(t.plate>0){ t.plate = Math.max(0, t.plate-d); if(t.plate===0 && t.hp>0){ t.exposed=2; ev({k:'mark', fx:'break', t:C.titans.indexOf(t), txt:'¡CORAZA ROTA!', m:`La coraza de ${t.n} salta en pedazos: durante 2 turnos recibe daño ×1,5.`}); } }
  checkPhase(t);
  return t.hp<=0;
}
// control (ceguera, derribo): un titán controlado se pone alerta y no admite otro control durante 2 de sus turnos (3 los jefes)
const canCC = t => t.hp>0 && !(t.alert>0);
const isHuman = t => !!(TITANS[t.id].a && TITANS[t.id].a.k);
function applyCC(t, kind, o={}){   // o.quiet: sin aviso; o.boss: también vale contra cambiantes
  const ti=C.titans.indexOf(t);
  if(t.hp<=0) return false;
  if(t.boss && !o.boss){ if(!o.quiet) say(kind==='blind' ? `${t.n} regenera el ojo al instante.` : `${t.n} aguanta en pie.`); return false; }
  if(t.alert>0){ if(!o.quiet) say(`${t.n} está alerta y no se deja ${kind==='blind'?'cegar':'derribar'}.`); return false; }
  if(kind==='blind') t.blind=1; else t.stun=1;
  t.alert = t.boss ? 3 : 2;
  if(!o.quiet) ev({k:'mark', fx:kind, t:ti, txt:kind==='blind'?'CEGADO':'DERRIBADO'});
  return true;
}
function doAction(kind, target){
  const s=C.active, R=ROSTER[s.id], f=C.fx[s.id], ti = target && C.titans.indexOf(target);
  const all = () => alive().map(a=>a.id);
  C.busy=true; C.pending=null; C.acts[kind.split(':')[0]] = (C.acts[kind.split(':')[0]]||0)+1;
  // los objetos son una acción libre: una vez por turno, sin gastarlo
  if(kind.startsWith('it:')){ useItem(s, kind.slice(3), target); C.itemUsed=true; planAll(); header(); busyUI();
    // si el objeto abate al último enemigo, el combate termina ya (antes se quedaba esperando una orden sin objetivos)
    return play(()=>{ if(!liveT().length) return setTimeout(nextTurn, 140); C.busy=false; render(); }); }
  // las acciones de apoyo cuentan media para el daño por acción (curar o cubrir no hunde la nota)
  if(C.by[s.id]) C.by[s.id].a++;
  C.sacts += SUPPORT.includes(kind==='skill' ? s.id : kind) ? .5 : 1;
  if(kind==='cut') strike(s, target, 1);
  else if(kind==='nape'){ S.gas-=1; strike(s, target, 1.6, {nape:true, verb:isHuman(target)?'apunta y remata a':'va a la nuca de'}); }
  else if(kind.startsWith('pw:')) usePower(s, kind.slice(3), target);
  else {
    S.gas -= R.sk.gas; if(R.sk.once) C.used[s.id]=true;
    ev({k:'cutin', s:s.id, txt:R.sk.n});   // cortinilla de anime con el retrato y el nombre de la habilidad
    switch(s.id){
      case 'eren': strike(s,target, s.hp<maxHp(s)/2 ? 2.2 : 1.5, {verb:'se lanza contra'}); break;
      case 'mikasa': strike(s,target,1); strike(s,target,1); break;
      case 'armin': strike(s,target,1,{verb:'estudia y corta a'}); if(target.hp>0){ target.mark=Math.max(target.mark,3); ev({k:'mark', t:ti, txt:'MARCADO', m:`Armin señala el punto débil de ${target.n}.`}); } break;
      case 'sasha': strike(s,target,1.4,{verb:'dispara a'}); applyCC(target, 'blind'); break;
      case 'jean': teamBuff(s, 'up', 2); ev({k:'buff', ids:all(), txt:'FLANQUEO', m:'Jean ordena flanquear. El escuadrón aprieta.'}); break;
      case 'connie': f.taunt=3; f.evade=1; ev({k:'buff', ids:[s.id], txt:'SEÑUELO', m:'Connie cruza por delante de los titanes gritando.'}); break;
      case 'hange': strike(s,target,2.6,{pierce:true, verb:'clava una lanza trueno en'}); break;
      case 'reiner': f.guard=4; ev({k:'buff', ids:[s.id], txt:'ESCUDO', m:'Reiner se pone delante del escuadrón.'}); break;
      case 'annie': strike(s,target,1.5,{verb:'barre a'}); applyCC(target, 'stun'); break;
      case 'historia': { const h=Math.min(maxHp(target)-target.hp, Math.round(maxHp(target)*.3)); target.hp+=h;
        if(h) ev({k:'heal', s:target.id, d:h, hp:target.hp, max:maxHp(target), m:`Historia venda a ${nm(target)}: +${h} PV.`}); else say(`${nm(target)} no tiene heridas que vendar.`); break; }
      case 'levi': say('Levi gira sobre sí mismo.',120); liveT().forEach(t=>strike(s,t,1)); break;
      case 'erwin': ev({k:'buff', ids:all(), txt:'¡AVANZAD!', m:'Erwin: «¡Avanzad!»'}); alive().filter(a=>a!==s).forEach(a=>strike(a,target,1)); break;
      case 'ymir': if(strike(s,target,1.7,{verb:'muerde a'})){ const h=Math.min(maxHp(s)-s.hp, Math.round(maxHp(s)*.3)); s.hp+=h;
        if(h) ev({k:'heal', s:s.id, d:h, hp:s.hp, max:maxHp(s), m:`Ymir se rehace: +${h} PV.`}); } break;
      case 'nanaba': for(let i=0;i<2;i++){ const l=liveT(); if(l.length) strike(s, pick(l), 1.1, {verb:'pasa rasante sobre'}); } break;
      case 'mike': teamBuff(s, 'crit', 2); ev({k:'buff', ids:all(), txt:'OLFATO', m:'Mike olfatea el aire y señala dónde cortar.'}); break;
      case 'floch': say('Floch ordena la salva.',120); liveT().forEach(t=>strike(s,t,1.2,{pierce:true, verb:'revienta a'})); break;
      case 'gabi': strike(s,target,2.1,{verb:'dispara a'}); break;
      case 'bertolt': strike(s,target,1.6,{verb:'golpea a'}); liveT().filter(t=>t!==target).forEach(t=>strike(s,t,.4,{pierce:true, verb:'abrasa con vapor a'})); break;
      case 'kenny': strike(s,target,2,{verb:'dispara a bocajarro a'}); { const o=liveT().filter(t=>t!==target); if(o.length) strike(s, pick(o), .6, {verb:'remata con la otra pistola a'}); } break;
      case 'zeke': say('Zeke lanza una lluvia de piedras.',120); liveT().forEach(t=>{ strike(s,t,1,{verb:'apedrea a'}); if(t.hp>0 && !t.boss && Math.random()<.25) applyCC(t,'stun'); }); break;
      case 'pieck': say('La artillería de Pieck abre fuego.',120); liveT().forEach(t=>{ strike(s,t,.8,{verb:'bombardea a'}); if(t.hp>0) t.mark=Math.max(t.mark,2); }); break;
    }
  }
  tick(s);
  if(kind==='skill' && R.sk.cd) C.cd[s.id]=R.sk.cd;
  planAll(); header(); busyUI();
  play(()=>{ render(); setTimeout(nextTurn, 140); });
}
// daño de titán a soldado
function wound(t, s, mult){   // devuelve al soldado alcanzado (el escudo puede interponerse) o null si el golpe falla
  if(s.hp<=0) return null;
  const guard = alive().find(a=>C.fx[a.id].guard>0 && a!==s);
  const tgt = guard || s, f=C.fx[tgt.id], ti=C.titans.indexOf(t);
  let d = t.atk*mult*rnd(.85,1.15);
  if(t.blind>0){ ev({k:'miss', t:ti, s:tgt.id, txt:'FALLA', m:`${t.n} ${TITANS[t.id].a.k?'dispara a ciegas':'manotea a ciegas'} y falla.`}); return null; }
  if(f.evade>0){ f.evade=0; ev({k:'miss', t:ti, s:tgt.id, txt:'ESQUIVA', m:`${nm(tgt)} esquiva a ${t.n}.`}); return null; }
  // tirada de esquiva: d20 + bono de velocidad; 20 siempre esquiva
  const r=d20(), mod=Math.max(0, Math.floor((spdOf(tgt)-10)/3)) + (wxNow()==='niebla' ? 1 : 0), die=`d20 ${r}${mod?'+'+mod:''}`; C.drolls.push(r);
  if(r+mod>=20){ ev({k:'miss', t:ti, s:tgt.id, txt:'ESQUIVA', die, roll:r, mod, m:`${nm(tgt)} esquiva a ${t.n} <small class="die">${die} · esquiva</small>`}); return null; }
  if(guard || f.guard>0) d*=.5;
  if(f.titan>0) d*=.5;
  if(f.armor>0) d*=.5;
  if(f.ward>0) d*=.6;
  d *= Math.max(.6, 1-.10*rel('cristal'));
  d = Math.max(1, Math.round(d));
  tgt.hp = Math.max(0, tgt.hp-d); C.taken += d; if(C.by[tgt.id]) C.by[tgt.id].t += d;
  ev({k:'bite', t:ti, s:tgt.id, d, die, roll:r, mod, big:mult>=1.5, hp:tgt.hp, max:maxHp(tgt), dead:tgt.hp<=0, m:`${t.n} ${t.v||'golpea a'} ${nm(tgt)}: ${d} <small class="die">${die}</small>${tgt.hp<=0?'. Ha caído.':''}`});
  return tgt;
}
function titanAct(t){
  const ti=C.titans.indexOf(t), m=t.m, every = n => n && t.turns%n===0;
  t.turns++;
  if(t.hard>0) t.hard--;
  if(t.mark>0) t.mark--;
  const cc = t.stun>0 || t.blind>0;   // este turno lo pierde o falla: la alerta empieza a contar en el siguiente
  if(!cc && t.alert>0) t.alert--;
  if(t.stun>0){ t.stun=0; return say(`${t.n} sigue en el suelo.`, 450); }
  // primer golpe: a quien anunció su intención (salvo señuelo); los siguientes, al azar
  const choose = first=>{ const a=alive(); if(!a.length) return null; const tz=a.find(x=>C.fx[x.id].taunt>0); if(tz) return tz;
    if(first){ const s=a.find(x=>x.id===t.intent); if(s) return s; } return pick(a); };
  if(t.exposed>0){ t.exposed--; if(t.exposed===0 && t.m.coraza){ t.plate=Math.round(t.max*t.m.coraza*.6); ev({k:'roar', t:ti, fx:'coraza', txt:'CORAZA', m:`${t.n} regenera parte de la coraza.`}); } }
  if(every(m.harden)){ t.hard=1; ev({k:'roar', t:ti, fx:'harden', txt:'ENDURECIMIENTO', m:`${t.n} endurece la piel.`}); }
  if(every(m.aoe)){ ev({k:'roar', t:ti, fx:'aoe', txt:m.txt||'EMBESTIDA', m:`${t.n} golpea a todo el escuadrón.`}); alive().forEach(s=>wound(t,s,.6)); }
  else if(every(m.devour)){
    // devorar: a por el más herido; si alguien lo cubre (Escudo humano o Señuelo) el golpe es normal, si no, devastador
    const tz = alive().find(x=>C.fx[x.id].taunt>0), weak = alive().sort((a,b)=>a.hp/maxHp(a)-b.hp/maxHp(b))[0];
    const s = tz || weak, covered = !!tz || alive().some(x=>C.fx[x.id].guard>0);
    ev({k:'roar', t:ti, fx:'devour', txt:'DEVORA', m:`${t.n} se lanza a por ${nm(s)}${covered?', pero el escuadrón lo cubre.':'. ¡Nadie lo cubre!'}`}); wound(t,s,covered?1.2:2.2);
  } else if(every(m.throw)){
    // lanzamiento: agarra a un soldado y lo lanza lejos; quien recibe el golpe pierde su próximo turno (si lo esquiva, no)
    const s = choose(true); if(s){ ev({k:'roar', t:ti, fx:'throw', s:s.id, txt:'LANZAMIENTO', m:`${t.n} agarra a ${nm(s)} y lo lanza contra las casas.`}); const h=wound(t,s,.9); if(h && h.hp>0){ C.fx[h.id].stun=1; ev({k:'buff', stun:1, ids:[h.id], txt:'ATURDIDO', m:`${nm(h)} queda aturdido: pierde su próximo turno.`}); } }
  } else if(every(m.kick)){
    const s = choose(true); if(s){ ev({k:'roar', t:ti, fx:'kick', s:s.id, txt:'PATADA', m:`${t.n} lanza una patada endurecida a ${nm(s)}.`}); const h=wound(t,s,1.5); if(h && h.hp>0){ C.fx[h.id].stun=1; ev({k:'buff', stun:1, ids:[h.id], txt:'ATURDIDO', m:`${nm(h)} sale despedido y pierde su próximo turno.`}); } }
  } else {
    const n = t.twice ? 2 : 1;
    for(let i=0;i<n;i++){ const s=choose(i===0); if(s){ wound(t,s,t.twice?.7:1); if(t.threat && t.threat[s.id]) t.threat[s.id]*=.4; } }
  }
  if(m.aura && alive().length){ ev({k:'roar', t:ti, fx:'aura', txt:'CALOR', m:`El calor de ${t.n} abrasa al escuadrón.`}); alive().forEach(s=>wound(t,s,m.aura)); }
  if(t.blind>0) t.blind=0;
  if(every(m.summon) && alive().length){
    // ocupa un hueco libre: nunca hay más de tres titanes en pantalla
    const slot = C.titans.length<3 ? C.titans.length : C.titans.findIndex(x=>x.hp<=0 && !x.boss);
    if(slot>=0){ const n = mkTitan(pick(zoneOf(S.wave).pool), scaleAt(S.wave)*.6); C.titans[slot]=n;
      ev({k:'summon', t:slot, txt:'LLAMADA', m:`${t.n} llama a un ${n.n}.`}); }
  }
}

// ---- intenciones: cada titán anuncia a quién atacará en su próximo turno ----
const TARGETING = {pequeno:'debil', grande:'ultimo', anormal:'poder', blindado:'amenaza'};
const AI_TXT = {debil:'Va a por el soldado más herido si baja del 60 % de PV.', ultimo:'Responde a quien le acaba de cortar.', poder:'Busca a los portadores de poderes.', amenaza:'Persigue al que más daño le ha hecho; tras golpearlo, reparte.'};
const aiOf = t => t.boss ? 'amenaza' : TARGETING[t.cls];
function planIntent(t){
  if(t.hp<=0){ t.intent=null; return; }
  const a=alive(); if(!a.length){ t.intent=null; return; }
  const nx=t.turns+1, m=t.m, due=n=>n && nx%n===0;
  t.special = due(m.aoe) ? 'all' : due(m.devour) ? 'devora' : due(m.throw) ? 'lanzamiento' : due(m.kick) ? 'patada' : null;
  if(due(m.harden)) t.special = (t.special ? t.special+' · ' : '') + 'endurece';
  if(due(m.aoe)){ t.intent='all'; return; }
  const tz=a.find(x=>C.fx[x.id].taunt>0); if(tz){ t.intent=tz.id; return; }
  const by = due(m.devour) ? 'debil' : aiOf(t);
  let s=null;
  if(by==='debil'){ s=a.slice().sort((x,y)=>x.hp/maxHp(x)-y.hp/maxHp(y))[0]; if(!due(m.devour) && s.hp/maxHp(s)>.6) s=null; }
  else if(by==='ultimo') s=a.find(x=>x.id===t.lastHit);
  else if(by==='poder') s=a.find(x=>pwOf(x.id).length || C.fx[x.id].formT>0);
  else if(by==='amenaza' && t.threat){ s=a.slice().sort((x,y)=>(t.threat[y.id]||0)-(t.threat[x.id]||0))[0]; if(!t.threat[s.id]) s=null; }
  // sin preferencia clara: mantiene el objetivo que ya había anunciado para que no cambie sin motivo
  t.intent = (s || a.find(x=>x.id===t.intent) || pick(a)).id;
}
function planAll(){ if(C) C.titans.forEach(planIntent); }

// ---- previsión de daño: lo que haría cada orden contra cada titán, sin azar ----
const SKILL_MULT = {bertolt:()=>1.6, kenny:()=>2, eren:s=>s.hp<maxHp(s)/2?2.2:1.5, mikasa:()=>2, armin:()=>1, sasha:()=>1.4, hange:()=>2.6, annie:()=>1.5, ymir:()=>1.7, gabi:()=>2.1};
function estimate(s, t, kind){
  if(!s || !t || t.hp<=0) return null;
  if(kind==='it:carga'){ const d=Math.min(t.hp, itemDmg()); return {lo:d, hi:d, kill:d>=t.hp}; }
  const mult = kind==='cut' ? 1 : kind==='nape' ? 1.6 : kind==='skill' ? (SKILL_MULT[s.id] ? SKILL_MULT[s.id](s) : 0)
    : kind==='pw:hembra' ? 2.2 : kind==='pw:mandibula' ? 2.8 : 0;
  if(!mult) return null;
  const pierce = kind==='pw:mandibula' || (kind==='skill' && s.id==='hange'), f=C.fx[s.id];
  let d = atkOf(s)*mult;
  if(!pierce) d *= eff(s,t);
  d *= 1 + .15*rel('cuchillas'); if(t.boss) d *= 1 + .3*rel('lanzas');
  if(f.up>0) d*=1.35; if(f.titan>0) d*=2; if(t.mark>0) d*=1.5; if(t.exposed>0) d*=1.5; if(t.hard>0 && !pierce) d*=.4; if(t.plate>0 && !pierce) d*=.5; if(f.crit>0) d*=1.5;
  const lo=Math.max(1,Math.round(d*.9)), hi=Math.max(1,Math.round(d*1.1));
  const exec = kind==='nape' && !t.boss && (t.hp-hi)/t.max < .25;
  return {lo, hi, kill: lo>=t.hp || exec, exec};
}

// ---- objetos de un solo uso (máximo 3, acción libre una vez por turno) ----
const ITEMS = {
  humo:     {n:'Bengala de humo',  d:'Todos los titanes fallan su próximo ataque.', tgt:'none'},
  carga:    {n:'Carga explosiva',  d:'Daño fijo que ignora resistencias y endurecimiento.', tgt:'enemy'},
  botiquin: {n:'Botiquín',         d:'Todo el escuadrón recupera el 30 % de sus PV.', tgt:'none'},
  cable:    {n:'Cable de rescate', d:'Un compañero recupera el 50 % de sus PV.', tgt:'ally'},
  bombona:  {n:'Bombona de gas',   d:'+4 de gas.', tgt:'none'}
};
const itemDmg = () => Math.round(30 + 9*S.wave);
function useItem(s, k, target){
  S.items = S.items || []; const i=S.items.indexOf(k); if(i<0) return; S.items.splice(i,1);
  const heal = (a,p) => { const h=Math.min(maxHp(a)-a.hp, Math.round(maxHp(a)*p)); a.hp+=h; ev({k:'heal', s:a.id, d:h, hp:a.hp, max:maxHp(a), m:h?`${nm(a)} recupera ${h} PV.`:''}); };
  switch(k){
    case 'humo': liveT().forEach(t=>{ t.blind=1; });   // el humo no se esquiva: ciega a todos, también a jefes y titanes alerta, sin dejarlos alerta
       ev({k:'roarAll', txt:'HUMO', m:`${nm(s)} lanza una bengala de humo. Los titanes no ven nada.`}); break;
    case 'carga': { const d=Math.min(target.hp, itemDmg()); target.hp-=d; C.dealt+=d;
      ev({k:'slash', s:s.id, t:C.titans.indexOf(target), d, crit:false, exec:false, kill:target.hp<=0, boss:target.boss, hp:target.hp, max:target.max, boom:true, m:`${nm(s)} detona una carga en ${target.n}: ${d}${target.hp<=0?'. ¡Abatido!':''}`});
      if(target.plate>0){ target.plate=Math.max(0,target.plate-d); if(!target.plate && target.hp>0){ target.exposed=2; ev({k:'mark', fx:'break', t:C.titans.indexOf(target), txt:'¡CORAZA ROTA!', m:`La coraza de ${target.n} salta en pedazos.`}); } }
      checkPhase(target); break; }
    case 'botiquin': alive().forEach(a=>heal(a,.3)); break;
    case 'cable': heal(target,.5); break;
    case 'bombona': S.gas=Math.min(S.gasMax, S.gas+4); ev({k:'buff', ids:[s.id], txt:'+4 GAS', m:`${nm(s)} cambia de bombona.`}); break;
  }
}

// ---- jefes en dos fases: al bajar del 50 % se enfurecen ----
function checkPhase(t){
  if(!t.boss || t.phase || t.hp<=0 || t.hp>t.max/2) return;
  t.phase=1; t.atk*=1.15; t.spd+=2;
  const m = t.m = Object.assign({}, t.m);
  if(m.aoe) m.aoe=Math.max(2, m.aoe-1);
  if(m.harden) m.harden=Math.max(2, m.harden-1);
  if(m.devour) m.devour=Math.max(2, m.devour-1);
  if(m.throw) m.throw=Math.max(2, m.throw-1);
  if(m.kick) m.kick=Math.max(2, m.kick-1);
  if(!m.aoe && !m.devour && !m.summon && !m.harden && !m.throw && !m.kick && !m.coraza) m.harden=3;
  ev({k:'roar', t:C.titans.indexOf(t), fx:'phase', txt:'SEGUNDA FASE', m:`${t.n} se enfurece: golpea más fuerte y más deprisa.`});
}

// ---- nota del combate (E a S+): rapidez, daño recibido, eficacia, suerte del d20 y estilo ----
// par de rondas según el tipo de combate y cuántos enemigos hay (calibrado con el simulador)
function parOf(type, n){ if(S && S.pvp) return 11; if(type==='x') return 3; return type==='b' ? (C && C.titans[0] && C.titans[0].m.summon ? PAR.bs : PAR.b) : (type==='e' ? PAR.e : PAR.n) + PAR.k*(Math.min(3,n)-1); }
const SUPPORT = ['jean','connie','reiner','historia','mike','pw:carguero','pw:acorazado','pw:martillo','pw:ataque'];
const PAR = {n:2.3, e:3.3, k:.95, b:4.5, bs:6};   // jefes: calibrado con partidas reales (los humanos tardan más que el bot)
const GRADES = [['S+',95],['S',87],['A',76],['B',63],['C',50],['D',36],['E',0]];
const compKey = sq => sq.map(s=>s.id).sort().join('+');
const clamp01 = x => Math.max(0, Math.min(1, x));
function gradeOf(sc){ return GRADES.find(g=>sc>=g[1])[0]; }
function rateFight(type){
  const par = parOf(type, C.titans.length), r = C.rounds;
  const all = C.rolls.concat(C.drolls), avg = all.length ? all.reduce((a,b)=>a+b,0)/all.length : 10.5;
  const lost = C.start - alive().length, eff = C.sacts ? C.dealt/C.sacts/Math.max(1,C.ref) : 0, ratio = C.taken/Math.max(1,C.hp0);
  const parts = [
    {k:'rapidez', n:'Rapidez', max:30, v:30*clamp01((par*1.6 - r)/par), d:`${r} ronda${r===1?'':'s'} · par ${par.toFixed(1).replace('.',',')}`},
    {k:'aguante', n:'Daño recibido', max:30, v:30*clamp01(1 - ratio/.6), d:`${Math.round(ratio*100)} % de la vida del escuadrón`},
    {k:'eficacia', n:'Daño por acción', max:25, v:25*clamp01(Math.log2(Math.max(1,eff))/3), d:`×${eff.toFixed(2).replace('.',',')} sobre un corte normal`},
    {k:'suerte', n:'Suerte del d20', max:15, v:Math.max(0, 10*clamp01((avg-6)/9) + Math.min(5, 2.5*C.nat20) - 2*C.nat1), d:`media ${avg.toFixed(1).replace('.',',')} en ${all.length} tirada${all.length===1?'':'s'}${C.nat20?` · ${C.nat20} × 20 natural`:''}${C.nat1?` · ${C.nat1} pifia${C.nat1>1?'s':''}`:''}`}
  ];
  const bonus = [];
  if(C.execs) bonus.push({n:`Remates a la nuca ×${C.execs}`, v:Math.min(6, 2*C.execs)});
  if(!C.taken) bonus.push({n:'Sin un rasguño', v:5});
  if(lost) bonus.push({n:`${lost} baja${lost>1?'s':''}`, v:-15*lost});
  let score = Math.round(parts.reduce((a,p)=>a+p.v,0) + bonus.reduce((a,b)=>a+b.v,0));
  score = Math.max(0, Math.min(110, score));
  let g = gradeOf(score);
  // con bajas no hay S; si cae medio escuadrón, como mucho C
  if(lost && GRADES.findIndex(x=>x[0]===g) < 2) g='A';
  if(lost*2 >= C.start && GRADES.findIndex(x=>x[0]===g) < 4) g='C';
  return {g, score, par, rounds:r, parts:parts.map(p=>({...p, v:Math.round(p.v)})), bonus, avg, lost, eff, taken:C.taken, type, boss: type==='b' ? C.titans[0].id : null};
}

// ---- ritmo: condiciones de zona (una por zona, visible en el mapa) y retos opcionales en combates normales y élites ----
const WX = {
  despejado:{n:'Despejado', d:'Sin nada especial.'},
  niebla:{n:'Niebla', d:'Los soldados esquivan mejor: +1 a la tirada de esquiva.'},
  noche:{n:'Noche', d:'Los titanes normales van más lentos (−3 de velocidad). Los anormales y los cambiantes, no.'},
  sol:{n:'Sol de mediodía', d:'Buena visibilidad: los críticos también salen con un 18 (16 los Precisos).'},
  viento:{n:'Viento de cara', d:'El gas rinde menos: recuperas 1 menos tras cada combate.'},
  lluvia:{n:'Lluvia', d:'El acero resbala: un 2 en el d20 también es pifia.'}
};
const WX_W = [['despejado',30],['niebla',14],['noche',14],['sol',14],['viento',14],['lluvia',14]];
function rollWx(z){ if(z%3===0) return 'despejado'; let x=Math.random()*100; for(const [k,p] of WX_W){ x-=p; if(x<0) return k; } return 'despejado'; }
const wxNow = () => (S && !S.pvp && S.map && S.map.wx) || 'despejado';
const RETOS = {
  nuca2:{n:'Remata a dos en la nuca', ok:()=>C.execs>=2, min:2, nohold:1},
  r3:{n:'Gana en 3 rondas o menos', ok:()=>C.rounds<=3 && !C.held, nohold:1},
  sano:{n:'Que nadie acabe por debajo de la mitad de PV', ok:()=>S.squad.every(s=>s.hp>=maxHp(s)*.5)},
  crit2:{n:'Consigue dos críticos', ok:()=>C.crits>=2, min:2},
  ahorro:{n:'Gasta 2 de gas o menos', ok:()=>C.gas0 - (C.gasEnd==null ? S.gas : C.gasEnd) <= 2},
  nat20:{n:'Saca un 20 natural', ok:()=>C.nat20>=1}
};
const RETO_COINS = 8;
function pickReto(n){ const ks=Object.keys(RETOS).filter(k=>(!RETOS[k].min || n>=RETOS[k].min) && !(RETOS[k].nohold && C && C.hold)); return ks[Math.floor(Math.random()*ks.length)]; }
// al ganar: comprueba el reto antes de curar y repostar
function checkReto(){ if(!C || !C.reto || !RETOS[C.reto]) return null; C.gasEnd = S.gas; const ok = !!RETOS[C.reto].ok(); return {k:C.reto, n:RETOS[C.reto].n, ok}; }
