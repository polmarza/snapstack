# Instrumentación de señales implícitas

**Estado:** Verificada
**Requisitos que cierra:** M-09
**Fecha de acuerdo:** 2026-08-29

## Qué se construye

El registro de señales implícitas del PRD, desde el primer día y **solo registro**: ningún
ranking las consume en v1 (decisión de PRD). Cada evento guarda tipo, repo, usuario (o NULL si
no hay sesión) y timestamp en la tabla `signals` (migración 004):

- **`dwell`** — tiempo de permanencia visible de una tarjeta (ms), medido con
  IntersectionObserver (≥50 % visible); se descartan permanencias menores de 1 s y se capan a
  2 min. Se envía en lote al salir la tarjeta del viewport o al abandonar la página
  (`sendBeacon`, sobrevive a cerrar la pestaña).
- **`expand`** — al expandir una ficha ("More").
- **`click_repo`** — al hacer click hacia el repo en GitHub.
- **`follow_author`** — el tipo queda en el esquema, pero se instrumenta al construir M-07
  (todavía no existe el botón de seguir).

La instrumentación vive en la tarjeta (`RepoCard`), así que emite igual en el feed y en los
perfiles. Regla de FLOW-02: **el registro nunca bloquea la UI** — expand y click se envían
fire-and-forget (`keepalive`), y cualquier fallo es silencioso.

El endpoint `POST /api/signals` valida el payload en servidor (tipos permitidos, tamaño de
lote ≤ 50, `value` solo en dwell y acotado) y resuelve el `profile_id` desde la sesión de
Clerk — el cliente nunca lo manda.

## Decisiones tomadas

- **El cliente identifica el repo por su `id` interno (uuid)**, que ya viaja en el feed — no
  por `github_repo_id`, para que la FK sea directa.
- **RLS de `signals`: sin lectura pública ni escritura directa** — todo pasa por el servidor
  con service role. Las señales no se exponen a nadie en v1.
- **Sin identificador anónimo persistente** (cookie propia) en v1: la señal anónima va con
  `profile_id NULL` y punto. Menos superficie de privacidad; si el análisis futuro lo pide,
  se discute entonces.
- **Umbral y cap del dwell (1 s / 120 s)** para no guardar ruido ni pestañas olvidadas.

## Cobertura

| Requisito | Se implementa en | Se valida con |
|-----------|------------------|---------------|
| M-09 | migración `supabase/migrations/004_signals.sql`, `src/lib/signals/`, `src/app/api/signals/`, `src/components/feed/repo-card.tsx` | `src/lib/signals/signals.test.ts`, `e2e/signals.spec.ts` |

Unitarios: validación del payload en servidor (tipos, lote, valores; payload corrupto →
rechazado sin escribir) y la lógica de medición de dwell (umbral, cap, acumulación por
tarjeta). E2e contra localhost: expandir una tarjeta dispara un `POST /api/signals` que
responde 2xx y deja fila en la base local (se comprueba por psql en la evidencia del PR); la
navegación no se rompe si el endpoint falla.

## Fuera de esta feature

- Cualquier consumo de las señales (ranking, similitud, métricas visibles).
- `follow_author` cableado de verdad (llega con M-07).
- Identidad anónima persistente y agregaciones.
- Rate limiting con Upstash (entra cuando haya tráfico real que proteger).
