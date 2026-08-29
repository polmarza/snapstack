# Perfil enriquecido: tagline, bio y enlaces sociales (C-03)

**Fecha:** ver nombre del archivo
**Tipo:** Feature
**Requisitos:** C-03 (nuevo en el PRD con esta feature)

## Qué se hizo

- Migración 009: `profiles` gana `tagline` (≤ 80), `bio` (≤ 280) y `social_links` (jsonb).
  Aplicada en local; **pendiente en producción**.
- Nueva sección "Public profile" en `/settings/account`: formulario con tagline, bio y un
  campo por plataforma (X, LinkedIn, YouTube, Reddit, Substack, Twitch, Bluesky, Mastodon,
  web personal). Errores por campo desde el servidor.
- Validación en servidor (`src/lib/profile/social-links.ts`): lista blanca de hosts por
  plataforma (subdominios incluidos; Mastodon y web aceptan cualquier host), solo `https:`,
  esquema añadido si falta, longitud acotada. Tagline y bio pasan el filtro de moderación
  (S-01). Los valores acaban en `href` públicos: nada entra sin validar.
- Perfil público: tagline bajo el nombre, bio bajo la cabecera, enlaces como fila de iconos
  junto a "GitHub ↗" (simple-icons + LinkedIn de bootstrap-icons + Globe de lucide). Los
  enlaces alimentan también el `sameAs` del JSON-LD.
- El upsert de `ensureProfile` en cada login no incluye estas columnas: no pisa contenido.

## Documentación

- `docs/prd.md` (C-03 nuevo), `docs/roadmap.md` (Fase 2), `docs/data-model.md` (profiles),
  ficha `docs/features/perfil-enriquecido.md` en **Verificada**.
