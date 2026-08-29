-- 005: tabla reports (ver docs/data-model.md). Moderación ligera (S-01):
-- los reportes se registran para revisión; en v1 la revisión es leer esta tabla.

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  repo_id uuid not null references public.repos (id) on delete cascade,
  reason text not null check (char_length(reason) between 1 and 500),
  status text not null default 'open' check (status in ('open', 'resolved', 'dismissed')),
  created_at timestamptz not null default now()
);

-- Un reporte por usuario y repo: los duplicados se ignoran en la capa de aplicación.
create unique index reports_reporter_repo_idx on public.reports (reporter_id, repo_id);

-- RLS sin políticas: solo el service role escribe y lee.
alter table public.reports enable row level security;
