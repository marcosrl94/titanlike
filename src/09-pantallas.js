// ---------- Pantallas ----------
let pendingRec = null, pendingSaga = 0, picked = [];
const esc = s => String(s==null?'':s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const chip = st => `<span class="chip s-${st}">${STYLE[st]}</span>`;
function solCard(id){
  const R=ROSTER[id];
  return `<div class="who">${portrait(id,true)}<div><h3>${R.n}</h3><div>${chip(R.st)}</div></div></div>
    <div class="stats num"><span><b>PV</b>${R.hp}</span><span><b>ATQ</b>${R.atk}</span><span><b>VEL</b>${R.spd}</span></div>
    <p><b>${R.sk.n}</b>${R.sk.gas?` · ${R.sk.gas} gas`:''}. ${R.sk.d}</p>`;
}
function squadHTML(mode){   // mode: 'ally' (elegir compañero), 'swap' (relevar) o nada
  return `<div class="squad">`+S.squad.map(s=>{
    const R=ROSTER[s.id], m=maxHp(s), f=C&&C.fx[s.id]||{};
    const aim = C && CFG.intent && scr==='combat' && s.hp>0 ? C.titans.filter(t=>t.hp>0 && (t.intent===s.id || t.intent==='all')).length : 0;
    const st=[aim&&`En el punto de mira${aim>1?' ×'+aim:''}`,f.titan>0&&'Titán',f.up>0&&'Flanqueo',f.crit>0&&'Olfato',f.guard>0&&'Escudo',f.taunt>0&&'Señuelo'].filter(Boolean).join(' · ');
    const can = mode && s.hp>0;
    const cl=['sol', s.hp<=0&&'dead', C&&C.active===s&&'active', can&&'pick'].filter(Boolean).join(' ');
    const pic = f.formT>0 ? `<span class="pt tf">${titanArt(POWERS[f.form].art)}</span>` : portrait(s.id);
    const tags = pwOf(s.id).map(k=>`<span class="chip pwc">${POWERS[k].n.replace(/^Titán (de )?/,'')}</span>`).join('');
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
const ICON = {
  c:'<path class="ic" d="M-9 9L9 -9M-9 -9L9 9"/>',
  e:'<path class="ic" d="M-11 11L11 -11M-11 -11L11 11"/><path class="dia" d="M0 -6l6 6-6 6-6-6Z"/>',
  v:'<text class="q" y="9">?</text>',
  k:'<path class="ic" d="M-12 9L0 -11L12 9Z M0 -11V9"/>',
  b:'<path class="ic" d="M-10 -2a10 10 0 1 1 20 0v6h-4v5h-12v-5h-4Z M-4 -3h.1 M4 -3h.1"/>'
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
const sagaLbl = w => `Saga ${sagaIx(w)+1} · ${sagaOf(w).n}`;
const V = {
  title(){
    const run=migrateRun(store.get('run')), M=meta(), ok=!!run;
    const rows=Object.keys(EFF).map(st=>{ const e=EFF[st]; const up=Object.keys(e).find(k=>e[k]>1), dn=Object.keys(e).find(k=>e[k]<1);
      return `<tr><td>${chip(st)}</td><td>×1,5 contra ${CLS[up]}</td><td>×0,75 contra ${CLS[dn]}</td></tr>`; }).join('');
    return `<section class="hero"><div class="txt">
        <span class="lbl">Cuerpo de Exploración · ${SAGAS.length} sagas</span>
        <h1>Más allá del <em>muro</em></h1>
        <p>Sales con un solo recluta. Cuatro sagas, doce titanes cambiantes y una ruta que eliges tú te separan del final. Quien cae, no vuelve.</p>
        <div class="cta">
          ${ok?`<button class="btn lg" data-a="continue">Continuar<small>${sagaOf(run.wave).n} · jornada ${dayOf(run.wave)}</small></button>`:''}
          <button class="btn lg ${ok?'ghost':''}" data-a="sagas">${ok?'Nueva expedición':'Salir de las murallas'}</button>
        </div>
        <div class="cta2">
          <button class="btn ghost" data-a="daily" ${dailyDone()?'disabled title="Ya has jugado la de hoy"':''}>${dailyDone()?'Del día: vuelve mañana':'Expedición del día'}</button>
          <button class="btn ghost" data-a="codex">Logros · ${M.ach.length}/${ACH.length}</button>
          <button class="btn ghost" data-a="gallery">Imágenes y música</button>
        </div>
        <span class="lbl num">Sagas desbloqueadas: ${M.unlocked} de ${SAGAS.length} · Mejor marca: ${M.best} de ${TOTAL} jornadas</span>
        ${accountHTML('title')}
      </div><div class="peek">${titanFig(TITANS.col.a)}</div></section>
      <ul class="rules">
        <li><b>Sagas encadenadas</b>Quince jornadas cada una. Al vencer al último jefe sigues con tu escuadrón.</li>
        <li><b>Elige la ruta</b>Combates, élites, eventos y campamentos. Cada zona acaba en un jefe.</li>
        <li><b>El gas manda</b>Nuca y habilidades gastan gas del escuadrón. Recuperas 3 tras cada combate.</li>
        <li><b>Muerte permanente</b>Hasta 4 soldados. Si cae el último, la expedición termina.</li>
      </ul>
      <section class="panel"><div class="row" style="justify-content:space-between"><span class="lbl">Registro de los Nueve · ${M.nine.length} de 9</span><span class="lbl">Finales: ${M.endings.length} de 3</span></div>
        <div class="nine">${NINE.map(k=>`<div class="nc ${M.nine.includes(k)?'got':''}"><span class="art">${titanArt(POWERS[k].art)}</span><span>${M.nine.includes(k)?POWERS[k].n.replace(/^Titán (de )?/,''):'Sin descubrir'}</span></div>`).join('')}</div>
        <p class="dim" style="font-size:13px">Los cambiantes pueden soltar su poder al caer. Reúne los de Eren (Ataque, Fundador y Martillo de Guerra) o los nueve para desbloquear otros finales.</p></section>
      <section class="panel"><span class="lbl">Qué estilo corta mejor a cada titán</span>
        <div class="tablewrap"><table class="chart"><tbody>${rows}</tbody></table></div></section>`;
  },
  sagas(){
    const u=meta().unlocked, saved=!!store.get('run');
    return `<div><h2>Elige la saga</h2><p class="dim" style="max-width:64ch">Una campaña recorre las cuatro seguidas. Las que ya hayas desbloqueado se pueden empezar directamente, con tres veteranos equipados.</p></div>
      ${saved?'<p class="note-s">Tienes una expedición a medias: empezar otra la sustituye.</p>':''}
      <div class="sagas">${SAGAS.map((g,i)=>`<button class="card saga" data-a="saga" data-i="${i}" ${i<u?'':'disabled'}>
        <span class="n">SAGA ${i+1}${i<u?'':' · BLOQUEADA'}</span><h3>${g.n}</h3><p>${i<u?g.d:`Vence la saga ${i} para abrirla.`}</p>
        <ul>${g.zones.map(z=>`<li>${z.n} · ${TITANS[z.boss].n}</li>`).join('')}</ul></button>`).join('')}</div>
      <div><button class="btn ghost" data-a="home">Volver</button></div>`;
  },
  starter(){
    const g=pendingSaga;
    if(g===0) return `<div><span class="lbl">Saga 1 · ${SAGAS[0].n}</span><h2>Elige a tu primer recluta</h2></div>
      <div class="cards">${starters().map(id=>`<button class="card" data-a="start" data-i="${id}">${solCard(id)}</button>`).join('')}
        ${ACH.filter(a=>a.unlock && !starters().includes(a.unlock)).map(a=>`<div class="card locked"><div class="who">${portrait(a.unlock,true)}<div><h3>${ROSTER[a.unlock].n}</h3><span class="lbl">Bloqueado</span></div></div><p>Se desbloquea con el logro «${a.n}»: ${a.d}</p></div>`).join('')}</div>`;
    const pool=Object.keys(ROSTER).filter(id=>ROSTER[id].sg<=g && !ROSTER[id].rare);
    return `<div><span class="lbl">Saga ${g+1} · ${SAGAS[g].n}</span><h2>Forma un escuadrón de tres</h2>
      <p class="dim">Empiezan en nivel ${g*PER+1} y con ${KITS[g]} mejoras al azar, como si vinieran de la saga anterior.</p></div>
      <div class="row"><button class="btn" data-a="go" ${picked.length===3?'':'disabled'}>Partir · ${picked.length} de 3</button><button class="btn ghost" data-a="sagas">Cambiar de saga</button></div>
      <div class="cards">${pool.map(id=>`<button class="card ${picked.includes(id)?'sel':''}" data-a="pickst" data-i="${id}" aria-pressed="${picked.includes(id)}">${solCard(id)}</button>`).join('')}</div>`;
  },
  map(){
    const z=zoneOf(S.wave);
    const D = S.daily ? DAILY_MODS.find(x=>x.k===S.mod) : null;
    const unranked = !cloudOn() || S.runId ? '' : CLOUD.user
      ? `<p class="note-s">${S.runNote || 'Esta expedición empezó sin sesión y no puntúa en la clasificación. La próxima, sí.'}</p>`
      : `<div class="acc out slim"><div class="acc-t"><b>Esta expedición no puntúa</b><span>Entra con Google: tu progreso se guarda en la nube y las próximas expediciones entran en la clasificación.</span></div>${gbtn()}</div>`;
    return `${unranked}${D?`<section class="panel daily"><span class="lbl">Expedición del día · ${S.daily}</span><p><b>${D.n}.</b> ${D.d} Mismo mapa, titanes y recompensas para todos; termina al acabar la saga 1.</p></section>`:''}<div><span class="lbl">${sagaLbl(S.wave)}</span><h2>${z.n}</h2><p class="dim">${S.map.pos?'Elige el siguiente paso de la ruta.':'Elige por dónde entra el escuadrón.'} Al fondo espera el ${TITANS[z.boss].n}.${BOSS_PW[z.boss] && !(BOSS_PW[z.boss] in S.pw) ? ` Puede soltar el poder del ${POWERS[BOSS_PW[z.boss]].n}: <b class="num" style="color:var(--gold)">${Math.round(dropP()*100)} %</b>.` : ''}</p></div>
      <div class="mapwrap">${mapSVG()}</div>
      <ul class="legend">${Object.keys(NODE).map(k=>`<li><b>${NODE[k].n}.</b> ${NODE[k].d}</li>`).join('')}</ul>
      <span class="lbl">Tu escuadrón</span>${squadHTML()}${relicsHTML()}`;
  },
  combat(){
    const a=C.active, P=C.pending, canAct = a && !C.busy, ph=-((performance.now()/1000)%4.2).toFixed(2);
    const tit = C.titans.map((t,i)=>{
      const pk = canAct && P && P.tgt==='enemy' && t.hp>0;
      const e = a && t.hp>0 ? eff(a,t) : 1;
      const st=[t.mark>0&&'Marcado',t.stun>0&&'Derribado',t.blind>0&&'Cegado',t.hard>0&&'Endurecido'].filter(Boolean).join(' · ');
      const cl=['titan','z-'+t.cls, t.boss&&'boss', t.phase&&'enraged', t.hp<=0&&'dead', pk&&'pick'].filter(Boolean).join(' ');
      const inner=`${e!==1?`<span class="eff num ${e>1?'up':'down'}">×${String(e).replace('.',',')}</span>`:''}
        <span class="art" style="animation-delay:${ph-i*.7}s">${titanArt(t.id)}</span>
        <span class="plate"><h3>${t.n}</h3><span class="chip c-cls">${CLS[t.cls]}</span>
        <span class="bar"><i style="width:${t.hp/t.max*100}%"></i></span><span class="lbl num hpn">${t.hp} / ${t.max} PV</span><span class="st">${st}</span>
        ${(()=>{ const e = canAct && CFG.preview && estimate(a, t, P ? P.kind : 'cut'); return e ? `<span class="prev ${e.kill?'kill':''}">${P?'':'Corte '}≈ ${e.lo===e.hi?e.lo:e.lo+'–'+e.hi}${e.kill?' · abate':''}</span>` : ''; })()}
        ${CFG.intent && t.hp>0 && t.intent ? `<span class="int ${t.intent==='all'?'all':''}" title="${AI_TXT[aiOf(t)]}">Ataca a: ${t.intent==='all' ? 'todo el escuadrón' : esc(ROSTER[t.intent].n)}</span>` : ''}</span>`;
      return pk ? `<button class="${cl}" data-u="t${i}" data-a="titan" data-i="${i}">${inner}</button>` : `<div class="${cl}" data-u="t${i}">${inner}</div>`;
    }).join('');
    let orders='', hint='Los titanes se mueven…';
    if(canAct){
      const R=ROSTER[a.id], sk=R.sk, skOff = S.gas<sk.gas || (sk.once&&C.used[a.id]);
      const sel=k=>P&&P.kind===k?'sel':'';
      orders=`<button class="order ${sel('cut')}" data-a="order" data-i="cut"><b>Corte</b><span>Ataque básico. No gasta gas.</span></button>
        <button class="order ${sel('nape')}" data-a="order" data-i="nape" ${S.gas<1?'disabled':''}><b>A la nuca · 1 gas</b><span>Daño ×1,6. Remata a titanes normales por debajo del 25 %.</span></button>
        <button class="order ${sel('skill')}" data-a="order" data-i="skill" ${skOff?'disabled':''}><b>${sk.n}${sk.gas?` · ${sk.gas} gas`:''}</b><span>${sk.d}</span></button>`
        + pwOf(a.id).map(k=>`<button class="order pw ${sel('pw:'+k)}" data-a="order" data-i="pw:${k}" ${C.usedPw[k]?'disabled':''}><b>Transformarse · ${POWERS[k].n.replace(/^Titán (de )?/,'')}</b><span>${C.usedPw[k]?'Ya usado en este combate.':POWERS[k].d}</span></button>`).join('');
      if((S.items||[]).length) orders += `<div class="items"><span class="lbl">Objetos${C.itemUsed?' · ya usaste uno este turno':' · acción libre'}</span>${S.items.map((k,j)=>`<button class="btn ghost sm ${sel('it:'+k)}" data-a="order" data-i="it:${k}" title="${ITEMS[k].d}" ${C.itemUsed?'disabled':''}>${ITEMS[k].n}</button>`).join('')}</div>`;
      hint = P ? (P.tgt==='enemy'?'Elige un titán.':'Elige a un compañero.') : `Turno de ${R.n}.`;
    }
    return `<div class="stage"><div class="titans">${tit}</div></div>
      <div class="log" id="log" aria-live="polite">${C.log.map(l=>`<div>${l}</div>`).join('')}</div>
      ${squadHTML(canAct && P && P.tgt==='ally' ? 'ally' : '')}
      <div class="dock"><div class="hint lbl"><span id="hint">${hint}</span><button class="btn ghost sm" data-a="speed" title="Velocidad de las animaciones">Animación: ${ANIM[CFG.anim].n}</button></div>
      <div class="orders" id="orders">${orders}</div></div>${relicsHTML()}`;
  },
  reward(){
    const t=curNode().t, nx=SAGAS[sagaIx(S.wave)+1];
    return `<div>${S.sagaDone?`<span class="lbl">${sagaLbl(S.wave)}</span>`:''}<h2>${S.sagaDone?'Saga completada':t==='b'?'Cambiante derrotado':t==='e'?'Élite abatida':'Zona despejada'}</h2>
      <p class="dim">${S.sagaDone&&nx?`Se abre la saga ${sagaIx(S.wave)+2}, «${nx.n}». El escuadrón sigue adelante con el depósito lleno. `:'Los supervivientes suben de nivel. '}${S.picks>1?`Elige ${S.picks} recompensas.`:'Elige una recompensa.'}</p></div>
      ${S.note?`<section class="panel note"><p>${S.note}</p></section>`:''}
      <div class="cards">${S.rewards.map((r,i)=> r.t==='rec'
        ? `<button class="card" data-a="reward" data-i="${i}"><span class="lbl kind">Recluta${ROSTER[r.id].rare?' veterano':''}</span>${solCard(r.id)}</button>`
        : r.t==='item' ? `<button class="card" data-a="reward" data-i="${i}"><span class="lbl kind">Objeto · un solo uso</span><h3>${ITEMS[r.id].n}</h3><p>${ITEMS[r.id].d} Llevas ${(S.items||[]).length} de 3.</p></button>`
        : `<button class="card" data-a="reward" data-i="${i}"><span class="lbl kind">Mejora</span><h3>${UPG[r.id].n}</h3><p>${UPG[r.id].d}</p></button>`).join('')}</div>
      <span class="lbl">Tu escuadrón</span>${squadHTML()}${relicsHTML()}`;
  },
  replace(){
    return `<div><h2>El escuadrón está completo</h2>
      <p class="dim">${ROSTER[pendingRec.id].n} ocupa el puesto de quien elijas. El relevado vuelve a las murallas.</p></div>
      ${squadHTML('swap')}<div><button class="btn ghost" data-a="back">Volver a las recompensas</button></div>`;
  },
  camp(){
    return `<div><h2>Campamento</h2><p class="dim">Hay tiempo para una sola cosa antes de que amanezca.</p></div>
      <div class="cards">${CAMP.map((c,i)=>`<button class="card" data-a="camp" data-i="${i}"><h3>${c.n}</h3><p>${c.d}</p></button>`).join('')}
      ${NINE.some(k=>S.pw[k]==='reserva') && S.squad.some(hasRoom) ? `<button class="card" data-a="inject"><span class="lbl kind">Reserva</span><h3>Inyectar un suero</h3><p>Un soldado hereda el poder del ${POWERS[NINE.find(k=>S.pw[k]==='reserva')].n}.</p></button>` : ''}</div>
      <span class="lbl">Tu escuadrón</span>${squadHTML()}`;
  },
  event(){
    const E=EVENTS[S.pend.i];
    return `<div><span class="lbl">Evento</span><h2>${E.n}</h2></div><section class="panel"><p style="max-width:62ch">${S.pend.res||E.d}</p></section>
      ${S.pend.res ? `<div><button class="btn" data-a="evok">Seguir la ruta</button></div>`
        : `<div class="cards">${E.o.map((o,i)=>`<button class="card" data-a="evopt" data-i="${i}"><h3>${o.l}</h3><p>${o.d}</p></button>`).join('')}</div>`}
      <span class="lbl">Tu escuadrón</span>${squadHTML()}`;
  },
  gallery(){
    const fitCtl = k => CUSTOM[k] ? `<div class="fit" role="group" aria-label="Encuadre de ${k}"><span class="lbl">Encuadre${k.endsWith('@a')?' adulto':''}</span>${[['out','−','Alejar'],['in','+','Acercar'],['l','←','Mover a la izquierda'],['r','→','Mover a la derecha'],['u','↑','Subir'],['d','↓','Bajar'],['reset','↺','Restablecer']].map(([o,t,l])=>`<button class="btn ghost sm" data-a="fit" data-i="${k}|${o}" aria-label="${l}" title="${l}">${t}</button>`).join('')}</div>` : '';
    const cell=(id,name,pic)=>`<div class="card">${pic}<b>${name}</b>${fitCtl(id)}${ROSTER[id]&&CUSTOM[id+'@a']?`<span class="pt lg"><img src="${CUSTOM[id+'@a']}" alt="" style="${fitStyle(id+'@a')}"></span>${fitCtl(id+'@a')}`:''}
      <label class="btn ghost sm file" for="up-${id}" tabindex="0">${CUSTOM[id]?'Cambiar imagen':'Subir imagen'}</label><input class="vh" type="file" accept="image/*" id="up-${id}" data-up="${id}">
      ${CUSTOM[id]?`<button class="btn ghost sm" data-a="rm" data-i="${id}">Quitar</button>`:''}
      ${ROSTER[id]?`<label class="btn ghost sm file" for="up-${id}-a" tabindex="0">${CUSTOM[id+'@a']?'Cambiar adulta':'Versión adulta'}</label><input class="vh" type="file" accept="image/*" id="up-${id}-a" data-up="${id}@a">${CUSTOM[id+'@a']?`<button class="btn ghost sm" data-a="rm" data-i="${id}@a">Quitar adulta</button>`:''}`:''}</div>`;
    return `<div><h2>Tus imágenes y música</h2><p class="dim" style="max-width:66ch">Importa un paquete (.json de imágenes o de música) o carga tus archivos uno a uno, y el juego los usará en lugar de los emblemas, los dibujos de titanes y la música sintetizada. Cada soldado admite una versión adulta, que se usa a partir de la saga 4. ${cloudOn() && CLOUD.user ? 'Se guardan en este navegador y en tu cuenta, que es privada: al entrar desde otro dispositivo se cargan solas.' : cloudOn() ? 'Se guardan en este navegador. Si entras con Google, también en tu cuenta privada y se cargan solas en otros dispositivos.' : 'Se guardan solo en este navegador.'}</p></div>
      <div class="row"><button class="btn ghost" data-a="home">Volver</button>
        <label class="btn file" for="pack" tabindex="0">Importar paquete (.json)</label><input class="vh" type="file" accept=".json,application/json" id="pack" data-pack="1">
        ${Object.keys(CUSTOM).length?`<button class="btn ghost" data-a="rmall">Quitar todas (${Object.keys(CUSTOM).length})</button>`:''}
        ${packMsg?`<span class="lbl" style="color:var(--gold)">${packMsg}</span>`:''}</div>
      <div class="row" style="justify-content:space-between"><span class="lbl">Música</span><label class="btn ghost sm file" for="pack" tabindex="0">Importar música (.json)</label></div>${packMsg?`<span class="lbl" style="color:var(--gold)" role="status">${esc(packMsg)}</span>`:''}${auMsg?`<span class="lbl" style="color:var(--gold)" role="status">${esc(auMsg)}</span>`:''}<div class="gal">${Object.keys(TRACKS).map(k=>`<div class="card slot"><b>${TRACKS[k]}</b>
        <span class="dim" style="font-size:13px;overflow-wrap:anywhere">${MY[k]?esc(MY[k].name.replace(/_/g,' ').replace(/\.[a-z0-9]+$/i,'')):'Música del juego'}</span>
        <label class="btn ghost sm file" for="au-${k}" tabindex="0">${MY[k]?'Cambiar audio':'Cargar audio'}</label><input class="vh" type="file" accept="audio/*" id="au-${k}" data-au="${k}">
        ${MY[k]?`<button class="btn ghost sm" data-a="rmau" data-i="${k}">Quitar</button>`:''}</div>`).join('')}</div>
      <span class="lbl">Soldados</span><div class="gal">${Object.keys(ROSTER).map(id=>cell(id,ROSTER[id].n,portrait(id,true))).join('')}</div>
      <span class="lbl">Titanes</span><div class="gal">${Object.keys(TITANS).map(id=>cell(id,TITANS[id].n,`<span class="art">${titanArt(id)}</span>`)).join('')}</div>`;
  },
  end(won){
    const f=S.fallen.map(id=>`<li>${ROSTER[id].n}</li>`).join('');
    if(S.daily) return `<section class="hero"><div class="txt"><span class="lbl">Expedición del día · ${S.daily}</span>
      <h1>${S.dailyDone?'Trost <em>resiste</em>':'Nadie <em>regresa</em>'}</h1>
      <p>${S.dailyDone?'Has completado la saga 1 de hoy.':`Caída en la jornada ${dayOf(S.wave)} de ${PER}.`} Puntuación: <b class="num">${S.dailyScore}</b> (100 por jornada superada y 500 por terminar).${cloudOn() && !S.runId ? ' Esta expedición no puntúa en la clasificación: no había sesión al empezar.' : ''}</p>
      <div class="row">${cloudOn()&&CLOUD.user?'<button class="btn" data-a="board" data-i="hoy">Ver la clasificación de hoy</button>':''}<button class="btn ghost" data-a="home">Portada</button></div></div>
      <div class="peek">${titanFig(TITANS.col.a)}</div></section>${f?`<section class="panel"><span class="lbl">Entregaron su corazón</span><ul class="fallen">${f}</ul></section>`:''}`;
    return `<section class="hero"><div class="txt"><span class="lbl">Parte de expedición</span>
      <h1>${won?(S.ending==='nueve'?'Los <em>Nueve</em>':S.ending==='coordenada'?'La <em>Coordenada</em>':'El Retumbar <em>se detiene</em>'):'Nadie <em>regresa</em>'}</h1>
      <p>${won?`${ENDINGS[S.ending].d} ${S.erenFell?'Eren se volvió contra vosotros y lo habéis detenido. ':''}${S.squad.map(nm).join(', ')} ${S.squad.length>1?'siguen':'sigue'} en pie tras ${TOTAL} jornadas. Poderes reunidos: ${owned().length} de 9.`:`La expedición acaba en la saga ${sagaIx(S.wave)+1}, «${sagaOf(S.wave).n}»: jornada ${dayOf(S.wave)} de ${PER}, en ${zoneOf(S.wave).n}.`}</p>
      <div class="row"><button class="btn" data-a="sagas">Nueva expedición</button><button class="btn ghost" data-a="home">Portada</button></div></div>
      <div class="peek">${titanFig(won?TITANS.fun.a:TITANS.col.a)}</div></section>
      ${cloudOn()&&!CLOUD.user?accountHTML('end'):''}
      ${f?`<section class="panel"><span class="lbl">Entregaron su corazón</span><ul class="fallen">${f}</ul></section>`:''}`;
  },
  scene(){
    const sc=S.scene, lines=a=>a.map((l,i)=>`<p class="ln" style="animation-delay:${i*.7}s">${l}</p>`).join('');
    const wrap=(lbl,title,art,body,act)=>`<section class="scene"><div class="sart">${art}</div><div class="stx"><span class="lbl">${lbl}</span><h2>${title}</h2>${body}</div></section>${act}<span class="lbl">Tu escuadrón</span>${squadHTML()}${relicsHTML()}`;
    if(sc.k==='betray'){ const id=sc.id;
      return wrap('Traición', id==='eren'?'El Retumbar':`${ROSTER[id].n} se aparta del escuadrón`, titanArt(sc.boss), lines(BETRAY[id].pre),
        `<div><button class="btn" data-a="scn" data-i="go">Desenvainar</button></div>`); }
    if(sc.k==='spare'){ const B=BETRAY[sc.id], k=B.pw, have = k in S.pw && S.pw[k]!=='reserva';
      return wrap('Tras el combate', `${ROSTER[sc.id].n} sigue vivo`, portrait(sc.id,true), `<p>${B.post}</p>`,
        `<div class="cards"><button class="card" data-a="scn" data-i="rescue"><h3>Sacarlo y perdonarlo</h3><p>Vuelve al escuadrón con el 30 % de sus PV y no volverá a traicionaros.</p></button>
         <button class="card" data-a="scn" data-i="take"><h3>Quitarle el poder</h3><p>${have?'Ya tenéis ese poder. ':`El escuadrón hereda el ${POWERS[k].n}. `}${ROSTER[sc.id].n} queda preso y no vuelve.</p></button></div>`); }
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
    const B=CLOUD.board, me=CLOUD.user&&CLOUD.user.id, hoy=CLOUD.tab==='hoy';
    return `<div><h2>Clasificación</h2><p class="dim">${hoy?`Expedición del día ${today()}: misma semilla para todos, un intento.`:'Jornadas alcanzadas, finales conseguidos y poderes del registro.'} Solo la ven los jugadores con sesión.</p></div>
      <div class="row"><button class="btn ${hoy?'ghost':''} sm" data-a="board" data-i="general">General</button><button class="btn ${hoy?'':'ghost'} sm" data-a="board" data-i="hoy">Hoy</button></div>
      <div class="row"><button class="btn ghost" data-a="home">Volver</button>
        <label class="lbl" for="nm">Tu nombre</label><input id="nm" maxlength="32" value="${esc(CLOUD.name)}" style="background:var(--stone-2);color:var(--bone);border:1px solid var(--stone-4);padding:8px;font:inherit">
        <button class="btn ghost sm" data-a="rename">Guardar nombre</button>${CLOUD.msg?`<span class="lbl" style="color:var(--gold)">${esc(CLOUD.msg)}</span>`:''}</div>
      ${hoy ? `<section class="panel"><div class="tablewrap"><table class="chart num"><thead><tr><td class="lbl">#</td><td class="lbl">Jugador</td><td class="lbl">Puntos</td><td class="lbl">Jornadas</td></tr></thead><tbody>
      ${!B ? '<tr><td colspan="4">Cargando…</td></tr>' : !B.length ? '<tr><td colspan="4">Nadie ha terminado la expedición de hoy todavía.</td></tr>'
        : B.map((r,i)=>`<tr style="${r.user_id===me?'color:var(--gold)':''}"><td>${i+1}</td><td>${esc(r.display_name)}</td><td>${r.score}</td><td>${r.wave} / ${PER}</td></tr>`).join('')}</tbody></table></div></section>` : `
      <section class="panel"><div class="tablewrap"><table class="chart num"><thead><tr><td class="lbl">#</td><td class="lbl">Jugador</td><td class="lbl">Jornadas</td><td class="lbl">Finales</td><td class="lbl">Los Nueve</td></tr></thead><tbody>
      ${!B ? '<tr><td colspan="5">Cargando…</td></tr>' : !B.length ? '<tr><td colspan="5">Aún no hay nadie. La primera expedición marca el listón.</td></tr>'
        : B.map((r,i)=>`<tr style="${r.user_id===me?'color:var(--gold)':''}"><td>${i+1}</td><td>${esc(r.display_name)}</td><td>${r.best} / ${TOTAL}</td><td>${r.endings} / 3</td><td>${r.nine} / 9</td></tr>`).join('')}
      </tbody></table></div></section>`}`;
  },
  codex(){
    const M=meta(), c=M.codex||{t:{},s:{}};
    return `<div><h2>Logros y códice</h2><p class="dim">${M.ach.length} de ${ACH.length} logros. Algunos desbloquean reclutas iniciales para la saga 1.</p></div>
      <div><button class="btn ghost" data-a="home">Volver</button></div>
      <div class="achs">${ACH.map(a=>{ const got=M.ach.includes(a.k); return `<div class="ach ${got?'got':''}"><b>${a.n}</b><span>${a.d}</span>${a.unlock?`<span class="lbl">${got?'Desbloquea':'Desbloqueará'} a ${ROSTER[a.unlock].n}</span>`:''}</div>`; }).join('')}</div>
      <span class="lbl">Titanes · ${Object.keys(c.t||{}).length} de ${Object.keys(TITANS).length} vistos</span>
      <div class="gal">${Object.keys(TITANS).map(id=>{ const seen=codexSeen('t',id); return `<div class="card cx ${seen?'':'unk'}"><span class="art">${titanArt(id)}</span><b>${seen?TITANS[id].n:'Sin descubrir'}</b>${seen?`<span class="lbl num">${CLS[TITANS[id].cls]} · abatidos: ${c.t[id]||0}</span>${TITANS[id].boss?`<span class="dim" style="font-size:13px">${BOSS_PW[id]?'Puede soltar el '+POWERS[BOSS_PW[id]].n+'.':'Jefe final.'}</span>`:''}`:''}</div>`; }).join('')}</div>
      <span class="lbl">Soldados · ${Object.keys(c.s||{}).length} de ${Object.keys(ROSTER).length} reclutados</span>
      <div class="gal">${Object.keys(ROSTER).map(id=>{ const seen=codexSeen('s',id); return `<div class="card cx ${seen?'':'unk'}">${portrait(id,true)}<b>${seen?ROSTER[id].n:'Sin reclutar'}</b>${seen?`<span class="lbl">${STYLE[ROSTER[id].st]} · ${ROSTER[id].sk.n}</span>`:''}</div>`; }).join('')}</div>`;
  },
  over(){ return V.end(false); }, victory(){ return V.end(true); }
};
