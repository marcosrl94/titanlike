// Comprueba que una partida guardada de la versión 3 (antes de los Nueve) y una de la 4 se pueden continuar.
const fs=require('fs'), D=__dirname+'/../src/';
const mem={}; global.localStorage={getItem(k){return mem[k]||null},setItem(k,v){mem[k]=v},removeItem(k){delete mem[k]}};
global.setTimeout=()=>{};
let src=['01-datos.js','02-combate.js','03-mapa.js','04-los-nueve.js','096-logros.js'].map(f=>fs.readFileSync(D+f,'utf8')).join('\n');
src+=`
function render(){} function header(){} function busyUI(){} function play(d){ C.ev=[]; d(); }
let fails=0;
newRun(['eren','mikasa'],0); const v4=JSON.parse(JSON.stringify(S)); delete v4.items; delete v4.napes;
const v3=JSON.parse(JSON.stringify(v4)); v3.v=3; ['pw','q','loyal','pity','after','scene','note'].forEach(k=>delete v3[k]);
for(const [name,r] of [['v3',v3],['v4',v4]]){
  S=migrateRun(JSON.parse(JSON.stringify(r)));
  try{ const o=openNodes()[0]; enterNode(o[0],o[1]); if(!C || !C.titans.length) throw new Error('no arranca el combate');
    console.log('OK', name, 'migrada y jugable:', C.titans.map(t=>t.n).join(', ')); }
  catch(e){ fails++; console.log('FALLO', name, e.message); }
}
if(migrateRun({v:2})!==null){ fails++; console.log('FALLO: una v2 no debería migrarse'); } else console.log('OK v2 descartada');
if(fails) process.exit(1);`;
eval(src);
