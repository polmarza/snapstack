# Notificaciones de nuevos seguidores

**Estado:** Verificada
**Requisitos que cierra:** C-04 (nuevo, añadido al PRD con esta feature)
**Fecha de acuerdo:** 2026-08-29 (acordada en conversación: punto 5 del feedback de Pol)

## Qué se construye

La primera pieza que hace que snapstack no sea 100 % pasivo: cuando alguien te sigue, te
enteras. Una tabla `notifications` genérica (preparada para más tipos), un item "Alerts" en
la navegación con la campanita y el contador de no leídas, y una página `/notifications` que
lista quién te siguió y cuándo; al abrirla, todo queda marcado como leído.

## Decisiones tomadas

- **La tabla nace genérica** (`type` + `payload` jsonb) aunque v1 solo emite `new_follower`:
  el punto 6 del feedback (actividad de repos seguidos, con silenciado granular) reutilizará
  esta misma infraestructura sin migrar lo ya guardado.
- **Dedupe en aplicación, no con índice único parcial:** una notificación `new_follower` por
  par (destinatario, actor) para siempre — dejar de seguir y volver a seguir no notifica de
  nuevo (anti-spam). Se comprueba con un exists antes de insertar; una carrera produciría a
  lo sumo un duplicado inocuo, y un índice único sobre esas columnas rompería los tipos
  futuros que sí admiten repetición (varios pushes del mismo repo).
- **Crear la notificación nunca rompe el follow:** el insert va en su propio try/catch dentro
  de la action; si falla, el follow queda hecho y se loguea.
- **Marcar como leído = abrir la página** (estilo LinkedIn): un componente cliente dispara la
  action al montar y refresca el badge. Sin botones de "marcar leída" por unidad en v1.
- **El contador viaja del servidor a la nav** como prop (la shell ya resuelve el perfil en
  cada request; un count `head` más no cambia el perfil de coste).
- **Borrado en cascada** con el perfil (destinatario o actor): la baja de cuenta (M-11) no
  deja notificaciones huérfanas.
- Sin emails ni push en v1; solo in-app.

## Qué queda fuera

- Notificaciones de actividad de repos seguidos y el silenciado granular (punto 6): siguiente
  feature, sobre esta base.
- Preferencias de notificación en Settings: llegarán con el punto 6, que es quien las
  necesita.
- Tiempo real (websockets/polling): el contador se actualiza por navegación.

## Cobertura

| Requisito | Se implementa en | Se valida con |
|-----------|------------------|---------------|
| C-04 | `supabase/migrations/010_notifications.sql`, `src/lib/db/notifications.ts`, `src/app/notifications/`, `src/app/api/follows/actions.ts`, `src/components/shell/app-nav.tsx` | `src/lib/db/notifications.test.ts` |

Los unitarios cubren: crear al seguir, dedupe al re-seguir, no notificarse a uno mismo,
contador de no leídas, listado con datos del actor y marcar todo leído. Toda la superficie
exige sesión de Clerk (nav, página y action): no verificable por interfaz en e2e — la
verificación con sesión queda para la pasada manual de Pol, con la evidencia unitaria y la
siembra local en el PR.
