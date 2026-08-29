-- 004: tabla signals (ver docs/data-model.md). Solo instrumentación en v1:
-- ningún ranking las consume. Escritura y lectura únicamente vía servidor.

create table public.signals (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles (id) on delete cascade,
  repo_id uuid not null references public.repos (id) on delete cascade,
  type text not null check (type in ('dwell', 'expand', 'click_repo', 'follow_author')),
  value integer check (value is null or (value >= 0 and value <= 120000)),
  created_at timestamptz not null default now()
);

comment on table public.signals is
  'Señales implícitas del feed (M-09). profile_id NULL = visitante sin sesión.';

create index signals_repo_id_idx on public.signals (repo_id);
create index signals_created_at_idx on public.signals (created_at desc);

-- RLS sin políticas: nadie lee ni escribe salvo el service role (que se la salta).
alter table public.signals enable row level security;
