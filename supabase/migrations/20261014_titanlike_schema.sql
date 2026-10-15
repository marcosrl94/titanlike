-- Aplicada al proyecto Supabase «titanlike» (bogzrcrunmgvmisfumpw) el 14/10/2026.
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Recluta' check (char_length(display_name) between 1 and 32),
  created_at timestamptz not null default now()
);
create table public.progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  unlocked int not null default 1 check (unlocked between 1 and 4),
  best int not null default 0 check (best between 0 and 60),
  nine text[] not null default '{}' check (nine <@ array['ataque','colosal','acorazado','hembra','bestia','mandibula','carguero','martillo','fundador']),
  endings text[] not null default '{}' check (endings <@ array['retumbar','coordenada','nueve']),
  runs int not null default 0 check (runs >= 0),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
alter table public.progress enable row level security;
create policy "perfiles visibles para jugadores" on public.profiles for select to authenticated using (true);
create policy "cada jugador edita su perfil" on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create policy "progreso visible para jugadores" on public.progress for select to authenticated using (true);

create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, left(coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', 'Recluta'), 32));
  insert into public.progress (user_id) values (new.id);
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- única vía de escritura del progreso: solo puede crecer (máximos y uniones)
create function public.sync_progress(p_unlocked int, p_best int, p_nine text[], p_endings text[], p_runs int)
returns public.progress
language plpgsql security definer set search_path = '' as $$
declare r public.progress;
begin
  if auth.uid() is null then raise exception 'sin sesión'; end if;
  update public.progress p set
    unlocked = greatest(p.unlocked, least(4, greatest(1, coalesce(p_unlocked, 1)))),
    best = greatest(p.best, least(60, greatest(0, coalesce(p_best, 0)))),
    nine = array(select distinct x from unnest(p.nine || coalesce(p_nine, '{}')) x
                 where x = any(array['ataque','colosal','acorazado','hembra','bestia','mandibula','carguero','martillo','fundador']) order by x),
    endings = array(select distinct x from unnest(p.endings || coalesce(p_endings, '{}')) x
                 where x = any(array['retumbar','coordenada','nueve']) order by x),
    runs = greatest(p.runs, coalesce(p_runs, 0)),
    updated_at = now()
  where p.user_id = auth.uid()
  returning * into r;
  return r;
end $$;
revoke execute on function public.sync_progress(int, int, text[], text[], int) from public, anon;
grant execute on function public.sync_progress(int, int, text[], text[], int) to authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;

create view public.leaderboard with (security_invoker = true) as
  select pr.display_name, p.best, cardinality(p.endings) as endings, cardinality(p.nine) as nine, p.updated_at, p.user_id
  from public.progress p join public.profiles pr on pr.id = p.user_id
  order by p.best desc, cardinality(p.endings) desc, cardinality(p.nine) desc, p.updated_at asc;
grant select on public.leaderboard to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('player-images', 'player-images', false, 5242880, array['application/json']);
create policy "imagenes propias: leer" on storage.objects for select to authenticated using (bucket_id = 'player-images' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "imagenes propias: subir" on storage.objects for insert to authenticated with check (bucket_id = 'player-images' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "imagenes propias: cambiar" on storage.objects for update to authenticated using (bucket_id = 'player-images' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "imagenes propias: borrar" on storage.objects for delete to authenticated using (bucket_id = 'player-images' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- 2026-10-14 (2): logros y códice en progress.extra, sync_progress_v2 y expedición del día
-- Ver la migración «logros_codice_y_diaria» aplicada en el proyecto: añade progress.extra (jsonb),
-- la función sync_progress_v2 (unión de logros, máximo por titán en el códice), la tabla daily_scores
-- con un intento por jugador y día, submit_daily (valida día y techo de puntuación) y la vista daily_board.

-- 2026-10-14 (3): expediciones validadas en el servidor
-- Migraciones «expediciones_validadas», «cerrar_escrituras_directas» y «tiempo_minimo_por_jornada_8s»:
-- tabla runs; start_run (saga desbloqueada, una diaria al día, máx. 30 por hora);
-- finish_run (jornada válida, mínimo 8 s por jornada, final solo al completar, cierra una vez,
-- escribe daily_scores y desbloquea sagas); leaderboard calculada desde runs;
-- sync_progress_v2 ya no toca sagas, mejor jornada ni finales; sync_progress y submit_daily revocadas.

-- Migración player_audio_bucket: bucket privado para la música propia de cada jugador (<uid>/<pista>--<nombre>)
-- insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values ('player-audio','player-audio',false,26214400, array['audio/mpeg',...]);
-- políticas "audio propio: leer/subir/cambiar/borrar" iguales a las de player-images, sobre bucket_id = 'player-audio'

-- Migración difficulty_ngplus_telemetry: runs.diff/ng, progress.ng_level, start_run_v2(saga, daily, diff, ng), finish_run sube ng_level
-- al completar la campaña, vista leaderboard_v2 (puntos = jornadas × 1,25 Veterano × (1 + 0,1·vuelta)), tabla telemetry
-- (inserción propia con RLS, sin lectura desde el cliente, 400 filas/hora por jugador). Migración backfill_ng_level: ng_level=1
-- para quien ya había completado la campaña.

-- Migraciones seasons_table y leaderboard_v2_by_season: tabla seasons (name, started_at; lectura pública) con la vista
-- season_current (la última). leaderboard_v2 solo cuenta runs con started_at >= inicio de la temporada en curso.
-- Reiniciar la clasificación = insert into public.seasons (name) values ('Temporada N'); no se borra ninguna partida.

-- 2026-10-15: notas, récords y sendas
-- sync_keeps_relics_and_stats: sync_progress_v2 conserva extra.relics, extra.stats (la copia con más combates) y logros nuevos.
-- boss_records_and_comp_stats: tabla boss_records (mejor nota por jugador, jefe y temporada) con submit_boss_record
-- (solo guarda si mejora; jefes, notas y dificultad validados), vista boss_board (temporada en curso) y vista comp_stats
-- (agregados anónimos de telemetría por escuadrón: combates, nota media, % de S, expediciones, campañas, mejor jornada).
-- ach_routes_epilogues: logros reina, paradis y epilogo permitidos en sync_progress_v2.

-- friends_legends_duels + friend_code_no_pgcrypto: profiles.friend_code; friendships (a<b, pending/accepted);
-- legends (escuadrón de una campaña completada, solo vía save_legend con run propia wave>=61 y final);
-- duels (resultado declarado por el retador, solo entre amigos y con leyendas válidas, 60/hora);
-- RPC my_friend_code, add_friend, answer_friend, save_legend, record_duel; vistas my_friends y my_duels.

-- 2026-10-15.13 (titanlike_validate_records): submit_boss_record y record_duel validan en servidor.
--   Récords de jefe: puntuación 0..110, rondas 1..80, la nota no puede ser mejor que la que corresponde a la
--   puntuación, escuadrón con formato id+id (2-4 soldados), debe existir una expedición propia abierta (o cerrada
--   hace menos de 30 min) con la misma dificultad y vuelta, máximo 40 envíos/hora y uno por jefe cada 2 minutos.
--   Duelos: nota válida, rondas 2..99 (victoria al menos en 3), no contra uno mismo, uno por rival cada 20 s.
