# Notificaciones in-app de nuevos seguidores (C-04)

**Fecha:** ver nombre del archivo
**Tipo:** Feature
**Requisitos:** C-04 (nuevo en el PRD con esta feature)

## Qué se hizo

- Migración 010: tabla `notifications` genérica (`type` + `payload`), con índices para el
  listado y el badge, y cascada con `profiles`. Aplicada en local; **pendiente en producción**.
- Seguir a alguien crea su notificación (dentro de la action de follow, en try/catch propio:
  nunca rompe el follow). Anti-spam: una por par destinatario/actor para siempre — el ciclo
  unfollow/refollow no re-notifica.
- Item "Alerts" en la nav (lateral y barra móvil) con campanita y badge de no leídas; el
  contador sale del servidor en la shell.
- Página `/notifications`: listado con avatar, enlace al perfil del seguidor y tiempo
  relativo; las no leídas resaltadas. Abrirla marca todo leído y baja el badge a cero por
  evento cliente (sin re-render del servidor: el resaltado sigue visible mientras lees).
  Con su `loading.tsx`. Anónimos → redirect a la home.

## Documentación

- `docs/prd.md` (C-04), `docs/roadmap.md`, `docs/data-model.md` (tabla notifications),
  ficha `docs/features/notificaciones-follows.md` en **Verificada**.
- El punto 6 del feedback (actividad de repos seguidos + silenciado granular) se montará
  sobre esta infraestructura.
