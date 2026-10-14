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
function crossroadAt(i){
  if(S.daily) return null;
  if(i===1 && S.flags && S.flags.reina && has('historia')) return 'reina';
  if(i===2 && (!has('eren') || (S.flags && S.flags.alianza) || ['reiner','annie'].some(id=>S.loyal[id] && has(id)))) return 'paradis';
  return null;
}
function takeRoute(k){
  const A=ALT_SAGAS[k]; S.route = S.route || {}; S.route[A.slot] = k;
  const st=statsOf(); st.alts = [...new Set((st.alts||[]).concat(k))]; saveMeta({stats:st});
}

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
   c:()=>['reiner','annie'].some(id=>S.loyal[id] && has(id)),
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
