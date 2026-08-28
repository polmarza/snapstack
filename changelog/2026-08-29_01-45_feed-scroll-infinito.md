# Feed de scroll infinito

**Fecha:** 2026-08-29 01:45
**Tipo:** Feature
**Requisitos:** M-06

## Qué se hizo

La home pasa de placeholder a producto (ficha: `docs/features/feed-scroll-infinito.md`,
Verificada):

- **Paginación keyset** por (`imported_at`, `id`) con cursor opaco base64url
  (`src/lib/db/feed-page.ts`): estable ante inserts, sin duplicar ni saltar fichas. Campo de
  orden parametrizado en un solo sitio (MEJORA-01 lo cambiará a actividad si entra).
- **`/api/feed`**: endpoint de páginas de 10 fichas.
- **`RepoCard` en HTML/CSS**: el fondo procedural de M-04 pintado con CSS a partir de la misma
  data determinista (`cardBackground()`), texto real — en móvil la tarjeta es 4:5 y legible
  (la imagen OG escalada dejaba la descripción en ~9px). `/api/og` queda para og:image y
  embeds. Expansión local con topics y enlace al repo.
- **`FeedList`**: IntersectionObserver sobre centinela, fin de feed explícito, error con
  reintento inline conservando lo cargado. Primera página server-rendered.

Verificado en local con los 29 repos semilla: scroll 10 → 20 → 29 y "fin del feed", sin
duplicados (dos repos compartían nombre corto — la identidad en el DOM es `data-repo-id`);
viewport móvil 375px comprobado; 41/41 tests unitarios; 6/6 e2e; build y lint en verde.

## Qué se modificó

- Nuevo: `src/lib/db/feed-page.ts` (+ test), `src/app/api/feed/route.ts`,
  `src/components/feed/` (RepoCard, FeedList, CardBackgroundLayer), `e2e/feed.spec.ts`
- Actualizado: `src/app/page.tsx` (home = feed), `docs/architecture.md`,
  `docs/design-system.md` (componentes), `README.md`, `mejoras/backlog.md` (MEJORA-01)

## Por qué

M-06 del PRD: el modelo de producto es perfil + feed, y con M-04 y M-10 hechas había fichas y
contenido pero ningún sitio donde navegarlos. La tarjeta pasó de imagen OG a HTML/CSS por la
pregunta de Pol sobre móvil: el fondo es data, así que se pinta responsive sin perder el
determinismo.
