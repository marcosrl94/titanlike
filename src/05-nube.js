// ---------- Nube: cuenta de Google, progreso, clasificación e imágenes (solo en la versión desplegada) ----------
const CLOUD = {sb:null, user:null, name:'', board:null, busy:false, msg:''};
function cloudInit(){
  const cfg = window.TL_CFG;
  if(!cfg || !window.supabase) return;
  CLOUD.sb = window.supabase.createClient(cfg.url, cfg.key);
  CLOUD.sb.auth.onAuthStateChange((evt, sess)=>{
    const u = sess && sess.user, was = CLOUD.user;
    CLOUD.user = u || null;
    if(u && (!was || was.id!==u.id)) setTimeout(cloudPull, 0);
    if(!u){ CLOUD.name=''; CLOUD.board=null; }
    render();
  });
}
const cloudOn = () => !!CLOUD.sb;
async function cloudLogin(){
  const {error} = await CLOUD.sb.auth.signInWithOAuth({provider:'google', options:{redirectTo: location.origin + location.pathname}});
  if(error){ CLOUD.msg = 'No se pudo abrir el acceso con Google: ' + error.message; render(); }
}
async function cloudLogout(){ await CLOUD.sb.auth.signOut(); }
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
    const img = await sb.storage.from('player-images').download(uid + '/pack.json');
    if(img.data) mergePack(await img.data.text());
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
