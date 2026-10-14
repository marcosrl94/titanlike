// ---------- Fichas de personaje, escuadrones y clasificación por jefe (pantallas) ----------
// ---- biografías breves (texto propio) ----
const BIO = {
  eren:'Recluta de Shiganshina con más rabia que técnica. Aguanta lo que le echen y pega más fuerte cuanto peor está.',
  mikasa:'La mejor de su promoción. Rápida, precisa y siempre pendiente de que nadie de su escuadrón se quede atrás.',
  armin:'No es el más fuerte, pero ve el campo como nadie: señala el punto débil y el resto del escuadrón hace el trabajo.',
  sasha:'Cazadora del bosque. Con el arco acierta donde duele y oye a un titán antes de verlo.',
  jean:'Pragmático y buen líder de campo. Sabe cuándo apretar y arrastra al escuadrón con él.',
  connie:'Ágil, ruidoso y valiente cuando hace falta. Atrae a los titanes para que los demás corten tranquilos.',
  hange:'Jefa de investigación. Conoce a los titanes mejor que nadie y lleva las lanzas trueno a todas partes.',
  reiner:'Corpulento y protector, siempre se pone delante. Lo que esconde es otra historia.',
  annie:'Callada y letal en el cuerpo a cuerpo. Derriba a un titán de una patada si lo pilla desprevenido.',
  historia:'Más fuerte de lo que aparenta. Cura y sostiene al escuadrón cuando las cosas se tuercen.',
  levi:'El soldado más fuerte de la humanidad, según dicen. Gira entre los titanes y no deja nada en pie.',
  erwin:'Comandante del Cuerpo de Exploración. Una orden suya y todo el escuadrón carga a la vez.',
  ymir:'Desconfiada y directa. Muerde primero y pregunta después, y sale de cada pelea un poco más entera.',
  nanaba:'Veterana de mil salidas. Pasa rasante sobre los titanes y corta a dos de una pasada.',
  mike:'Su olfato vale por un escuadrón: sabe dónde y cuándo cortar antes de que nadie lo vea.',
  floch:'Recluta superviviente de las peores salidas. Con las lanzas trueno no tiembla.',
  gabi:'Guerrera de Marley, impulsiva y con una puntería brutal con el rifle antititán.',
  pieck:'Estratega tranquila. Su artillería castiga a todo el frente y deja marcado al enemigo.'
};
const SAGA_N = i => SAGAS[i] ? SAGAS[i].n : '';
const BOSSES = SAGAS.flatMap(sg=>sg.zones.map(z=>z.boss));
const dodgePct = spd => (Math.max(0, Math.floor((spd-10)/3))+1)*5;
let fichaId = 'eren', compsTab = 'mine';

V.ficha = function(){
  const ids=Object.keys(ROSTER), id=ROSTER[fichaId]?fichaId:'eren', R=ROSTER[id], i=ids.indexOf(id), st=statsOf(), h=st.ch[id], seen=codexSeen('s',id);
  const prev=ids[(i-1+ids.length)%ids.length], next=ids[(i+1)%ids.length];
  const e=EFF[R.st], up=Object.keys(e).find(k=>e[k]>1), dn=Object.keys(e).find(k=>e[k]<1);
  const lv=[1,15,30,45,60].map(l=>{ const m=1+.05*(l-1); return `<tr><td class="lbl">Nv ${l}</td><td>${Math.round(R.hp*m)}</td><td>${Math.round(R.atk*m)}</td></tr>`; }).join('');
  const tr=Object.entries(R.tr||{}).map(([k,v])=>[k, v+(STYLE_SKILL[R.st]===k?1:0)]), trS=STYLE_SKILL[R.st];
  if(trS && !tr.some(t=>t[0]===trS)) tr.push([trS,1]);
  const gd = h ? GRADE_ORDER.map(g=>({g, n:h.g[g]||0})) : [], gmax=Math.max(1,...gd.map(x=>x.n));
  const best = Object.entries(st.co).filter(([k,c])=>compIds(k).includes(id) && c.f>=2).sort((a,b)=>b[1].sc/b[1].f-a[1].sc/a[1].f).slice(0,3);
  const sk=R.sk, inn=BRINGS[id];
  return `<div class="row ficha-nav"><button class="btn ghost sm" data-a="codex">Volver</button><span class="spacer"></span>
      <button class="btn ghost sm" data-a="ficha" data-i="${prev}" aria-label="Anterior">← ${ROSTER[prev].n}</button><button class="btn ghost sm" data-a="ficha" data-i="${next}" aria-label="Siguiente">${ROSTER[next].n} →</button></div>
    <section class="ficha"><div class="f-hd">${portrait(id,true)}<div><span class="lbl">Ficha de personaje${R.rare?' · veterano':''}</span><h2>${R.n}</h2>
      <div class="row">${chip(R.st)}<span class="lbl">Disponible desde la saga ${R.sg+1}${R.sg?` · «${SAGA_N(R.sg)}»`:''}</span></div>
      <p class="dim">${seen?BIO[id]:'Todavía no lo has reclutado.'}</p></div></div>
    <div class="f-grid">
      <div class="panel"><span class="lbl">Hoja de servicio</span>
        <table class="chart num"><thead><tr><td></td><td class="lbl">PV</td><td class="lbl">Ataque</td></tr></thead><tbody>${lv}</tbody></table>
        <p class="dim" style="font-size:13px">Velocidad ${R.spd} · esquiva ${dodgePct(R.spd)} % por golpe (d20 + ${Math.max(0,Math.floor((R.spd-10)/3))} contra 20). Sin contar mejoras ni poderes.</p></div>
      <div class="panel"><span class="lbl">Combate</span>
        <p><b>${STYLE[R.st]}</b>: ×1,5 contra ${CLS[up]}, ×0,75 contra ${CLS[dn]}.${R.st==='preciso'?' Crítico con 17-20 en el d20.':' Crítico con 19-20 en el d20.'}</p>
        <p><b>${sk.n}</b> · ${sk.gas} gas${sk.cd?` · recarga ${sk.cd}`:''}${sk.once?' · una vez por combate':''}<br><span class="dim">${sk.d}</span></p>
        ${inn?`<p><b>Poder propio:</b> ${POWERS[inn].n}. <span class="dim">${POWERS[inn].d}</span></p>`:''}
        <p class="dim" style="font-size:13px">Puede llevar ${id==='eren'?'hasta tres poderes de los Nueve':'un poder de los Nueve'}.</p></div>
      <div class="panel"><span class="lbl">Rasgos para las pruebas</span>
        ${tr.length?`<ul class="traits">${tr.sort((a,b)=>b[1]-a[1]).map(([k,v])=>`<li><b>${SKILLS[k]}</b> +${v}</li>`).join('')}</ul>`:'<p class="dim">Sin rasgos.</p>'}
        <p class="dim" style="font-size:13px">En cada prueba tira el soldado del escuadrón con más bono en esa habilidad.</p></div>
      <div class="panel"><span class="lbl">Historial</span>
        ${h?`<div class="f-stats num"><div><b>${h.f}</b><span>combates</span></div><div><b>${h.k}</b><span>abatidos</span></div><div><b>${h.d.toLocaleString('es-ES')}</b><span>daño hecho</span></div>
          <div><b>${h.c}</b><span>críticos</span></div><div><b>${h.n}</b><span>20 naturales</span></div><div><b>${h.fall}</b><span>caídas</span></div>
          <div><b>${h.runs}</b><span>expediciones</span></div><div><b>${h.wins}</b><span>campañas</span></div><div><b>${h.best?gradeOf(h.best):'—'}</b><span>mejor nota</span></div></div>
          <div class="gdist">${gd.map(x=>`<div><span class="gcol" style="height:${Math.round(x.n/gmax*100)}%"></span>${gradeChip(x.g)}<small class="num">${x.n}</small></div>`).join('')}</div>`
        :'<p class="dim">Aún no ha combatido contigo. Las notas, bajas y récords de cada combate se apuntan aquí.</p>'}</div>
      ${best.length?`<div class="panel"><span class="lbl">Sus mejores escuadrones</span>${best.map(([k,c])=>`<div class="crow">${compIds(k).map(x=>portrait(x)).join('')}<span>${compName(k)}</span><span class="num dim">${c.f} combates</span>${gradeChip(gradeOf(c.sc/c.f))}</div>`).join('')}</div>`:''}
    </div></section>`;
};
V.comps = function(){
  const mine = compsTab!=='all', st=statsOf();
  const rows = mine ? Object.entries(st.co).map(([k,c])=>({comp:k, fights:c.f, avg:c.f?c.sc/c.f:null, s:c.f?Math.round(100*((c.g['S']||0)+(c.g['S+']||0))/c.f):0, runs:c.runs, wins:c.wins, best:c.bw}))
    : (CLOUD.comps||[]).map(r=>({comp:r.comp, fights:r.fights, avg:r.avg_score, s:r.s_rate, runs:r.runs, wins:r.wins, best:r.best_wave, players:r.players}));
  rows.sort((a,b)=>(b.fights+b.runs*4)-(a.fights+a.runs*4));
  const loading = !mine && !CLOUD.comps;
  const body = loading ? '<tr><td colspan="7">Cargando…</td></tr>' : !rows.length ? `<tr><td colspan="7">${mine?'Todavía no hay combates calificados. Gana uno y aparecerá aquí tu escuadrón.':'Aún no hay datos de otros jugadores.'}</td></tr>`
    : rows.slice(0,40).map(r=>`<tr><td><div class="crow">${compIds(r.comp).map(x=>portrait(x)).join('')}<span>${compName(r.comp)}</span></div></td><td>${r.fights}</td><td>${r.avg!=null?gradeChip(gradeOf(r.avg))+' <small class="dim">'+Math.round(r.avg)+'</small>':'—'}</td><td>${r.fights?r.s+' %':'—'}</td><td>${r.runs}</td><td>${r.best?r.best+' / '+TOTAL:'—'}</td><td>${r.wins}</td></tr>`).join('');
  return `<div><h2>Escuadrones</h2><p class="dim">${mine?'Los escuadrones con los que has combatido: nota media, porcentaje de S, expediciones y hasta dónde llegaron.':'Lo que juega todo el mundo (datos anónimos y agregados de los jugadores con sesión).'}</p></div>
    <div class="row"><button class="btn ghost" data-a="codex">Volver</button><button class="btn ${mine?'':'ghost'} sm" data-a="comps" data-i="mine">Tuyos</button><button class="btn ${mine?'ghost':''} sm" data-a="comps" data-i="all" ${cloudOn()&&CLOUD.user?'':'disabled title="Inicia sesión para ver los de todos"'}>De todos</button></div>
    <section class="panel"><div class="tablewrap"><table class="chart num comps"><thead><tr><td class="lbl">Escuadrón</td><td class="lbl">Combates</td><td class="lbl">Nota media</td><td class="lbl">S o S+</td><td class="lbl">Expediciones</td><td class="lbl">Mejor jornada</td><td class="lbl">Campañas</td></tr></thead><tbody>${body}</tbody></table></div></section>
    <p class="dim" style="font-size:13px">${GRADE_HELP}</p>`;
};
V.bossBoard = function(){
  const sel = CLOUD.bossSel || BOSSES[0], B=CLOUD.bossBoard, me=CLOUD.user&&CLOUD.user.id, mine=statsOf().rec[sel];
  return `<div><h2>Clasificación · Jefes</h2><p class="dim">La mejor nota de cada jugador contra cada cambiante en la temporada${CLOUD.season?' «'+esc(CLOUD.season.name)+'»':''}. Empate: menos rondas. Recluta no cuenta.</p></div>
    <div class="row"><button class="btn ghost sm" data-a="board" data-i="general">General</button><button class="btn ghost sm" data-a="board" data-i="hoy">Hoy</button><button class="btn sm" data-a="board" data-i="jefes">Jefes</button><button class="btn ghost" data-a="home">Volver</button></div>
    <div class="bosspick">${BOSSES.map(b=>`<button class="btn ${b===sel?'':'ghost'} sm" data-a="bossb" data-i="${b}">${TITANS[b].n.replace(/^Titán (de )?/,'')}${statsOf().rec[b]?' '+statsOf().rec[b].g:''}</button>`).join('')}</div>
    ${mine?`<p class="lbl">Tu récord en este dispositivo: ${gradeChip(mine.g)} ${mine.sc} puntos en ${mine.r} rondas con ${compName(mine.co)}</p>`:''}
    <section class="panel"><div class="tablewrap"><table class="chart num"><thead><tr><td class="lbl">#</td><td class="lbl">Jugador</td><td class="lbl">Nota</td><td class="lbl">Puntos</td><td class="lbl">Rondas</td><td class="lbl">Escuadrón</td></tr></thead><tbody>
    ${!B?'<tr><td colspan="6">Cargando…</td></tr>':!B.length?`<tr><td colspan="6">Nadie ha puesto nota todavía contra ${TITANS[sel].n}. El primero marca el listón.</td></tr>`
      :B.map((r,i)=>`<tr style="${r.user_id===me?'color:var(--gold)':''}"><td>${i+1}</td><td>${esc(r.display_name)}${r.diff==='veterano'?' <span class="chip" style="color:var(--blood-hi)">Veterano</span>':''}${r.ng?` <span class="chip pwc">Vuelta ${r.ng+1}</span>`:''}</td><td>${gradeChip(r.grade)}</td><td><b>${r.score}</b></td><td>${r.rounds}</td><td><div class="crow">${compIds(r.comp).map(x=>portrait(x)).join('')}</div></td></tr>`).join('')}
    </tbody></table></div></section>`;
};
