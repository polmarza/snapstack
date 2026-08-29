-- Suscripción a los cambios de un repo (C-06): quién quiere enterarse de los
-- pushes de qué repo. El webhook push genera la notificación (tipo nuevo
-- repo_update) solo para los suscritos.

create table public.repo_subscriptions (
  subscriber_profile_id uuid not null references public.profiles(id) on delete cascade,
  repo_id uuid not null references public.repos(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (subscriber_profile_id, repo_id)
);

-- El webhook busca "suscriptores de este repo".
create index repo_subscriptions_repo on public.repo_subscriptions (repo_id);

-- Privada: solo el service role, como notifications.
alter table public.repo_subscriptions enable row level security;

-- El tipo nuevo de notificación.
alter table public.notifications drop constraint notifications_type_check;
alter table public.notifications
  add constraint notifications_type_check check (type in ('new_follower', 'repo_update'));
