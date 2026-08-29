-- 008: marca de onboarding completado (o saltado a propósito).
--
-- Sin esta marca no se puede redirigir al usuario nuevo a /onboarding sin
-- atrapar en un bucle a quien decida saltárselo: "no tiene repos" no distingue
-- entre "acaba de llegar" y "eligió no importar nada".

alter table public.profiles
  add column onboarded_at timestamptz;

comment on column public.profiles.onboarded_at is
  'Cuándo completó (o saltó) el onboarding. NULL = aún no ha pasado por él.';

-- Quien ya tiene repos importados pasó por el flujo antes de existir la marca.
update public.profiles p
set onboarded_at = now()
where exists (select 1 from public.repos r where r.owner_profile_id = p.id);
