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
- **`profiles.github_installation_id`** (migración 015): la fuente de verdad de "¿la tiene
  instalada?". Se rellena por dos vías redundantes: el **webhook `installation`**
  (created/deleted, emparejado por el id de cuenta de GitHub — cubre instalaciones hechas
  directamente en GitHub) y el **Setup URL** (`/api/github/setup`), que además canjea el
  `code` que GitHub adjunta y guarda los tokens de la estrella (C-07) en el mismo viaje.
- El webhook `installation` llega siempre a las Apps (no exige suscripción) y se despacha
  antes de exigir `repository` en el payload.
- El banner (`InstallAppBanner`) es discreto, server-rendered, y solo aparece con sesión +
  sin instalación registrada. El slug de la App viaja en `NEXT_PUBLIC_GITHUB_APP_SLUG`
  (público por naturaleza).
- Configuración de la App que esto exige (Pol, una vez): **Setup URL** =
  `https://snapstack.sh/api/github/setup`, y marcar **"Request user authorization (OAuth)
  during installation"** y **"Redirect on update"**.

## Qué queda fuera

- Preseleccionar los repos en la pantalla de GitHub (su UI no lo admite).
- Bloquear features si no se instala: todo sigue funcionando en modo "datos del import".

## Cobertura

| Requisito | Se implementa en | Se valida con |
|-----------|------------------|---------------|
| C-08 | `supabase/migrations/015_profiles_installation.sql`, `src/lib/github/webhooks.ts`, `src/app/api/github/setup/route.ts`, `src/components/repo/install-app-banner.tsx` | `src/lib/github/webhooks.test.ts`, `e2e/webhooks.spec.ts` |

Los unitarios cubren el despacho del webhook `installation` (created registra el id en el
perfil correcto por id de cuenta; deleted lo limpia; cuentas sin perfil no hacen nada). El
e2e envía el evento firmado contra el server real y comprueba la marca en la base. Banner y
Setup URL exigen sesión y la App real: pasada manual de Pol (checklist arriba), evidencia en
el PR.
