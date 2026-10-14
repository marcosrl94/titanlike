// Paquete «sin licencia» rollo PES 6: nombres de parodia e iconos propios para los 18 soldados.
// Uso: node scripts/pes.cjs <salida.json>
const { chromium } = require('playwright'); const fs=require('fs');
const G='#3f7a52', GH='#7cc08f', B='#ebe6d6', R='#e2685c', GO='#d8b45f', ST='#a9c3d2', BR='#a8664c', D='#1b1f1c', F='#d79172';
const ICONS = {
  mikasa: ['Tukasa Ackerman', `<path d="M15 52 L50 22 L85 52" fill="none" stroke="${R}" stroke-width="7" stroke-linejoin="round"/><rect x="24" y="48" width="52" height="34" fill="${B}"/><rect x="43" y="60" width="14" height="22" fill="${D}"/><rect x="29" y="54" width="10" height="9" fill="${ST}"/><rect x="61" y="54" width="10" height="9" fill="${ST}"/>`],
  eren:   ['Edén Jaeger', `<circle cx="50" cy="56" r="26" fill="${R}"/><circle cx="41" cy="48" r="6" fill="#f3a197" opacity=".6"/><path d="M50 32 Q52 20 60 16" stroke="${BR}" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M52 26 Q66 14 72 24 Q62 32 52 26Z" fill="${G}"/>`],
  armin:  ['Armiño Arlert', `<path d="M14 60 Q30 36 56 40 Q78 42 86 56 Q80 66 60 64 Q44 70 30 66 Q14 70 14 60Z" fill="${B}"/><circle cx="80" cy="50" r="9" fill="${B}"/><circle cx="83" cy="48" r="2" fill="${D}"/><path d="M14 62 Q4 70 8 80" stroke="${D}" stroke-width="7" fill="none" stroke-linecap="round"/><path d="M30 66 L28 78 M46 66 L46 78 M60 64 L62 78" stroke="${B}" stroke-width="5" stroke-linecap="round"/>`],
  sasha:  ['Patasha Braus', `<path d="M24 50 Q26 26 52 28 Q80 30 78 54 Q76 76 50 74 Q22 72 24 50Z" fill="${BR}"/><circle cx="38" cy="44" r="3" fill="${D}"/><circle cx="60" cy="40" r="3" fill="${D}"/><circle cx="52" cy="62" r="3" fill="${D}"/><circle cx="34" cy="60" r="2" fill="${D}"/><circle cx="68" cy="58" r="2" fill="${D}"/>`],
  jean:   ['Jeans Kirstein', `<path d="M30 18 H70 L74 82 H58 L50 44 L42 82 H26Z" fill="${ST}"/><path d="M30 26 H70" stroke="#6f8ea0" stroke-width="3"/><path d="M34 32 l6 6 M60 32 l6 6" stroke="#6f8ea0" stroke-width="2"/><circle cx="50" cy="22" r="2" fill="${GO}"/>`],
  connie: ['Conejo Springer', `<ellipse cx="38" cy="30" rx="8" ry="20" fill="${B}"/><ellipse cx="62" cy="30" rx="8" ry="20" fill="${B}"/><ellipse cx="38" cy="30" rx="4" ry="14" fill="#f3b3a7"/><ellipse cx="62" cy="30" rx="4" ry="14" fill="#f3b3a7"/><circle cx="50" cy="62" r="24" fill="${B}"/><circle cx="42" cy="58" r="3" fill="${D}"/><circle cx="58" cy="58" r="3" fill="${D}"/><path d="M46 68 Q50 72 54 68" stroke="${D}" stroke-width="2" fill="none"/><path d="M50 66 l-3 -4 h6Z" fill="${R}"/>`],
  hange:  ['Hangar Zoë', `<path d="M14 80 V50 Q50 14 86 50 V80Z" fill="${ST}"/><path d="M26 80 V58 Q50 36 74 58 V80Z" fill="${D}"/><path d="M36 64 H62 M49 56 V72 M44 60 L52 60" stroke="${GO}" stroke-width="4" stroke-linecap="round"/><rect x="10" y="80" width="80" height="6" fill="${G}"/>`],
  reiner: ['Reno Braun', `<path d="M36 44 Q26 30 22 16 M36 44 Q22 36 12 32 M36 44 Q30 24 36 14" stroke="${BR}" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M64 44 Q74 30 78 16 M64 44 Q78 36 88 32 M64 44 Q70 24 64 14" stroke="${BR}" stroke-width="5" fill="none" stroke-linecap="round"/><ellipse cx="50" cy="60" rx="20" ry="24" fill="${F}"/><circle cx="50" cy="76" r="7" fill="${R}"/><circle cx="42" cy="54" r="3" fill="${D}"/><circle cx="58" cy="54" r="3" fill="${D}"/>`],
  annie:  ['Anís Leonhart', `<g transform="translate(50 52)">${[0,45,90,135,180,225,270,315].map(a=>`<ellipse rx="7" ry="20" cy="-18" fill="${BR}" transform="rotate(${a})"/>`).join('')}<circle r="9" fill="${GO}"/></g>`],
  historia:['Geografía Reiss', `<circle cx="50" cy="52" r="28" fill="${ST}"/><path d="M34 36 Q46 30 50 40 Q58 44 54 54 Q44 58 40 50 Q30 48 34 36Z M60 60 Q70 56 72 66 Q66 74 58 70Z" fill="${G}"/><path d="M22 52 H78 M50 24 V80 M30 36 Q50 44 70 36 M30 68 Q50 60 70 68" stroke="${D}" stroke-width="1.5" fill="none" opacity=".5"/><path d="M40 84 H60" stroke="${B}" stroke-width="4" stroke-linecap="round"/>`],
  levi:   ['Lavi Ackerman', `<rect x="22" y="18" width="56" height="66" rx="5" fill="${B}"/><rect x="22" y="18" width="56" height="12" fill="${ST}"/><circle cx="30" cy="24" r="2.5" fill="${D}"/><circle cx="38" cy="24" r="2.5" fill="${D}"/><circle cx="50" cy="56" r="18" fill="${D}"/><circle cx="50" cy="56" r="13" fill="${ST}"/><path d="M40 60 Q50 50 60 60" stroke="${B}" stroke-width="3" fill="none"/>`],
  erwin:  ['Darwin Smith', `<ellipse cx="50" cy="56" rx="28" ry="18" fill="${G}"/><path d="M30 50 Q40 38 50 40 Q62 38 70 50" fill="${GH}"/><path d="M34 60 h10 l-4 -8Z M56 60 h10 l-4 -8Z" fill="${D}" opacity=".35"/><circle cx="80" cy="54" r="8" fill="${GH}"/><circle cx="83" cy="52" r="2" fill="${D}"/><path d="M34 72 v8 M64 72 v8" stroke="${GH}" stroke-width="6" stroke-linecap="round"/>`],
  ymir:   ['Imán Fritz', `<path d="M30 24 V56 a20 20 0 0 0 40 0 V24" stroke="${R}" stroke-width="14" fill="none"/><path d="M30 24 V38 M70 24 V38" stroke="${ST}" stroke-width="14"/><path d="M24 72 l4 10 M76 72 l-4 10 M50 86 v-6" stroke="${GO}" stroke-width="3" stroke-linecap="round"/>`],
  nanaba: ['Banana Nanaba', `<path d="M22 40 Q30 76 68 76 Q84 76 86 64 Q80 70 66 68 Q36 66 30 38Z" fill="${GO}"/><path d="M22 40 Q24 34 30 38" stroke="${BR}" stroke-width="4" fill="none"/><path d="M80 66 Q86 66 88 62" stroke="${BR}" stroke-width="4" fill="none"/>`],
  mike:   ['Bike Zacharias', `<circle cx="28" cy="66" r="16" fill="none" stroke="${B}" stroke-width="4"/><circle cx="72" cy="66" r="16" fill="none" stroke="${B}" stroke-width="4"/><path d="M28 66 L44 40 H62 L72 66 M44 40 L52 66 H28 M40 34 H50 M62 40 L58 32 H66" stroke="${R}" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`],
  floch:  ['Flan Forster', `<ellipse cx="50" cy="76" rx="36" ry="8" fill="${B}"/><path d="M26 70 L32 36 H68 L74 70Z" fill="${GO}"/><path d="M32 36 H68 L66 48 Q50 44 34 48Z" fill="${BR}"/><path d="M40 50 l2 10 M58 48 l3 9" stroke="${BR}" stroke-width="3" stroke-linecap="round"/>`],
  gabi:   ['Gamba Braun', `<path d="M26 60 Q24 28 56 26 Q78 28 76 46 Q72 60 56 62 Q40 64 36 72 Q30 80 26 70Z" fill="${R}"/><path d="M40 34 Q44 40 38 46 M50 32 Q54 40 48 48 M60 34 Q62 42 58 50" stroke="#f3a197" stroke-width="3" fill="none" stroke-linecap="round"/><circle cx="68" cy="38" r="3" fill="${D}"/><path d="M76 40 Q90 34 92 22 M76 44 Q90 44 94 36" stroke="${R}" stroke-width="3" fill="none" stroke-linecap="round"/>`],
  pieck:  ['Pico Finger', `<path d="M30 84 L68 34" stroke="${BR}" stroke-width="7" stroke-linecap="round"/><path d="M40 20 Q66 14 86 36 Q74 30 64 34 Q58 24 40 20Z" fill="${ST}"/><path d="M40 20 Q50 30 64 34" stroke="${D}" stroke-width="2" fill="none" opacity=".5"/>`]
};
(async()=>{
  const out=process.argv[2]||'titanlike-pes.json';
  const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'}); const p=await b.newPage();
  await p.setContent('<html><body></body></html>');
  const img={}, names={};
  for(const [id,[name,svg]] of Object.entries(ICONS)){
    names[id]=name;
    const data=await p.evaluate(async ([svg,D])=>{
      const s=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="220" height="220"><rect width="100" height="100" fill="${D}"/><rect x="4" y="4" width="92" height="92" rx="14" fill="#252a26"/>${svg}</svg>`;
      const im=new Image(); im.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(s); await im.decode();
      const cv=document.createElement('canvas'); cv.width=cv.height=220; cv.getContext('2d').drawImage(im,0,0,220,220); return cv.toDataURL('image/webp',.9);
    },[svg,D]);
    img[id]=data; img[id+'@a']=data;
  }
  fs.writeFileSync(out, JSON.stringify({titanlike:1, pack:'PES', names, img}));
  console.log('ok', out, Object.keys(names).length, 'nombres', Object.keys(img).length, 'imágenes', fs.statSync(out).size, 'bytes');
  await b.close();
})();
