-- Instalación guiada (C-08): qué perfiles tienen la GitHub App instalada.
-- Lo mantienen el webhook `installation` y el Setup URL; NULL = sin instalar
-- (el banner de instalación se muestra).

alter table public.profiles
  add column if not exists github_installation_id bigint;
