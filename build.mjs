// Une src/ en un único index.html. Uso: node build.mjs [--artifact]
import {readFileSync, writeFileSync, readdirSync, mkdirSync} from 'node:fs';
const artifact = process.argv.includes('--artifact');
const shell = readFileSync('src/shell.html', 'utf8');
const js = readdirSync('src').filter(f => f.endsWith('.js')).sort().map(f => readFileSync('src/' + f, 'utf8')).join('\n');
const cfg = JSON.parse(readFileSync('config.json', 'utf8'));
const cloud = `<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.js"></script>
<script>window.TL_CFG = ${JSON.stringify(cfg)};</script>`;
const body = `${shell}\n${artifact ? '' : cloud}\n<script>\n${js}\n</script>\n`;
const out = artifact ? body : `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<style>:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0}img{max-width:100%}[hidden]{display:none!important}</style>
</head><body>
${body}</body></html>\n`;
mkdirSync(artifact ? 'dist' : 'public', {recursive:true});
writeFileSync(artifact ? 'dist/artifact.html' : 'public/index.html', out);
console.log('ok', artifact ? 'dist/artifact.html' : 'public/index.html', out.length, 'bytes');
