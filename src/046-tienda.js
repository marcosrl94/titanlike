// ---------- Economía: monedas en la expedición (mercader) e insignias permanentes (Intendencia) ----------
// Monedas: se ganan con la nota de cada combate y se gastan en el mercader del mapa. Se pierden al acabar la expedición.
// Insignias: se calculan a partir de lo conseguido (logros, finales, epílogos, notas, sendas, récords) y se gastan en la
// Intendencia en ventajas de elección y estética. Nada sube estadísticas en bruto.
NODE.t = {n:'Mercader', d:'Gasta monedas en objetos, vendas, gas o instrucción.'};
const COIN = {'S+':22, S:17, A:13, B:10, C:8, D:6, E:4};
const coinsFor = (G, t) => Math.round((COIN[G.g]||4) * (t==='b' ? 2 : t==='e' ? 1.5 : 1));

// ---- Intendencia (permanente) ----
const SHOP = {
  bolsa:   {n:'Bolsa de cuero', p:25, kind:'exp', d:'Empiezas cada expedición con 15 monedas.'},
  petate:  {n:'Petate de salida', p:30, kind:'exp', d:'Empiezas cada expedición con un objeto a elegir.'},
  amigo:   {n:'Un amigo en el mercado', p:35, kind:'exp', d:'El mercader te cobra un 20 % menos.'},
  contactos:{n:'Contactos en la Intendencia', p:40, kind:'exp', d:'Una vez por saga puedes relanzar las recompensas de un combate.'},
  bolsillo:{n:'Cuarto bolsillo', p:60, kind:'exp', d:'Puedes llevar cuatro objetos en vez de tres.'},
  d_bronce:{n:'Dado de bronce', p:12, kind:'dado', d:'Tu d20 en bronce envejecido.'},
  d_cristal:{n:'Dado de cristal', p:25, kind:'dado', d:'Tu d20 de cristal endurecido, como el de la Hembra.'},
  d_sangre:{n:'Dado de sangre', p:25, kind:'dado', d:'Tu d20 en rojo oscuro.'},
  d_oro:   {n:'Dado de oro', p:60, kind:'dado', d:'Tu d20 de oro. Para quien quiera que se note.'},
  m_oro:   {n:'Marco dorado', p:30, kind:'marco', d:'Marco dorado en los retratos de tu escuadrón.'},
  m_verde: {n:'Marco del Cuerpo de Exploración', p:15, kind:'marco', d:'Marco verde con las alas de la libertad… en espíritu.'}
};
const shopOf = () => Object.assign({spent:0, own:[], eq:{}}, statsOf().shop || {});
const owns = k => shopOf().own.includes(k) || !!(SHOP[k] && SHOP[k].pass && typeof hasReward==='function' && hasReward(SHOP[k].kind, k));
// de dónde salen las insignias (es la tabla de recompensas que se enseña en la Intendencia)
function insigniaSources(){
  const M=meta(), st=statsOf(), g=st.g||{};
  return [
    {n:'Logros', d:'5 por logro', v:5*M.ach.length},
    {n:'Finales', d:'20 por final distinto', v:20*M.endings.length},
    {n:'Epílogos', d:'8 por epílogo distinto', v:8*(st.ep||[]).length},
    {n:'Sendas', d:'10 por senda descubierta', v:10*(st.alts||[]).length},
    {n:'Notas S', d:'1 por S y 3 por S+', v:(g['S']||0) + 3*(g['S+']||0)},
    {n:'Récords de jefe', d:'2 por jefe con nota A o mejor', v:2*Object.values(st.rec||{}).filter(r=>gradeIx(r.g)<=2).length},
    {n:'Mejor jornada', d:'1 por cada 5 jornadas de tu mejor marca', v:Math.floor((M.best||0)/5)},
    {n:'Campañas', d:'15 por vuelta completada', v:15*(M.ngLevel||0)},
    {n:'Nivel de cuenta', d:'5 por cada nivel', v:typeof levelOf==='function' ? 5*(levelOf(M.xp||0).lv-1) : 0}
  ];
}
const insigniasEarned = () => insigniaSources().reduce((a,x)=>a+x.v,0);
const insignias = () => insigniasEarned() - shopOf().spent;
function buyShop(k){
  const it=SHOP[k], sh=shopOf(); if(!it || it.pass || sh.own.includes(k) || insignias()<it.p) return false;
  sh.own.push(k); sh.spent+=it.p; if(it.kind!=='exp') sh.eq[it.kind]=k;
  const st=statsOf(); st.shop=sh; saveMeta({stats:st}); applyCosmetics(); return true;
}
function equipShop(k){ const it=SHOP[k], sh=shopOf(); if(!it || !owns(k)) return; { const cos=meta().cos; if(cos && cos.eq && cos.eq[it.kind]){ cos.eq[it.kind]=null; saveMeta({cos}); if(typeof applyPassCosmetics==='function') applyPassCosmetics(); } } sh.eq[it.kind] = sh.eq[it.kind]===k ? null : k; const st=statsOf(); st.shop=sh; saveMeta({stats:st}); applyCosmetics(); }
function applyCosmetics(){
  if(typeof document==='undefined') return; const eq=shopOf().eq||{};
  document.body.className = document.body.className.replace(/\b(dice|frame)-\S+/g,'').trim();
  if(eq.dado) document.body.classList.add('dice-'+eq.dado.slice(2));
  if(eq.marco) document.body.classList.add('frame-'+eq.marco.slice(2));
}
const itemCap = () => owns('bolsillo') ? 4 : 3;

// ---- mercader (en la expedición) ----
function shopOffers(){
  const off=[], disc = owns('amigo') ? .8 : 1, pr = p => Math.max(1, Math.round(p*disc));
  const its = Object.keys(ITEMS).sort(()=>Math.random()-.5).slice(0,3);
  its.forEach(k=>off.push({k:'it:'+k, n:ITEMS[k].n, d:ITEMS[k].d, p:pr(k==='carga'?18:14)}));
  off.push({k:'vendas', n:'Vendas y aguardiente', d:'Todo el escuadrón recupera el 40 % de sus PV.', p:pr(12)});
  off.push({k:'gas', n:'Bombonas sueltas', d:'+5 de gas (sin pasar del máximo).', p:pr(9)});
  off.push({k:'instruccion', n:'Instrucción con un veterano', d:'Todo el escuadrón sube 1 nivel.', p:pr(26)});
  off.push({k:'mejora', n:'Caja sin abrir', d:'Una mejora al azar para el escuadrón.', p:pr(32)});
  return off;
}
function shopBuy(i){
  const o=S.shop.offers[i]; if(!o || o.sold || (S.coins||0)<o.p) return;
  if(o.k.startsWith('it:')){ if((S.items||[]).length>=itemCap()) return; (S.items=S.items||[]).push(o.k.slice(3)); }
  else if(o.k==='vendas') healAll(.4);
  else if(o.k==='gas') S.gas=Math.min(S.gasMax, S.gas+5);
  else if(o.k==='instruccion') S.squad.forEach(levelUp);
  else if(o.k==='mejora') o.got = randomUpg();
  S.coins-=o.p; o.sold=true; store.set('run', S);
}
// relanzar recompensas (Contactos en la Intendencia): una vez por saga
const canReroll = () => owns('contactos') && S && S.rerollSaga!==sagaIx(S.wave) && scr==='reward';
function rerollRewards(){ if(!canReroll()) return; S.rerollSaga=sagaIx(S.wave); S.rewards=genRewards(curNode().t); store.set('run', S); }
