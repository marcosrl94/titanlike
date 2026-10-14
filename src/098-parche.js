// ---------- Notas del parche: aparecen una vez por jugador tras cada actualización ----------
const PATCHES = [
  {v:'2026-10-14.2', t:'Parche de equilibrio: el gas manda', items:[
    'Gas: depósito de 10 (12, 14 y 16 al empezar en sagas avanzadas, tope 20). Bombonas de reserva +2 (máximo 3), bengalas verdes +1 (máximo 2) y reabastecer en el campamento solo llena el depósito.',
    'Control: los cambiantes regeneran el ojo al instante y no se dejan cegar. Un titán cegado o derribado se pone alerta dos turnos y no admite otro control.',
    'Recargas: Señuelo, Flanqueo y Olfato esperan 2 turnos; Escudo humano, 3; Primeros auxilios, 1 (y cura el 30 %).',
    'Habilidades: Corte doble son dos cortes completos (×2,0 por 2 de gas, dos tiradas de crítico); Flecha al ojo ×1,4; Barrido ×1,5; Dentellada ×1,7. Ninguna es peor que ir a la nuca.',
    'Mejoras con tope: cuchillas y capas 5, placas 4 (−10 % cada una), enfermería 3 (+10 %), lanzas trueno 3 (y solo desde la saga 2), caballos 3. Cuando se agotan aparecen mejoras de un solo uso.',
    'Dados: cada corte tira un d20 (19-20 crítico, 17-20 los Precisos, 1 resbala). Cada golpe recibido da una tirada de esquiva que mejora con la velocidad. Los eventos con riesgo son pruebas de Sigilo, Percepción, Aguante o Ingenio, y cada soldado tiene sus rasgos.',
    'Dificultad: Recluta (enemigos −15 %, 4 de gas por combate, no puntúa), Explorador (como hasta ahora) y Veterano (enemigos +15 %, 2 de gas). Se elige al empezar una expedición.',
    'Marley: en Liberio os espera el ejército (soldados, tiradores, artillería antititán y unidad Panzer); en Fuerte Salta y el Retumbar, titanes de las murallas y portadores del pasado. Seis eventos nuevos en Marley y los de la Guarnición o la Policía Militar solo salen en Paradis.',
    'Sagas 3 y 4 más duras y jefes finales reforzados. Al empezar directamente en las sagas 3 o 4 se parte con cuatro veteranos, niveles extra y más poderes.',
    'Cuenta: se puede entrar con Google o con correo y contraseña. La música propia también se guarda en la cuenta.'
  ]}
];
const PATCH = PATCHES[0];
function patchHTML(all){
  const list = all ? PATCHES : [PATCH];
  return list.map(p=>`<section class="patch"><span class="lbl">${esc(p.v)}</span><b>${esc(p.t)}</b><ul>${p.items.map(i=>`<li>${esc(i)}</li>`).join('')}</ul></section>`).join('');
}
function showPatch(all){
  $('sheet').innerHTML = `<div class="sheet-in patch-in"><span class="lbl" style="color:var(--gold)">Novedades</span>${patchHTML(all)}<div class="row"><button class="btn sm" data-a="closesheet">Entendido</button></div></div>`;
  $('sheet').hidden=false;
  try{ store.set('patch', PATCH.v); }catch(e){}
}
// jugadores que ya tenían progreso: ven las notas la primera vez que entran tras el parche
if(typeof document!=='undefined'){
  const seen = store.get('patch');
  if(seen !== PATCH.v){ if(store.get('meta')) setTimeout(()=>showPatch(false), 400); else store.set('patch', PATCH.v); }
}
