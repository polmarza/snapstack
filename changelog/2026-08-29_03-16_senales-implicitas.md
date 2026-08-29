# Instrumentación de señales implícitas

**Fecha:** 2026-08-29 03:16
**Tipo:** Feature
**Requisitos:** M-09

## Qué se hizo

Registro de señales implícitas, solo instrumentación — ningún ranking las consume, por
decisión de PRD (ficha: `docs/features/senales-implicitas.md`, Verificada):

- **Migración 004**: tabla `signals` (tipo con check, `value` capado, `profile_id` NULL para
  anónimos, RLS sin políticas: solo service role).
- **Tracker de cliente** (`src/lib/signals/tracker.ts`): `dwell` por IntersectionObserver
  (≥50 % visible, umbral 1 s, cap 120 s, acumulación por tarjeta, vaciado con `sendBeacon` en
  `pagehide`); `expand` y `click_repo` fire-and-forget con `keepalive`. Nada bloquea la UI y
  los fallos son silenciosos (FLOW-02).
- **`POST /api/signals`**: validación estricta en servidor (lote ≤ 50, tipos permitidos,
  uuid, `value` solo en dwell), `profile_id` resuelto desde la sesión de Clerk — nunca del
  payload. Responde 202 incluso ante fallos de inserción: registrar jamás es problema del
  usuario.
- `follow_author` queda en el esquema y se cablea con M-07.

Verificado: 69/69 unit, 13/13 e2e, build y lint en verde. En vivo contra la base local: los
e2e dejaron 4 filas `expand` reales, y una sesión de navegación manual dejó 6 filas `dwell`
con valores 1.498–11.136 ms (umbral y medición funcionando).

## Qué se modificó

- Nuevo: `supabase/migrations/004_signals.sql`, `src/lib/signals/` (events, tracker + test),
  `src/lib/db/signals.ts`, `src/app/api/signals/route.ts`, `e2e/signals.spec.ts`
- Actualizado: `src/components/feed/repo-card.tsx` (instrumentación),
  `docs/architecture.md`, `docs/data-model.md`

## Por qué

M-09 del PRD: sin señal explícita (no hay likes), las señales implícitas son el único
histórico que tendrá valor cuando llegue el momento de decidir ranking o similitud con datos.
Cada día sin instrumentar es histórico perdido; por eso entra antes que M-08.
