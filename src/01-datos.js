// ---------- Datos ----------
const STYLE = {veloz:'Veloz', fuerza:'Fuerza', tactico:'Táctico', preciso:'Preciso'};
const CLS = {pequeno:'Pequeño', grande:'Grande', anormal:'Anormal', blindado:'Blindado'};
const EFF = {
  veloz:{grande:1.5, pequeno:.75}, fuerza:{blindado:1.5, anormal:.75},
  tactico:{anormal:1.5, blindado:.75}, preciso:{pequeno:1.5, grande:.75}
};
// sg: saga a partir de la que se puede reclutar
const ROSTER = {
  eren:   {n:'Eren',   st:'fuerza',  hp:95,  atk:16, spd:10, sg:0, tr:{aguante:2},
           sk:{n:'Furia', gas:1, tgt:'enemy', d:'Daño ×1,5; ×2,2 si le quedan menos de la mitad de los PV.'}},
  mikasa: {n:'Mikasa', st:'veloz',   hp:85,  atk:19, spd:16, sg:0, tr:{sigilo:2},
           sk:{n:'Corte doble', gas:2, tgt:'enemy', d:'Dos cortes completos sobre el mismo titán, cada uno con su propia tirada de crítico.'}},
  armin:  {n:'Armin',  st:'tactico', hp:82,  atk:14, spd:12, sg:0, tr:{ingenio:4},
           sk:{n:'Plan de Armin', gas:1, tgt:'enemy', d:'Corta y marca a un titán: recibe +50 % de daño durante 3 turnos.'}},
  sasha:  {n:'Sasha',  st:'preciso', hp:70,  atk:15, spd:14, sg:0, tr:{percepcion:3, sigilo:1},
           sk:{n:'Flecha al ojo', gas:1, tgt:'enemy', d:'Daño ×1,4 y ciega a un titán normal: su próximo ataque falla y después se pone alerta 2 turnos. Los cambiantes regeneran el ojo al instante.'}},
  jean:   {n:'Jean',   st:'tactico', hp:80,  atk:15, spd:13, sg:0, tr:{ingenio:2},
           sk:{n:'Flanqueo', gas:2, cd:2, tgt:'none', d:'Todo el escuadrón gana +35 % de daño durante 2 turnos.'}},
  connie: {n:'Connie', st:'veloz',   hp:70,  atk:14, spd:17, sg:0, tr:{sigilo:3},
           sk:{n:'Señuelo', gas:1, cd:2, tgt:'none', d:'Atrae a los titanes 2 turnos y esquiva el primer golpe.'}},
  hange:  {n:'Hange',  st:'tactico', hp:75,  atk:14, spd:12, sg:0, tr:{ingenio:4, percepcion:1},
           sk:{n:'Lanza trueno', gas:3, tgt:'enemy', d:'Daño ×2,6 que ignora las resistencias del titán.'}},
  reiner: {n:'Reiner', st:'fuerza',  hp:115, atk:15, spd:8,  sg:0, tr:{aguante:4},
           sk:{n:'Escudo humano', gas:2, cd:3, tgt:'none', d:'3 turnos: recibe los golpes del escuadrón a mitad de daño.'}},
  annie:  {n:'Annie',  st:'preciso', hp:80,  atk:18, spd:15, sg:0, tr:{sigilo:2, aguante:1},
           sk:{n:'Barrido', gas:2, tgt:'enemy', d:'Daño ×1,5 y derriba a un titán normal: pierde su próximo turno y luego se pone alerta 2 turnos.'}},
  historia:{n:'Historia',st:'preciso',hp:65, atk:11, spd:12, sg:0, tr:{percepcion:2},
           sk:{n:'Primeros auxilios', gas:1, cd:1, tgt:'ally', d:'Cura a un compañero el 30 % de sus PV.'}},
  levi:   {n:'Levi',   st:'veloz',   hp:90,  atk:24, spd:20, sg:0, rare:true, tr:{sigilo:3, aguante:2},
           sk:{n:'Torbellino', gas:3, tgt:'none', d:'Corta a todos los titanes al 100 %.'}},
  erwin:  {n:'Erwin',  st:'tactico', hp:85,  atk:13, spd:11, sg:0, rare:true, tr:{ingenio:3, aguante:1},
           sk:{n:'¡Avanzad!', gas:3, tgt:'enemy', d:'Cada compañero vivo asesta un corte inmediato al objetivo.'}},
  ymir:   {n:'Ymir',   st:'fuerza',  hp:90,  atk:17, spd:13, sg:1, tr:{percepcion:2, aguante:1},
           sk:{n:'Dentellada', gas:2, tgt:'enemy', d:'Daño ×1,7. Si abate al titán, recupera el 30 % de sus PV.'}},
  nanaba: {n:'Nanaba', st:'veloz',   hp:78,  atk:17, spd:17, sg:1, tr:{sigilo:2},
           sk:{n:'Pasada rasante', gas:2, tgt:'none', d:'Dos cortes al 110 % sobre titanes al azar.'}},
  mike:   {n:'Mike',   st:'fuerza',  hp:105, atk:18, spd:11, sg:1, rare:true, tr:{percepcion:5},
           sk:{n:'Olfato', gas:2, cd:2, tgt:'none', d:'Huele el punto débil: 2 turnos en los que todo el escuadrón asesta críticos.'}},
  floch:  {n:'Floch',  st:'preciso', hp:75,  atk:16, spd:13, sg:2, tr:{aguante:2},
           sk:{n:'Salva de lanzas', gas:3, tgt:'none', d:'Daño ×1,2 a todos los titanes, ignorando resistencias.'}},
  gabi:   {n:'Gabi',   st:'preciso', hp:68,  atk:20, spd:15, sg:3, tr:{percepcion:2, sigilo:1},
           sk:{n:'Rifle antititán', gas:2, tgt:'enemy', d:'Un disparo de daño ×2,1.'}},
  pieck:  {n:'Pieck',  st:'tactico', hp:82,  atk:14, spd:12, sg:3, rare:true, tr:{ingenio:3},
           sk:{n:'Artillería', gas:3, tgt:'none', d:'Daño ×0,8 a todos los titanes y los deja marcados 2 turnos.'}}
};
// pruebas de habilidad (d20): cada estilo aporta +1 a una y cada soldado tiene sus rasgos (tr)
const SKILLS = {sigilo:'Sigilo', percepcion:'Percepción', aguante:'Aguante', ingenio:'Ingenio'};
const STYLE_SKILL = {veloz:'sigilo', fuerza:'aguante', tactico:'ingenio', preciso:'percepcion'};
// a: figura (R cabeza, sh hombros, bel cadera, arm brazo, hy altura de la cabeza). m: mecánicas de jefe (cada cuántos turnos)
const TITANS = {
  t3:  {n:'Titán de 3 m',  cls:'pequeno', hp:42,  atk:9,  spd:14, a:{R:25,sh:27,bel:24,arm:36,hy:66,h:'#3d342c'}},
  t5:  {n:'Titán de 5 m',  cls:'pequeno', hp:55,  atk:11, spd:13, a:{R:22,sh:31,bel:22,arm:42,hy:58,h:'#6b5a45',bald:1}},
  t7:  {n:'Titán de 7 m',  cls:'pequeno', hp:66,  atk:12, spd:12, a:{R:20,sh:34,bel:22,arm:48,hy:50,h:'#8a5a3a'}},
  t10: {n:'Titán de 10 m', cls:'grande',  hp:85,  atk:14, spd:7,  a:{R:16,sh:42,bel:19,arm:60,hy:36,h:'#2e2a26'}},
  t15: {n:'Titán de 15 m', cls:'grande',  hp:115, atk:17, spd:6,  a:{R:15,sh:46,bel:17,arm:66,hy:30,h:'#8a7a5a'}},
  pm:  {n:'Titán puro de Marley', cls:'grande', hp:125, atk:18, spd:8, a:{R:15,sh:44,bel:20,arm:64,hy:32,h:'#3d342c',bald:1}},
  an1: {n:'Anormal saltarín', cls:'anormal', hp:62, atk:9, spd:15, twice:true, a:{R:20,sh:34,bel:16,arm:52,hy:48,h:'#b8a070',tilt:-15,up:1}},
  an2: {n:'Anormal reptante', cls:'anormal', hp:78, atk:13, spd:12, a:{R:22,sh:38,bel:22,arm:54,hy:52,h:'#2e2a26',tilt:13,up:1}},
  an3: {n:'Anormal corredor', cls:'anormal', hp:68, atk:12, spd:18, a:{R:18,sh:32,bel:15,arm:56,hy:42,h:'#6b5a45',tilt:9,up:1}},
  cu:  {n:'Titán cuadrúpedo', cls:'anormal', hp:95, atk:14, spd:14, a:{R:21,sh:44,bel:26,arm:44,hy:62,h:'#2e2a26',tilt:-6}},
  bl:  {n:'Titán de piel dura', cls:'blindado', hp:100, atk:14, spd:7, a:{R:16,sh:44,bel:20,arm:58,hy:36,h:'#bdb8a8',armor:1}},
  col: {n:'Titán Colosal', cls:'grande', hp:220, atk:12, spd:5, boss:1, m:{aoe:3, txt:'VAPOR ABRASADOR'}, a:{R:19,sh:52,bel:22,arm:60,hy:36,flay:1,bald:1}},
  hem: {n:'Titán Hembra', cls:'anormal', hp:235, atk:12, spd:16, boss:1, m:{harden:3}, a:{R:15,sh:38,bel:15,arm:62,hy:30,h:'#e6cf7c',flay:1,bob:1}},
  hem2:{n:'Titán Hembra acorralada', cls:'anormal', hp:270, atk:11, spd:18, boss:1, twice:true, m:{harden:3}, a:{R:15,sh:38,bel:15,arm:62,hy:30,h:'#e6cf7c',flay:1,bob:1,up:1}},
  bes: {n:'Titán Bestia', cls:'grande', hp:335, atk:14, spd:10, boss:1, m:{aoe:2, txt:'LLUVIA DE ROCAS'}, a:{R:14,sh:44,bel:20,arm:92,hy:36,h:'#4a3f33',fur:1}},
  aco: {n:'Titán Acorazado', cls:'blindado', hp:340, atk:15, spd:9, boss:1, m:{aoe:3, txt:'EMBESTIDA'}, a:{R:15,sh:48,bel:18,arm:64,hy:30,h:'#d9c27a',armor:1}},
  son: {n:'Titán Sonriente', cls:'anormal', hp:350, atk:15, spd:13, boss:1, m:{devour:3}, a:{R:24,sh:40,bel:20,arm:58,hy:44,h:'#c9b48a',tilt:-7}},
  rod: {n:'Titán de Rod Reiss', cls:'grande', hp:520, atk:11, spd:3, boss:1, m:{aura:.3}, a:{R:12,sh:54,bel:40,arm:50,hy:44,flay:1,bald:1}},
  aco2:{n:'Titán Acorazado, segundo asalto', cls:'blindado', hp:400, atk:16, spd:10, boss:1, m:{aoe:3, harden:4, txt:'EMBESTIDA'}, a:{R:15,sh:48,bel:18,arm:64,hy:30,h:'#d9c27a',armor:1,up:1}},
  col2:{n:'Titán Colosal de Bertolt', cls:'grande', hp:470, atk:15, spd:6, boss:1, m:{aoe:2, aura:.2, txt:'EXPLOSIÓN DE VAPOR'}, a:{R:19,sh:52,bel:22,arm:60,hy:36,flay:1,bald:1,up:1}},
  mar: {n:'Titán Martillo de Guerra', cls:'blindado', hp:410, atk:16, spd:12, boss:1, m:{aoe:3, harden:2, txt:'PÚAS DE CRISTAL'}, a:{R:15,sh:40,bel:16,arm:62,hy:30,sk:'#e4e0d2',bald:1,armor:1}},
  man: {n:'Titán Mandíbula', cls:'pequeno', hp:350, atk:16, spd:22, boss:1, twice:true, m:{devour:4}, a:{R:23,sh:34,bel:18,arm:50,hy:56,h:'#d9c27a',tilt:8,armor:1}},
  atq: {n:'Titán de Ataque', cls:'grande', hp:100, atk:15, spd:10, a:{R:15,sh:42,bel:17,arm:62,hy:30,h:'#3a2a1e',bob:1}},
  car: {n:'Titán Carguero', cls:'anormal', hp:100, atk:12, spd:14, a:{R:20,sh:46,bel:28,arm:40,hy:66,h:'#22201f',tilt:-4,armor:1}},
  // Marley: ejército humano (saga 4, Liberio). v: verbo del ataque; a.k: tipo de dibujo
  sol: {n:'Soldado de Marley', cls:'pequeno', hp:58, atk:13, spd:15, v:'dispara a', a:{k:'soldier'}},
  tir: {n:'Tirador de élite', cls:'anormal', hp:64, atk:15, spd:19, v:'dispara a', a:{k:'sniper'}},
  art: {n:'Artillería antititán', cls:'grande', hp:118, atk:20, spd:5, v:'cañonea a', a:{k:'cannon'}},
  pz:  {n:'Unidad Panzer', cls:'blindado', hp:108, atk:14, spd:9, twice:true, v:'ametralla a', a:{k:'panzer'}},
  // el Retumbar: titanes de las murallas y portadores del pasado
  mur: {n:'Titán de las murallas', cls:'grande', hp:145, atk:17, spd:4, a:{R:19,sh:50,bel:22,arm:58,hy:38,flay:1,bald:1}},
  pas: {n:'Portador del pasado', cls:'anormal', hp:92, atk:14, spd:13, a:{R:16,sh:40,bel:17,arm:60,hy:34,sk:'#b9b3a6',h:'#2e2a26',bob:1}},
  fun: {n:'Titán Fundador', cls:'grande', hp:500, atk:16, spd:8, boss:1, m:{aoe:3, harden:5, summon:3, txt:'EL RETUMBAR'}, a:{R:14,sh:50,bel:14,arm:70,hy:28,sk:'#d8d2c0',h:'#2e2a26',bob:1}}
};
const SAGAS = [
  {n:'La caída de Trost', d:'El muro Rose cede. Reclutas recién licenciados contra titanes de verdad.', start:['eren','mikasa','armin'], zones:[
    {n:'Distrito de Trost', boss:'col', pool:['t3','t5','t10','an1']},
    {n:'Bosque de árboles gigantes', boss:'hem', pool:['t5','t10','t15','an1','an2']},
    {n:'Distrito de Stohess', boss:'hem2', pool:['t7','t10','t15','an1','an2']}]},
  {n:'Choque de titanes', d:'Titanes dentro del muro y traidores en la formación.', zones:[
    {n:'Castillo de Utgard', boss:'bes', pool:['t5','t7','t10','an3','bl']},
    {n:'Muro Rose', boss:'aco', pool:['t10','t15','an2','an3','bl']},
    {n:'Llanura de los gigantes', boss:'son', pool:['t7','t15','an1','an3','cu']}]},
  {n:'Regreso a Shiganshina', d:'La operación para recuperar el muro María y llegar al sótano.', zones:[
    {n:'Distrito de Orvud', boss:'rod', pool:['t7','t10','t15','an2','bl']},
    {n:'Shiganshina', boss:'aco2', pool:['t10','t15','pm','an3','bl']},
    {n:'Muro María', boss:'col2', pool:['t15','pm','an2','cu','bl']}]},
  {n:'Marley', d:'Al otro lado del mar el enemigo es un ejército. Y luego, el Retumbar.', zones:[
    {n:'Liberio', boss:'mar', pool:['sol','sol','tir','art','pz']},
    {n:'Fuerte Salta', boss:'man', pool:['mur','pas','pas','pz','art']},
    {n:'El Retumbar', boss:'fun', pool:['mur','mur','pas']}]}
];
const PER = 15, TOTAL = SAGAS.length*PER;
const NODE = {
  c:{n:'Combate', d:'Titanes normales. Eliges una recompensa.'},
  e:{n:'Élite', d:'Más titanes y más fuertes. Eliges dos recompensas.'},
  v:{n:'Evento', d:'Una decisión con riesgo.'},
  k:{n:'Campamento', d:'Descansar, entrenar o reabastecer.'},
  b:{n:'Jefe', d:'Un titán cambiante. Abre la siguiente zona.'}
};
const UPG = {
  cuchillas:{n:'Cuchillas ultraduras', d:'+15 % de daño para todo el escuadrón (máximo 5).', stack:true, max:5},
  capa:     {n:'Capas de exploración', d:'+15 % de PV máximos para todos (máximo 5).', stack:true, max:5},
  cristal:  {n:'Placas endurecidas', d:'El escuadrón recibe un 10 % menos de daño (máximo 4).', stack:true, max:4},
  caballos: {n:'Caballos de refresco', d:'+3 de velocidad para todos (máximo 3).', stack:true, max:3},
  bengala:  {n:'Bengalas verdes', d:'+1 de gas al empezar cada combate (máximo 2).', stack:true, max:2},
  vendas:   {n:'Carro de enfermería', d:'Cura un 10 % extra tras cada combate (máximo 3).', stack:true, max:3},
  lanzas:   {n:'Lanzas trueno', d:'+30 % de daño contra los titanes cambiantes (máximo 3).', stack:true, max:3},
  bombona:  {n:'Bombonas de reserva', d:'+2 de gas máximo y depósito lleno (máximo 3).', stack:true, max:3},
  raciones: {n:'Raciones de campaña', d:'Cura ahora el 45 % de los PV de todo el escuadrón.'},
  recarga:  {n:'Bombona de repuesto', d:'+4 de gas ahora.'},
  shadis:   {n:'Instrucción de Shadis', d:'Todo el escuadrón sube 1 nivel ahora.'}
};
