-- 002: identidad visible del autor del repo en GitHub (avatar + username en la tarjeta).
-- La Search API ya devuelve ambos; hasta ahora no se guardaban.

alter table public.repos
  add column owner_login text,
  add column owner_avatar_url text;

comment on column public.repos.owner_login is
  'Login del dueño en GitHub (denormalizado; para repos semilla no hay profile)';
