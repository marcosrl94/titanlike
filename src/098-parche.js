// ---------- Notas del parche: aparecen una vez por jugador tras cada actualización ----------
const PATCHES = [
  {v:'2026-10-16.16', t:'Nivel de cuenta y órdenes', items:[
    'Todo lo que juegas da experiencia: cada combate según su nota, sagas, campañas, la expedición del día y los duelos. El primer combate ganado del día da 300 extra.',
    'Tu nivel es permanente y lleva un borde que cambia con el rango: Recluta, Soldado, Veterano, Líder de escuadrón, Capitán y Comandante. Se ve en el menú, en la clasificación, en el tablón de jefes y en amigos.',
    'Órdenes: tres diarias y tres semanales, iguales para todos. Cada nivel da 5 insignias para la Intendencia y cada pocos niveles, un título.',
    'Lo que ya habías jugado cuenta: al abrir el juego recibes una vez la experiencia de tu historial.'
  ]},
  {v:'2026-10-16.15', t:'Más ritmo en cada saga', items:[
    'Las animaciones van por defecto en «Ágil», un 50 % más deprisa, y en los combates normales los golpes rutinarios son aún más cortos. Críticos, habilidades y transformaciones siguen a tamaño completo. Si prefieres el ritmo de antes, está en Ajustes como «Pausada».',
    'Retos: cada combate normal y cada élite proponen un objetivo opcional (ganar en 3 rondas, rematar en la nuca, no gastar gas…). Si lo cumples, 8 monedas extra.',
    'Condiciones de zona: niebla, noche, sol, viento o lluvia cambian una regla pequeña durante las 5 jornadas de la zona. Se ven en el mapa y en el combate.',
    'Toca una escena para ver todo su texto de golpe. Los consejos solo salen en las primeras expediciones.'
  ]},
  {v:'2026-10-15.14', t:'La saga 4 aprieta', items:[
    'Los titanes y cambiantes de la saga 4 (y de lo que la sustituya) pegan más fuerte y aguantan más. Llegar al final ya no basta: el último jefe es el examen de verdad.'
  ]},
  {v:'2026-10-15.13', t:'Fichas en rejilla, pantallas renovadas y récords validados', items:[
    'Fichas de personaje: todo el plantel en una rejilla con su mejor nota y su historial. Toca a cualquiera y su ficha se abre encima; con las flechas pasas de uno a otro y con Esc la cierras.',
    'Recompensas, campamento, eventos, mercader, escenas e Intendencia con la nueva línea: cabecera ilustrada con el arte de la zona, viñeta de narración y opciones numeradas (en escritorio, las teclas 1-9 eligen).',
    'Las pruebas de los eventos se marcan con su d20, la habilidad y la dificultad. En la Intendencia ves cada dado y cada marco antes de comprarlo.',
    'Los Nueve: el final más difícil ya se puede conseguir. Algunos jefes guardan más de lo que parece.',
    'Los récords de jefe y los duelos se comprueban en el servidor: se descartan notas que no cuadran con la puntuación y envíos fuera de una expedición en curso.'
  ]},
  {v:'2026-10-15.12', t:'Más anime: sellos, cortinillas y líneas de acción', items:[
    'Las sagas y sendas completadas llevan un sello con tu mejor nota contra su jefe final, en rótulo de manga y con líneas de acción.',
    'Cortinillas: cuando un soldado usa su habilidad, cruza la pantalla una franja diagonal con su retrato y el nombre del ataque.',
    'La nota del combate aparece con líneas de acción, y si es S o S+, con su «¡Rango S!».',
    'Rótulos de impacto en críticos y avisos, líneas de acción en las entradas de los jefes y trama de puntos en el escenario, la portada y las escenas.'
  ]},
  {v:'2026-10-15.11', t:'Interfaz renovada', items:[
    'Nueva portada: menú de juego sobre la escena de la última zona a la que has llegado, con «Continuar» bien visible, accesos con iconos (expedición del día, duelos, clasificación, Intendencia, códice, árbol, fichas) y tus marcas a mano.',
    'Marcador de la expedición más limpio: zona y saga a la izquierda; gas, monedas y jornada como fichas con icono a la derecha. El gas se pone en rojo cuando queda poco.',
    'El mercader tiene por fin su icono en el mapa, y la leyenda de casillas se pliega.',
    'En el móvil, las órdenes de combate muestran solo nombre y coste; la descripción aparece al elegirla.',
    'Transición suave al cambiar de pantalla y respuesta táctil en botones y tarjetas. Las reglas, la tabla de estilos y el registro de los Nueve pasan a «Cómo se juega».'
  ]},
  {v:'2026-10-15.10', t:'Amigos y duelos 1 contra 1', items:[
    'Escuadrones de leyenda: el escuadrón que termina una campaña queda guardado con sus niveles, poderes y mejoras. Desde ahora, cada campaña completada te da una leyenda nueva.',
    'Amigos: cada cuenta tiene un código de amigo. Pásalo, añade el de los demás y acepta sus solicitudes desde «Amigos y duelos» (portada y menú).',
    'Duelos: reta a un amigo eligiendo una de sus leyendas y una de las tuyas. Tú mandas a los tuyos; los suyos pelean solos con sus poderes convertidos en ataques especiales. El resultado queda en el historial de los dos, con marcador por amigo y botón de revancha.',
    'Entrenamiento: puedes enfrentarte a tus propias leyendas sin conexión.',
    'Calibrado con simulación: con la misma leyenda en los dos lados, quien controla gana algo más de la mitad de las veces. Un duelo dura unas diez rondas.'
  ]},
  {v:'2026-10-15.9', t:'Revisión general, arte en las sagas y menos destripes', items:[
    'Las sagas y las sendas llevan su ilustración. Las que aún no has descubierto se quedan en sombra.',
    'Menos información de la cuenta: ni el códice, ni el árbol de la historia, ni las opciones de los eventos, ni las notas de parches anteriores cuentan ya cómo se abren las sendas, los finales o los epílogos. Toca descubrirlo jugando.',
    'Nota de los combates contra jefes ajustada con partidas reales: el par sube a 4,5 rondas (6 contra el Fundador), porque estaba calibrado con un bot más rápido que cualquiera de vosotros.',
    'Revisión completa: 30 000 combinaciones de combate, 5 000 combates al azar, 2 400 campañas simuladas por todas las sendas sin un solo atasco y cinco minutos de partida real pulsando la interfaz, mercader incluido.'
  ]},
  {v:'2026-10-15.8', t:'Monedas, mercader e Intendencia', items:[
    'Monedas: cada combate ganado da monedas según su nota (de 4 con una E a 22 con una S+; el doble contra jefes, ×1,5 contra élites). Se ven arriba, junto a la jornada.',
    'Mercader: un nodo nuevo en el mapa. Vende objetos, vendas (40 % de vida), bombonas (+5 de gas), instrucción (+1 nivel a todos) y cajas con una mejora al azar. Las monedas no pasan de una expedición a otra.',
    'Intendencia (portada y menú): insignias permanentes que salen de lo conseguido (logros, finales, epílogos, sendas, notas S, récords de jefe, mejor jornada y campañas). Al acabar cada expedición ves cuántas has ganado.',
    'Se gastan en ventajas de elección, nunca en estadísticas: bolsa con 15 monedas al salir, un objeto a elegir al empezar, descuento en el mercader, relanzar recompensas una vez por saga y un cuarto bolsillo para objetos. Y en estética: dados de bronce, cristal, sangre y oro, y marcos para los retratos.',
    'En simulación, el mercader sube la tasa de victoria entre uno y cinco puntos: ayuda, pero no decide la partida.'
  ]},
  {v:'2026-10-15.7', t:'Las bajas también escriben la historia', items:[
    'Tras un combate con bajas hay duelo: el escuadrón entierra a los caídos y decide entre seguir adelante (+3 de gas y un 10 % de vida) o jurar por ellos.',
    'Juramentos: quien tenía un vínculo con el caído sube 2 niveles y hace un 10 % más de daño el resto de la expedición. Se ve en su tarjeta.',
    'Hay momentos en los que no se puede salvar a todos.',
    'Nuevos epílogos que dependen de quién no llega al final.'
  ]},
  {v:'2026-10-15.6', t:'Bertolt se une a la promoción 104', items:[
    'Bertolt se une a la promoción 104 como recluta desde la saga 1: fuerza, mucho aguante y «Golpe de vapor» (daño ×1,6 al objetivo y un 40 % al resto, ignorando resistencias).',
    'Igual que algunos de sus compañeros, guarda un secreto.'
  ]},
  {v:'2026-10-15.5', t:'Nueva senda: «El muro Rose cae»', items:[
    'Otra senda por descubrir, con el primer combate contra dos cambiantes a la vez.',
    'El árbol de la historia ya tiene desvíos en tres de las cuatro sagas. Más epílogos y tres momentos nuevos.'
  ]},
  {v:'2026-10-15.4', t:'Grisha, los Reiss, Kenny, Zeke y Floch: el árbol de la historia', items:[
    'Más personajes de la historia: Grisha Jaeger, la familia Reiss, Kenny Ackerman, Zeke Jaeger y un Floch con mucho más peso. Algunos se cruzan en tu camino; otros se pueden unir al escuadrón.',
    'Nueva senda por descubrir.',
    'Árbol de la historia (menú y códice): sagas, sendas y finales; lo que aún no has visto sale como «???». Más epílogos y momentos.'
  ]},
  {v:'2026-10-15.3', t:'Sendas alternativas, un final nuevo y epílogos de personaje', items:[
    'Sendas alternativas: lo que haces en la partida puede abrir otra saga en lugar de la de siempre, con sus propios enemigos, jefes y escenas. Cuando ocurra, lo sabrás: aparece una encrucijada y eliges tú.',
    'Un final nuevo y epílogos de personaje al terminar la campaña, según quién siga en pie y qué haya pasado por el camino.',
    'Finales, epílogos y sendas se apuntan en el códice. Las sendas que descubras se pueden empezar directamente desde «Nueva expedición».',
    'La pantalla de sagas ya no desvela qué jefe hay en cada zona.'
  ]},
  {v:'2026-10-15.2', t:'Nota en cada combate, fichas de personaje y momentos en el mapa', items:[
    'Cada combate ganado recibe una nota de E a S+: Rapidez (rondas contra el par del combate, 30 puntos), Daño recibido (30), Daño por acción (25; curar o cubrir cuenta media) y Suerte del d20 (tu media en cortes y esquivas, más los 20 naturales, menos las pifias; 15). Los remates a la nuca y acabar sin un rasguño suman; cada baja resta 15 y con bajas no hay S. Durante el combate se ve la ronda y el par.',
    'Calibrada para que cueste: jugando bien, la S+ sale en uno de cada cincuenta combates. Tres logros nuevos para quien la saque.',
    'Récords por jefe: tu mejor nota contra cada cambiante se guarda, y en Clasificación → Jefes compites con los demás (empate: menos rondas). Recluta no cuenta.',
    'Escuadrones: qué composiciones has llevado, con su nota media, porcentaje de S, expediciones y mejor jornada. Con sesión, también las de todos los jugadores (datos anónimos y agregados).',
    'Fichas de personaje: estadísticas por nivel, esquiva, rasgos, habilidad, poder propio e historial de cada soldado (combates, abatidos, daño, críticos, 20 naturales, caídas, distribución de notas y sus mejores escuadrones). Desde el menú o el códice.',
    'Momentos: al entrar en cada zona, una escena breve en penumbra con dos líneas de narración. Se quedan en el códice para volver a verlas y se pueden desactivar en Ajustes.',
    'La pantalla de sagas ya no desvela a los jefes. Arreglado también que la nube no guardaba las reliquias del New Game+ ni los logros de las vueltas.'
  ]},
  {v:'2026-10-15.2', t:'Notas de combate, récords por jefe, fichas y momentos', items:[
    'Cada combate ganado recibe nota de E a S+: Rapidez (rondas contra el par, que se ve arriba a la derecha durante el combate), Daño recibido, Daño por acción (marcas, críticos, ventajas de estilo y habilidades bien usadas suben la media) y Suerte del d20 (media de tus tiradas, los 20 naturales suman y las pifias restan). Remates a la nuca y acabar sin un rasguño dan puntos extra; cada baja resta 15 y con bajas no hay S. Para orientarse: un buen jugador saca S+ en uno de cada cincuenta combates.',
    'Clasificación · Jefes: la mejor nota de cada jugador contra cada cambiante en la temporada, con el escuadrón que la consiguió. Empate: gana quien lo hizo en menos rondas. Tres logros nuevos por sacar S y S+.',
    'Escuadrones: todas las composiciones con las que has jugado, con nota media, porcentaje de S, expediciones, mejor jornada y campañas. En «De todos» se ve lo que juega el resto (datos anónimos y agregados).',
    'Fichas de personaje: estadísticas por nivel, esquiva, estilo, habilidad, rasgos, poder propio y tu historial con cada soldado (combates, abatidos, daño, críticos, 20 naturales, caídas, reparto de notas y sus mejores escuadrones). Desde el menú o el códice.',
    'Momentos: al entrar en cada zona aparece una viñeta breve en penumbra que marca el tono de lo que viene. Se pueden volver a ver en el códice y desactivar en Ajustes.',
    'Sin spoilers: la pantalla de sagas y el mapa ya no dicen qué cambiante espera en cada zona hasta que te lo hayas encontrado.',
    'Nube: ahora se guardan las reliquias del New Game+, los logros de vuelta y tus estadísticas (fichas, escuadrones y récords), que antes se perdían al cambiar de dispositivo.'
  ]},
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
