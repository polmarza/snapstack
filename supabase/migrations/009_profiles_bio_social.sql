-- Perfil enriquecido (C-03): tagline, bio y enlaces sociales.
-- Los límites de longitud son la última red: la validación real vive en el
-- servidor (src/lib/profile/social-links.ts), que además filtra plataformas.

alter table public.profiles
  add column if not exists tagline text,
  add column if not exists bio text,
  add column if not exists social_links jsonb not null default '{}'::jsonb;

alter table public.profiles
  add constraint profiles_tagline_len check (tagline is null or char_length(tagline) <= 80),
  add constraint profiles_bio_len check (bio is null or char_length(bio) <= 280);
