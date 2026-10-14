// ---------- Momentos: viñetas en penumbra al abrir cada zona (ilustración generada + dos líneas) ----------
// Escenas atmosféricas propias: murallas, bosques, ciudades, mar y siluetas genéricas. Nada de personajes concretos.
const MW=800, MH=360;
const M_ = {
  sky:(id,a,b,c)=>`<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}"/><stop offset=".62" stop-color="${b}"/><stop offset="1" stop-color="${c}"/></linearGradient></defs><rect width="${MW}" height="${MH}" fill="url(#${id})"/>`,
  glow:(id,x,y,r,c,o=.8)=>`<defs><radialGradient id="${id}"><stop offset="0" stop-color="${c}" stop-opacity="${o}"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></radialGradient></defs><circle cx="${x}" cy="${y}" r="${r}" fill="url(#${id})"/>`,
  hills:(R,y,amp,c,step=40)=>{ let d=`M0 ${MH} L0 ${y}`; for(let x=0;x<=MW+step;x+=step) d+=` L${x} ${(y-amp*R()).toFixed(1)}`; return `<path d="${d} L${MW} ${MH}Z" fill="${c}"/>`; },
  city:(R,y,c,lit,o={})=>{ let s=''; for(let x=-10;x<MW;){ const w=18+R()*34, h=(o.h||40)+R()*(o.hv||60); s+=`<rect x="${x.toFixed(0)}" y="${(y-h).toFixed(0)}" width="${w.toFixed(0)}" height="${(h+MH).toFixed(0)}" fill="${c}"/>`;
      if(R()<.5) s+=`<path d="M${x.toFixed(0)} ${(y-h).toFixed(0)} L${(x+w/2).toFixed(0)} ${(y-h-10-R()*14).toFixed(0)} L${(x+w).toFixed(0)} ${(y-h).toFixed(0)}Z" fill="${c}"/>`;
      if(lit) for(let k=0;k<3;k++) if(R()<.45) s+=`<rect x="${(x+4+R()*(w-10)).toFixed(0)}" y="${(y-h+8+R()*(h-14)).toFixed(0)}" width="4" height="5" fill="${lit}" opacity="${(.4+R()*.5).toFixed(2)}"/>`;
      x+=w+R()*6; } return s; },
  wall:(y,h,c,o={})=>{ const gap=o.breach; let top=`M0 ${y}`; if(gap) top+=` L${gap[0]} ${y} L${gap[0]+12} ${y+h*.35} L${gap[0]+30} ${y+h*.2} L${gap[0]+48} ${y+h*.55} L${gap[1]-30} ${y+h*.3} L${gap[1]-10} ${y+h*.5} L${gap[1]} ${y}`;
      return `<path d="${top} L${MW} ${y} L${MW} ${y+h} L0 ${y+h}Z" fill="${c}"/><path d="M0 ${y+3} L${gap?gap[0]:MW} ${y+3}${gap?` M${gap[1]} ${y+3} L${MW} ${y+3}`:''}" stroke="${o.rim||'#000'}" stroke-opacity=".35" stroke-width="2"/>`; },
  giant:(x,y,s,c)=>`<g transform="translate(${x} ${y}) scale(${s})" fill="${c}"><ellipse cx="0" cy="-118" rx="15" ry="18"/><path d="M-9 -102 L9 -102 L12 -92 L40 -84 Q50 -80 52 -64 L58 -10 L48 -8 L40 -58 L34 -40 L32 0 L-32 0 L-34 -40 L-40 -58 L-48 -8 L-58 -10 L-52 -64 Q-50 -80 -40 -84 L-12 -92Z"/></g>`,
  people:(x,y,n,c,sp=14)=>{ let s=''; for(let i=0;i<n;i++){ const px=x+i*sp; s+=`<g fill="${c}"><circle cx="${px}" cy="${y-15}" r="3.2"/><path d="M${px-5} ${y} L${px-3} ${y-12} L${px+3} ${y-12} L${px+6} ${y} Z"/><path d="M${px+3} ${y-11} Q${px+12} ${y-8} ${px+10} ${y-1}" fill="none" stroke="${c}" stroke-width="2.4"/></g>`; } return s; },
  riders:(x,y,n,c,sp=34)=>{ let s=''; for(let i=0;i<n;i++){ const px=x+i*sp; s+=`<g fill="${c}"><path d="M${px} ${y} l2 -9 l-4 -9 q8 -6 22 -4 l8 -6 l3 4 l-4 4 l0 6 l-3 14 h-3 l1 -11 h-14 l-2 11 h-3z"/><circle cx="${px+12}" cy="${y-30}" r="3"/><path d="M${px+8} ${y-18} l2 -9 h5 l2 9z"/><path d="M${px+10} ${y-26} q-12 2 -16 10" stroke="${c}" stroke-width="2.4" fill="none"/></g>`; } return s; },
  trees:(R,c,n=7)=>{ let s=''; for(let i=0;i<n;i++){ const x=i*MW/(n-1)+R()*40-20, w=34+R()*40; s+=`<path d="M${x-w/2} ${MH} L${x-w/3} 0 L${x+w/3} 0 L${x+w/2} ${MH}Z" fill="${c}"/><path d="M${x} ${120+R()*80} q${60+R()*60} -${20+R()*30} ${110+R()*60} -${10+R()*20}" stroke="${c}" stroke-width="${6+R()*6}" fill="none"/>`; } return s; },
  shafts:(x,c,n=4)=>{ let s=''; for(let i=0;i<n;i++){ const a=x+i*70; s+=`<path class="shaft" style="animation-delay:${i*.7}s" d="M${a} 0 L${a+40} 0 L${a+180} ${MH} L${a+90} ${MH}Z" fill="${c}" opacity=".10"/>`; } return s; },
  flare:(x1,y1,x2,y2,c)=>`<path d="M${x1} ${y1} Q${(x1+x2)/2} ${Math.min(y1,y2)-90} ${x2} ${y2}" stroke="${c}" stroke-width="3" fill="none" opacity=".75" class="flr"/><circle cx="${x2}" cy="${y2}" r="5" fill="#fff"/>${M_.glow('fl'+x2,x2,y2,46,c,.9)}`,
  smoke:(R,x,y,w,c,n=10)=>{ let s=''; for(let i=0;i<n;i++) s+=`<circle class="smk" style="animation-delay:${(R()*4).toFixed(1)}s" cx="${(x+R()*w-w/2).toFixed(0)}" cy="${(y-R()*80).toFixed(0)}" r="${(24+R()*40).toFixed(0)}" fill="${c}" opacity="${(.18+R()*.22).toFixed(2)}"/>`; return s; },
  embers:(R,n,c)=>{ let s=''; for(let i=0;i<n;i++) s+=`<circle class="emb" style="animation-delay:${(R()*5).toFixed(1)}s;animation-duration:${(4+R()*4).toFixed(1)}s" cx="${(R()*MW).toFixed(0)}" cy="${(MH-R()*80).toFixed(0)}" r="${(1+R()*1.8).toFixed(1)}" fill="${c}"/>`; return s; },
  moon:(x,y,r,c='#e9eef0')=>`${M_.glow('mn',x,y,r*3.2,c,.25)}<circle cx="${x}" cy="${y}" r="${r}" fill="${c}" opacity=".9"/>`,
  bolt:(x,c)=>`<path class="mbolt" d="M${x} 0 L${x-14} 70 L${x+8} 78 L${x-20} 170 L${x+4} 176 L${x-10} 250" stroke="${c}" stroke-width="4" fill="none"/>`,
  ships:(R,y,c,n=4)=>{ let s=''; for(let i=0;i<n;i++){ const x=60+i*180+R()*60; s+=`<path d="M${x} ${y} l120 0 l-14 16 l-94 0z" fill="${c}"/><rect x="${x+30}" y="${y-26}" width="34" height="26" fill="${c}"/><rect x="${x+44}" y="${y-44}" width="8" height="18" fill="${c}"/>`; } return s; },
  beams:(xs,y,c)=>xs.map((x,i)=>`<path class="beam" style="animation-delay:${i*1.3}s;transform-origin:${x}px ${y}px" d="M${x} ${y} L${x-60} 0 L${x+30} 0Z" fill="${c}" opacity=".16"/>`).join(''),
  airship:(x,y,c)=>`<g fill="${c}"><ellipse cx="${x}" cy="${y}" rx="70" ry="18"/><path d="M${x+60} ${y} l26 -14 l0 28z"/><rect x="${x-20}" y="${y+16}" width="40" height="9"/></g>`,
  castle:(x,y,c)=>`<g fill="${c}"><rect x="${x}" y="${y-150}" width="56" height="150"/><path d="M${x-6} ${y-150} h68 v-12 h-10 v6 h-10 v-6 h-10 v6 h-8 v-6 h-10 v6 h-10 v-6 h-10z"/><rect x="${x-70}" y="${y-60}" width="80" height="60"/><rect x="${x+20}" y="${y-110}" width="6" height="12" fill="#e8b25c" opacity=".7"/></g>`
};
// las doce zonas: escena y narración (texto propio, dos líneas como mucho)
const MOMENTS = [
  {t:'El muro ha caído', d:'Vapor sobre la brecha. Por primera vez en cien años, los titanes caminan dentro.', f:R=>M_.sky('s','#141c24','#3a2a26','#7a3d22')+M_.glow('g',560,190,260,'#ff8a3d',.55)+M_.city(R,330,'#1a1e22','#e8a85c',{h:20,hv:40})+M_.wall(170,170,'#0f1316',{breach:[480,640],rim:'#ff9a5a'})+M_.smoke(R,560,200,180,'#d9c8b4',14)+M_.giant(560,330,1.15,'#0b0d0f')+M_.people(120,170,4,'#0b0d0f')+M_.embers(R,26,'#ffb06b')},
  {t:'Bosque de árboles gigantes', d:'Entre troncos de ochenta metros, el humo verde marca el camino. Algo corre detrás de la formación.', f:R=>M_.sky('s','#0b1512','#16261f','#21332a')+M_.shafts(160,'#c9e6b8')+M_.trees(R,'#0a120f')+M_.flare(120,300,520,90,'#5fd17a')+M_.riders(150,340,4,'#060a08')+M_.giant(690,360,1.4,'#050807')+M_.embers(R,14,'#bfe8a8')},
  {t:'Stohess, de noche', d:'Tejados mojados y campanas. En el interior de los muros también hay enemigos.', f:R=>M_.sky('s','#0a0f1a','#16233a','#24344a')+M_.moon(640,70,26)+M_.city(R,300,'#0d121b','#e8c070')+M_.city(R,360,'#080b11','#e8c070',{h:60,hv:70})+M_.glow('g',300,250,180,'#9fd8e8',.35)+M_.smoke(R,300,280,240,'#a8c4d0',10)+M_.people(560,240,3,'#05070a')},
  {t:'El castillo de Utgard', d:'Una torre, una noche sin luna y una pregunta que nadie quiere hacer: ¿quién es quién?', f:R=>M_.sky('s','#070a12','#121a28','#1b2230')+M_.glow('g',420,320,300,'#3a4a66',.6)+M_.hills(R,300,30,'#0b0f17')+M_.castle(380,320,'#05070b')+M_.giant(170,360,1.3,'#030406')+M_.giant(640,360,1.1,'#030406')+M_.giant(290,370,.9,'#030406')+M_.people(392,166,2,'#05070b',12)},
  {t:'Sobre el muro Rose', d:'Amanece. Un rayo cae en mitad de la formación, y ya no hay vuelta atrás.', f:R=>M_.sky('s','#1a2230','#6a5a4a','#d8a66a')+M_.glow('g',380,260,260,'#ffd38a',.6)+M_.hills(R,270,25,'#2a2a2a')+M_.wall(230,130,'#15171a',{rim:'#ffd38a'})+M_.bolt(420,'#fff4c4')+M_.glow('gb',410,250,120,'#fff4c4',.7)+M_.people(140,230,5,'#0b0c0e')+M_.smoke(R,410,240,160,'#efe4d0',10)},
  {t:'La llanura de los gigantes', d:'Tormenta sobre campo abierto. Ni árboles ni casas: solo caballos y lo que venga de frente.', f:R=>M_.sky('s','#0c1016','#232a33','#3a3f42')+M_.glow('g',650,120,220,'#c9d4dc',.25)+M_.bolt(660,'#e8f0ff')+M_.hills(R,300,18,'#151a1f')+M_.giant(560,310,.8,'#0b0e12')+M_.giant(640,312,.7,'#0b0e12')+M_.giant(720,308,.85,'#0b0e12')+M_.riders(80,350,5,'#05070a',40)+M_.flare(90,330,300,120,'#e05a4a')},
  {t:'Orvud arde en el horizonte', d:'Una luz enorme se arrastra hacia el distrito. El calor llega antes que ella.', f:R=>M_.sky('s','#100a0a','#3a1a10','#8a3a14')+M_.glow('g',620,300,320,'#ff7a2a',.75)+M_.hills(R,300,22,'#1a0f0c')+M_.wall(250,110,'#0d0908',{rim:'#ff9a5a'})+M_.city(R,250,'#120c0a','#ffb46b',{h:20,hv:30})+M_.smoke(R,620,250,260,'#4a2a20',16)+M_.embers(R,40,'#ffb06b')+M_.people(120,250,3,'#060404')},
  {t:'Shiganshina, de vuelta a casa', d:'Calles en ruinas y silencio. Aquí empezó todo, y aquí hay que terminarlo.', f:R=>M_.sky('s','#120d10','#3b2228','#6a3a30')+M_.glow('g',200,230,240,'#e2685c',.4)+M_.city(R,300,'#140e10',null,{h:30,hv:90})+M_.smoke(R,520,260,300,'#5a3a36',14)+M_.people(380,300,1,'#050304')+M_.embers(R,20,'#e2685c')},
  {t:'Muro María al amanecer', d:'El viento tira de las capas. Al otro lado del muro, por fin, el sótano.', f:R=>M_.sky('s','#1a2333','#56607a','#e0b886')+M_.glow('g',640,300,240,'#ffd9a0',.6)+M_.hills(R,320,30,'#2a2f3a')+M_.wall(250,110,'#14171d',{rim:'#ffd9a0'})+M_.people(260,250,6,'#07080b',18)+M_.embers(R,10,'#ffe3b8')},
  {t:'Liberio', d:'Al otro lado del mar hay ciudades, barcos y focos que barren el cielo. Y un ejército que os espera.', f:R=>M_.sky('s','#060a14','#101a2c','#1a2638')+M_.beams([160,420,660],300,'#dfe8ff')+M_.city(R,290,'#070b14','#f0c87a',{h:50,hv:70})+`<rect y="338" width="${MW}" height="40" fill="#0a1322"/>`+M_.ships(R,330,'#04070d')+M_.airship(560,90,'#03050a')},
  {t:'Fuerte Salta', d:'Una fortaleza en la montaña, una tormenta y un dirigible que no debería estar ahí.', f:R=>M_.sky('s','#0a0d12','#1c2229','#2b3036')+M_.bolt(180,'#e8f0ff')+M_.hills(R,230,90,'#12161b',60)+M_.castle(470,250,'#07090c')+M_.airship(300,120,'#05070a')+M_.smoke(R,500,180,200,'#3a3f45',10)+M_.flare(640,260,560,110,'#e05a4a')},
  {t:'El Retumbar', d:'El horizonte entero es vapor. Detrás, miles de pasos al unísono que hacen temblar el suelo.', f:R=>{ let g=''; for(let i=0;i<16;i++) g+=M_.giant(20+i*52+R()*20, 300+R()*12, .55+R()*.35, '#0b0807'); return M_.sky('s','#140a08','#4a1e10','#c2582a')+M_.glow('g',400,300,380,'#ff8a3d',.6)+M_.smoke(R,400,300,800,'#d9b8a0',22)+g+M_.hills(R,330,8,'#080505')+M_.people(330,330,3,'#030202')+M_.embers(R,30,'#ffb06b'); }}
];
function momentSVG(i){ const R=mulberry(hashStr('momento'+i)); const body=MOMENTS[i].f(R).replace(/id="([^"]+)"/g, `id="m${i}$1"`).replace(/url\(#([^)]+)\)/g, `url(#m${i}$1)`);
  return `<svg viewBox="0 0 ${MW} ${MH}" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${body}</svg>`; }
function momentHTML(i, sub){ const M=MOMENTS[i];
  return `<div class="moment"><div class="m-art">${momentSVG(i)}<i class="grain"></i><i class="vig"></i></div>
    <div class="m-txt"><span class="lbl">${sub||''}</span><h2>${M.t}</h2><p>${M.d}</p></div></div>`; }
// se muestra una vez por expedición al entrar en cada zona (y se guarda en el códice para volver a verla)
function showMoment(i, sub, again){
  if(!MOMENTS[i]) return;
  $('sheet').innerHTML = `<div class="sheet-in moment-in" data-a="closesheet">${momentHTML(i, sub)}<div class="row"><button class="btn sm" data-a="closesheet">${again?'Cerrar':'Seguir la ruta'}</button></div></div>`;
  $('sheet').hidden = false;
  const m=meta(); if(!(m.moments||[]).includes(i)) saveMeta({moments:(m.moments||[]).concat(i)});
}
function maybeMoment(){
  if(!S || !S.map || CFG.story===false || !$('sheet').hidden) return; const z=S.map.z;
  if(S.storyZ===z) return;
  // solo si seguimos en el mapa cuando toca mostrarla; si no, se intenta en el siguiente paso por el mapa
  setTimeout(()=>{ if(scr!=='map' || !S || S.map.z!==z || !$('sheet').hidden) return; S.storyZ=z; store.set('run', S); showMoment(z, `${SAGAS[Math.floor(z/3)].n} · zona ${z%3+1} de 3`); }, 250);
}
