// ---------- Nube: cuenta de Google, progreso, clasificación e imágenes (solo en la versión desplegada) ----------
const CLOUD = {sb:null, user:null, name:'', board:null, busy:false, msg:''};
let oauthReturn = typeof location!=='undefined' && /access_token|error_description/.test(location.hash) || /[?&]code=/.test(location.search);   // volvemos de Google
function cloudInit(){
  const cfg = window.TL_CFG;
  if(!cfg || !window.supabase) return;
  CLOUD.sb = window.supabase.createClient(cfg.url, cfg.key);
  CLOUD.sb.auth.onAuthStateChange((evt, sess)=>{
    const u = sess && sess.user, was = CLOUD.user;
    CLOUD.user = u || null; CLOUD.busy = false;
    if(!u && oauthReturn && /error_description/.test(location.hash)){ CLOUD.msg='Google no ha completado el acceso: '+decodeURIComponent((location.hash.match(/error_description=([^&]+)/)||[])[1]||'').replace(/\+/g,' '); oauthReturn=false; }
    if(u && oauthReturn){ oauthReturn=false; }
    if(u && !was && evt==='SIGNED_IN' && typeof toast==='function' && !(()=>{ try{ return sessionStorage.getItem('tl-hi'); }catch(e){ return 1; } })()) { try{ sessionStorage.setItem('tl-hi','1'); }catch(e){} toast('Sesión iniciada', 'Hola, ' + ((u.user_metadata||{}).full_name || u.email || '') + '. Tu progreso se guarda en tu cuenta.'); }
    if(u && !was && typeof closeMenu==='function' && !$('menu').hidden) closeMenu();
    if(evt==='PASSWORD_RECOVERY') setTimeout(askNewPassword, 300);
    if(u && (!was || was.id!==u.id)) setTimeout(cloudPull, 0);
    if(!u){ CLOUD.name=''; CLOUD.board=null; }
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
        ach:[...new Set(m.ach.concat((r.extra&&r.extra.ach)||[]))], codex:mergeCodex(m.codex, r.extra&&r.extra.codex)})); }
    cloudPush(true);
    const ls = await sb.storage.from('player-images').list(uid, {search:'pack.json'});   // evita un 400 si aún no hay paquete
    if(ls.data && ls.data.some(o=>o.name==='pack.json')){ const img = await sb.storage.from('player-images').download(uid + '/pack.json'); if(img.data) mergePack(await img.data.text()); }
  }catch(e){ CLOUD.msg = 'No se pudo sincronizar con la nube.'; }
  render();
  cloudAudioPull();
}
let pushT = null;
function cloudPush(now){
  if(!CLOUD.user) return;
  clearTimeout(pushT);
  pushT = setTimeout(async ()=>{ const m=meta();
    const {error} = await CLOUD.sb.rpc('sync_progress_v2', {p_unlocked:m.unlocked, p_best:m.best, p_nine:m.nine, p_endings:m.endings, p_runs:m.runs||0, p_extra:{ach:m.ach, codex:m.codex}});
    // las sagas desbloqueadas en la cuenta las fija el servidor al cerrar expediciones
    if(error){ CLOUD.msg='No se pudo guardar el progreso en la nube.'; render(); } }, now ? 0 : 800);
}
async function cloudBoard(){
  CLOUD.board = null; render();
  const {data, error} = CLOUD.tab==='hoy'
    ? await CLOUD.sb.from('daily_board').select('display_name,score,wave,user_id').eq('day', today()).limit(50)
    : await CLOUD.sb.from('leaderboard').select('display_name,best,endings,nine,user_id').limit(50);
  CLOUD.board = error ? [] : data; if(error) CLOUD.msg='No se pudo cargar la clasificación.'; render();
}
async function cloudRename(n){
  n = (n||'').trim().slice(0,32); if(!n || !CLOUD.user) return;
  const {error} = await CLOUD.sb.from('profiles').update({display_name:n}).eq('id', CLOUD.user.id);
  if(!error){ CLOUD.name=n; CLOUD.msg='Nombre guardado.'; cloudBoard(); } else { CLOUD.msg='No se pudo guardar el nombre.'; render(); }
}
async function cloudUploadPack(){
  if(!CLOUD.user) return;
  const body = new Blob([JSON.stringify({titanlike:1, img:CUSTOM})], {type:'application/json'});
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
  const run = S; const {data, error} = await CLOUD.sb.rpc('start_run', {p_saga:saga, p_daily:!!daily});
  if(run!==S) return;
  if(error){ S.runNote = 'Esta expedición no puntúa en la clasificación: ' + error.message + '.'; }
  else { S.runId = data; S.runNote = null; }
  store.set('run', S); if(scr==='map') render();
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
