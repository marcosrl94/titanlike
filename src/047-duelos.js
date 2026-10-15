// ---------- Duelos: escuadrones de leyenda (los que terminaron una campaña) contra los de tus amigos ----------
// Tú controlas tu leyenda; la de tu amigo pelea sola con su IA. Se reutiliza el motor de combate: cada soldado rival es
// una unidad enemiga con sus PV, ataque, velocidad, poderes (como ataques especiales) y las mejoras de su campaña.
const STYLE_CLS = {veloz:'anormal', fuerza:'grande', tactico:'pequeno', preciso:'blindado'};
const DUEL_K = {hp:1.9, atk:1.55};   // calibrado con sim-duel: en espejo, quien controla gana ~65 % (el bot juega mejor que la IA rival)
const PW_MOVES = {colosal:{aoe:3, txt:'EXPLOSIÓN DE VAPOR'}, bestia:{throw:3}, hembra:{kick:3}, mandibula:{devour:3}, acorazado:{coraza:.2},
  martillo:{harden:3}, fundador:{aoe:3, txt:'EL GRITO'}};
const SK_MOVES = {levi:{aoe:4, txt:'TORBELLINO'}, floch:{aoe:4, txt:'SALVA DE LANZAS'}, pieck:{aoe:4, txt:'ARTILLERÍA'}, zeke:{aoe:4, txt:'LLUVIA DE PIEDRAS'},
  nanaba:{aoe:4, txt:'PASADA RASANTE'}, bertolt:{aoe:4, txt:'GOLPE DE VAPOR'}, reiner:{coraza:.12}, annie:{kick:4}, eren:{devour:4}, ymir:{devour:4}};
const SK_TWICE = ['mikasa','kenny','sasha','gabi'];
let DUEL = null;   // duelo en curso: {mine, foe, foeName, cloud:{mine, foe}, prev}

// ---- leyendas: instantánea del escuadrón al completar la campaña ----
function legendSnapshot(){ return {s:S.squad.map(x=>({id:x.id, lvl:x.lvl, pw:pwOf(x.id)})), rel:Object.assign({}, S.rel), vow:Object.assign({}, S.vow||{}), gm:S.gasMax}; }
const legendsLocal = () => meta().legends || [];
function saveLegend(){
  if(!S || S.daily || !S.squad.length) return null;
  const E = ENDINGS[S.ending], d = new Date().toLocaleDateString('es-ES', {day:'numeric', month:'short'});
  const L = {lid:'L'+Date.now().toString(36), name:`${E?E.n:'Campaña'} · ${d}`, ending:S.ending, at:Date.now(), squad:legendSnapshot(), cloud:null};
  saveMeta({legends:[L].concat(legendsLocal()).slice(0,12)});
  if(typeof cloudSaveLegend==='function' && S.runId) cloudSaveLegend(L, S.runId);
  return L;
}
const legPower = L => L.squad.s.reduce((a,x)=>a+x.lvl,0) + 4*Object.values(L.squad.rel||{}).reduce((a,b)=>a+b,0);   // orientativo
function legendHTML(L, act, extra){
  return `<button class="card legend" ${act?`data-a="${act}" data-i="${L.lid||L.id}"`:'disabled'}><span class="lbl kind">${esc(L.name)}</span>
    <div class="crow">${L.squad.s.map(x=>portrait(x.id)).join('')}</div>
    <p class="dim num">${L.squad.s.map(x=>`${ROSTER[x.id]?ROSTER[x.id].n:x.id} ${x.lvl}${x.pw&&x.pw.length?' · '+x.pw.map(k=>POWERS[k]?POWERS[k].n.replace(/^Titán (de )?/,''):k).join(', '):''}`).join(' — ')}</p>${extra||''}</button>`;
}

// ---- de leyenda a unidades enemigas ----
const lvlM = l => 1 + .05*(l-1);
function duelFoes(){
  const L=DUEL.foe, rel=L.squad.rel||{}, vow=L.squad.vow||{};
  return L.squad.s.slice(0,4).map((x,i)=>{
    const R=ROSTER[x.id]; if(!R) return null;
    const pw=(x.pw||[]).filter(k=>POWERS[k]);
    const hp = R.hp*lvlM(x.lvl)*(1+.15*(rel.capa||0))*(1+.25*pw.length)/Math.max(.6, 1-.1*(rel.cristal||0));
    const atk = R.atk*lvlM(x.lvl)*(1+.15*(rel.cuchillas||0))*(vow[x.id]?1.1:1);
    const m = Object.assign({}, SK_MOVES[x.id]||{}); pw.forEach(k=>Object.assign(m, PW_MOVES[k]||{}));
    const id = 'pvp'+i;
    TITANS[id] = {n:R.n, cls:STYLE_CLS[R.st]||'pequeno', hp:Math.round(hp*DUEL_K.hp), atk:atk*DUEL_K.atk, spd:R.spd+3*(rel.caballos||0), v:'corta a',
      twice:SK_TWICE.includes(x.id) || pw.includes('ataque'), m, a:{k:'soldier'}, pvp:x.id};
    return mkTitan(id, 1);
  }).filter(Boolean);
}
// ---- empezar y terminar ----
function startDuel(mine, foe, foeName, cloud){
  if(!mine || !foe) return;
  DUEL = {mine, foe, foeName, cloud:cloud||null};
  const L=mine.squad, pwMap={};
  L.s.forEach(x=>(x.pw||[]).forEach(k=>{ if(POWERS[k]) pwMap[k]=x.id; }));
  S = {v:4, pvp:true, diff:'explorador', ng:0, wave:TOTAL, squad:L.s.map(x=>({id:x.id, lvl:x.lvl, hp:0})), fallen:[], rel:Object.assign({}, L.rel||{}), pw:pwMap, q:[], loyal:{},
    pity:0, after:null, scene:null, note:null, gas:L.gm||16, gasMax:L.gm||16, map:{rows:[[{c:1,t:'b',next:[]}]], pos:[0,0], path:[0], z:11}, rewards:null, picks:0, pend:{k:'fight'},
    kit:[], items:[], route:{}, flags:{}, vow:Object.assign({}, L.vow||{}), deaths:[], coins:0};
  S.squad.forEach(s=>{ s.hp=maxHp(s); });
  C=null; startWave();
}
function duelEnd(won){
  const G = rateFight('b'), D=DUEL; G.won=won;
  const rec = {at:Date.now(), won, g:G.g, sc:G.score, r:G.rounds, foe:D.foeName, mine:D.mine.name, theirs:D.foe.name};
  saveMeta({duels:[rec].concat(meta().duels||[]).slice(0,30)});
  if(D.cloud && typeof cloudRecordDuel==='function') cloudRecordDuel(D.cloud.foe, D.cloud.mine, won, G.rounds, G.g);
  D.result = G; if(typeof gainXP==='function'){ G.xp = gainXP('duel', won?60:25, won?'Duelo ganado':'Duelo perdido'); }
  S = typeof migrateRun==='function' ? migrateRun(store.get('run')) : null; C=null;
  scr='duelres'; render();
}
// figura del soldado rival en el escenario: su imagen (si el jugador cargó una) o un soldado de cuerpo entero con capa e inicial
function duelArt(sid){
  if(typeof imgOf==='function' && imgOf(sid)) return `<img src="${imgOf(sid)}" alt="" style="height:100%;width:auto;object-fit:contain;border-radius:12px">`;
  const R=ROSTER[sid]||{n:'?', st:'fuerza'}, col={veloz:'#9fc3d6', fuerza:'#e2685c', tactico:'#d8b45f', preciso:'#7cc08f'}[R.st]||'#ebe6d6';
  return `<svg viewBox="0 0 120 220" aria-hidden="true"><ellipse cx="60" cy="214" rx="34" ry="5" fill="rgba(0,0,0,.45)"/>
    <path d="M46 150 L42 210 L54 210 L58 158 Z M74 150 L78 210 L66 210 L62 158 Z" fill="#2a2522"/>
    <path d="M24 92 Q28 66 60 62 Q92 66 96 92 L100 160 Q60 172 20 160 Z" fill="#3f7a52"/>
    <path d="M38 96 h44 v52 h-44z" fill="#6b5a45" opacity=".85"/><path d="M38 116 h44" stroke="#2a2522" stroke-width="3"/>
    <path d="M16 140 l-8 34 M104 140 l8 34" stroke="#c9d3d8" stroke-width="4" stroke-linecap="round"/>
    <rect x="10" y="128" width="16" height="14" rx="3" fill="#8a949a"/><rect x="94" y="128" width="16" height="14" rx="3" fill="#8a949a"/>
    <circle cx="60" cy="42" r="20" fill="#d7a37f"/><path d="M38 44 Q38 14 60 14 Q84 14 82 46 Q76 30 60 28 Q44 30 38 44Z" fill="#2e2a26"/>
    <path d="M30 70 Q60 52 90 70 L84 84 Q60 74 36 84Z" fill="#3f7a52"/>
    <text x="60" y="140" text-anchor="middle" font-family="UnifrakturMaguntia, serif" font-size="30" fill="${col}">${(R.n||'?')[0]}</text></svg>`;
}
