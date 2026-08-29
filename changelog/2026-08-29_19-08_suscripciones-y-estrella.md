# Suscripción a cambios de repos (C-06) y estrella real (C-07)

**Fecha:** ver nombre del archivo
**Tipo:** Feature ×2
**Requisitos:** C-06 y C-07 (absorben MEJORA-07 y MEJORA-02)

## C-06 — Subscribe to changes

- Botón toggle en el detalle (entre la info y el README): cada push al repo genera una
  notificación con el nº de commits y **enlace directo al diff** (`compare`).
- Anti-ruido: los pushes sobre una notificación no leída se **acumulan** (suma commits,
  compare más reciente); tras leerla, el siguiente abre una nueva.
- Tabla `repo_subscriptions` (migración 013, RLS) + tipo `repo_update` en notifications.
- El webhook `push` avisa a los suscriptores sin romper el sync si algo falla.
- Solo llegan pushes de repos con la GitHub App instalada (mismo régimen que las stars).

## C-07 — Estrella real

- En el detalle, la estrella es un botón: da/quita la estrella real en GitHub en tu nombre.
  En las tarjetas, la estrella enlaza al detalle (pulsable, cursor de pointer).
- Token user-to-server de la GitHub App limitado a *Starring* — nunca el scope clásico
  `public_repo`, que daría escritura al código. OAuth con state anti-CSRF; tokens cifrados
  AES-256-GCM (`github_app_tokens`, migración 014, RLS); refresh automático; un 401 borra el
  token y reofrece conectar; `full_name` validado contra traversal (cazado por un test).
- **Interruptor:** sin `GITHUB_APP_CLIENT_ID/SECRET` + `GITHUB_TOKEN_ENCRYPTION_KEY` en el
  entorno, el contador queda pasivo. La checklist de configuración de la App está en la
  ficha `estrella-real.md`.

## Migraciones

013 y 014 aplicadas en local; **pendientes en producción**.
