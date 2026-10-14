// Prueba de extremo a extremo: juega sola una expedición en Chromium y falla si hay errores de página.
// Uso: node scripts/e2e.cjs [segundos] [carpeta-capturas]
const { chromium } = require('playwright'); const fs=require('fs'), path=require('path');
const secs=+(process.argv[2]||90), out=process.argv[3]||'';
(async()=>{
  const html=fs.readFileSync(path.join(__dirname,'../dist/artifact.html'),'utf8');
  const tmp=path.join(require('os').tmpdir(),'titanlike-e2e.html');
  fs.writeFileSync(tmp,'<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>[hidden]{display:none!important}body{margin:0}</style></head><body>'+html+'</body></html>');
  const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'}).catch(()=>chromium.launch());
  const p=await b.newPage({viewport:{width:1000,height:900}});
  const errs=[]; p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>{ if(m.type()==='error') errs.push(m.text()); });
  await p.goto('file://'+tmp); await p.waitForTimeout(300);
  const shot=async n=>{ if(out) await p.screenshot({path:path.join(out,n+'.png')}); };
  await shot('00-portada');
  await p.click('[data-a=sagas]'); await p.click('[data-a=saga][data-i="0"]'); await p.click('[data-a=start][data-i=eren]');
  await p.evaluate(()=>{ fast=true; });
  const seen={}, t0=Date.now(); let steps=0;
  while(Date.now()-t0<secs*1000){
    const st=await p.evaluate(()=>({scr, tip:!!document.querySelector('.tip'), k:document.querySelector('[data-a=tipok]')?.dataset.i, w:S&&S.wave}));
    if(st.tip && !seen['tip-'+st.k]){ seen['tip-'+st.k]=1; await shot('tip-'+st.k); }
    if(!seen[st.scr]){ seen[st.scr]=1; await shot(st.scr); }
    if(st.scr==='over'||st.scr==='victory') break;
    const order=['#sheet:not([hidden]) [data-a=closesheet]','[data-a=tipok]','[data-a=node]','[data-a=titan]','[data-a=sol]','#orders:not([hidden]) [data-a=order][data-i^="pw:"]:not([disabled])','#orders:not([hidden]) [data-a=order][data-i=skill]:not([disabled])','#orders:not([hidden]) [data-a=order][data-i=nape]:not([disabled])','#orders:not([hidden]) [data-a=order][data-i=cut]','[data-a=reward]','[data-a=swap]','[data-a=scn]','[data-a=camp]','[data-a=evopt]','[data-a=evok]','[data-a=item]'];
    for(const s of order){ const e=await p.$(s); if(e){ await e.click({timeout:1500}).catch(()=>{}); break; } }
    steps++; await p.waitForTimeout(40);
  }
  const fin=await p.evaluate(()=>scr+' jornada '+(S&&S.wave));
  console.log(JSON.stringify({fin, steps, pantallas:Object.keys(seen), errores:errs}));
  await b.close(); if(errs.length) process.exit(1);
})();
