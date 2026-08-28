# Esqueleto del proyecto y ficha visual procedural

**Estado:** Verificada
**Requisitos que cierra:** M-04
**Fecha de acuerdo:** 2026-08-29

## Qué se construye

La base sobre la que se montará todo lo demás: la app Next.js (App Router) con TypeScript
estricto, Tailwind, la estructura de carpetas de `docs/architecture.md`, los tokens del design
system, el stack de testing (Vitest + Testing Library, Playwright configurado) y el workflow de
CI ya existente pasando en verde.

Y encima de esa base, la primera pieza visible del producto: la **ficha visual de un repo**
(M-04). Dado un repo (en esta feature, datos de fixture — todavía no hay GitHub ni base de
datos), se genera su imagen con `@vercel/og`: fondo procedural determinista a partir del hash
del ID del repo, paleta anclada al color Linguist de su lenguaje dominante, nombre y
descripción corta encima. Una página de demo en local permite ver fichas de ejemplo y
comprobar a ojo la coherencia visual entre lenguajes.

## Decisiones tomadas

- La semilla del fondo es el hash del `github_repo_id` (estable ante renombrados), como
  documenta `docs/data-model.md` (`card_seed`) — mismo repo, mismo fondo, siempre.
- Los colores de lenguaje se toman del `languages.yml` de GitHub Linguist, vendorizado como
  módulo de datos propio (sin llamada externa en tiempo de render).
- La imagen se sirve desde `src/app/api/og/` con cache CDN; relación de aspecto 1200×630 para
  reutilizarla como og:image más adelante.
- Generación 100 % automática, sin intervención del usuario (el control manual es C-02, fuera
  de v1).
- El esqueleto no cierra ningún requisito del PRD por sí mismo: se valida con el propio CI en
  verde y el build pasando, y por eso no aparece como fila en la tabla de cobertura.

## Cobertura

| Requisito | Se implementa en | Se valida con |
|-----------|------------------|---------------|
| M-04 | `src/lib/card-seed/`, `src/app/api/og/` | `src/lib/card-seed/card-seed.test.ts`, `src/app/api/og/og-input.test.ts` |

Los tests de `card-seed` cubren el determinismo (mismo input → misma semilla y misma paleta en
ejecuciones repetidas) y el anclaje al color Linguist del lenguaje dominante. Los de `og-input`
cubren que el endpoint recibe y compone los datos correctos (nombre, descripción, semilla); el
píxel renderizado por Satori no se testea (ver `docs/testing.md`).

## Fuera de esta feature

- Todo lo que toque GitHub de verdad: login (M-01), importación (M-02), webhooks (M-08). Las
  fichas se generan sobre fixtures.
- Feed, perfiles y follows (M-05, M-06, M-07).
- Persistencia: sin Supabase todavía; el modelo de datos se materializa cuando entre la
  importación.
- Cualquier regeneración o elección manual del fondo (C-02).
