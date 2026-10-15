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
  bertolt:'Alto, callado y siempre un paso por detrás de Reiner. Es muy bueno en todo y nunca quiere destacar en nada.',
  kenny:'Capitán de la brigada antipersonal y el Ackerman más peligroso del interior. Dispara primero, con dos pistolas, y nunca explica para quién trabaja.',
  zeke:'Portador de la Bestia y hermano de Eren por parte de padre. Lanza piedras como si fueran balas y siempre parece saber algo que tú no.',
  pieck:'Estratega tranquila. Su artillería castiga a todo el frente y deja marcado al enemigo.'
};
const SAGA_N = i => SAGAS[i] ? SAGAS[i].n : '';
const BOSSES = SAGAS.flatMap(sg=>sg.zones.map(z=>z.boss));
const dodgePct = spd => (Math.max(0, Math.floor((spd-10)/3))+1)*5;
let fichaId = 'eren', compsTab = 'mine';

// ---- rejilla de personajes: se ve a todo el plantel y la ficha se abre al hacer clic ----
let fichaOpen = null;
V.ficha = function(){
  const ids=Object.keys(ROSTER), st=statsOf(), n=ids.filter(id=>codexSeen('s',id)).length;
  const card = id => { const R=ROSTER[id], h=st.ch[id], seen=codexSeen('s',id);
    return `<button class="pcard st-${R.st} ${seen?'':'new'} ${fichaOpen===id?'on':''}" data-a="ficha" data-i="${id}" aria-label="Ficha de ${R.n}">
      <span class="pc-art">${portrait(id,true)}<i class="sl"></i></span>
      <span class="pc-tx"><b>${R.n}</b><span class="lbl">${STYLE[R.st]}</span></span>
      ${h&&h.best?`<span class="pc-g">${gradeChip(gradeOf(h.best))}</span>`:''}
      <span class="pc-ft num">${h?`${h.f} combates · ${h.k} abatidos`:seen?'Sin combates':'Sin reclutar'}</span></button>`; };
  return `<div class="row"><button class="btn ghost" data-a="home">Volver</button><button class="btn ghost" data-a="codex">Códice</button></div>
    <div><h2>Fichas de personaje</h2><p class="dim">${n} de ${ids.length} reclutados alguna vez. Toca a cualquiera para abrir su ficha.</p></div>
    <div class="pgrid">${ids.map(card).join('')}</div>`;
};
// la ficha abierta vive fuera de #screen (que se anima con transform) para que el fondo fijo cubra toda la ventana
function fichaModal(){
  if(typeof document==='undefined') return;
  let host=document.getElementById('fmodal');
  const want = scr==='ficha' && fichaOpen && ROSTER[fichaOpen];
  if(!want){ if(host) host.remove(); document.body.classList.remove('fm-open'); return; }
  if(!host){ host=document.createElement('div'); host.id='fmodal'; host.className='fmodal'; host.setAttribute('role','dialog'); host.setAttribute('aria-modal','true'); document.body.appendChild(host);
    host.classList.add('anim'); setTimeout(()=>host.classList.remove('anim'), 400);
    host.addEventListener('click', ev=>{ if(ev.target===host) return act('fclose'); const b=ev.target.closest('[data-a]'); if(b && !b.disabled) act(b.dataset.a, b.dataset.i); }); }
  host.setAttribute('aria-label', 'Ficha de '+ROSTER[fichaOpen].n);
  host.innerHTML = `<div class="fm-in">${fichaBody(fichaOpen)}</div>`;
  document.body.classList.add('fm-open');
}
function fichaBody(fid){
  const ids=Object.keys(ROSTER), id=ROSTER[fid]?fid:'eren', R=ROSTER[id], i=ids.indexOf(id), st=statsOf(), h=st.ch[id], seen=codexSeen('s',id);
  const prev=ids[(i-1+ids.length)%ids.length], next=ids[(i+1)%ids.length];
  const e=EFF[R.st], up=Object.keys(e).find(k=>e[k]>1), dn=Object.keys(e).find(k=>e[k]<1);
  const lv=[1,15,30,45,60].map(l=>{ const m=1+.05*(l-1); return `<tr><td class="lbl">Nv ${l}</td><td>${Math.round(R.hp*m)}</td><td>${Math.round(R.atk*m)}</td></tr>`; }).join('');
  const tr=Object.entries(R.tr||{}).map(([k,v])=>[k, v+(STYLE_SKILL[R.st]===k?1:0)]), trS=STYLE_SKILL[R.st];
  if(trS && !tr.some(t=>t[0]===trS)) tr.push([trS,1]);
  const gd = h ? GRADE_ORDER.map(g=>({g, n:h.g[g]||0})) : [], gmax=Math.max(1,...gd.map(x=>x.n));
  const best = Object.entries(st.co).filter(([k,c])=>compIds(k).includes(id) && c.f>=2).sort((a,b)=>b[1].sc/b[1].f-a[1].sc/a[1].f).slice(0,3);
  const sk=R.sk, inn=BRINGS[id];
  return `<div class="row ficha-nav"><button class="btn ghost sm" data-a="ficha" data-i="${prev}" aria-label="Anterior">← ${ROSTER[prev].n}</button><button class="btn ghost sm" data-a="ficha" data-i="${next}" aria-label="Siguiente">${ROSTER[next].n} →</button><span class="spacer"></span>
      <button class="btn sm fm-x" data-a="fclose" aria-label="Cerrar ficha">Cerrar ✕</button></div>
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
}
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
      :B.map((r,i)=>`<tr style="${r.user_id===me?'color:var(--gold)':''}"><td>${i+1}</td><td>${r.xp!=null?lvBadge(r.xp,'xs')+' ':''}${esc(r.display_name)}${r.diff==='veterano'?' <span class="chip" style="color:var(--blood-hi)">Veterano</span>':''}${r.ng?` <span class="chip pwc">Vuelta ${r.ng+1}</span>`:''}</td><td>${gradeChip(r.grade)}</td><td><b>${r.score}</b></td><td>${r.rounds}</td><td><div class="crow">${compIds(r.comp).map(x=>portrait(x)).join('')}</div></td></tr>`).join('')}
    </tbody></table></div></section>`;
};

// ---- árbol de la historia: sagas, sendas, encrucijadas y finales (lo no descubierto, con pista) ----
const wrapTxt = (t, n) => { const w=t.split(' '), out=[]; let l=''; w.forEach(x=>{ if((l+' '+x).trim().length>n){ out.push(l.trim()); l=x; } else l+=' '+x; }); if(l.trim()) out.push(l.trim()); return out; };
V.arbol = function(){
  const M=meta(), u=M.unlocked, alts=altsSeen(), ends=M.endings||[], st=statsOf();
  const N = {   // c: columna, r: fila; seen: descubierto; h: pista del camino que lleva hasta allí
    s1:{c:0,r:1.5, t:SAGAS[0].n, sub:'Saga 1', seen:true},
    s2:{c:1,r:.6, t:SAGAS[1].n, sub:'Saga 2', seen:u>=2, h:'Vence la saga 1.'},
    caida:{c:1,r:2.6, t:ALT_SAGAS.caida.n, sub:'Senda · saga 2', seen:alts.includes('caida'), alt:1, ev:'Ragako · un titán de ojos verdes', h:'Sin descubrir.'},
    s3:{c:2,r:.6, t:SAGAS[2].n, sub:'Saga 3', seen:u>=3, h:'Vence la saga 2.'},
    reina:{c:2,r:2.6, t:ALT_SAGAS.reina.n, sub:'Senda · saga 3', seen:alts.includes('reina'), alt:1, ev:'Kenny · Frieda · Uri', h:'Sin descubrir.'},
    s4:{c:3,r:0, t:SAGAS[3].n, sub:'Saga 4', seen:u>=4, h:'Vence la saga 3.'},
    jaeger:{c:3,r:1.5, t:ALT_SAGAS.jaeger.n, sub:'Senda · saga 4', seen:alts.includes('jaeger'), alt:1, ev:'Floch al frente', h:'Sin descubrir.'},
    paradis:{c:3,r:3, t:ALT_SAGAS.paradis.n, sub:'Senda · saga 4', seen:alts.includes('paradis'), alt:1, ev:'El asedio de Zeke', h:'Sin descubrir.'},
    e_ret:{c:4,r:0, t:ENDINGS.retumbar.n, sub:'Final', seen:ends.includes('retumbar'), end:1, h:'Sin descubrir.'},
    e_coo:{c:4,r:1, t:ENDINGS.coordenada.n, sub:'Final', seen:ends.includes('coordenada'), end:1, h:'Sin descubrir.'},
    e_nue:{c:4,r:2, t:ENDINGS.nueve.n, sub:'Final', seen:ends.includes('nueve'), end:1, h:'Sin descubrir.'},
    e_par:{c:4,r:3, t:ENDINGS.paradis.n, sub:'Final', seen:ends.includes('paradis'), end:1, h:'Sin descubrir.'}
  };
  const E = [['s1','s2'],['s1','caida'],['s2','s3'],['s2','reina'],['caida','s3'],['caida','reina'],['s3','s4'],['s3','jaeger'],['s3','paradis'],['reina','s4'],
    ['s4','e_ret'],['s4','e_coo'],['s4','e_nue'],['jaeger','e_ret'],['jaeger','e_coo'],['paradis','e_par'],['paradis','e_nue']];
  const W=1100, H=470, cx=c=>20+c*222, cy=r=>20+r*112, bw=180, bh=96;
  const edge=([a,b])=>{ const A=N[a],B2=N[b], x1=cx(A.c)+bw, y1=cy(A.r)+bh/2, x2=cx(B2.c), y2=cy(B2.r)+bh/2, mx=(x1+x2)/2, on=A.seen&&B2.seen;
    return `<path d="M${x1} ${y1} C${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}" class="tedge ${on?'on':''} ${B2.alt?'alt':''}"/>`; };
  const node=(k)=>{ const n=N[k], x=cx(n.c), y=cy(n.r), lines = n.seen ? wrapTxt(n.t,20).slice(0,2) : ['???'];
    const foot = n.seen ? (n.ev||'') : (n.h||'');
    return `<g class="tnode ${n.seen?'seen':''} ${n.alt?'alt':''} ${n.end?'end':''}"><rect x="${x}" y="${y}" width="${bw}" height="${bh}" rx="10"/>
      <text x="${x+12}" y="${y+19}" class="tsub">${n.sub.toUpperCase()}</text>${lines.map((l,i)=>`<text x="${x+12}" y="${y+40+i*18}" class="ttl">${esc(l)}</text>`).join('')}
      ${wrapTxt(foot,30).slice(0,2).map((l,i)=>`<text x="${x+12}" y="${y+bh-22+i*13}" class="${n.seen?'tev':'thint'}">${esc(l)}</text>`).join('')}</g>`; };
  const met = id => codexSeen('s', id);
  const people = [['eren','Grisha Jaeger','El padre de Eren. Desapareció la noche en que cayó el muro.', null],
    ['historia','Familia Reiss','Una familia noble del interior con más secretos que tierras.', null],
    ['kenny', met('kenny')?'Kenny Ackerman':'???', met('kenny')?'Capitán de la brigada antipersonal. Ya lo conoces.':'Alguien a quien aún no has conocido.', 'kenny'],
    ['zeke', met('zeke')?'Zeke Jaeger':'???', met('zeke')?'Portador de la Bestia. Ya lo conoces.':'Alguien a quien aún no has conocido.', 'zeke'],
    ['bertolt','Bertolt Hoover','Recluta de la promoción 104, alto y callado.', null],
    ['floch','Floch Forster','Recluta superviviente con ideas muy claras sobre lo que necesita la isla.', null],
    ['erwin','Los que caen','Quién cae también cambia la historia.', null]];
  return `<div><h2>Árbol de la historia</h2><p class="dim">Lo que haces en cada expedición abre sendas y finales. Lo que aún no has descubierto sale como «???».</p></div>
    <div class="row"><button class="btn ghost" data-a="codex">Volver</button><span class="lbl">Sendas ${alts.length}/${Object.keys(ALT_SAGAS).length} · Finales ${ends.length}/${Object.keys(ENDINGS).length} · Epílogos ${(st.ep||[]).length}/${EPILOGUES.length}</span></div>
    <section class="panel tree"><div class="tree-wrap"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Árbol de sagas, sendas y finales">${E.map(edge).join('')}${Object.keys(N).map(node).join('')}</svg></div></section>
    <span class="lbl">Personajes de la historia</span>
    <div class="cards people">${people.map(([pid,n,d,rid])=>`<div class="card">${rid && !met(rid) ? '<span class="pt unk-pt"></span>' : portrait(pid)}<div><b>${n}</b><p class="dim">${d}</p></div></div>`).join('')}</div>`;
};

// ---- Intendencia: insignias, de dónde salen y en qué se gastan ----
V.intendencia = function(){
  const src=insigniaSources(), sh=shopOf(), have=insignias();
  const card = k => { const it=SHOP[k], own=sh.own.includes(k), eq=sh.eq[it.kind]===k, poor=!own && have<it.p;
    const art = it.kind==='dado' ? `<span class="dprev d20 sk-${k.slice(2)}">${D20}<b>20</b></span>` : it.kind==='marco' ? `<span class="fprev fr-${k.slice(2)}">${portrait('eren')}</span>` : `<span class="ch-ic">${UIC.bag}</span>`;
    return `<div class="card ishop k-${it.kind} ${own?'own':''} ${eq?'eq':''}">${own?`<span class="ribbon">${eq?'Equipado':'Tuyo'}</span>`:''}${art}
      <span class="lbl kind">${it.kind==='exp'?'Para la expedición':it.kind==='dado'?'Dado':'Marco'}</span><h3>${it.n}</h3><p>${it.d}</p>
      ${own ? (it.kind==='exp' ? '' : `<button class="btn ${eq?'':'ghost'} sm" data-a="shopeq" data-i="${k}">${eq?'Quitar':'Equipar'}</button>`)
            : `<button class="btn sm price-b" data-a="shopbuy" data-i="${k}" ${poor?'disabled':''}><span class="ins-ic"></span>${it.p}${poor?` <small>· te faltan ${it.p-have}</small>`:''}</button>`}</div>`; };
  return `<div class="row"><button class="btn ghost" data-a="home">Volver</button></div>
    ${hero('Intendencia', 'Insignias del Cuerpo', 'Salen de lo que has conseguido y no se pierden. Se cambian por ventajas para empezar mejor y por estética; nada sube las estadísticas en bruto. Las monedas de cada expedición son aparte y se gastan en el mercader del mapa.',
      {cls:'intd', art:'', side:`<div class="sh-side medal"><i class="sl"></i><b class="num">${have}</b><span class="lbl">insignias</span><small class="num">${insigniasEarned()} ganadas · ${sh.spent} gastadas</small></div>`})}
    <span class="lbl sect">Cómo se ganan</span>
    <div class="isrc">${src.map(x=>`<div class="${x.v?'on':''}"><b class="num">${x.v}</b><span>${x.n}</span><small>${x.d}</small></div>`).join('')}</div>
    <span class="lbl sect">Para la expedición</span><div class="cards ishops">${Object.keys(SHOP).filter(k=>SHOP[k].kind==='exp').map(card).join('')}</div>
    <span class="lbl sect">Estética</span><div class="cards ishops">${Object.keys(SHOP).filter(k=>SHOP[k].kind!=='exp').map(card).join('')}</div>`;
};

// ---- amigos y duelos ----
let DPICK = null;   // rival elegido: {foe, foeName, foeCloud}
const newDuels = () => ((CLOUD.fr&&CLOUD.fr.duels)||[]).filter(d=>!d.i_challenged && Date.parse(d.created_at) > (meta().duelSeen||0)).length;
V.amigos = function(){
  const F=CLOUD.fr, on=cloudOn()&&CLOUD.user, mine=legendsLocal();
  const fr = F&&F.friends||[], acc=fr.filter(f=>f.status==='accepted'), pend=fr.filter(f=>f.status==='pending');
  const legOf = uid => (F&&F.legends||[]).filter(l=>l.user_id===uid);
  const hist = (F&&F.duels||[]).map(d=>{ const won = d.i_challenged ? d.win : !d.win, other = d.i_challenged ? d.defender_name : d.challenger_name;
    const again = d.i_challenged ? d.legend_d : d.legend_c;
    return `<tr><td>${new Date(d.created_at).toLocaleDateString('es-ES',{day:'numeric',month:'short'})}</td><td>${d.i_challenged?'Retaste a':'Te retó'} <b>${esc(other)}</b></td><td class="${won?'okt':'kot'}">${won?'Victoria':'Derrota'}</td><td>${d.grade?gradeChip(d.grade):''} <span class="dim">${d.rounds} rondas</span></td><td>${again?`<button class="btn ghost sm" data-a="retar" data-i="${again}">Revancha</button>`:''}</td></tr>`; }).join('');
  return `<div><h2>Amigos y duelos</h2><p class="dim">Reta a tus amigos con un escuadrón de leyenda: el que terminó una campaña, con sus niveles, poderes y mejoras. Tú mandas a los tuyos; los suyos pelean solos.</p></div>
    <div class="row"><button class="btn ghost" data-a="home">Volver</button>${on?`<button class="btn ghost sm" data-a="amigos">Actualizar</button>`:''}</div>
    ${!cloudOn() ? '<section class="panel"><p>Los duelos con amigos necesitan la versión con cuentas.</p></section>' : !CLOUD.user ? `<section class="panel"><p>Inicia sesión para tener código de amigo y retar a otros.</p>${accountHTML('end')}</section>` : `
    <section class="panel fr-top"><div><span class="lbl">Tu código de amigo</span><div class="fcode num">${F&&F.code?esc(F.code):'…'}</div><span class="dim" style="font-size:13px">Pásaselo a quien quieras retar.</span></div>
      <div><label class="lbl" for="fcode">Añadir por código</label><div class="row"><input id="fcode" maxlength="8" placeholder="ABC123" autocomplete="off" style="text-transform:uppercase"><button class="btn sm" data-a="addfriend">Añadir</button></div>${F&&F.msg?`<span class="lbl" style="color:var(--gold)">${esc(F.msg)}</span>`:''}</div></section>
    ${pend.length?`<section class="panel"><span class="lbl">Solicitudes</span>${pend.map(f=>`<div class="frow"><b>${esc(f.display_name)}</b>${f.mine?'<span class="dim">Esperando a que acepte</span>':`<button class="btn sm" data-a="frok" data-i="${f.friend_id}">Aceptar</button><button class="btn ghost sm" data-a="frno" data-i="${f.friend_id}">Rechazar</button>`}</div>`).join('')}</section>`:''}
    <span class="lbl">Amigos · ${acc.length}</span>
    ${!F||F.loading&&!acc.length ? '<p class="dim">Cargando…</p>' : !acc.length ? '<p class="dim">Aún no tienes amigos añadidos.</p>' : acc.map(f=>{ const L=legOf(f.friend_id);
      return `<section class="panel friend"><div class="frow">${f.xp!=null?lvBadge(f.xp,'sm'):''}<b>${esc(f.display_name)}</b><span class="num">${f.wins} – ${f.losses}</span></div>
        ${L.length ? `<div class="cards">${L.slice(0,4).map(l=>legendHTML(l,'retar',`<span class="lbl" style="color:var(--gold)">Retar</span>`)).join('')}</div>` : '<p class="dim">Todavía no tiene ninguna leyenda: tiene que terminar una campaña.</p>'}</section>`; }).join('')}
    ${hist?`<span class="lbl">Últimos duelos</span><section class="panel"><div class="tablewrap"><table class="chart num">${hist}</table></div></section>`:''}`}
    <span class="lbl">Tus leyendas · ${mine.length}</span>
    ${mine.length ? `<div class="cards">${mine.map(l=>legendHTML(l,'practica',`<span class="lbl">${l.cloud?'Guardada en tu cuenta':'Solo en este dispositivo'} · entrenar contra ella</span>`)).join('')}</div>` : '<p class="dim">Termina una campaña y el escuadrón que llegue al final se convierte en tu primera leyenda.</p>'}`;
};
V.duelpick = function(){
  const mine=legendsLocal();
  return `<div><span class="lbl">Duelo</span><h2>Contra ${esc(DPICK.foeName)}</h2><p class="dim">Su leyenda «${esc(DPICK.foe.name)}». Elige con cuál de las tuyas sales.</p></div>
    <div class="cards">${legendHTML(DPICK.foe, null)}</div>
    <div class="row"><button class="btn ghost" data-a="amigos">Volver</button></div>
    <span class="lbl">Tus leyendas</span><div class="cards">${mine.map(l=>legendHTML(l,'duelgo',`<span class="lbl" style="color:var(--gold)">Salir con esta</span>${DPICK.foeCloud&&!l.cloud?'<span class="dim" style="font-size:12px">No está en tu cuenta: el resultado no contará.</span>':''}`)).join('')}</div>`;
};
V.duelres = function(){
  const D=DUEL, G=D&&D.result; if(!G) return '<div><button class="btn" data-a="amigos">Volver</button></div>';
  return `<section class="hero"><div class="txt"><span class="lbl">Duelo · ${esc(D.mine.name)} contra ${esc(D.foe.name)}</span>
      <h1>${G.won?'<em>Victoria</em>':'Derrota'}</h1><p>${G.won?`El escuadrón de ${esc(D.foeName)} cae en ${G.rounds} rondas.`:`El escuadrón de ${esc(D.foeName)} os supera.`}${D.cloud?' El resultado queda en vuestro historial.':''}</p>
      <div class="row"><button class="btn" data-a="duelagain">Revancha</button><button class="btn ghost" data-a="amigos">Amigos y duelos</button></div></div>
      <div class="peek">${duelArt(D.foe.squad.s[0].id)}</div></section>${G.won?gradeHTML(G):''}`;
};

// ---- nivel de cuenta: rango, órdenes, de dónde sale la experiencia ----
V.nivel = function(){
  ensureXp(); const M=meta(), xp=xpTotal(), L=levelOf(xp), r=rankOf(L.lv), N=ordersNow(), tl=titlesFor(L.lv);
  const ord = (x, v) => `<div class="ord ${x.done?'done':''}"><span class="ord-t"><b>${x.n}</b><span class="xpbar"><i style="width:${Math.round(x.p/x.goal*100)}%"></i></span></span><span class="num lbl">${x.done?'Cumplida':`${x.p}/${x.goal}`} · +${v} XP</span></div>`;
  const ladder = RANKS.map((k,i)=>{ const nx=RANKS[i+1], on=L.lv>=k.min; return `<div class="rk ${on?'on':''} ${k===r?'cur':''}">${lvBadge(levelXp(k.min),'')}<b>${k.n}</b><span class="lbl num">Nivel ${k.min}${nx?`–${nx.min-1}`:'+'}</span></div>`; }).join('');
  const log = (M.xpLog||[]).slice(0,12).map(g=>`<tr><td>${esc(g.n)}</td><td class="num" style="text-align:right"><b>+${g.v}</b></td></tr>`).join('');
  return `<div class="row"><button class="btn ghost" data-a="home">Volver</button></div>
    ${hero('Nivel de cuenta', `Nivel ${L.lv} · ${r.n}`, `${L.into.toLocaleString('es-ES')} de ${L.need.toLocaleString('es-ES')} XP para el siguiente nivel · ${xp.toLocaleString('es-ES')} XP en total${tl.length?` · Título: «${tl[tl.length-1]}»`:''}`,
      {cls:'lvhero rk-'+r.k, art:'', side:`<div class="sh-side lvside"><i class="sl"></i>${lvBadge(xp,'xl')}</div>`})}
    <span class="lbl sect">Órdenes de hoy</span><div class="ords">${N.daily.map(x=>ord(x, ORD_XP.d)).join('')}</div>
    <span class="lbl sect">Órdenes de la semana</span><div class="ords">${N.weekly.map(x=>ord(x, ORD_XP.s)).join('')}</div>
    <span class="lbl sect">Rangos</span><div class="ladder">${ladder}</div>
    <span class="lbl sect">De dónde sale la experiencia</span>
    <div class="isrc xs">${XP_SRC.map(x=>`<div class="on"><span>${x.n}</span><small>${x.d}</small></div>`).join('')}</div>
    ${log?`<span class="lbl sect">Últimas sumas</span><section class="panel"><div class="tablewrap"><table class="chart num">${log}</table></div></section>`:''}
    <p class="dim" style="font-size:13px">Cada nivel da 5 insignias para la Intendencia y cada pocos niveles, un título. ${cloudOn()&&CLOUD.user?'Tu experiencia se guarda en la nube.':'Sin sesión, la experiencia se guarda solo en este navegador; al entrar se sube a tu cuenta.'}</p>`;
};
function levelXp(lv){ let x=0; for(let i=1;i<lv;i++) x+=xpNeed(i); return x; }
