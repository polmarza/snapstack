# Navegación, botón de donación, marca en minúsculas y favicon

**Fecha:** 2026-08-29 05:04
**Tipo:** Feature
**Requisitos:** Ninguno nuevo (UI del producto ya entregado)

## Qué se hizo

A partir del repaso de UI de Pol:

- **Marco común de la app** (`AppShell`, en el layout): los controles de sesión y el botón de
  donación pasan a estar en **todas** las páginas, no solo en la home. Antes el usuario perdía
  el acceso a su sesión al entrar en un perfil o en ajustes.
- **Botón "Buy me a coffee"** con la imagen oficial de Pol, siempre visible (con y sin
  sesión), con la altura acotada para que case con el resto de la cabecera.
- **Navegación con sesión** (`AppNav`): barra lateral fija en desktop (≥1024px) y barra
  inferior en móvil, donde llega el pulgar. Cinco destinos: Feed, Profile, Repos, Account y
  Sign out, con el activo resaltado según el pathname. Iconos SVG en línea, sin añadir
  librería. El enlace "My repos" sale de `AuthControls`: ahora vive en la navegación.
- **La marca va en minúsculas** en todo el texto visible y en la metadata: `snapstack`.
- **Favicon** (`src/app/icon.tsx`, generado con la misma técnica que las fichas, sin binarios
  en el repo): cuadrado verde de marca con tres capas apiladas — el "stack" del nombre. A
  32px las barras se leen mejor que una letra, y no es gris.

Verificado: 99/99 unit, 21/21 e2e, build y lint en verde; sin sesión comprobado en navegador
(Donate + Sign in arriba a la derecha, marca en minúsculas) y el favicon servido como PNG
32×32.

**Sin verificar por el agente:** la navegación con sesión iniciada. El servidor se reinició y
la sesión se perdió; iniciar sesión exige credenciales de Pol. Queda para su repaso.

## Qué se modificó

- Nuevo: `src/components/shell/` (AppShell, AppNav, DonateButton), `src/app/icon.tsx`
- Actualizado: `src/app/layout.tsx` (AppShell + título en minúsculas), `src/app/page.tsx`
  (cabecera sin AuthControls, marca en minúsculas), `src/components/auth/auth-controls.tsx`
  (sin el enlace a repos), `src/app/u/[username]/page.tsx` y
  `src/app/settings/account/page.tsx` (marca), `e2e/smoke.spec.ts`

## Por qué

El repaso de UI destapó que la sesión y los ajustes solo eran accesibles desde la home: en
cuanto navegabas, no había forma de volver salvo el enlace "Back to feed". La barra lateral
resuelve eso y da sitio a lo que venga (los intereses del onboarding, por ejemplo).
