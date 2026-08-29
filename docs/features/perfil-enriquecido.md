# Perfil enriquecido: tagline, bio y enlaces sociales

**Estado:** Verificada
**Requisitos que cierra:** C-03 (nuevo, añadido al PRD con esta feature)
**Fecha de acuerdo:** 2026-08-29 (acordada en conversación: puntos 3 y 4 del feedback de Pol)

## Qué se construye

El perfil deja de ser solo "GitHub + repos": cada usuario puede añadir en Settings un tagline
(una línea, ≤ 80), una bio breve (≤ 280) y enlaces a sus otras redes, todo opcional. En el
perfil público, el tagline va bajo el nombre, la bio bajo la cabecera, y los enlaces como fila
de iconos compacta junto al enlace de GitHub — con una lista blanca corta de plataformas no
hace falta modal ni "more info".

**Plataformas:** X, LinkedIn, YouTube, Reddit, Substack, Twitch, Bluesky, Mastodon y web
personal.

## Decisiones tomadas

- **Los enlaces se validan en servidor contra una lista blanca de hosts por plataforma**
  (Substack acepta subdominios; Mastodon, por federado, y la web personal aceptan cualquier
  host). Solo `https:`; sin esquema se antepone; cualquier otra cosa se rechaza con error por
  campo. Los valores acaban en `href` de la página pública: nada de `javascript:` ni datos
  crudos.
- **`social_links` es un jsonb** `{plataforma: url}` en `profiles`, no una tabla: cardinalidad
  fija y pequeña, sin consultas por enlace.
- **Tagline y bio pasan el filtro de moderación** existente (`findBlockedTerm`, S-01), igual
  que los repos al importar.
- **Iconos:** `simple-icons` (paths oficiales, CC0) + el de LinkedIn de bootstrap-icons (MIT,
  no está en simple-icons por su política de marca) + Globe de lucide para la web personal.
- **La sección vive en `/settings/account`** ("Settings" en la nav): la barra móvil ya tiene
  4 items y este contenido es de cuenta.
- El upsert de `ensureProfile` en cada login no toca estas columnas (solo escribe las suyas):
  el contenido del usuario no se pisa.

## Qué queda fuera

- Mostrar tagline/bio fuera del perfil (tarjetas, feed): decisión explícita de Pol, "solo
  visible en el profile de momento".
- Verificación de propiedad de los enlaces (rel=me, etc.).
- Plataformas fuera de la lista blanca.

## Cobertura

| Requisito | Se implementa en | Se valida con |
|-----------|------------------|---------------|
| C-03 | `supabase/migrations/009_*.sql`, `src/lib/profile/social-links.ts`, `src/app/settings/account/`, `src/app/u/[username]/page.tsx`, `src/components/profile/` | `src/lib/profile/social-links.test.ts`, `e2e/profile.spec.ts` |

Los unitarios cubren la validación completa de enlaces (lista blanca, https, subdominios,
esquemas maliciosos, longitudes) y la de tagline/bio (longitud y moderación). El e2e siembra
el perfil local por la vía de servicio y comprueba que el perfil público renderiza tagline,
bio y los iconos. El formulario de Settings exige sesión de Clerk: no verificable por
interfaz en e2e; su lógica de guardado se valida con los unitarios de la validación más la
comprobación manual con sesión (evidencia en el PR).
