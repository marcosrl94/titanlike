// ---------- Pantallas ----------
let TITLE_BG = 0;
// sello de saga completada: la mejor nota contra su jefe final, en rótulo de manga con líneas de acción
function sagaStamp(boss){ const r=statsOf().rec[boss]; if(!r) return ''; const k=r.g.replace('+','p');
  return `<span class="stamp g-${k}" title="Saga completada · mejor nota contra ${TITANS[boss].n}: ${r.g} (${r.sc} puntos)"><i class="sl"></i><b>${r.g}</b><small>Completada</small></span>`; }
let pendingRec = null, pendingSaga = 0, picked = [], pendingNg = false, relicPick = [], pendingAlt = null;
const esc = s => String(s==null?'':s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const chip = st => `<span class="chip s-${st}">${STYLE[st]}</span>`;
// rasgos para las pruebas de habilidad: estilo +1 y rasgos propios
const traitsOf = id => Object.keys(SKILLS).map(k=>[k, ((ROSTER[id].tr||{})[k]||0) + (STYLE_SKILL[ROSTER[id].st]===k?1:0)]).filter(x=>x[1]>0).sort((x,y)=>y[1]-x[1]);
const traitsHTML = id => `<span class="lbl num traits">${traitsOf(id).map(([k,v])=>`${SKILLS[k]} +${v}`).join(' · ')}</span>`;
function solCard(id, lvl){   // lvl: nivel al que se uniría ahora (stats escaladas); sin lvl, stats base
  const R=ROSTER[id], k = lvl ? lvlMul({lvl}) : 1, rl = x => (S && S.rel) ? rel(x) : 0, hp = lvl ? Math.round(R.hp*k*(1+.15*rl('capa'))) : R.hp;
  return `<div class="who">${portrait(id,true)}<div><h3>${R.n}</h3><div class="row" style="gap:6px">${chip(R.st)}${lvl?`<small class="lbl num">Nv ${lvl}</small>`:''}</div></div></div>
    <div class="stats num"><span><b>PV</b>${hp}</span><span><b>ATQ</b>${Math.round(R.atk*k)}</span><span><b>VEL</b>${lvl?R.spd+3*rl('caballos'):R.spd}</span></div>
    <p><b>${R.sk.n}</b>${R.sk.gas?` · ${R.sk.gas} gas`:''}${R.sk.cd?` · recarga ${R.sk.cd}`:''}. ${R.sk.d}</p>${traitsHTML(id)}`;
}
function squadHTML(mode){   // mode: 'ally' (elegir compañero), 'swap' (relevar) o nada
  return `<div class="squad">`+S.squad.map(s=>{
    const R=ROSTER[s.id], m=maxHp(s), f=C&&C.fx[s.id]||{};
    const aim = C && CFG.intent && scr==='combat' && s.hp>0 ? C.titans.filter(t=>t.hp>0 && (t.intent===s.id || t.intent==='all')).length : 0;
    const st=[f.stun>0&&'Aturdido',aim&&`En el punto de mira${aim>1?' ×'+aim:''}`,f.titan>0&&'Titán',f.up>0&&'Flanqueo',f.crit>0&&'Olfato',f.guard>0&&'Escudo',f.taunt>0&&'Señuelo'].filter(Boolean).join(' · ');
    const can = mode && s.hp>0;
    const cl=['sol', s.hp<=0&&'dead', C&&C.active===s&&'active', can&&'pick'].filter(Boolean).join(' ');
    const pic = f.formT>0 ? `<span class="pt tf">${titanArt(POWERS[f.form].art)}</span>` : portrait(s.id);
    const tags = pwOf(s.id).map(k=>`<span class="chip pwc">${POWERS[k].n.replace(/^Titán (de )?/,'')}</span>`).join('') + (S.vow && S.vow[s.id] ? `<span class="chip vow" title="Juró por ${ROSTER[S.vow[s.id]].n}: +10 % de daño">Por ${ROSTER[S.vow[s.id]].n}</span>` : '');
    const inner=`${pic}<span class="inf"><h3>${R.n}<small class="num">Nv ${s.lvl}</small></h3>
      <span class="row" style="gap:6px">${chip(R.st)}${tags}<span class="st">${st}</span></span>
      <span class="bar hp"><i style="width:${s.hp/m*100}%"></i></span><span class="lbl num hpn">${s.hp} / ${m} PV</span></span>`;
    return can ? `<button class="${cl}" data-u="s${s.id}" data-a="${mode==='swap'?'swap':'sol'}" data-i="${s.id}">${inner}</button>` : `<div class="${cl}" data-u="s${s.id}">${inner}</div>`;
  }).join('')+`</div>`;
}
function powersHTML(){
  const o=owned(); if(!o.length) return '';
  return `<div class="relics"><span class="lbl" style="align-self:center">Los Nueve ${o.length}/9</span>`+o.map(k=>`<span class="chip pwc">${POWERS[k].n} · ${S.pw[k]==='reserva'?'reserva':ROSTER[S.pw[k]].n}</span>`).join('')+`</div>`;
}
function relicsHTML(){
  const k=Object.keys(S.rel); if(!k.length) return powersHTML();
  return powersHTML()+`<div class="relics">`+k.map(x=>`<span class="chip">${UPG[x].n}${S.rel[x]>1?' ×'+S.rel[x]:''}</span>`).join('')+`</div>`;
}
const UIC = {   // iconos de interfaz (trazo, 24×24)
  play:'<svg class="ui" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" fill="currentColor" stroke="none"/></svg>',
  sun:'<svg class="ui" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/></svg>',
  duel:'<svg class="ui" viewBox="0 0 24 24"><path d="M4 4l10 10M14 14l-2 4 6-6-4 2M20 4L10 14M10 14l2 4-6-6 4 2"/></svg>',
  trophy:'<svg class="ui" viewBox="0 0 24 24"><path d="M7 4h10v5a5 5 0 0 1-10 0z M7 6H4a3 3 0 0 0 3 4 M17 6h3a3 3 0 0 1-3 4 M12 14v4 M8 21h8"/></svg>',
  bag:'<svg class="ui" viewBox="0 0 24 24"><path d="M5 8h14l-1 12H6z M9 8V6a3 3 0 0 1 6 0v2"/></svg>',
  book:'<svg class="ui" viewBox="0 0 24 24"><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z M4 19V5 M8 7h7"/></svg>',
  tree:'<svg class="ui" viewBox="0 0 24 24"><circle cx="6" cy="6" r="2"/><circle cx="6" cy="18" r="2"/><circle cx="18" cy="12" r="2"/><path d="M6 8v8 M8 6c6 0 4 6 8 6"/></svg>',
  card:'<svg class="ui" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="11" r="2.5"/><path d="M5.5 17c1-2 5-2 6 0 M14 10h4 M14 14h4"/></svg>',
  image:'<svg class="ui" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 17l-5-5-9 8"/></svg>',
  help:'<svg class="ui" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .9-1 1.7 M12 17h.01"/></svg>',
  gas:'<svg class="ui" viewBox="0 0 24 24"><rect x="7" y="6" width="10" height="15" rx="3"/><path d="M10 6V3h4v3 M7 11h10"/></svg>',
  coin:'<svg class="ui" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><path d="M12 8v8 M9.5 10h4a1.5 1.5 0 0 1 0 3h-3a1.5 1.5 0 0 0 0 3h4"/></svg>',
  flag:'<svg class="ui" viewBox="0 0 24 24"><path d="M5 21V4 M5 4h11l-2 4 2 4H5"/></svg>',
  up:'<svg class="ui" viewBox="0 0 24 24"><path d="M12 20V5 M6 11l6-6 6 6 M5 20h14"/></svg>',
  heart:'<svg class="ui" viewBox="0 0 24 24"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/></svg>',
  die:'<svg class="ui" viewBox="0 0 24 24"><path d="M12 2l9 5v10l-9 5-9-5V7z M12 7l4.5 7.5h-9z"/></svg>',
  frame:'<svg class="ui" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="3"/><rect x="8" y="8" width="8" height="8" rx="1"/></svg>'
};
const ICON = {
  c:'<path class="ic" d="M-9 9L9 -9M-9 -9L9 9"/>',
  e:'<path class="ic" d="M-11 11L11 -11M-11 -11L11 11"/><path class="dia" d="M0 -6l6 6-6 6-6-6Z"/>',
  v:'<text class="q" y="9">?</text>',
  k:'<path class="ic" d="M-12 9L0 -11L12 9Z M0 -11V9"/>',
  b:'<path class="ic" d="M-10 -2a10 10 0 1 1 20 0v6h-4v5h-12v-5h-4Z M-4 -3h.1 M4 -3h.1"/>',
  t:'<path class="ic" d="M-9 -3h18l-2 12h-14Z M-4 -3v-3a4 4 0 0 1 8 0v3"/>'
};
function mapSVG(){
  const m=S.map, X=r=>50+r*105, Y=c=>50+c*75, open=openNodes();
  let edges='', nodes='';
  m.rows.forEach((row,r)=>row.forEach((n,i)=>{
    n.next.forEach(j=>{ const b=m.rows[r+1][j];
      const walked = m.path[r]===i && m.path[r+1]===j, op = m.pos && m.pos[0]===r && m.pos[1]===i;
      edges+=`<line class="edge ${walked?'walk':op?'open':''}" x1="${X(r)}" y1="${Y(n.c)}" x2="${X(r+1)}" y2="${Y(b.c)}"/>`; });
    const isOpen = open.some(o=>o[0]===r&&o[1]===i), done = m.path[r]===i;
    nodes+=`<g class="node ${n.t} ${done?'done':isOpen?'open':''}" transform="translate(${X(r)} ${Y(n.c)})" ${isOpen?`data-a="node" data-i="${r},${i}" tabindex="0" role="button" aria-label="${NODE[n.t].n}"`:''}>
      <circle r="22"/>${ICON[n.t]}<text class="nm" y="38">${NODE[n.t].n}</text></g>`;
  }));
  return `<svg class="map" viewBox="0 0 520 262" role="group" aria-label="Mapa de rutas">${edges}${nodes}</svg>`;
}
// ---- piezas comunes de las pantallas interiores (estética anime: viñeta con arte de la zona, líneas de acción y onomatopeya) ----
const zoneArt = () => { if(!S || !S.map) return ''; const zn=zoneOf(S.wave), mo = zn.mo!==undefined ? zn.mo : S.map.z; return MOMENTS[mo] ? momentSVG(mo) : ''; };
function hero(kick, title, sub, o){ o=o||{};
  return `<header class="shero ${o.cls||''}"><div class="sh-art">${o.art!==undefined?o.art:zoneArt()}</div><i class="sl"></i><i class="sh-ht"></i>
    <div class="sh-tx"><span class="lbl">${kick}</span><h2>${title}</h2>${sub?`<p>${sub}</p>`:''}</div>${o.sfx?`<b class="sfx sh-sfx">${o.sfx}</b>`:''}${o.side||''}</header>`; }
const chN = i => `<span class="chn num" aria-hidden="true">${i+1}</span>`;   // atajo de teclado 1-9
const chk = t => String(t).replace(/Prueba de ([A-Za-zÁÉÍÓÚáéíóúñ ]+?) \((\d+)\)/g, '<span class="chk"><i>d20</i>$1 · $2</span>');
const sagaLbl = w => `Saga ${sagaIx(w)+1} · ${sagaOf(w).n}`;
const V = {
  title(){
    const run=migrateRun(store.get('run')), M=meta(), ok=!!run, st=statsOf();
    // arte de fondo: la última zona a la que has llegado (o Trost)
    const bg = ok ? (zoneOf(run.wave).mo!==undefined ? zoneOf(run.wave).mo : Math.floor((run.wave-1)/5)) : Math.min(11, Math.floor(Math.max(0,(M.best||1)-1)/5));
    const nd = CLOUD.user && typeof newDuels==='function' ? newDuels() : 0, dd=dailyDone();
    const it = (a, ic, n, d, attrs='') => `<button class="mm-it" data-a="${a}" ${attrs}>${UIC[ic]||''}<span><b>${n}</b>${d?`<small>${d}</small>`:''}</span></button>`;
    TITLE_BG = typeof cosEq==='function' && cosEq('fondo') && FONDOS[cosEq('fondo')] && hasReward('fondo', cosEq('fondo')) ? FONDOS[cosEq('fondo')].mo : bg;
    return `<section class="mm"><div class="mm-main">
        <div class="mm-logo"><h1>Titanlike</h1><p>Cuatro sagas, doce cambiantes y un escuadrón que no vuelve entero.</p></div>
        <div class="mm-cta">
          ${ok?`<button class="btn lg mm-play" data-a="continue">${UIC.play}<span>Continuar<small>${sagaOf(run.wave).n} · jornada ${dayOf(run.wave)} de ${PER}</small></span></button>`:''}
          <button class="btn lg ${ok?'ghost':'mm-play'}" data-a="sagas">${ok?'Nueva expedición':`${UIC.play}<span>Salir de las murallas<small>Elige saga y primer recluta</small></span>`}</button>
        </div>
        <nav class="mm-list" aria-label="Menú principal">
          ${typeof modeOpen==='function' && !modeOpen('daily') ? it('daily','sun','Expedición del día', `Se abre en el escalón ${tierFor('modo','daily')} del Pase 1`, 'disabled') : it('daily','sun','Expedición del día', dd?'Ya la has jugado hoy':`${dailyInfo().mod.n} · misma semilla para todos`, dd?'disabled':'')}
          ${typeof PASS1!=='undefined' ? it('pase','flag','Pase 1 · '+PASS1.n, (()=>{ const c=claimable().length; return c ? `<em>${c} escalón${c>1?'es':''} por reclamar</em>` : `Escalón ${tierOf(passState().xp)} de ${PASS1.tier_count}`; })()) : ''}
          ${it('amigos','duel','Amigos y duelos', nd?`<em>${nd} duelo${nd>1?'s':''} nuevo${nd>1?'s':''}</em>`:'Reta con tus leyendas')}
          ${it('board','trophy','Clasificación', CLOUD.user?'Temporada en curso':'Con sesión iniciada', cloudOn()&&CLOUD.user?'':'disabled')}
          ${it('intendencia','bag','Intendencia', `${insignias()} insignias`)}
          ${it('codex','book','Códice y logros', `${M.ach.length} de ${ACH.length} logros`)}
          ${it('arbol','tree','Árbol de la historia', `${(st.alts||[]).length} sendas · ${M.endings.length} finales`)}
          ${it('ficha','card','Fichas de personaje', '')}
          ${it('gallery','image','Imágenes y música', '')}
          ${it('howto','help','Cómo se juega', '')}
        </nav>
      </div>
      <aside class="mm-side">
        ${typeof lvCard==='function'?lvCard():''}
        <div class="mm-stats num"><div><b>${M.best}</b><span>mejor jornada</span></div><div><b>${M.unlocked}/${SAGAS.length}</b><span>sagas</span></div><div><b>${M.ngLevel||0}</b><span>campañas</span></div><div><b>${(st.g&&((st.g.S||0)+(st.g['S+']||0)))||0}</b><span>notas S</span></div></div>
        ${accountHTML('title')}
      </aside></section>`;
  },
  howto(){
    const M=meta(), rows=Object.keys(EFF).map(st=>{ const e=EFF[st]; const up=Object.keys(e).find(k=>e[k]>1), dn=Object.keys(e).find(k=>e[k]<1);
      return `<tr><td>${chip(st)}</td><td>×1,5 contra ${CLS[up]}</td><td>×0,75 contra ${CLS[dn]}</td></tr>`; }).join('');
    return `<div><h2>Cómo se juega</h2></div><div><button class="btn ghost" data-a="home">Volver</button></div>
      <ul class="rules">
        <li><b>Sagas encadenadas</b>Quince jornadas cada una. Al vencer al último jefe sigues con tu escuadrón.</li>
        <li><b>Elige la ruta</b>Combates, élites, eventos, mercaderes y campamentos. Cada zona acaba en un jefe.</li>
        <li><b>El gas manda</b>Nuca y habilidades gastan gas del escuadrón. Recuperas algo tras cada combate.</li>
        <li><b>Muerte permanente</b>Hasta 4 soldados. Si cae el último, la expedición termina.</li>
      </ul>
      <section class="panel"><span class="lbl">Qué estilo corta mejor a cada titán</span><div class="tablewrap"><table class="chart"><tbody>${rows}</tbody></table></div></section>
      <section class="panel"><div class="row" style="justify-content:space-between"><span class="lbl">Registro de los Nueve · ${M.nine.length} de 9</span></div>
        <div class="nine">${NINE.map(k=>`<div class="nc ${M.nine.includes(k)?'got':''}"><span class="art">${titanArt(POWERS[k].art)}</span><span>${M.nine.includes(k)?POWERS[k].n.replace(/^Titán (de )?/,''):'Sin descubrir'}</span></div>`).join('')}</div>
        <p class="dim" style="font-size:13px">Los cambiantes pueden soltar su poder al caer.</p></section>`;
  },
  sagas(){
    const u=meta().unlocked, saved=!!store.get('run');
    return `<div><h2>Elige la saga</h2><p class="dim" style="max-width:64ch">Una campaña recorre las cuatro seguidas. Las que ya hayas desbloqueado se pueden empezar directamente, con tres veteranos equipados.</p></div>
      ${saved?'<p class="note-s">Tienes una expedición a medias: empezar otra la sustituye.</p>':''}
      ${ngLevel() ? `<section class="panel ng"><span class="lbl">New Game+ · vuelta ${ngLevel()+1}</span>
        <p>Vuelve a empezar desde Trost con ventaja y con más peligro: sales con <b>dos reclutas</b>, llevas hasta <b>${relicsMax(ngLevel())} reliquia${relicsMax(ngLevel())>1?'s':''}</b> (poderes de los Nueve de campañas anteriores) y los enemigos son un <b>${12*ngLevel()} % más fuertes</b>. Encadenando vueltas es como se reúnen los Nueve.</p>
        <div class="row"><button class="btn" data-a="ngstart">Empezar la vuelta ${ngLevel()+1}</button><span class="lbl">Reliquias disponibles: ${(meta().relics||[]).length}</span></div></section>` : ''}
      <section class="panel"><span class="lbl">Dificultad</span>
        <div class="seg" role="radiogroup" aria-label="Dificultad">${Object.keys(DIFF).map(k=>{ const lk = k==='veterano' && typeof modeOpen==='function' && !modeOpen('vet'); return `<button class="btn sm ${CFG.diff===k?'':'ghost'}" role="radio" aria-checked="${CFG.diff===k}" data-a="diff" data-i="${k}" ${lk?`disabled title="Se abre en el escalón ${tierFor('modo','vet')} del Pase 1"`:''}>${DIFF[k].n}${lk?' · escalón '+tierFor('modo','vet'):''}</button>`; }).join('')}</div>
        <p class="dim" style="font-size:13.5px">${DIFF[CFG.diff]?DIFF[CFG.diff].d:DIFF.explorador.d} La expedición del día siempre es Explorador.</p></section>
      <div class="sagas">${SAGAS.map((g,i)=>`<button class="card saga ${i<u?'':'locked'}" data-a="saga" data-i="${i}" ${i<u?'':'disabled'}>
        <span class="thumb">${momentSVG(i*3)}${i<u?'':'<i class="lock" aria-hidden="true"></i>'}${sagaStamp(g.zones[2].boss)}</span><span class="n">SAGA ${i+1}${i<u?'':' · BLOQUEADA'}</span><h3>${g.n}</h3><p>${i<u?g.d:`Vence la saga ${i} para abrirla.`}</p>
        <ul>${g.zones.map(z=>`<li>${z.n}</li>`).join('')}</ul></button>`).join('')}</div>
      <span class="lbl">Sendas alternativas · ${altsSeen().length} de ${Object.keys(ALT_SAGAS).length} descubiertas</span>
      <div class="sagas alts">${Object.entries(ALT_SAGAS).map(([k,A])=>{ const seen=altsSeen().includes(k), ok=seen && A.slot<u;
        return `<button class="card saga alt ${seen?'':'veiled'}" data-a="saga" data-i="${A.slot}:${k}" ${ok?'':'disabled'}><span class="thumb">${momentSVG(A.zones[0].mo)}${seen?sagaStamp(A.zones[2].boss):''}</span><span class="n">${seen?`EN LUGAR DE LA SAGA ${A.slot+1}`:'SIN DESCUBRIR'}</span><h3>${seen?A.n:'???'}</h3><p>${seen?A.d:'Una senda que aún no has descubierto.'}</p>${seen?`<ul>${A.zones.map(z=>`<li>${z.n}</li>`).join('')}</ul>`:''}</button>`; }).join('')}</div>
      <div><button class="btn ghost" data-a="home">Volver</button></div>`;
  },
  starter(){
    const g=pendingSaga;
    if(g===0 && pendingNg){ const R=meta().relics||[], mx=relicsMax(ngLevel());
      return `<div><span class="lbl">New Game+ · vuelta ${ngLevel()+1} · Saga 1</span><h2>Elige a dos reclutas</h2><p class="dim">Salen juntos desde Trost. Los enemigos son un ${12*ngLevel()} % más fuertes.</p></div>
      <div class="row"><button class="btn" data-a="go" ${picked.length===2?'':'disabled'}>Partir · ${picked.length} de 2</button><button class="btn ghost" data-a="sagas">Volver</button></div>
      <div class="cards">${starters().map(id=>`<button class="card ${picked.includes(id)?'sel':''}" data-a="pickst" data-i="${id}" aria-pressed="${picked.includes(id)}">${solCard(id)}</button>`).join('')}</div>
      <section class="panel"><span class="lbl">Reliquias · ${relicPick.length} de ${mx}</span><p class="dim">Poderes de los Nueve que ganaste en campañas anteriores. Los lleva quien tenga hueco (Eren, hasta tres); el resto queda en la reserva para inyectarlo en un campamento.</p>
        <div class="row">${R.map(k=>`<button class="btn sm ${relicPick.includes(k)?'':'ghost'}" data-a="relic" data-i="${k}" aria-pressed="${relicPick.includes(k)}">${POWERS[k].n}</button>`).join('')||'<span class="dim">Aún no tienes reliquias.</span>'}</div></section>`; }
    if(g===0) return `<div class="saga-head"><span class="thumb">${momentSVG(0)}</span></div><div><span class="lbl">Saga 1 · ${SAGAS[0].n}</span><h2>Elige a tu primer recluta</h2></div>
      <div class="cards">${starters().map(id=>`<button class="card" data-a="start" data-i="${id}">${solCard(id)}</button>`).join('')}
        ${ACH.filter(a=>a.unlock && !starters().includes(a.unlock)).map(a=>`<div class="card locked"><div class="who">${portrait(a.unlock,true)}<div><h3>${ROSTER[a.unlock].n}</h3><span class="lbl">Bloqueado</span></div></div><p>Se desbloquea con el logro «${a.n}»: ${a.d}${typeof tierFor==='function' && tierFor('recluta', a.unlock)>0 ? ` O en el escalón ${tierFor('recluta', a.unlock)} del Pase 1.` : ''}</p></div>`).join('')}</div>`;
    const pool=Object.keys(ROSTER).filter(id=>ROSTER[id].sg<=g && (!ROSTER[id].story || codexSeen('s',id))).sort((a,b)=>(ROSTER[b].rare?1:0)-(ROSTER[a].rare?1:0));
    const n=startSize(g), npw=KIT_PW[g];
    return `<div class="saga-head"><span class="thumb">${momentSVG(pendingAlt?ALT_SAGAS[pendingAlt].zones[0].mo:g*3)}</span></div><div><span class="lbl">Saga ${g+1} · ${pendingAlt?ALT_SAGAS[pendingAlt].n+' (senda alternativa)':SAGAS[g].n}</span><h2>Forma un escuadrón de ${n===4?'cuatro':'tres'}</h2>
      <p class="dim">Veteranos de nivel ${startLvl(g)} con ${KITS[g]} mejoras al azar, como si vinieran de las sagas anteriores. Los soldados raros también están disponibles.</p></div>
      <div class="row"><button class="btn" data-a="go" ${picked.length===n?'':'disabled'}>Partir · ${picked.length} de ${n}</button><button class="btn ghost" data-a="sagas">Cambiar de saga</button></div>
      ${npw?`<section class="panel"><span class="lbl">Poderes de los Nueve · ${relicPick.length} de ${npw}</span><p class="dim">Elige con qué poderes salen (los que no elijas se sortean). Los lleva quien tenga hueco; Eren, hasta tres.</p>
        <div class="row">${MINOR.map(k=>`<button class="btn sm ${relicPick.includes(k)?'':'ghost'}" data-a="kitpw" data-i="${k}" aria-pressed="${relicPick.includes(k)}" title="${POWERS[k].d}">${POWERS[k].n.replace(/^Titán (de )?/,'')}</button>`).join('')}</div></section>`:''}
      <div class="cards">${pool.map(id=>`<button class="card ${picked.includes(id)?'sel':''}" data-a="pickst" data-i="${id}" aria-pressed="${picked.includes(id)}">${solCard(id, startLvl(g))}${ROSTER[id].rare?'<span class="lbl kind">Veterano raro</span>':''}</button>`).join('')}</div>`;
  },
  map(){
    const z=zoneOf(S.wave);
    const D = S.daily ? DAILY_MODS.find(x=>x.k===S.mod) : null;
    const unranked = S.diff==='recluta' ? `<p class="note-s">${S.runNote||'Modo Recluta: esta expedición no puntúa en la clasificación.'}</p>` : !cloudOn() || S.runId ? '' : CLOUD.user
      ? `<p class="note-s">${S.runNote || 'Esta expedición empezó sin sesión y no puntúa en la clasificación. La próxima, sí.'}</p>`
      : `<div class="acc out slim"><div class="acc-t"><b>Esta expedición no puntúa</b><span>Entra con Google o con tu correo: tu progreso se guarda en la nube y las próximas expediciones entran en la clasificación.</span></div>${loginBtns()}${CLOUD.msg?`<p class="acc-msg" role="status">${esc(CLOUD.msg)}</p>`:''}</div>`;
    const petate = S.petate ? `<section class="panel note"><span class="lbl">Petate de salida · elige un objeto</span><div class="row">${Object.keys(ITEMS).map(k=>`<button class="btn ghost sm" data-a="petate" data-i="${k}" title="${ITEMS[k].d}">${ITEMS[k].n}</button>`).join('')}</div></section>` : '';
    return `<div class="cg mg"><div class="cg-l">${unranked}${petate}${D?`<section class="panel daily"><span class="lbl">Expedición del día · ${S.daily}</span><p><b>${D.n}.</b> ${D.d} Mismo mapa, titanes y recompensas para todos; termina al acabar la saga 1.</p></section>`:''}<div>${S.diff&&S.diff!=='explorador'||S.ng?`<span class="lbl">${S.diff&&S.diff!=='explorador'?diffOf().n:''}${S.ng?` Vuelta ${S.ng+1}`:''}</span>`:''}<h2>${z.n}</h2><p class="dim">${S.map.pos?'Elige el siguiente paso de la ruta.':'Elige por dónde entra el escuadrón.'} ${codexSeen('t',z.boss)?`Al fondo espera el ${TITANS[z.boss].n}.`:'Al fondo espera un cambiante.'}${BOSS_PW[z.boss] && !(BOSS_PW[z.boss] in S.pw) ? ` Puede soltar ${codexSeen('t',z.boss)?'el poder del '+POWERS[BOSS_PW[z.boss]].n:'uno de los Nueve'}: <b class="num" style="color:var(--gold)">${Math.round(dropP()*100)} %</b>.` : ''}</p></div>
      ${S.map.wx && S.map.wx!=='despejado' ? `<div class="wxbar wx-${S.map.wx}"><span class="lbl">Condición de la zona</span><b>${WX[S.map.wx].n}</b><span>${WX[S.map.wx].d}</span></div>` : ''}
      <div class="mapwrap">${mapSVG()}</div>
      <details class="legend-d"><summary>Qué es cada casilla</summary><ul class="legend">${Object.keys(NODE).map(k=>`<li><b>${NODE[k].n}.</b> ${NODE[k].d}</li>`).join('')}</ul></details></div>
      <div class="cg-r"><span class="lbl">Tu escuadrón</span>${squadHTML()}${relicsHTML()}</div></div>`;
  },
  combat(){
    const a=C.active, P=C.pending, canAct = a && !C.busy, ph=-((performance.now()/1000)%4.2).toFixed(2);
    const plates=[]; const tit = C.titans.map((t,i)=>{
      const pk = canAct && P && P.tgt==='enemy' && t.hp>0;
      const e = a && t.hp>0 ? eff(a,t) : 1;
      const st=[t.plate>0&&'Coraza',t.exposed>0&&'Expuesto',t.mark>0&&'Marcado',t.stun>0&&'Derribado',t.blind>0&&'Cegado',t.hard>0&&'Endurecido',!(t.stun>0||t.blind>0)&&t.alert>0&&`Alerta ${t.alert}`].filter(Boolean).join(' · ');
      const cl=['titan','z-'+t.cls, t.boss&&'boss', t.phase&&'enraged', t.hp<=0&&'dead', pk&&'pick'].filter(Boolean).join(' ');
      const prev=(()=>{ const e = canAct && CFG.preview && estimate(a, t, P ? P.kind : 'cut'); return e ? `<span class="prev ${e.kill?'kill':''}">${P?'':'Corte '}≈ ${e.lo===e.hi?e.lo:e.lo+'–'+e.hi}${e.kill?' · abate':''}</span>` : ''; })();
      const sp = t.special && t.special!=='all' ? ` · ${t.special}` : '';
      const intent = CFG.intent && t.hp>0 && t.intent ? `<span class="int ${t.intent==='all'||t.special?'all':''}" title="${AI_TXT[aiOf(t)]}">${t.intent==='all' ? (t.m.txt||'Embestida').toLowerCase().replace(/^./,c=>c.toUpperCase())+': todo el escuadrón' : `Ataca a: ${esc(ROSTER[t.intent].n)}${sp}`}</span>` : '';
      // ficha del enemigo (caja a lo Pokémon, arriba a la izquierda); también sirve para elegirlo como objetivo
      plates.push(`<${pk?'button':'div'} class="plate ${t.boss?'boss':''} ${t.hp<=0?'dead':''} ${pk?'pick':''}" data-u="t${i}" ${pk?`data-a="titan" data-i="${i}"`:''}>
        <span class="row" style="gap:6px;justify-content:space-between"><h3>${t.n}</h3>${e!==1?`<span class="eff num ${e>1?'up':'down'}">×${String(e).replace('.',',')}</span>`:''}</span>
        <span class="row" style="gap:6px"><span class="chip c-cls">${CLS[t.cls]}</span><span class="lbl num hpn">${t.hp} / ${t.max} PV</span></span>
        <span class="bar"><i style="width:${t.hp/t.max*100}%"></i></span>${t.plate>0?`<span class="bar plate" title="Coraza"><i style="width:${t.plate/Math.round(t.max*t.m.coraza)*100}%"></i></span>`:''}
        ${st?`<span class="st">${st}</span>`:''}${prev}${intent}</${pk?'button':'div'}>`);
      const inner=`<span class="art" style="animation-delay:${ph-i*.7}s">${titanArt(t.id)}</span>`;
      return pk ? `<button class="${cl}" data-u="t${i}" data-a="titan" data-i="${i}" aria-label="${t.n}">${inner}</button>` : `<div class="${cl}" data-u="t${i}">${inner}</div>`;
    }).join('');
    let orders='', hint='Los titanes se mueven…';
    if(canAct){
      const R=ROSTER[a.id], sk=R.sk, cd=C.cd[a.id]||0, skOff = S.gas<sk.gas || (sk.once&&C.used[a.id]) || cd>0;
      const sel=k=>P&&P.kind===k?'sel':'';
      orders=`<button class="order ${sel('cut')}" data-a="order" data-i="cut" title="Ataque básico. No gasta gas."><b>Corte</b><span>Ataque básico. No gasta gas.</span></button>
        <button class="order ${sel('nape')}" data-a="order" data-i="nape" ${S.gas<1?'disabled':''}><b>${liveT().every(isHuman)?'Disparo certero':'A la nuca'} · 1 gas</b><span>Daño ×1,6. Remata ${liveT().every(isHuman)?'a soldados y máquinas':'a titanes normales'} por debajo del 25 %.</span></button>
        <button class="order ${sel('skill')}" data-a="order" data-i="skill" ${skOff?'disabled':''}><b>${sk.n}${sk.gas?` · ${sk.gas} gas`:''}${cd>0?` · recarga ${cd}`:''}</b><span>${cd>0?`Disponible dentro de ${cd} turno${cd>1?'s':''}. `:''}${sk.d}${sk.cd&&!cd?` Recarga: ${sk.cd} turno${sk.cd>1?'s':''}.`:''}</span></button>`
        + pwOf(a.id).map(k=>`<button class="order pw ${sel('pw:'+k)}" data-a="order" data-i="pw:${k}" ${C.usedPw[k]?'disabled':''}><b>Transformarse · ${POWERS[k].n.replace(/^Titán (de )?/,'')}</b><span>${C.usedPw[k]?'Ya usado en este combate.':POWERS[k].d}</span></button>`).join('');
      if((S.items||[]).length) orders += `<div class="items"><span class="lbl">Objetos${C.itemUsed?' · ya usaste uno este turno':' · acción libre'}</span>${S.items.map((k,j)=>`<button class="btn ghost sm ${sel('it:'+k)}" data-a="order" data-i="it:${k}" title="${ITEMS[k].d}" ${C.itemUsed?'disabled':''}>${ITEMS[k].n}</button>`).join('')}</div>`;
      hint = P ? (P.tgt==='enemy'?'Elige un titán.':'Elige a un compañero.') : `Turno de ${R.n}.`;
    }
    const heroes = S.squad.map(s=>{ const R=ROSTER[s.id], f=C.fx[s.id]||{}, pk = canAct && P && P.tgt==='ally' && s.hp>0;
      const pic = f.formT>0 ? `<span class="pt tf">${titanArt(POWERS[f.form].art)}</span>` : portrait(s.id);
      const cl=['spr', s.hp<=0&&'dead', C.active===s&&'active', pk&&'pick', f.stun>0&&'stunned', f.guard>0&&'guard'].filter(Boolean).join(' ');
      const inner=`${pic}<i class="sh"></i><span class="nm">${R.n}</span>`;
      return pk ? `<button class="${cl}" data-u="s${s.id}" data-a="sol" data-i="${s.id}" aria-label="${R.n}">${inner}</button>` : `<div class="${cl}" data-u="s${s.id}">${inner}</div>`; }).join('');
    const par=parOf(curNode().t, C.titans.length), rn=Math.max(1,C.rounds);
    return `<div class="cg"><div class="cg-l"><div class="stage poke ${C.titans.length>1?'multi':''}"><span class="rnd lbl num ${rn>par*1.3?'late':rn<=par?'ok':''}" title="Rondas de este combate y par para la nota">Ronda ${rn} · par ${par.toFixed(1).replace('.',',')}</span><div class="stchips">${wxNow()!=='despejado'?`<span class="wxc lbl wx-${wxNow()}" title="${WX[wxNow()].d}">${WX[wxNow()].n}</span>`:''}${C.reto?`<span class="reto lbl" title="Reto opcional: +${RETO_COINS} monedas">Reto · ${RETOS[C.reto].n}</span>`:''}</div><div class="titans">${tit}</div><div class="plates ${C.titans.length>1?'multi':''}">${plates.join('')}</div><div class="heroes">${heroes}</div></div>
      <div class="log" id="log" aria-live="polite">${C.log.map(l=>`<div>${l}</div>`).join('')}</div></div>
      <div class="cg-r">${squadHTML(canAct && P && P.tgt==='ally' ? 'ally' : '')}
      <div class="dock"><div class="hint lbl"><span id="hint">${hint}</span><button class="btn ghost sm" data-a="speed" title="Velocidad de las animaciones">Animación: ${ANIM[CFG.anim].n}</button></div>
      <div class="orders" id="orders">${orders}</div></div>${relicsHTML()}</div></div>`;
  },
  reward(){
    const t=curNode().t, nx=SAGAS[sagaIx(S.wave)+1];
    const title = S.sagaDone?'Saga completada':t==='b'?'Cambiante derrotado':t==='e'?'Élite abatida':'Zona despejada';
    const sfx = S.sagaDone?'¡Saga!':t==='b'?'¡Abatido!':t==='e'?'¡Élite!':'¡Despejado!';
    const kind = r => r.t==='rec'?'rec':r.t==='item'?'it':'up';
    return `${hero(S.sagaDone?sagaLbl(S.wave):zoneOf(S.wave).n, title, `${S.sagaDone&&nx?`Se abre la saga ${sagaIx(S.wave)+2}, «${nx.n}». El escuadrón sigue adelante con el depósito lleno. `:'Los supervivientes suben de nivel. '}${S.picks>1?`Elige ${S.picks} recompensas.`:'Elige una recompensa.'}`, {sfx, cls:t==='b'||S.sagaDone?'big':''})}
      ${gradeHTML(S.lastGrade)}${typeof xpStrip==='function'?xpStrip(S.lastGrade):''}${canReroll()?`<div class="row"><button class="btn ghost sm" data-a="reroll">Relanzar recompensas · una vez por saga</button></div>`:''}
      ${S.note?`<section class="panel note"><p>${S.note}</p></section>`:''}
      <span class="lbl sect">Recompensa</span>
      <div class="cards chs">${S.rewards.map((r,i)=> `<button class="card ch k-${kind(r)}" data-a="reward" data-i="${i}" data-n="${i+1}">${chN(i)}${r.t==='rec'
        ? `<span class="lbl kind">Recluta${ROSTER[r.id].rare?' veterano':''} · se une al nivel ${joinLvl()}</span>${solCard(r.id, joinLvl())}`
        : r.t==='item' ? `<span class="ch-ic">${UIC.bag||''}</span><span class="lbl kind">Objeto · un solo uso</span><h3>${ITEMS[r.id].n}</h3><p>${ITEMS[r.id].d}</p><span class="lbl ch-ft">Llevas ${(S.items||[]).length} de ${itemCap()}</span>`
        : `<span class="ch-ic">${UIC.up||UIC.star||''}</span><span class="lbl kind">Mejora</span><h3>${UPG[r.id].n}</h3><p>${UPG[r.id].d}</p>`}</button>`).join('')}</div>
      <span class="lbl sect">Tu escuadrón</span>${squadHTML()}${relicsHTML()}`;
  },
  replace(){
    return `<div><h2>El escuadrón está completo</h2>
      <p class="dim">${ROSTER[pendingRec.id].n} ocupa el puesto de quien elijas. El relevado vuelve a las murallas.</p></div>
      ${squadHTML('swap')}<div><button class="btn ghost" data-a="back">Volver a las recompensas</button></div>`;
  },
  shop(){
    const O=S.shop.offers, c=S.coins||0, full=(S.items||[]).length>=itemCap();
    return `${hero('Mercader', 'Un carro en el cruce', `Un comerciante del interior vende lo que le sobra a la Guarnición. Las monedas se ganan con la nota de cada combate.${owns('amigo')?' Te hace un 20 % de descuento.':''}`, {cls:'shop', side:`<div class="sh-side"><span class="lbl">Tu bolsa</span><b class="num coin">${c}</b><span class="lbl">monedas</span></div>`})}
      <div class="cards chs">${O.map((o,i)=>{ const isIt=o.k.startsWith('it:'), off=o.sold || c<o.p || (isIt&&full);
        return `<button class="card ch shopc ${isIt?'k-it':'k-up'} ${o.sold?'sold':''}" data-a="buy" data-i="${i}" data-n="${i+1}" ${off?'disabled':''}>${chN(i)}<span class="lbl kind">${o.sold?'Comprado':isIt?'Objeto':'Servicio'}</span><h3>${o.n}</h3><p>${o.d}${o.got?` <b>${o.got}</b>.`:''}${isIt&&full&&!o.sold?' <b>Llevas el máximo de objetos.</b>':''}</p><span class="price num ${c<o.p&&!o.sold?'short':''}">${o.sold?'Vendido':o.p+' monedas'}</span></button>`; }).join('')}</div>
      <div><button class="btn" data-a="shopleave">Seguir la ruta</button></div>
      <span class="lbl sect">Tu escuadrón</span>${squadHTML()}${relicsHTML()}`;
  },
  camp(){
    const ic=['heart','up','gas'], inj = NINE.some(k=>S.pw[k]==='reserva') && S.squad.some(hasRoom);
    return `${hero('Campamento', 'Una noche junto al fuego', 'Hay tiempo para una sola cosa antes de que amanezca.', {cls:'camp', art:`${zoneArt()}<i class="fire"></i><i class="embers"></i>`})}
      <div class="cards chs">${CAMP.map((c,i)=>`<button class="card ch k-camp" data-a="camp" data-i="${i}" data-n="${i+1}">${chN(i)}<span class="ch-ic">${UIC[ic[i]]||''}</span><h3>${c.n}</h3><p>${c.d}</p></button>`).join('')}
      ${inj ? `<button class="card ch k-pw" data-a="inject" data-n="${CAMP.length+1}">${chN(CAMP.length)}<span class="lbl kind">Reserva</span><h3>Inyectar un suero</h3><p>Un soldado hereda el poder del ${POWERS[NINE.find(k=>S.pw[k]==='reserva')].n}.</p></button>` : ''}</div>
      <span class="lbl sect">Tu escuadrón</span>${squadHTML()}`;
  },
  event(){
    const E=EVENTS[S.pend.i];
    const dice = S.pend.res && S.pend.dice && S.pend.dice.length && CFG.dice ? `<div class="evdice">${S.pend.dice.map(d=>`<div class="dz"><div class="d20 ev ${d.r===20?'crit':d.r===1?'bad':d.ok?'ok':'fail'}${S.pend.diceShown?' done land':''}" data-r="${d.r}">${D20}<b>${S.pend.diceShown?d.r:'?'}</b>${d.b?`<small>+${d.b}</small>`:''}</div>
      <div class="dres${S.pend.diceShown?' show':''}"><span class="lbl">${SKILLS[d.k]}${d.who?' · '+ROSTER[d.who].n:''}</span><b>${d.r}${d.b?' + '+d.b+' = '+(d.r+d.b):''} contra ${d.dc}</b><span class="${d.ok?'okt':'kot'}">${d.r===20?'¡20 natural! ':d.r===1?'¡Pifia! ':''}${d.ok?'Éxito':'Fallo'}</span></div></div>`).join('')}</div>` : '';
    return `${hero('Evento', E.n, '', {cls:'ev'})}${dice}<section class="caption ${S.pend.res?'res':''}"><p>${S.pend.res||E.d}</p></section>
      ${S.pend.res ? `<div><button class="btn ch" data-a="evok" data-n="1">Seguir la ruta</button></div>`
        : `<div class="cards chs">${E.o.map((o,i)=>`<button class="card ch k-ev" data-a="evopt" data-i="${i}" data-n="${i+1}">${chN(i)}<h3>${o.l}</h3><p>${chk(o.d)}</p></button>`).join('')}</div>`}
      <span class="lbl sect">Tu escuadrón</span>${squadHTML()}`;
  },
  gallery(){
    const fitCtl = k => CUSTOM[k] ? `<div class="fit" role="group" aria-label="Encuadre de ${k}"><span class="lbl">Encuadre${k.endsWith('@a')?' adulto':''}</span>${[['out','−','Alejar'],['in','+','Acercar'],['l','←','Mover a la izquierda'],['r','→','Mover a la derecha'],['u','↑','Subir'],['d','↓','Bajar'],['reset','↺','Restablecer']].map(([o,t,l])=>`<button class="btn ghost sm" data-a="fit" data-i="${k}|${o}" aria-label="${l}" title="${l}">${t}</button>`).join('')}</div>` : '';
    const cell=(id,name,pic)=>`<div class="card">${pic}<b>${name}</b>${NAMES[id]?`<span class="dim" style="font-size:12px">Original: ${(ROSTER[id]||TITANS[id]).n0}</span>`:''}${fitCtl(id)}${ROSTER[id]&&CUSTOM[id+'@a']?`<span class="pt lg"><img src="${CUSTOM[id+'@a']}" alt="" style="${fitStyle(id+'@a')}"></span>${fitCtl(id+'@a')}`:''}
      <label class="btn ghost sm file" for="up-${id}" tabindex="0">${CUSTOM[id]?'Cambiar imagen':'Subir imagen'}</label><input class="vh" type="file" accept="image/*" id="up-${id}" data-up="${id}">
      ${CUSTOM[id]?`<button class="btn ghost sm" data-a="rm" data-i="${id}">Quitar</button>`:''}
      ${ROSTER[id]?`<label class="btn ghost sm file" for="up-${id}-a" tabindex="0">${CUSTOM[id+'@a']?'Cambiar adulta':'Versión adulta'}</label><input class="vh" type="file" accept="image/*" id="up-${id}-a" data-up="${id}@a">${CUSTOM[id+'@a']?`<button class="btn ghost sm" data-a="rm" data-i="${id}@a">Quitar adulta</button>`:''}`:''}</div>`;
    return `<div><h2>Tus imágenes y música</h2><p class="dim" style="max-width:66ch">Importa un paquete (.json de imágenes, de nombres o de música) o carga tus archivos uno a uno, y el juego los usará en lugar de los emblemas, los dibujos de titanes y la música sintetizada. Cada soldado admite una versión adulta, que se usa a partir de la saga 4. ${cloudOn() && CLOUD.user ? 'Se guardan en este navegador y en tu cuenta, que es privada: al entrar desde otro dispositivo se cargan solas.' : cloudOn() ? 'Se guardan en este navegador. Si entras con Google, también en tu cuenta privada y se cargan solas en otros dispositivos.' : 'Se guardan solo en este navegador.'}</p></div>
      <div class="row"><button class="btn ghost" data-a="home">Volver</button>
        <label class="btn file" for="pack" tabindex="0">Importar paquete (.json)</label><input class="vh" type="file" accept=".json,application/json" id="pack" data-pack="1">
        ${Object.keys(CUSTOM).length?`<button class="btn ghost" data-a="rmall">Quitar todas (${Object.keys(CUSTOM).length})</button>`:''}
        ${Object.keys(NAMES).length?`<button class="btn ghost" data-a="rmnames">Nombres originales (${Object.keys(NAMES).length} cambiados)</button>`:''}
        ${location.protocol.startsWith('http')?`<button class="btn ghost" data-a="pespack" title="Nombres de parodia e iconos propios para los 18 soldados">Paquete «sin licencia»</button>`:''}
        ${packMsg?`<span class="lbl" style="color:var(--gold)">${packMsg}</span>`:''}</div>
      <div class="row" style="justify-content:space-between"><span class="lbl">Música</span><label class="btn ghost sm file" for="pack" tabindex="0">Importar música (.json)</label></div>${packMsg?`<span class="lbl" style="color:var(--gold)" role="status">${esc(packMsg)}</span>`:''}${auMsg?`<span class="lbl" style="color:var(--gold)" role="status">${esc(auMsg)}</span>`:''}<div class="gal">${Object.keys(TRACKS).map(k=>`<div class="card slot"><b>${TRACKS[k]}</b>
        <span class="dim" style="font-size:13px;overflow-wrap:anywhere">${MY[k]?esc(MY[k].name.replace(/_/g,' ').replace(/\.[a-z0-9]+$/i,'')):'Música del juego'}</span>
        <label class="btn ghost sm file" for="au-${k}" tabindex="0">${MY[k]?'Cambiar audio':'Cargar audio'}</label><input class="vh" type="file" accept="audio/*" id="au-${k}" data-au="${k}">
        ${MY[k]?`<button class="btn ghost sm" data-a="rmau" data-i="${k}">Quitar</button>`:''}</div>`).join('')}</div>
      <span class="lbl">Soldados</span><div class="gal">${Object.keys(ROSTER).map(id=>cell(id,ROSTER[id].n,portrait(id,true))).join('')}</div>
      <span class="lbl">Titanes y enemigos</span><div class="gal">${Object.keys(TITANS).map(id=>cell(id,TITANS[id].n,`<span class="art">${titanArt(id)}</span>`)).join('')}</div>`;
  },
  end(won){
    const f=S.fallen.map(id=>`<li>${ROSTER[id].n}</li>`).join('');
    if(S.daily) return `<section class="hero"><div class="txt"><span class="lbl">Expedición del día · ${S.daily}</span>
      <h1>${S.dailyDone?'Trost <em>resiste</em>':'Nadie <em>regresa</em>'}</h1>
      <p>${S.dailyDone?'Has completado la saga 1 de hoy.':`Caída en la jornada ${dayOf(S.wave)} de ${PER}.`} Puntuación: <b class="num">${S.dailyScore}</b> (100 por jornada superada y 500 por terminar).${cloudOn() && !S.runId ? ' Esta expedición no puntúa en la clasificación: no había sesión al empezar.' : ''}</p>
      <div class="row">${cloudOn()&&CLOUD.user?'<button class="btn" data-a="board" data-i="hoy">Ver la clasificación de hoy</button>':''}<button class="btn ghost" data-a="home">Portada</button></div></div>
      <div class="peek">${titanFig(TITANS.col.a)}</div></section>${f?`<section class="panel"><span class="lbl">Entregaron su corazón</span><ul class="fallen">${f}</ul></section>`:''}`;
    return `<section class="hero"><div class="txt"><span class="lbl">Parte de expedición</span>
      <h1>${won?(S.ending==='nueve'?'Los <em>Nueve</em>':S.ending==='coordenada'?'La <em>Coordenada</em>':S.ending==='paradis'?'Paradis <em>resiste</em>':'El Retumbar <em>se detiene</em>'):'Nadie <em>regresa</em>'}</h1>
      <p>${won?`${ENDINGS[S.ending].d} ${S.erenFell?'Eren se volvió contra vosotros y lo habéis detenido. ':''}${S.squad.map(nm).join(', ')} ${S.squad.length>1?'siguen':'sigue'} en pie tras ${TOTAL} jornadas. Poderes reunidos: ${owned().length} de 9.`:`La expedición acaba en la saga ${sagaIx(S.wave)+1}, «${sagaOf(S.wave).n}»: jornada ${dayOf(S.wave)} de ${PER}, en ${zoneOf(S.wave).n}.`}</p>
      ${won?`<p class="note-s"><b>New Game+ desbloqueado.</b> Vuelta ${(S.ng||0)+2}: dos reclutas de salida, hasta ${relicsMax((S.ng||0)+1)} reliquia${relicsMax((S.ng||0)+1)>1?'s':''} de los Nueve y enemigos un ${12*((S.ng||0)+1)} % más fuertes. Está en «Nueva expedición».</p>`:''}
      <div class="row"><button class="btn" data-a="sagas">Nueva expedición</button><button class="btn ghost" data-a="home">Portada</button></div></div>
      <div class="peek">${titanFig(won?(S.ending==='paradis'?TITANS.mar.a:TITANS.fun.a):TITANS.col.a)}</div></section>
      ${won && (S.epilogues||[]).length ? `<section class="panel epis"><span class="lbl">Epílogos</span>${S.epilogues.map(k=>EPILOGUES.find(e=>e.k===k)).filter(Boolean).map(e=>`<div class="epi">${e.who?portrait(e.who,true):''}<div><b>${e.n}</b><p>${e.d}</p></div></div>`).join('')}</section>` : ''}
      ${S.xpRun?`<section class="panel xprun"><span class="lbl">Experiencia de esta expedición</span><b class="sfx">+${S.xpRun.toLocaleString('es-ES')} XP</b>${typeof lvCard==='function'?lvCard():''}</section>`:''}
      ${won?gradeHTML(S.lastGrade):''}
      ${insigniasEarned()-(S.ins0||0)>0?`<section class="panel note"><p><b>+${insigniasEarned()-(S.ins0||0)} insignias</b> en esta expedición. Tienes ${insignias()} para gastar en la Intendencia.</p><div class="row"><button class="btn ghost sm" data-a="intendencia">Ir a la Intendencia</button></div></section>`:''}
      ${cloudOn()&&!CLOUD.user?accountHTML('end'):''}
      ${f?`<section class="panel"><span class="lbl">Entregaron su corazón</span><ul class="fallen">${f}</ul></section>`:''}`;
  },
  scene(){
    const sc=S.scene, lines=a=>a.map((l,i)=>`<p class="ln" style="animation-delay:${i*.7}s">${l}</p>`).join('');
    let n=0; const num = h => h.replace(/<button class="(card[^"]*)" data-a="scn"/g, (m,c)=>{ n++; return `<button class="${c} ch" data-n="${n}" data-a="scn"`; }).replace(/(<button class="card[^"]* ch" data-n="(\d+)"[^>]*>)/g, (m,b,k)=>b+chN(+k-1));
    const wrap=(lbl,title,art,body,act)=>`<section class="scene"><i class="sl"></i><div class="sart">${art}</div><div class="stx"><span class="lbl">${lbl}</span><h2>${title}</h2>${body}</div></section>${num(act).replace('class="cards"','class="cards chs"')}<span class="lbl sect">Tu escuadrón</span>${squadHTML()}${relicsHTML()}`;
    if(sc.k==='betray'){ const id=sc.id;
      return wrap('Traición', id==='eren'?'El Retumbar':`${ROSTER[id].n} se aparta del escuadrón`, titanArt(sc.boss), lines(BETRAY[id].pre),
        `<div><button class="btn" data-a="scn" data-i="go">Desenvainar</button></div>`); }
    if(sc.k==='spare'){ const B=BETRAY[sc.id], k=B.pw, have = k in S.pw && S.pw[k]!=='reserva';
      return wrap('Tras el combate', `${ROSTER[sc.id].n} sigue vivo`, portrait(sc.id,true), `<p>${B.post}</p>`,
        `<div class="cards"><button class="card" data-a="scn" data-i="rescue"><h3>Sacarlo y perdonarlo</h3><p>Vuelve al escuadrón con el 30 % de sus PV y no volverá a traicionaros.</p></button>
         <button class="card" data-a="scn" data-i="take"><h3>Quitarle el poder</h3><p>${have?'Ya tenéis ese poder. ':`El escuadrón hereda el ${POWERS[k].n}. `}${ROSTER[sc.id].n} queda preso y no vuelve.</p></button></div>`); }
    if(sc.k==='duelo'){ const names=sc.ids.map(id=>ROSTER[id].n), heirs=sc.heirs.filter(([id])=>has(id));
      return wrap('Entregaron su corazón', names.join(', '), `<div class="row">${sc.ids.map(id=>portrait(id,true)).join('')}</div>`,
        `<p>${names.length>1?'No vuelven':'No vuelve'} del combate. El escuadrón ${names.length>1?'los entierra':'lo entierra'} junto al camino antes de seguir.</p>${heirs.length?`<p class="dim">${heirs.map(([id,d])=>`${ROSTER[id].n} no deja de mirar la tumba de ${ROSTER[d].n}.`).join(' ')}</p>`:''}`,
        `<div class="cards">${heirs.length?`<button class="card" data-a="scn" data-i="vow"><h3>Jurar por ${names.length>1?'ellos':names[0]}</h3><p>${heirs.map(([id])=>ROSTER[id].n).join(' y ')} ${heirs.length>1?'suben':'sube'} 2 niveles y ${heirs.length>1?'hacen':'hace'} un 10 % más de daño el resto de la expedición.</p></button>`:''}
         <button class="card" data-a="scn" data-i="seguir"><h3>Seguir adelante</h3><p>Recuperáis el aliento: +3 de gas y un 10 % de PV para todos.</p></button></div>`); }
    if(sc.k==='story'){ const T=STORY_SCENES[sc.id];
      return wrap('Tras el combate', T.title, T.art(), `<p>${T.body}</p>`,
        `<div class="cards">${T.o.map((o,i)=>{ const ok=!o.ok||o.ok(); return `<button class="card" data-a="scn" data-i="st:${i}" ${ok?'':'disabled'}><h3>${o.l}</h3><p>${o.d}${ok?'':' <b>No hay hueco en el escuadrón.</b>'}</p></button>`; }).join('')}</div>`); }
    if(sc.k==='cross'){ const A=ALT_SAGAS[sc.alt], C0=SAGAS[A.slot];
      return wrap('Encrucijada', 'Dos caminos', `<span class="art">${momentSVG(A.zones[0].mo)}</span>`,
        `<p>Lo que habéis hecho hasta aquí abre otra senda. La saga ${A.slot+1} puede ser la de siempre o una distinta, con otros enemigos, otros jefes y otro final.</p>`,
        `<div class="cards"><button class="card" data-a="scn" data-i="canon"><span class="lbl kind">Saga ${A.slot+1}</span><h3>${C0.n}</h3><p>${C0.d}</p></button>
         <button class="card alt" data-a="scn" data-i="alt"><span class="lbl kind" style="color:var(--gold)">Senda alternativa</span><h3>${A.n}</h3><p>${A.d}</p></button></div>`); }
    if(sc.k==='drop'){ const P=POWERS[sc.p];
      const why = {boss:`El ${TITANS[sc.boss]?TITANS[sc.boss].n:'cambiante'} se desploma. En la nuca hay un portador inconsciente y, en su cinturón, una jeringa con su poder.`,
        elite:'Entre los restos de la élite aparece un estuche de Marley con una jeringa intacta.', event:'La jeringa sigue entera. Alguien tiene que llevar ese poder.',
        betray:'El poder del cambiante está en vuestras manos.', camp:'Junto al fuego, sacáis el suero que guardabais.'}[sc.src]||'';
      const can=S.squad.filter(hasRoom);
      return wrap('Poder de los Nueve', P.n, `<span class="art">${titanArt(P.art)}</span>`, `<p>${why}</p><p class="dim">Al transformarse: ${P.d} Quien lo herede gana un 25 % de PV máximos. Cada soldado lleva un poder; Eren, hasta tres.</p>`,
        `<div class="cards">${can.map(s=>`<button class="card" data-a="scn" data-i="give:${s.id}"><div class="who">${portrait(s.id,true)}<div><h3>${ROSTER[s.id].n}</h3><span class="lbl num">Nv ${s.lvl} · ${pwOf(s.id).length} de ${cap(s)} poderes</span></div></div><p>Hereda el ${P.n}.</p></button>`).join('')}
         <button class="card" data-a="scn" data-i="keep"><h3>Guardarlo en la reserva</h3><p>Cuenta para el registro y se puede inyectar más tarde en un campamento.</p></button></div>`); }
    return '';
  },
  board(){
    if(CLOUD.tab==='jefes') return V.bossBoard();
    const B=CLOUD.board, me=CLOUD.user&&CLOUD.user.id, hoy=CLOUD.tab==='hoy';
    return `<div><h2>Clasificación</h2><p class="dim">${hoy?`Expedición del día ${today()}: misma semilla para todos, un intento.`:'Jornadas alcanzadas, finales conseguidos y poderes del registro.'} Solo la ven los jugadores con sesión.</p></div>
      <div class="row"><button class="btn ${hoy?'ghost':''} sm" data-a="board" data-i="general">General</button><button class="btn ${hoy?'':'ghost'} sm" data-a="board" data-i="hoy">Hoy</button><button class="btn ghost sm" data-a="board" data-i="jefes">Jefes</button></div>
      <div class="row"><button class="btn ghost" data-a="home">Volver</button>
        <label class="lbl" for="nm">Tu nombre</label><input id="nm" maxlength="32" value="${esc(CLOUD.name)}" style="background:var(--stone-2);color:var(--bone);border:1px solid var(--stone-4);padding:8px;font:inherit">
        <button class="btn ghost sm" data-a="rename">Guardar nombre</button>${CLOUD.msg?`<span class="lbl" style="color:var(--gold)">${esc(CLOUD.msg)}</span>`:''}</div>
      ${hoy ? `<section class="panel"><div class="tablewrap"><table class="chart num"><thead><tr><td class="lbl">#</td><td class="lbl">Jugador</td><td class="lbl">Puntos</td><td class="lbl">Jornadas</td></tr></thead><tbody>
      ${!B ? '<tr><td colspan="4">Cargando…</td></tr>' : !B.length ? '<tr><td colspan="4">Nadie ha terminado la expedición de hoy todavía.</td></tr>'
        : B.map((r,i)=>`<tr style="${r.user_id===me?'color:var(--gold)':''}"><td>${i+1}</td><td>${esc(r.display_name)}</td><td>${r.score}</td><td>${r.wave} / ${PER}</td></tr>`).join('')}</tbody></table></div></section>` : `
      <p class="dim" style="font-size:13px">${CLOUD.season?`<b style="color:var(--gold)">${esc(CLOUD.season.name)}</b> · solo cuentan las expediciones empezadas desde el ${new Date(CLOUD.season.started_at).toLocaleDateString('es-ES')}. `:''}Puntos = jornadas × 1,25 en Veterano × (1 + 0,1 por vuelta de New Game+). Recluta no puntúa.</p>
      <section class="panel"><div class="tablewrap"><table class="chart num"><thead><tr><td class="lbl">#</td><td class="lbl">Jugador</td><td class="lbl">Puntos</td><td class="lbl">Mejor expedición</td><td class="lbl">Finales</td><td class="lbl">Los Nueve</td></tr></thead><tbody>
      ${!B ? '<tr><td colspan="6">Cargando…</td></tr>' : !B.length ? '<tr><td colspan="6">Aún no hay nadie. La primera expedición marca el listón.</td></tr>'
        : B.map((r,i)=>`<tr style="${r.user_id===me?'color:var(--gold)':''}"><td>${i+1}</td><td>${r.xp!=null&&typeof lvBadge==='function'?lvBadge(r.xp,'xs')+' ':''}${esc(r.display_name)}${r.ng_level?` <span class="chip pwc" title="Campañas completadas">NG+${r.ng_level}</span>`:''}</td><td><b>${r.score}</b></td><td>${r.best} / ${TOTAL}${r.diff==='veterano'?' <span class="chip" style="color:var(--blood-hi)">Veterano</span>':''}${r.ng?` <span class="chip pwc">Vuelta ${r.ng+1}</span>`:''}</td><td>${r.endings} / ${Object.keys(ENDINGS).length}</td><td>${r.nine} / 9</td></tr>`).join('')}
      </tbody></table></div></section>`}`;
  },
  codex(){
    const M=meta(), c=M.codex||{t:{},s:{}};
    return `<div><h2>Logros y códice</h2><p class="dim">${M.ach.length} de ${ACH.length} logros. Algunos desbloquean reclutas iniciales para la saga 1.</p></div>
      <div class="row"><button class="btn ghost" data-a="home">Volver</button><button class="btn ghost" data-a="ficha">Fichas de personaje</button><button class="btn ghost" data-a="comps" data-i="mine">Escuadrones</button><button class="btn ghost" data-a="arbol">Árbol de la historia</button></div>
      <div class="achs">${ACH.map(a=>{ const got=M.ach.includes(a.k); return `<div class="ach ${got?'got':''}"><b>${a.n}</b><span>${a.d}</span>${a.unlock?`<span class="lbl">${got?'Desbloquea':'Desbloqueará'} a ${ROSTER[a.unlock].n}</span>`:''}</div>`; }).join('')}</div>
      <span class="lbl">Titanes y enemigos · ${Object.keys(c.t||{}).length} de ${Object.keys(TITANS).length} vistos</span>
      <div class="gal">${Object.keys(TITANS).map(id=>{ const seen=codexSeen('t',id); return `<div class="card cx ${seen?'':'unk'}"><span class="art">${titanArt(id)}</span><b>${seen?TITANS[id].n:'Sin descubrir'}</b>${seen?`<span class="lbl num">${CLS[TITANS[id].cls]} · abatidos: ${c.t[id]||0}</span>${TITANS[id].boss?`<span class="dim" style="font-size:13px">${BOSS_PW[id]?'Puede soltar el '+POWERS[BOSS_PW[id]].n+'.':'Jefe final.'}</span>`:''}`:''}</div>`; }).join('')}</div>
      <span class="lbl">Finales · ${M.endings.length} de ${Object.keys(ENDINGS).length} · Epílogos · ${(statsOf().ep||[]).length} de ${EPILOGUES.length}</span>
      <div class="achs">${Object.entries(ENDINGS).map(([k,E])=>{ const got=M.endings.includes(k); return `<div class="ach ${got?'got':''}"><b>${got?E.n:'Final sin descubrir'}</b><span>${got?E.d:'Termina la campaña de otra manera.'}</span></div>`; }).join('')}
        ${EPILOGUES.map(e=>{ const got=(statsOf().ep||[]).includes(e.k); return `<div class="ach ${got?'got':''}"><b>${got?'Epílogo · '+e.n:'Epílogo sin descubrir'}</b><span>${got?e.d:'Aún no lo has visto.'}</span></div>`; }).join('')}</div>
      <span class="lbl">Momentos · ${(M.moments||[]).length} de ${MOMENTS.length}</span>
      <div class="gal moments">${MOMENTS.map((mo,i)=>(M.moments||[]).includes(i) ? `<button class="card cx mo" data-a="moment" data-i="${i}"><span class="m-thumb">${momentSVG(i)}</span><b>${mo.t}</b><span class="lbl">${mo.sg||SAGAS[Math.floor(i/3)].n}</span></button>` : `<div class="card cx unk mo"><span class="m-thumb"></span><b>Sin descubrir</b><span class="lbl">${mo.sg?'Senda alternativa':SAGAS[Math.floor(i/3)].n}</span></div>`).join('')}</div>
      <span class="lbl">Soldados · ${Object.keys(c.s||{}).length} de ${Object.keys(ROSTER).length} reclutados</span>
      <div class="gal">${Object.keys(ROSTER).map(id=>{ const seen=codexSeen('s',id); return seen ? `<button class="card cx" data-a="ficha" data-i="${id}">${portrait(id,true)}<b>${ROSTER[id].n}</b><span class="lbl">${STYLE[ROSTER[id].st]} · ${ROSTER[id].sk.n}</span><span class="lbl" style="color:var(--gold)">Ver ficha</span></button>` : `<div class="card cx unk">${portrait(id,true)}<b>Sin reclutar</b></div>`; }).join('')}</div>`;
  },
  over(){ return V.end(false); }, victory(){ return V.end(true); }
};
