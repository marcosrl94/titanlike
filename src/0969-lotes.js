// ---------- Lotes temáticos: pases de temporada cargados desde Supabase (tabla passes, columna data) ----------
// Un lote solo usa tipos de recompensa que ya existen; sus parámetros (colores, motivo, texto) vienen en los datos,
// así que un pase nuevo se carga sin publicar código. Formato: scripts/cargar-lote.cjs valida el JSON y genera el SQL.
const LOTE_TYPES = ['titulo','estandarte','corte','dado','marco','fondo','efecto'];
const MOTIFS = ['muralla','rosa','alas','espadas','llama','luna','ancla'];
const passDefs = () => meta().passDefs || {};
// el pase de temporada en curso (el que suma experiencia junto al Pase 1)
function seasonPass(){
  const now=Date.now(), defs=passDefs();
  return Object.values(defs).find(d=>d.ends && Date.parse(d.starts)<=now && Date.parse(d.ends)>now) || null;
}
const nextSeason = () => { const now=Date.now(); return Object.values(passDefs()).filter(d=>d.ends && Date.parse(d.starts)>now).sort((a,b)=>Date.parse(a.starts)-Date.parse(b.starts))[0] || null; };
function loteState(id){ return Object.assign({xp:0, claimed:[]}, (meta().pass||{})[id]); }
function loteOwned(){ const out=[]; Object.values(passDefs()).forEach(d=>{ const st=loteState(d.id); (d.tiers||[]).forEach(T=>{ if(st.claimed.includes(T.n)) out.push(Object.assign({pass:d.id, key:'L:'+d.id+':'+T.id}, T)); }); }); return out; }
const loteItem = key => loteOwned().find(x=>x.key===key) || null;

function claimLote(id, n){
  const d=passDefs()[id]; if(!d) return false; const st=loteState(id), T=(d.tiers||[]).find(t=>t.n===n);
  if(!T || st.claimed.includes(n) || st.xp < n*d.tier_xp) return false;
  const p=Object.assign({}, meta().pass); p[id]=Object.assign({}, st, {claimed:st.claimed.concat(n)}); saveMeta({pass:p});
  const cos=Object.assign({eq:{}}, meta().cos||{}); if(!cos.eq[T.type]) cos.eq[T.type]='L:'+id+':'+T.id; saveMeta({cos}); applyPassCosmetics();
  if(typeof cloudClaim==='function') cloudClaim(id, n);
  return true;
}
// estética de los lotes: variables CSS en el body
function applyLoteCosmetics(){
  if(typeof document==='undefined') return; const b=document.body, eq=((meta().cos||{}).eq)||{};
  b.classList.remove('corte-lote','dice-lote','frame-lote');
  const c=eq.corte && loteItem(eq.corte); if(c){ b.classList.add('corte-lote'); b.style.setProperty('--slash-c', c.color||'#fff'); }
  const d=eq.dado && loteItem(eq.dado); if(d){ b.classList.add('dice-lote'); b.style.setProperty('--d-fill', d.fill||'#222'); b.style.setProperty('--d-stroke', d.stroke||'#fff'); b.style.setProperty('--d-glow', d.glow||'transparent'); }
  const f=eq.marco && loteItem(eq.marco); if(f){ b.classList.add('frame-lote'); b.style.setProperty('--fr-c', f.color||'#d8b45f'); }
}
function loteBanner(it){
  const c=it.colors||['#2b3a4a','#ebe6d6'], m=it.motif;
  const motif = m==='espadas' ? `<g stroke="${c[1]}" stroke-width="4" stroke-linecap="round"><path d="M24 74l32-32M56 74L24 42"/><path d="M20 70l8 8M60 70l-8 8"/></g>`
    : m==='llama' ? `<path d="M40 80c-12 0-16-10-12-18 3-6 8-8 8-16 7 5 6 12 10 14 2-4 2-7 1-10 9 6 11 16 7 22-3 5-8 8-14 8z" fill="${c[1]}"/>`
    : m==='luna' ? `<path d="M48 44a18 18 0 1 0 0 34 14 14 0 1 1 0-34z" fill="${c[1]}"/>`
    : m==='ancla' ? `<g fill="none" stroke="${c[1]}" stroke-width="4" stroke-linecap="round"><circle cx="40" cy="42" r="5"/><path d="M40 47v30M30 56h20M24 66c2 9 9 12 16 12s14-3 16-12"/></g>`
    : null;
  if(!motif){ BANNERS['_t']={c, m:m||'muralla', anim:it.anim}; const s=bannerSVG('_t'); delete BANNERS['_t']; return s; }
  return `<svg class="banner ${it.anim?'anim':''}" viewBox="0 0 80 110" aria-hidden="true"><path d="M8 4h64v92l-32-14-32 14z" fill="${c[0]}" stroke="${c[1]}" stroke-width="2"/>${motif}</svg>`;
}
function loteArt(it){
  if(it.type==='dado') return `<span class="dprev d20" style="--d-fill:${it.fill};--d-stroke:${it.stroke};--d-glow:${it.glow||'transparent'}" data-lote="1">${D20}<b>20</b></span>`;
  if(it.type==='marco') return `<span class="fprev" style="--fr-c:${it.color}" data-lote="1">${portrait('eren')}</span>`;
  if(it.type==='estandarte') return loteBanner(it);
  if(it.type==='fondo') return `<span class="fthumb">${momentSVG(Math.max(0, Math.min(MOMENTS.length-1, it.mo||0)))}</span>`;
  if(it.type==='corte') return `<span class="cprev"><svg viewBox="0 0 60 60"><line class="slash" x1="8" y1="52" x2="52" y2="8" style="animation:none;stroke-dashoffset:0;stroke:${it.color}"/></svg></span>`;
  return `<span class="ch-ic">${UIC[it.type==='titulo'?'card':'sun']||''}</span>`;
}
// pantalla del pase de temporada (mismo estilo que el Pase 1)
V.temporada = function(){
  const d=seasonPass(), nx=nextSeason();
  if(!d) return `<div class="row"><button class="btn ghost" data-a="pase">Volver al Pase 1</button></div>${hero('Pase de temporada', nx?nx.name:'Sin temporada en curso', nx?`Empieza el ${new Date(nx.starts).toLocaleDateString('es-ES',{day:'numeric',month:'long'})}. Mientras tanto, la experiencia sigue llenando el Pase 1.`:'Cuando empiece una, aparecerá aquí con su propia estética.', {cls:'pass'})}`;
  const st=loteState(d.id), n=Math.min(d.tier_count, Math.floor(st.xp/d.tier_xp)), cap=d.tier_xp*d.tier_count;
  const card = T => { const got=st.claimed.includes(T.n), can=!got && T.n<=n;
    return `<div class="tier ${got?'got':can?'can':'lock'}"><span class="tn num">${T.n}</span><div class="tart">${loteArt(T)}</div><span class="lbl">${R_KIND[T.type]||''}</span><b>${esc(T.name||T.text||'')}</b>
      ${got?'<span class="lbl tok">Reclamado</span>':can?`<button class="btn sm" data-a="claimlote" data-i="${d.id}:${T.n}">Reclamar</button>`:`<span class="lbl num">${(T.n*d.tier_xp).toLocaleString('es-ES')} XP</span>`}</div>`; };
  const ends = new Date(d.ends).toLocaleDateString('es-ES',{day:'numeric',month:'long'});
  return `<div class="row"><button class="btn ghost" data-a="pase">Pase 1</button></div>
    ${hero('Pase de temporada · hasta el '+ends, esc(d.name), `${n} de ${d.tier_count} escalones · ${st.xp.toLocaleString('es-ES')} / ${cap.toLocaleString('es-ES')} XP.`, {cls:'pass', side:`<div class="sh-side medal"><i class="sl"></i><b class="num">${n}</b><span class="lbl">de ${d.tier_count}</span></div>`})}
    <div class="ptrack"><span class="xpbar"><i style="width:${Math.round(st.xp/cap*100)}%"></i></span></div>
    <div class="tiers">${(d.tiers||[]).slice().sort((a,b)=>a.n-b.n).map(card).join('')}</div>`;
};
