# Perfil público

**Fecha:** 2026-08-29 03:10
**Tipo:** Feature
**Requisitos:** M-05

## Qué se hizo

La otra mitad del modelo perfil + feed (ficha: `docs/features/perfil-publico.md`, Verificada):

- **`/u/[username]`** (login de GitHub como URL), pública, server-rendered e indexable:
  avatar, nombre, @username, enlace a GitHub, contador de repos y grid de fichas (2 columnas
  en desktop, 1 en móvil) reutilizando `RepoCard`. Username inexistente → 404 real; perfil sin
  repos → vacío explícito.
- **Metadata para compartir**: título/descripción propios y `og:image` generada con el
  endpoint de M-04 usando el username como semilla.
- **El pie de las tarjetas del feed enlaza al perfil** cuando el repo tiene dueño en
  Snapstack; los repos semilla (autor no registrado) se quedan como texto — enlazar a un 404
  sería peor.

Verificado: 63/63 tests unitarios, 12/12 e2e — esta vez el flujo completo es automatizable
(perfil público, sin sesión): identidad + fichas en `/u/polmarza`, 404 en username
inexistente, y navegación desde el pie de una tarjeta con dueño. Build y lint en verde;
comprobado en navegador.

## Qué se modificó

- Nuevo: `src/app/u/[username]/page.tsx`, `e2e/profile.spec.ts`
- Actualizado: `src/lib/db/profiles.ts` (getProfileByUsername, + tests),
  `src/components/feed/repo-card.tsx` (pie enlazado condicionalmente),
  `docs/architecture.md`

## Por qué

M-05 del PRD: la intención social es seguir a la persona, y hasta ahora el avatar del pie de
las tarjetas no llevaba a ningún sitio. El perfil da también la unidad compartible (URL +
og:image) de cara al lanzamiento.
