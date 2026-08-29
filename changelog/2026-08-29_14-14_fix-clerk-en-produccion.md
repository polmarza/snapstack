# Fix: el login no funcionaba en producción (proxy de Clerk ausente)

**Fecha:** ver nombre del archivo
**Tipo:** Fix
**Requisitos:** Ninguno nuevo (corrige M-01 en producción)

## Qué se hizo

El botón de entrar no hacía nada en `snapstack.sh`. La consola de producción lo explicaba:
`Clerk: Failed to load Clerk JS` — el navegador pedía
`/__clerk/npm/@clerk/clerk-js@6/dist/clerk.browser.js` **a nuestro propio dominio** y recibía
404. En Clerk v7 (Core 3), las instancias de producción cargan clerk-js y hablan con la
Frontend API **a través de la propia app** (`/__clerk/…`), y ese proxy lo debe servir un route
handler que nunca creamos. En desarrollo no se nota: las claves `pk_test` cargan clerk-js
directamente del dominio de Clerk, por eso el login local siempre funcionó.

El arreglo, con dos trampas de Next por el camino:

1. **El route handler** (`createFrontendApiProxyHandlers()` de `@clerk/nextjs/server`) en
   `src/app/%5F%5Fclerk/[[...path]]/route.ts`. La carpeta va con `%5F` escapado porque en el
   App Router **los directorios que empiezan por `_` son privados y quedan fuera del
   enrutado** — `__clerk` literal producía 404 silencioso.
2. **El matcher del middleware** ahora incluye `/__clerk/:path*` explícitamente: la exclusión
   de estáticos dejaba fuera los `.js`, y sin pasar por `clerkMiddleware` el handler fallaba
   con 500 ("can't detect usage of clerkMiddleware").

También `/__clerk/` queda fuera del índice en `robots.txt`, como `/api/`.

Verificado en local: `GET /__clerk/npm/@clerk/clerk-js@6/…` → 307 a la versión exacta → 200
con 306 KB de JavaScript y content-type correcto. 99/99 unit, 21/21 e2e, build y lint en
verde. **La verificación en producción queda pendiente del redeploy manual de Pol.**

## Qué se modificó

- Nuevo: `src/app/%5F%5Fclerk/[[...path]]/route.ts`
- Actualizado: `src/proxy.ts` (matcher), `src/app/robots.ts`

## Por qué

Sin esto, M-01 no existe en producción: nadie puede entrar. Es el hueco clásico entre "funciona
en local" y "funciona desplegado" — el comportamiento de Clerk cambia entre instancias de
desarrollo y de producción, y solo se manifestó con las claves `pk_live`.
