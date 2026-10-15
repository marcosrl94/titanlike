// ---------- Pase 1 «Crónica de los Muros»: 30 escalones con el contenido del juego repartido ----------
// No caduca. Los jugadores que ya existían al estrenarlo (legacy) conservan todo lo que el pase escalona;
// a los nuevos se les abre poco a poco. Los cuatro documentos activan, sin decirlo, una senda cada uno.
const PASS1 = {id:'p1', n:'Crónica de los Muros', tier_xp:800, tier_count:30, tiers:[
  {t:'titulo', id:'cadete', n:'Título «Cadete de la 104»'},
  {t:'recluta', id:'jean', n:'Recluta: Jean'},
  {t:'modo', id:'daily', n:'Se abre la expedición del día'},
  {t:'sucesos', id:'guarnicion', n:'Sucesos de la Guarnición', d:'Cuatro sucesos nuevos en el camino.'},
  {t:'recluta', id:'sasha', n:'Recluta: Sasha'},
  {t:'documento', id:'ragako', n:'Documento «Informe de Ragako»', d:'Un informe a medio quemar sobre una aldea vacía y un recluta que no volvió a casa.'},
  {t:'estandarte', id:'muralla', n:'Estandarte «Muralla»'},
  {t:'recluta', id:'connie', n:'Recluta: Connie'},
  {t:'corte', id:'azul', n:'Corte «Acero azul»'},
  {t:'modo', id:'vet', n:'Dificultad Veterano y duelos entre amigos'},
  {t:'recluta', id:'hange', n:'Recluta: Hange'},
  {t:'documento', id:'carta', n:'Documento «Carta sin remite»', d:'Una carta sin firma. Alguien en el interior sabe quién es en realidad una de las reclutas.'},
  {t:'fondo', id:'trost', mo:0, n:'Fondo de portada «Trost en llamas»'},
  {t:'recluta', id:'historia', n:'Recluta: Historia'},
  {t:'dado', id:'d_hueso', n:'Dado de hueso', also:{t:'titulo', id:'trost', n:'Título «Superviviente de Trost»'}},
  {t:'sucesos', id:'interior', n:'Sucesos del interior', d:'Cuatro sucesos nuevos dentro de los muros.'},
  {t:'recluta', id:'reiner', n:'Recluta: Reiner'},
  {t:'documento', id:'diario', n:'Documento «Diario de un recluta»', d:'Páginas de alguien que sobrevivió a Shiganshina y ya no cree en las órdenes.'},
  {t:'efecto', id:'rayo', n:'Efecto del 20 natural «Relámpago»'},
  {t:'recluta', id:'annie', n:'Recluta: Annie', also:{t:'estandarte', id:'rosa', n:'Estandarte «Rosa»'}},
  {t:'corte', id:'carmesi', n:'Corte «Vapor carmesí»'},
  {t:'recluta', id:'erwin', n:'Recluta: Erwin'},
  {t:'fondo', id:'maria', mo:8, n:'Fondo de portada «Muro María al amanecer»'},
  {t:'documento', id:'mapa', n:'Documento «Mapa del puerto»', d:'Un mapa del puerto de Paradis con barcos que no son de la isla.'},
  {t:'recluta', id:'levi', n:'Recluta: Levi'},
  {t:'sucesos', id:'marley', n:'Sucesos de Marley', d:'Cuatro sucesos nuevos al otro lado del mar.'},
  {t:'marco', id:'m_hierro', n:'Marco «Hierro forjado»'},
  {t:'efecto', id:'vapor', n:'Efecto del 20 natural «Explosión de vapor»'},
  {t:'dado', id:'d_retumbar', n:'Dado del Retumbar'},
  {t:'titulo', id:'leyenda', n:'Título «Leyenda de Paradis»', also:{t:'estandarte', id:'leyenda', n:'Estandarte «Leyenda»'}, borde:true}
]};
const PASS_TITLES = {cadete:'Cadete de la 104', trost:'Superviviente de Trost', leyenda:'Leyenda de Paradis'};
const BANNERS = {muralla:{n:'Muralla', c:['#3f7a52','#ebe6d6'], m:'muralla'}, rosa:{n:'Rosa', c:['#7a2f3a','#f0c8cf'], m:'rosa'}, leyenda:{n:'Leyenda', c:['#2a2418','#ffd36a'], m:'alas', anim:1}};
const CORTES = {azul:{n:'Acero azul'}, carmesi:{n:'Vapor carmesí'}};
const EFECTOS = {rayo:{n:'Relámpago'}, vapor:{n:'Explosión de vapor'}};
const FONDOS = {trost:{n:'Trost en llamas', mo:0}, maria:{n:'Muro María al amanecer', mo:8}};
// sucesos por lote (por nombre, para no depender del orden)
const EV_LOTS = {guarnicion:['Cuartel abandonado','Puñetazos en el establo','Cañón de la Guarnición','Bengala verde'],
  interior:['Mercader de la Policía Militar','El dirigible de Hange','Un titán dormido','Huérfanos en el camino'],
  marley:['El festival de los Tybur','Dos candidatos a guerrero','Puerto de Liberio','Tormenta']};
const DOC_ALT = {ragako:'caida', carta:'reina', diario:'jaeger', mapa:'paradis'};
// dados y marcos del pase: viven en la Intendencia como objetos que no se compran
Object.assign(SHOP, {d_hueso:{n:'Dado de hueso', p:0, kind:'dado', pass:15, d:'Tu d20 tallado en hueso.'}, d_retumbar:{n:'Dado del Retumbar', p:0, kind:'dado', pass:29, d:'Tu d20 con el vapor del Retumbar.'},
  m_hierro:{n:'Marco «Hierro forjado»', p:0, kind:'marco', pass:27, d:'Marco de hierro remachado en los retratos.'}});

// ---- estado ----
function ensurePass(){
  const M=meta(); if(M.legacy===undefined) saveMeta({legacy: (M.runs||0)>0 || (M.ach||[]).length>0 || (M.best||0)>1});
  if(!M.pass || !M.pass.p1){ const p=Object.assign({}, M.pass||{}); p.p1={xp:Math.min(PASS1_CAP(), M.xp||0), claimed:[]}; saveMeta({pass:p}); }
}
const passState = () => { ensurePass(); return Object.assign({xp:0, claimed:[]}, (meta().pass||{}).p1); };
const tierOf = xp => Math.min(PASS1.tier_count, Math.floor((xp||0)/PASS1.tier_xp));
const claimedP1 = () => passState().claimed || [];
const claimable = () => { const s=passState(), n=tierOf(s.xp); return Array.from({length:n}, (_,i)=>i+1).filter(t=>!s.claimed.includes(t)); };
const isLegacy = () => !!meta().legacy;
function rewardsOf(T){ return [T].concat(T.also ? [T.also] : []); }
function ownedRewards(){ const out=[]; claimedP1().forEach(n=>{ const T=PASS1.tiers[n-1]; if(T) out.push(...rewardsOf(T)); }); return out; }
const hasReward = (t, id) => ownedRewards().some(r=>r.t===t && r.id===id);
// lo que el pase escalona: abierto si eres veterano del juego o si ya lo reclamaste
const modeOpen = id => isLegacy() || hasReward('modo', id);
const docOpen = id => isLegacy() || hasReward('documento', id) || ((statsOf().alts||[]).includes(DOC_ALT[id]));
const lotOpen = id => isLegacy() || hasReward('sucesos', id);
const passStarters = () => ownedRewards().filter(r=>r.t==='recluta').map(r=>r.id);
const tierFor = (t, id) => PASS1.tiers.findIndex(T=>rewardsOf(T).some(r=>r.t===t && r.id===id)) + 1;
function eventLocked(i){ const E=EVENTS[i]; if(!E) return false; for(const k in EV_LOTS) if(EV_LOTS[k].includes(E.n) && !lotOpen(k)) return true; return false; }
// las encrucijadas solo aparecen con su documento
{ const base = crossroadAt; crossroadAt = i => { const a = base(i); if(!a) return a; const doc = Object.keys(DOC_ALT).find(k=>DOC_ALT[k]===a); return !doc || docOpen(doc) ? a : null; }; }

// ---- reclamar ----
function claimTier(n){
  const s=passState(); if(n<1 || n>tierOf(s.xp) || s.claimed.includes(n)) return false;
  const p=Object.assign({}, meta().pass); p.p1=Object.assign({}, s, {claimed:s.claimed.concat(n)}); saveMeta({pass:p});
  rewardsOf(PASS1.tiers[n-1]).forEach(grantReward);
  if(typeof cloudClaim==='function') cloudClaim('p1', n);
  return true;
}
function grantReward(r){
  if(r.t==='dado' || r.t==='marco'){ const sh=shopOf(); if(!sh.own.includes(r.id)){ sh.own.push(r.id); const st=statsOf(); st.shop=sh; saveMeta({stats:st}); } }
  const cos=Object.assign({eq:{}}, meta().cos||{});
  // lo primero que consigues de cada tipo se equipa solo
  if(['titulo','estandarte','corte','efecto','fondo'].includes(r.t) && !cos.eq[r.t]) cos.eq[r.t]=r.id;
  saveMeta({cos}); applyPassCosmetics();
}
function equipCos(kind, id){ const cos=Object.assign({eq:{}}, meta().cos||{}); cos.eq[kind] = cos.eq[kind]===id ? null : id; saveMeta({cos});
  if((kind==='dado'||kind==='marco') && cos.eq[kind]){ const sh=shopOf(); sh.eq[kind]=null; const st=statsOf(); st.shop=sh; saveMeta({stats:st}); applyCosmetics(); }
  applyPassCosmetics(); }
const cosEq = k => ((meta().cos||{}).eq||{})[k] || null;
function applyPassCosmetics(){
  if(typeof document==='undefined') return;
  document.body.className = document.body.className.replace(/\b(corte|n20)-\S+/g,'').trim();
  const c=cosEq('corte'); if(c && hasReward('corte', c)) document.body.classList.add('corte-'+c);
  if(typeof applyLoteCosmetics==='function') applyLoteCosmetics();
}
// efecto del 20 natural equipado (lo llama el efecto de corte)
function n20fx(p){
  let e=cosEq('efecto'), col=null; if(!e || typeof FXON!=='function' || !FXON()) return;
  if(e.startsWith('L:')){ const it=loteItem(e); if(!it) return; e=it.kind||'rayo'; col=it.color; } else if(!hasReward('efecto', e)) return;
  if(e==='rayo' && typeof boltAt==='function'){ boltAt(p); flash(col||'#ffe7a3', .35); }
  if(e==='vapor'){ steam(p, 16, col||'rgba(255,207,154,.85)'); ring(p, col||'#ffcf9a', 320); }
}
const titleNow = () => { const t=cosEq('titulo'); if(t && t.startsWith('L:')){ const it=loteItem(t); if(it) return it.text; } if(t && hasReward('titulo', t)) return PASS_TITLES[t]; const lt=typeof titlesFor==='function' ? titlesFor(levelOf(xpTotal()).lv) : []; return lt.length ? lt[lt.length-1] : ''; };
function bannerSVG(id){
  const B=BANNERS[id]; if(!B) return '';
  const motif = B.m==='muralla' ? `<path d="M14 70h52v-24h-8v6h-6v-6h-8v6h-8v-6h-8v6h-6v-6h-8z" fill="${B.c[1]}" opacity=".9"/>`
    : B.m==='rosa' ? `<g fill="none" stroke="${B.c[1]}" stroke-width="3"><circle cx="40" cy="52" r="7"/><path d="M40 45c-9-10-20 2-11 10M40 45c9-10 20 2 11 10M29 55c-6 9 6 16 11 9M51 55c6 9-6 16-11 9"/><path d="M40 70v14"/></g>`
    : `<g fill="${B.c[1]}"><path d="M40 44c-8 0-22 6-28 18 10-4 18-3 24 1z"/><path d="M40 44c8 0 22 6 28 18-10-4-18-3-24 1z"/><circle cx="40" cy="52" r="5"/></g>`;
  return `<svg class="banner ${B.anim?'anim':''}" viewBox="0 0 80 110" aria-hidden="true"><path d="M8 4h64v92l-32-14-32 14z" fill="${B.c[0]}" stroke="${B.c[1]}" stroke-width="2"/>${motif}</svg>`;
}

// ---- iconos de las recompensas en la pista ----
function rewardArt(r){
  if(r.t==='recluta') return portrait(r.id);
  if(r.t==='dado') return `<span class="dprev d20 sk-${r.id.slice(2)}">${D20}<b>20</b></span>`;
  if(r.t==='marco') return `<span class="fprev fr-${r.id.slice(2)}">${portrait('eren')}</span>`;
  if(r.t==='estandarte') return bannerSVG(r.id);
  if(r.t==='fondo') return `<span class="fthumb">${momentSVG(FONDOS[r.id].mo)}</span>`;
  if(r.t==='corte') return `<span class="cprev corte-${r.id}"><svg viewBox="0 0 60 60"><line class="slash" x1="8" y1="52" x2="52" y2="8" style="animation:none;stroke-dashoffset:0"/></svg></span>`;
  const ic = {titulo:'card', modo:'flag', sucesos:'book', documento:'book', efecto:'sun'}[r.t] || 'flag';
  return `<span class="ch-ic">${UIC[ic]||''}</span>`;
}
const R_KIND = {titulo:'Título', recluta:'Recluta', modo:'Modo', sucesos:'Mundo', documento:'Documento', estandarte:'Estandarte', corte:'Corte', fondo:'Fondo', efecto:'Efecto', dado:'Dado', marco:'Marco'};

// ---- pantalla del pase ----
V.pase = function(){
  ensurePass(); const s=passState(), n=tierOf(s.xp), cl=claimable(), into=s.xp - n*PASS1.tier_xp;
  const card = (T, i) => { const k=i+1, got=s.claimed.includes(k), can=!got && k<=n, rs=rewardsOf(T);
    return `<div class="tier ${got?'got':can?'can':'lock'} k-${T.t}"><span class="tn num">${k}</span><div class="tart">${rewardArt(T)}</div>
      <span class="lbl">${R_KIND[T.t]||''}</span><b>${rs.map(r=>r.n).join(' + ')}</b>${got && T.d ? `<small>${T.d}${T.t==='documento'?' Algo ha cambiado al otro lado de los muros.':''}</small>` : T.d && T.t!=='documento' ? `<small>${T.d}</small>` : ''}
      ${got ? '<span class="lbl tok">Reclamado</span>' : can ? `<button class="btn sm" data-a="claim" data-i="${k}">Reclamar</button>` : `<span class="lbl num">${(k*PASS1.tier_xp).toLocaleString('es-ES')} XP</span>`}</div>`; };
  const own = ownedRewards(), lotes = typeof loteOwned==='function' ? loteOwned() : [], eqRow = (kind, list, name) => {
    const mine=own.filter(r=>r.t===kind).map(r=>({id:r.id, n:(list[r.id]&&list[r.id].n) || r.n.replace(/^[^«]*«|»$/g,'')})).concat(lotes.filter(x=>x.type===kind).map(x=>({id:x.key, n:x.name||x.text})));
    if(!mine.length) return '';
    return `<div class="eqrow"><span class="lbl">${name}</span>${mine.map(r=>`<button class="btn sm ${cosEq(kind)===r.id?'':'ghost'}" data-a="cos" data-i="${kind}|${r.id}">${esc(r.n)}</button>`).join('')}</div>`; };
  const eq = [eqRow('titulo', Object.fromEntries(Object.entries(PASS_TITLES).map(([k,v])=>[k,{n:v}])), 'Título'), eqRow('estandarte', BANNERS, 'Estandarte'), eqRow('corte', CORTES, 'Corte'), eqRow('efecto', EFECTOS, 'Efecto del 20'), eqRow('fondo', FONDOS, 'Fondo de portada'), eqRow('dado', {}, 'Dado de temporada'), eqRow('marco', {}, 'Marco de temporada')].join('');
  const sp = typeof seasonPass==='function' ? seasonPass() : null, nx = typeof nextSeason==='function' ? nextSeason() : null;
  return `<div class="row"><button class="btn ghost" data-a="home">Volver</button>${sp||nx?`<button class="btn ghost" data-a="temporada">${sp?'Pase de temporada: '+esc(sp.name):'Próxima temporada: '+esc(nx.name)}</button>`:''}${cl.length>1?`<button class="btn" data-a="claimall">Reclamar ${cl.length} escalones</button>`:''}</div>
    ${hero('Pase 1 · no caduca', PASS1.n, `${n} de ${PASS1.tier_count} escalones. ${n<PASS1.tier_count?`${into.toLocaleString('es-ES')} / ${PASS1.tier_xp} XP para el siguiente.`:'Completado.'} Toda la experiencia que ganas jugando lo hace avanzar.`,
      {cls:'pass', art:momentSVG(cosEq('fondo') && FONDOS[cosEq('fondo')] ? FONDOS[cosEq('fondo')].mo : 4), side:`<div class="sh-side medal"><i class="sl"></i><b class="num">${n}</b><span class="lbl">de ${PASS1.tier_count}</span></div>`})}
    <div class="ptrack"><span class="xpbar"><i style="width:${Math.round(s.xp/(PASS1.tier_xp*PASS1.tier_count)*100)}%"></i></span></div>
    ${isLegacy()?'<p class="dim" style="font-size:13.5px">Ya jugabas antes del pase: los reclutas, modos, sucesos y sendas que escalona ya los tienes abiertos. Los escalones te dan igualmente su estética.</p>':''}
    <div class="tiers">${PASS1.tiers.map(card).join('')}</div>
    ${eq?`<span class="lbl sect">Tu estética</span><section class="panel eqp">${eq}</section>`:''}`;
};
