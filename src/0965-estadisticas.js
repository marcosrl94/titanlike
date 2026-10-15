// ---------- Estadísticas: notas de combate, fichas de personaje, escuadrones y récords por jefe ----------
// meta().stats = {f: combates calificados, g: {nota: n}, ch: {soldado: {...}}, co: {escuadrón: {...}}, rec: {jefe: {...}}}
const GRADE_ORDER = ['S+','S','A','B','C','D','E'];
const gradeIx = g => GRADE_ORDER.indexOf(g);
const statsOf = () => Object.assign({f:0, g:{}, ch:{}, co:{}, rec:{}}, meta().stats || {});
const compIds = k => k ? k.split('+').filter(id=>ROSTER[id]) : [];
const compName = k => compIds(k).map(id=>ROSTER[id].n).join(' · ');
const chOf = (st, id) => st.ch[id] = st.ch[id] || {f:0, d:0, k:0, c:0, n:0, t:0, fall:0, runs:0, wins:0, g:{}, best:0};
const coOf = (st, k) => st.co[k] = st.co[k] || {f:0, sc:0, g:{}, runs:0, bw:0, wins:0};
// los escuadrones guardados no crecen sin límite: se quedan los 60 más jugados
function pruneComps(st){ const ks=Object.keys(st.co); if(ks.length<=60) return; ks.sort((a,b)=>(st.co[b].f+st.co[b].runs*3)-(st.co[a].f+st.co[a].runs*3)).slice(60).forEach(k=>delete st.co[k]); }

// tras cada combate ganado: suma la nota a los soldados, al escuadrón y, si es un jefe, al récord
function recordFight(G){
  if(!G || !C) return;
  const st = statsOf(); st.f++; st.g[G.g] = (st.g[G.g]||0)+1;
  for(const id in C.by){ const B=C.by[id], h=chOf(st, id); h.f++; h.d+=B.d; h.k+=B.k; h.c+=B.c; h.n+=B.n; h.t+=B.t; h.g[G.g]=(h.g[G.g]||0)+1; h.best=Math.max(h.best, G.score);
    if(!S.squad.some(s=>s.id===id && s.hp>0)) h.fall++; }
  const co = coOf(st, C.comp); co.f++; co.sc += G.score; co.g[G.g]=(co.g[G.g]||0)+1;
  G.rec = null;
  if(G.boss){ const r=st.rec[G.boss];
    if(!r || G.score>r.sc || (G.score===r.sc && G.rounds<r.r)){ G.rec = r ? {prev:r.g, prevSc:r.sc} : {first:true}; st.rec[G.boss] = {sc:G.score, g:G.g, r:G.rounds, co:C.comp, d:S.diff, at:Date.now()}; }
    if(S.diff!=='recluta' && typeof cloudBossRecord==='function') cloudBossRecord(G, C.comp); }
  pruneComps(st); saveMeta({stats:st});
  if(gradeIx(G.g)<=1) ach('nota_s'); if(G.g==='S+') ach('nota_splus'); if(G.boss && gradeIx(G.g)<=1) ach('jefe_s');
}
// al terminar una expedición (ganada o perdida): resultado del escuadrón con el que acabó
function recordRun(won){
  if(!S || !S.squad.length) return; const st=statsOf(), k=compKey(S.squad);
  const co=coOf(st, k); co.runs++; co.bw=Math.max(co.bw, Math.min(TOTAL, won?TOTAL:S.wave)); if(won) co.wins++;
  S.squad.forEach(s=>{ const h=chOf(st, s.id); h.runs++; if(won) h.wins++; });
  pruneComps(st); saveMeta({stats:st}); return k;
}
const avgGrade = o => { const n=Object.values(o.g||{}).reduce((a,b)=>a+b,0); return n && o.sc!==undefined ? gradeOf(o.sc/n) : '—'; };
const gradeChip = (g, big) => `<span class="grade g-${(g||'').replace('+','p')}${big?' big':''}">${g||'—'}</span>`;

// ---- panel de nota tras el combate ----
function gradeHTML(G){
  if(!G) return '';
  const row = p => `<div class="gp"><span class="lbl">${p.n}</span><span class="gbar"><i style="width:${Math.round(p.v/p.max*100)}%"></i></span><b class="num">${p.v}<small>/${p.max}</small></b><span class="dim">${p.d}</span></div>`;
  const rec = G.boss ? (G.rec ? (G.rec.first ? `<span class="lbl rec">Primer récord contra ${TITANS[G.boss].n}</span>` : `<span class="lbl rec">¡Nuevo récord! Antes: ${G.rec.prev} (${G.rec.prevSc})</span>`)
    : (()=>{ const r=statsOf().rec[G.boss]; return r ? `<span class="lbl dim">Tu récord contra ${TITANS[G.boss].n}: ${r.g} · ${r.sc} puntos en ${r.r} rondas</span>` : ''; })()) : '';
  return `<section class="panel grade-p"><div class="gl"><span class="gwrap ${gradeIx(G.g)<=1?'hi':''}"><i class="sl"></i>${gradeChip(G.g,true)}</span>${gradeIx(G.g)<=1?`<b class="sfx gsfx">¡Rango ${G.g}!</b>`:''}<span class="lbl">Nota del combate</span><b class="num">${G.score} puntos</b>${G.coins?`<span class="lbl" style="color:var(--gold)">+${G.coins} monedas</span>`:''}${rec}${G.reto?`<span class="lbl reto-r ${G.reto.ok?'ok':'ko'}">${G.reto.ok?`Reto cumplido · +${RETO_COINS} monedas`:'Reto fallido'}: ${G.reto.n}</span>`:''}</div>
    <div class="gparts">${G.parts.map(row).join('')}
    ${G.bonus.map(b=>`<div class="gp bonus ${b.v<0?'neg':''}"><span class="lbl">${b.n}</span><span></span><b class="num">${b.v>0?'+':''}${b.v}</b><span></span></div>`).join('')}</div></section>`;
}
const GRADE_HELP = 'La nota suma Rapidez (rondas contra el par del combate, 30), Daño recibido (30), Daño por acción (25; las acciones de apoyo cuentan media) y Suerte del d20 (media de tus tiradas de corte y esquiva, más los 20 naturales, menos las pifias; 15). Remates a la nuca y acabar sin un rasguño suman; cada baja resta 15 y con bajas no hay S. S+ desde 95, S 87, A 76, B 63, C 50, D 36.';

