# Semilla de contenido: import de repos trending

**Fecha:** 2026-08-29 01:22
**Tipo:** Feature
**Requisitos:** M-10

## Qué se hizo

Segunda feature (ficha: `docs/features/semilla-de-trending.md`, Verificada). Primera
persistencia real del proyecto:

- **Migración 001** (`supabase/migrations/001_repos.sql`): tabla `repos` con índices, check de
  `status` y RLS (lectura pública solo de `status = 'active'`; escritura solo service role).
  Stack local de Supabase en puertos 573xx (los 543xx y 553xx los ocupan otros proyectos de la
  máquina).
- **Cliente de datos** en `src/lib/db/` (`@supabase/supabase-js`, service role solo servidor)
  con `upsertRepos` y `listActiveRepos`.
- **`pnpm seed:trending`** (`src/jobs/seed-trending/`): consulta la Search API oficial de
  GitHub (más stars creados en los últimos 30 días; `--days`, `--limit`, `GITHUB_TOKEN`
  opcional), mapea al modelo propio con `card_seed` determinista y hace upsert por
  `github_repo_id` con `is_seed = true` y `owner_profile_id = NULL`. Guard: contra un Supabase
  no local exige `--remote` explícito.
- **`/dev/seed`**: página de desarrollo que lista lo importado desde la DB con la ficha de M-04.

Verificado en local: 29 repos trending reales importados; segunda ejecución → 29 filas (sin
duplicados, stars refrescadas); 33/33 tests unitarios; 3/3 e2e con Playwright (Chromium);
build y lint en verde; verificar-cobertura sin fallos.

## Qué se modificó

- Nuevo: `supabase/` (config.toml, migración 001), `src/lib/db/`, `src/jobs/seed-trending/`
  (+ tests), `src/app/dev/seed/page.tsx`, `e2e/seed-feed.spec.ts`
- Actualizado: `docs/data-model.md` (migración y datos seed), `docs/architecture.md`
  (estructura y desarrollo local de DB), `package.json` (script `seed:trending`, deps
  `@supabase/supabase-js` y `tsx`)

## Por qué

M-10 del PRD: que el feed no nazca vacío con pocos usuarios registrados. Se eligió la Search
API oficial en lugar de scrapear github.com/trending (frágil, roza los términos), y script
manual en lugar de job programado: la cadencia de la semilla la decide Pol, e
Inngest/Trigger.dev entra cuando lo exija la importación de usuarios reales (M-02).
