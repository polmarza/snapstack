# Estrella real desde snapstack

**Estado:** Verificada
**Requisitos que cierra:** C-07 (nuevo; era MEJORA-02)
**Fecha de acuerdo:** 2026-08-29 (punto 1 del feedback de Pol; diseño App OAuth acordado al
explicar por qué la estrella no era pulsable)

## Qué se construye

En la página de detalle, el contador de estrellas se convierte en un botón: pulsar da (o
quita) una estrella **real** en GitHub, en nombre del usuario. En las tarjetas del feed la
estrella pasa a ser un enlace al detalle (cursor de pointer incluido): la acción vive donde
vive el repo.

## Decisiones tomadas

- **Token de usuario vía la GitHub App (user-to-server), no OAuth clásico:** el scope clásico
  `public_repo` daría escritura sobre el código de todos los repos públicos del usuario solo
  para poder dar estrellas. Con la App, el token de usuario queda limitado a los permisos de
  la App: se añade **Account permissions → Starring: Read and write** y nada más.
- **Flujo:** botón → si no hay token, `/api/github/connect` (state anti-CSRF en cookie
  httpOnly, `returnTo` solo relativo) → autorización en GitHub → `/api/github/callback`
  (verifica state, canjea el code con el client secret) → tokens guardados → de vuelta al
  repo. Con token: `PUT/DELETE /user/starred/{owner}/{repo}`.
- **Los tokens se guardan cifrados** (AES-256-GCM, clave en `GITHUB_TOKEN_ENCRYPTION_KEY`)
  en `github_app_tokens` (migración 014, RLS sin políticas, cascada con profiles). Si la App
  tiene expiración de tokens activada, el refresh es automático y transparente.
- **Feature con interruptor:** sin `GITHUB_APP_CLIENT_ID` en el entorno, el detalle muestra
  el contador pasivo de siempre. Nada se rompe mientras Pol configura la App.
- **El contador se actualiza optimista** al pulsar; el número de verdad lo trae el webhook
  `star` que ya existe (M-08).
- Un 401 de GitHub (token revocado) borra los tokens y reofrece conectar.
- `full_name` se valida (`owner/repo`, caracteres de GitHub) antes de componer la URL.

## Qué necesita Pol en la App (una vez)

1. General → **Client secrets → Generate a new client secret** (a `.env.local` y Vercel como
   `GITHUB_APP_CLIENT_SECRET`; el Client ID está en la misma página → `GITHUB_APP_CLIENT_ID`).
2. General → Identifying and authorizing users → **Callback URL**: `https://snapstack.sh/api/github/callback`
   y `http://localhost:3000/api/github/callback` (admite varias).
3. Permissions & events → Account permissions → **Starring: Read and write** (los usuarios
   verán la re-aprobación al autorizar).
4. Generar `GITHUB_TOKEN_ENCRYPTION_KEY` (`openssl rand -hex 32`) para `.env.local` y Vercel.

## Qué queda fuera

- Estado inicial "¿ya la tengo?" en las tarjetas del feed (una petición por tarjeta y por
  usuario): solo el detalle lo consulta, y solo si hay token.
- Estrellas desde snapstack a repos privados (la App solo se instala en públicos aquí).

## Cobertura

| Requisito | Se implementa en | Se valida con |
|-----------|------------------|---------------|
| C-07 | `supabase/migrations/014_github_app_tokens.sql`, `src/lib/crypto/secret-box.ts`, `src/lib/github/app-oauth.ts`, `src/lib/github/starring.ts`, `src/lib/db/github-app-tokens.ts`, `src/app/api/github/`, `src/components/repo/star-button.tsx` | `src/lib/crypto/secret-box.test.ts`, `src/lib/github/app-oauth.test.ts`, `src/lib/github/starring.test.ts` |

Los unitarios cubren el cifrado (ida y vuelta, manipulación detectada, claves distintas), el
canje y refresh de tokens (fetch mockeado, errores de GitHub) y el starring (204/404/401,
validación de `full_name`). El flujo OAuth completo y el botón exigen la App configurada y
sesión real: no verificable por interfaz en e2e (Clerk y GitHub no se testean contra el
servicio real) — pasada manual de Pol con la checklist de arriba, evidencia en el PR. El e2e
existente cubre que sin configuración el detalle sigue mostrando el contador pasivo.
