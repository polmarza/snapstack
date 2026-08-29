# Borrado de cuenta

**Fecha:** 2026-08-29 03:50
**Tipo:** Feature
**Requisitos:** M-11

## Qué se hizo

Baja de cuenta real, no desactivación (ficha: `docs/features/borrado-de-cuenta.md`,
Verificada):

- **`/settings/account`** con zona de peligro y confirmación en dos pasos que explica el
  alcance (perfil, repos importados, señales; los repos de GitHub no se tocan). Enlace
  "Account" desde My repos. Sin sesión, redirige a la home.
- **`deleteAccount`** (`src/lib/db/account.ts`): borra la fila de `profiles` — la cascada de
  FKs arrastra repos y señales — y después el usuario en Clerk. Orden DB → Clerk para que el
  contenido desaparezca del feed aunque Clerk falle (y ese fallo sea reintentable con la
  sesión viva). Idempotente: sin fila de perfil, salta directo a Clerk.
- Detalle de Next aprendido: `redirect()` lanza una excepción interna — debe quedar fuera del
  `try/catch` de la server action o el catch se la traga.

Verificado: 80/80 unit (orquestación, orden, idempotencia, fallo de Clerk), 17/17 e2e, build
y lint en verde. La cascada real quedó demostrada sobre el esquema con una transacción con
rollback: borrar el perfil de Pol eliminó sus 2 repos propios y el rollback restauró todo. El
flujo destructivo completo con cuenta real queda como validación manual opcional.

## Qué se modificó

- Nuevo: `src/lib/db/account.ts` (+ test), `src/app/settings/account/` (página + action),
  `src/components/account/delete-account.tsx`, `e2e/account.spec.ts`
- Actualizado: `src/components/selection/selection-page.tsx` (enlace Account),
  `docs/architecture.md`

## Por qué

M-11 del PRD y FLOW-05: darse de baja borra de verdad. La decisión de orden (DB primero)
prioriza el mismo principio que los webhooks: nada fantasma visible en el feed, nunca.
