-- 001: tabla repos (ver docs/data-model.md).
-- Solo esta tabla: el resto de entidades llegan con sus features.

create table public.repos (
  id uuid primary key default gen_random_uuid(),
  github_repo_id bigint not null unique,
  owner_profile_id uuid, -- FK a profiles cuando exista la tabla; NULL = repo semilla
  full_name text not null,
  description text,
  url text not null,
  primary_language text,
  languages jsonb not null default '{}'::jsonb,
  topics text[] not null default '{}',
  stars integer not null default 0,
  card_seed text not null,
  status text not null default 'active' check (status in ('active', 'removed')),
  is_seed boolean not null default false,
  imported_at timestamptz not null default now(),
  last_synced_at timestamptz not null default now()
);

comment on table public.repos is
  'Repositorio importado al feed. owner_profile_id NULL = semilla trending sin autor registrado.';

create index repos_imported_at_idx on public.repos (imported_at desc);
create index repos_status_idx on public.repos (status);

-- RLS: lectura pública solo de repos activos; escritura solo service role
-- (el service role se salta RLS, así que basta con no crear políticas de escritura).
alter table public.repos enable row level security;

create policy "repos activos son públicos"
  on public.repos for select
  using (status = 'active');
