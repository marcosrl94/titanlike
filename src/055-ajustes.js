// ---------- Ajustes del jugador (se guardan en este navegador) ----------
const CFG_DEF = {
  mus: 80, sfx: 80,              // volumen de música y efectos, 0–100
  anim: 'normal',                // velocidad de las animaciones: normal, fast, instant
  preview: true, intent: true,   // previsión de daño e intenciones de los titanes
  shake: true, flash: true,      // sacudidas de pantalla y destellos
  dice: true,                    // dados animados en combate y eventos
  calm: false,                   // reducir movimiento
  big: false,                    // texto más grande
  diff: 'explorador'             // dificultad con la que se empiezan las expediciones
};
let CFG = Object.assign({}, CFG_DEF, store.get('cfg') || {});
const ANIM = {normal:{n:'Normal', k:1}, fast:{n:'Rápida', k:.5}, instant:{n:'Instantánea', k:.12}};
const vol = k => Math.max(0, Math.min(100, +CFG[k] || 0)) / 100;
function setCfg(k, v){
  CFG[k] = v; store.set('cfg', CFG); applyCfg();
}
// aplica lo que no depende de volver a dibujar la pantalla
function applyCfg(){
  if(typeof document === 'undefined') return;
  document.body.classList.toggle('calm', !!CFG.calm);
  document.body.classList.toggle('big', !!CFG.big);
  if(typeof AU !== 'undefined' && AU.ctx){
    if(AU.sfxBus) AU.sfxBus.gain.value = .7 * vol('sfx');
    if(AU.bus) AU.bus.gain.value = .8 * vol('mus');
  }
}
