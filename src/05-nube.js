// ---------- Nube: cuenta de Google, progreso, clasificación e imágenes (solo en la versión desplegada) ----------
const CLOUD = {sb:null, user:null, name:'', board:null, busy:false, msg:''};
let oauthReturn = typeof location!=='undefined' && /access_token|error_description/.test(location.hash) || /[?&]code=/.test(location.search);   // volvemos de Google
function cloudInit(){
  const cfg = window.TL_CFG;
  if(!cfg || !window.supabase) return;
  CLOUD.sb = window.supabase.createClient(cfg.url, cfg.key);
  cloudPasses();
  CLOUD.sb.auth.onAuthStateChange((evt, sess)=>{
    const u = sess && sess.user, was = CLOUD.user;
    CLOUD.user = u || null; CLOUD.busy = false;
    if(!u && oauthReturn && /error_description/.test(location.hash)){ CLOUD.msg='Google no ha completado el acceso: '+decodeURIComponent((location.hash.match(/error_description=([^&]+)/)||[])[1]||'').replace(/\+/g,' '); oauthReturn=false; }
    if(u && oauthReturn){ oauthReturn=false; }
    if(u && !was && evt==='SIGNED_IN' && typeof toast==='function' && !(()=>{ try{ return sessionStorage.getItem('tl-hi'); }catch(e){ return 1; } })()) { try{ sessionStorage.setItem('tl-hi','1'); }catch(e){} toast('Sesión iniciada', 'Hola, ' + ((u.user_metadata||{}).full_name || u.email || '') + '. Tu progreso se guarda en tu cuenta.'); }
    if(u && !was && typeof closeMenu==='function' && !$('menu').hidden) closeMenu();
    if(evt==='PASSWORD_RECOVERY') setTimeout(askNewPassword, 300);
    if(u && (!was || was.id!==u.id)) setTimeout(cloudPull, 0);
    if(!u){ CLOUD.name=''; CLOUD.board=null; CLOUD.xpReady=false; }
    render();
  });
}
const cloudOn = () => !!CLOUD.sb;
async function cloudLogin(){
  CLOUD.busy = true; CLOUD.msg = ''; render();
  const {error} = await CLOUD.sb.auth.signInWithOAuth({provider:'google', options:{redirectTo: location.origin + location.pathname}});
  if(error){ CLOUD.busy = false; CLOUD.msg = 'No se pudo abrir el acceso con Google: ' + error.message; render(); }
}
// ---- botón de Google (guía de marca: fondo claro, logo G a color, texto «Continuar con Google») ----
const GLOGO = '<svg class="g" viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>';
const gbtn = (txt='Continuar con Google', cls='') => `<button class="gbtn ${cls}" data-a="login" ${CLOUD.busy?'disabled aria-busy="true"':''}>${GLOGO}<span>${CLOUD.busy?'Abriendo Google…':txt}</span></button>`;
const userName = () => CLOUD.name || (CLOUD.user && ((CLOUD.user.user_metadata||{}).full_name || CLOUD.user.email)) || '';
const userPic = () => { const m=(CLOUD.user&&CLOUD.user.user_metadata)||{}; return m.avatar_url || m.picture || ''; };
const avatar = (sz='') => { const p=userPic(), n=userName(); return `<span class="av ${sz}" aria-hidden="true">${p?`<img src="${esc(p)}" alt="" referrerpolicy="no-referrer">`:esc((n[0]||'?').toUpperCase())}</span>`; };
// bloque de cuenta reutilizable: portada, menú, ajustes y fin de expedición
function accountHTML(where){
  if(!cloudOn()) return '';
  const msg = CLOUD.msg ? `<p class="acc-msg" role="status">${esc(CLOUD.msg)}</p>` : '';
  if(CLOUD.user) return `<div class="acc in">${avatar()}<div class="acc-t"><b>${esc(userName())}</b><span>Progreso, imágenes y música guardados en tu cuenta</span></div>
    <div class="row acc-a"><button class="btn ghost sm" data-a="board">Clasificación</button><button class="btn ghost sm" data-a="logout">Cerrar sesión</button></div>${msg}</div>`;
  return `<div class="acc out"><div class="acc-t"><b>${where==='end'?'Que no se pierda esta expedición':'Guarda tu partida en la nube'}</b><span>Juega en el móvil y en el ordenador, sincroniza tus imágenes y música y compite en la clasificación con tus colegas.</span></div>${loginBtns()}${msg}</div>`;
}
// ---- acceso con correo y contraseña (sin correo de confirmación) ----
const MAIL = {open:false, mode:'in', f:{name:'', email:'', pass:''}, busy:false};
const loginBtns = () => `<div class="logins">${gbtn()}${MAIL.open ? mailForm() : '<button class="linkb" data-a="mailopen">o entra con tu correo</button>'}</div>`;
function mailForm(){
  const up = MAIL.mode==='up', f=MAIL.f;
  return `<form class="mailf" data-mailf="1" novalidate>
    <div class="seg" role="tablist" aria-label="Acceso con correo"><button type="button" class="btn sm ${up?'ghost':''}" role="tab" aria-selected="${!up}" data-a="mailmode" data-i="in">Entrar</button><button type="button" class="btn sm ${up?'':'ghost'}" role="tab" aria-selected="${up}" data-a="mailmode" data-i="up">Crear cuenta</button></div>
    ${up?`<label class="fld"><span>Nombre en la clasificación</span><input data-f="name" autocomplete="nickname" maxlength="32" value="${esc(f.name)}" placeholder="Cómo te verán tus colegas"></label>`:''}
    <label class="fld"><span>Correo</span><input data-f="email" type="email" autocomplete="email" inputmode="email" value="${esc(f.email)}" placeholder="tu@correo.com" required></label>
    <label class="fld"><span>Contraseña</span><input data-f="pass" type="password" autocomplete="${up?'new-password':'current-password'}" minlength="6" value="${esc(f.pass)}" placeholder="${up?'Mínimo 6 caracteres':''}" required></label>
    <div class="row"><button type="submit" class="btn" ${MAIL.busy?'disabled aria-busy="true"':''}>${MAIL.busy?'Un momento…':up?'Crear cuenta':'Entrar'}</button>${up?'':'<button type="button" class="linkb" data-a="mailreset">He olvidado la contraseña</button>'}<button type="button" class="linkb" data-a="mailclose">Cancelar</button></div>
  </form>`;
}
const AUTH_ES = m => /Invalid login/i.test(m) ? 'Correo o contraseña incorrectos.' : /already registered|already exists/i.test(m) ? 'Ese correo ya tiene cuenta: usa «Entrar».' : /Password should be/i.test(m) ? 'La contraseña necesita al menos 6 caracteres.' : /invalid.*email|Unable to validate email/i.test(m) ? 'Ese correo no parece válido.' : /rate limit|security purposes/i.test(m) ? 'Demasiados intentos seguidos. Espera un minuto y vuelve a probar.' : m;
async function mailSubmit(){
  const f=MAIL.f, email=f.email.trim();
  if(!/^\S+@\S+\.\S+$/.test(email)){ CLOUD.msg='Escribe un correo válido.'; return render(); }
  if(f.pass.length<6){ CLOUD.msg='La contraseña necesita al menos 6 caracteres.'; return render(); }
  MAIL.busy=true; CLOUD.msg=''; render();
  const r = MAIL.mode==='up'
    ? await CLOUD.sb.auth.signUp({email, password:f.pass, options:{data:{full_name:(f.name.trim()||email.split('@')[0]).slice(0,32)}, emailRedirectTo: location.origin + location.pathname}})
    : await CLOUD.sb.auth.signInWithPassword({email, password:f.pass});
  MAIL.busy=false;
  if(r.error){ CLOUD.msg = AUTH_ES(r.error.message); return render(); }
  if(MAIL.mode==='up' && !r.data.session){ CLOUD.msg='Cuenta creada. Revisa tu correo para confirmarla y luego entra.'; return render(); }
  MAIL.open=false; MAIL.f={name:'', email:'', pass:''}; render();
}
async function mailReset(){
  const email=MAIL.f.email.trim();
  if(!/^\S+@\S+\.\S+$/.test(email)){ CLOUD.msg='Escribe tu correo arriba y vuelve a pulsar «He olvidado la contraseña».'; return render(); }
  const {error} = await CLOUD.sb.auth.resetPasswordForEmail(email, {redirectTo: location.origin + location.pathname});
  CLOUD.msg = error ? AUTH_ES(error.message) : 'Te hemos enviado un correo para cambiar la contraseña.'; render();
}
// al volver del enlace de recuperación: pedir la nueva contraseña
function askNewPassword(){
  if(typeof document==='undefined') return;
  $('sheet').innerHTML = `<form class="sheet-in mailf" data-newpass="1"><b>Nueva contraseña</b><label class="fld"><span>Contraseña</span><input id="np" type="password" autocomplete="new-password" minlength="6" required></label><div class="row"><button type="submit" class="btn">Guardar</button><button type="button" class="btn ghost" data-a="closesheet">Ahora no</button></div><p class="acc-msg" id="npm"></p></form>`;
  $('sheet').hidden=false; setTimeout(()=>{ const i=$('np'); if(i) i.focus(); }, 50);
}
function mailAct(a, i){
  if(a==='mailopen'){ MAIL.open=true; CLOUD.msg=''; render(); setTimeout(()=>{ const e=document.querySelector('[data-f=email]'); if(e) e.focus(); }, 30); return true; }
  if(a==='mailclose'){ MAIL.open=false; CLOUD.msg=''; render(); return true; }
  if(a==='mailmode'){ MAIL.mode=i; CLOUD.msg=''; render(); return true; }
  if(a==='mailreset'){ mailReset(); return true; }
  return false;
}
if(typeof document!=='undefined'){
  document.addEventListener('input', ev=>{ const k=ev.target.dataset && ev.target.dataset.f; if(k) MAIL.f[k]=ev.target.value; });
  document.addEventListener('submit', async ev=>{
    const f=ev.target;
    if(f.dataset.mailf){ ev.preventDefault(); return mailSubmit(); }
    if(f.dataset.newpass){ ev.preventDefault(); const v=$('np').value, m=$('npm');
      if(v.length<6){ m.textContent='Mínimo 6 caracteres.'; return; }
      const {error}=await CLOUD.sb.auth.updateUser({password:v});
      if(error){ m.textContent=AUTH_ES(error.message); return; }
      $('sheet').hidden=true; toast('Contraseña cambiada', 'Ya puedes entrar con ella en cualquier dispositivo.'); }
  });
}
async function cloudLogout(){ try{ sessionStorage.removeItem('tl-hi'); }catch(e){} await CLOUD.sb.auth.signOut(); }
// trae el progreso de la nube y lo mezcla con el local (máximos y uniones); luego sube el resultado
async function cloudPull(){
  if(!CLOUD.user) return;
  const sb=CLOUD.sb, uid=CLOUD.user.id;
  try{
    const [p, pr] = await Promise.all([
      sb.from('progress').select('*').eq('user_id', uid).maybeSingle(),
      sb.from('profiles').select('display_name').eq('id', uid).maybeSingle()]);
    if(pr.data) CLOUD.name = pr.data.display_name;
    if(p.data){ const m=meta(), r=p.data;
      store.set('meta', Object.assign(m, {unlocked:Math.max(m.unlocked, r.unlocked), best:Math.max(m.best, r.best),
        nine:[...new Set(m.nine.concat(r.nine))], endings:[...new Set(m.endings.concat(r.endings))], runs:Math.max(m.runs||0, r.runs),
        ach:[...new Set(m.ach.concat((r.extra&&r.extra.ach)||[]))], codex:mergeCodex(m.codex, r.extra&&r.extra.codex),
        ngLevel:Math.max(m.ngLevel||0, r.ng_level||0), relics:[...new Set((m.relics||[]).concat((r.extra&&r.extra.relics)||[]))],
        stats: r.extra && r.extra.stats && (r.extra.stats.f||0) > ((m.stats&&m.stats.f)||0) ? r.extra.stats : m.stats})); }
    cloudPush(true);
    const ls = await sb.storage.from('player-images').list(uid, {search:'pack.json'});   // evita un 400 si aún no hay paquete
    if(ls.data && ls.data.some(o=>o.name==='pack.json')){ const img = await sb.storage.from('player-images').download(uid + '/pack.json'); if(img.data) mergePack(await img.data.text()); }
  }catch(e){ CLOUD.msg = 'No se pudo sincronizar con la nube.'; }
  render();
  cloudAudioPull();
  if(typeof cloudXpSync==='function') cloudXpSync();
}
let pushT = null;
function cloudPush(now){
  if(!CLOUD.user) return;
  clearTimeout(pushT);
  pushT = setTimeout(async ()=>{ const m=meta();
    const {error} = await CLOUD.sb.rpc('sync_progress_v2', {p_unlocked:m.unlocked, p_best:m.best, p_nine:m.nine, p_endings:m.endings, p_runs:m.runs||0, p_extra:{ach:m.ach, codex:m.codex, relics:m.relics||[], stats:m.stats||{}}});
    // las sagas desbloqueadas en la cuenta las fija el servidor al cerrar expediciones
    if(error){ CLOUD.msg='No se pudo guardar el progreso en la nube.'; render(); } }, now ? 0 : 800);
}
async function cloudBoard(){
  CLOUD.board = null; render();
  const {data, error} = CLOUD.tab==='hoy'
    ? await CLOUD.sb.from('daily_board').select('display_name,score,wave,user_id').eq('day', today()).limit(50)
    : await CLOUD.sb.from('leaderboard_v2').select('display_name,best,score,diff,ng,endings,nine,ng_level,user_id,xp').limit(50);
  CLOUD.board = error ? [] : data; if(error) CLOUD.msg='No se pudo cargar la clasificación.';
  if(!CLOUD.season){ const r = await CLOUD.sb.from('season_current').select('name,started_at').maybeSingle(); if(r && r.data) CLOUD.season = r.data; }   // temporada en curso: la tabla solo cuenta sus partidas
  render();
}
// récords por jefe y escuadrones de todos
function cloudBossRecord(G, comp){
  if(!CLOUD.user || !G.boss) return;
  CLOUD.sb.rpc('submit_boss_record', {p_boss:G.boss, p_score:G.score, p_grade:G.g, p_rounds:Math.max(1,G.rounds), p_comp:comp, p_diff:S.diff==='veterano'?'veterano':'explorador', p_ng:S.ng||0}).then(()=>{ CLOUD.bossBoard=null; }, ()=>{});
}
async function cloudBossBoard(boss){
  CLOUD.bossBoard = null; CLOUD.bossSel = boss; render();
  const {data, error} = await CLOUD.sb.from('boss_board').select('display_name,user_id,score,grade,rounds,comp,diff,ng,xp').eq('boss', boss).limit(30);
  CLOUD.bossBoard = error ? [] : data; render();
}
async function cloudComps(){
  CLOUD.comps = null; render();
  const {data, error} = await CLOUD.sb.from('comp_stats').select('*').limit(200);
  CLOUD.comps = error ? [] : (data||[]).filter(r=>r.comp); render();
}
// ---- amigos, leyendas y duelos ----
async function cloudFriendsLoad(){
  if(!CLOUD.user){ CLOUD.fr=null; return render(); }
  CLOUD.fr = Object.assign({}, CLOUD.fr||{}, {loading:true}); render();
  const [code, fr, du, leg] = await Promise.all([CLOUD.sb.rpc('my_friend_code'), CLOUD.sb.from('my_friends').select('*'),
    CLOUD.sb.from('my_duels').select('*').limit(20), CLOUD.sb.from('legends').select('id,user_id,name,ending,squad,created_at').order('created_at',{ascending:false}).limit(100)]);
  const legends = (leg.data||[]).map(l=>Object.assign(l, {lid:l.id}));
  // leyendas propias guardadas en la nube que este dispositivo no tenga
  const mine = legends.filter(l=>l.user_id===CLOUD.user.id), loc = legendsLocal();
  const add = mine.filter(l=>!loc.some(x=>x.cloud===l.id)).map(l=>({lid:l.id, name:l.name, ending:l.ending, at:Date.parse(l.created_at), squad:l.squad, cloud:l.id}));
  if(add.length) saveMeta({legends:loc.concat(add).sort((a,b)=>b.at-a.at).slice(0,12)});
  CLOUD.fr = {code:code.data, friends:fr.data||[], duels:du.data||[], legends, msg:CLOUD.fr&&CLOUD.fr.msg}; render();
}
async function cloudAddFriend(code){
  if(!CLOUD.user || !code) return; const {data} = await CLOUD.sb.rpc('add_friend', {p_code:code});
  const M = {enviada:'Solicitud enviada. Cuando la acepte, aparecerá en tu lista.', aceptada:'¡Ya sois amigos!', 'no existe':'No hay nadie con ese código.', 'eres tú':'Ese es tu propio código.', pending:'Ya hay una solicitud pendiente.', accepted:'Ya sois amigos.', demasiadas:'Demasiadas solicitudes seguidas. Espera un rato.'};
  CLOUD.fr = Object.assign({}, CLOUD.fr, {msg:M[data]||'No se pudo enviar.'}); cloudFriendsLoad();
}
async function cloudAnswerFriend(uid, ok){ if(!CLOUD.user) return; await CLOUD.sb.rpc('answer_friend', {p_user:uid, p_accept:ok}); cloudFriendsLoad(); }
async function cloudSaveLegend(L, runId){
  if(!CLOUD.user || !runId) return;
  for(let i=0;i<4;i++){   // la expedición se cierra en el servidor a la vez: se reintenta un par de veces
    await new Promise(r=>setTimeout(r, 1200*(i+1)));
    const {data} = await CLOUD.sb.rpc('save_legend', {p_run:runId, p_name:L.name, p_ending:L.ending, p_squad:L.squad});
    if(data){ saveMeta({legends:legendsLocal().map(x=>x.lid===L.lid ? Object.assign(x, {cloud:data}) : x)}); return; }
  }
}
function cloudRecordDuel(foeId, mineId, won, rounds, g){
  if(!CLOUD.user || !foeId || !mineId) return;
  CLOUD.sb.rpc('record_duel', {p_legend_d:foeId, p_legend_c:mineId, p_win:won, p_rounds:rounds, p_grade:g}).then(()=>{ if(scr==='amigos') cloudFriendsLoad(); }, ()=>{});
}
async function cloudRename(n){
  n = (n||'').trim().slice(0,32); if(!n || !CLOUD.user) return;
  const {error} = await CLOUD.sb.from('profiles').update({display_name:n}).eq('id', CLOUD.user.id);
  if(!error){ CLOUD.name=n; CLOUD.msg='Nombre guardado.'; cloudBoard(); } else { CLOUD.msg='No se pudo guardar el nombre.'; render(); }
}
async function cloudUploadPack(){
  if(!CLOUD.user) return;
  const body = new Blob([JSON.stringify({titanlike:1, img:CUSTOM, names:NAMES})], {type:'application/json'});
  const {error} = await CLOUD.sb.storage.from('player-images').upload(CLOUD.user.id + '/pack.json', body, {upsert:true, contentType:'application/json'});
  packMsg += error ? ' No se pudieron guardar en tu cuenta.' : ' Guardadas también en tu cuenta.'; render();
}
async function cloudDeletePack(){ if(CLOUD.user) await CLOUD.sb.storage.from('player-images').remove([CLOUD.user.id + '/pack.json']); }
function mergeCodex(a, b){
  const o={t:Object.assign({}, a&&a.t), s:Object.assign({}, a&&a.s)};
  Object.entries((b&&b.t)||{}).forEach(([k,v])=>{ o.t[k]=Math.max(o.t[k]||0, +v||0); });
  Object.keys((b&&b.s)||{}).forEach(k=>{ o.s[k]=1; });
  return o;
}
// cada expedición se registra en el servidor al empezar y se cierra al terminar; solo así puntúa
async function cloudStartRun(saga, daily){
  if(!CLOUD.user || !S) return;
  const run = S; const {data, error} = await CLOUD.sb.rpc('start_run_v2', {p_saga:saga, p_daily:!!daily, p_diff:S.diff||'explorador', p_ng:S.ng||0});
  if(run!==S) return;
  if(error){ S.runNote = 'Esta expedición no puntúa en la clasificación: ' + error.message + '.'; }
  else { S.runId = data; S.runNote = null; }
  store.set('run', S); if(scr==='map') render();
}
// telemetría: un registro por combate (kind 'fight') y por fin de expedición ('end'); solo con sesión; nunca bloquea el juego
function cloudTelemetry(kind, payload){
  if(!CLOUD.user || !S) return;
  try{ CLOUD.sb.from('telemetry').insert({run_id:S.runId||null, kind, wave:S.wave, saga:sagaIx(S.wave), diff:S.diff||'explorador', ng:S.ng||0, payload}).then(()=>{}, ()=>{}); }catch(e){}
}
async function cloudFinishRun(runId, wave, ending){
  if(!CLOUD.user || !runId) return;
  const {error} = await CLOUD.sb.rpc('finish_run', {p_run:runId, p_wave:wave, p_ending:ending});
  if(error){ CLOUD.msg = 'La expedición no se ha registrado: ' + error.message + '.'; render(); }
}

// ---- música propia en la nube: un archivo por pista en el bucket privado player-audio, <uid>/<pista>--<nombre> ----
const auSafe = n => (n||'audio').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^\w.\-]+/g,'_').slice(0,90);
const auBucket = () => CLOUD.sb.storage.from('player-audio');
async function cloudAudioList(){
  const {data, error} = await auBucket().list(CLOUD.user.id, {limit:100});
  if(error) throw error; return (data||[]).filter(o=>TRACKS[o.name.split('--')[0]]);
}
async function cloudAudioUp(k){
  if(!CLOUD.user || !MY[k]) return;
  const t = MY[k], uid = CLOUD.user.id;
  if(t.data.byteLength > 25*1024*1024){ auMsg = `«${t.name}» pesa más de 25 MB y se queda solo en este navegador.`; return render(); }
  auMsg = `Subiendo «${t.name}» a tu cuenta…`; render();
  try{
    const old = (await cloudAudioList()).filter(o=>o.name.startsWith(k+'--')).map(o=>uid+'/'+o.name);
    const path = `${uid}/${k}--${auSafe(t.name)}`, type = t.type || 'audio/mpeg';
    const {error} = await auBucket().upload(path, new Blob([t.data], {type}), {upsert:true, contentType:type});
    if(error) throw error;
    const stale = old.filter(p=>p!==path); if(stale.length) await auBucket().remove(stale);
    auMsg = `«${t.name}» guardada en tu cuenta.`;
  }catch(e){ auMsg = `No se pudo guardar «${t.name}» en tu cuenta: ${e.message||e}.`; }
  render();
}
async function cloudAudioDel(k){
  if(!CLOUD.user) return;
  try{ const L=(await cloudAudioList()).filter(o=>o.name.startsWith(k+'--')); if(L.length) await auBucket().remove(L.map(o=>CLOUD.user.id+'/'+o.name)); }catch(e){}
}
// al entrar: manda la cuenta. Baja sus pistas y sube las de este navegador solo para las pistas que la cuenta no tiene
async function cloudAudioPull(){
  if(!CLOUD.user) return;
  await myLoaded;
  try{
    const L = await cloudAudioList(), inCloud = {};
    for(const o of L){
      const k = o.name.split('--')[0], name = o.name.slice(k.length+2); inCloud[k] = 1;
      if(MY[k] && auSafe(MY[k].name)===name) continue;
      const {data, error} = await auBucket().download(CLOUD.user.id+'/'+o.name);
      if(error || !data) continue;
      await keepMyAudio(k, name, await data.arrayBuffer(), data.type);
    }
    for(const k of Object.keys(TRACKS)) if(MY[k] && !inCloud[k]) await cloudAudioUp(k);
  }catch(e){ auMsg = 'No se pudo sincronizar la música con tu cuenta.'; render(); }
}

// ---- experiencia y pases en la nube (add_xp valida cada suma; claim_tier, cada escalón) ----
let XPQ = Promise.resolve();
function cloudAddXp(src, amt){
  if(!CLOUD.user || !CLOUD.xpReady) return;
  const go = () => CLOUD.sb.rpc('add_xp', {p_src:src, p_amount:Math.round(amt)}).then(({data})=>{ if(data && data.xp!=null) applyCloudXp(data); }, ()=>{});
  XPQ = XPQ.then(() => src==='duel' ? new Promise(r=>setTimeout(r, 2500)).then(go) : go());   // el duelo se registra antes de sumar su experiencia
}
function applyCloudXp(d){
  const M=meta(), p=Object.assign({}, M.pass||{});
  Object.keys(d).forEach(k=>{ if(k.startsWith('p_')){ const id=k.slice(2); p[id]=Object.assign({claimed:[]}, p[id], {xp:d[k]}); } });
  const before=levelOf(M.xp||0).lv, after=levelOf(d.xp).lv; saveMeta({xp:d.xp, pass:p});
  if(after>before && !LVUP) LVUP={from:before, to:after};
}
async function cloudXpSync(){
  if(!CLOUD.user || typeof ensureXp!=='function') return; ensureXp();
  const sb=CLOUD.sb, uid=CLOUD.user.id;
  try{
    const pr = await sb.from('profiles').select('xp').eq('id', uid).maybeSingle(); if(pr.error) return;
    let srv = pr.data ? +pr.data.xp : 0;
    const imp = await sb.from('xp_log').select('id').eq('user_id', uid).eq('src', 'import').limit(1);
    if(!imp.error && imp.data && !imp.data.length){ const local=meta().xp||0;
      if(local>0){ const r=await sb.rpc('add_xp', {p_src:'import', p_amount:Math.min(20000, local)}); if(r.data && r.data.xp!=null) srv=+r.data.xp; } }
    const pp = await sb.from('pass_progress').select('pass_id,xp,claimed').eq('user_id', uid);
    const M=meta(), p=Object.assign({}, M.pass||{});
    (pp.data||[]).forEach(r=>{ const loc=p[r.pass_id]||{claimed:[]}; p[r.pass_id]={xp:+r.xp, claimed:[...new Set((loc.claimed||[]).concat(r.claimed||[]))]}; });
    saveMeta({xp:srv, pass:p}); CLOUD.xpReady=true;
    if(typeof cloudClaimPending==='function') cloudClaimPending();
    render();
  }catch(e){}
}

function cloudClaim(pass, n){ if(!CLOUD.user || !CLOUD.xpReady) return; CLOUD.sb.rpc('claim_tier', {p_pass:pass, p_tier:n}).then(()=>{}, ()=>{}); }
// escalones reclamados sin conexión (o antes de entrar): se mandan al servidor si ya llegan a ese escalón
async function cloudClaimPending(){
  if(!CLOUD.user) return; const st=((meta().pass||{}).p1)||{claimed:[]};
  const pp = await CLOUD.sb.from('pass_progress').select('claimed').eq('user_id', CLOUD.user.id).eq('pass_id','p1').maybeSingle();
  const srv = (pp.data && pp.data.claimed) || [];
  for(const n of (st.claimed||[]).filter(n=>!srv.includes(n))) await CLOUD.sb.rpc('claim_tier', {p_pass:'p1', p_tier:n}).then(()=>{}, ()=>{});
}

// pases de temporada (lotes): se guardan en local para verlos también sin conexión
async function cloudPasses(){
  try{ const {data, error} = await CLOUD.sb.from('passes').select('id,name,tier_xp,tier_count,starts_at,ends_at,data').neq('id','p1'); if(error || !data) return;
    const defs={}; data.forEach(r=>{ if(r.data && Array.isArray(r.data.tiers)) defs[r.id]={id:r.id, name:r.name, tier_xp:r.tier_xp, tier_count:r.tier_count, starts:r.starts_at, ends:r.ends_at, palette:r.data.palette||null, tiers:r.data.tiers}; });
    saveMeta({passDefs:defs}); if(typeof applyPassCosmetics==='function') applyPassCosmetics(); render(); }catch(e){}
}
