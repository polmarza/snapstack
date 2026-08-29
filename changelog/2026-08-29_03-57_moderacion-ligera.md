# Moderación ligera

**Fecha:** 2026-08-29 03:57
**Tipo:** Feature
**Requisitos:** S-01

## Qué se hizo

Las dos piezas mínimas del PRD (ficha: `docs/features/moderacion-ligera.md`, Verificada):

- **Filtro básico de contenido** (`src/lib/moderation/`): lista corta en código de términos
  inequívocamente inaceptables (en/es), con límites de palabra ("class" no cae por contener
  "ass"; "pornography-detector" pasa) y separadores de nombres de repo neutralizados
  ("mega_porn_scraper" no esquiva el filtro). Aplicado en las dos puertas de entrada: el seed
  de trending descarta y reporta cuántos; la importación del usuario rechaza el repo marcado
  con mensaje claro.
- **Reporte de fichas** (migración 005 + `reports.ts` + `ReportButton`): en el detalle
  expandido, un usuario con sesión reporta con motivo (≤500); un reporte por usuario y repo
  (índice único, duplicados ignorados); el reporter sale de la sesión en servidor. La
  revisión en v1 es leer la tabla — no hay panel, por diseño.

Verificado: 89/89 unit, 18/18 e2e (el visitante anónimo no ve el control de reporte), build y
lint en verde. Roadmap de Fase 1 actualizado: al marcarlo aflora que **M-07 (follows) es lo
único que queda de Fase 1** — corrección al "S-01 es la última" dicho en la sesión.

## Qué se modificó

- Nuevo: `src/lib/moderation/` (+ test), `supabase/migrations/005_reports.sql`,
  `src/lib/db/reports.ts` (+ test), `src/app/api/reports/actions.ts`,
  `src/components/feed/report-button.tsx`, `e2e/report.spec.ts`
- Actualizado: `src/jobs/seed-trending/` (filtro + contador de descartados),
  `src/app/settings/repos/actions.ts` (rechazo en importación),
  `src/components/feed/repo-card.tsx`, `docs/data-model.md`, `docs/architecture.md`,
  `docs/roadmap.md`

## Por qué

S-01 del PRD: nombres y descripciones son texto de terceros redistribuido; el filtro corta lo
inequívoco en la puerta y el reporte da cauce a lo que se cuele. Deliberadamente ligero: un
sistema completo sería sobreingeniería antes de tener usuarios.
