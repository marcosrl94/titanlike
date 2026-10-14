// Capturas de las pantallas principales en escritorio y móvil, con la nube simulada (sin red).
// Uso: node build.mjs && node scripts/shots.cjs <carpeta> [user]
const { chromium } = require('playwright'); const fs=require('fs'), path=require('path');
const out=process.argv[2]||'shots', logged=process.argv[3]==='user'; fs.mkdirSync(out,{recursive:true});
const MOCK=`window.supabase={createClient:()=>{const L=[];const sb={auth:{onAuthStateChange:f=>{L.push(f);${logged?"setTimeout(()=>f('SIGNED_IN',{user:{id:'u1',email:'yo@ejemplo.com'}}),0);":''}},signInWithOAuth:async()=>({}),signOut:async()=>{L.forEach(f=>f('SIGNED_OUT',null))}},
 from:()=>{const q={select:()=>q,eq:()=>q,limit:()=>Promise.resolve({data:[{display_name:'Marcos',best:23,score:29,diff:'veterano',ng:1,ng_level:1,endings:1,nine:1,user_id:'u1',wave:9},{display_name:'Lucía',best:15,score:15,diff:'explorador',ng:0,ng_level:0,endings:0,nine:0,user_id:'u2',wave:7}]}),maybeSingle:()=>Promise.resolve({data:null}),update:()=>q};return q;},
 rpc:async()=>({data:1}),storage:{from:()=>({download:async()=>({data:null}),list:async()=>({data:[]}),upload:async()=>({}),remove:async()=>({})})}};return sb;}};`;
(async()=>{
  const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
  for(const [tag,vp] of [['d',{width:1280,height:820}],['m',{width:390,height:844,isMobile:true,hasTouch:true,deviceScaleFactor:2}]]){
    const ctx=await b.newContext({viewport:{width:vp.width,height:vp.height},isMobile:!!vp.isMobile,hasTouch:!!vp.hasTouch,deviceScaleFactor:vp.deviceScaleFactor||1});
    const p=await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
    await p.route('**/supabase.js',r=>r.fulfill({body:MOCK,contentType:'text/javascript'}));
    await p.goto('file://'+path.resolve(__dirname,'../public/index.html')); await p.waitForTimeout(400);
    const shot=async(n,full=true)=>{ await p.waitForTimeout(250); await p.screenshot({path:path.join(out,`${tag}-${n}.png`),fullPage:full}); };
    const go=async(fn)=>{ await p.evaluate(fn); await p.waitForTimeout(150); };
    await shot('01-portada');
    await go(()=>{ tipsSeen.off=1; scr='sagas'; render(); }); await shot('02-sagas');
    await go(()=>{ act('saga','0'); }); await shot('03-inicial');
    await go(()=>{ act('start','eren'); }); await shot('04-mapa');
    await go(()=>{ recruit('mikasa'); recruit('armin'); const n=openNodes()[0]; act('node', Array.isArray(n)?n.join(','):String(n)); }); await p.waitForTimeout(600); await shot('05-combate',false);
    await go(()=>{ scr='reward'; S.rewards=genRewards('c'); render(); }); await shot('06-recompensa');
    await go(()=>{ S.pend={k:'camp'}; scr='camp'; render(); }); await shot('07-campamento');
    await go(()=>{ S.pend={k:'event',i:0,res:null}; scr='event'; render(); }); await shot('08-evento');
    await go(()=>{ scr='gallery'; render(); }); await shot('09-galeria');
    await go(()=>{ scr='settings'; render(); }); await shot('10-ajustes');
    await go(()=>{ scr='codex'; render(); }); await shot('11-codice');
    await go(()=>{ scr='map'; render(); openMenu(); }); await shot('12-menu',false);
    await go(()=>{ closeMenu(); }); 
    console.log(tag, errs.length? errs : 'sin errores');
    await ctx.close();
  }
  await b.close();
})();
