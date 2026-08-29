# Suscribirse a los cambios de un repo

**Estado:** Acordada
**Requisitos que cierra:** C-06 (se añadirá al PRD al construir; absorbe MEJORA-07 y el punto
6 del feedback de Pol)
**Fecha de acuerdo:** 2026-08-29 (pendiente de construir cuando se mergee C-05)

## Qué se construye

En la página de detalle, entre la info del repo y el README, un botón **"Subscribe to
changes"** (toggle, solo con sesión): al suscribirte, cada push al repo te genera una
notificación con el número de commits y un enlace directo al diff (`compare`) en GitHub.

## Decisiones tomadas

- **Modelo opt-in por repo** (`repo_subscriptions`: subscriber + repo, PK compuesta). Esto
  invierte el punto 6 original ("notificar todo lo de la gente que sigo y mutear lo ruidoso"):
  suscribirse a lo que interesa es el mismo control granular sin la avalancha por defecto.
- **La notificación sale del webhook `push`** (payload: `compare`, commits, ref) sobre la
  infraestructura de C-04 (tipo nuevo `repo_update`, payload jsonb). **Anti-ruido:** si ya hay
  una notificación `repo_update` NO leída del mismo repo, se actualiza (contador acumulado y
  compare más reciente) en vez de apilar una por push.
- **Alcance real:** solo llegan pushes de repos con la GitHub App instalada. Los seeds no
  emiten; es el mismo régimen que las stars.
- Dejar de suscribirse: mismo toggle en el detalle. (Un "unsubscribe" desde la propia
  notificación puede venir después.)
- La suscripción NO altera el filtro Following del feed en v1.

## Qué queda fuera

- **MEJORA-08 (nueva):** apartado de actividad en el detalle (lista de commits/PRs) — exige
  almacenar eventos (`repo_events`) y añadir el evento `pull_request` + permiso *Pull
  requests: read* a la App.
- Notificaciones por email/push.

## Cobertura

(Se rellena al construir.)
