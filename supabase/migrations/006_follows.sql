-- 006: tabla follows (ver docs/data-model.md). Relación nativa de Snapstack:
-- alimenta el filtro "Following" del feed. No espeja el follow de GitHub.

create table public.follows (
  follower_id uuid not null references public.profiles (id) on delete cascade,
  followed_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, followed_id),
  check (follower_id <> followed_id)
);

create index follows_followed_id_idx on public.follows (followed_id);

-- RLS: lectura pública (contadores futuros); escritura solo vía servidor (service role).
alter table public.follows enable row level security;

create policy "los follows son públicos"
  on public.follows for select
  using (true);
