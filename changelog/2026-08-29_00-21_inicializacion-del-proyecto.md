# Inicialización del proyecto Snapstack

**Fecha:** 2026-08-29 00:21
**Tipo:** Configuración
**Requisitos:** Ninguno (configuración inicial; el alcance queda definido en docs/prd.md)

## Qué se hizo

Se rellenó la documentación completa del proyecto a partir de la especificación técnica de
Snapstack (tamaño: Producto) y se convirtió la plantilla en el repositorio real del proyecto:
README y CLAUDE.md reescritos para Snapstack, variables de entorno del stack real, borrado del
andamiaje de la plantilla y de los documentos que no aplican.

Decisiones tomadas al documentar: límite de 5 repos por perfil (configurable vía
`REPO_SELECTION_LIMIT`), feed v1 cronológico global con filtro "solo seguidos", fondos de ficha
100 % automáticos en v1 (el control manual queda como C-02), y sin `business.md` porque no hay
monetización en v1.

## Qué se modificó

- `docs/prd.md`, `docs/architecture.md`, `docs/data-model.md`, `docs/design-system.md`,
  `docs/roadmap.md`, `docs/user-flows.md`, `docs/testing.md` — rellenados
- `docs/business.md` — borrado (no aplica: sin monetización en v1)
- `README.md` — reescrito para Snapstack
- `CLAUDE.md` — placeholders rellenados; sección de inicialización y referencias a la
  plantilla eliminadas
- `.env.example` — variables del stack real (Supabase, Clerk, GitHub App, Inngest, Upstash)
- `changelog/README.md`, `mejoras/backlog.md`, `docs/features/README.md` — limpiadas las
  referencias a la plantilla y el ejemplo comentado
- `.template/` y `.claude/commands/init-proyecto.md` — borrados

## Por qué

Proceso de inicialización única definido por la plantilla: una vez rellenos los docs, el repo
debe hablar del producto, no de la plantilla. Deja el proyecto listo para la primera feature.
