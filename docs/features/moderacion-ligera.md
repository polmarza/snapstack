# Moderación ligera

**Estado:** Verificada
**Requisitos que cierra:** S-01
**Fecha de acuerdo:** 2026-08-29

## Qué se construye

Las dos piezas mínimas del PRD — filtro básico y reporte —, explícitamente **no** un sistema
completo de moderación:

1. **Filtro básico de contenido al entrar al sistema**: nombre, descripción y topics del repo
   pasan por una lista corta de términos inaceptables (con límite de palabra, para que
   "class" no caiga por contener "ass"). Se aplica en las dos puertas de entrada: el seed de
   trending (los repos marcados se descartan y el resultado informa cuántos) y la importación
   del usuario (el repo marcado se rechaza con un mensaje claro; el resto de la selección se
   guarda igual).
2. **Reporte por usuarios**: en el detalle expandido de una ficha, un usuario con sesión
   puede reportarla con un motivo (texto libre, ≤ 500). Queda en la tabla `reports`
   (migración 005) con estado `open`, **un reporte por usuario y repo** (índice único; los
   duplicados se ignoran en silencio). La revisión en v1 es leer la tabla — no hay panel.

## Decisiones tomadas

- **La lista es corta y en código a propósito** (`src/lib/moderation/`): términos
  inequívocamente inaceptables en inglés y español. Un filtro "listo" (servicio externo, ML)
  sería sobreingeniería para S-01; la lista crece cuando la realidad lo pida.
- **El filtro descarta, no censura a posteriori**: se aplica al importar/sembrar. Lo ya
  importado no se re-evalúa retroactivamente al ampliar la lista (si hiciera falta, sería un
  script puntual).
- **Reportar exige sesión** (coherente con la RLS de `reports` en `docs/data-model.md`); el
  botón no se muestra a visitantes anónimos.
- El `profile_id` del reporte sale de la sesión en servidor, como en señales — el payload
  del cliente nunca lo manda.

## Cobertura

| Requisito | Se implementa en | Se valida con |
|-----------|------------------|---------------|
| S-01 | `src/lib/moderation/`, migración `supabase/migrations/005_reports.sql`, `src/lib/db/reports.ts`, integración en seed e importación, botón en `RepoCard` | `src/lib/moderation/moderation.test.ts`, `src/lib/db/reports.test.ts`, `e2e/report.spec.ts` |

Unitarios: el filtro (término en nombre/descripción/topics detectado; texto limpio pasa;
límites de palabra), el seed descartando repos marcados, la importación rechazándolos con
mensaje, y el insert de reportes con deduplicación. E2e: un visitante sin sesión no ve el
control de reporte en la ficha expandida. El reporte real con sesión lo valida Pol
manualmente (fila en `reports` comprobada por psql, anotada en el PR).

## Fuera de esta feature

- Panel de revisión de reportes y acciones sobre ellos (ocultar ficha, banear).
- Re-evaluación retroactiva del contenido ya importado al cambiar la lista.
- Filtrado de READMEs (no se muestran aún; llegará con MEJORA-03 si entra).
- Rate limiting del endpoint de reportes (Upstash, con tráfico real).
