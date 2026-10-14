// Auditoría de combate: cada soldado × cada enemigo × cada acción (corte, nuca, habilidad, 9 poderes, 5 objetos),
// pruebas de mecánicas concretas y miles de combates al azar comprobando invariantes tras cada acción.
// Uso: node scripts/audit.cjs [partidas_fuzz]
const fs=require('fs');
const q=[]; global.setTimeout=(f)=>q.push(f);
const mem={}; global.localStorage={getItem(k){return mem[k]||null},setItem(k,v){mem[k]=v},removeItem(k){delete mem[k]}};
const D=__dirname+'/../src/';
let src=['01-datos.js','02-combate.js','03-mapa.js','04-los-nueve.js','045-sendas.js','096-logros.js','0965-estadisticas.js'].map(f=>fs.readFileSync(D+f,'utf8')).join('\n');
const FXK=[...fs.readFileSync(D+'08-efectos.js','utf8').matchAll(/^  async (\w+)\(e\)/gm)].map(m=>m[1]);
src+=`
const FXK=${JSON.stringify(FXK)}; const GRADE_ORDER_T=['S+','S','A','B','C','D','E'];
function render(){} function header(){} function busyUI(){}
skipRunStart=true;
const BUGS={}; let CTX='';
function bug(k, extra){ const key=k; if(!BUGS[key]) BUGS[key]={n:0, ex:CTX+(extra?' · '+extra:'')}; BUGS[key].n++; }
const fin = x => typeof x==='number' && isFinite(x);
function inv(where){
  if(!S) return;
  if(!fin(S.gas) || S.gas<0 || S.gas>S.gasMax || S.gas%1) bug('gas fuera de rango ('+where+')', 'gas='+S.gas+'/'+S.gasMax);
  S.squad.forEach(s=>{ const m=maxHp(s); if(!fin(s.hp)||s.hp<0||s.hp>m||s.hp%1) bug('PV de soldado inválidos ('+where+')', s.id+' '+s.hp+'/'+m); });
  if(C) { C.titans.forEach(t=>{
    if(!fin(t.hp)||t.hp<0||t.hp>t.max||t.hp%1) bug('PV de enemigo inválidos ('+where+')', t.id+' '+t.hp+'/'+t.max);
    if(!fin(t.atk)||t.atk<=0) bug('ataque de enemigo inválido', t.id+' '+t.atk);
    ['mark','stun','blind','hard','alert','exposed','plate'].forEach(k=>{ if(t[k]!==undefined && (!fin(t[k])||t[k]<0)) bug('estado '+k+' inválido', t.id+' '+t[k]); });
  });
  if(C.titans.length>3) bug('más de 3 enemigos en pantalla');
  Object.entries(C.cd).forEach(([k,v])=>{ if(!fin(v)||v<0) bug('recarga inválida', k+' '+v); }); }
}
function checkEv(e){
  if(!FXK.includes(e.k)) return bug('evento sin animación: '+e.k);
  if('t' in e && e.t!==undefined && (e.t<0 || !C.titans[e.t])) bug('evento '+e.k+' con titán inexistente', 't='+e.t);
  if('s' in e && e.s!==undefined && !S.squad.some(x=>x.id===e.s)) bug('evento '+e.k+' con soldado inexistente', 's='+e.s);
  ['d','hp','max'].forEach(k=>{ if(k in e && !fin(e[k])) bug('evento '+e.k+' con '+k+' no numérico', String(e[k])); });
  if(e.k==='heal' && e.d===0 && e.m) bug('curación de 0 anunciada', e.m);
  if(e.m && /undefined|NaN/.test(e.m)) bug('texto con undefined/NaN', e.m);
}
let LASTEV=[]; function play(d){ const evs=C.ev.splice(0); LASTEV=LASTEV.concat(evs); evs.forEach(checkEv); inv('evento'); d(); }
// --- montar un combate a medida ---
let FORCE=null;
const _genWave=genWave; genWave=function(w,type){ return FORCE ? FORCE() : _genWave(w,type); };
function setup(ids, enemies, o={}){ q.length=0;
  newRun(ids, o.saga||0); S.wave=o.wave||20; S.gas=S.gasMax=o.gas||20; S.items=o.items||[]; S.pw={};
  (o.pw||[]).forEach(([k,id])=>{ S.pw[k]=id; }); S.squad.forEach(s=>{ s.lvl=S.wave; s.hp=maxHp(s); });
  S.map={rows:[[{t:o.node||'n', n:[]}]], pos:[0,0], path:[0], z:0};
  FORCE=()=>enemies.map(id=>mkTitan(id, scaleAt(S.wave))); startWave(); FORCE=null;
}
// avanza hasta que un soldado concreto (o cualquiera) pueda actuar, o termine el combate
function runUntil(pred, max=4000){ let n=0; while(n++<max){ if(scr!=='combat') return 'fin'; if(C.active && !C.busy && (!pred || pred())) return 'turno'; if(!q.length) return 'atasco'; q.shift()(); } return 'bucle'; }
function giveTurn(id){ const s=S.squad.find(x=>x.id===id); C.queue=[]; C.active=s; C.busy=false; C.itemUsed=false; }
const ACTIONS = ids => ['cut','nape','skill'].concat(NINE.map(k=>'pw:'+k), Object.keys(ITEMS).map(k=>'it:'+k));
function legal(a, kind){
  if(kind==='nape') return S.gas>=1;
  if(kind==='skill'){ const sk=ROSTER[a.id].sk; return S.gas>=sk.gas && !(sk.once&&C.used[a.id]) && !(C.cd[a.id]>0); }
  if(kind.startsWith('pw:')) return pwOf(a.id).includes(kind.slice(3)) && !C.usedPw[kind.slice(3)];
  if(kind.startsWith('it:')) return !C.itemUsed && (S.items||[]).includes(kind.slice(3));
  return true;
}
function tgtFor(a, kind){
  const tg = kind==='skill' ? ROSTER[a.id].sk.tgt : kind.startsWith('pw:') ? POWERS[kind.slice(3)].tgt : kind.startsWith('it:') ? ITEMS[kind.slice(3)].tgt : 'enemy';
  if(tg==='enemy') return pick(liveT()); if(tg==='ally') return pick(alive()); return undefined;
}
function act(kind, target){ const a=C.active; try{ doAction(kind, target); }catch(x){ bug('excepción en '+kind+': '+x.message, a.id); } }
// ======== 1) matriz: soldado × enemigo × acción ========
let combos=0;
const ENEM=Object.keys(TITANS);
for(const id of Object.keys(ROSTER)) for(const en of ENEM) for(const kind of ACTIONS()){
  const mate = id==='mikasa'?'eren':'mikasa';
  for(const pair of [[en],[en,'t5','an1']]){
    CTX=id+' → '+pair.join('+')+' · '+kind;
    setup([id, mate], pair, {pw: kind.startsWith('pw:') ? [[kind.slice(3), id]] : [], items: kind.startsWith('it:') ? [kind.slice(3)] : [], node: TITANS[en].boss?'b':'n'});
    S.squad[1].hp = Math.round(maxHp(S.squad[1])*.4);   // un herido para curas
    giveTurn(id); combos++;
    const tgt = tgtFor(C.active, kind), t0 = tgt && tgt.hp, gas0=S.gas;
    act(kind, tgt);
    if(kind.startsWith('it:') && !C.busy && scr==='combat' && !liveT().length && !q.length) bug('objeto mata al último enemigo y el combate no termina');
    const r = runUntil(null);
    if(r==='atasco') bug('combate atascado tras '+kind.split(':')[0]);
    if(r==='bucle') bug('bucle infinito tras '+kind.split(':')[0]);
    if(kind==='nape' && S.gas!==gas0-1 && scr==='combat') {}
  }
}
// ======== 2) pruebas de mecánicas ========
const T = (name, fn) => { CTX='prueba: '+name; try{ const r=fn(); if(r!==true) bug('FALLA '+name, String(r)); }catch(x){ bug('FALLA '+name+' (excepción)', x.message); } };
const withD20 = (v, fn) => { const save=Math.random; Math.random=()=>(v-1)/20+.001; try{ return fn(); } finally{ Math.random=save; } };
T('lanzamiento esquivado no aturde', ()=>{ setup(['eren','mikasa'],['bes']); const b=C.titans[0]; b.turns=3; b.intent='eren';
  withD20(20, ()=>titanAct(b)); C.ev=[]; return !C.fx.eren.stun && !C.fx.mikasa.stun || 'aturdido pese a esquivar'; });
T('lanzamiento acertado aturde', ()=>{ setup(['eren','mikasa'],['bes']); const b=C.titans[0]; b.turns=3; b.intent='eren';
  withD20(2, ()=>titanAct(b)); C.ev=[]; return C.fx.eren.stun===1 || 'no aturde'; });
T('devorar persigue al Señuelo', ()=>{ setup(['connie','mikasa'],['son']); const b=C.titans[0]; b.turns=2; C.fx.connie.taunt=2; C.fx.connie.evade=0;
  S.squad[1].hp=5; const h0=S.squad[0].hp; withD20(2, ()=>titanAct(b)); C.ev=[]; return S.squad[0].hp<h0 && S.squad[1].hp===5 || 'no fue a por Connie'; });
T('Escudo humano recibe el lanzamiento y queda aturdido', ()=>{ setup(['reiner','mikasa'],['bes']); const b=C.titans[0]; b.turns=3; b.intent='mikasa'; C.fx.reiner.guard=3;
  withD20(2, ()=>titanAct(b)); C.ev=[]; return C.fx.reiner.stun===1 && !C.fx.mikasa.stun || 'stun en '+JSON.stringify([C.fx.reiner.stun,C.fx.mikasa.stun]); });
T('coraza: mitad de daño, rotura y 2 turnos expuesto', ()=>{ setup(['mikasa','eren'],['aco']); const t=C.titans[0]; const p0=t.plate; if(!p0) return 'sin coraza';
  t.plate=1; giveTurn('mikasa'); withD20(10, ()=>strike(C.active,t,1)); C.ev=[]; if(t.exposed!==2) return 'exposed='+t.exposed;
  t.turns=0; titanAct(t); titanAct(t); C.ev=[]; return t.exposed===0 && t.plate>0 || 'expuesto '+t.exposed+' coraza '+t.plate; });
T('Flecha al ojo no ciega jefes', ()=>{ setup(['sasha','eren'],['hem']); giveTurn('sasha'); doAction('skill', C.titans[0]); C.ev=[]; return !C.titans[0].blind || 'jefe cegado'; });
T('humo ciega a todos, también alerta y jefes', ()=>{ setup(['sasha','eren'],['hem','t5']); C.titans[1].alert=2; S.items=['humo']; giveTurn('sasha'); doAction('it:humo'); C.ev=[];
  return C.titans.every(t=>t.blind>0) || 'cegados '+C.titans.map(t=>t.blind); });
T('alerta impide el segundo control', ()=>{ setup(['annie','eren'],['t15']); const t=C.titans[0]; applyCC(t,'stun'); t.stun=0; const ok=!applyCC(t,'blind'); C.ev=[]; return ok || 'se dejó controlar dos veces'; });
T('nuca no remata jefes', ()=>{ setup(['mikasa','eren'],['col']); const t=C.titans[0]; t.hp=Math.round(t.max*.2); t.phase=1; giveTurn('mikasa'); withD20(10,()=>doAction('nape', t)); C.ev=[]; return t.hp>0 || 'jefe rematado'; });
T('nuca remata titán normal bajo el 25 %', ()=>{ setup(['mikasa','eren'],['t15']); const t=C.titans[0]; t.hp=Math.round(t.max*.3); giveTurn('mikasa'); withD20(10,()=>doAction('nape', t)); C.ev=[]; return t.hp===0 || 'quedan '+t.hp; });
T('segunda fase al 50 %', ()=>{ setup(['mikasa','eren'],['son']); const t=C.titans[0]; t.hp=Math.round(t.max*.52); const a0=t.atk; giveTurn('mikasa'); withD20(10,()=>strike(C.active,t,1)); C.ev=[]; return t.phase===1 && t.atk>a0 && t.m!==TITANS.son.m || 'sin fase'; });
T('segunda fase no muta la plantilla', ()=>JSON.stringify(TITANS.son.m)==='{"devour":3}' || JSON.stringify(TITANS.son.m));
T('Fundador no supera 3 enemigos', ()=>{ setup(['mikasa','eren'],['fun','mur','mur']); const t=C.titans[0]; for(let i=0;i<12;i++){ t.turns=i; titanAct(t); C.ev=[]; S.squad.forEach(s=>s.hp=maxHp(s)); } return C.titans.length<=3 || C.titans.length; });
T('recargas: Connie espera 2 turnos', ()=>{ setup(['connie','eren'],['t15']); giveTurn('connie'); doAction('skill'); C.ev=[]; return C.cd.connie===2 || 'cd='+C.cd.connie; });
T('Flanqueo dura 2 acciones para todos', ()=>{ setup(['jean','eren','mikasa'],['t15']); giveTurn('jean'); doAction('skill'); C.ev=[]; return C.fx.jean.up===C.fx.eren.up-1+1-0 && C.fx.eren.up===2 && C.fx.jean.up===2 || 'jean '+C.fx.jean.up+' eren '+C.fx.eren.up; });
T('Olfato dura 2 acciones para todos', ()=>{ setup(['mike','eren'],['t15']); giveTurn('mike'); doAction('skill'); C.ev=[]; return C.fx.mike.crit===2 && C.fx.eren.crit===2 || 'mike '+C.fx.mike.crit+' eren '+C.fx.eren.crit; });
T('Martillo dura 3 acciones para todos', ()=>{ setup(['eren','mikasa'],['t15'],{pw:[['martillo','eren']]}); giveTurn('eren'); doAction('pw:martillo'); C.ev=[]; return C.fx.eren.up===3 && C.fx.mikasa.up===3 || 'eren '+C.fx.eren.up+' mikasa '+C.fx.mikasa.up; });
T('Titán de Ataque: 3 acciones', ()=>{ setup(['eren','mikasa'],['t15'],{pw:[['ataque','eren']]}); giveTurn('eren'); doAction('pw:ataque'); C.ev=[]; return C.fx.eren.titan===3 || C.fx.eren.titan; });
T('marca no se acorta (Armin 3 + Pieck 2)', ()=>{ setup(['armin','pieck'],['t15','t15']); giveTurn('armin'); withD20(10,()=>doAction('skill', C.titans[0])); C.ev=[]; giveTurn('pieck'); withD20(10,()=>doAction('skill')); C.ev=[]; return C.titans[0].mark===3 || 'mark='+C.titans[0].mark; });
T('carga que abate al último termina el combate', ()=>{ setup(['eren','mikasa'],['t3']); S.items=['carga']; giveTurn('eren'); doAction('it:carga', C.titans[0]); const r=runUntil(null); return r==='fin' || r; });
T('Mikasa mata con el primer corte: el segundo no hace nada raro', ()=>{ setup(['mikasa','eren'],['t3']); C.titans[0].hp=1; giveTurn('mikasa'); LASTEV=[]; doAction('skill', C.titans[0]); const n=LASTEV.filter(e=>e.k==='slash').length; C.ev=[]; return n===1 || n+' cortes'; });
T('Armin no anuncia marca sobre un muerto', ()=>{ setup(['armin','eren'],['t3']); C.titans[0].hp=1; giveTurn('armin'); LASTEV=[]; doAction('skill', C.titans[0]); const m=LASTEV.some(e=>e.k==='mark'); C.ev=[]; return !m || 'marca anunciada'; });
T('aturdido pierde turno y luego actúa', ()=>{ setup(['eren','mikasa'],['t15']); C.fx.eren.stun=1; C.queue=[{s:S.squad[0]},{s:S.squad[1]}]; nextTurn(); const r=runUntil(null); return C.active && C.active.id==='mikasa' && !C.fx.eren.stun || (C.active&&C.active.id)+' '+r; });
T('ciego falla ambos golpes (doble ataque)', ()=>{ setup(['eren','mikasa'],['an1']); const t=C.titans[0]; t.blind=1; const h=S.squad.map(s=>s.hp).join(); titanAct(t); C.ev=[]; return S.squad.map(s=>s.hp).join()===h || 'recibió daño'; });
T('Colosal (poder) no mata a quien lo usa', ()=>{ setup(['armin','eren'],['t15'],{pw:[['colosal','armin']]}); S.squad[0].hp=2; giveTurn('armin'); doAction('pw:colosal'); C.ev=[]; return S.squad[0].hp>=1 || 'muerto'; });
T('Historia con todos llenos: no cura 0 con mensaje', ()=>{ setup(['historia','eren'],['t15']); giveTurn('historia'); LASTEV=[]; doAction('skill', S.squad[1]); const e=LASTEV.find(x=>x.k==='heal'); C.ev=[]; return !e || e.d>0 || 'cura de 0'; });
T('orden: golpe antes que coraza rota y segunda fase', ()=>{ setup(['hange','mikasa'],['aco2']); const t=C.titans[0]; t.plate=1; t.hp=Math.round(t.max*.52); giveTurn('hange'); LASTEV=[]; withD20(10,()=>doAction('skill', t));
  const ks=LASTEV.map(e=>e.k+(e.fx?':'+e.fx:'')); return ks.indexOf('slash')<ks.indexOf('mark:break') && ks.indexOf('mark:break')<ks.indexOf('roar:phase') || ks.join(','); });
T('entrada de jefe antes del primer turno', ()=>{ LASTEV=[]; setup(['mikasa','eren'],['bes'],{node:'b'}); return LASTEV[0] && LASTEV[0].k==='intro' || JSON.stringify(LASTEV[0]); });
T('las tiradas de los eventos quedan registradas', ()=>{ setup(['mikasa','eren'],['t3']); S.pend={k:'event'}; const c=check('sigilo',12); return S.pend.dice && S.pend.dice[0].r===c.r || 'sin dados'; });
T('la nota del combate es coherente', ()=>{ setup(['mikasa','eren'],['t5']); const t=C.titans[0]; giveTurn('mikasa'); doAction('cut', t); runUntil(null); const G=rateFight('c');
  return G && isFinite(G.score) && GRADE_ORDER_T.includes(G.g) && G.parts.every(p=>p.v>=0 && p.v<=p.max) || JSON.stringify(G); });
T('con bajas no hay S', ()=>{ setup(['mikasa','eren'],['t5']); S.squad[1].hp=0; C.rounds=1; C.taken=0; C.sacts=1; C.dealt=999; C.rolls=[20,20,20]; C.nat20=3; const G=rateFight('c'); return ['A','B','C','D','E'].includes(G.g) || G.g; });
T('senda de la reina: evento, encrucijada y zonas', ()=>{ setup(['historia','eren'],['t3']); S.wave=25; const i=EVENTS.findIndex(e=>e.n==='Vienen a por Historia'); if(!EVENTS[i].when()) return 'el evento no aparece';
  S.pend={k:'event'}; EVENTS[i].o[0].f(); if(!S.flags.reina) return 'sin flag'; if(crossroadAt(1)!=='reina') return 'sin encrucijada'; takeRoute('reina'); return zoneOf(31).boss==='kap' && zoneOf(45).boss==='rod' && zoneOf(46).boss==='mar' || zoneOf(31).boss; });
T('senda de Paradis sin Eren y su final', ()=>{ setup(['mikasa','armin'],['t3']); if(crossroadAt(2)!=='paradis') return 'sin encrucijada'; takeRoute('paradis'); S.wave=50; if(inMarley()) return 'eventos de Marley en Paradis';
  return zoneOf(46).boss==='man' && zoneOf(60).boss==='mar2' && endingOf()==='paradis' || zoneOf(60).boss; });
T('con Eren no se abre Paradis', ()=>{ setup(['eren','mikasa'],['t3']); return crossroadAt(2)===null || crossroadAt(2); });
T('epílogos: Levi y la Bestia', ()=>{ setup(['levi','hange'],['t3']); S.flags.lastHit={bes:'levi'}; return epiloguesNow().some(e=>e.k==='levi') || 'no sale'; });
T('encrucijada en el cierre de saga', ()=>{ setup(['historia','mikasa'],['kap'],{wave:30, node:'b'}); S.flags.reina=1; C.titans[0].hp=0; win(); return (S.scene && S.scene.k==='cross' && S.scene.alt==='reina') || S.q.some(x=>x.k==='cross') || JSON.stringify(S.scene); });
T('Kenny: escena tras vencerle y reclutarlo', ()=>{ setup(['levi','mikasa'],['kap'],{wave:35, node:'b'}); C.titans[0].hp=0; win(); let g=0; while(S.scene && S.scene.k!=='story' && g++<5) sceneAct('keep');
  if(!S.scene || S.scene.id!=='kenny') return 'sin escena: '+JSON.stringify(S.scene); sceneAct('st:1'); return S.squad.some(x=>x.id==='kenny' && x.hp>0) || 'no se une'; });
T('Zeke capturado trae la Bestia', ()=>{ setup(['eren','mikasa'],['bes'],{wave:20, node:'b'}); C.titans[0].hp=0; win(); let g=0; while(S.scene && !(S.scene.k==='story'&&S.scene.id==='zeke') && g++<5) sceneAct(S.scene.k==='drop'?'keep':'go');
  if(!S.scene) return 'sin escena'; sceneAct('st:0'); return S.squad.some(x=>x.id==='zeke') && S.pw.bestia && (S.pw.bestia==='zeke'||S.pw.bestia==='reserva') || JSON.stringify(S.pw); });
T('senda jaegerista: Floch se va y es el jefe', ()=>{ setup(['eren','floch','mikasa'],['t3'],{wave:44}); S.flags.jaeger=1; if(crossroadAt(2)!=='jaeger') return crossroadAt(2); takeRoute('jaeger');
  return !S.squad.some(x=>x.id==='floch') && zoneOf(46).boss==='flochb' && !recruitPool().includes('floch') || 'floch sigue'; });
T('los personajes de historia no salen al azar', ()=>{ setup(['eren','mikasa'],['t3'],{wave:50}); const p=recruitPool(); return !p.includes('kenny') && !p.includes('zeke') || p.join(); });
T('epílogo Hermanos', ()=>{ setup(['eren','zeke'],['t3']); return epiloguesNow().some(e=>e.k==='hermanos') || 'no'; });
T('si Eren cae en Trost se abre «El muro Rose cae» y puede volver', ()=>{ setup(['mikasa','armin'],['t3']); S.fallen.push('eren'); if(crossroadAt(0)!=='caida') return crossroadAt(0); takeRoute('caida'); S.wave=20;
  if(zoneOf(30).boss!=='aco' || genWave(30,'b').length!==2) return 'sin jefe doble'; const i=EVENTS.findIndex(e=>e.n==='Un titán que lucha contra titanes'); if(!EVENTS[i].when()) return 'sin evento';
  EVENTS[i].o[0].f(); return S.squad.some(x=>x.id==='eren' && x.hp>0) && S.pw.ataque==='eren' && !S.fallen.includes('eren') || JSON.stringify(S.pw); });
// ======== 3) fuzz: combates enteros con acciones al azar ========
const RES={}; const N=+process.argv[2]||600; let fights=0, turns=0;
const IDS=Object.keys(ROSTER);
for(let i=0;i<N;i++){
  const ids=IDS.slice().sort(()=>Math.random()-.5).slice(0, 1+Math.floor(Math.random()*4));
  const w = 1+Math.floor(Math.random()*60);
  if(S) S.route={}; const rt = Math.random()<.2 ? {1:'caida'} : Math.random()<.3 ? {2:'reina'} : Math.random()<.4 ? {3:'paradis'} : Math.random()<.4 ? {3:'jaeger'} : {}; if(S) S.route=rt; const z = zoneOf(w), boss=Math.random()<.3;
  const en = boss ? [z.boss] : Array.from({length:1+Math.floor(Math.random()*3)}, ()=>pick(z.pool));
  const pws = NINE.slice().sort(()=>Math.random()-.5).slice(0, Math.floor(Math.random()*4)).map((k,j)=>[k, ids[j%ids.length]]).filter(([k,id],j,a)=>id==='eren' ? a.filter(x=>x[1]==='eren').indexOf(a[j])<3 : a.filter(x=>x[1]===id)[0][0]===k);
  CTX='fuzz '+ids.join('+')+' vs '+en.join('+')+' w'+w;
  setup(ids, en, {wave:w, gas:10+Math.floor(Math.random()*10), items:Object.keys(ITEMS).sort(()=>Math.random()-.5).slice(0,3), pw:pws, node:boss?'b':'n'});
  fights++; let n=0;
  while(n++<400){
    const r=runUntil(null); RES[r]=(RES[r]||0)+1; if(r!=='turno'){ if(r==='atasco'||r==='bucle') bug('combate '+r+' (fuzz)'); break; }
    const a=C.active; const opts=ACTIONS().filter(k=>legal(a,k)); const kind=pick(opts); turns++;
    act(kind, tgtFor(a, kind));
  }
  if(n>=400) bug('combate que no acaba en 400 turnos');
}
console.log('fuzz', JSON.stringify(RES)); console.log('combinaciones de la matriz:', combos, '| combates al azar:', fights, 'con', turns, 'acciones');
const ks=Object.keys(BUGS); console.log(ks.length ? 'PROBLEMAS ('+ks.length+'):' : 'Sin problemas.');
ks.forEach(k=>console.log(' ·', k, '×'+BUGS[k].n, '—', BUGS[k].ex));
process.exitCode = ks.length ? 1 : 0;
`;
eval(src);
