-- Notificaciones in-app (C-04). La tabla es genérica (type + payload) aunque
-- v1 solo emite new_follower: los tipos futuros (actividad de repos seguidos)
-- reutilizan esta infraestructura. El dedupe de new_follower es de aplicación:
-- un índice único aquí rompería los tipos que sí admiten repetición.

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_profile_id uuid not null references public.profiles(id) on delete cascade,
  actor_profile_id uuid references public.profiles(id) on delete cascade,
  type text not null check (type in ('new_follower')),
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index notifications_recipient_created
  on public.notifications (recipient_profile_id, created_at desc);

-- El badge cuenta no leídas en cada request de la shell: índice parcial.
create index notifications_recipient_unread
  on public.notifications (recipient_profile_id)
  where read_at is null;
