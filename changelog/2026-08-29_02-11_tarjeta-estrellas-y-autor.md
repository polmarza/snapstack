# Tarjeta del feed: estrellas dentro de la ficha y autor en el pie

**Fecha:** 2026-08-29 02:11
**Tipo:** Feature
**Requisitos:** Ninguno nuevo (refinamiento de la tarjeta de M-06 a partir del feedback de Pol)

## Qué se hizo

- Las estrellas se muestran **dentro de la ficha, arriba a la derecha**, con icono de estrella
  sin relleno: es un indicador pasivo preparado para convertirse en botón de estrella real
  cuando exista login (MEJORA-02).
- El pie ya no repite el nombre del repo: muestra **avatar en pequeño + username** del autor.
  Para eso, migración `002_repos_owner.sql` (`owner_login`, `owner_avatar_url` — la Search API
  ya los devolvía, no se guardaban) y el mapeo del seed actualizado. Fallback si faltan: login
  extraído de `full_name`, sin avatar.
- Nuevas ideas al backlog: MEJORA-02 (dar estrella desde Snapstack, vía GitHub App con permiso
  "Starring") y MEJORA-03 (página de detalle con README sanitizado).

Verificado: 41/41 unit, 6/6 e2e, build y lint en verde; re-seed local con los campos nuevos
(29 de 32 filas con owner; las 3 restantes salieron del trending y usan el fallback).

## Qué se modificó

- `supabase/migrations/002_repos_owner.sql` (nueva)
- `src/lib/db/repos.ts`, `src/jobs/seed-trending/github-search.ts`, `map.ts` (+ tests)
- `src/components/feed/repo-card.tsx`
- `docs/data-model.md`, `mejoras/backlog.md`

## Por qué

Observaciones de Pol sobre la tarjeta: el nombre estaba duplicado (grande en la ficha y otra
vez en el pie) y las estrellas fuera de la ficha. El pie pasa a identificar al autor — la
intención social del producto es seguir a la persona, no solo mirar el repo.

## Sin ficha de feature, con motivo

Cruza UI + datos, pero no cierra ningún requisito del PRD ni había acuerdo previo que
conservar: el acuerdo es el feedback directo de esta sesión, y la tabla de cobertura exige IDs
del PRD. Los tests de mapeo y de la tarjeta quedan en las suites existentes de M-10 y M-06.
