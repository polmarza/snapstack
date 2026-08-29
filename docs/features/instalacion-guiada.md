# Instalación guiada de la GitHub App

**Estado:** Verificada
**Requisitos que cierra:** C-08 (nuevo; cierra el "primer trabajo posterior al despliegue" de
`docs/deploy.md` §3.3)
**Fecha de acuerdo:** 2026-08-29 (petición de Pol: automatizar al máximo la instalación)

## Qué se construye

Hoy nadie se entera de que puede instalar la App (stars vivas + notificaciones de push para
sus suscriptores). Se añade: un **aviso con botón** en la selección de repos (onboarding y
settings) que lleva a la instalación, desaparece solo cuando ya está instalada, y — con la
opción de la App "Request user authorization during installation" — la misma pantalla de
GitHub deja **instalación + autorización de la estrella** hechas de un solo click en Install.

## Decisiones tomadas

- **Instalar no puede automatizarse del todo:** GitHub no tiene API para instalar Apps en
  nombre del usuario (consentimiento explícito por diseño). El máximo real es un viaje único,
  y es lo que se construye.
- **`profiles.github_installation_id`** (migración 015) guarda el estado, y se mantiene por
  **tres vías**, porque ninguna basta sola:
  1. **Webhook `installation`** (created/deleted/suspend/permisos), emparejado por id de
     cuenta de GitHub — cubre instalaciones hechas directamente en GitHub.
  2. **Webhook `installation_repositories`**: el que llega al cambiar los repos cubiertos de
     una instalación **que ya existía**. Sin él, "Connect" sobre una App ya instalada no
     dejaba rastro (fallo real en el estreno de Pol).
  3. **Comprobación contra GitHub** (`GET /user/installations` con el token de usuario,
     emparejando por `app_slug`) al abrir Settings o la selección: corrige en los dos
     sentidos y repara instalaciones anteriores al handler. Es la única vía que no depende de
     que un webhook llegara en su momento.
  El **Setup URL** (`/api/github/setup`) además canjea el `code` que GitHub adjunta y guarda
  los tokens de la estrella (C-07) en el mismo viaje.
- El webhook `installation` llega siempre a las Apps (no exige suscripción) y se despacha
  antes de exigir `repository` en el payload.
- **El estado permanente vive en Settings** (`GithubAppSection`): conectado o no, con el
  botón que corresponda y el recordatorio de que los repos añadidos después hay que incluirlos.
  La selección de repos solo lleva el **aviso mientras falta conectar** (`InstallAppBanner`),
  que desaparece al conectar — allí, una vez hecho, no queda nada que hacer.
  La invitación **recomienda "All repositories"** por ser la opción de una sola vez, con la
  comparación completa en un modal (`InstallScopeDialog`, `<dialog>` nativo) — una tarjeta por
  alcance con su ilustración SVG: en la primera todos los repos dentro del marco de cobertura,
  incluido el futuro; en la segunda, los añadidos después se quedan fuera. El slug viaja en
  `NEXT_PUBLIC_GITHUB_APP_SLUG` (público por naturaleza).
- Configuración de la App que esto exige (Pol, una vez): **Setup URL** =
  `https://snapstack.sh/api/github/setup`, y marcar **"Request user authorization (OAuth)
  during installation"** y **"Redirect on update"**.

## Qué queda fuera

- Preseleccionar los repos en la pantalla de GitHub (su UI no lo admite).
- Bloquear features si no se instala: todo sigue funcionando en modo "datos del import".

## Cobertura

| Requisito | Se implementa en | Se valida con |
|-----------|------------------|---------------|
| C-08 | `supabase/migrations/015_profiles_installation.sql`, `src/lib/github/webhooks.ts`, `src/lib/db/installation.ts`, `src/app/api/github/setup/route.ts`, `src/components/account/github-app-section.tsx`, `src/components/repo/install-app-banner.tsx`, `src/components/repo/install-scope-dialog.tsx` | `src/lib/github/webhooks.test.ts`, `src/components/account/github-app-section.test.tsx`, `src/components/repo/install-app-banner.test.tsx`, `src/components/repo/install-scope-dialog.test.tsx`, `e2e/webhooks.spec.ts` |

Los unitarios cubren el despacho del webhook `installation` (created registra el id en el
perfil correcto por id de cuenta; deleted lo limpia; cuentas sin perfil no hacen nada) y las
dos caras del banner con sus enlaces, y el modal de alcances (abrir/cerrar, click en el
fondo, contenido de ambas opciones e ilustraciones etiquetadas) — son los primeros tests de
componente del proyecto. El e2e envía el
evento firmado contra el server real y comprueba la marca en la base. El Setup URL exige la
App real: pasada manual de Pol (checklist arriba).
