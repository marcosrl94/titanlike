// Fotogramas de las animaciones de combate (entradas de jefe, dados, transformaciones, eventos con tirada).
// Uso: node build.mjs && node scripts/fxshots.cjs <carpeta>
const { chromium } = require('playwright'); const fs=require('fs'), path=require('path');
const out=process.argv[2]||'fxshots'; fs.mkdirSync(out,{recursive:true});
(async()=>{
  const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
  const mob=process.argv[3]==='m'; const p=await (await b.newContext(mob?{viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2}:{viewport:{width:1280,height:800}})).newPage(); const errs=[];
  p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>{ if(m.type()==='error') errs.push(m.text()); });
  await p.route('**/supabase.js',r=>r.fulfill({body:'',contentType:'text/javascript'}));
  await p.goto('file://'+path.resolve(__dirname,'../public/index.html')); await p.waitForTimeout(400);
  const shot=async(n,ms)=>{ if(ms) await p.waitForTimeout(ms); await p.screenshot({path:path.join(out,n+'.png')}); };
  // combate a medida: escuadrón, enemigos, poderes y nodo
  const fight=async(ids, en, o={})=>p.evaluate(([ids,en,o])=>{
    tipsSeen.off=1; try{ document.getElementById('sheet').hidden=true; }catch(e){}
    newRun(ids, o.saga||0); S.wave=o.wave||20; S.gas=S.gasMax=20; S.items=o.items||[]; S.pw={}; (o.pw||[]).forEach(([k,id])=>S.pw[k]=id);
    S.squad.forEach(s=>{ s.lvl=S.wave; s.hp=maxHp(s); });
    S.map={rows:[[{t:o.node||'n', n:[]}]], pos:[0,0], path:[0], z:0};
    window._gw = window._gw || genWave; genWave=()=>en.map(id=>mkTitan(id, scaleAt(S.wave))); startWave(); genWave=window._gw;
  }, [ids,en,o]);
  const waitTurn=()=>p.waitForFunction(()=>scr!=='combat' || (C.active && !C.busy), null, {timeout:20000});
  const doA=(kind, ti)=>p.evaluate(([kind,ti])=>{ const a=C.active; doAction(kind, ti===undefined?undefined:ti==='ally'?a:C.titans[ti]); }, [kind,ti]);
  const give=id=>p.evaluate(id=>{ C.queue=[]; C.active=S.squad.find(s=>s.id===id); C.busy=false; render(); }, id);
  for(const [boss,ids] of [['bes',['eren','mikasa','armin']],['col',['eren','mikasa']],['hem',['levi','hange']],['mar',['gabi','pieck']],['fun',['mikasa','levi','armin']],['aco',['reiner','jean']]]){
    await fight(ids,[boss],{node:'b'});
    await shot(boss+'-1-entrada', 450); await shot(boss+'-2-efecto', 650);
    await waitTurn();
  }
  // dados de corte rodando y al pararse
  await fight(['mikasa','eren'],['t15','an1']); await waitTurn(); await give('mikasa');
  await doA('skill', 0); await shot('dado-1-rodando', 180); await shot('dado-2-parado', 380); await shot('dado-3-corte', 250);
  await waitTurn();
  // esquiva de un soldado
  await p.evaluate(()=>{ const t=C.titans[1]; C.busy=true; const r=Math.random; Math.random=()=>.99; titanAct(t); Math.random=r; play(()=>{ C.busy=false; render(); }); });
  await shot('esquiva-1', 250); await shot('esquiva-2', 400); await waitTurn();
  // transformación en Colosal y en Hembra
  await fight(['armin','annie'],['t15','t10','an2'],{pw:[['colosal','armin'],['hembra','annie']]}); await waitTurn(); await give('armin');
  await doA('pw:colosal'); await shot('trans-1-oscuro', 200); await shot('trans-2-rayo', 300); await shot('trans-3-colosal', 600); await waitTurn(); await give('annie');
  await doA('pw:hembra', 0); await shot('trans-4-hembra', 900); await waitTurn();
  // coraza rota y segunda fase
  await fight(['hange','mikasa'],['aco2']); await waitTurn(); await give('hange');
  await p.evaluate(()=>{ const t=C.titans[0]; t.plate=1; t.hp=Math.round(t.max*.52); }); await doA('skill',0); await shot('coraza-1', 700); await shot('fase-1', 500); await waitTurn();
  // evento con prueba de habilidad
  await p.evaluate(()=>{ S.pend={k:'event', i:EVENTS.findIndex(e=>e.o.some(o=>/Prueba de/.test(o.d))), res:null}; scr='event'; render(); const E=EVENTS[S.pend.i]; const o=E.o.find(o=>/Prueba de/.test(o.d)); S.pend.res=o.f(); render(); });
  await shot('evento-1-rodando', 250); await shot('evento-2-resultado', 900);
  console.log(errs.length ? errs : 'sin errores');
  await b.close();
})();
