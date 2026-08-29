# Login con GitHub

**Fecha:** 2026-08-29 02:26
**Tipo:** Feature
**Requisitos:** M-01

## Qué se hizo

Login con GitHub vía Clerk (ficha: `docs/features/login-con-github.md`, Verificada):

- **Migración 003**: tabla `profiles` (RLS: lectura pública, escritura vía servidor) y la FK
  `repos.owner_profile_id` → `profiles` pendiente del modelo.
- **Clerk integrado**: `ClerkProvider` en el layout, `clerkMiddleware` en `src/proxy.ts`
  (Next 16 depreca `middleware.ts`) y `AuthControls` en la cabecera del feed — "Entrar con
  GitHub" sin sesión, menú de usuario con ella. Clerk "Core 3" retiró `<SignedIn>/<SignedOut>`:
  se usa el componente de servidor `Show` con `fallback`.
- **`ensureProfile`** (`src/lib/db/profiles.ts`): en el primer request autenticado hace upsert
  idempotente por `clerk_id` con la identidad de GitHub extraída de la cuenta externa de Clerk
  (github_id, username, avatar; fallbacks si faltan). Sin sesión no toca la base de datos —
  negativo de M-01: un OAuth cancelado no deja perfil a medias.
- El feed sigue público; ninguna ruta exige login todavía.

Verificado: 47/47 tests unitarios, 7/7 e2e, build y lint en verde. Camino feliz completo
validado manualmente por Pol (OAuth real con la instancia dev de Clerk): fila única en
`profiles` con username `polmarza`, display name, github_id y avatar; requests posteriores no
duplican.

## Qué se modificó

- Nuevo: `supabase/migrations/003_profiles.sql`, `src/lib/db/profiles.ts` (+ test),
  `src/proxy.ts`, `src/components/auth/auth-controls.tsx`, `e2e/auth.spec.ts`
- Actualizado: `src/app/layout.tsx` (ClerkProvider), `src/app/page.tsx` (cabecera con
  AuthControls + ensureProfile), `docs/data-model.md`, `docs/architecture.md`, `package.json`
  (`@clerk/nextjs`)

## Por qué

M-01 del PRD: la identidad del producto es la cuenta de GitHub, y todo lo social (importación
M-02, perfiles M-05, follows M-07, estrellas MEJORA-02) cuelga de tener sesión y perfil. Se
eligió creación lazy del perfil frente a webhooks de Clerk para no meter un túnel público en
el desarrollo local.
