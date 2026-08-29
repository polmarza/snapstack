-- Estrella real (C-07): tokens user-to-server de la GitHub App, cifrados en
-- aplicación (AES-256-GCM; la clave vive en el entorno, nunca aquí). RLS sin
-- políticas: solo el service role, siempre desde servidor.

create table public.github_app_tokens (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  access_token_enc text not null,
  refresh_token_enc text,
  access_expires_at timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.github_app_tokens enable row level security;
