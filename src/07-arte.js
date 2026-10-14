// ---------- Arte: emblemas de soldado y titanes (dibujos propios) e imágenes del jugador ----------
let CUSTOM = store.get('img') || {};
// nombres alternativos (paquetes «sin licencia»): se aplican sobre ROSTER y TITANS y se guardan con las imágenes
let NAMES = store.get('names') || {};
Object.values(ROSTER).forEach(r=>{ r.n0=r.n; }); Object.values(TITANS).forEach(t=>{ t.n0=t.n; });
function applyNames(){
  Object.entries(ROSTER).forEach(([id,r])=>{ r.n = NAMES[id] || r.n0; });
  Object.entries(TITANS).forEach(([id,t])=>{ t.n = NAMES[id] || t.n0; });
}
applyNames();
// a partir de la saga 4 (Marley) se usa la versión adulta si el jugador la ha cargado
// encuadre de las imágenes del jugador: zoom y desplazamiento guardados por imagen
let FIT = store.get('fit') || {};
const keyOf = id => (S && S.wave>3*PER && CUSTOM[id+'@a']) ? id+'@a' : id;
const fitStyle = k => { const f=FIT[k]; return f ? `transform:scale(${f.z}) translate(${f.x}%,${f.y}%)` : ''; };
function fitAdjust(k, op){
  const f = FIT[k] || {z:1, x:0, y:0}, d=4;
  if(op==='in') f.z=Math.min(2.5, +(f.z+.1).toFixed(2)); if(op==='out') f.z=Math.max(1, +(f.z-.1).toFixed(2));
  if(op==='l') f.x+=d; if(op==='r') f.x-=d; if(op==='u') f.y+=d; if(op==='d') f.y-=d;
  f.x=Math.max(-30,Math.min(30,f.x)); f.y=Math.max(-30,Math.min(30,f.y));
  if(op==='reset') delete FIT[k]; else FIT[k]=f;
  store.set('fit', FIT);
}
const imgOf = id => (S && S.wave>3*PER && CUSTOM[id+'@a']) || CUSTOM[id];
function portrait(id, big){   // emblema genérico: capucha del cuerpo e inicial, con el color del estilo
  const c = big ? 'pt lg' : 'pt';
  if(imgOf(id)) return `<span class="${c}"><img src="${imgOf(id)}" alt="" style="${fitStyle(keyOf(id))}"></span>`;
  const R = ROSTER[id];
  return `<span class="${c} s-${R.st}"><svg viewBox="0 0 100 100" aria-hidden="true">
    <rect width="100" height="100" fill="var(--stone-3)"/>
    <path d="M6 100 Q8 72 34 64 Q25 20 50 13 Q75 20 66 64 Q92 72 94 100Z" fill="var(--cloak)"/>
    <path d="M36 62 Q29 28 50 23 Q71 28 64 62 Q50 73 36 62Z" fill="var(--stone)"/>
    <path d="M50 70 L41 100 M50 70 L59 100" stroke="var(--stone-2)" stroke-width="2" fill="none"/>
    <text x="50" y="59" text-anchor="middle" font-family="Grenze Gotisch, Georgia, serif" font-weight="700" font-size="34" fill="currentColor">${R.n[0]}</text>
  </svg></span>`;
}
function titanFig(a){
  const cx=60, R=a.R, hy=a.hy, ty=hy+R*1.05+6, sh=a.sh, bel=a.bel;
  const skin = a.sk || (a.flay ? '#c4574a' : 'var(--flesh)'), body = a.fur ? '#4a3f33' : skin, line = a.fur ? '#2c251e' : a.flay ? '#f0d8c8' : 'var(--flesh-2)';
  const armL = `M${cx-sh+5} ${ty+6} Q${cx-sh-9} ${ty+a.arm*.5} ${cx-sh-3} ${ty+a.arm}`;
  const armR = a.up ? `M${cx+sh-5} ${ty+6} Q${cx+sh+14} ${ty-8} ${cx+sh+8} ${ty-a.arm*.62}` : `M${cx+sh-5} ${ty+6} Q${cx+sh+9} ${ty+a.arm*.5} ${cx+sh+3} ${ty+a.arm}`;
  const torso = `M${cx-sh} ${ty+4} Q${cx} ${ty-11} ${cx+sh} ${ty+4} Q${cx+bel+12} ${ty+52} ${cx+bel+5} 150 L${cx-bel-5} 150 Q${cx-bel-12} ${ty+52} ${cx-sh} ${ty+4}Z`;
  const musc = `M${cx} ${ty+2} V${ty+62} M${cx-sh*.62} ${ty+19} Q${cx-sh*.3} ${ty+29} ${cx-2} ${ty+21} M${cx+sh*.62} ${ty+19} Q${cx+sh*.3} ${ty+29} ${cx+2} ${ty+21}
    M${cx-bel*.8} ${ty+40} H${cx+bel*.8} M${cx-bel*.75} ${ty+52} H${cx+bel*.75}`;
  const mw=R*1.34, my=hy+R*.4, th=R*.36;
  let teeth=''; for(let i=1;i<7;i++){ const x=cx-mw/2+mw*i/7; teeth+=`M${x} ${my} V${my+th} `; }
  const er = a.up ? [R*.3,R*.17] : [R*.2,R*.2], ex=R*.44, ey=hy-R*.14;
  const hair = a.bald ? '' : a.bob
    ? `<path d="M${cx-R-2} ${hy+R*.6} Q${cx-R-4} ${hy-R*1.5} ${cx} ${hy-R*1.3} Q${cx+R+4} ${hy-R*1.5} ${cx+R+2} ${hy+R*.6} L${cx+R*.8} ${hy-R*.4} Q${cx} ${hy-R*.9} ${cx-R*.8} ${hy-R*.4}Z" fill="${a.h}"/>`
    : `<path d="M${cx-R} ${hy-R*.2} Q${cx} ${hy-R*2.1} ${cx+R} ${hy-R*.2} Q${cx} ${hy-R*.95} ${cx-R} ${hy-R*.2}Z" fill="${a.h}"/>`;
  const extra = a.armor
      ? `<g fill="var(--bone)" stroke="var(--stone-4)" stroke-width="1"><path d="M${cx-sh-4} ${ty+1} l17 -7 4 13 -15 9Z M${cx+sh+4} ${ty+1} l-17 -7 -4 13 15 9Z"/><path d="M${cx-17} ${ty+11} h15 v15 l-13 -3Z M${cx+17} ${ty+11} h-15 v15 l13 -3Z"/><path d="M${cx-13} ${ty+35} h26 l-3 13 h-20Z"/><path d="M${cx-R} ${hy+2} l${R*.5} ${R*.25} -${R*.2} ${R*.6}Z M${cx+R} ${hy+2} l-${R*.5} ${R*.25} ${R*.2} ${R*.6}Z"/></g>`
    : a.flay ? `<path d="M${cx-R*.9} ${hy+R*.1} l${R*.3} ${R*.75} M${cx+R*.9} ${hy+R*.1} l-${R*.3} ${R*.75} M${cx-sh*.8} ${ty+8} l8 34 M${cx+sh*.8} ${ty+8} l-8 34 M${cx-bel} ${ty+66} l4 26 M${cx+bel} ${ty+66} l-4 26" stroke="#f0d8c8" stroke-width="1.6" fill="none" opacity=".75"/>`
    : a.fur ? `<path d="M${cx-R*.8} ${hy+R*.55} Q${cx} ${hy+R*2.1} ${cx+R*.8} ${hy+R*.55} Q${cx} ${hy+R*1.25} ${cx-R*.8} ${hy+R*.55}Z" fill="#4a3f33"/><path d="M${cx-sh} ${ty+12} l-5 9 M${cx+sh} ${ty+12} l5 9 M${cx-14} ${ty+30} l-3 9 M${cx+14} ${ty+30} l3 9 M${cx-6} ${ty+70} l-2 9 M${cx+8} ${ty+74} l2 9" stroke="#2c251e" stroke-width="2" stroke-linecap="round"/>` : '';
  return `<svg viewBox="0 0 120 150" aria-hidden="true">
    <path d="${armL}" stroke="${body}" stroke-width="12" fill="none" stroke-linecap="round"/><path d="${armR}" stroke="${body}" stroke-width="12" fill="none" stroke-linecap="round"/>
    <path d="${torso}" fill="${body}"/><path d="${musc}" stroke="${line}" stroke-width="1.3" fill="none" opacity=".55"/>
    <g transform="rotate(${a.tilt||0} ${cx} ${hy+R})">
      <rect x="${cx-R*.42}" y="${hy+R*.7}" width="${R*.84}" height="${R*.7}" fill="${body}"/>
      <ellipse cx="${cx}" cy="${hy}" rx="${R}" ry="${R*1.1}" fill="${skin}"/>${hair}
      <circle cx="${cx-ex}" cy="${ey}" r="${er[0]}" fill="var(--bone)"/><circle cx="${cx+ex}" cy="${ey}" r="${er[1]}" fill="var(--bone)"/>
      <circle cx="${cx-ex}" cy="${ey}" r="${R*.075}" fill="var(--stone)"/><circle cx="${cx+ex}" cy="${ey}" r="${R*.075}" fill="var(--stone)"/>
      <rect x="${cx-mw/2}" y="${my}" width="${mw}" height="${th}" rx="2" fill="var(--bone)" stroke="var(--blood)" stroke-width="1.6"/><path d="${teeth}" stroke="var(--blood)" stroke-width="1"/>
    </g>${extra}</svg>`;
}
const titanArt = id => CUSTOM[id] ? `<img src="${CUSTOM[id]}" alt="" style="${fitStyle(id)}">` : TITANS[id].a.k ? marleyFig(TITANS[id].a.k) : titanFig(TITANS[id].a);
// ejército de Marley: soldados, tirador, artillería antititán y unidad Panzer (dibujos propios, a escala humana)
function marleyFig(k){
  const U='#5b6b5a', D='#3a4638', ST='var(--stone)', BN='var(--bone)', SK='var(--flesh)';
  const man = (x, y, o={}) => `<g transform="translate(${x} ${y})">
    <path d="M-9 30 L-9 58 M9 30 L9 58" stroke="${D}" stroke-width="9" stroke-linecap="round"/>
    <rect x="-12" y="8" width="24" height="30" rx="6" fill="${U}"/><rect x="-12" y="30" width="24" height="4" fill="${D}"/>
    <circle cx="0" cy="-3" r="9" fill="${SK}"/><path d="M-10 -5 Q0 -16 10 -5 L12 -2 L-12 -2Z" fill="${D}"/>
    ${o.rifle ? `<path d="M-18 24 L30 2" stroke="${ST}" stroke-width="4" stroke-linecap="round"/><path d="M-6 20 L12 11" stroke="${SK}" stroke-width="5" stroke-linecap="round"/>` : ''}</g>`;
  if(k==='soldier') return `<svg viewBox="0 0 120 150" aria-hidden="true">${man(60, 92, {rifle:1})}</svg>`;
  if(k==='sniper') return `<svg viewBox="0 0 120 150" aria-hidden="true"><g transform="translate(60 100)">
    <path d="M-14 36 L-26 50 M12 36 L14 50" stroke="${D}" stroke-width="9" stroke-linecap="round"/>
    <rect x="-13" y="10" width="26" height="30" rx="6" fill="${U}"/>
    <circle cx="2" cy="0" r="9" fill="${SK}"/><path d="M-8 -2 Q2 -13 12 -2 L14 1 L-10 1Z" fill="${D}"/>
    <path d="M-30 30 L56 4" stroke="${ST}" stroke-width="4" stroke-linecap="round"/><rect x="18" y="8" width="14" height="5" rx="2" fill="${BN}" transform="rotate(-17 25 10)"/>
    <path d="M-8 22 L14 14" stroke="${SK}" stroke-width="5" stroke-linecap="round"/></g></svg>`;
  if(k==='cannon') return `<svg viewBox="0 0 120 150" aria-hidden="true">
    <path d="M20 148 L70 148 L58 118 L34 118Z" fill="${D}"/>
    <path d="M44 120 L108 70" stroke="${ST}" stroke-width="13" stroke-linecap="round"/><path d="M44 120 L108 70" stroke="${BN}" stroke-width="2" opacity=".3"/>
    <path d="M60 86 l22 -12 l10 20 l-22 12Z" fill="#4a534b" stroke="${ST}" stroke-width="2"/>
    <circle cx="46" cy="126" r="20" fill="${ST}" stroke="${BN}" stroke-width="3"/><path d="M46 106 V146 M26 126 H66 M32 112 L60 140 M60 112 L32 140" stroke="${BN}" stroke-width="2"/>
    <circle cx="46" cy="126" r="5" fill="${BN}"/>${man(14, 92)}</svg>`;
  if(k==='panzer') return `<svg viewBox="0 0 120 150" aria-hidden="true">
    <rect x="12" y="102" width="96" height="32" rx="8" fill="#6a6f62" stroke="${ST}" stroke-width="2"/>
    <rect x="34" y="84" width="46" height="22" rx="5" fill="#5a6055" stroke="${ST}" stroke-width="2"/>
    <path d="M80 92 H112 M80 98 H110" stroke="${ST}" stroke-width="4" stroke-linecap="round"/>
    <path d="M20 110 h80 M22 126 h76" stroke="${ST}" stroke-width="1.5" stroke-dasharray="2 6" opacity=".7"/>
    <circle cx="30" cy="136" r="11" fill="${ST}" stroke="${BN}" stroke-width="2"/><circle cx="60" cy="136" r="11" fill="${ST}" stroke="${BN}" stroke-width="2"/><circle cx="90" cy="136" r="11" fill="${ST}" stroke="${BN}" stroke-width="2"/>
    <circle cx="30" cy="136" r="3" fill="${BN}"/><circle cx="60" cy="136" r="3" fill="${BN}"/><circle cx="90" cy="136" r="3" fill="${BN}"/>
    <rect x="44" y="90" width="10" height="7" fill="${ST}"/></svg>`;
  return '';
}
// el jugador puede poner sus propias imágenes: se reducen y se guardan solo en este navegador
// paquete de imágenes: {titanlike:1, img:{id: dataURL}}; las claves 'id@a' son versiones adultas
function mergePack(t){
  let n=0, nn=0; try{ const p=JSON.parse(t); Object.entries(p.img||{}).forEach(([k,v])=>{ const id=k.replace('@a','');
    if((ROSTER[id]||TITANS[id]) && typeof v==='string' && v.startsWith('data:image/')){ CUSTOM[k]=v; n++; } });
    Object.entries(p.names||{}).forEach(([id,v])=>{ if((ROSTER[id]||TITANS[id]) && typeof v==='string' && v.trim()){ NAMES[id]=v.trim().slice(0,28); nn++; } });
  }catch(e){}
  if(n) store.set('img', CUSTOM); if(nn){ store.set('names', NAMES); applyNames(); } return n+nn;
}
function importPack(file){
  file.text().then(async t=>{
    if(t.slice(0,200).includes('"musica"')){ packMsg = await importMusicPack(t); return render(); }
    const n=mergePack(t);
    packMsg = n ? `Importados ${n} elementos (imágenes y nombres).` : 'Ese archivo no es un paquete de Titanlike.'; render();
    if(n && typeof cloudUploadPack==='function') cloudUploadPack(); });
}
let packMsg = '';
function setCustom(id, file){
  const fr = new FileReader();
  fr.onload = () => { const im = new Image();
    im.onload = () => { const n=220, cv=document.createElement('canvas'); cv.width=cv.height=n;
      const k=Math.max(n/im.width, n/im.height), w=im.width*k, h=im.height*k;
      cv.getContext('2d').drawImage(im, (n-w)/2, TITANS[id] ? (n-h)/2 : Math.min(0,(n-h)*.2), w, h);
      CUSTOM[id]=cv.toDataURL('image/webp', .86); store.set('img', CUSTOM); render(); };
    im.src = fr.result; };
  fr.readAsDataURL(file);
}
