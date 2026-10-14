// ---------- Consejos: aparecen la primera vez que el jugador se encuentra cada cosa ----------
const TIPS = {
  map:    {t:'El mapa de la zona', d:'Cada círculo es una parada y solo se avanza siguiendo las líneas. Combate y Élite son peleas; Evento, una decisión; Campamento, un descanso. Al fondo espera el jefe de la zona.'},
  combat: {t:'Tu turno', d:'Corte no gasta nada. A la nuca gasta 1 de gas y remata a los titanes normales por debajo del 25 %. La tercera orden es la habilidad propia del soldado. El gas, arriba a la derecha, se recupera tras cada combate.'},
  intent: {t:'Lo que va a hacer cada titán', d:'Bajo cada titán pone a quién atacará en su turno. Los pequeños van a por el más herido si alguien baja del 60 % de PV, los grandes contra quien les acaba de cortar, los anormales buscan a los portadores de poderes y los blindados persiguen al que más daño les hace.'},
  eff:    {t:'Estilos y multiplicadores', d:'La etiqueta verde o roja sobre un titán es tu multiplicador de daño con el soldado que tiene el turno: ×1,5 si su estilo le va bien, ×0,75 si no. Cambia con cada soldado.'},
  boss:   {t:'Un cambiante', d:'Los jefes anuncian sus ataques especiales en su intención: si pone «todo el escuadrón», viene un golpe en área. Al caer pueden soltar su poder.'},
  reward: {t:'Recompensas', d:'Eliges entre un recluta nuevo, hasta cuatro en el escuadrón, o una mejora que dura toda la expedición. Los supervivientes suben de nivel tras cada combate.'},
  event:  {t:'Eventos', d:'Cada opción dice lo que cuesta y lo que da. Algunos eventos solo aparecen si llevas a cierto personaje en el escuadrón.'},
  camp:   {t:'Campamento', d:'Una sola acción: descansar, entrenar o reabastecer gas. Si guardaste un poder en la reserva, aquí puedes inyectarlo.'},
  items:  {t:'Objetos', d:'Los objetos son una acción libre: puedes usar uno por turno sin perder la orden del soldado. Sobre cada titán ves el daño previsto de la orden elegida y si lo abatiría.'},
  phase:  {t:'Segunda fase', d:'Al bajar del 50 % de PV, los jefes se enfurecen: pegan algo más fuerte, son más rápidos y repiten antes sus ataques especiales.'},
  power:  {t:'Poderes de los Nueve', d:'Quien hereda un poder gana un 25 % de PV y puede transformarse una vez por combate. Cada soldado lleva uno; Eren, hasta tres.'}
};
let tipsSeen = store.get('tips') || {};
function currentTip(){
  if(tipsSeen.off) return null;
  const k = scr==='map' ? 'map'
    : scr==='combat' && C && C.active && !C.busy ? (C.titans.some(t=>t.phase) && !tipsSeen.phase ? 'phase' : C.titans.some(t=>t.boss) && !tipsSeen.boss ? 'boss' : (S.items||[]).length && !tipsSeen.items ? 'items' : ['combat','intent','eff'].find(x=>!tipsSeen[x]))
    : scr==='reward' ? 'reward' : scr==='event' ? 'event' : scr==='camp' ? 'camp'
    : scr==='scene' && S && S.scene && S.scene.k==='drop' ? 'power' : null;
  return k && !tipsSeen[k] ? k : null;
}
function tipHTML(){
  const k = currentTip(); if(!k) return '';
  return `<section class="tip" role="note" aria-label="Consejo"><span class="lbl">Consejo</span><b>${TIPS[k].t}</b><p>${TIPS[k].d}</p>
    <div class="row"><button class="btn sm" data-a="tipok" data-i="${k}">Entendido</button><button class="btn ghost sm" data-a="tipoff">No mostrar más consejos</button></div></section>`;
}
function tipAct(a, i){
  if(a==='tipok') tipsSeen[i]=1;
  if(a==='tipoff') tipsSeen.off=1;
  if(a==='tipreset') tipsSeen={};
  store.set('tips', tipsSeen); render();
}
