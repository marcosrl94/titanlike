// Une src/ en un único index.html. Uso: node build.mjs [--artifact]
import {readFileSync, writeFileSync, readdirSync, mkdirSync, copyFileSync, existsSync} from 'node:fs';
const artifact = process.argv.includes('--artifact');
const shell = readFileSync('src/shell.html', 'utf8');
const js = readdirSync('src').filter(f => f.endsWith('.js')).sort().map(f => readFileSync('src/' + f, 'utf8')).join('\n');
const cfg = JSON.parse(readFileSync('config.json', 'utf8'));
const cloud = `<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.js"></script>
<script>window.TL_CFG = ${JSON.stringify(cfg)};</script>`;
const body = `${shell}\n${artifact ? '' : cloud}\n<script>\n${js}\n</script>\n`;
const out = artifact ? body : `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="description" content="Roguelike por turnos: elige tu ruta, recluta a tu escuadrón y llega más allá del muro. Cuatro sagas, expedición del día y clasificación.">
<meta name="theme-color" content="#1b1f1c"><meta name="color-scheme" content="dark">
<meta property="og:type" content="website"><meta property="og:title" content="Titanlike · Más allá del muro"><meta property="og:description" content="Roguelike por turnos en cuatro sagas. Elige tu ruta, recluta a tu escuadrón y compite en la expedición del día.">
<meta property="og:url" content="https://titanlike.vercel.app/"><meta property="og:image" content="https://titanlike.vercel.app/og.png"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:locale" content="es_ES">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" type="image/png" href="/icon-512.png"><link rel="apple-touch-icon" href="/icon-180.png"><link rel="manifest" href="/manifest.webmanifest">
<meta name="apple-mobile-web-app-capable" content="yes"><meta name="mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-status-bar-style" content="black-translucent"><meta name="apple-mobile-web-app-title" content="Titanlike">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<style>:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0}img{max-width:100%}[hidden]{display:none!important}</style>
</head><body>
${body}</body></html>\n`;
mkdirSync(artifact ? 'dist' : 'public', {recursive:true});
if(!artifact){
  if(existsSync('static')) readdirSync('static').forEach(f => copyFileSync('static/' + f, 'public/' + f));
  writeFileSync('public/manifest.webmanifest', JSON.stringify({name:'Titanlike', short_name:'Titanlike', lang:'es', start_url:'/', display:'standalone', orientation:'portrait',
    background_color:'#1b1f1c', theme_color:'#1b1f1c', icons:[{src:'/icon-180.png', sizes:'180x180', type:'image/png'}, {src:'/icon-512.png', sizes:'512x512', type:'image/png', purpose:'any maskable'}]}));
}
writeFileSync(artifact ? 'dist/artifact.html' : 'public/index.html', out);
console.log('ok', artifact ? 'dist/artifact.html' : 'public/index.html', out.length, 'bytes');
