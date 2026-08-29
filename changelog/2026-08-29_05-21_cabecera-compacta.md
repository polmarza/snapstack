# Cabecera compacta y onboarding acotado a dos pasos

**Fecha:** 2026-08-29 05:21
**Tipo:** Feature
**Requisitos:** Ninguno nuevo

## Qué se hizo

Segundo repaso de UI de Pol, sobre la navegación recién añadida:

- **La marca sube a la cabecera**, en la misma línea que los botones, y **desaparece el
  subtítulo** del feed. La home se queda sin encabezado visible propio, así que el `h1` sigue
  ahí como `sr-only`: los buscadores y los lectores de pantalla no se quedan sin él.
- **"Sign in" con la marca de GitHub al lado** en vez de "Sign in with GitHub": ocupa bastante
  menos y es el patrón habitual.
- **Con sesión desaparece el avatar de la cabecera.** Sobraba desde que existe la barra
  lateral, que ya lleva perfil, ajustes y cerrar sesión.
- **Con sesión en desktop, la marca también se oculta** de la cabecera: la lleva la barra
  lateral. En móvil se mantiene, porque allí la navegación es la barra inferior y no muestra
  el nombre.

**Onboarding:** se queda en dos pasos (login → elegir repos). La pantalla de stack se aplaza y
queda en `mejoras/backlog.md` como **MEJORA-05**, con la decisión de Pol de que sea **filtro,
no ranking** — así no choca con el WON'T del PRD — y con la nota de que GitHub no da
frameworks (da lenguajes y topics) y de que hace falta enriquecer el seed antes.

Verificado: 99/99 unit, 21/21 e2e, build y lint en verde; comprobado en navegador sin sesión
(marca, Donate y Sign in en una sola línea, sin subtítulo).

**Sin verificar por el agente:** el estado con sesión iniciada (ausencia de avatar y de marca
en desktop). Requiere las credenciales de Pol.

## Qué se modificó

- `src/components/shell/app-shell.tsx` (marca en la cabecera, oculta en desktop con sesión),
  `src/components/auth/auth-controls.tsx` (botón con icono; nada con sesión),
  `src/app/page.tsx` (h1 accesible, sin subtítulo), `e2e/smoke.spec.ts`,
  `mejoras/backlog.md` (MEJORA-05)

## Nota de proceso

Esta rama **rescata dos commits que se habían quedado fuera de `main`**: el de SEO y el de
navegación. El PR #13 se mergeó antes de que se le empujara el commit de SEO, y el PR #14 se
apiló con base en esa rama ya mergeada, así que al aceptarlo su contenido fue a
`chore/preparar-produccion` en vez de a `main`. Ambos figuraban como "merged" sin estar en
producción. Lección: comprobar el estado del PR antes de empujar a su rama, y no apilar sobre
una rama que puede mergearse mientras tanto.
