-- 003: tabla profiles (ver docs/data-model.md) y FK desde repos.
-- El perfil se crea en el primer request autenticado (upsert por clerk_id), no por webhook.

create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  clerk_id text not null unique,
  github_id bigint unique,
  username text not null unique,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now()
);

comment on table public.profiles is
  'Usuario de Snapstack, vinculado a su identidad de Clerk/GitHub.';

alter table public.repos
  add constraint repos_owner_profile_id_fkey
  foreign key (owner_profile_id) references public.profiles (id) on delete cascade;

-- RLS: los perfiles son públicos; la escritura pasa por el servidor (service role).
alter table public.profiles enable row level security;

create policy "los perfiles son públicos"
  on public.profiles for select
  using (true);
