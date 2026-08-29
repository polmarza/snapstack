# Instalación guiada de la GitHub App (C-08)

**Fecha:** ver nombre del archivo
**Tipo:** Feature
**Requisitos:** C-08 (cierra el pendiente de docs/deploy.md §3.3)

## Qué se hizo

- **Aviso "Keep your repos live"** en la selección de repos (onboarding y settings) con botón
  a la instalación; desaparece cuando el perfil tiene instalación registrada.
- **`profiles.github_installation_id`** (migración 015; **pendiente en producción**),
  mantenido por dos vías: el webhook **`installation`** (created/unsuspend/permisos aceptados
  registran; deleted/suspend limpian; emparejado por id de cuenta de GitHub) y el **Setup
  URL** `/api/github/setup`, que además canjea el `code` de "authorization during
  installation" y deja los tokens de la estrella (C-07) guardados — instalación +
  autorización en un solo viaje.
- Instalar sigue siendo opcional: sin App, todo funciona con los datos del import.
- Instalar del todo automático es imposible por diseño de GitHub (no hay API de instalación):
  el máximo real es este viaje único, y es lo construido.

## Configuración de la App (Pol, una vez)

Setup URL = `https://snapstack.sh/api/github/setup`, marcar **"Request user authorization
(OAuth) during installation"** y **"Redirect on update"**. Y `NEXT_PUBLIC_GITHUB_APP_SLUG`
(= `snapstack-sh`) en `.env.local` y Vercel.
