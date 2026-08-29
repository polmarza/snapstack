# Feed en orden aleatorio estable

**Estado:** Acordada
**Requisitos que cierra:** Modifica M-06 (el criterio "orden cronológico" pasa a "orden
aleatorio estable por visita")
**Fecha de acuerdo:** 2026-08-29 (pendiente de visto bueno)

## Qué se construye

El feed deja el orden cronológico de importación: como cada usuario importa sus repos de una
vez, el orden actual muestra los 5 repos del mismo autor seguidos. Pasa a un orden
pseudoaleatorio que rompe ese agrupamiento y que además cambia de punto de partida en cada
visita, sin romper las garantías del scroll infinito (dentro de una sesión no se repiten ni
se saltan fichas).

## Decisiones tomadas

- **El orden es `(card_seed, id)` descendente.** `card_seed` ya existe: es el hash FNV-1a del
  repo, uniforme y sin correlación con autor ni fecha de importación — una permutación
  aleatoria gratis, sin columnas ni migraciones nuevas.
- **Punto de entrada aleatorio con vuelta completa.** La primera página no empieza en el
  máximo sino en un valor aleatorio `s` (8 hex) generado en servidor; la paginación desciende
  desde ahí y, al agotar el tramo, da la vuelta por arriba hasta cerrar el círculo en `s`.
  Cada visita ve el feed completo empezando en un sitio distinto: sensación de aleatorio,
  garantía de keyset.
- **El cursor sigue siendo un token opaco**, ahora `{s, t, id, w}` (inicio, posición, flag de
  vuelta), con validación estricta de formato como hasta ahora (los valores acaban en el
  `or=(...)` de PostgREST).
- **El filtro Following no cambia**: es ortogonal al orden.
- **Colisiones de `card_seed`** (hash de 32 bits): las desempata `id`, como hoy desempata a
  `imported_at`.
- **Descartado**: barajado por sesión con `md5(seed||id)` en SQL (exige función RPC +
  migración y duplicar el camino del feed); orden estático por `card_seed` sin rotación (la
  portada del feed quedaría congelada para siempre); barajar en cliente (rompe la paginación).
- MEJORA-01 (orden por última actividad) sigue en el backlog: cuando llegue, sustituirá a
  esta permutación, no la complicará.

## Qué queda fuera

- Cualquier ranking o personalización: la permutación es ciega a señales (decisión de v1).
- Mezclar/intercalar por autor de forma explícita: si el hash agrupa dos del mismo autor por
  azar, se acepta.

## Cobertura

| Requisito | Se implementa en | Se valida con |
|-----------|------------------|---------------|
| Orden por (card_seed, id) con inicio aleatorio y vuelta | `src/lib/db/feed-page.ts` | `src/lib/db/feed-page.test.ts` |
| Sin duplicados ni saltos al paginar la vuelta completa | `src/lib/db/feed-page.ts` | `src/lib/db/feed-page.test.ts` (recorrido completo sobre db falsa) |
| Cursor nuevo validado estrictamente; corrupto → primera página | `decodeCursor` | `src/lib/db/feed-page.test.ts` |
| El feed real pagina sin repetir fichas | `/api/feed` | `e2e/feed.spec.ts` |
| PRD al día | `docs/prd.md` (M-06) | revisión en el PR |
