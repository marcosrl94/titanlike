// ---------- Efectos de combate ----------
const $ = id=>document.getElementById(id);
const NS = 'http://www.w3.org/2000/svg';
const REDUCED = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
let fast = !!store.get('fast');
const animK = () => REDUCED || CFG.calm ? .15 : Math.min(ANIM[CFG.anim] ? ANIM[CFG.anim].k : 1, fast ? .5 : 1);
const sleep = ms => new Promise(r=>setTimeout(r, ms*animK()));
const FXON = () => !(REDUCED || CFG.calm);   // partículas y sacudidas: fuera en modo tranquilo o con movimiento reducido
const U = u => document.querySelector(`[data-u="${u}"]`);   // el primero: en combate, el sprite del escenario
const UA = u => Array.from(document.querySelectorAll(`[data-u="${u}"]`));   // sprite y tarjeta
const at = (el, fy=.4) => { const r=el.getBoundingClientRect(); return {x:r.left+r.width/2, y:r.top+r.height*fy}; };
function cls(el, c, ms=420){ if(!el || ((c==='shake'||c==='quake'||c==='punch') && (!CFG.shake || !FXON()))) return; el.classList.remove(c); void el.offsetWidth; el.classList.add(c); setTimeout(()=>el.classList.remove(c), ms); }
// las piezas nuevas duran según la velocidad de animación (variable --k en la capa de efectos)
function add(tag, c, css, ms){ const d=document.createElement(tag); d.className=c; for(const k in (css||{})) k.startsWith('--') ? d.style.setProperty(k, css[k]) : (d.style[k]=css[k]); $('fx').appendChild(d); setTimeout(()=>d.remove(), ms); return d; }
const addK = (tag, c, css, ms) => add(tag, c, css, Math.max(200, ms*animK()));
function float(p, txt, c=''){ add('div', 'float '+c, {left:p.x+'px', top:p.y+'px'}, 1000).textContent = txt; }
function flash(color, o=.6){ if(!CFG.flash || !FXON()) return; add('div', 'flash', {background:color}, 420).style.setProperty('--o', o); }
function line(a, b, c, ms=620){
  const l=document.createElementNS(NS,'line');
  l.setAttribute('x1',a.x); l.setAttribute('y1',a.y); l.setAttribute('x2',b.x); l.setAttribute('y2',b.y);
  l.setAttribute('class', c); l.style.setProperty('--len', Math.hypot(b.x-a.x, b.y-a.y));
  $('fxsvg').appendChild(l); setTimeout(()=>l.remove(), ms);
}
function stageBox(){ const s=document.querySelector('.stage'); const r = s ? s.getBoundingClientRect() : {left:0, top:0, width:innerWidth, height:innerHeight}; return {l:r.left, t:r.top, w:r.width, h:r.height, r:r.left+r.width, b:r.top+r.height}; }
// ---- primitivas ----
function steam(p, n=9, color){ if(!FXON()) return; for(let i=0;i<n;i++) add('div','puff',{left:(p.x+rnd(-50,50))+'px', top:(p.y+rnd(-10,70))+'px', animationDelay:rnd(0,.25)+'s', '--dx':rnd(-40,40)+'px', background:color||''}, 1400); }
function sparks(p, n=10, color='var(--bone)', dist=80){ if(!FXON()) return; for(let i=0;i<n;i++){ const a=rnd(0,360); addK('i','spark',{left:p.x+'px', top:p.y+'px', background:color, '--a':a+'deg', '--d':rnd(dist*.5,dist)+'px'}, 600); } }
function ring(p, color='var(--gold)', size=260, delay=0){ if(!FXON()) return; addK('div','ring',{left:p.x+'px', top:p.y+'px', borderColor:color, '--s':size+'px', animationDelay:delay+'s'}, 900+delay*1000); }
function vignette(color, ms=1000){ if(!FXON()) return; addK('div','vig',{'--c':color}, ms); }
function heat(ms=1100){ if(!FXON()) return; addK('div','heat',{}, ms); }
function quake(ms=900){ cls($('screen'),'quake', ms*animK()); }
function punch(){ cls($('screen'),'punch', 260); }
function shards(p, n=14, color='#bfeaf5', dist=140){ if(!FXON()) return; for(let i=0;i<n;i++) addK('i','shard',{left:p.x+'px', top:p.y+'px', background:color, '--a':rnd(0,360)+'deg', '--d':rnd(dist*.4,dist)+'px', '--r':rnd(-200,200)+'deg'}, 900); }
function rocks(n=10, color='#7d6a55'){ if(!FXON()) return; const B=stageBox(); for(let i=0;i<n;i++){ const x=B.l+rnd(.05,.95)*B.w, d=rnd(0,.5);
  addK('i','rock',{left:x+'px', top:(B.t-40)+'px', background:color, '--y':(B.h*rnd(.55,.95))+'px', '--r':rnd(-300,300)+'deg', width:rnd(14,34)+'px', height:rnd(12,28)+'px', animationDelay:d+'s'}, 1300+d*1000); } }
function spikes(n=9, color='#eef3f7'){ if(!FXON()) return; const B=stageBox(); for(let i=0;i<n;i++){ const d=i*.05; addK('i','spike',{left:(B.l+B.w*(.08+.84*i/(n-1))+rnd(-10,10))+'px', top:B.b+'px', background:color, '--h':(B.h*rnd(.25,.55))+'px', animationDelay:d+'s'}, 1200+d*1000); } }
function pillar(p, color='#cfe7ff'){ if(!FXON()) return; addK('div','pillar',{left:p.x+'px', '--c':color}, 1400); }
function claws(p, color='var(--blood-hi)'){ if(!FXON()) return; for(let i=-1;i<=1;i++) line({x:p.x-40+i*16, y:p.y-44}, {x:p.x+30+i*16, y:p.y+40}, 'claw', 700); }
function dust(p, n=8){ if(!FXON()) return; for(let i=0;i<n;i++) addK('i','dust',{left:(p.x+rnd(-60,60))+'px', top:p.y+'px', '--dx':rnd(-90,90)+'px', animationDelay:rnd(0,.15)+'s'}, 1000); }
function banner(title, sub, color='var(--gold)', ms=1900){ const d=addK('div','cine'+(FXON()?'':' still'),{'--c':color}, ms); d.innerHTML=`<i class="cb t"></i><i class="cb b"></i><div class="ttl"><small>${sub||''}</small><b>${title}</b></div>`; return d; }
function boltAt(p, w){
  let x=p.x+rnd(-30,30), y=0, pts=`${x},0`;
  while(y<p.y-40){ y+=rnd(30,60); x+=rnd(-34,34); pts+=` ${x},${Math.min(y,p.y)}`; }
  pts+=` ${p.x},${p.y}`;
  const l=document.createElementNS(NS,'polyline'); l.setAttribute('points',pts); l.setAttribute('class','bolt'+(w?' big':'')); $('fxsvg').appendChild(l); setTimeout(()=>l.remove(),650);
}
// ---- el dado: un d20 que entra rodando, cambia de cara y se para en la tirada ----
const D20 = `<svg viewBox="-50 -50 100 100" aria-hidden="true"><polygon class="f" points="0,-47 41,-23.5 41,23.5 0,47 -41,23.5 -41,-23.5"/><polygon class="in" points="0,-24 21,13 -21,13"/><path class="e" d="M0,-47 L0,-24 M41,-23.5 L0,-24 M41,-23.5 L21,13 M41,23.5 L21,13 M0,47 L21,13 M0,47 L-21,13 M-41,23.5 L-21,13 M-41,-23.5 L-21,13 M-41,-23.5 L0,-24"/></svg>`;
// o: {mod, tone:'crit'|'bad'|'ok'|'', tag, side}
function die(p, r, o={}){
  if(!CFG.dice) return Promise.resolve();
  const k=animK(), roll = FXON() && k>.2, land = roll ? (o.quick?240:430)*k : 0;
  const d=add('div','d20'+(roll?' roll':' still'),{left:p.x+'px', top:p.y+'px', '--k':k}, land+1150*Math.max(k,.5));
  d.innerHTML = `${D20}<b>${roll?1+Math.floor(Math.random()*20):r}</b>${o.mod?`<small>+${o.mod}</small>`:''}`;
  const b=d.querySelector('b');
  if(roll){ sfx('dice'); const iv=setInterval(()=>{ b.textContent = 1+Math.floor(Math.random()*20); }, 55); setTimeout(()=>clearInterval(iv), land); }
  return new Promise(res=>setTimeout(()=>{ b.textContent=r; d.classList.add('land'); if(o.tone) d.classList.add(o.tone);
    if(o.tag){ const t=document.createElement('em'); t.textContent=o.tag; d.appendChild(t); }
    if(o.tone==='crit'){ sparks(p, 12, 'var(--gold)', 70); sfx('nat20'); } else if(o.tone==='bad') sfx('fumble'); else sfx('land');
    res(); }, land));
}
// tiradas de habilidad fuera de combate (eventos): se animan al aparecer en pantalla
function rollDice(root){
  const L=(root||document).querySelectorAll('.d20.ev:not(.done)'); if(L.length && S && S.pend) S.pend.diceShown=true;
  L.forEach((d,i)=>{
    d.classList.add('done'); const r=+d.dataset.r, b=d.querySelector('b'), k=animK(), roll=FXON() && k>.2, land=(roll?650*k:0)+i*260*k;
    if(roll){ d.classList.add('roll'); d.style.setProperty('--k',k); d.style.animationDelay=(i*.26*k)+'s'; setTimeout(()=>sfx('dice'), i*260*k); const iv=setInterval(()=>{ b.textContent=1+Math.floor(Math.random()*20); }, 55); setTimeout(()=>clearInterval(iv), land); }
    setTimeout(()=>{ b.textContent=r; d.classList.add('land'); const res=d.parentElement.querySelector('.dres'); if(res) res.classList.add('show'); sfx(d.classList.contains('crit')?'nat20':d.classList.contains('bad')?'fumble':'land'); }, land);
  });
}
function setHp(u, hp, max){ UA(u).forEach(el=>{ const b=el.querySelector('.bar i'), n=el.querySelector('.hpn'); if(b) b.style.width=(hp/max*100)+'%'; if(n) n.textContent=`${hp} / ${max} PV`; }); }
function logLine(m){ if(!m) return; C.log.push(m); if(C.log.length>4) C.log.shift(); const L=$('log'); if(L) L.innerHTML=C.log.map(l=>`<div>${l}</div>`).join(''); }
function busyUI(){ const o=$('orders'), h=$('hint'); if(o) o.hidden=true; if(h) h.textContent='…'; document.querySelectorAll('.pick').forEach(e=>e.classList.remove('pick')); }

// ---- cada cambiante tiene su firma: entrada, ataques especiales y transformación ----
const BFX = {
  col:  {c:'#e8743b', sub:'Muralla de Trost', intro:p=>{ boltAt(p,1); flash('#ffb37a',.8); heat(1400); steam(p,22,'#f3d6b8'); ring(p,'#e8743b',420); quake(1100); sfx('boom'); },
         sp:(k,p)=>{ heat(); steam(p,16,'#f3d6b8'); ring(p,'#e8743b',380); flash('#ffb37a',.5); sfx('steam'); }},
  hem:  {c:'#9fd8e8', sub:'Expedición 57', intro:p=>{ boltAt(p,1); flash('#e6fbff',.8); shards(p,22,'#c9f1fb',180); ring(p,'#9fd8e8',360); quake(700); sfx('crystal'); },
         sp:(k,p)=>{ if(k==='harden'){ shards(p,14,'#c9f1fb',110); sfx('crystal'); } else if(k==='kick'){ ring(p,'#9fd8e8',220); punch(); } }},
  bes:  {c:'#a0805a', sub:'Castillo de Utgard', intro:p=>{ boltAt(p,1); flash('var(--bone)',.6); rocks(14); quake(1300); sfx('rocks'); },
         sp:(k,p)=>{ if(k==='aoe'){ rocks(16); quake(1000); sfx('rocks'); } else if(k==='throw'){ dust(p,6); sfx('roar'); } }},
  aco:  {c:'#d9c27a', sub:'Muro Rose', intro:(p,el)=>{ boltAt(p,1); flash('#fff1c4',.8); cls(el,'sheen',900); ring(p,'#d9c27a',380); quake(1100); sfx('boom'); },
         sp:(k,p)=>{ if(k==='aoe'){ const B=stageBox(); dust({x:B.l+B.w*.5, y:B.b-20},14); quake(900); sfx('boom'); } else if(k==='coraza'){ shards(p,10,'#e9d79a',90); sfx('crystal'); } }},
  son:  {c:'#c0392b', sub:'Llanura de los gigantes', intro:p=>{ vignette('rgba(120,10,10,.75)',1600); quake(1200); sfx('roar'); },
         sp:(k,p)=>{ if(k==='devour'){ vignette('rgba(150,10,10,.7)',1000); sfx('roar'); } }},
  rod:  {c:'#ff8a3d', sub:'Distrito de Orvud', intro:p=>{ heat(2000); flash('#ffcf9a',.7); steam(p,26,'#f8c79a'); quake(1600); sfx('roar'); },
         sp:(k,p)=>{ heat(900); steam(p,10,'#f8c79a'); }},
  mar:  {c:'#eef3f7', sub:'Liberio', intro:p=>{ spikes(11); shards(p,16,'#f4f8fb',160); flash('#ffffff',.6); sfx('crystal'); },
         sp:(k,p)=>{ if(k==='aoe'){ spikes(11); sfx('crystal'); } else if(k==='harden'){ shards(p,10,'#f4f8fb',90); sfx('crystal'); } }},
  man:  {c:'#d9c27a', sub:'Fuerte Salta', intro:p=>{ boltAt(p,1); flash('#fff1c4',.6); claws(p); sparks(p,16,'var(--gold)',120); sfx('crit'); },
         sp:(k,p)=>{ if(k==='devour'){ claws(p); vignette('rgba(150,10,10,.55)',800); } }},
  fun:  {c:'#cfe7ff', sub:'El Retumbar', intro:p=>{ pillar(p,'#cfe7ff'); quake(2200); flash('#e9f3ff',.7); const B=stageBox(); dust({x:B.l+B.w*.5, y:B.b-16},22); sfx('rumble'); },
         sp:(k,p)=>{ if(k==='aoe'){ quake(1300); const B=stageBox(); dust({x:B.l+B.w*.5, y:B.b-16},18); ring({x:B.l+B.w*.5, y:B.b-30},'#cfe7ff',600); sfx('rumble'); } else if(k==='summon'){ pillar(p,'#cfe7ff'); } }},
  // transformaciones sin jefe propio
  atq:  {c:'#7cc08f', intro:p=>{ steam(p,14); ring(p,'#7cc08f',320); sfx('roar'); }},
  car:  {c:'#b9a27a', intro:p=>{ steam(p,10); ring(p,'#b9a27a',260); dust(p,8); }}
};
BFX.col2 = Object.assign({}, BFX.col, {sub:'Muro María', intro:(p,el)=>{ BFX.col.intro(p,el); setTimeout(()=>ring(p,'#ffcf9a',560), 300*animK()); }});
BFX.hem2 = Object.assign({}, BFX.hem, {sub:'Distrito de Stohess'});
BFX.aco2 = Object.assign({}, BFX.aco, {sub:'Shiganshina'});
const tAt = i => { const t=U('t'+i); return t ? at(t,.35) : null; };

const FX = {
  // presentación del jefe: franjas de cine, nombre y su efecto propio
  async intro(e){
    const t=C.titans[e.t], el=U('t'+e.t); if(!t || !el) return; const B=BFX[t.id]||{c:'var(--blood-hi)'}, p=at(el,.35);
    cls(el,'rise',1100); banner(t.n, B.sub||'Cambiante', B.c, 2100); await sleep(380);
    if(B.intro) B.intro(p, el); else { flash('var(--bone)',.4); quake(800); sfx('roar'); }
    await sleep(1300);
  },
  async duel(e){ logLine(e.m); banner(`${e.a}  ×  ${e.b}`, 'Duelo', 'var(--gold)', 2000); sfx('roar'); flash('var(--gold)',.35); await sleep(1500); },
  async shift(e){
    const s=U('s'+e.s); logLine(e.m); if(!s) return;
    const p=at(s,.4), B=BFX[e.art]||{};
    vignette('rgba(0,0,0,.65)', 900); await sleep(220);
    boltAt(p,1); setTimeout(()=>boltAt({x:p.x+rnd(-24,24), y:p.y}), 90); sfx('bolt'); flash('var(--gold)',.9); quake(700); ring(p,'var(--gold)',340); steam(p,16);
    UA('s'+e.s).forEach(el=>{ const pt=el.querySelector('.pt'); if(pt){ pt.classList.add('tf'); pt.innerHTML=titanArt(e.art); } cls(el,'grow',900); cls(el,'glow',720); });
    banner(e.txt, 'Transformación', B.c||'var(--gold)', 1500);
    await sleep(320); if(B.intro) B.intro(p, s); await sleep(700);
  },
  async hurt(e){ const s=U('s'+e.s); if(!s) return; float(at(s,.35), '-'+e.d, 'bad'); setHp('s'+e.s, e.hp, e.max); await sleep(300); },
  async roarAll(e){ logLine(e.m); sfx('roar'); flash('var(--bone)',.35); quake(600);
    if(e.txt==='HUMO'){ document.querySelectorAll('.titan:not(.dead)').forEach(t=>steam(at(t,.3), 12, '#9aa39c')); }
    if(e.txt==='EL GRITO'){ const s=document.querySelector('.spr.active'); if(s) pillar(at(s,.3),'#cfe7ff'); }
    document.querySelectorAll('.titan:not(.dead)').forEach(t=>{ cls(t,'struck'); float(at(t,.2), e.txt, 'tag'); }); await sleep(800); },
  async say(e){ logLine(e.m); await sleep(e.w||260); },
  async slash(e){
    const s=U('s'+e.s), t=U('t'+e.t); logLine(e.m); if(!s||!t) return;
    const a=at(s,.3), b=at(t,.3);
    // el dado rueda junto al titán mientras el soldado se lanza
    const dz = e.roll ? die({x:b.x+70, y:b.y-60}, e.roll, {quick:e.chain, tone:e.crit?'crit':e.fumble?'bad':'', tag:e.auto?'OLFATO':e.crit?'CRÍTICO':e.fumble?'RESBALA':''}) : null;
    UA('s'+e.s).forEach(el=>cls(el,'lunge')); line(a,b,'wire');
    if(dz) await dz; else await sleep(150);
    sfx(e.boom?'boom':e.crit?'crit':'slash');
    const dx=50*(Math.random()<.5?-1:1);
    line({x:b.x-dx,y:b.y-38},{x:b.x+dx,y:b.y+38},'slash'+(e.crit?' crit':''));
    if(e.crit) setTimeout(()=>line({x:b.x+dx,y:b.y-30},{x:b.x-dx,y:b.y+34},'slash crit'), 70);
    sparks(b, e.crit?16:8, e.crit?'var(--gold)':'var(--bone)', e.crit?110:70);
    if(e.crit){ punch(); flash('var(--gold)',.25); }
    if(e.boom){ flash('var(--gold)',.7); quake(500); ring(b,'var(--gold)',260); steam(b,8,'#cbb68a'); }
    UA('t'+e.t).forEach(el=>cls(el,'struck')); float(b, e.d, e.crit?'crit':e.fumble?'meh':''); setHp('t'+e.t, e.hp, e.max);
    if(e.exec) float({x:b.x, y:b.y-50}, 'NUCA', 'tag');
    if(e.kill){ UA('t'+e.t).forEach(el=>el.classList.add('dying')); steam(b, e.boss?28:12); sfx('steam');
      if(e.boss){ flash('#ffffff',.7); quake(1000); ring(b,'var(--bone)',480); banner('ABATIDO', C.titans[e.t].n, 'var(--gold)', 1500); await sleep(1100); }
      await sleep(560); } else await sleep(e.chain?200:320);
  },
  async bite(e){
    const t=U('t'+e.t), s=U('s'+e.s); logLine(e.m); if(!t||!s) return;
    const p=at(s,.35); cls(t,'chomp');
    const dz = e.roll ? die({x:p.x+46, y:p.y-62}, e.roll, {mod:e.mod, tone:e.roll===1?'bad':''}) : null;
    if(dz) await dz; else await sleep(210);
    sfx('hit'); UA('s'+e.s).forEach(el=>cls(el,'struck')); cls($('screen'),'shake'); flash('var(--blood)', e.big?.45:.28);
    claws(p); if(e.big){ vignette('rgba(150,10,10,.5)',700); sparks(p,10,'var(--blood-hi)',70); }
    float(p, '-'+e.d, 'bad'); setHp('s'+e.s, e.hp, e.max);
    if(e.dead) UA('s'+e.s).forEach(el=>el.classList.add('dead'));
    await sleep(400);
  },
  async miss(e){ const t=U('t'+e.t), s=U('s'+e.s); logLine(e.m); if(!t||!s) return; const p=at(s,.35); cls(t,'chomp');
    const dz = e.roll ? die({x:p.x+46, y:p.y-62}, e.roll, {mod:e.mod, tone:'ok', tag:'ESQUIVA'}) : null;
    if(dz) await dz; else await sleep(210);
    sfx('miss'); UA('s'+e.s).forEach(el=>cls(el,'dodge',460)); float(p, e.txt, 'tag'); await sleep(380); },
  async buff(e){ logLine(e.m); sfx(e.stun?'hit':'buff'); e.ids.forEach(id=>{ const s=U('s'+id); if(s){ const p=at(s,.4);
    if(e.stun){ UA('s'+id).forEach(el=>cls(el,'tossed',700)); dust(p,6); } else { UA('s'+id).forEach(el=>cls(el,'glow',720)); ring(p,'var(--cloak-hi)',120); }
    float(at(s,.3), e.txt, 'tag'); } }); await sleep(e.stun?640:520); },
  async heal(e){ const s=U('s'+e.s); logLine(e.m); if(!s) return; sfx('heal'); UA('s'+e.s).forEach(el=>cls(el,'glow',720)); const p=at(s,.4);
    if(FXON()) for(let i=0;i<7;i++) addK('i','plus',{left:(p.x+rnd(-26,26))+'px', top:(p.y+rnd(0,20))+'px', animationDelay:rnd(0,.3)+'s'}, 1100);
    float(at(s,.35), '+'+e.d, 'good'); setHp('s'+e.s, e.hp, e.max); await sleep(480); },
  async mark(e){ const t=U('t'+e.t); logLine(e.m); if(!t) return; const p=at(t,.25);
    if(e.fx==='break'){ shards(p,18,'#e9d79a',160); flash('#fff1c4',.5); sfx('shatter'); punch(); }
    else if(e.fx==='blind'){ sparks(p,8,'#cfd8d2',50); sfx('buff'); }
    else if(e.fx==='stun'){ dust(at(t,.95),10); quake(400); sfx('boom'); }
    else { ring(p,'var(--gold)',140); sfx('buff'); }
    float(p, e.txt, 'tag'); await sleep(e.fx==='break'?620:420); },
  async roar(e){ const t=U('t'+e.t); logLine(e.m); if(!t) return; const ti=C.titans[e.t], p=at(t,.3), B=ti && BFX[ti.id];
    sfx(e.fx==='harden'||e.fx==='coraza'?'crystal':'roar'); cls(t,'chomp'); cls($('screen'),'shake');
    if(e.fx==='phase'){ vignette('rgba(150,10,10,.6)',1200); ring(p,'var(--blood-hi)',420); quake(900); banner('SEGUNDA FASE', ti?ti.n:'', 'var(--blood-hi)', 1400); await sleep(500); }
    else if(B && B.sp) B.sp(e.fx, p);
    else if(e.fx==='aoe'){ quake(700); dust(at(t,.95),10); }
    else if(e.fx==='harden'){ cls(t,'sheen',900); }
    if(e.fx==='throw'||e.fx==='kick'){ const s=U('s'+e.s); if(s) line(p, at(s,.4), 'wire', 500); }
    float(at(t,.15), e.txt, 'tag'); await sleep(e.fx==='aoe'?700:540); },
  async summon(e){ logLine(e.m); render(); const t=U('t'+e.t); sfx('roar'); if(t){ const p=at(t,.4); pillar(p,'#cfe7ff'); dust(at(t,.95),10); cls(t,'rise',1100); float(at(t,.2), e.txt, 'tag'); } await sleep(700); },
  async bolt(e){ const s=U('s'+e.s); logLine(e.m); if(!s) return; const p=at(s,.4); boltAt(p,1); sfx('bolt'); flash('var(--gold)',.8); quake(500); cls(s,'glow',720); await sleep(260); float(p, 'TITÁN DE ATAQUE', 'tag'); await sleep(520); }
};
function play(done){
  $('fx').style.setProperty('--k', animK());
  // golpes encadenados del mismo soldado (Torbellino, Colosal, Avanzad…): el dado rueda más deprisa
  const L=C.ev.splice(0); L.forEach((e,i)=>{ const pv=L[i-1]; if(e.k==='slash' && pv && pv.k==='slash') e.chain=1; });
  (async()=>{ for(const e of L){ try{ await FX[e.k](e); }catch(x){ console.error('[fx]', e.k, x); } } })().then(done);
}
