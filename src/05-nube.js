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
        nine:[...new Set(m.nine.concat(r.nine))], endings:[...new Set(m.endings.concat(r.endings))], runs:Math.max(m.runs||0, r.runs)})); }
    cloudPush(true);
    const img = await sb.storage.from('player-images').download(uid + '/pack.json');
    if(img.data) mergePack(await img.data.text());
  }catch(e){ CLOUD.msg = 'No se pudo sincronizar con la nube.'; }
  render();
}
let pushT = null;
function cloudPush(now){
  if(!CLOUD.user) return;
  clearTimeout(pushT);
  pushT = setTimeout(async ()=>{ const m=meta();
    const {error} = await CLOUD.sb.rpc('sync_progress', {p_unlocked:m.unlocked, p_best:m.best, p_nine:m.nine, p_endings:m.endings, p_runs:m.runs||0});
    if(error){ CLOUD.msg='No se pudo guardar el progreso en la nube.'; render(); } }, now ? 0 : 800);
}
async function cloudBoard(){
  CLOUD.board = null; render();
  const {data, error} = await CLOUD.sb.from('leaderboard').select('display_name,best,endings,nine,user_id').limit(50);
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
