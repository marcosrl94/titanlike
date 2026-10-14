// ---------- Logros, códice, reclutas desbloqueables y expedición del día ----------
const ACH = [
  {k:'primer_jefe',  n:'Primer cambiante',        d:'Derrota a un jefe.'},
  {k:'escuadron',    n:'Escuadrón completo',      d:'Ten cuatro soldados a la vez.', unlock:'jean'},
  {k:'saga1',        n:'Trost resiste',           d:'Completa la saga 1.', unlock:'sasha'},
  {k:'nuca5',        n:'Cazador de nucas',        d:'Remata cinco titanes a la nuca en una expedición.', unlock:'connie'},
  {k:'poder',        n:'Heredero',                d:'Haz que un soldado herede un poder de los Nueve.', unlock:'hange'},
  {k:'perdon',       n:'Segunda oportunidad',     d:'Perdona a un traidor.', unlock:'reiner'},
  {k:'sin_piedad',   n:'Sin piedad',              d:'Quítale el poder a un traidor.', unlock:'annie'},
  {k:'impecable',    n:'Sin bajas',               d:'Vence a un jefe sin que caiga nadie.', unlock:'historia'},
  {k:'saga2',        n:'Traidores al descubierto', d:'Completa la saga 2.', unlock:'levi'},
  {k:'jornada30',    n:'Veterano',                d:'Llega a la jornada 30.', unlock:'erwin'},
  {k:'solo',         n:'Último en pie',           d:'Gana un combate empezado con cuatro soldados y terminado con uno.'},
  {k:'tres_poderes', n:'Tres a la vez',           d:'Reúne tres poderes en una expedición.'},
  {k:'saga3',        n:'El sótano',               d:'Completa la saga 3.'},
  {k:'saga4',        n:'Más allá del mar',        d:'Completa la campaña.'},
  {k:'detener_eren', n:'Hasta el final',          d:'Detén a Eren en el Retumbar.'},
  {k:'coordenada',   n:'La Coordenada',           d:'Consigue el final La Coordenada.'},
  {k:'nueve',        n:'Los Nueve',               d:'Consigue el final Los Nueve.'},
  {k:'diaria',       n:'Parte del día',           d:'Termina una expedición del día.'},
  {k:'vuelta',       n:'Segunda vuelta',           d:'Completa una campaña en New Game+.'},
  {k:'vuelta3',      n:'Más allá del mar, otra vez', d:'Completa la vuelta 3 o superior.'},
  {k:'nota_s',       n:'Sobresaliente',           d:'Saca una S en un combate.'},
  {k:'nota_splus',   n:'Matrícula de honor',      d:'Saca una S+ en un combate.'},
  {k:'jefe_s',       n:'Sin despeinarse',         d:'Saca una S o más contra un cambiante.'}
];
const BASE_STARTERS = ['eren','mikasa','armin'];
const starters = () => BASE_STARTERS.concat(ACH.filter(a=>a.unlock && meta().ach.includes(a.k)).map(a=>a.unlock));
function ach(k){
  const m = meta(); if(m.ach.includes(k)) return;
  const A = ACH.find(a=>a.k===k); if(!A) return;
  saveMeta({ach:m.ach.concat(k)});
  toast(`Logro: ${A.n}`, A.unlock ? `Nuevo recluta inicial: ${ROSTER[A.unlock].n}` : A.d);
}
function toast(t, d){
  if(typeof document==='undefined') return;
  const el=document.createElement('div'); el.className='toast'; el.innerHTML=`<b>${t}</b><span>${d}</span>`;
  document.getElementById('fx').appendChild(el); setTimeout(()=>el.remove(), 4200);
  if(typeof sfx==='function') sfx('win');
}
// códice: titanes vistos y abatidos, soldados reclutados
function codex(kind, id, n=1){
  const m=meta(), c=m.codex||{t:{},s:{}}; c[kind]=c[kind]||{};
  c[kind][id] = kind==='s' ? 1 : (c[kind][id]||0) + n;
  saveMeta({codex:c});
}
function codexSeen(kind, id){ const c=meta().codex||{}; return c[kind] && id in c[kind]; }

// ---- expedición del día: misma semilla para todos ----
const today = () => new Date().toISOString().slice(0,10);   // fecha UTC, igual en todo el mundo
function hashStr(s){ let h=1779033703^s.length; for(let i=0;i<s.length;i++){ h=Math.imul(h^s.charCodeAt(i),3432918353); h=h<<13|h>>>19; } h=Math.imul(h^h>>>16,2246822507); h=Math.imul(h^h>>>13,3266489909); return (h^h>>>16)>>>0; }
function mulberry(a){ return ()=>{ a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
// genera mapa, oleadas, eventos y recompensas con una semilla por día y por punto del recorrido
function seeded(key, fn){
  if(!S || !S.daily) return fn();
  const save=Math.random; Math.random=mulberry(hashStr(S.daily+'|'+key));
  try{ return fn(); } finally{ Math.random=save; }
}
const DAILY_MODS = [
  {k:'escaso',   n:'Gas escaso',        d:'Empiezas con 3 de gas máximo menos.'},
  {k:'veloces',  n:'Titanes veloces',   d:'Todos los titanes tienen +3 de velocidad.'},
  {k:'veterano', n:'Refuerzo veterano', d:'Empiezas con un segundo soldado.'},
  {k:'botin',    n:'Botín generoso',    d:'Cada combate da una recompensa más.'}
];
function dailyInfo(d=today()){ const r=mulberry(hashStr('titanlike|'+d)); return {day:d, starter:BASE_STARTERS[Math.floor(r()*3)], mod:DAILY_MODS[Math.floor(r()*DAILY_MODS.length)]}; }
const dailyDone = () => meta().dailyPlayed===today();
function newDaily(){
  const D=dailyInfo();
  skipRunStart = true; newRun([D.starter], 0, 'explorador'); skipRunStart = false;
  S.daily=D.day; S.mod=D.mod.k; S.map=seeded('map0', ()=>genMap(0));
  if(S.mod==='escaso'){ S.gasMax-=3; S.gas=S.gasMax; }
  if(S.mod==='veterano') seeded('vet', ()=>{ const p=recruitPool().filter(id=>!ROSTER[id].rare && ROSTER[id].sg===0); recruit(pick(p)); });
  saveMeta({dailyPlayed:D.day}); store.set('run', S);
  if(typeof cloudStartRun==='function') cloudStartRun(0, true);
}
// puntuación (la misma que calcula el servidor): 100 por jornada superada y 500 por terminar
function dailyScore(done){ const j = done ? PER : S.wave-1; return j*100 + (done?500:0); }
function finishDaily(done){
  S.dailyScore = dailyScore(done); S.dailyDone = done;
  saveMeta({dailyBest:{day:S.daily, score:S.dailyScore}});
  if(done) ach('diaria');
}
