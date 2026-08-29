# Follows y filtro "Following"

**Estado:** Verificada
**Requisitos que cierra:** M-07
**Fecha de acuerdo:** 2026-08-29

## Qué se construye

El follow **nativo de Snapstack** (decisión con Pol: no espeja el follow de GitHub — es la
relación que alimenta nuestro feed, y seguir en GitHub de rebote sorprendería; si algún día
se quiere, será un opt-in aparte). Cierra la última pieza de Fase 1:

- **Botón Follow/Following** en la cabecera del perfil público y en el detalle expandido de
  las tarjetas con dueño (el PRD dice "viendo un perfil o una ficha"). Toggle: pulsar de
  nuevo deja de seguir (negativo de M-07). Exige sesión; sin ella no se muestra. Nadie puede
  seguirse a sí mismo (check en DB y guardia en servidor).
- **Filtro "Following" en el feed**: pestañas All / Following en la home (Following solo con
  sesión). El filtro reutiliza la paginación keyset restringiendo a repos cuyos dueños
  sigues; sin seguidos, vacío explícito con invitación a explorar.
- **Señal `follow_author` cableada** (la que M-09 dejó esperando): se emite desde la tarjeta
  al seguir — ahí hay repo de contexto, que la tabla `signals` exige. Seguir desde el perfil
  no emite señal (sin repo de contexto; anotado como límite consciente).

## Decisiones tomadas

- **Migración 006**: tabla `follows` según `docs/data-model.md` (PK compuesta
  follower/followed, cascada al borrar perfiles, check de no-auto-follow). RLS: lectura
  pública (los contadores podrán ser públicos), escritura solo servidor.
- **El estado "¿lo sigo?" viaja anotado en el feed** (`owner_followed` por tarjeta, resuelto
  en servidor con una sola query de seguidos) en vez de una consulta por tarjeta.
- **Unfollow no borra señales pasadas**: la señal es histórica, la relación es actual.
- Validación con dos perfiles: en local solo existe Pol, así que se crea un segundo perfil de
  prueba (datos prefijados) para poder seguir/dejar de seguir de verdad.

## Cobertura

| Requisito | Se implementa en | Se valida con |
|-----------|------------------|---------------|
| M-07 | migración `supabase/migrations/006_follows.sql`, `src/lib/db/follows.ts`, filtro en `src/lib/db/feed-page.ts`, `src/components/follow/`, pestañas en la home | `src/lib/db/follows.test.ts`, `e2e/follows.spec.ts` |

Unitarios (db mockeada): toggle follow/unfollow idempotente, guardia de auto-follow, y la
paginación del feed restringida a dueños seguidos (incluido el caso sin seguidos). E2e sin
sesión: la pestaña Following no aparece y el perfil no ofrece follow. El flujo con sesión lo
valida Pol contra el perfil de prueba (follow → filtro Following muestra sus repos → unfollow
→ vacío), anotado en el PR.

## Fuera de esta feature

- Espejar el follow en GitHub (posible opt-in futuro; sin entrada en backlog hasta que Pol lo
  pida).
- Contadores públicos de followers/following en el perfil (fácil de añadir; no lo pide M-07).
- Notificaciones de nuevo seguidor.
