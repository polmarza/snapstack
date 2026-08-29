# Selección manual de repos e importación

**Fecha:** 2026-08-29 02:46
**Tipo:** Feature
**Requisitos:** M-02, M-03

## Qué se hizo

Selección e importación de repos del usuario (ficha: `docs/features/seleccion-de-repos.md`,
Verificada):

- **Capa GitHub** (`src/lib/github/`): GraphQL con el token OAuth del usuario obtenido del
  backend de Clerk (decisión registrada en `docs/architecture.md`: la GitHub App se pospone a
  M-08). Listado de repos públicos propios sin forks ni archivados; importación con
  `languages` por bytes, topics, y `card_seed` determinista.
- **Selección** (`src/lib/db/selection.ts`): diff añadir/quitar/conservar, límite
  (`REPO_SELECTION_LIMIT`, 5) validado en servidor, quitar → `status = 'removed'`
  reactivable, reclamo de semillas existentes por `github_repo_id`.
- **UI compartida** en `/onboarding` y `/settings/repos` (server action común): selector con
  contador y barra de progreso, miniatura con el fondo procedural que tendrá la ficha, aviso
  "⚠ Sin descripción" cuando falta el About de GitHub, enlace "← Volver al feed" y "Mis
  repos" en la cabecera. Sin sesión, ambas rutas redirigen a la home.

Verificado: 61/61 tests unitarios, 9/9 e2e, build y lint en verde. Validación manual de Pol:
importó 2 repos reales (snapstack, project-template), aparecieron en el feed con su avatar, y
en DB quedaron `is_seed = false`, activos, con dueño y desglose de lenguajes. De propina, su
repo "snapstack" destapó una colisión del smoke test con el h1 de la app (arreglado con
selector exacto).

## Qué se modificó

- Nuevo: `src/lib/github/` (graphql, token, user-repos + test), `src/lib/db/selection.ts`
  (+ test), `src/components/selection/`, `src/app/onboarding/`, `src/app/settings/repos/`
  (página + server action), `e2e/onboarding.spec.ts`
- Actualizado: `src/lib/db/profiles.ts` (getProfileByClerkId), `src/components/auth/`
  (enlace Mis repos), `e2e/smoke.spec.ts`, `docs/architecture.md` (estrategia de auth y
  decisión técnica nueva)

## Por qué

M-02 y M-03 del PRD en una pieza: la pantalla de selección es la misma en el onboarding y en
settings, y la curación manual con límite es la decisión de producto central (nada de
importación masiva). Los avisos de "sin descripción" salen del feedback de Pol al probarla:
una ficha sin About es una ficha coja, mejor avisar antes de importar.
