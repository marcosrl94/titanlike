// Genera static/og.png (vista previa al compartir) y los iconos de la app a partir del dibujo original del Colosal.
// Uso: node build.mjs && node scripts/og.cjs
const {chromium}=require('playwright'); const path=require('path');
(async()=>{ const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'}); const p=await b.newPage({viewport:{width:1200,height:630}});
 await p.route('**/supabase.js',r=>r.fulfill({body:'window.supabase=null',contentType:'text/javascript'}));
 await p.goto('file://'+require('path').resolve('public/index.html')); await p.waitForTimeout(800);
 const fig = await p.evaluate(()=>titanFig(TITANS.col.a));
 await p.setContent(`<html><head><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Grenze+Gotisch:wght@700&family=Barlow+Condensed:wght@600&family=Barlow:wght@500&display=swap"><style>
 :root{--stone:#1b1f1c;--stone-2:#252a26;--stone-3:#353c36;--stone-4:#4a534b;--bone:#ebe6d6;--blood:#b5392f;--blood-hi:#e2685c;--flesh:#d79172;--flesh-2:#a8664c;--cloak:#3f7a52;--cloak-hi:#7cc08f;--gold:#d8b45f;--muted:#9ca394}
 body{margin:0;width:1200px;height:630px;background:radial-gradient(900px 500px at 75% 0,#2b3a31,transparent 70%),#1b1f1c;color:#ebe6d6;font-family:Barlow;overflow:hidden;position:relative}
 .t{position:absolute;left:80px;top:150px} h1{font:700 120px/0.95 'Grenze Gotisch';margin:0} h1 b{color:#7cc08f}
 p{font:500 30px/1.3 Barlow;color:#9ca394;margin:22px 0 0;max-width:560px} .l{font:600 22px 'Barlow Condensed';letter-spacing:.14em;color:#d8b45f;text-transform:uppercase}
 .f{position:absolute;right:40px;bottom:-190px;width:520px} .f svg{width:100%}
 .w{position:absolute;right:0;left:560px;bottom:0;height:130px;border-top:6px solid #4a534b;background:repeating-linear-gradient(0deg,transparent 0 31px,#1b1f1c 31px 33px),repeating-linear-gradient(90deg,#353c36 0 78px,#1b1f1c 78px 80px)}
 </style></head><body><div class="t"><div class="l">Roguelike por turnos · 4 sagas</div><h1>Titan<b>like</b></h1><p>Elige tu ruta, recluta a tu escuadrón y llega más allá del muro.</p></div><div class="f">${fig}</div><div class="w"></div></body></html>`);
 await p.waitForTimeout(1200); await p.screenshot({path:'static/og.png'});
 // icono 512: la cabeza del Colosal sobre el muro
 const vars=':root{--stone:#1b1f1c;--stone-2:#252a26;--stone-3:#353c36;--stone-4:#4a534b;--bone:#ebe6d6;--blood:#b5392f;--blood-hi:#e2685c;--flesh:#d79172;--flesh-2:#a8664c;--cloak:#3f7a52;--cloak-hi:#7cc08f;--gold:#d8b45f;--muted:#9ca394}';
 await p.setViewportSize({width:512,height:512});
 await p.setContent(`<html><head><style>${vars}body{margin:0;width:512px;height:512px;background:#1b1f1c;overflow:hidden;position:relative}.f{position:absolute;left:16px;right:16px;top:60px}.f svg{width:100%}.w{position:absolute;left:0;right:0;bottom:0;height:150px;border-top:10px solid #4a534b;background:repeating-linear-gradient(0deg,transparent 0 46px,#1b1f1c 46px 50px),repeating-linear-gradient(90deg,#353c36 0 124px,#1b1f1c 124px 128px)}</style></head><body><div class="f">${fig}</div><div class="w"></div></body></html>`);
 await p.waitForTimeout(300); await p.screenshot({path:'static/icon-512.png'});
 await p.setViewportSize({width:180,height:180}); await p.setContent(`<html><body style="margin:0"><img src="data:image/png;base64,${require('fs').readFileSync('static/icon-512.png').toString('base64')}" width="180" height="180"></body></html>`);
 await p.screenshot({path:'static/icon-180.png'});
 await b.close(); })();
