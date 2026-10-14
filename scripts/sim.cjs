const fs=require('fs');
const q=[]; global.setTimeout=(f)=>q.push(f);
const mem={}; global.localStorage={getItem(k){return mem[k]||null},setItem(k,v){mem[k]=v},removeItem(k){delete mem[k]}};
const D=__dirname+'/../src/';
let src=['01-datos.js','02-combate.js','03-mapa.js','04-los-nueve.js','096-logros.js'].map(f=>fs.readFileSync(D+f,'utf8')).join('\n');
if(process.env.MUL) src=src.replace(/const SAGA_MUL = \[[^\]]*\]/, 'const SAGA_MUL = ['+process.env.MUL+']');
if(process.env.DROP) src=src.replace('.4 + (S.pity||0)', process.env.DROP+' + (S.pity||0)');
if(process.env.ARMIN) src=src.replace(/armin:  \{n:'Armin',  st:'tactico', hp:65,  atk:11, spd:11/, 'armin:  {n:\'Armin\',  st:\'tactico\', '+process.env.ARMIN);
if(process.env.KIT) src=src.replace(/const KIT = \d+/, 'const KIT = '+process.env.KIT);
src+=`
function render(){} function header(){} function busyUI(){}
function play(d){ C.ev=[]; d(); }
function ai(){ const a=C.active,R=ROSTER[a.id],sk=R.sk,ts=liveT();
  const best=ts.slice().sort((x,y)=>eff(a,y)-eff(a,x)||x.hp-y.hp)[0];
  if((S.items||[]).length && !C.itemUsed){
    if(S.items.includes('carga') && C.titans[0].boss && C.titans[0].hp>0) return doAction('it:carga', C.titans[0]);
    if(S.items.includes('botiquin') && alive().some(x=>x.hp<maxHp(x)*.35)) return doAction('it:botiquin');
    if(S.items.includes('cable')){ const w=alive().find(x=>x.hp<maxHp(x)*.3); if(w) return doAction('it:cable', w); }
    if(S.items.includes('humo') && C.titans.some(t=>t.boss&&t.phase)) return doAction('it:humo');
    if(S.items.includes('bombona') && S.gas<2) return doAction('it:bombona');
  }
  const pw=pwOf(a.id).find(k=>!C.usedPw[k]); if(pw && (C.titans.some(t=>t.boss) || Math.random()<.35)){ USE[pw]=(USE[pw]||0)+1; return doAction('pw:'+pw, best); }
  if(S.gas>=sk.gas && !(sk.once&&C.used[a.id]) && Math.random()<.6){
    if(sk.tgt==='ally'){ const w=alive().sort((x,y)=>x.hp/maxHp(x)-y.hp/maxHp(y))[0]; if(w.hp<maxHp(w)*.6) return doAction('skill',w); }
    else if(sk.tgt==='none'){ const f=C.fx[a.id]; if(!(f.titan||f.up||f.guard||f.taunt||f.crit)) return doAction('skill'); }
    else if(!(a.id==='armin'&&best.mark)) return doAction('skill',best);
  }
  if(S.gas>=1 && S.gas>S.gasMax/2) return doAction('nape',best);
  doAction('cut',best);
}
const USE={}, EV={betray:0,spare:0,drop:0,eren:0}, END={};
function run(ids, saga){ newRun(ids, saga); let n=0;
  while(n++<2000000){ if(q.length){ q.shift()(); continue; }
    if(scr==='combat'&&C&&C.active&&!C.busy){ ai(); continue; }
    if(scr==='map'){ if(S.wave%15===1&&S.wave>1&&!S.map.pos){ const k=S.wave; (stat[k]=stat[k]||[]).push([S.squad.length, Object.values(S.rel).reduce((a,b)=>a+b,0), S.gasMax, owned().length, NINE.filter(x=>S.pw[x]&&S.pw[x]!=='reserva').length, S.squad.reduce((a,b)=>a+b.lvl,0)/S.squad.length]); } const o=pick(openNodes()); enterNode(o[0],o[1]); continue; }
    if(scr==='scene'){ const sc=S.scene; EV[sc.k]=(EV[sc.k]||0)+1;
      if(sc.k==='spare'){ sceneAct(Math.random()<.5?'rescue':'take'); continue; }
      if(sc.k==='drop'){ const r=S.squad.find(x=>hasRoom(x)); sceneAct(r?'give:'+r.id:'keep'); continue; }
      sceneAct('go'); continue; }
    if(scr==='camp'){ const hp=S.squad.reduce((a,s)=>a+s.hp/maxHp(s),0)/S.squad.length; CAMP[hp<.6?0:1].f(); advance(); continue; }
    if(scr==='event'){ pick(EVENTS[S.pend.i].o).f(); if(S.q.length){ S.after='advance'; nextScene(); } else advance(); continue; }
    if(scr==='reward'){ let i=S.rewards.findIndex(r=>r.t==='rec'&&S.squad.length<4); if(i<0) i=S.rewards.findIndex(r=>r.t==='upg'); const r=S.rewards[i]; r.t==='rec'?recruit(r.id):r.t==='item'?(S.items=S.items||[]).push(r.id):applyUpg(r.id); tookReward(i); continue; }
    break; }
  if(scr==='victory') END[S.ending]=(END[S.ending]||0)+1;
  return scr==='victory'?TOTAL+1:S.wave; }
const stat={}; const N=+process.argv[2]||300;
function rep(label, f){ const r=[]; for(let i=0;i<N;i++) r.push(f());
  const reach=[0,15,30,45,60].map(w=>r.filter(x=>x>w).length);
  const boss={}; r.forEach(x=>{ if(x<=TOTAL && x%5===0) boss[x]=(boss[x]||0)+1; });
  console.log(label, 'superan saga 1-4 (%):', reach.slice(1).map((v,i)=>reach[i]?(100*v/reach[i]).toFixed(0):'-').join(' / '), '| total', (100*reach[4]/N).toFixed(1)+'%', '| caen en jefe:', JSON.stringify(boss)); }
for(const st of ['eren','mikasa','armin']) rep(st.padEnd(8), ()=>run([st],0));
for(const sg of [1,2,3]) rep('saga '+(sg+1)+' ', ()=>{ const p=Object.keys(ROSTER).filter(id=>ROSTER[id].sg<=sg&&!ROSTER[id].rare).sort(()=>Math.random()-.5).slice(0,3); return run(p,sg); });
`;
src+=`
for(const k in stat){ const a=stat[k]; console.log('al empezar jornada',k,'n',a.length,'escuadrón',(a.reduce((x,y)=>x+y[0],0)/a.length).toFixed(1),'mejoras',(a.reduce((x,y)=>x+y[1],0)/a.length).toFixed(1),'gasMax',(a.reduce((x,y)=>x+y[2],0)/a.length).toFixed(1),'poderes',(a.reduce((x,y)=>x+y[3],0)/a.length).toFixed(2),'en uso',(a.reduce((x,y)=>x+y[4],0)/a.length).toFixed(2),'nivel',(a.reduce((x,y)=>x+y[5],0)/a.length).toFixed(1)); }`;
src+=`
console.log('usos de poder', JSON.stringify(USE)); console.log('escenas', JSON.stringify(EV)); console.log('finales', JSON.stringify(END));`;
eval(src);

