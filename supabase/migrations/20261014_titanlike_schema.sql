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
