# Preparación para producción

**Fecha:** 2026-08-29 04:38
**Tipo:** Configuración
**Requisitos:** Ninguno nuevo (endurece el despliegue de lo ya entregado)

## Qué se hizo

Auditoría de "qué se rompe o se expone al salir a producción" y arreglo de los cuatro
hallazgos, más la guía de despliegue.

- **Las páginas de desarrollo quedaban públicas.** `/dev/cards` y `/dev/seed` se habrían
  servido en `snapstack.sh` — herramientas internas a la vista, y `/dev/seed` leyendo la base.
  Ahora devuelven 404 cuando `NODE_ENV === "production"`. Comprobado con un build real: en
  modo producción `/dev/cards` y `/dev/seed` dan 404 mientras `/` y `/u/polmarza` siguen en
  200.
- **Faltaba `metadataBase`.** Sin él, el `og:image` de los perfiles (que es una ruta relativa
  a `/api/og`) no se resuelve a URL absoluta y los scrapers de redes no la cargan: compartir
  un perfil habría salido sin portada. Ahora sale de `NEXT_PUBLIC_APP_URL`.
- **Sin `robots.txt` ni `sitemap.xml`.** El PRD pide perfiles indexables. Se añaden ambos:
  feed y perfiles indexables, fuera del índice `/api/`, `/dev/`, `/settings/` y `/onboarding`.
  El sitemap lista la home y un perfil por dev con repos, y degrada a solo la home si la base
  no responde.
- **Sin versión de Node declarada.** `engines: >=20.6.0` (usamos `process.loadEnvFile`).

**`docs/deploy.md`**: procedimiento completo en seis bloques (Supabase remoto → Clerk de
producción → GitHub App → Vercel → siembra → comprobación final), con quién ejecuta cada paso,
la tabla de variables de entorno y el aviso de que las `NEXT_PUBLIC_*` se inlinean en el build
y deben estar puestas antes del primer deploy.

Verificado: 99/99 unit, 21/21 e2e, build y lint en verde.

## Qué se modificó

- `src/app/dev/cards/page.tsx`, `src/app/dev/seed/page.tsx` (404 en producción)
- `src/app/layout.tsx` (metadataBase), `src/app/robots.ts` y `src/app/sitemap.ts` (nuevos)
- `package.json` (engines)
- `docs/deploy.md` (nuevo), `docs/architecture.md` (referencia a la guía)

## Por qué

Con Fase 1 completa y el fallo de seguridad cerrado, lo único que quedaba entre el código y
`snapstack.sh` era esto: no exponer herramientas internas, que compartir un perfil funcione, y
tener el procedimiento escrito para no improvisar el día del despliegue.
