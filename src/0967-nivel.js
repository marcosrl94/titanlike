// ---------- Nivel de cuenta: experiencia, rangos, órdenes diarias y semanales ----------
// Una sola experiencia hace avanzar el nivel de cuenta (permanente), el Pase 1 (hasta completarlo) y el pase de temporada.
// Sin sesión se guarda en este navegador; con sesión manda el servidor (add_xp valida cada suma).
const XP_G = {'S+':60, S:50, A:40, B:30, C:25, D:20, E:15};
const XP_DIFF = {recluta:.5, explorador:1, veterano:1.25};
const XP_SRC = [
  {n:'Combate ganado', d:'Según la nota: E 15, D 20, C 25, B 30, A 40, S 50, S+ 60. Élite ×1,5, jefe ×2. Reto cumplido +20.'},
  {n:'Primer combate ganado del día', d:'+300, una vez al día.'},
  {n:'Saga completada', d:'+200.'},
  {n:'Campaña completada', d:'+800, y +400 más si el final es nuevo para ti.'},
  {n:'Expedición perdida', d:'4 por jornada alcanzada, hasta 240.'},
  {n:'Expedición del día', d:'+250 al terminarla.'},
  {n:'Duelos', d:'60 si ganas, 25 si pierdes.'},
  {n:'Órdenes', d:'Tres diarias de 200 y tres semanales de 750.'},
  {n:'Dificultad', d:'Recluta da la mitad; Veterano, un 25 % más.'}
];
const RANKS = [
  {min:1,  n:'Recluta',            k:'cuero'},
  {min:10, n:'Soldado',            k:'hierro'},
  {min:20, n:'Veterano',           k:'bronce'},
  {min:30, n:'Líder de escuadrón', k:'plata'},
  {min:50, n:'Capitán',            k:'oro'},
  {min:75, n:'Comandante',         k:'laurel'}
];
const LV_TITLES = {5:'Ya no tiembla', 10:'Superviviente', 15:'Ojo de halcón', 20:'Veterano de los muros', 25:'El que vuelve a por más', 30:'Líder nato',
  40:'Cicatrices de sobra', 50:'Capitán de campo', 60:'Leyenda viva', 75:'Comandante del Cuerpo', 100:'Más allá de los muros'};
const xpNeed = L => Math.min(3000, 500 + 100*(L-1));
function levelOf(xp){ let L=1, x=Math.max(0, Math.floor(xp||0)); while(x >= xpNeed(L)){ x -= xpNeed(L); L++; } return {lv:L, into:x, need:xpNeed(L)}; }
const rankOf = lv => RANKS.reduce((a,r)=> lv>=r.min ? r : a, RANKS[0]);
const rankIx = lv => RANKS.indexOf(rankOf(lv));
const xpTotal = () => meta().xp || 0;
const titlesFor = lv => Object.keys(LV_TITLES).map(Number).filter(l=>l<=lv).map(l=>LV_TITLES[l]);

// ---- experiencia de lo ya jugado (una vez, al estrenar el sistema) ----
function retroXp(){
  const M=meta(), st=statsOf(), g=st.g||{};
  let x = Object.keys(XP_G).reduce((a,k)=>a + XP_G[k]*(g[k]||0)*1.3, 0);
  x += 800*(M.ngLevel||0) + 400*(M.endings||[]).length + 25*(M.ach||[]).length + 4*(M.best||0);
  return Math.min(20000, Math.round(x));
}
function ensureXp(){
  const M=meta(); if(M.xp!==undefined) return;
  const x=retroXp(); saveMeta({xp:x, xpRetro:x, pass:{p1:{xp:Math.min(x, PASS1_CAP()), claimed:[]}}, xpLog:x?[{at:Date.now(), src:'import', n:'Lo ya jugado', v:x}]:[]});
  const L=levelOf(x).lv; saveMeta({lvSeen:L});
}
const PASS1_CAP = () => 800*30;

// ---- sumar experiencia ----
let LVUP = null;   // subida de nivel pendiente de mostrar {from, to}
function gainXP(src, amt, label){
  amt = Math.round(amt||0); if(amt<=0) return 0;
  ensureXp();
  const M=meta(), before=levelOf(M.xp||0).lv, p=Object.assign({p1:{xp:0, claimed:[]}}, M.pass||{});
  p.p1 = Object.assign({xp:0, claimed:[]}, p.p1); p.p1.xp = Math.min(PASS1_CAP(), (p.p1.xp||0) + amt);
  if(typeof seasonPass==='function'){ const sp=seasonPass(); if(sp){ p[sp.id] = Object.assign({xp:0, claimed:[]}, p[sp.id]); p[sp.id].xp = Math.min(sp.tier_xp*sp.tier_count, p[sp.id].xp + amt); } }
  const log = [{at:Date.now(), src, n:label||src, v:amt}].concat(M.xpLog||[]).slice(0,30);
  const xp = (M.xp||0) + amt;
  saveMeta({xp, pass:p, xpLog:log});
  if(S && !S.pvp) S.xpRun = (S.xpRun||0) + amt;
  const after = levelOf(xp).lv; if(after>before) LVUP = {from:before, to:after};
  if(typeof cloudAddXp==='function') cloudAddXp(src, amt);
  return amt;
}
const xpMul = () => XP_DIFF[(S&&S.diff)||'explorador'] || 1;
// combate ganado (lo llama win)
function xpForFight(G, t){
  if(!G || (S && S.pvp)) return 0;
  const base = (XP_G[G.g]||15) * (t==='b' ? 2 : t==='e' ? 1.5 : 1) + (G.reto && G.reto.ok ? 20 : 0);
  let got = gainXP('fight', Math.min(170, base*xpMul()), G.boss ? `Jefe con nota ${G.g}` : `Combate con nota ${G.g}`);
  const today = new Date().toISOString().slice(0,10);
  if(meta().xpFirst !== today){ saveMeta({xpFirst:today}); got += gainXP('first', 300, 'Primer combate del día'); }
  G.xp = got;
  orderEvent('win'); if(gradeIx(G.g)<=2) orderEvent('winA'); if(gradeIx(G.g)<=1) orderEvent('notaS'); if(G.boss) orderEvent('boss');
  if(G.reto && G.reto.ok) orderEvent('reto'); if(C && C.execs) orderEvent('nuca', C.execs);
  return got;
}

// ---- órdenes: 3 diarias y 3 semanales, iguales para todos ese día / esa semana ----
const ORD_D = [
  {k:'win5',   n:'Gana 5 combates', ev:'win', goal:5},
  {k:'winA3',  n:'Gana 3 combates con nota A o mejor', ev:'winA', goal:3},
  {k:'reto2',  n:'Cumple 2 retos', ev:'reto', goal:2},
  {k:'boss1',  n:'Derrota a un cambiante', ev:'boss', goal:1},
  {k:'nuca6',  n:'Remata a 6 titanes en la nuca', ev:'nuca', goal:6},
  {k:'poder1', n:'Transfórmate con un poder de los Nueve', ev:'poder', goal:1},
  {k:'prueba2',n:'Supera 2 pruebas en sucesos', ev:'prueba', goal:2},
  {k:'diaria', n:'Termina la expedición del día', ev:'daily', goal:1}
];
const ORD_S = [
  {k:'saga3',  n:'Completa 3 sagas', ev:'saga', goal:3},
  {k:'boss8',  n:'Derrota a 8 cambiantes', ev:'boss', goal:8},
  {k:'notaS3', n:'Consigue 3 notas S o S+', ev:'notaS', goal:3},
  {k:'reto10', n:'Cumple 10 retos', ev:'reto', goal:10},
  {k:'win30',  n:'Gana 30 combates', ev:'win', goal:30},
  {k:'camp1',  n:'Completa una campaña', ev:'camp', goal:1}
];
const ORD_XP = {d:200, s:750};
const dayKey = () => new Date().toISOString().slice(0,10);
function weekKey(){ const d=new Date(); const t=new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())); const dn=(t.getUTCDay()+6)%7; t.setUTCDate(t.getUTCDate()-dn+3);
  const y=t.getUTCFullYear(), w=1+Math.round(((t - Date.UTC(y,0,4))/864e5 - 3 + ((new Date(Date.UTC(y,0,4)).getUTCDay()+6)%7))/7); return `${y}-S${w}`; }
function pickOrders(list, key, n){ const R=mulberry(hashStr('ordenes|'+key)); return list.slice().map(o=>[R(),o]).sort((a,b)=>a[0]-b[0]).slice(0,n).map(x=>x[1]); }
function ordersNow(){
  const M=meta(), dk=dayKey(), wk=weekKey(); let o=M.ord||{};
  if(o.d!==dk) o = Object.assign({}, o, {d:dk, dp:{}, dd:[]});
  if(o.w!==wk) o = Object.assign({}, o, {w:wk, wp:{}, wd:[]});
  const dl = pickOrders(ORD_D, dk, 3), wl = pickOrders(ORD_S, wk, 3);
  return {o, daily:dl.map(x=>({...x, p:Math.min(x.goal, o.dp[x.k]||0), done:o.dd.includes(x.k)})), weekly:wl.map(x=>({...x, p:Math.min(x.goal, o.wp[x.k]||0), done:o.wd.includes(x.k)}))};
}
function orderEvent(ev, n){
  if(S && S.pvp && ev!=='duel') return;
  n = n||1; const N=ordersNow(), o=N.o; let paid=[];
  N.daily.forEach(x=>{ if(x.ev!==ev || x.done) return; o.dp[x.k]=(o.dp[x.k]||0)+n; if(o.dp[x.k]>=x.goal){ o.dd.push(x.k); paid.push(['orden_d', ORD_XP.d, 'Orden: '+x.n]); } });
  N.weekly.forEach(x=>{ if(x.ev!==ev || x.done) return; o.wp[x.k]=(o.wp[x.k]||0)+n; if(o.wp[x.k]>=x.goal){ o.wd.push(x.k); paid.push(['orden_s', ORD_XP.s, 'Orden semanal: '+x.n]); } });
  saveMeta({ord:o});
  paid.forEach(([s,v,l])=>{ gainXP(s, v, l); ORD_DONE.push(l); });
}
const ORD_DONE = [];   // órdenes completadas pendientes de anunciar

// ---- piezas visuales ----
function lvBadge(xp, size, own){
  const L=levelOf(xp), r=rankOf(L.lv), pct=Math.round(L.into/L.need*100), ley = own && typeof hasReward==='function' && hasReward('titulo','leyenda');
  return `<span class="lvb rk-${r.k} ${size||''} ${ley?'ley':''}" title="Nivel ${L.lv} · ${r.n}" style="--p:${pct}"><i class="lvr"></i><b class="num">${L.lv}</b></span>`;
}
function lvCard(){
  ensureXp(); const xp=xpTotal(), L=levelOf(xp), r=rankOf(L.lv), N=ordersNow(), od=N.daily.filter(x=>x.done).length;
  const p1=(meta().pass||{}).p1||{xp:0}, tier=Math.floor((p1.xp||0)/800);
  const tt = typeof titleNow==='function' ? titleNow() : '', bn = (()=>{ const e = typeof cosEq==='function' ? cosEq('estandarte') : null; if(!e) return ''; if(e.startsWith('L:')){ const it=loteItem(e); return it ? loteBanner(it) : ''; } return hasReward('estandarte', e) ? bannerSVG(e) : ''; })();
  return `<button class="lvcard rk-${r.k}" data-a="nivel">${bn?`<span class="lvbn">${bn}</span>`:''}${lvBadge(xp,'lg',true)}<span class="lvc-t"><b>Nivel ${L.lv} · ${r.n}</b>${tt?`<small class="lvtt">«${tt}»</small>`:''}
    <span class="xpbar"><i style="width:${Math.round(L.into/L.need*100)}%"></i></span><small class="num">${L.into.toLocaleString('es-ES')} / ${L.need.toLocaleString('es-ES')} XP · órdenes de hoy ${od}/3${typeof PASS1!=='undefined'?` · Pase 1: escalón ${Math.min(30,tier)}/30`:''}</small></span></button>`;
}
// tira de experiencia ganada en la recompensa
function xpStrip(G){
  if(!G || !G.xp) return '';
  const xp=xpTotal(), L=levelOf(xp);
  return `<div class="xpstrip"><b class="sfx">+${G.xp} XP</b><span class="xpbar"><i style="width:${Math.round(L.into/L.need*100)}%"></i></span><span class="lbl num">Nivel ${L.lv} · ${L.into}/${L.need}</span>${ORD_DONE.length?`<span class="lbl ordok">${ORD_DONE.splice(0).join(' · ')} cumplida</span>`:''}</div>`;
}
// cortinilla de subida de nivel (nunca en mitad de un combate)
function maybeLevelUp(){
  if(!LVUP || scr==='combat' || typeof document==='undefined') return;
  const {from, to}=LVUP; LVUP=null; saveMeta({lvSeen:to});
  const r=rankOf(to), newRank = rankIx(to)>rankIx(from), tl=Object.keys(LV_TITLES).map(Number).filter(l=>l>from && l<=to);
  const el=document.createElement('div'); el.className='lvup'; el.setAttribute('role','status');
  el.innerHTML=`<div class="lvup-in rk-${r.k}"><i class="sl"></i>${lvBadge(xpTotal(),'xl',true)}<b class="sfx">¡Nivel ${to}!</b>${newRank?`<span class="lbl">Nuevo rango: ${r.n}</span>`:''}${tl.length?`<span class="lbl">Título: «${LV_TITLES[tl[tl.length-1]]}»</span>`:''}<small>+${5*(to-from)} insignias</small></div>`;
  document.body.appendChild(el); if(typeof sfx==='function') sfx('win');
  const close=()=>{ el.classList.add('out'); setTimeout(()=>el.remove(), 300); };
  el.addEventListener('click', close); setTimeout(close, 2800);
}
