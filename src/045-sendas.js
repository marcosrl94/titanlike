// ---------- Sendas: sagas alternativas, encrucijadas, finales y epílogos de personaje ----------
// Lo que haces en la partida (a quién proteges, a quién perdonas, quién sigue vivo) abre sendas que sustituyen
// a una saga canónica. Al cerrar la saga anterior aparece una encrucijada y eliges tú.

// enemigos propios de las sendas
Object.assign(TITANS, {
  mpol: {n:'Policía Militar', cls:'pequeno', hp:56, atk:12, spd:13, v:'dispara a', a:{k:'soldier'}},
  mpg:  {n:'Guardia de Mitras', cls:'blindado', hp:96, atk:12, spd:8, v:'dispara a', a:{k:'soldier'}},
  apers:{n:'Brigada antipersonal', cls:'anormal', hp:64, atk:11, spd:20, twice:true, v:'dispara a', a:{k:'sniper'}},
  kap:  {n:'Capitán de la brigada antipersonal', cls:'anormal', hp:300, atk:14, spd:21, boss:1, twice:true, v:'dispara a', m:{kick:3, txt:'A QUEMARROPA'}, a:{k:'sniper'}},
  rod1: {n:'Titán de Rod Reiss, bajo la capilla', cls:'grande', hp:430, atk:10, spd:3, boss:1, m:{aura:.25}, a:TITANS.rod.a},
  bes2: {n:'Titán Bestia, el asedio', cls:'grande', hp:460, atk:16, spd:10, boss:1, m:{aoe:3, throw:4, txt:'LLUVIA DE ROCAS'}, a:TITANS.bes.a},
  mar2: {n:'Martillo de Guerra, asalto final', cls:'blindado', hp:540, atk:18, spd:12, boss:1, m:{aoe:3, harden:2, txt:'PÚAS DE CRISTAL'}, a:TITANS.mar.a}
});
Object.assign(BOSS_PW, {bes2:'bestia', mar2:'martillo'});

const ALT_SAGAS = {
  reina: {slot:2, n:'La reina de las murallas', d:'Golpe de Estado en el interior. La Policía Militar caza al escuadrón y los Reiss esconden la verdad bajo una capilla.',
    hint:'Se abre en la saga 2 si proteges a Historia cuando vengan a por ella.', ending:null,
    zones:[{n:'Calles de Trost', boss:'kap', pool:['mpol','mpol','apers','mpg'], mo:12},
           {n:'Capilla de los Reiss', boss:'rod1', pool:['apers','mpol','mpg','apers'], mo:13},
           {n:'Distrito de Orvud', boss:'rod', pool:['mpol','apers','mpg','apers'], mo:6}]},
  paradis: {slot:3, n:'Defender Paradis', d:'Sin Eren no hay Retumbar. Marley desembarca en la isla y la guerra se libra en casa.',
    hint:'Se abre al final de la saga 3 si Eren ya no está en el escuadrón, o si lleváis a un guerrero perdonado.', ending:'paradis',
    zones:[{n:'Puerto de Paradis', boss:'man', pool:['sol','sol','tir','pz','art'], mo:14},
           {n:'Shiganshina sitiada', boss:'bes2', pool:['sol','tir','pm','pm','art'], mo:15},
           {n:'Muro María: el último asalto', boss:'mar2', pool:['pm','pz','art','tir','sol'], mo:16}]}
};
// la saga que toca en un índice: la alternativa si la expedición tomó esa senda
function altSaga(i){ const k = S && S.route && S.route[i]; return k && ALT_SAGAS[k] && ALT_SAGAS[k].slot===i ? ALT_SAGAS[k] : null; }
const onRoute = k => !!(S && S.route && Object.values(S.route).includes(k));
const altsSeen = () => (statsOf().alts || []);

// ¿se abre una senda al cerrar la saga i? (devuelve la clave o null)
let crossroadAt = function(i){
  if(S.daily) return null;
  if(i===1 && S.flags && S.flags.reina && has('historia')) return 'reina';
  if(i===2 && (!has('eren') || (S.flags && S.flags.alianza) || WARRIORS.some(id=>S.loyal[id] && has(id)))) return 'paradis';
  return null;
};
let takeRoute = function(k){
  const A=ALT_SAGAS[k]; S.route = S.route || {}; S.route[A.slot] = k;
  const st=statsOf(); st.alts = [...new Set((st.alts||[]).concat(k))]; saveMeta({stats:st});
};

// finales y epílogos
Object.assign(ENDINGS, {paradis:{n:'Paradis resiste', d:'Marley se retira de la isla. No hubo Retumbar: hubo una guerra, y la habéis ganado.'}});
const EPILOGUES = [
  {k:'levi', who:'levi', n:'La promesa', hint:'Levi tiene una cuenta pendiente con el Titán Bestia.',
   c:()=>has('levi') && ['bes','bes2'].some(b=>S.flags.lastHit && S.flags.lastHit[b]==='levi'),
   d:'Levi le prometió a alguien que acabaría con la Bestia, y la promesa está cumplida. Esa noche limpia sus cuchillas en silencio y, por una vez, se sienta con los demás junto al fuego.'},
  {k:'mikasa', who:'mikasa', n:'Bajo el árbol', hint:'Cuando Eren se vuelve contra el escuadrón, alguien tiene que detenerlo.',
   c:()=>S.erenFell && S.flags.lastHit && S.flags.lastHit.fun==='mikasa',
   d:'Fue Mikasa quien asestó el último corte. Vuelve sola a una colina con un árbol enorme y se queda allí hasta que anochece, con la bufanda al viento.'},
  {k:'historia', who:'historia', n:'La reina', hint:'La corona espera a quien no se la quiere poner.',
   c:()=>has('historia') && onRoute('reina'),
   d:'Historia acepta la corona, pero no el palacio: abre un orfanato en las afueras y gobierna desde allí, con barro en las botas.'},
  {k:'armin', who:'armin', n:'El comandante', hint:'El poder del Colosal en las manos de quien mejor piensa.',
   c:()=>has('armin') && S.pw.colosal==='armin',
   d:'Armin hereda el mando del Cuerpo de Exploración. Su primera orden no es atacar: es mandar una carta al otro lado del mar.'},
  {k:'traidor', who:null, n:'Volver a casa', hint:'Perdonar a un guerrero y llegar con él hasta el final.',
   c:()=>WARRIORS.some(id=>S.loyal[id] && has(id)),
   d:'El guerrero que perdonasteis cruza el mar de vuelta. No como enemigo ni como héroe: como alguien que por fin puede decir la verdad.'},
  {k:'cientonueve', who:null, n:'Los que quedan', hint:'Dos amigos de la promoción 104, vivos al final.',
   c:()=>has('jean') && has('connie'),
   d:'Jean y Connie vuelven a Ragako. Arreglan el tejado de la casa de Connie y discuten toda la tarde sobre quién lo ha hecho peor.'},
  {k:'hange', who:'hange', n:'La sucesora', hint:'Alguien tiene que tomar el mando cuando cae el comandante.',
   c:()=>has('hange') && S.fallen.includes('erwin'),
   d:'Hange se pone el abrigo de comandante. Le queda grande, y lo lleva igual.'},
  {k:'sasha', who:'sasha', n:'La que volvió', hint:'Que Sasha llegue al final de la campaña.',
   c:()=>has('sasha'),
   d:'Sasha vuelve al bosque donde creció. Su padre la espera con la mesa puesta y no le deja levantarse hasta que no queda nada en la cazuela.'},
  {k:'erwin', who:'erwin', n:'Lo que había en el sótano', hint:'Que el comandante llegue vivo al final.',
   c:()=>has('erwin'),
   d:'Erwin por fin sabe lo que hay al otro lado. Lo escribe todo en un cuaderno y se lo da a los reclutas nuevos: que no tengan que adivinarlo como él.'},
  {k:'gabi', who:'gabi', n:'Sin brazalete', hint:'Una guerrera de Marley defendiendo la isla.',
   c:()=>has('gabi') && onRoute('paradis'),
   d:'Gabi se quita el brazalete y lo deja en el muelle. Se queda en la isla a ayudar a reconstruir lo que su ejército vino a destruir.'}
];
const epiloguesNow = () => EPILOGUES.filter(e=>{ try{ return e.c(); }catch(x){ return false; } });
function recordEpilogues(list){ if(!list.length) return; const st=statsOf(); st.ep=[...new Set((st.ep||[]).concat(list.map(e=>e.k)))]; saveMeta({stats:st}); }

// ================= Personajes de la historia =================
// reclutas que solo llegan por su escena (story: no salen al azar; para empezar con ellos hay que haberlos conocido)
Object.assign(ROSTER, {
  kenny: {n:'Kenny', st:'veloz', hp:92, atk:22, spd:19, sg:2, rare:true, story:true, tr:{sigilo:3, ingenio:1},
          sk:{n:'A bocajarro', gas:2, tgt:'enemy', d:'Escopeta: daño ×2 al objetivo y ×0,6 a otro enemigo al azar.'}},
  zeke:  {n:'Zeke', st:'fuerza', hp:100, atk:17, spd:10, sg:1, rare:true, story:true, tr:{ingenio:3, percepcion:1},
          sk:{n:'Lluvia de piedras', gas:3, tgt:'none', d:'Daño ×1 a todos los enemigos; puede derribar a los normales (25 %).'}}
});
Object.assign(BRINGS, {zeke:'bestia'});
Object.assign(TITANS, {
  frieda:{n:'Recuerdo del Titán de Frieda Reiss', cls:'grande', hp:440, atk:13, spd:9, boss:1, m:{aoe:3, harden:3, txt:'EL GRITO'}, a:Object.assign({}, TITANS.fun.a, {h:'#1e1a17', sk:'#e8e2d4'})},
  jae:   {n:'Jaegerista', cls:'pequeno', hp:58, atk:13, spd:14, v:'dispara a', a:{k:'soldier'}},
  jael:  {n:'Jaegerista con lanzas trueno', cls:'grande', hp:92, atk:18, spd:9, v:'lanza una lanza trueno a', a:{k:'sniper'}},
  flochb:{n:'Floch, al frente de los jaegeristas', cls:'pequeno', hp:330, atk:15, spd:15, boss:1, m:{aoe:3, txt:'SALVA DE LANZAS'}, v:'dispara a', a:{k:'sniper'}}
});
TITANS.kap.n = 'Kenny Ackerman, capitán de la brigada';
ALT_SAGAS.reina.zones[1] = {n:'Capilla de los Reiss', boss:'frieda', pool:['apers','mpol','mpg','apers'], mo:13};
ALT_SAGAS.jaeger = {slot:3, n:'La isla tomada', d:'Floch y los jaegeristas se hacen con Shiganshina para que nadie detenga a Eren. Primero hay que pasar por encima de ellos.',
  hint:'Se abre al final de la saga 3 si le das la razón a Floch y Eren sigue en el escuadrón.', ending:null,
  zones:[{n:'Shiganshina tomada', boss:'flochb', pool:['jae','jae','jael','mpol'], mo:17},
         {n:'El puerto', boss:'man', pool:['jae','jael','sol','tir'], mo:18},
         {n:'El Retumbar', boss:'fun', pool:['mur','mur','pas'], mo:11}]};
// encrucijada al cerrar la saga 3: los jaegeristas (con Eren) o Paradis (sin él)
crossroadAt = function(i){
  if(S.daily) return null;
  if(i===1 && S.flags && S.flags.reina && has('historia')) return 'reina';
  if(i===2 && S.flags && S.flags.jaeger && has('floch') && has('eren')) return 'jaeger';
  if(i===2 && (!has('eren') || (S.flags && S.flags.alianza) || WARRIORS.some(id=>S.loyal[id] && has(id)))) return 'paradis';
  return null;
};
const _takeRoute = takeRoute;
takeRoute = function(k){ _takeRoute(k); if(k==='jaeger'){ const f=S.squad.find(x=>x.id==='floch'); if(f){ release('floch'); S.squad=S.squad.filter(x=>x!==f); S.flags.away=(S.flags.away||[]).concat('floch'); } } };

// eventos de historia (prioritarios cuando se cumplen)
EVENTS.push(
  {n:'La llave de Grisha', prio:true, when:()=>sagaIx(S.wave)===0 && has('eren') && !S.flags.llave,
   d:'Eren lleva al cuello una llave que le dio su padre, Grisha, antes de desaparecer. «Lo que buscas está en el sótano de casa», le dijo.',
   o:[{l:'Prometer que bajaréis al sótano', d:'Eren sube 1 nivel.', f(){ S.flags.llave=1; levelUp(who('eren')); return 'Eren aprieta la llave en el puño. Shiganshina queda muy lejos, pero ahora todo el escuadrón sabe adónde va.'; }},
      {l:'Que la guarde y descanse', d:'Todos recuperan el 20 % de sus PV.', f(){ S.flags.llave=1; healAll(.2); return 'Esa noche nadie habla del sótano. Mañana habrá tiempo.'; }}]},
  {n:'El sótano de Grisha', prio:true, when:()=>sagaIx(S.wave)===2 && !onRoute('reina') && S.flags.llave && has('eren') && !S.flags.diarios && !S.flags.quemados,
   d:'La casa de Eren es un montón de escombros, pero la puerta del sótano sigue en pie. La llave entra a la primera.',
   o:[{l:'Leer los diarios', d:'Prueba de Ingenio (12): si sale, todos suben 1 nivel.', f(){ const c=check('ingenio',12); S.flags.diarios=1; if(c.ok) S.squad.forEach(levelUp);
        return `${c.txt} Tres cuadernos y una fotografía. Hay un mundo al otro lado del mar, y ese mundo os teme. ${c.ok?'Entender lo que leéis os hace mejores soldados.':'Cuesta creer lo que dicen.'}`; }},
      {l:'Quemarlos sin leerlos', d:'+2 de gas máximo.', f(){ S.flags.quemados=1; addGasMax(2); S.gas=Math.min(S.gasMax, S.gas+2); return 'El papel arde rápido. Eren mira el fuego sin decir nada.'; }}]},
  {n:'Floch habla de libertad', prio:true, when:()=>sagaIx(S.wave)===2 && has('floch') && has('eren') && !S.flags.jaeger && !S.flags.flochLoyal,
   d:'Floch ha reunido a unos cuantos reclutas alrededor del fuego. Dice que Eren es el único que puede salvar la isla y que los mandos son unos cobardes.',
   o:[{l:'Darle la razón', d:'Floch no lo olvidará.', f(){ S.flags.jaeger=1; return 'Floch sonríe. Esa noche, varios reclutas se atan un pañuelo al brazo.'; }},
      {l:'Pararle los pies', d:'Floch sube 2 niveles y se queda con vosotros.', f(){ S.flags.flochLoyal=1; levelUp(who('floch')); levelUp(who('floch')); return 'Floch se calla. Al día siguiente es el primero en formar.'; }}]},
  {n:'La tumba de Uri Reiss', prio:true, when:()=>onRoute('reina') && sagaIx(S.wave)===2 && has('historia') && !S.flags.uri,
   d:'Detrás de la capilla hay una tumba sencilla con un nombre: Uri Reiss. Historia nunca ha oído hablar de él.',
   o:[{l:'Que Historia se quede un rato', d:'Historia sube 2 niveles.', f(){ S.flags.uri=1; levelUp(who('historia')); levelUp(who('historia')); return 'Historia pasa la mano por la piedra. Su familia guardaba secretos hasta en los muertos.'; }},
      {l:'Seguir adelante', d:'Todos recuperan el 20 % de sus PV.', f(){ S.flags.uri=1; healAll(.2); return 'No hay tiempo para los muertos. Pero Historia mira atrás dos veces.'; }}]}
);

// escenas tras ciertos jefes: Kenny, Zeke y Floch
const STORY_SCENES = {
  kenny:{when:b=>b==='kap', title:'Kenny Ackerman, malherido', art:()=>portrait('kenny',true),
    body:'Kenny se arrastra hasta un árbol y se sienta. Saca una jeringa del bolsillo y la mira sin prisa. «Todos somos esclavos de algo», dice.',
    o:[{l:'Que os dé la jeringa', d:'Puede salir un poder de los Nueve que aún no tengáis.', f(){ const miss=MINOR.filter(k=>!(k in S.pw)); S.flags.kennyJeringa=1; if(miss.length) S.q.unshift({k:'drop', p:pick(miss), src:'event'}); }},
       {l:'Llevarlo con vosotros', d:'Kenny se une al 40 % de sus PV (si hay hueco).', ok:()=>S.squad.length<4, f(){ S.squad.push({id:'kenny', lvl:joinLvl(), hp:0}); const k=S.squad[S.squad.length-1]; k.hp=Math.round(maxHp(k)*.4); codex('s','kenny'); S.flags.kenny=1; }}]},
  zeke:{when:b=>(b==='bes'||b==='bes2') && !S.squad.some(s=>s.id==='zeke') && !S.fallen.includes('zeke'), title:'Zeke Jaeger, en la nuca de la Bestia', art:()=>portrait('zeke',true),
    body:'El portador de la Bestia cuelga de la nuca, medio fundido con la carne. Lleva gafas y no deja de sonreír. Dice que es el hermano de Eren.',
    o:[{l:'Capturarlo', d:'Zeke se une al escuadrón con su poder (si hay hueco y nadie lo tiene).', ok:()=>S.squad.length<4, f(){ S.squad.push({id:'zeke', lvl:joinLvl(), hp:0}); const z=S.squad[S.squad.length-1]; bringPower('zeke'); z.hp=Math.round(maxHp(z)*.4); codex('s','zeke'); S.flags.zeke=1; }},
       {l:'Dejar que se lo lleven', d:'Un carguero aparece entre el humo y se lo lleva. Nada más.', f(){ S.flags.zekeLibre=1; }}]},
  floch:{when:b=>b==='flochb', title:'Floch, desarmado', art:()=>portrait('floch',true),
    body:'Floch está en el suelo, sin lanzas y sin pañuelo. «Alguien tenía que hacer lo que nadie se atrevía», repite.',
    o:[{l:'Perdonarlo', d:'Vuelve al escuadrón al 30 % de sus PV y no volverá a cambiar de bando.', ok:()=>S.squad.length<4, f(){ S.squad.push({id:'floch', lvl:joinLvl(), hp:0}); const f=S.squad[S.squad.length-1]; f.hp=Math.round(maxHp(f)*.3); S.flags.flochLoyal=1; S.flags.away=(S.flags.away||[]).filter(x=>x!=='floch'); }},
       {l:'Dejarlo preso', d:'Floch se queda en Shiganshina, vigilado.', f(){ S.fallen.push('floch'); }}]}
};
function storyScenesAfter(bossId){ return Object.keys(STORY_SCENES).filter(k=>STORY_SCENES[k].when(bossId)).map(id=>({k:'story', id})); }
function storyAct(sc, i){ const o=STORY_SCENES[sc.id].o[i]; if(o && (!o.ok || o.ok())) o.f(); }

// epílogos nuevos
EPILOGUES.push(
  {k:'sotano', who:'eren', n:'El sótano', hint:'La llave de Grisha abre algo más que una puerta.',
   c:()=>has('eren') && S.flags.diarios && !S.erenFell, d:'Eren relee los diarios de su padre una última vez y los guarda en el sótano, donde estaban. Ahora sabe lo que hay al otro lado del mar, y ha elegido no temerlo.'},
  {k:'hermanos', who:'zeke', n:'Hermanos', hint:'Dos hijos de Grisha en el mismo escuadrón, vivos al final.',
   c:()=>has('zeke') && has('eren'), d:'Eren y Zeke se sientan en el muro sin decirse gran cosa. Comparten padre, un poder cada uno y ninguna gana de hablar de él.'},
  {k:'ackerman', who:'kenny', n:'Tío y sobrino', hint:'Dos Ackerman en el mismo bando.',
   c:()=>has('kenny') && has('levi'), d:'Kenny le enseña a Levi a servir el té como lo hacía su madre. Levi no lo admite, pero desde entonces lo sirve así.'},
  {k:'floch', who:'floch', n:'Segunda oportunidad', hint:'Perdonar a quien se llevó a los jaegeristas.',
   c:()=>has('floch') && onRoute('jaeger'), d:'Floch se queda en el puerto para ayudar a reparar lo que rompió. Nadie le da las gracias, y no las pide.'}
);

// ================= Senda de la saga 2: si Eren cae en Trost =================
ALT_SAGAS.caida = {slot:1, n:'El muro Rose cae', d:'Eren cayó en Trost. Sin el Titán de Ataque nadie tapa la brecha, y la retirada empieza en los pueblos del sur.',
  hint:'Se abre si Eren cae en la saga 1.', ending:null,
  zones:[{n:'Ragako', boss:'bes', pool:['t5','t7','an1','an3','cu'], mo:19},
         {n:'Bosques del sur', boss:'son', pool:['t7','t10','an2','an3'], mo:20},
         {n:'La brecha de Rose', boss:'aco', boss2:'col', pool:['t10','t15','an2','bl'], mo:21}]};
{ const _cr = crossroadAt;
  crossroadAt = function(i){ if(i===0 && !S.daily && S.fallen.includes('eren') && !has('eren')) return 'caida'; return _cr(i); }; }
EVENTS.push(
  {n:'Un titán que lucha contra titanes', prio:true, when:()=>onRoute('caida') && sagaIx(S.wave)===1 && S.fallen.includes('eren') && !S.flags.erenVuelve && !S.flags.erenNo,
   d:'Entre el humo aparece un titán de quince metros que no os mira: arranca la nuca a otro titán de un puñetazo y ruge. Tiene los ojos verdes.',
   o:[{l:'Seguirlo hasta que se detenga', d:'Eren vuelve al escuadrón con el Titán de Ataque. Si estáis cuatro, el de menor nivel vuelve a las murallas.', f(){
        S.flags.erenVuelve=1; S.fallen=S.fallen.filter(x=>x!=='eren');
        if(S.squad.length>=4){ const w=S.squad.slice().sort((a,b)=>a.lvl-b.lvl)[0]; release(w.id); S.squad=S.squad.filter(x=>x!==w); }
        S.squad.push({id:'eren', lvl:joinLvl(), hp:0}); const e=S.squad[S.squad.length-1]; bringPower('eren'); e.hp=Math.round(maxHp(e)*.5);
        return 'El titán se desploma y de la nuca sale Eren, sin un rasguño en los brazos que perdió. Nadie sabe explicarlo. Él tampoco.'; }},
      {l:'Dejarlo atrás', d:'Todos suben 1 nivel. Eren no vuelve.', f(){ S.flags.erenNo=1; S.squad.forEach(levelUp); return 'El titán se aleja hacia la brecha. Sea lo que sea, ya no es asunto vuestro.'; }}]}
);
EPILOGUES.push({k:'regreso', who:'eren', n:'El que volvió de dentro', hint:'Alguien que cayó en Trost no se quedó allí.',
  c:()=>has('eren') && S.flags.erenVuelve, d:'Eren no recuerda nada del tiempo que pasó dentro del titán. Solo que alguien le gritaba que siguiera luchando, y que le hizo caso.'});
EPILOGUES.push({k:'guerreros', who:'bertolt', n:'Los tres de Marley', hint:'Perdonar a los tres guerreros y llegar con ellos al final.',
  c:()=>['reiner','annie','bertolt'].every(id=>S.loyal[id] && has(id)), d:'Reiner, Annie y Bertolt vuelven juntos al pueblo donde se criaron. Esta vez nadie les ha dado una misión: solo quieren ver si sigue en pie.'});

// ================= Las bajas también escriben la historia =================
// vínculos: quién reacciona cuando cae quién
const BONDS = {eren:['mikasa','armin','zeke'], mikasa:['eren','armin'], armin:['eren','mikasa'], sasha:['connie','jean'], connie:['sasha','jean'], jean:['connie','sasha'],
  erwin:['levi','hange'], levi:['erwin','hange','kenny'], hange:['levi','erwin'], historia:['ymir'], ymir:['historia'], reiner:['bertolt','annie'], bertolt:['reiner','annie'], annie:['reiner','bertolt'],
  mike:['nanaba','erwin'], nanaba:['mike'], gabi:['pieck'], pieck:['gabi'], zeke:['eren'], kenny:['levi'], floch:['jean']};
const deadIn = id => (S.deaths||[]).includes(id);
const vowOf = id => S && S.vow && S.vow[id];
// tras un combate con bajas: duelo (se apunta quién murió y quién puede jurar por él)
function mournScene(ids){
  const heirs = ids.flatMap(d=>(BONDS[d]||[]).filter(id=>has(id) && !vowOf(id)).map(id=>[id,d]));
  return {k:'duelo', ids, heirs};
}
function mournAct(sc, i){
  if(i==='vow') sc.heirs.forEach(([id,d])=>{ (S.vow=S.vow||{})[id]=d; const s=who(id); if(s){ levelUp(s); levelUp(s); } });
  else { S.gas=Math.min(S.gasMax, S.gas+3); healAll(.1); }
}
// una sola jeringa: el dilema de Shiganshina
EVENTS.push({n:'Una sola jeringa', prio:true, when:()=>sagaIx(S.wave)===2 && !onRoute('reina') && has('levi') && has('erwin') && has('armin') && !('colosal' in S.pw) && !S.flags.jeringa,
  d:'Erwin y Armin han caído en la misma carga. Los dos respiran aún, pero apenas. Levi tiene una jeringa con el poder del Colosal y solo da para uno.',
  o:[{l:'Salvar a Erwin', d:'Erwin hereda el Colosal y vuelve con toda su vida. Armin muere.', f(){ S.flags.jeringa='erwin'; const a=who('armin'); release('armin'); S.squad=S.squad.filter(x=>x!==a); S.fallen.push('armin'); S.deaths=(S.deaths||[]).concat('armin'); grant('colosal','erwin'); const e=who('erwin'); e.hp=maxHp(e);
       return 'Levi clava la aguja en el brazo de Erwin. Cuando el vapor se disipa, el comandante se levanta. Nadie mira a Armin.'; }},
     {l:'Salvar a Armin', d:'Armin hereda el Colosal y vuelve con toda su vida. Erwin muere.', f(){ S.flags.jeringa='armin'; const e=who('erwin'); release('erwin'); S.squad=S.squad.filter(x=>x!==e); S.fallen.push('erwin'); S.deaths=(S.deaths||[]).concat('erwin'); grant('colosal','armin'); const a=who('armin'); a.hp=maxHp(a);
       return 'Levi mira a Erwin un largo rato. Luego se arrodilla junto a Armin. «Descansa», le dice al comandante, y lo deja ir.'; }}]});
// epílogos que solo existen porque alguien no llegó
EPILOGUES.push(
  {k:'ultimaorden', who:'levi', n:'La última orden', hint:'Que el comandante no llegue al final, pero Levi sí.',
   c:()=>has('levi') && deadIn('erwin'), d:'Levi cumple la última orden de Erwin hasta el final. Luego deja la capa sobre una tumba sin nombre y se queda allí más de lo que nadie esperaba.'},
  {k:'mar', who:'eren', n:'El mar que querías ver', hint:'Alguien soñaba con ver el mar y no llegó a verlo.',
   c:()=>deadIn('armin') && (has('eren')||has('mikasa')), d:'Llevan una concha de vuelta a la isla y la dejan donde Armin solía leer sus libros prohibidos. Era él quien quería ver el mar.'},
  {k:'patata', who:'connie', n:'Media patata', hint:'Que Sasha caiga y Connie vuelva a casa.',
   c:()=>deadIn('sasha') && has('connie'), d:'Connie visita a la familia de Sasha. Se sienta a su mesa y, sin pensarlo, parte la patata por la mitad y deja una en el plato vacío.'},
  {k:'carta', who:'historia', n:'La carta de Ymir', hint:'Ymir no vuelve, pero deja algo escrito.',
   c:()=>deadIn('ymir') && has('historia'), d:'Historia recibe una carta mal escrita y peor doblada. Es de Ymir. La lee una vez, la guarda, y no se la enseña a nadie.'},
  {k:'bufanda', who:'mikasa', n:'Sin bufanda', hint:'Que Eren caiga y Mikasa llegue al final.',
   c:()=>deadIn('eren') && has('mikasa') && !S.flags.erenVuelve, d:'Mikasa sigue llevando la bufanda. La gente le pregunta por qué y ella nunca contesta.'},
  {k:'juramento', who:null, n:'Lo juramos', hint:'Jurar por un compañero caído y cumplirlo hasta el final.',
   c:()=>Object.keys(S.vow||{}).some(id=>has(id)), d:'Quien juró por un compañero caído llega hasta el final. Al volver, dice su nombre en voz alta delante de todos, para que nadie lo olvide.'}
);
