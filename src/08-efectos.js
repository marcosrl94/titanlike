// ---------- Efectos de combate ----------
const $ = id=>document.getElementById(id);
const NS = 'http://www.w3.org/2000/svg';
const REDUCED = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
let fast = !!store.get('fast');
const animK = () => REDUCED || CFG.calm ? .15 : Math.min(ANIM[CFG.anim] ? ANIM[CFG.anim].k : 1, fast ? .5 : 1);
const sleep = ms => new Promise(r=>setTimeout(r, ms*animK()));
const U = u => document.querySelector(`[data-u="${u}"]`);   // el primero: en combate, el sprite del escenario
const UA = u => Array.from(document.querySelectorAll(`[data-u="${u}"]`));   // sprite y tarjeta
const at = (el, fy=.4) => { const r=el.getBoundingClientRect(); return {x:r.left+r.width/2, y:r.top+r.height*fy}; };
function cls(el, c, ms=420){ if(!el || (c==='shake' && (!CFG.shake || CFG.calm))) return; el.classList.remove(c); void el.offsetWidth; el.classList.add(c); setTimeout(()=>el.classList.remove(c), ms); }
function add(tag, c, css, ms){ const d=document.createElement(tag); d.className=c; Object.assign(d.style, css||{}); $('fx').appendChild(d); setTimeout(()=>d.remove(), ms); return d; }
function float(p, txt, c=''){ add('div', 'float '+c, {left:p.x+'px', top:p.y+'px'}, 1000).textContent = txt; }
function flash(color, o=.6){ if(REDUCED || !CFG.flash || CFG.calm) return; add('div', 'flash', {background:color}, 420).style.setProperty('--o', o); }
function line(a, b, c){
  const l=document.createElementNS(NS,'line');
  l.setAttribute('x1',a.x); l.setAttribute('y1',a.y); l.setAttribute('x2',b.x); l.setAttribute('y2',b.y);
  l.setAttribute('class', c); l.style.setProperty('--len', Math.hypot(b.x-a.x, b.y-a.y));
  $('fxsvg').appendChild(l); setTimeout(()=>l.remove(), 620);
}
function steam(p){ for(let i=0;i<9;i++) add('div','puff',{left:(p.x+rnd(-50,50))+'px', top:(p.y+rnd(-10,70))+'px', animationDelay:rnd(0,.25)+'s'}, 1400).style.setProperty('--dx', rnd(-40,40)+'px'); }
function setHp(u, hp, max){ UA(u).forEach(el=>{ const b=el.querySelector('.bar i'), n=el.querySelector('.hpn'); if(b) b.style.width=(hp/max*100)+'%'; if(n) n.textContent=`${hp} / ${max} PV`; }); }
function logLine(m){ if(!m) return; C.log.push(m); if(C.log.length>4) C.log.shift(); const L=$('log'); if(L) L.innerHTML=C.log.map(l=>`<div>${l}</div>`).join(''); }
function busyUI(){ const o=$('orders'), h=$('hint'); if(o) o.hidden=true; if(h) h.textContent='…'; document.querySelectorAll('.pick').forEach(e=>e.classList.remove('pick')); }
function boltAt(p){
  let x=p.x+rnd(-30,30), y=0, pts=`${x},0`;
  while(y<p.y-40){ y+=rnd(30,60); x+=rnd(-34,34); pts+=` ${x},${Math.min(y,p.y)}`; }
  pts+=` ${p.x},${p.y}`;
  const l=document.createElementNS(NS,'polyline'); l.setAttribute('points',pts); l.setAttribute('class','bolt'); $('fxsvg').appendChild(l); setTimeout(()=>l.remove(),650);
}
const FX = {
  async shift(e){
    const s=U('s'+e.s); logLine(e.m); if(!s) return;
    const p=at(s,.4); boltAt(p); sfx('bolt'); flash('var(--gold)',.8); cls($('screen'),'shake');
    UA('s'+e.s).forEach(el=>{ const pt=el.querySelector('.pt'); if(pt){ pt.classList.add('tf'); pt.innerHTML=titanArt(e.art); } cls(el,'glow',720); }); await sleep(260); float(p, e.txt, 'tag'); await sleep(560);
  },
  async hurt(e){ const s=U('s'+e.s); if(!s) return; float(at(s,.35), '-'+e.d, 'bad'); setHp('s'+e.s, e.hp, e.max); await sleep(300); },
  async roarAll(e){ logLine(e.m); sfx('roar'); flash('var(--bone)',.35); cls($('screen'),'shake');
    document.querySelectorAll('.titan:not(.dead)').forEach(t=>{ cls(t,'struck'); float(at(t,.2), e.txt, 'tag'); }); await sleep(700); },
  async say(e){ logLine(e.m); await sleep(e.w||260); },
  async slash(e){
    const s=U('s'+e.s), t=U('t'+e.t); logLine(e.m); if(!s||!t) return;
    const a=at(s,.3), b=at(t,.3);
    UA('s'+e.s).forEach(el=>cls(el,'lunge')); line(a,b,'wire'); await sleep(150); sfx(e.boom?'boom':e.crit?'crit':'slash');
    const dx=50*(Math.random()<.5?-1:1);
    line({x:b.x-dx,y:b.y-38},{x:b.x+dx,y:b.y+38},'slash'+(e.crit?' crit':''));
    if(e.boom){ flash('var(--gold)',.7); cls($('screen'),'shake'); }
    UA('t'+e.t).forEach(el=>cls(el,'struck')); float(b, e.d, e.crit?'crit':''); setHp('t'+e.t, e.hp, e.max);
    if(e.exec) float({x:b.x, y:b.y-50}, 'NUCA', 'tag');
    if(e.roll) float({x:b.x+44, y:b.y-64}, 'd20 · '+e.roll, 'die'+(e.crit?' crit':e.fumble?' bad':''));
    if(e.kill){ UA('t'+e.t).forEach(el=>el.classList.add('dying')); steam(b); sfx('steam'); await sleep(560); } else await sleep(340);
  },
  async bite(e){
    const t=U('t'+e.t), s=U('s'+e.s); logLine(e.m); if(!t||!s) return;
    cls(t,'chomp'); await sleep(210);
    if(e.die) float({x:at(s,.35).x+36, y:at(s,.35).y-40}, e.die, 'die');
    sfx('hit'); UA('s'+e.s).forEach(el=>cls(el,'struck')); cls($('screen'),'shake'); flash('var(--blood)',.28);
    float(at(s,.35), '-'+e.d, 'bad'); setHp('s'+e.s, e.hp, e.max);
    if(e.dead) UA('s'+e.s).forEach(el=>el.classList.add('dead'));
    await sleep(430);
  },
  async miss(e){ const t=U('t'+e.t), s=U('s'+e.s); logLine(e.m); if(!t||!s) return; cls(t,'chomp'); await sleep(210); sfx('miss'); if(e.die) float({x:at(s,.35).x+36, y:at(s,.35).y-40}, e.die, 'die crit'); float(at(s,.35), e.txt, 'tag'); await sleep(380); },
  async buff(e){ logLine(e.m); sfx('buff'); e.ids.forEach(id=>{ const s=U('s'+id); if(s){ UA('s'+id).forEach(el=>cls(el,'glow',720)); float(at(s,.3), e.txt, 'tag'); } }); await sleep(520); },
  async heal(e){ const s=U('s'+e.s); logLine(e.m); if(!s) return; sfx('heal'); UA('s'+e.s).forEach(el=>cls(el,'glow',720)); float(at(s,.35), '+'+e.d, 'good'); setHp('s'+e.s, e.hp, e.max); await sleep(480); },
  async mark(e){ const t=U('t'+e.t); logLine(e.m); if(!t) return; sfx('buff'); float(at(t,.2), e.txt, 'tag'); await sleep(420); },
  async roar(e){ const t=U('t'+e.t); logLine(e.m); if(!t) return; sfx('roar'); cls(t,'chomp'); cls($('screen'),'shake'); float(at(t,.15), e.txt, 'tag'); await sleep(520); },
  async summon(e){ logLine(e.m); render(); const t=U('t'+e.t); sfx('roar'); if(t){ cls(t,'struck'); float(at(t,.2), e.txt, 'tag'); } await sleep(560); },
  async bolt(e){
    const s=U('s'+e.s); logLine(e.m); if(!s) return;
    const p=at(s,.4); let x=p.x+rnd(-30,30), y=0, pts=`${x},0`;
    while(y<p.y-40){ y+=rnd(30,60); x+=rnd(-34,34); pts+=` ${x},${Math.min(y,p.y)}`; }
    pts+=` ${p.x},${p.y}`;
    const l=document.createElementNS(NS,'polyline'); l.setAttribute('points',pts); l.setAttribute('class','bolt'); $('fxsvg').appendChild(l); setTimeout(()=>l.remove(),650);
    sfx('bolt'); flash('var(--gold)',.8); cls($('screen'),'shake'); cls(s,'glow',720); await sleep(260);
    float(p, 'TITÁN DE ATAQUE', 'tag'); await sleep(520);
  }
};
function play(done){
  (async()=>{ for(const e of C.ev.splice(0)){ try{ await FX[e.k](e); }catch(x){} } })().then(done);
}
