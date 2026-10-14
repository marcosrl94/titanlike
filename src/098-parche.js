// ---------- Notas del parche: aparecen una vez por jugador tras cada actualización ----------
const PATCHES = [
  {v:'2026-10-15.1', t:'Dados que ruedan, jefes con entrada propia y combate auditado', items:[
    'Dados: el d20 rueda en pantalla en cada corte (dorado en el crítico, rojo cuando resbala), en cada tirada de esquiva, con el bono de velocidad, y en las pruebas de habilidad de los eventos, que se quedan en la página con el resultado. Se pueden desactivar en Ajustes.',
    'Jefes: cada cambiante entra con franjas de cine, su nombre y su firma: vapor y calor del Colosal, cristal de la Hembra, lluvia de rocas de la Bestia, embestida del Acorazado, púas del Martillo de Guerra, el pilar de luz y el temblor del Fundador… Sus ataques especiales, la segunda fase y la coraza rota tienen efecto propio, y abatir a un jefe se celebra.',
    'Transformaciones: la pantalla se oscurece, caen dos rayos, el soldado crece en su titán y cada poder suelta su efecto. Los golpes tienen chispas (doble tajo en el crítico), los mordiscos dejan zarpazos, las esquivas se ven y el lanzamiento de la Bestia manda al soldado por los aires.',
    'Revisadas todas las combinaciones (cada soldado con cada habilidad, poder y objeto contra cada enemigo y jefe, y miles de combates al azar). Corregido: una carga explosiva que abatía al último enemigo dejaba el combate colgado; Flanqueo, Olfato y Martillo de Guerra duran lo mismo para todos, también para quien los lanza; la bengala de humo ciega a todos de verdad (también a los jefes y a los titanes alerta) y no los deja alerta; las marcas ya no se acortan al solaparse (Armin, Artillería, El Grito); el turno perdido por aturdimiento cuenta para recargas y mejoras; Primeros auxilios no anuncia curas de 0; Armin no marca a un titán ya abatido; la coraza rota y la segunda fase se anuncian después del golpe que las provoca.'
  ]},
  {v:'2026-10-14.6', t:'Revisión de combate, curva de dificultad y temporada nueva', items:[
    'Escalado: a partir de la saga 2 los enemigos crecen un 13 % por jornada en vez de un 15 %, y los saltos entre sagas son menores (×1,17, ×1,65 y ×1,85 en vez de ×1,2, ×1,72 y ×1,95). La saga 1 no cambia. En simulación, el final del acto 2 y las sagas 3 y 4 pasan de superarse un 78-90 % de las veces a un 85-96 %.',
    'Titán Fundador: 470 PV (antes 500) y los titanes que llama al Retumbar salen más débiles (60 % de la escala en vez del 80 %).',
    'Mecánicas revisadas una a una: el lanzamiento de la Bestia y la patada de la Hembra solo aturden si el golpe alcanza (si se esquiva, no); el Sonriente y la Mandíbula se lanzan a por el Señuelo cuando lo hay; cada titán anuncia su ataque especial en la ficha («lanzamiento», «patada», «devora», «todo el escuadrón», «endurece») para poder prepararse; el Acorazado queda expuesto exactamente dos turnos al romperle la coraza, como dice el texto.',
    'Clasificación reiniciada: empieza la Temporada 1. Las partidas anteriores se conservan en la cuenta (logros, registro, New Game+) pero la tabla solo cuenta expediciones nuevas.'
  ]},
  {v:'2026-10-14.5', t:'Combate a lo Pokémon, jefes con mecánica y clasificación justa', items:[
    'Combate: nuestros soldados aparecen en el escenario, delante de los titanes, y las fichas de los enemigos pasan a cajas en la esquina. Los ataques salen del soldado y llegan al titán; pulsar la ficha o la figura del enemigo lo elige como objetivo.',
    'Acorazado: lleva coraza (barra azul) y recibe la mitad de daño hasta romperla; después queda expuesto dos turnos (×1,5) y la regenera en parte. Las lanzas trueno, la Mandíbula y las cargas la ignoran.',
    'Bestia: además de la lluvia de rocas, agarra a un soldado y lo lanza: pierde su próximo turno (el Señuelo lo esquiva). Hembra: patada endurecida que aturde. Sonriente y Mandíbula: si nadie cubre al más herido con Escudo humano o Señuelo, el mordisco es devastador (×2,2 en vez de ×1,2).',
    'Contra el ejército de Marley la orden «A la nuca» se llama «Disparo certero» y remata soldados y máquinas.',
    'Clasificación: ahora cuenta la dificultad y la vuelta. Puntos = jornadas × 1,25 en Veterano × (1 + 0,1 por vuelta de New Game+), con insignia en la tabla. Recluta sigue sin puntuar.',
    'Empezar en las sagas 2, 3 o 4: los soldados raros (Levi, Erwin, Mike, Pieck) están disponibles y eliges con qué poderes de los Nueve sales.',
    'El juego registra de forma anónima cómo van los combates (jornada, escuadrón, dificultad, resultado) para seguir equilibrando con partidas reales. Solo con sesión iniciada.'
  ]},
  {v:'2026-10-14.4', t:'Reclutas al nivel del escuadrón y paquete «sin licencia»', items:[
    'Los reclutas se unen al nivel del escuadrón (la media, si va por delante de la jornada) y su carta muestra PV, ataque y velocidad a ese nivel, con las mejoras que ya llevéis.',
    'Paquete «sin licencia»: en «Imágenes y música» hay un botón que carga nombres de parodia e iconos propios para los 18 soldados (Tukasa, Patasha, Lavi…). Los paquetes .json ahora pueden traer nombres además de imágenes, y hay un botón para volver a los originales.'
  ]},
  {v:'2026-10-14.3', t:'New Game+ y combate a lo ancho', items:[
    'New Game+: al completar la campaña se desbloquea la siguiente vuelta en «Nueva expedición». Sales desde Trost con dos reclutas y hasta tres reliquias (poderes de los Nueve ganados en campañas anteriores), y los enemigos suben un 12 % por vuelta. Encadenar vueltas es la forma de reunir los Nueve. Dos logros nuevos.',
    'Combate y mapa a lo ancho de la pantalla: escenario a la izquierda, escuadrón y órdenes a la derecha. Desde 1280×720 todo cabe sin hacer scroll; en el móvil, las órdenes siguen fijas abajo.',
    'La ficha de cada soldado (clic derecho o pulsación larga) muestra su esquiva y sus rasgos para las pruebas de habilidad.'
  ]},
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
// parches que un jugador aún no ha leído: todos los posteriores al último que vio (o todos, si nunca vio ninguno)
function unreadPatches(){ const seen=store.get('patch'); const ix=PATCHES.findIndex(p=>p.v===seen); return ix<0 ? PATCHES : PATCHES.slice(0, ix); }
function patchHTML(list){
  return list.map(p=>`<section class="patch"><span class="lbl">${esc(p.v)}</span><b>${esc(p.t)}</b><ul>${p.items.map(i=>`<li>${esc(i)}</li>`).join('')}</ul></section>`).join('');
}
function showPatch(list){
  list = list || PATCHES;
  $('sheet').innerHTML = `<div class="sheet-in patch-in"><span class="lbl" style="color:var(--gold)">Novedades${list.length>1?` · ${list.length} parches`:''}</span>${patchHTML(list)}<div class="row"><button class="btn sm" data-a="closesheet">Entendido</button></div></div>`;
  $('sheet').hidden=false;
  try{ store.set('patch', PATCH.v); }catch(e){}
}
// jugadores que ya tenían progreso: al entrar ven todos los parches que no hayan leído, del más nuevo al más antiguo
if(typeof document!=='undefined'){
  const u = unreadPatches();
  if(u.length){ if(store.get('meta')) setTimeout(()=>showPatch(u), 400); else store.set('patch', PATCH.v); }
}
