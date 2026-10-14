// Simulador de composiciones con un bot "listo": ciega al titán más peligroso cada turno, cura cuando toca,
// remata a la nuca cuando ejecuta y usa los poderes contra jefes. Mide gas, control y daño recibido.
// Uso: node scripts/sim-comps.cjs [partidas] [comp1,comp2,...]   (comp = ids separados por +, p. ej. sasha+historia+eren)
const fs=require('fs');
const q=[]; global.setTimeout=(f)=>q.push(f);
const mem={}; global.localStorage={getItem(k){return mem[k]||null},setItem(k,v){mem[k]=v},removeItem(k){delete mem[k]}};
const D=__dirname+'/../src/';
let src0=['01-datos.js','02-combate.js','03-mapa.js','04-los-nueve.js','045-sendas.js','046-tienda.js','096-logros.js','0965-estadisticas.js'].map(f=>fs.readFileSync(D+f,'utf8')).join('\n');
let src=src0;
if(process.env.MUL) src=src.replace(/const SAGA_MUL = \[[^\]]*\]/, 'const SAGA_MUL = ['+process.env.MUL+']');
if(process.env.GROW) src=src.replace('(1 + .15*(w-1))', '(1 + '+process.env.GROW+'*(w-1))');
if(process.env.LVL) src=src.replace('const lvlMul = s => 1 + .05*(s.lvl-1)', 'const lvlMul = s => 1 + '+process.env.LVL+'*(s.lvl-1)');
if(process.env.DIFFM) src=src.replace("explorador:{n:'Explorador', m:1,", "explorador:{n:'Explorador', m:"+process.env.DIFFM+",");
src+=`
function render(){} function header(){} function busyUI(){}
function play(d){ C.ev=[]; d(); }
const M={fights:0, rounds:0, gasStart:0, gasEnd:0, gas0:0, titanActs:0, missBlind:0, dmgTaken:0, blinds:0, heals:0, napes:0, skills:0, cuts:0, items:0};
const _wound=wound; wound=function(t,s,mult){ const hp0=s.hp; M.titanActs++; if(t.blind>0) M.missBlind++; _wound(t,s,mult); M.dmgTaken+=Math.max(0,hp0-s.hp); };
const _startWave=startWave; startWave=function(){ _startWave(); M.fights++; M.gasStart+=S.gas; };
const GD={}, RD={}; const _win=win; win=function(){ M.gasEnd+=S.gas; if(S.gas===0) M.gas0++; const t=curNode().t, n=C.titans.length, r=C.rounds; _win();
  const g=S.lastGrade; if(g){ const k=t; (GD[k]=GD[k]||{})[g.g]=(GD[k][g.g]||0)+1; const rk=t+n; (RD[rk]=RD[rk]||[]).push(r); (GD.parts=GD.parts||{}); g.parts.forEach(p=>{ (GD.parts[p.k]=GD.parts[p.k]||[]).push(p.v); }); (GD.sc=GD.sc||[]).push(g.score); (GD.eff=GD.eff||[]).push(g.eff); } };
const _nextTurn=nextTurn; nextTurn=function(){ if(C && !C.queue.length) M.rounds++; _nextTurn(); };
function ai(){ const a=C.active,R=ROSTER[a.id],sk=R.sk,ts=liveT();
  const byDanger=ts.slice().sort((x,y)=>(y.boss?1000:0)+y.atk-((x.boss?1000:0)+x.atk));
  const best=ts.slice().sort((x,y)=>eff(a,y)-eff(a,x)||x.hp-y.hp)[0];
  const weak=alive().slice().sort((x,y)=>x.hp/maxHp(x)-y.hp/maxHp(y))[0];
  // objetos: acción libre
  if((S.items||[]).length && !C.itemUsed){
    if(S.items.includes('botiquin') && alive().filter(x=>x.hp<maxHp(x)*.5).length>=2){ M.items++; return doAction('it:botiquin'); }
    if(S.items.includes('cable') && weak.hp<maxHp(weak)*.3){ M.items++; return doAction('it:cable', weak); }
    if(S.items.includes('humo') && ts.some(t=>t.boss) && !ts.some(t=>t.blind>0)){ M.items++; return doAction('it:humo'); }
    if(S.items.includes('carga') && ts.some(t=>t.boss)){ M.items++; return doAction('it:carga', ts.find(t=>t.boss)); }
    if(S.items.includes('bombona') && S.gas<=1){ M.items++; return doAction('it:bombona'); }
  }
  // poderes contra jefes o si hay 2+ titanes
  const pw=pwOf(a.id).find(k=>!C.usedPw[k]);
  if(pw && (ts.some(t=>t.boss) || ts.length>=2 || pw==='carguero'&&S.gas<=2)){ if(pw==='carguero' && S.gas>3 && !alive().some(x=>x.hp<maxHp(x)*.6)){} else return doAction('pw:'+pw, byDanger[0]); }
  const can = S.gas>=sk.gas && !(sk.once&&C.used[a.id]) && !(C.cd[a.id]>0);
  if(can){
    // control: ciega al más peligroso que no esté ya cegado
    if(a.id==='sasha'){ const t=byDanger.find(t=>!t.boss && !(t.blind>0) && canCC(t)); if(t){ M.blinds++; M.skills++; return doAction('skill', t); } }
    if(a.id==='annie'){ const t=byDanger.find(t=>!t.boss && !(t.stun>0) && canCC(t)); if(t && ts.length>1){ M.skills++; return doAction('skill', t); } }
    if(a.id==='historia' && weak.hp<maxHp(weak)*.55){ M.heals++; M.skills++; return doAction('skill', weak); }
    if(sk.tgt==='none'){ const f=C.fx[a.id]; const buffOn=f.titan||f.up||f.guard||f.taunt||f.crit; const multi=ts.length>=2;
      if(['levi','floch','nanaba','pieck'].includes(a.id) && multi){ M.skills++; return doAction('skill'); }
      if(['jean','mike','reiner'].includes(a.id) && !buffOn && (ts.some(t=>t.boss)||multi)){ M.skills++; return doAction('skill'); }
      if(a.id==='connie' && !buffOn && alive().some(x=>x.hp<maxHp(x)*.4)){ M.skills++; return doAction('skill'); } }
    else if(sk.tgt==='enemy' && !['sasha','annie'].includes(a.id)){
      if(a.id==='armin'){ if(!best.mark && best.hp>best.max*.4){ M.skills++; return doAction('skill', best); } }
      else if(a.id==='erwin'){ if(alive().length>=3){ M.skills++; return doAction('skill', best); } }
      else if(best.boss || best.hp>atkOf(a)*1.4){ M.skills++; return doAction('skill', best); } }
    else if(a.id==='annie' && ts.length===1 && best.boss){ M.skills++; return doAction('skill', best); }
  }
  // nuca: si remata o si sobra gas
  if(S.gas>=1){ const e=estimate(a,best,'nape'); if(e && e.exec){ M.napes++; return doAction('nape',best); } }
  if(S.gas>=1 && S.gas>S.gasMax*.4){ M.napes++; return doAction('nape',best); }
  M.cuts++; doAction('cut',best);
}
function run(ids, saga){ newRun(ids, saga); if(process.env.ROUTE){ const [g,k]=process.env.ROUTE.split(':'); S.route[+g]=k; } let n=0;
  while(n++<2000000){ if(q.length){ q.shift()(); continue; }
    if(scr==='combat'&&C&&C.active&&!C.busy){ ai(); continue; }
    if(scr==='map'){ const o=openNodes(); const pref=o.find(x=>S.map.rows[x[0]][x[1]].t==='k' && S.squad.some(s=>s.hp<maxHp(s)*.5)) || o.find(x=>S.map.rows[x[0]][x[1]].t==='e' && !S.squad.some(s=>s.hp<maxHp(s)*.6)) || pick(o); enterNode(pref[0],pref[1]); continue; }
    if(scr==='scene'){ const sc=S.scene;
      if(sc.k==='cross'){ sceneAct(process.env.ALT==='0'?'canon':'alt'); continue; }
      if(sc.k==='spare'){ sceneAct('take'); continue; }
      if(sc.k==='drop'){ const r=S.squad.find(x=>hasRoom(x)); sceneAct(r?'give:'+r.id:'keep'); continue; }
      sceneAct('go'); continue; }
    if(scr==='shop'){ const pr=['vendas','instruccion','mejora','gas']; S.shop.offers.map((o,i)=>[o,i]).sort((x,y)=>(pr.indexOf(x[0].k)+9)%9-(pr.indexOf(y[0].k)+9)%9).forEach(([o,i])=>{ if(!o.sold && S.coins>=o.p && (o.k!=='vendas' || S.squad.some(s=>s.hp<maxHp(s)*.6))) shopBuy(i); }); S.shop=null; advance(); continue; }
    if(scr==='camp'){ const hp=S.squad.reduce((a,s)=>a+s.hp/maxHp(s),0)/S.squad.length; (hp<.6?CAMP[0]:S.gas<S.gasMax*.4?CAMP[2]:CAMP[1]).f(); advance(); continue; }
    if(scr==='event' && EVENTS[S.pend.i].prio && process.env.ALT!=='0'){ const o=EVENTS[S.pend.i].o[0]; o.f(); if(S.q.length){ S.after='advance'; nextScene(); } else advance(); continue; }
    if(scr==='event'){ const E=EVENTS[S.pend.i]; const o=E.o[0].d.match(/gas/i)&&S.gas<S.gasMax*.5?E.o[0]:E.o[1].d.match(/gas/i)&&S.gas<S.gasMax*.5?E.o[1]:pick(E.o); o.f(); if(S.q.length){ S.after='advance'; nextScene(); } else advance(); continue; }
    if(scr==='reward'){ const want=['bombona','bengala','cuchillas','capa','lanzas','cristal','caballos','vendas','shadis','raciones'];
      let i=S.rewards.findIndex(r=>r.t==='rec'&&S.squad.length<4&&(ROSTER[r.id].rare||S.squad.length<3));
      if(i<0){ const ups=S.rewards.map((r,j)=>({r,j})).filter(x=>x.r.t==='upg').sort((x,y)=>want.indexOf(x.r.id)-want.indexOf(y.r.id)); if(ups.length) i=ups[0].j; }
      if(i<0) i=S.rewards.findIndex(r=>r.t==='item'); if(i<0) i=0;
      const r=S.rewards[i]; r.t==='rec'?recruit(r.id):r.t==='item'?(S.items=S.items||[]).push(r.id):applyUpg(r.id); tookReward(i); continue; }
    break; }
  if(scr==='victory'||scr==='over'){ const k=Object.values(S.route||{}).join('+')||'canon'; (ROUTES[k]=ROUTES[k]||[0,0]); ROUTES[k][0]++; if(scr==='victory') ROUTES[k][1]++; }
  return scr==='victory'?TOTAL+1:S.wave; }
const ROUTES={};
const N=+process.argv[2]||200;
const comps=(process.argv[3]||'sasha+historia+eren,sasha+eren+mikasa,eren+mikasa+armin,historia+reiner+jean,annie+sasha+historia,levi+hange+erwin').split(',').map(c=>c.split('+'));
function rep(label, saga, f){ for(const k in M) M[k]=0; const r=[]; for(let i=0;i<N;i++) r.push(f());
  const reach=[0,15,30,45,60].map(w=>r.filter(x=>x>w).length);
  const boss={}, zone={}; r.forEach(x=>{ if(x<=TOTAL && x%5===0) boss[x]=(boss[x]||0)+1; if(x<=TOTAL){ const z='z'+Math.ceil(x/5); zone[z]=(zone[z]||0)+1; } });
  console.log(label.padEnd(26), 'superan saga 1-4 (%):', reach.slice(1).map((v,i)=>reach[i]?(100*v/reach[i]).toFixed(0):'-').join(' / '), '| campaña', (100*reach[4]/N).toFixed(1)+'%',
    '| rondas/combate', (M.rounds/M.fights).toFixed(1), '| gas ini/fin', (M.gasStart/M.fights).toFixed(1)+'/'+(M.gasEnd/M.fights).toFixed(1), 'a 0:', (100*M.gas0/M.fights).toFixed(0)+'%',
    '| fallos por ceguera', (100*M.missBlind/Math.max(1,M.titanActs)).toFixed(0)+'%', '| daño/combate', (M.dmgTaken/M.fights).toFixed(0),
    '| acciones c/n/h/o', [M.cuts,M.napes,M.skills,M.items].map(x=>(x/M.fights).toFixed(1)).join('/'));
  if(process.env.GR){ const med=a=>{ const b=a.slice().sort((x,y)=>x-y); return b[Math.floor(b.length/2)]; };
    const order=['S+','S','A','B','C','D','E'];
    ['c','e','b'].forEach(k=>{ const o=GD[k]||{}, tot=Object.values(o).reduce((a,b)=>a+b,0); console.log('   notas '+k, order.map(g=>g+' '+(100*(o[g]||0)/Math.max(1,tot)).toFixed(0)+'%').join(' ')); });
    console.log('   rondas mediana', Object.keys(RD).sort().map(k=>k+':'+med(RD[k])+'('+RD[k].length+')').join(' '));
    console.log('   partes medias', Object.entries(GD.parts||{}).map(([k,a])=>k+' '+(a.reduce((x,y)=>x+y,0)/a.length).toFixed(1)).join(' '), 'eff p25/50/90', (()=>{const b=(GD.eff||[0]).slice().sort((x,y)=>x-y);return [.25,.5,.9].map(q=>b[Math.floor(q*(b.length-1))].toFixed(2)).join('/');})(), 'score medio', ((GD.sc||[]).reduce((x,y)=>x+y,0)/Math.max(1,(GD.sc||[]).length)).toFixed(1));
    for(const k in GD) delete GD[k]; for(const k in RD) delete RD[k]; }
  if(process.env.DET) console.log('   muertes por zona', JSON.stringify(zone), 'en jefe', JSON.stringify(boss)); }
for(const c of comps){
  const sg = Math.max(...c.map(id=>ROSTER[id].sg));
  if(c.length===1) rep(c[0]+' (saga 1)', 0, ()=>run(c,0));
  else { const s0 = Math.max(sg, 1); rep(c.join('+')+' (saga '+(s0+1)+')', s0, ()=>run(c,s0)); }
}
`;
eval(src+"\nconsole.log('rutas (partidas, campañas ganadas):', JSON.stringify(ROUTES));");