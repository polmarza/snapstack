# Login con GitHub

**Estado:** Verificada
**Requisitos que cierra:** M-01
**Fecha de acuerdo:** 2026-08-29

## Qué se construye

El visitante puede iniciar sesión con su cuenta de GitHub vía Clerk. En el primer login se
crea su fila en `profiles` (migración 003) con su identidad de GitHub — username, nombre
visible, avatar y github_id — y en logins posteriores se recupera. La cabecera del feed
muestra "Entrar con GitHub" sin sesión y el menú de usuario de Clerk con ella. El feed y las
páginas públicas siguen siendo públicos: la sesión no es requisito para navegar.

Si el OAuth se cancela o falla, el visitante vuelve sin sesión y sin perfil a medias: el
perfil solo se crea cuando existe una sesión válida.

## Decisiones tomadas

- **Clerk con el provider de GitHub como único método de login.** Sin email/contraseña ni
  otros providers: la identidad del producto es la cuenta de GitHub (decisión de PRD).
- **El perfil se crea lazy en el primer request autenticado** (`ensureProfile`, upsert
  idempotente por `clerk_id`), no con webhooks de Clerk: los webhooks exigen URL pública
  (túnel) en desarrollo local y añaden una pieza de infraestructura que v1 no necesita. Si a
  futuro hace falta reaccionar a bajas/cambios desde Clerk, se reevalúa.
- **En desarrollo, la instancia dev de Clerk usa sus credenciales OAuth de GitHub
  compartidas**: no hay que crear una GitHub OAuth App para desarrollar. La GitHub App propia
  (M-02/M-08) es otra pieza y llega con la importación.
- **Migración 003: tabla `profiles`** según `docs/data-model.md` (con RLS: lectura pública,
  escritura solo del propio usuario/service role). La FK `repos.owner_profile_id` → profiles
  se añade aquí.
- Las claves de Clerk (`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`) viven en
  `.env.local`; las pega Pol desde el dashboard de Clerk.

## Cobertura

| Requisito | Se implementa en | Se valida con |
|-----------|------------------|---------------|
| M-01 | `src/lib/db/profiles.ts`, `src/components/auth/`, middleware de Clerk, migración `supabase/migrations/003_profiles.sql` | `src/lib/db/profiles.test.ts`, `e2e/auth.spec.ts` |

Los unitarios cubren `ensureProfile` con Clerk y db mockeados: creación en el primer login,
recuperación idempotente en los siguientes (mismo `clerk_id` → misma fila, sin duplicar),
mapeo de la identidad de GitHub desde el usuario de Clerk, y que sin sesión no se crea nada
(negativo de M-01). El e2e comprueba contra localhost que sin sesión aparece "Entrar con
GitHub" y que el feed sigue navegable; el flujo OAuth completo contra GitHub real no se
testea (servicio externo — se mockea, ver `docs/testing.md`), así que el camino feliz
completo se valida manualmente una vez y queda anotado en el PR.

## Fuera de esta feature

- Importación de repos del usuario (M-02) y su GitHub App.
- Página de perfil público (M-05): existe la fila en `profiles`, no la página.
- Follows (M-07), estrellas desde Snapstack (MEJORA-02).
- Borrado de cuenta (M-11): llegará con settings.
- Webhooks de Clerk (bajas o cambios de cuenta reflejados desde Clerk).
