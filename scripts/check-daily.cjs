// Comprueba que dos expediciones del día con la misma fecha generan el mismo mapa, titanes y recompensas.
const fs=require('fs'), D=__dirname+'/../src/';
const mem={}; global.localStorage={getItem(k){return mem[k]||null},setItem(k,v){mem[k]=v},removeItem(k){delete mem[k]}};
global.setTimeout=()=>{};
let src=['01-datos.js','02-combate.js','03-mapa.js','04-los-nueve.js','096-logros.js'].map(f=>fs.readFileSync(D+f,'utf8')).join('\n');
src+=`
function render(){} function header(){} function busyUI(){} function play(d){ C.ev=[]; }
function snap(){ delete mem['titanlike.meta']; newDaily(); const map=JSON.stringify(S.map.rows.map(r=>r.map(n=>n.t+n.c)));
  const o=openNodes()[0]; S.map.pos=o; S.pend={k:'fight'}; const w=seeded('w'+S.wave+'-'+S.map.pos, ()=>genWave(S.wave, curNode().t)).map(t=>t.id).join(',');
  S.picks=1; const r=seeded('r'+S.wave+'-'+S.map.pos, ()=>genRewards('c')).map(x=>x.t+':'+x.id).join(',');
  return {squad:S.squad.map(s=>s.id).join(','), mod:S.mod, map, w, r}; }
const a=snap(); Math.random(); Math.random(); const b=snap();
const same=JSON.stringify(a)===JSON.stringify(b);
console.log(same?'OK: la expedición del día es determinista':'FALLO', JSON.stringify(a).slice(0,200));
if(!same){ console.log(JSON.stringify(b)); process.exit(1); }`;
eval(src);
