# Borrado de cuenta

**Estado:** Verificada
**Requisitos que cierra:** M-11
**Fecha de acuerdo:** 2026-08-29

## Qué se construye

`/settings/account` (con sesión; sin ella redirige a la home) con la zona de peligro: borrar
la cuenta. Confirmación explícita en dos pasos que explica el alcance — perfil, repos
importados y señales — y al confirmar: **borrado real, no desactivación** (FLOW-05). Primero
los datos en Snapstack (la fila de `profiles`, que arrastra por cascada sus repos y señales),
después el usuario en Clerk, y sesión fuera. Sus fichas dejan de existir en el feed y su
perfil devuelve 404.

Enlace "Account" desde la página de "My repos".

## Decisiones tomadas

- **Orden: primero la base de datos, después Clerk.** Prioriza el "sin fantasmas": si Clerk
  fallara a mitad, el contenido ya no está en el feed y el usuario conserva sesión para
  reintentar (y `ensureProfile` le recrearía un perfil vacío mientras tanto — estado raro
  pero seguro y reintentable). El orden inverso podría dejar fichas huérfanas visibles sin
  forma de que su dueño vuelva a entrar a borrarlas.
- **Idempotente / reanudable**: si no hay fila de perfil (borrado a medias anterior), se
  salta al borrado en Clerk igualmente.
- **Un repo semilla reclamado se borra del todo**, no vuelve a ser semilla: el PRD dice "sus
  repos importados se eliminan por completo", y la cascada lo cumple literalmente. Si el
  repo sigue siendo trending, el próximo seed lo re-importará como semilla nueva.
- Sin periodo de gracia ni "recuperar cuenta": el PRD lo excluye (borrado real).

## Cobertura

| Requisito | Se implementa en | Se valida con |
|-----------|------------------|---------------|
| M-11 | `src/lib/db/account.ts`, `src/app/settings/account/` | `src/lib/db/account.test.ts`, `e2e/account.spec.ts` |

Unitarios (db y Clerk mockeados): orden DB → Clerk, cascada invocada sobre la fila del
perfil, idempotencia sin perfil, y que un fallo de Clerk se propaga sin haber dejado
contenido visible. E2e: sin sesión `/settings/account` redirige a la home. El flujo completo
con cuenta real es destructivo: queda como validación manual **opcional** de Pol (borrar y
re-onboardear cuesta ~2 min); las cascadas reales del esquema están verificadas por psql en
la evidencia del PR.

## Fuera de esta feature

- Desinstalar la GitHub App del usuario (no existe aún; al crearla, el borrado deberá
  mencionarla — GitHub no permite desinstalarla server-side sin la App).
- Export de datos antes de borrar.
- Baja en cascada iniciada desde Clerk (webhooks de Clerk: decisión de M-01 mantenida).
