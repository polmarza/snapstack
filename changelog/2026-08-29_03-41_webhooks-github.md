# Sincronización por webhooks de GitHub

**Fecha:** 2026-08-29 03:41
**Tipo:** Feature
**Requisitos:** M-08

## Qué se hizo

Endpoint `POST /api/webhooks/github` (ficha: `docs/features/webhooks-github.md`, Verificada):

- **Firma HMAC SHA-256 obligatoria** (`X-Hub-Signature-256`, comparación en tiempo
  constante); sin firma válida → 401 y nada se procesa.
- **Handlers**: `push` refresca descripción/lenguaje/topics/stars/nombre; `star` (y `watch`,
  nombre legado del PRD) actualiza stars; `repository` → `deleted`/`privatized` retiran el
  repo (`status = removed`, sin contenido fantasma), `publicized` reactiva, `renamed`/`edited`
  refrescan. Repos desconocidos se ignoran; el endpoint **solo actualiza, nunca inserta**.
- **Decisión clave** (en `docs/architecture.md`): la sincronización usa los datos del propio
  payload — sin llamadas a la API de GitHub ni tokens de App. La GitHub App queda como pieza
  de entrega para producción (checklist de creación documentado para el día del deploy); en
  ella cada usuario instala la App solo en sus repos seleccionados. Límite conocido: el
  desglose `languages` por bytes solo se refresca al re-importar.

Verificado: 77/77 unit (firma, cada evento, no-inserción), 16/16 e2e — contra el server y la
base reales con payloads firmados: un `star` cambia las stars visibles del feed, `privatized`
hace desaparecer la ficha y `publicized` la devuelve, y una firma inválida devuelve 401 sin
efecto. Build y lint en verde.

## Qué se modificó

- Nuevo: `src/lib/github/webhooks.ts` (+ test), `src/app/api/webhooks/github/route.ts`,
  `e2e/webhooks.spec.ts`
- Actualizado: `docs/architecture.md` (integración GitHub, checklist de la App para el
  deploy), `.env.local` (secret de dev, fuera del repo)

## Por qué

M-08 del PRD: reflejar la realidad de GitHub sin polling, y sobre todo no dejar contenido
fantasma cuando un repo se borra o pasa a privado. Posponer la App elimina el paso de
dashboard y los tokens ahora mismo sin sacrificar ninguna función: el endpoint procesará
exactamente los mismos eventos cuando la App exista.
