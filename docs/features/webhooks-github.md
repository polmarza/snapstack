# Sincronización por webhooks de GitHub

**Estado:** Verificada
**Requisitos que cierra:** M-08
**Fecha de acuerdo:** 2026-08-29

## Qué se construye

El endpoint `POST /api/webhooks/github` que mantiene los repos importados al día sin polling:

- **`push`** → refresca descripción, lenguaje dominante, topics, stars y nombre/URL (los
  renombrados se reflejan) del repo.
- **`star`** (el evento moderno de stars; el PRD lo llamaba `watch` — se aceptan ambos) →
  actualiza el contador de stars.
- **`repository`** → `deleted` y `privatized` ponen el repo en `status = 'removed'`: fuera
  del feed y del perfil, **sin contenido fantasma**. `publicized` lo reactiva; `renamed` y
  `edited` refrescan datos.

Toda petición se **verifica por firma HMAC SHA-256** (`X-Hub-Signature-256`, con
`GITHUB_WEBHOOK_SECRET`, comparación en tiempo constante): firma inválida o ausente → 401 y
nada se procesa. El webhook **solo actualiza filas existentes, nunca inserta**: no es una vía
de entrada de contenido al feed. Eventos de repos desconocidos se ignoran con 200.

## Decisiones tomadas

- **La sincronización usa los datos del propio payload, sin llamadas a la API de GitHub.**
  Los payloads de webhook incluyen el objeto `repository` completo (descripción, stars,
  lenguaje, topics). Consecuencias: cero rate limit, cero tokens de App en v1, y el desglose
  de `languages` por bytes (que el payload no trae) solo se refresca al re-importar el repo.
- **La GitHub App se crea al desplegar, no ahora.** El endpoint es agnóstico de quién entrega
  (verifica firma y procesa); la App —que exige URL pública para su webhook— es la pieza de
  entrega de producción, donde cada usuario la instala **solo en sus repos seleccionados**
  (el instalador nativo de GitHub) cumpliendo la letra del PRD. Los pasos de creación quedan
  documentados en `docs/architecture.md` para el día del deploy.
- **Validación en local con eventos reales**: `gh webhook forward` crea un hook efímero sobre
  un repo real de Pol con nuestro secret y reenvía a localhost — el mismo endpoint, la misma
  firma, payloads de GitHub de verdad.
- Los repos semilla también se actualizan si les llega un evento: el mecanismo es el mismo
  (match por `github_repo_id`).

## Cobertura

| Requisito | Se implementa en | Se valida con |
|-----------|------------------|---------------|
| M-08 | `src/lib/github/webhooks.ts`, `src/app/api/webhooks/github/route.ts` | `src/lib/github/webhooks.test.ts`, `e2e/webhooks.spec.ts` |

Unitarios: verificación de firma (válida, inválida, ausente), cada evento contra db mockeada
(push refresca datos, star actualiza stars, deleted/privatized → removed, publicized →
active, renamed → nombre/URL), repos desconocidos ignorados y que **nunca** se inserta. E2e
contra localhost: un payload firmado de `star` cambia las stars visibles en el feed; un
payload de `repository.privatized` hace desaparecer la ficha; una firma inválida devuelve 401
sin efecto. Validación adicional con eventos reales vía `gh webhook forward` (manual, anotada
en el PR).

## Fuera de esta feature

- Crear la GitHub App y su flujo de instalación por usuario (día del deploy; guía en
  `docs/architecture.md`).
- Refresco del desglose `languages` por bytes vía API (queda ligado al re-import; si duele,
  se añade con tokens de instalación más adelante).
- El evento `pull_request` y el orden del feed por actividad (MEJORA-01; el esquema no cambia).
- Rate limiting del endpoint con Upstash (con tráfico real).
