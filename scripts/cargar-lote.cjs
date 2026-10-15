// Valida un lote temático (JSON) y escribe el SQL para cargarlo en la tabla passes de Supabase.
// Uso: node scripts/cargar-lote.cjs lotes/mi-lote.json > lote.sql   (después se ejecuta ese SQL en Supabase)
const fs=require('fs');
const TYPES={titulo:['text'], estandarte:['motif','colors'], corte:['color'], dado:['fill','stroke'], marco:['color'], fondo:['mo'], efecto:['kind','color']};
const MOTIFS=['muralla','rosa','alas','espadas','llama','luna','ancla'], KINDS=['rayo','vapor'];
const L=JSON.parse(fs.readFileSync(process.argv[2],'utf8')), err=[];
if(!/^[a-z0-9_-]{2,20}$/.test(L.id||'') || L.id==='p1') err.push('id: letras, números, - o _, entre 2 y 20, y distinto de p1');
if(!L.name) err.push('falta name');
if(!L.starts || !L.ends || isNaN(Date.parse(L.starts)) || isNaN(Date.parse(L.ends)) || Date.parse(L.ends)<=Date.parse(L.starts)) err.push('starts y ends: fechas válidas, ends después de starts');
const tx=L.tier_xp||800, tc=L.tier_count||30;
const seen=new Set(), nseen=new Set();
(L.tiers||[]).forEach((t,i)=>{ const w=`escalón ${t.n} (${t.id})`;
  if(!(t.n>=1 && t.n<=tc)) err.push(`${w}: n entre 1 y ${tc}`); if(nseen.has(t.n)) err.push(`${w}: escalón repetido`); nseen.add(t.n);
  if(!/^[a-z0-9_-]{2,24}$/.test(t.id||'') || seen.has(t.id)) err.push(`${w}: id único con letras, números, - o _`); seen.add(t.id);
  if(!TYPES[t.type]) err.push(`${w}: tipo «${t.type}» no existe (tipos: ${Object.keys(TYPES).join(', ')})`);
  else TYPES[t.type].forEach(k=>{ if(t[k]===undefined) err.push(`${w}: falta ${k}`); });
  if(!t.name) err.push(`${w}: falta name`);
  if(t.type==='estandarte' && !MOTIFS.includes(t.motif)) err.push(`${w}: motivo ${t.motif}; usa ${MOTIFS.join(', ')}`);
  if(t.type==='efecto' && !KINDS.includes(t.kind)) err.push(`${w}: efecto ${t.kind}; usa ${KINDS.join(', ')}`);
  if(t.type==='fondo' && !(t.mo>=0 && t.mo<=21)) err.push(`${w}: mo es el número de un momento, de 0 a 21`);
});
if(err.length){ console.error('El lote tiene errores:\n- '+err.join('\n- ')); process.exit(1); }
const q=s=>"'"+String(s).replace(/'/g,"''")+"'";
const data={palette:L.palette||null, tiers:L.tiers};
console.log(`insert into public.passes(id, name, tier_xp, tier_count, starts_at, ends_at, data) values (${q(L.id)}, ${q(L.name)}, ${tx}, ${tc}, ${q(L.starts)}, ${q(L.ends)}, ${q(JSON.stringify(data))}::jsonb)
on conflict (id) do update set name=excluded.name, tier_xp=excluded.tier_xp, tier_count=excluded.tier_count, starts_at=excluded.starts_at, ends_at=excluded.ends_at, data=excluded.data;`);
console.error(`Lote «${L.name}» válido: ${L.tiers.length} recompensas en ${tc} escalones de ${tx} XP.`);
