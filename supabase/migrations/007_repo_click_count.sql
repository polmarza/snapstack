-- 007: contador de clicks por repo, visible en la tarjeta.
--
-- Se desnormaliza en `repos` en lugar de contar `signals` en cada lectura: el
-- feed pinta el número en todas las tarjetas de cada página, y agregar la tabla
-- de señales —que crece sin techo— en cada carga sería el camino corto al
-- problema de rendimiento.

alter table public.repos
  add column click_count integer not null default 0;

comment on column public.repos.click_count is
  'Clicks hacia el repo (señales click_repo). Desnormalizado para leerlo con la fila.';

-- Relleno con lo ya registrado: las señales existentes no se pierden.
update public.repos
set click_count = (
  select count(*)
  from public.signals
  where signals.repo_id = repos.id
    and signals.type = 'click_repo'
);

-- Incremento atómico: el servidor no puede hacer `col = col + 1` desde el
-- cliente de Supabase, y leer-sumar-escribir perdería clicks simultáneos.
create or replace function public.increment_repo_clicks(p_repo_id uuid, p_delta integer)
returns void
language sql
as $$
  update public.repos
  set click_count = click_count + p_delta
  where id = p_repo_id;
$$;
