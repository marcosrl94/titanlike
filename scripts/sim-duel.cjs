// Calibración de duelos: leyendas sintéticas de final de campaña; el bot listo controla la nuestra, la IA del juego la rival.
// Uso: node scripts/sim-duel.cjs [partidas]   (env HP=1.25 ATK=.62 para probar constantes)
const fs=require('fs'); const q=[]; global.setTimeout=(f)=>q.push(f);
const mem={}; global.localStorage={getItem(k){return mem[k]||null},setItem(k,v){mem[k]=v},removeItem(k){delete mem[k]}};
const D=__dirname+'/../src/';
let src=['01-datos.js','02-combate.js','03-mapa.js','04-los-nueve.js','045-sendas.js','046-tienda.js','047-duelos.js','096-logros.js','0965-estadisticas.js'].map(f=>fs.readFileSync(D+f,'utf8')).join('\n');
const sc=fs.readFileSync(__dirname+'/sim-comps.cjs','utf8'); const ai=sc.slice(sc.indexOf('function ai(){'), sc.indexOf('function run(ids, saga)'));
src+=`
function render(){} function header(){} function busyUI(){} function play(d){ C.ev=[]; d(); }
const M={fights:0,rounds:0,gasStart:0,gasEnd:0,gas0:0,titanActs:0,missBlind:0,dmgTaken:0,blinds:0,heals:0,napes:0,skills:0,cuts:0,items:0};
if(process.env.HP) DUEL_K.hp=+process.env.HP; if(process.env.ATK) DUEL_K.atk=+process.env.ATK;
${ai.replace("function ai(){","function botAct(){")}
const IDS=Object.keys(ROSTER).filter(id=>!ROSTER[id].story);
function legend(){ const ids=IDS.slice().sort(()=>Math.random()-.5).slice(0,4), pws=NINE.slice().sort(()=>Math.random()-.5).slice(0,3+Math.floor(Math.random()*3));
  const s=ids.map(id=>({id, lvl:60+Math.floor(Math.random()*12), pw:[]})); pws.forEach((k,i)=>{ const x=s[i%4]; if(x.pw.length<(x.id==='eren'?3:1)) x.pw.push(k); });
  return {name:'L', squad:{s, rel:{cuchillas:3+Math.floor(Math.random()*3), capa:3+Math.floor(Math.random()*3), cristal:2+Math.floor(Math.random()*3), caballos:Math.floor(Math.random()*3), lanzas:Math.floor(Math.random()*3)}, vow:{}, gm:16+Math.floor(Math.random()*5)}}; }
let W=0, N=+process.argv[2]||300, R=0, mirrorW=0, G={};
let res=null; duelEnd=function(won){ res=won; const g=rateFight('b'); G[g.g]=(G[g.g]||0)+1; R+=g.rounds; };
for(let i=0;i<N;i++){ const a=legend(), b=i%2 ? legend() : JSON.parse(JSON.stringify(a)); res=null; q.length=0; startDuel(a,b,'x',null); let n=0;
  while(res===null && n++<200000){ if(q.length){ q.shift()(); continue; } if(C&&C.active&&!C.busy){ botAct(); continue; } break; }
  if(res) { W++; if(i%2===0) mirrorW++; } }
console.log('victorias', (100*W/N).toFixed(0)+'%', '| espejo', (100*mirrorW/Math.ceil(N/2)).toFixed(0)+'%', '| rondas medias', (R/N).toFixed(1), '| notas', JSON.stringify(G));
`;
eval(src);
