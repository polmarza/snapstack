# Perfil público

**Estado:** Verificada
**Requisitos que cierra:** M-05
**Fecha de acuerdo:** 2026-08-29

## Qué se construye

La otra mitad del modelo perfil + feed: `/u/[username]` (el login de GitHub), pública e
indexable, server-rendered. Muestra la identidad del dev — avatar, nombre visible, username,
enlace a su GitHub — y las fichas de sus repos seleccionados en grid (2 columnas en desktop,
1 en móvil, según `docs/design-system.md`), reutilizando la `RepoCard` del feed. Un username
que no existe devuelve 404 de verdad (`notFound()`), y un perfil sin repos muestra un vacío
explícito, no una página rota.

Además, el pie de las tarjetas del feed se vuelve navegable: el avatar + username enlazan al
perfil **cuando el repo tiene dueño en Snapstack**. Los repos semilla del trending no enlazan
(su autor no se ha registrado; no hay perfil que abrir) — se quedan como texto.

Metadata para compartir: título y descripción propios, y `og:image` generada con el endpoint
de M-04 usando el username como semilla — cada perfil tiene su portada determinista.

## Decisiones tomadas

- **La URL es el login de GitHub** (`/u/polmarza`): ya es único, estable y es la identidad del
  producto. Sin slugs propios.
- **Los repos semilla no enlazan a perfiles**: `owner_login` sin `owner_profile_id` significa
  autor no registrado. Enlazar a un 404 sería peor que no enlazar.
- **Orden de los repos del perfil**: `imported_at` descendente, como el feed.
- **Sin follows todavía**: el botón de seguir es M-07; el perfil nace sin él.
- La página es pública y dinámica (fuerza `force-dynamic` como el feed; cache más fina cuando
  haya tráfico real).

## Cobertura

| Requisito | Se implementa en | Se valida con |
|-----------|------------------|---------------|
| M-05 | `src/app/u/[username]/`, `src/lib/db/profiles.ts`, pie de `RepoCard` | `src/lib/db/profiles.test.ts`, `e2e/profile.spec.ts` |

Unitarios (db mockeada): búsqueda de perfil por username (y su ausencia → null). E2e contra
localhost con datos reales de la base local — esta vez el flujo completo es automatizable
porque el perfil es público, sin sesión: `/u/polmarza` muestra identidad y fichas, un username
inexistente devuelve 404, y el pie de una tarjeta con dueño en el feed navega al perfil.

## Fuera de esta feature

- Follows y botón de seguir (M-07).
- Reclamación de repos semilla y perfiles para autores no registrados.
- Página de detalle del repo con README (MEJORA-03).
- Redirección automática del primer login al onboarding (pendiente de decidir, ver ficha de
  M-02).
