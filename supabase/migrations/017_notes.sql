-- Notas ancladas a un repo (C-09). Una nota es texto corto que cuelga
-- **obligatoriamente** de un repo: `repo_id` es NOT NULL a propósito, porque el
-- ancla es lo que distingue esto de un microblog. La regla de que además sea un
-- repo *propio y activo* se valida en la capa de aplicación (`src/lib/db/notes.ts`),
-- donde ya vive el resto de reglas de selección.

create table public.notes (
  id uuid primary key default gen_random_uuid(),
  author_profile_id uuid not null references public.profiles(id) on delete cascade,
  repo_id uuid not null references public.repos(id) on delete cascade,
  -- Texto plano, nunca Markdown (decisión de la ficha): renderizar Markdown de
  -- usuario reabre la superficie que costó cerrar en el README del detalle.
  body text not null check (char_length(body) between 1 and 500),
  created_at timestamptz not null default now()
);

-- Las notas de un repo, para el detalle.
create index notes_repo_idx on public.notes (repo_id, created_at desc);
-- Las notas de un autor, para el perfil.
create index notes_author_idx on public.notes (author_profile_id, created_at desc);
-- El feed pagina por (created_at, id) descendente sobre todas las notas (C-11).
create index notes_feed_idx on public.notes (created_at desc, id desc);

-- RLS igual que repos y profiles: lectura pública, escritura solo service role
-- (que se salta RLS, así que basta con no crear políticas de escritura).
alter table public.notes enable row level security;

create policy "las notas son públicas"
  on public.notes for select
  using (true);

-- Tipo nuevo de notificación: quien está suscrito a un repo (C-06) se entera
-- también de sus notas, por la misma vía por la que ya se entera de los pushes.
alter table public.notifications drop constraint notifications_type_check;
alter table public.notifications
  add constraint notifications_type_check
  check (type in ('new_follower', 'repo_update', 'new_note'));
